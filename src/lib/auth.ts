import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { isEmailAllowed } from "@/lib/auth-utils";
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
     * Validação restrita de domínio institucional e provisionamento JIT
     */
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) {
        return false;
      }

      // Restrição configurável via variável de ambiente ALLOWED_EMAIL_DOMAINS
      if (!isEmailAllowed(email)) {
        console.warn(`[NextAuth] Acesso negado para o e-mail não institucional: ${email}`);
        return false;
      }

      try {
        // Lógica JIT (Just-In-Time provisioning)
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        const isCoordinator =
          email === "evandro.coggo@unifesp.br" ||
          email.startsWith("evandro.") ||
          email === "vitor.antonio@unifesp.br" ||
          email === "vitor.silva@unifesp.br";

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
            },
          });
          console.log(`[NextAuth JIT] Novo usuário criado automaticamente como ${initialRole} (${initialStatus}): ${email}`);
        } else if (isCoordinator && (existingUser.role !== "PROFESSOR" || existingUser.status !== "ACTIVE")) {
          await prisma.user.update({
            where: { email },
            data: { role: "PROFESSOR", status: "ACTIVE" },
          });
        }

        return true;
      } catch (error) {
        console.error("[NextAuth JIT Error] Erro ao provisionar usuário:", error);
        return false;
      }
    },

    /**
     * Anexa o ID, Role e Status do Prisma ao token JWT com auto-sincronização resiliente
     */
    async jwt({ token }) {
      if (token.email) {
        let dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, status: true, name: true, image: true },
        });

        // Se o banco foi resetado ou o token possui ID órfão, auto-provisiona no banco
        if (!dbUser && isEmailAllowed(token.email)) {
          const isCoordinator =
            token.email === "evandro.coggo@unifesp.br" ||
            token.email === "vitor.antonio@unifesp.br" ||
            token.email === "vitor.silva@unifesp.br";

          dbUser = await prisma.user.create({
            data: {
              email: token.email,
              name: (token.name as string) || "Pesquisador UNIFESP",
              image: (token.picture as string) || null,
              role: isCoordinator ? "PROFESSOR" : "STUDENT",
              status: isCoordinator ? "ACTIVE" : "PENDING",
            },
            select: { id: true, role: true, status: true, name: true, image: true },
          });
        }

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role as UserRole;
          token.status = dbUser.status as UserStatus;
        }
      }
      return token;
    },

    /**
     * Propaga o ID, Role e Status do token JWT para o objeto session
     */
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as UserStatus;
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
