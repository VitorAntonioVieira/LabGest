import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { isEmailAllowed } from "@/lib/auth-utils";
import { DEFAULT_LAB_ID, ensureDefaultLaboratory, isCoordinatorEmail } from "@/lib/lab-context";
import type { UserRole, UserStatus } from "@/types";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /**
     * Validação restrita de domínio institucional e provisionamento JIT Multi-Tenant
     */
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) {
        return false;
      }

      if (!isEmailAllowed(email)) {
        console.warn(`[NextAuth] Acesso negado para o e-mail não institucional: ${email}`);
        return false;
      }

      try {
        await ensureDefaultLaboratory();

        const existingUser = await prisma.user.findUnique({
          where: { email },
          include: { labMemberships: true },
        });

        const isCoordinator = isCoordinatorEmail(email);
        const initialRole: UserRole = isCoordinator ? "PROFESSOR" : "STUDENT";
        const initialStatus: UserStatus = isCoordinator ? "ACTIVE" : "PENDING";

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email,
              name: user.name || "Pesquisador UNIFESP",
              image: user.image,
              role: initialRole,
              status: initialStatus,
              ...(isCoordinator && {
                labMemberships: {
                  create: {
                    labId: DEFAULT_LAB_ID,
                    role: "PROFESSOR",
                    status: "ACTIVE",
                    approvedAt: new Date(),
                  },
                },
              }),
            },
          });
          console.log(
            `[NextAuth JIT] Novo usuário criado automaticamente como ${initialRole} (${initialStatus}): ${email}`
          );
        } else if (isCoordinator) {
          if (existingUser.role !== "PROFESSOR" || existingUser.status !== "ACTIVE") {
            await prisma.user.update({
              where: { email },
              data: { role: "PROFESSOR", status: "ACTIVE" },
            });
          }
          await prisma.labMembership.upsert({
            where: {
              labId_userId: {
                labId: DEFAULT_LAB_ID,
                userId: existingUser.id,
              },
            },
            update: { role: "PROFESSOR", status: "ACTIVE" },
            create: {
              labId: DEFAULT_LAB_ID,
              userId: existingUser.id,
              role: "PROFESSOR",
              status: "ACTIVE",
              approvedAt: new Date(),
            },
          });
        } else if (
          existingUser.labMemberships.length === 0 &&
          existingUser.status !== "PENDING"
        ) {
          // Retrocompatibilidade para usuários que já existiam antes do Multi-Tenant
          await prisma.labMembership.create({
            data: {
              labId: DEFAULT_LAB_ID,
              userId: existingUser.id,
              role: existingUser.role,
              status: existingUser.status,
              approvedById: existingUser.approvedById,
              approvedAt: existingUser.approvedAt,
            },
          });
        }

        return true;
      } catch (error) {
        console.error("[NextAuth JIT Error] Erro ao provisionar usuário:", error);
        return false;
      }
    },

    /**
     * Anexa o ID, Role, Status e vínculos Multi-Tenant do Prisma ao token JWT
     */
    async jwt({ token }) {
      if (token.email) {
        let dbUser = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase() },
          include: {
            labMemberships: {
              select: { labId: true, role: true, status: true },
            },
          },
        });

        // Se o banco foi resetado ou o token possui ID órfão, auto-provisiona no banco
        if (!dbUser && isEmailAllowed(token.email)) {
          await ensureDefaultLaboratory();
          const isCoordinator = isCoordinatorEmail(token.email);

          dbUser = await prisma.user.create({
            data: {
              email: token.email.toLowerCase(),
              name: (token.name as string) || "Pesquisador UNIFESP",
              image: (token.picture as string) || null,
              role: isCoordinator ? "PROFESSOR" : "STUDENT",
              status: isCoordinator ? "ACTIVE" : "PENDING",
              ...(isCoordinator && {
                labMemberships: {
                  create: {
                    labId: DEFAULT_LAB_ID,
                    role: "PROFESSOR",
                    status: "ACTIVE",
                    approvedAt: new Date(),
                  },
                },
              }),
            },
            include: {
              labMemberships: {
                select: { labId: true, role: true, status: true },
              },
            },
          });
        }

        if (dbUser) {
          const activeMemberships = dbUser.labMemberships.filter((m) => m.status === "ACTIVE");
          const waitingMemberships = dbUser.labMemberships.filter(
            (m) => m.status === "WAITING_APPROVAL"
          );

          const hasActiveLab = activeMemberships.length > 0 || dbUser.role === "PROFESSOR";
          const hasWaitingLab = waitingMemberships.length > 0;

          // Determina o maior papel que o usuário exerce nos laboratórios ativos
          let effectiveRole: UserRole = dbUser.role as UserRole;
          if (activeMemberships.some((m) => m.role === "PROFESSOR")) {
            effectiveRole = "PROFESSOR";
          } else if (
            effectiveRole !== "PROFESSOR" &&
            activeMemberships.some((m) => m.role === "LEADER")
          ) {
            effectiveRole = "LEADER";
          }

          // Determina status efetivo considerando seus vínculos com laboratórios
          let effectiveStatus: UserStatus = dbUser.status as UserStatus;
          if (hasActiveLab) {
            effectiveStatus = "ACTIVE";
          } else if (hasWaitingLab) {
            effectiveStatus = "WAITING_APPROVAL";
          }

          token.id = dbUser.id;
          token.role = effectiveRole;
          token.status = effectiveStatus;
          token.hasActiveLab = hasActiveLab;
          token.hasWaitingLab = hasWaitingLab;
          token.approvedLabCount = activeMemberships.length;
        }
      }
      return token;
    },

    /**
     * Propaga o ID, Role, Status e metadados Multi-Tenant para o objeto session
     */
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as UserStatus;
        session.user.hasActiveLab = token.hasActiveLab;
        session.user.hasWaitingLab = token.hasWaitingLab;
        session.user.approvedLabCount = token.approvedLabCount;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
