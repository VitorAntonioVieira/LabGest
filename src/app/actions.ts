"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface TimeEntryInput {
  taskTitle?: string;
  taskId?: string;
  workspaceId?: string;
  date: string;
  durationMinutes: number;
  summary: string;
}

/**
 * Server Action: Aprovar Workspace (Restrito ao PROFESSOR)
 */
export async function approveWorkspace(workspaceId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Não autenticado.");
  }

  // Validação estrita de RBAC
  if (session.user.role !== "PROFESSOR") {
    throw new Error("Acesso negado: apenas Professores podem aprovar novos espaços de trabalho.");
  }

  try {
    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        status: "APPROVED",
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    });

    revalidatePath("/");
    revalidatePath("/workspaces");
    return { success: true, workspace: updated };
  } catch (error) {
    console.error("[approveWorkspace Error]:", error);
    throw new Error("Falha ao aprovar o espaço de trabalho.");
  }
}

/**
 * Server Action: Recusar Workspace com justificativa (Restrito ao PROFESSOR)
 */
export async function rejectWorkspace(workspaceId: string, rejectionNotes?: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Não autenticado.");
  }

  if (session.user.role !== "PROFESSOR") {
    throw new Error("Acesso negado: apenas Professores podem avaliar espaços de trabalho.");
  }

  try {
    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        status: "REJECTED",
        rejectionNotes: rejectionNotes || "Solicitação não atende aos requisitos do laboratório.",
        approvedById: session.user.id,
      },
    });

    revalidatePath("/");
    revalidatePath("/workspaces");
    return { success: true, workspace: updated };
  } catch (error) {
    console.error("[rejectWorkspace Error]:", error);
    throw new Error("Falha ao recusar o espaço de trabalho.");
  }
}

/**
 * Server Action: Criar Apontamento de Horas (Time Entry)
 */
export async function createTimeEntry(data: TimeEntryInput) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Usuário não autenticado.");
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

    // Se o usuário selecionou uma tarefa existente, busca o workspace vinculado
    if (resolvedTaskId) {
      const existingTask = await prisma.task.findUnique({
        where: { id: resolvedTaskId },
        select: { workspaceId: true },
      });
      if (existingTask) {
        resolvedWorkspaceId = existingTask.workspaceId;
      }
    }

    // Se não há tarefa ou workspace explícito, vincula a um workspace ativo ou cria uma atividade geral
    if (!resolvedTaskId || !resolvedWorkspaceId) {
      let targetWorkspace = await prisma.workspace.findFirst({
        where: { status: "APPROVED" },
        include: { columns: { take: 1, orderBy: { order: "asc" } } },
      });

      // Se não houver nenhum workspace ainda, cria um padrão
      if (!targetWorkspace) {
        targetWorkspace = await prisma.workspace.create({
          data: {
            name: "Pesquisa Geral Living Lab",
            slug: "pesquisa-geral",
            department: "Living Lab CTPP",
            status: "APPROVED",
            requestedById: session.user.id,
            columns: {
              create: [
                { title: "A Fazer", order: 0 },
                { title: "Em Andamento", order: 1 },
                { title: "Concluído", order: 2 },
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
          title: data.taskTitle?.trim() || "Atividade de Pesquisa",
          workspaceId: targetWorkspace.id,
          columnId: defaultColumn.id,
          createdById: session.user.id,
          allowSelfAssign: true,
          assignees: {
            create: {
              userId: session.user.id,
            },
          },
        },
      });
      resolvedTaskId = newTask.id;
    }

    // Cria o registro de horas
    const newEntry = await prisma.timeEntry.create({
      data: {
        userId: session.user.id,
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
}

/**
 * Server Action: Concluir Cadastro Inicial (Onboarding do Aluno/Pesquisador)
 * Transaciona o usuário de PENDING para WAITING_APPROVAL
 */
export async function completeOnboarding(data: OnboardingInput) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Não autenticado.");
  }

  if (!data.academicId || data.academicId.trim() === "") {
    throw new Error("O Registro Acadêmico (RA) é obrigatório.");
  }

  if (!data.phone || data.phone.trim() === "") {
    throw new Error("O número de WhatsApp / Telefone é obrigatório.");
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        academicId: data.academicId.trim(),
        phone: data.phone.trim(),
        course: data.course?.trim() || null,
        status: "WAITING_APPROVAL",
      },
    });

    revalidatePath("/");
    revalidatePath("/onboarding");
    revalidatePath("/waiting-room");
    return { success: true, user: updated };
  } catch (error) {
    console.error("[completeOnboarding Error]:", error);
    throw new Error("Falha ao salvar dados de integração.");
  }
}

export interface TriageInput {
  userId: string;
  role: "STUDENT" | "LEADER";
  workspaceIds: string[];
}

/**
 * Server Action: Triagem e Aprovação de Usuário (Restrito à Coordenação Geral)
 * Atribui a Role final, homologa status para ACTIVE e associa aos braços do lab
 */
export async function triageAndApproveUser(data: TriageInput) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Não autenticado.");
  }

  if (session.user.role !== "PROFESSOR") {
    throw new Error("Acesso negado: apenas a Coordenação Geral pode homologar membros.");
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: {
        role: data.role,
        status: "ACTIVE",
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    });

    // Vincula o usuário aos braços de pesquisa selecionados
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
    revalidatePath("/workspaces");
    revalidatePath("/admin/approvals");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("[triageAndApproveUser Error]:", error);
    throw new Error("Erro ao realizar a triagem do membro.");
  }
}

/**
 * Server Action: Recusar solicitação de ingresso do membro
 */
