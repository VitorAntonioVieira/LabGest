"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  ACTIVE_LAB_COOKIE,
  DEFAULT_LAB_ID,
  getActiveLabContext,
} from "@/lib/lab-context";
import type { UserRole, UserStatus } from "@/types";

/**
 * Helper central de autenticação e resiliência de sessão
 * Garante que o usuário retornado EXISTE no PostgreSQL, auto-recuperando
 * sessões legadas (cookies de bancos anteriores) e auto-provisionando usuários institucionais.
 */
export async function getAuthenticatedUser() {
  const { user } = await getActiveLabContext();
  return user;
}

// ==========================================
// AÇÕES MULTI-TENANT DE LABORATÓRIOS (/labs)
// ==========================================

/**
 * Seleciona o laboratório ativo na sessão atual (via Cookie HttpOnly/Lax)
 * permitindo trocar de laboratório em um único endpoint com White-label dinâmico.
 */
export async function selectActiveLaboratory(labId: string) {
  const { user } = await getActiveLabContext();
  if (!user) {
    throw new Error("Não autenticado. Por favor, faça login.");
  }

  const lab = await prisma.laboratory.findUnique({
    where: { id: labId },
  });

  if (!lab || !lab.isActive) {
    throw new Error("Laboratório não encontrado ou inativo.");
  }

  const membership = await prisma.labMembership.findUnique({
    where: {
      labId_userId: {
        labId,
        userId: user.id,
      },
    },
  });

  // Se o usuário é Coordenador Geral (PROFESSOR) e ainda não tinha registro explícito no lab, cria como ACTIVE
  if (!membership && user.role === "PROFESSOR") {
    await prisma.labMembership.create({
      data: {
        labId,
        userId: user.id,
        role: "PROFESSOR",
        status: "ACTIVE",
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });
  } else if (!membership || membership.status !== "ACTIVE") {
    throw new Error("Você ainda não possui acesso homologado para este laboratório.");
  }

  cookies().set(ACTIVE_LAB_COOKIE, labId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  revalidatePath("/labs");
  return { success: true, labId };
}

/**
 * Solicita triagem para ingressar em um laboratório específico.
 * O pedido fica em WAITING_APPROVAL para o Responsável do Lab (PROFESSOR) e Líderes (LEADER) aprovarem.
 */
export async function requestLabTriage(labId: string) {
  const { user } = await getActiveLabContext();
  if (!user) {
    throw new Error("Não autenticado. Por favor, faça login.");
  }

  const lab = await prisma.laboratory.findUnique({
    where: { id: labId },
  });

  if (!lab || !lab.isActive) {
    throw new Error("Laboratório selecionado não está disponível.");
  }

  const existing = await prisma.labMembership.findUnique({
    where: {
      labId_userId: {
        labId,
        userId: user.id,
      },
    },
  });

  if (existing && existing.status === "ACTIVE") {
    return { success: true, membership: existing, alreadyActive: true };
  }

  const isProfessor = user.role === "PROFESSOR";

  const membership = await prisma.labMembership.upsert({
    where: {
      labId_userId: {
        labId,
        userId: user.id,
      },
    },
    update: {
      status: isProfessor ? "ACTIVE" : "WAITING_APPROVAL",
      role: isProfessor ? "PROFESSOR" : existing?.role || "STUDENT",
    },
    create: {
      labId,
      userId: user.id,
      role: isProfessor ? "PROFESSOR" : "STUDENT",
      status: isProfessor ? "ACTIVE" : "WAITING_APPROVAL",
      approvedAt: isProfessor ? new Date() : null,
    },
  });

  // Se o usuário ainda estava PENDING ou REJECTED globalmente, atualiza para WAITING_APPROVAL (ou ACTIVE)
  if (user.status === "PENDING" || user.status === "REJECTED") {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: isProfessor ? "ACTIVE" : "WAITING_APPROVAL",
      },
    });
  }

  revalidatePath("/labs");
  revalidatePath("/waiting-room");
  revalidatePath("/admin/approvals");
  revalidatePath("/");
  return { success: true, membership };
}

export interface CreateLaboratoryInput {
  name: string;
  departmentName?: string;
  institutionName?: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  supportEmail?: string;
  logoUrl?: string;
}

/**
 * Cria um novo Laboratório (Tenant) na plataforma com identidade White-label própria
 * e define o usuário criador como Responsável pelo Laboratório.
 */
