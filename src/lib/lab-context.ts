import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEmailAllowed } from "@/lib/auth-utils";
import type { UserRole, UserStatus } from "@/types";

export const ACTIVE_LAB_COOKIE = "labgest_active_lab";
export const DEFAULT_LAB_ID = "lab-ctpp";

export function isCoordinatorEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return (
    normalized === "evandro.coggo@unifesp.br" ||
    normalized.startsWith("evandro.") ||
    normalized === "vitor.antonio@unifesp.br" ||
    normalized === "vitor.silva@unifesp.br"
  );
}

/**
 * Garante que o laboratório inaugural (Lab CTPP) exista no banco de dados
 * e que registros legados estejam devidamente associados a ele.
 */
export async function ensureDefaultLaboratory() {
  try {
    let defaultLab = await prisma.laboratory.findUnique({
      where: { id: DEFAULT_LAB_ID },
    });

    if (!defaultLab) {
      const existingBySlug = await prisma.laboratory.findUnique({
        where: { slug: "lab-ctpp" },
      });

      if (existingBySlug) {
        defaultLab = existingBySlug;
      } else {
        const legacySettings = await prisma.platformSettings.findFirst();

        defaultLab = await prisma.laboratory.create({
          data: {
            id: DEFAULT_LAB_ID,
            name: legacySettings?.labName || "Lab CTPP",
            slug: "lab-ctpp",
            description:
              "Centro de Tecnologia e Políticas Públicas — Living Lab Universitário UNIFESP",
            institutionName: legacySettings?.institutionName || "UNIFESP",
            departmentName: legacySettings?.departmentName || "Living Lab Universitário",
            primaryColor: legacySettings?.primaryColor || "#0E4330",
            secondaryColor: legacySettings?.secondaryColor || "#24576C",
            accentColor: legacySettings?.accentColor || "#1F8A64",
            fontColorLight: legacySettings?.fontColorLight || "#111827",
            fontColorDark: legacySettings?.fontColorDark || "#F8FAFC",
            logoUrl: legacySettings?.logoUrl || null,
            faviconUrl: legacySettings?.faviconUrl || null,
            supportEmail: legacySettings?.supportEmail || "contato@labctpp.unifesp.br",
            isActive: true,
          },
        });
      }
    }

    return defaultLab;
  } catch (error) {
    console.warn("[ensureDefaultLaboratory Warning]:", error);
    return {
      id: DEFAULT_LAB_ID,
      name: "Lab CTPP",
      slug: "lab-ctpp",
      description: "Centro de Tecnologia e Políticas Públicas — UNIFESP",
      institutionName: "UNIFESP",
      departmentName: "Living Lab Universitário",
      primaryColor: "#0E4330",
      secondaryColor: "#24576C",
      accentColor: "#1F8A64",
      fontColorLight: "#111827",
      fontColorDark: "#F8FAFC",
      logoUrl: null,
      faviconUrl: null,
      supportEmail: "contato@labctpp.unifesp.br",
      isActive: true,
      responsibleId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Helper central de contexto Multi-Tenant:
 * Recupera o usuário autenticado, seus vínculos de laboratório (LabMembership),
 * resolve o laboratório ativo (via cookie labgest_active_lab ou primeiro laboratório ACTIVE)
 * e calcula as permissões hierárquicas dentro daquele laboratório (Professor Responsável / Líder / Integrante).
 */
export async function getActiveLabContext() {
  const defaultLab = await ensureDefaultLaboratory();
  const session = await getServerSession(authOptions);

  let cookieLabId: string | undefined;
  try {
    cookieLabId = cookies().get(ACTIVE_LAB_COOKIE)?.value;
  } catch {
    cookieLabId = undefined;
  }

  if (!session?.user) {
    return {
      user: null,
      activeLab: defaultLab,
      activeLabId: defaultLab.id,
      membership: null,
      roleInLab: "STUDENT" as UserRole,
      statusInLab: "PENDING" as UserStatus,
      canApproveInLab: false,
      canManageLab: false,
      approvedLabs: [],
      pendingLabs: [],
      allLaboratories: [defaultLab],
    };
  }

  // 1. Busca usuário com resiliência de sessão
  let user = session.user.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          labMemberships: {
            include: {
              laboratory: {
                include: {
                  responsible: { select: { id: true, name: true, email: true } },
                  _count: { select: { memberships: true, workspaces: true } },
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      })
    : null;

  if (!user && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      include: {
        labMemberships: {
          include: {
            laboratory: {
              include: {
                responsible: { select: { id: true, name: true, email: true } },
                _count: { select: { memberships: true, workspaces: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  if (!user && session.user.email && isEmailAllowed(session.user.email)) {
    const email = session.user.email.toLowerCase();
    const isCoord = isCoordinatorEmail(email);

    user = await prisma.user.create({
      data: {
        email,
        name: session.user.name || "Integrante UNIFESP",
        image: session.user.image,
        role: isCoord ? "PROFESSOR" : "STUDENT",
        status: isCoord ? "ACTIVE" : "PENDING",
        ...(isCoord && {
          labMemberships: {
            create: {
              labId: defaultLab.id,
              role: "PROFESSOR",
              status: "ACTIVE",
              approvedAt: new Date(),
            },
          },
        }),
      },
      include: {
        labMemberships: {
          include: {
            laboratory: {
              include: {
                responsible: { select: { id: true, name: true, email: true } },
                _count: { select: { memberships: true, workspaces: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  if (!user) {
    return {
      user: null,
      activeLab: defaultLab,
      activeLabId: defaultLab.id,
      membership: null,
      roleInLab: "STUDENT" as UserRole,
      statusInLab: "PENDING" as UserStatus,
      canApproveInLab: false,
      canManageLab: false,
      approvedLabs: [],
      pendingLabs: [],
      allLaboratories: [defaultLab],
    };
  }

  // 2. Retrocompatibilidade: se o usuário já existia antes do Multi-Tenant (status != PENDING ou PROFESSOR)
  // e ainda não possui nenhum LabMembership, cria automaticamente o vínculo no Lab CTPP
  if (user.labMemberships.length === 0 && (user.status !== "PENDING" || user.role === "PROFESSOR")) {
    await prisma.labMembership.upsert({
      where: {
        labId_userId: {
          labId: defaultLab.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        labId: defaultLab.id,
        userId: user.id,
        role: user.role,
        status: user.role === "PROFESSOR" ? "ACTIVE" : user.status,
        approvedById: user.approvedById,
        approvedAt: user.approvedAt || (user.status === "ACTIVE" ? new Date() : null),
      },
    });

    // Recarrega usuário com o vínculo recém-criado
    user = (await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        labMemberships: {
          include: {
            laboratory: {
              include: {
                responsible: { select: { id: true, name: true, email: true } },
                _count: { select: { memberships: true, workspaces: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }))!;
  }

  // 3. Busca todos os laboratórios ativos da plataforma
  const allLaboratories = await prisma.laboratory.findMany({
    where: { isActive: true },
    include: {
      responsible: { select: { id: true, name: true, email: true } },
      _count: {
        select: {
          memberships: { where: { status: "ACTIVE" } },
          workspaces: { where: { status: "APPROVED" } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const approvedMemberships = user.labMemberships.filter((m) => m.status === "ACTIVE");
  const pendingMemberships = user.labMemberships.filter((m) => m.status === "WAITING_APPROVAL");

  // 4. Resolve qual é o laboratório ativo na sessão atual
  let activeMembership =
    (cookieLabId && approvedMemberships.find((m) => m.labId === cookieLabId)) ||
    approvedMemberships[0] ||
    (cookieLabId && user.labMemberships.find((m) => m.labId === cookieLabId)) ||
    user.labMemberships[0] ||
    null;

  // Se o usuário é Coordenador Geral (PROFESSOR) e escolheu via cookie um laboratório onde ainda não tinha membership explícito
  let activeLab = activeMembership?.laboratory || defaultLab;
  if (cookieLabId && user.role === "PROFESSOR") {
    const targetLab = allLaboratories.find((l) => l.id === cookieLabId);
    if (targetLab) {
      activeLab = targetLab as any;
    }
  }

  const isLabResponsible = activeLab.responsibleId === user.id || user.role === "PROFESSOR";
  const roleInLab: UserRole = isLabResponsible
    ? "PROFESSOR"
    : (activeMembership?.role as UserRole) || user.role;

  const statusInLab: UserStatus = isLabResponsible
    ? "ACTIVE"
    : (activeMembership?.status as UserStatus) || user.status;

  // Regra Multi-Tenant solicitada:
  // O pedido de triagem chega e pode ser aprovado pelo Responsável do Laboratório (PROFESSOR) E pelos Líderes (LEADER) do laboratório!
  const canApproveInLab =
    statusInLab === "ACTIVE" && (roleInLab === "PROFESSOR" || roleInLab === "LEADER");

  const canManageLab = statusInLab === "ACTIVE" && roleInLab === "PROFESSOR";

  return {
    user,
    activeLab,
    activeLabId: activeLab.id,
    membership: activeMembership,
    roleInLab,
    statusInLab,
    canApproveInLab,
    canManageLab,
    approvedLabs: approvedMemberships.map((m) => ({
      ...m.laboratory,
      membershipRole: m.role,
      membershipStatus: m.status,
    })),
    pendingLabs: pendingMemberships.map((m) => ({
      ...m.laboratory,
      membershipRole: m.role,
      membershipStatus: m.status,
    })),
    allLaboratories: allLaboratories.map((lab) => {
      const m = user.labMemberships.find((um) => um.labId === lab.id);
      return {
        ...lab,
        membershipRole: m?.role || (user.role === "PROFESSOR" ? "PROFESSOR" : null),
        membershipStatus: m?.status || (user.role === "PROFESSOR" ? "ACTIVE" : null),
      };
    }),
  };
}