export async function rejectPendingUser(userId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Não autenticado.");
  }

  if (session.user.role !== "PROFESSOR") {
    throw new Error("Acesso negado.");
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status: "REJECTED",
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/approvals");
    return { success: true, user: updated };
  } catch (error) {
    console.error("[rejectPendingUser Error]:", error);
    throw new Error("Erro ao recusar usuário.");
  }
}

export interface RequestWorkspaceInput {
  name: string;
  department?: string;
  description?: string;
}

/**
 * Server Action: Solicitar Abertura de Novo Braço de Pesquisa (Workspace)
 */
export async function requestWorkspace(data: RequestWorkspaceInput) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Não autenticado.");
  }

  if (!data.name || data.name.trim() === "") {
    throw new Error("O nome do espaço de trabalho é obrigatório.");
  }

  // Gera slug seguro
  const baseSlug = data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const slug = `${baseSlug}-${randomSuffix}`;

  try {
    const isProfessor = session.user.role === "PROFESSOR";
    const initialStatus = isProfessor ? "APPROVED" : "PENDING";

    const workspace = await prisma.workspace.create({
      data: {
        name: data.name.trim(),
        slug: slug,
        department: data.department?.trim() || "Living Lab CTPP",
        description: data.description?.trim() || null,
        status: initialStatus,
        requestedById: session.user.id,
        approvedById: isProfessor ? session.user.id : null,
        approvedAt: isProfessor ? new Date() : null,
        columns: {
          create: [
            { title: "A Fazer", order: 0 },
            { title: "Em Andamento", order: 1 },
            { title: "Revisão", order: 2 },
            { title: "Concluído", order: 3 },
          ],
        },
        members: {
          create: [
            {
              userId: session.user.id,
              role: isProfessor ? "OWNER" : "MEMBER",
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
}

/**
 * Server Action: Criar Nova Atividade no Quadro Kanban
 */
export async function createTask(data: CreateTaskInput) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Não autenticado.");
  }

  if (!data.title || data.title.trim() === "") {
    throw new Error("O título da atividade é obrigatório.");
  }

  try {
    // Se não tiver columnId, busca a primeira coluna do workspace
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
        title: data.title.trim(),
        description: data.description?.trim() || null,
        priority: data.priority || "MEDIUM",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        allowSelfAssign: data.allowSelfAssign ?? true,
        workspaceId: data.workspaceId,
        columnId: targetColumnId,
        createdById: session.user.id,
        order: taskCount,
        assignees: {
          create: [{ userId: session.user.id }],
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
 * Server Action: Criar Nova Página de Documentação / Notas
 */
export async function createDocument(data: CreateDocumentInput) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id && !session?.user?.email) {
    throw new Error("Não autenticado. Por favor, faça login.");
  }

  // Busca o usuário atual no banco para garantir que o ID é válido e evitar violação de FK
  let dbUser = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true } })
    : null;

  if (!dbUser && session?.user?.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    });
  }

  if (!dbUser) {
    throw new Error("Sessão expirada ou usuário não sincronizado. Por favor, recarregue a página ou faça login novamente.");
  }

  if (!data.title || data.title.trim() === "") {
    throw new Error("O título da página é obrigatório.");
  }

  try {
    const doc = await prisma.document.create({
      data: {
        title: data.title.trim(),
        icon: data.icon || "📄",
        type: data.workspaceId ? "WORKSPACE" : (data.type || "PERSONAL"),
        workspaceId: data.workspaceId || null,
        ownerId: dbUser.id,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: `Criado por ${dbUser.name || session.user.name || "Pesquisador"} em ${new Date().toLocaleDateString("pt-BR")}.`,
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
 * Server Action: Atualizar Configurações White-label da Plataforma (Restrito ao PROFESSOR)
 */
export async function updatePlatformSettings(data: PlatformSettingsInput) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Não autenticado.");
  }

  if (session.user.role !== "PROFESSOR") {
    throw new Error("Apenas Professores e Coordenadores podem alterar as configurações da plataforma.");
  }

  try {
    const existing = await prisma.platformSettings.findFirst();
    const targetId = existing?.id || "default-settings";

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
      id: targetId,
      labName: data.labName.trim(),
      institutionName: data.institutionName?.trim() || "UNIFESP",
      departmentName: data.departmentName?.trim() || "Living Lab CTPP",
      primaryColor: data.primaryColor || "#0E4330",
      secondaryColor: data.secondaryColor || "#24576C",
      accentColor: data.accentColor || "#1F8A64",
      fontColorLight: data.fontColorLight || "#111827",
      fontColorDark: data.fontColorDark || "#F8FAFC",
      logoUrl: data.logoUrl?.trim() || null,
      faviconUrl: data.faviconUrl?.trim() || null,
      supportEmail: data.supportEmail?.trim() || "labtecpp@unifesp.br",
    };

    const updated = await prisma.platformSettings.upsert({
      where: { id: targetId },
      create: createPayload,
      update: updatePayload,
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return { success: true, settings: updated };
  } catch (error) {
    console.error("[updatePlatformSettings Error]:", error);
    throw new Error("Erro ao atualizar configurações da plataforma.");
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autenticado.");
  if (!data.title || data.title.trim() === "") {
    throw new Error("O nome do bucket/coluna é obrigatório.");
  }

  try {
    const columnCount = await prisma.kanbanColumn.count({
      where: { workspaceId: data.workspaceId },
    });

    const column = await prisma.kanbanColumn.create({
      data: {
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autenticado.");

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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autenticado.");
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

    // Sincroniza pesquisadores atribuídos
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Não autenticado.");

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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Não autenticado.");
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Não autenticado.");
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