export async function createLaboratory(data: CreateLaboratoryInput) {
  const { user } = await getActiveLabContext();
  if (!user) {
    throw new Error("Não autenticado. Por favor, faça login.");
  }

  if (user.role !== "PROFESSOR") {
    throw new Error("Apenas Professores / Coordenadores podem cadastrar um novo laboratório na plataforma.");
  }

  if (!data.name || data.name.trim() === "") {
    throw new Error("O nome do laboratório é obrigatório.");
  }

  const baseSlug = data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const existingSlug = await prisma.laboratory.findUnique({
    where: { slug: baseSlug },
  });

  const slug = existingSlug
    ? `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`
    : baseSlug;

  const primaryColor = data.primaryColor || "#0E4330";
  const secondaryColor = data.secondaryColor || "#24576C";
  const accentColor = data.accentColor || "#1F8A64";
  const institutionName = data.institutionName?.trim() || "UNIFESP";
  const departmentName = data.departmentName?.trim() || "Laboratório de Pesquisa";
  const supportEmail = data.supportEmail?.trim() || user.email || "contato@unifesp.br";

  try {
    const newLab = await prisma.laboratory.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        institutionName,
        departmentName,
        primaryColor,
        secondaryColor,
        accentColor,
        logoUrl: data.logoUrl?.trim() || null,
        supportEmail,
        responsibleId: user.id,
        isActive: true,
        platformSettings: {
          create: {
            labName: data.name.trim(),
            institutionName,
            departmentName,
            primaryColor,
            secondaryColor,
            accentColor,
            logoUrl: data.logoUrl?.trim() || null,
            supportEmail,
          },
        },
        memberships: {
          create: {
            userId: user.id,
            role: "PROFESSOR",
            status: "ACTIVE",
            approvedById: user.id,
            approvedAt: new Date(),
          },
        },
      },
    });

    // Cria um workspace inicial padrão para o novo laboratório
    const initialWs = await prisma.workspace.create({
      data: {
        labId: newLab.id,
        name: `Pesquisa Geral • ${newLab.name}`,
        slug: `pesquisa-geral-${slug}`,
        department: departmentName,
        description: `Espaço principal de gestão de atividades e projetos do ${newLab.name}.`,
        status: "APPROVED",
        requestedById: user.id,
        approvedById: user.id,
        approvedAt: new Date(),
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    await prisma.kanbanColumn.createMany({
      data: [
        { labId: newLab.id, workspaceId: initialWs.id, title: "A Fazer", order: 0 },
        { labId: newLab.id, workspaceId: initialWs.id, title: "Em Andamento", order: 1 },
        { labId: newLab.id, workspaceId: initialWs.id, title: "Revisão", order: 2 },
        { labId: newLab.id, workspaceId: initialWs.id, title: "Concluído", order: 3 },
      ],
    });

    // Ativa automaticamente o laboratório recém-criado
    cookies().set(ACTIVE_LAB_COOKIE, newLab.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    revalidatePath("/", "layout");
    revalidatePath("/labs");
    return { success: true, laboratory: newLab };
  } catch (error) {
    console.error("[createLaboratory Error]:", error);
    throw new Error("Erro ao criar novo laboratório.");
  }
}

export interface TimeEntryInput {
  taskTitle?: string;
  taskId?: string;
  workspaceId?: string;
  date: string;
  durationMinutes: number;
  summary: string;
}

/**
 * Server Action: Aprovar Workspace (Permitido ao Responsável do Lab PROFESSOR e Líderes LEADER)
 */
export async function approveWorkspace(workspaceId: string) {
  const { user, activeLabId, canApproveInLab } = await getActiveLabContext();

  if (!user) {
    throw new Error("Não autenticado. Por favor, faça login.");
  }

  if (!canApproveInLab) {
    throw new Error("Acesso negado: apenas o Responsável do Laboratório e os Líderes podem aprovar espaços de trabalho.");
  }

  try {
    const updated = await prisma.workspace.update({
      where: { id: workspaceId, labId: activeLabId },
      data: {
        status: "APPROVED",
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });

    revalidatePath("/");
    revalidatePath("/workspaces");
    revalidatePath("/admin/approvals");
    return { success: true, workspace: updated };
  } catch (error) {
    console.error("[approveWorkspace Error]:", error);
    throw new Error("Falha ao aprovar o espaço de trabalho.");
  }
}

/**
 * Server Action: Recusar Workspace com justificativa (Permitido ao Responsável do Lab PROFESSOR e Líderes LEADER)
 */
export async function rejectWorkspace(workspaceId: string, rejectionNotes?: string) {
  const { user, activeLabId, canApproveInLab } = await getActiveLabContext();

  if (!user) {
    throw new Error("Não autenticado. Por favor, faça login.");
  }

  if (!canApproveInLab) {
    throw new Error("Acesso negado: apenas o Responsável do Laboratório e os Líderes podem avaliar espaços de trabalho.");
  }

  try {
    const updated = await prisma.workspace.update({
      where: { id: workspaceId, labId: activeLabId },
      data: {
        status: "REJECTED",
        rejectionNotes: rejectionNotes || "Solicitação não atende aos requisitos do laboratório.",
        approvedById: user.id,
      },
    });

    revalidatePath("/");
    revalidatePath("/workspaces");
    revalidatePath("/admin/approvals");
    return { success: true, workspace: updated };
  } catch (error) {
    console.error("[rejectWorkspace Error]:", error);
    throw new Error("Falha ao recusar o espaço de trabalho.");
  }
}

/**
 * Server Action: Criar Apontamento de Horas (Time Entry) no Laboratório Ativo
 */
export async function createTimeEntry(data: TimeEntryInput) {
  const { user, activeLab, activeLabId } = await getActiveLabContext();

  if (!user) {
    throw new Error("Usuário não autenticado. Por favor, faça login.");
  }

  if (!data.summary || data.summary.trim() === "") {
    throw new Error("O resumo das atividades é obrigatório.");
  }

  if (!data.durationMinutes || data.durationMinutes <= 0) {
    throw new Error("Duração inválida.");
  }

  try {
    let resolvedTaskId = data.taskId;
    let resolvedWorkspaceId = data.workspaceId;
    let resolvedLabId = activeLabId;

    // Se o usuário selecionou uma tarefa existente, busca o workspace e labId vinculados
    if (resolvedTaskId) {
      const existingTask = await prisma.task.findUnique({
        where: { id: resolvedTaskId },
        select: { workspaceId: true, labId: true },
      });
      if (existingTask) {
        resolvedWorkspaceId = existingTask.workspaceId;
        resolvedLabId = existingTask.labId;
      }
    }

    // Se não há tarefa ou workspace explícito, vincula a um workspace ativo do laboratório atual
    if (!resolvedTaskId || !resolvedWorkspaceId) {
      let targetWorkspace = await prisma.workspace.findFirst({
        where: { labId: activeLabId, status: "APPROVED" },
        include: { columns: { take: 1, orderBy: { order: "asc" } } },
      });

      // Se não houver nenhum workspace ainda no laboratório ativo, cria um padrão
      if (!targetWorkspace) {
        targetWorkspace = await prisma.workspace.create({
          data: {
            labId: activeLabId,
            name: `Pesquisa Geral ${activeLab.name}`,
            slug: `pesquisa-geral-${activeLab.slug}-${Date.now().toString(36)}`,
            department: activeLab.departmentName,
            status: "APPROVED",
            requestedById: user.id,
            columns: {
              create: [
                { labId: activeLabId, title: "A Fazer", order: 0 },
                { labId: activeLabId, title: "Em Andamento", order: 1 },
                { labId: activeLabId, title: "Concluído", order: 2 },
              ],
            },
          },
          include: { columns: true },
        });
      }

      resolvedWorkspaceId = targetWorkspace.id;

      // Cria a tarefa correspondente ao título informado
      const defaultColumn = targetWorkspace.columns[0];
      const newTask = await prisma.task.create({
        data: {
          labId: activeLabId,
          title: data.taskTitle?.trim() || "Atividade de Pesquisa",
          workspaceId: targetWorkspace.id,
          columnId: defaultColumn.id,
          createdById: user.id,
          allowSelfAssign: true,
          assignees: {
            create: {
              userId: user.id,
            },
          },
        },
      });
      resolvedTaskId = newTask.id;
    }

    // Cria o registro de horas vinculado ao laboratório
    const newEntry = await prisma.timeEntry.create({
      data: {
        labId: resolvedLabId,
        userId: user.id,
        taskId: resolvedTaskId,
        workspaceId: resolvedWorkspaceId,
        date: new Date(data.date || new Date()),
        durationMinutes: Math.round(Number(data.durationMinutes)),
        summary: data.summary.trim(),
        status: "APPROVED",
      },
    });

    revalidatePath("/");
    revalidatePath("/time-tracking");
    return { success: true, entry: newEntry };
  } catch (error) {
    console.error("[createTimeEntry Error]:", error);
    throw new Error("Erro ao registrar apontamento de horas.");
  }
}

export interface OnboardingInput {
  academicId: string;
  phone: string;
  course?: string;
  labIds?: string[];
  labId?: string;
}

/**
 * Server Action: Concluir Cadastro Inicial (Onboarding do Aluno/Pesquisador)
 * Salva dados acadêmicos e cria o pedido de triagem (LabMembership WAITING_APPROVAL)
 * para o(s) laboratório(s) escolhido(s) pelo usuário.
 */
export async function completeOnboarding(data: OnboardingInput) {
  const { user } = await getActiveLabContext();

  if (!user) {
    throw new Error("Não autenticado. Por favor, faça login.");
  }

  if (!data.academicId || data.academicId.trim() === "") {
    throw new Error("O Registro Acadêmico (RA) é obrigatório.");
  }

  if (!data.phone || data.phone.trim() === "") {
    throw new Error("O número de WhatsApp / Telefone é obrigatório.");
  }

  const targetLabIds =
    data.labIds && data.labIds.length > 0
      ? data.labIds
      : data.labId
      ? [data.labId]
      : [DEFAULT_LAB_ID];

  try {
    const isProfessor = user.role === "PROFESSOR";
    const nextStatus: UserStatus = isProfessor ? "ACTIVE" : "WAITING_APPROVAL";

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        academicId: data.academicId.trim(),
        phone: data.phone.trim(),
        course: data.course?.trim() || null,
        status: nextStatus,
      },
    });

    // Cria a solicitação de triagem para cada laboratório escolhido pelo usuário
    for (const labId of targetLabIds) {
      await prisma.labMembership.upsert({
        where: {
          labId_userId: {
            labId,
            userId: user.id,
          },
        },
        update: {
          status: nextStatus,
        },
        create: {
          labId,
          userId: user.id,
          role: isProfessor ? "PROFESSOR" : "STUDENT",
          status: nextStatus,
          approvedAt: isProfessor ? new Date() : null,
        },
      });
    }

    // Define o primeiro laboratório selecionado como contexto inicial
    if (targetLabIds[0]) {
      cookies().set(ACTIVE_LAB_COOKIE, targetLabIds[0], {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    }

    revalidatePath("/");
    revalidatePath("/labs");
    revalidatePath("/onboarding");
    revalidatePath("/waiting-room");
    revalidatePath("/admin/approvals");
    return { success: true, user: updated };
  } catch (error) {
    console.error("[completeOnboarding Error]:", error);
    throw new Error("Falha ao salvar dados de integração e enviar triagem ao laboratório.");
  }
}

export interface TriageInput {
  userId: string;
  role: "STUDENT" | "LEADER";
  workspaceIds: string[];
  labId?: string;
}

/**
 * Server Action: Triagem e Aprovação de Usuário no Laboratório
 * Pode ser realizada pelo Responsável do Laboratório (PROFESSOR) E pelos Líderes (LEADER) do laboratório!
 */
export async function triageAndApproveUser(data: TriageInput) {
  const { user, activeLabId, canApproveInLab } = await getActiveLabContext();

  if (!user) {
    throw new Error("Não autenticado. Por favor, faça login.");
  }

  if (!canApproveInLab) {
    throw new Error(
      "Acesso negado: apenas o Responsável do Laboratório e os Líderes podem aprovar pedidos de triagem."
    );
  }

  const targetLabId = data.labId || activeLabId;

  try {
    // 1. Homologa o vínculo do usuário naquele laboratório específico (LabMembership)
    await prisma.labMembership.upsert({
      where: {
        labId_userId: {
          labId: targetLabId,
          userId: data.userId,
        },
      },
      update: {
        role: data.role,
        status: "ACTIVE",
        approvedById: user.id,
        approvedAt: new Date(),
      },
      create: {
        labId: targetLabId,
        userId: data.userId,
        role: data.role,
        status: "ACTIVE",
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });

    // 2. Atualiza também o status global do User para ACTIVE (permitindo login na plataforma)
    const targetUser = await prisma.user.findUnique({ where: { id: data.userId } });
    const updatedGlobalRole: UserRole =
      targetUser?.role === "PROFESSOR"
        ? "PROFESSOR"
        : data.role === "LEADER"
        ? "LEADER"
        : targetUser?.role || "STUDENT";

    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: {
        role: updatedGlobalRole,
        status: "ACTIVE",
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });

    // 3. Vincula o usuário aos braços de pesquisa (Workspaces) selecionados daquele laboratório
    if (data.workspaceIds && data.workspaceIds.length > 0) {
      for (const wsId of data.workspaceIds) {
        await prisma.workspaceMember.upsert({
          where: {
            workspaceId_userId: {
              workspaceId: wsId,
              userId: data.userId,
            },
          },
          create: {
            workspaceId: wsId,
            userId: data.userId,
            role: data.role === "LEADER" ? "LEADER" : "MEMBER",
          },
          update: {
            role: data.role === "LEADER" ? "LEADER" : "MEMBER",
          },
        });
      }
    }

    revalidatePath("/");
    revalidatePath("/labs");
    revalidatePath("/workspaces");
    revalidatePath("/members");
    revalidatePath("/admin/approvals");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("[triageAndApproveUser Error]:", error);
    throw new Error("Erro ao realizar a triagem do membro no laboratório.");
  }
}

/**
 * Server Action: Recusar solicitação de ingresso do membro no laboratório ativo
 * Permitido ao Responsável do Lab (PROFESSOR) e aos Líderes (LEADER) do laboratório.
 */
export async function rejectPendingUser(userId: string, labId?: string) {
  const { user, activeLabId, canApproveInLab } = await getActiveLabContext();

  if (!user) {
    throw new Error("Não autenticado. Por favor, faça login.");
  }

  if (!canApproveInLab) {
    throw new Error("Acesso negado: apenas o Responsável e os Líderes do laboratório podem recusar solicitações.");
  }

  const targetLabId = labId || activeLabId;

  try {
    await prisma.labMembership.upsert({
      where: {
        labId_userId: {
          labId: targetLabId,
          userId,
        },
      },
      update: {
        status: "REJECTED",
        approvedById: user.id,
        approvedAt: new Date(),
      },
      create: {
        labId: targetLabId,
        userId,
        status: "REJECTED",
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });

    // Verifica se o usuário possui algum outro laboratório ACTIVE ou WAITING_APPROVAL
    const remainingMemberships = await prisma.labMembership.findMany({
      where: { userId },
    });

    const hasOtherActive = remainingMemberships.some((m) => m.status === "ACTIVE");
    const hasOtherWaiting = remainingMemberships.some((m) => m.status === "WAITING_APPROVAL");

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status: hasOtherActive
          ? "ACTIVE"
          : hasOtherWaiting
          ? "WAITING_APPROVAL"
          : "REJECTED",
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });

    revalidatePath("/");
    revalidatePath("/labs");
    revalidatePath("/admin/approvals");
    return { success: true, user: updated };
  } catch (error) {
    console.error("[rejectPendingUser Error]:", error);
    throw new Error("Erro ao recusar usuário no laboratório.");
  }
}

export interface RequestWorkspaceInput {
  name: string;
  department?: string;
  description?: string;
}

/**
 * Server Action: Solicitar Abertura de Novo Braço de Pesquisa (Workspace) no Laboratório Ativo
 */
export async function requestWorkspace(data: RequestWorkspaceInput) {
  const { user, activeLab, activeLabId, canApproveInLab } = await getActiveLabContext();

  if (!user) {
    throw new Error("Não autenticado. Por favor, faça login.");
  }

  if (!data.name || data.name.trim() === "") {
    throw new Error("O nome do espaço de trabalho é obrigatório.");
  }

  const baseSlug = data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const slug = `${baseSlug}-${randomSuffix}`;

  try {
    const initialStatus = canApproveInLab ? "APPROVED" : "PENDING";

    const workspace = await prisma.workspace.create({
      data: {
        labId: activeLabId,
        name: data.name.trim(),
        slug: slug,
        department: data.department?.trim() || activeLab.departmentName,
        description: data.description?.trim() || null,
        status: initialStatus,
        requestedById: user.id,
        approvedById: canApproveInLab ? user.id : null,
        approvedAt: canApproveInLab ? new Date() : null,
        columns: {
          create: [
            { labId: activeLabId, title: "A Fazer", order: 0 },
            { labId: activeLabId, title: "Em Andamento", order: 1 },
            { labId: activeLabId, title: "Revisão", order: 2 },
            { labId: activeLabId, title: "Concluído", order: 3 },
          ],
        },
        members: {
          create: [
            {
              userId: user.id,
              role: canApproveInLab ? "OWNER" : "MEMBER",
            },
          ],
        },
      },
    });

    revalidatePath("/");
    revalidatePath("/workspaces");
    revalidatePath("/admin/approvals");
    return { success: true, workspace };
  } catch (error) {
    console.error("[requestWorkspace Error]:", error);
    throw new Error("Erro ao solicitar criação do espaço de trabalho.");
  }
}

export interface CreateTaskInput {
  workspaceId: string;
  columnId?: string;
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  allowSelfAssign?: boolean;
  assigneeUserIds?: string[];
}

/**
 * Server Action: Criar Nova Atividade no Quadro Kanban (vinculada ao labId do Workspace)
 */
export async function createTask(data: CreateTaskInput) {
  const { user, activeLabId } = await getActiveLabContext();

  if (!user) {
    throw new Error("Não autenticado. Por favor, faça login.");
  }

  if (!data.title || data.title.trim() === "") {
    throw new Error("O título da atividade é obrigatório.");
  }

  try {
    const ws = await prisma.workspace.findUnique({
      where: { id: data.workspaceId },
      select: { labId: true },
    });
    const resolvedLabId = ws?.labId || activeLabId;

    let targetColumnId = data.columnId;
    if (!targetColumnId) {
      const firstCol = await prisma.kanbanColumn.findFirst({
        where: { workspaceId: data.workspaceId },
        orderBy: { order: "asc" },
      });
      if (!firstCol) {
        throw new Error("Nenhuma coluna encontrada neste espaço de trabalho.");
      }
      targetColumnId = firstCol.id;
    }

    const taskCount = await prisma.task.count({
      where: { columnId: targetColumnId },
    });

    const task = await prisma.task.create({
      data: {
        labId: resolvedLabId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        priority: data.priority || "MEDIUM",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        allowSelfAssign: data.allowSelfAssign ?? true,
        workspaceId: data.workspaceId,
        columnId: targetColumnId,
        createdById: user.id,
        order: taskCount,
        assignees: {
          create:
            data.assigneeUserIds && data.assigneeUserIds.length > 0
              ? data.assigneeUserIds.map((userId) => ({ userId }))
              : [{ userId: user.id }],
        },
      },
    });

    revalidatePath(`/workspace/${data.workspaceId}/kanban`);
    revalidatePath("/");
    return { success: true, task };
  } catch (error) {
    console.error("[createTask Error]:", error);
    throw new Error("Erro ao criar nova atividade.");
  }
}

export interface CreateDocumentInput {
  title: string;
  workspaceId?: string;
  icon?: string;
  type?: "WORKSPACE" | "PERSONAL";
}

/**
 * Server Action: Criar Nova Página de Documentação / Notas no Laboratório Ativo
 */
export async function createDocument(data: CreateDocumentInput) {
  const { user, activeLabId } = await getActiveLabContext();

  if (!user) {
    throw new Error("Não autenticado. Por favor, faça login.");
  }

  if (!data.title || data.title.trim() === "") {
    throw new Error("O título da página é obrigatório.");
  }

  try {
    let resolvedLabId = activeLabId;
    if (data.workspaceId) {
      const ws = await prisma.workspace.findUnique({
        where: { id: data.workspaceId },
        select: { labId: true },
      });
      if (ws) resolvedLabId = ws.labId;
    }

    const doc = await prisma.document.create({
      data: {
        labId: resolvedLabId,
        title: data.title.trim(),
        icon: data.icon || "📄",
        type: data.workspaceId ? "WORKSPACE" : data.type || "PERSONAL",
        workspaceId: data.workspaceId || null,
        ownerId: user.id,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: `Criado por ${user.name || "Integrante"} em ${new Date().toLocaleDateString("pt-BR")}.`,
                styles: {},
              },
            ],
          },
        ],
      },
    });

    revalidatePath("/docs");
    if (data.workspaceId) {
      revalidatePath(`/workspace/${data.workspaceId}/docs`);
    }
    return { success: true, document: doc };
  } catch (error) {
    console.error("[createDocument Error]:", error);
    throw new Error("Erro ao criar documento.");
  }
}

export interface PlatformSettingsInput {
  labName: string;
  institutionName?: string;
  departmentName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontColorLight?: string;
  fontColorDark?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  supportEmail?: string;
}

/**
 * Server Action: Atualizar Configurações White-label do Laboratório Ativo (Restrito ao Responsável PROFESSOR)
 */
export async function updatePlatformSettings(data: PlatformSettingsInput) {
  const { user, activeLabId, canManageLab } = await getActiveLabContext();

  if (!user) {
    throw new Error("Não autenticado. Por favor, faça login.");
  }

  if (!canManageLab) {
    throw new Error("Apenas o Professor Responsável pelo laboratório pode alterar as configurações White-label.");
  }

  try {
    const updatePayload: any = {
      labName: data.labName.trim(),
      institutionName: data.institutionName?.trim(),
      departmentName: data.departmentName?.trim(),
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      accentColor: data.accentColor,
      logoUrl: data.logoUrl !== undefined ? data.logoUrl?.trim() || null : undefined,
      faviconUrl: data.faviconUrl !== undefined ? data.faviconUrl?.trim() || null : undefined,
      supportEmail: data.supportEmail?.trim(),
    };

    if (data.fontColorLight !== undefined) updatePayload.fontColorLight = data.fontColorLight;
    if (data.fontColorDark !== undefined) updatePayload.fontColorDark = data.fontColorDark;

    const createPayload: any = {
      labId: activeLabId,
      labName: data.labName.trim(),
      institutionName: data.institutionName?.trim() || "UNIFESP",
      departmentName: data.departmentName?.trim() || "Living Lab",
      primaryColor: data.primaryColor || "#0E4330",
      secondaryColor: data.secondaryColor || "#24576C",
      accentColor: data.accentColor || "#1F8A64",
      fontColorLight: data.fontColorLight || "#111827",
      fontColorDark: data.fontColorDark || "#F8FAFC",
      logoUrl: data.logoUrl?.trim() || null,
      faviconUrl: data.faviconUrl?.trim() || null,
      supportEmail: data.supportEmail?.trim() || "labtecpp@unifesp.br",
    };

    // 1. Atualiza PlatformSettings do laboratório ativo
    const updated = await prisma.platformSettings.upsert({
      where: { labId: activeLabId },
      create: createPayload,
      update: updatePayload,
    });

    // 2. Sincroniza também os metadados diretamente na entidade Laboratory
    await prisma.laboratory.update({
      where: { id: activeLabId },
      data: {
        name: data.labName.trim(),
        institutionName: data.institutionName?.trim() || undefined,
        departmentName: data.departmentName?.trim() || undefined,
        primaryColor: data.primaryColor || undefined,
        secondaryColor: data.secondaryColor || undefined,
        accentColor: data.accentColor || undefined,
        fontColorLight: data.fontColorLight !== undefined ? data.fontColorLight : undefined,
        fontColorDark: data.fontColorDark !== undefined ? data.fontColorDark : undefined,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl?.trim() || null : undefined,
        faviconUrl: data.faviconUrl !== undefined ? data.faviconUrl?.trim() || null : undefined,
        supportEmail: data.supportEmail?.trim() || undefined,
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/labs");
    revalidatePath("/admin/settings");
    return { success: true, settings: updated };
  } catch (error) {
    console.error("[updatePlatformSettings Error]:", error);
    throw new Error("Erro ao atualizar configurações White-label do laboratório.");
  }
}

export interface CreateKanbanColumnInput {
  workspaceId: string;
  title: string;
  color?: string;
}

/**
 * Server Action: Criar Novo Bucket / Coluna no Kanban
 */
export async function createKanbanColumn(data: CreateKanbanColumnInput) {
  const { user, activeLabId } = await getActiveLabContext();
  if (!user) throw new Error("Não autenticado. Por favor, faça login.");
  if (!data.title || data.title.trim() === "") {
    throw new Error("O nome do bucket/coluna é obrigatório.");
  }

  try {
    const ws = await prisma.workspace.findUnique({
      where: { id: data.workspaceId },
      select: { labId: true },
    });

    const columnCount = await prisma.kanbanColumn.count({
      where: { workspaceId: data.workspaceId },
    });

    const column = await prisma.kanbanColumn.create({
      data: {
        labId: ws?.labId || activeLabId,
        workspaceId: data.workspaceId,
        title: data.title.trim(),
        order: columnCount,
        color: data.color || null,
      },
      include: {
        tasks: {
          include: {
            assignees: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
            tags: { include: { tag: true } },
            timeEntries: { select: { id: true, durationMinutes: true, summary: true, date: true } },
          },
        },
      },
    });

    revalidatePath(`/workspace/${data.workspaceId}/kanban`);
    return { success: true, column };
  } catch (error) {
    console.error("[createKanbanColumn Error]:", error);
    throw new Error("Erro ao criar coluna no Kanban.");
  }
}

export interface MoveTaskInput {
  taskId: string;
  workspaceId: string;
  targetColumnId: string;
  newOrder?: number;
}

/**
 * Server Action: Mover Card entre Buckets (Drag and Drop)
 */
export async function moveTask(data: MoveTaskInput) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Não autenticado. Por favor, faça login.");

  try {
    const updated = await prisma.task.update({
      where: { id: data.taskId },
      data: {
        columnId: data.targetColumnId,
        order: data.newOrder !== undefined ? data.newOrder : undefined,
      },
    });

    revalidatePath(`/workspace/${data.workspaceId}/kanban`);
    return { success: true, task: updated };
  } catch (error) {
    console.error("[moveTask Error]:", error);
    throw new Error("Erro ao mover card entre colunas.");
  }
}

export interface UpdateTaskInput {
  taskId: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string | null;
  columnId?: string;
  assigneeUserIds?: string[];
}

/**
 * Server Action: Atualizar Todos os Campos de uma Atividade (Edição Completa)
 */
export async function updateTask(data: UpdateTaskInput) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Não autenticado. Por favor, faça login.");
  if (!data.title || data.title.trim() === "") {
    throw new Error("O título da atividade é obrigatório.");
  }

  try {
    const updated = await prisma.task.update({
      where: { id: data.taskId },
      data: {
        title: data.title.trim(),
        description: data.description !== undefined ? data.description?.trim() || null : undefined,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        columnId: data.columnId || undefined,
      },
    });

    if (data.assigneeUserIds !== undefined) {
      await prisma.taskAssignee.deleteMany({
        where: { taskId: data.taskId },
      });

      if (data.assigneeUserIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: data.assigneeUserIds.map((userId) => ({
            taskId: data.taskId,
            userId,
          })),
          skipDuplicates: true,
        });

        for (const userId of data.assigneeUserIds) {
          await prisma.workspaceMember.upsert({
            where: {
              workspaceId_userId: {
                workspaceId: data.workspaceId,
                userId,
              },
            },
            create: {
              workspaceId: data.workspaceId,
              userId,
              role: "MEMBER",
            },
            update: {},
          });
        }
      }
    }

    revalidatePath(`/workspace/${data.workspaceId}/kanban`);
    revalidatePath("/");
    return { success: true, task: updated };
  } catch (error) {
    console.error("[updateTask Error]:", error);
    throw new Error("Erro ao atualizar dados da atividade.");
  }
}

/**
 * Server Action: Excluir Atividade do Kanban
 */
export async function deleteTask(taskId: string, workspaceId: string) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Não autenticado. Por favor, faça login.");

  try {
    await prisma.task.delete({
      where: { id: taskId },
    });

    revalidatePath(`/workspace/${workspaceId}/kanban`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[deleteTask Error]:", error);
    throw new Error("Erro ao excluir atividade.");
  }
}

export interface UpdateWorkspaceDocumentInput {
  docId: string;
  title?: string;
  content?: any;
  icon?: string | null;
  coverImage?: string | null;
  isPublished?: boolean;
}

/**
 * Server Action: Atualizar Conteúdo, Título ou Metadados do Caderno de Documentação (Notion-like)
 */
export async function updateWorkspaceDocument(data: UpdateWorkspaceDocumentInput) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Não autenticado. Por favor, faça login.");
  }

  const existingDoc = await prisma.document.findUnique({
    where: { id: data.docId },
  });

  if (!existingDoc) {
    throw new Error("Documento não encontrado.");
  }

  try {
    const updated = await prisma.document.update({
      where: { id: data.docId },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() || "Sem título" }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      },
      include: {
        owner: { select: { id: true, name: true, image: true, email: true } },
        workspace: { select: { id: true, name: true, slug: true } },
      },
    });

    revalidatePath("/docs");
    if (updated.workspaceId) {
      revalidatePath(`/workspace/${updated.workspaceId}/docs`);
      revalidatePath(`/workspace/${updated.workspaceId}/docs/${updated.id}`);
    }

    return {
      success: true,
      document: {
        ...updated,
        updatedAt: updated.updatedAt.toISOString(),
        createdAt: updated.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("[updateWorkspaceDocument Error]:", error);
    throw new Error("Erro ao salvar alterações no documento.");
  }
}

/**
 * Server Action: Excluir Caderno de Documentação
 */
export async function deleteWorkspaceDocument(docId: string, workspaceId?: string) {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Não autenticado. Por favor, faça login.");
  }

  try {
    await prisma.document.delete({
      where: { id: docId },
    });

    revalidatePath("/docs");
    if (workspaceId) {
      revalidatePath(`/workspace/${workspaceId}/docs`);
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteWorkspaceDocument Error]:", error);
    throw new Error("Erro ao excluir caderno de documentação.");
  }
}

// ==========================================
// 10. CONTROLE DE INTEGRANTES & ATRIBUIÇÕES POR LABORATÓRIO
// ==========================================

const DEFAULT_ATTRIBUTIONS = [
  {
    name: "Coordenação & Gestão",
    slug: "coordenacao-gestao",
    description: "Coordenação institucional, gestão de pessoas, aprovação de projetos e alocação de recursos.",
    color: "#24576C",
    permissions: [
      "workspaces",
      "workspaces_admin",
      "time_tracking",
      "docs",
      "calendar",
      "members_view",
      "members_manage",
      "approvals",
      "platform_settings",
      "reports",
    ],
  },
  {
    name: "Pesquisa & Desenvolvimento",
    slug: "pesquisa-desenvolvimento",
    description: "Condução de investigações científicas, produção de artigos acadêmicos e relatórios técnicos.",
    color: "#0E4330",
    permissions: ["workspaces", "time_tracking", "docs", "calendar", "members_view"],
  },
  {
    name: "Infraestrutura & Tecnologia",
    slug: "infraestrutura-tecnologia",
    description: "Desenvolvimento do sistema, suporte a servidores, banco de dados e automação do laboratório.",
    color: "#4F46E5",
    permissions: [
      "workspaces",
      "workspaces_admin",
      "time_tracking",
      "docs",
      "calendar",
      "members_view",
      "members_manage",
      "platform_settings",
    ],
  },
  {
    name: "Comunicação & Mídia",
    slug: "comunicacao-midia",
    description: "Divulgação científica, mídias sociais, design gráfico e comunicação institucional.",
    color: "#D97706",
    permissions: ["workspaces", "time_tracking", "docs", "calendar", "members_view"],
  },
  {
    name: "Administrativo & Financeiro",
    slug: "administrativo-financeiro",
    description: "Gestão documental, apoio a bolsas de pesquisa, prestação de contas e compras.",
    color: "#059669",
    permissions: ["workspaces", "time_tracking", "docs", "calendar", "members_view", "reports"],
  },
];

/**
 * Busca todas as atribuições cadastradas no laboratório ativo (com contagem de integrantes)
 */
export async function getLabAttributions() {
  try {
    const { activeLabId } = await getActiveLabContext();

    const count = await prisma.attribution.count({
      where: { labId: activeLabId },
    });

    if (count === 0) {
      for (const attr of DEFAULT_ATTRIBUTIONS) {
        await prisma.attribution.upsert({
          where: {
            labId_slug: {
              labId: activeLabId,
              slug: attr.slug,
            },
          },
          update: {},
          create: {
            ...attr,
            labId: activeLabId,
          },
        });
      }
    }

    const attributions = await prisma.attribution.findMany({
      where: { labId: activeLabId },
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return attributions.map((a) => ({
      id: a.id,
      labId: a.labId,
      name: a.name,
      slug: a.slug,
      description: a.description,
      color: a.color,
      permissions: a.permissions,
      userCount: a._count.users,
    }));
  } catch (error) {
    console.error("[getLabAttributions Error]:", error);
    return [];
  }
}

/**
 * Cria uma nova atribuição customizada no laboratório ativo
 */
export async function createLabAttribution(data: {
  name: string;
  description?: string;
  color?: string;
  permissions: string[];
}) {
  const { user, activeLabId, canApproveInLab } = await getActiveLabContext();
  if (!user) throw new Error("Não autenticado. Por favor, faça login.");
  if (!canApproveInLab) {
    throw new Error("Acesso negado: apenas o Responsável e os Líderes do laboratório podem criar atribuições.");
  }

  const slug = data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  try {
    const attribution = await prisma.attribution.create({
      data: {
        labId: activeLabId,
        name: data.name.trim(),
        slug: slug || `attr-${Date.now()}`,
        description: data.description?.trim() || null,
        color: data.color || "#0E4734",
        permissions: data.permissions || [],
      },
    });

    revalidatePath("/members");
    return { success: true, attribution };
  } catch (error) {
    console.error("[createLabAttribution Error]:", error);
    throw new Error("Erro ao criar a atribuição neste laboratório. Verifique se o nome já existe.");
  }
}

/**
 * Atualiza uma atribuição existente do laboratório ativo
 */
export async function updateLabAttribution(data: {
  id: string;
  name: string;
  description?: string;
  color?: string;
  permissions: string[];
}) {
  const { user, activeLabId, canApproveInLab } = await getActiveLabContext();
  if (!user) throw new Error("Não autenticado. Por favor, faça login.");
  if (!canApproveInLab) {
    throw new Error("Acesso negado: apenas o Responsável e os Líderes do laboratório podem editar atribuições.");
  }

  const slug = data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  try {
    const updated = await prisma.attribution.update({
      where: { id: data.id, labId: activeLabId },
      data: {
        name: data.name.trim(),
        slug: slug || `attr-${Date.now()}`,
        description: data.description?.trim() || null,
        color: data.color || "#0E4734",
        permissions: data.permissions || [],
      },
    });

    revalidatePath("/members");
    return { success: true, attribution: updated };
  } catch (error) {
    console.error("[updateLabAttribution Error]:", error);
    throw new Error("Erro ao atualizar atribuição.");
  }
}

/**
 * Remove uma atribuição do laboratório ativo
 */
export async function deleteLabAttribution(id: string) {
  const { user, activeLabId, canApproveInLab } = await getActiveLabContext();
  if (!user) throw new Error("Não autenticado. Por favor, faça login.");
  if (!canApproveInLab) {
    throw new Error("Acesso negado: apenas o Responsável e os Líderes do laboratório podem excluir atribuições.");
  }

  try {
    await prisma.attribution.delete({
      where: { id, labId: activeLabId },
    });

    revalidatePath("/members");
    return { success: true };
  } catch (error) {
    console.error("[deleteLabAttribution Error]:", error);
    throw new Error("Erro ao excluir atribuição.");
  }
}

/**
 * Lista todos os integrantes vinculados ao laboratório ativo com dados consolidados
 */
export async function getLabMembers() {
  try {
    const { activeLabId } = await getActiveLabContext();

    const memberships = await prisma.labMembership.findMany({
      where: { labId: activeLabId },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      include: {
        user: {
          include: {
            attributions: {
              where: { labId: activeLabId },
              include: { attribution: true },
            },
            workspaceMemberships: {
              where: { workspace: { labId: activeLabId } },
              include: {
                workspace: { select: { id: true, name: true, slug: true } },
              },
            },
            _count: {
              select: {
                timeEntries: { where: { labId: activeLabId } },
                assignedTasks: { where: { task: { labId: activeLabId } } },
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => {
      const u = m.user;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        role: m.role,
        status: m.status,
        academicId: u.academicId,
        phone: u.phone,
        course: u.course,
        bio: u.bio,
        createdAt: m.createdAt.toISOString(),
        attributions: u.attributions.map((ua) => ({
          id: ua.attribution.id,
          name: ua.attribution.name,
          slug: ua.attribution.slug,
          color: ua.attribution.color,
          permissions: ua.attribution.permissions,
        })),
        workspaceCount: u.workspaceMemberships.length,
        workspaces: u.workspaceMemberships.map((wm) => wm.workspace),
        timeEntriesCount: u._count.timeEntries,
        tasksCount: u._count.assignedTasks,
      };
    });
  } catch (error) {
    console.error("[getLabMembers Error]:", error);
    return [];
  }
}

/**
 * Atualiza o papel, status e atribuições de um integrante dentro do laboratório ativo
 */
export async function updateMemberRoleAndAttributions(data: {
  userId: string;
  role: "PROFESSOR" | "LEADER" | "STUDENT";
  status: "ACTIVE" | "WAITING_APPROVAL" | "PENDING" | "REJECTED" | "SUSPENDED";
  attributionIds: string[];
}) {
  const { user: admin, activeLabId, roleInLab, canApproveInLab } = await getActiveLabContext();
  if (!admin) throw new Error("Não autenticado. Por favor, faça login.");
  if (!canApproveInLab) {
    throw new Error(
      "Acesso negado: apenas o Responsável do Laboratório e os Líderes podem gerenciar integrantes."
    );
  }

  // Líderes não podem promover outro usuário a PROFESSOR (apenas o Professor Responsável pode)
  if (data.role === "PROFESSOR" && roleInLab !== "PROFESSOR") {
    throw new Error("Apenas o Professor Responsável pode conceder o papel de Professor.");
  }

  try {
    // 1. Atualiza o vínculo do usuário no laboratório ativo (LabMembership)
    await prisma.labMembership.upsert({
      where: {
        labId_userId: {
          labId: activeLabId,
          userId: data.userId,
        },
      },
      update: {
        role: data.role,
        status: data.status,
        approvedById: admin.id,
        approvedAt: data.status === "ACTIVE" ? new Date() : undefined,
      },
      create: {
        labId: activeLabId,
        userId: data.userId,
        role: data.role,
        status: data.status,
        approvedById: admin.id,
        approvedAt: data.status === "ACTIVE" ? new Date() : undefined,
      },
    });

    // Sincroniza status global do usuário caso tenha sido ativado
    if (data.status === "ACTIVE") {
      await prisma.user.update({
        where: { id: data.userId },
        data: { status: "ACTIVE" },
      });
    }

    // 2. Sincroniza atribuições do integrante neste laboratório
    await prisma.userAttribution.deleteMany({
      where: { userId: data.userId, labId: activeLabId },
    });

    if (data.attributionIds && data.attributionIds.length > 0) {
      await prisma.userAttribution.createMany({
        data: data.attributionIds.map((attrId) => ({
          labId: activeLabId,
          userId: data.userId,
          attributionId: attrId,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/members");
    revalidatePath("/");
    revalidatePath("/admin/approvals");
    return { success: true };
  } catch (error) {
    console.error("[updateMemberRoleAndAttributions Error]:", error);
    throw new Error("Erro ao atualizar o integrante no laboratório.");
  }
}
