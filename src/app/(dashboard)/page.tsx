import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveLabContext } from "@/lib/lab-context";
import {
  Clock,
  Layers,
  FolderGit2,
  BookOpen,
  Users,
  ArrowUpRight,
  Building2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PendingApprovals } from "@/components/dashboard/pending-approvals";
import { DashboardInteractiveSections } from "@/components/dashboard/dashboard-interactive-sections";
import { TimeEntryButton } from "@/components/dashboard/time-entry-button";
import { ROLE_LABELS } from "@/types";

export default async function DashboardPage() {
  // 1. Verificação de Sessão e Contexto Multi-Tenant do Laboratório Ativo
  const {
    user,
    activeLab,
    activeLabId,
    roleInLab,
    canApproveInLab,
  } = await getActiveLabContext();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  const userName = user.name || "Integrante";

  // 2. Busca de Dados Reais no Prisma filtrados por labId (Multi-Tenant Index Scan)

  // A. Soma das horas cadastradas no mês atual pelo usuário neste laboratório
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const monthlyEntries = await prisma.timeEntry.findMany({
    where: {
      labId: activeLabId,
      userId: userId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: {
      durationMinutes: true,
    },
  });

  const totalMinutesThisMonth = monthlyEntries.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalHoursThisMonth = (totalMinutesThisMonth / 60).toFixed(1);
  const hoursGoal = 40;
  const monthlyProgress = Math.min(100, Math.round((totalMinutesThisMonth / (hoursGoal * 60)) * 100));

  // B. Quantidade de tarefas no Kanban atribuídas a ele neste laboratório
  const assignedTasksCount = await prisma.taskAssignee.count({
    where: {
      userId: userId,
      task: {
        labId: activeLabId,
      },
    },
  });

  // C. Lista de Workspaces (Braços de pesquisa) ativos do laboratório
  const activeWorkspaces = await prisma.workspace.findMany({
    where: {
      labId: activeLabId,
      status: "APPROVED",
    },
    include: {
      _count: {
        select: {
          members: true,
          tasks: true,
          documents: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // D. Se for Responsável do Lab (PROFESSOR) ou Líder (LEADER), busca Workspaces PENDING e Pedidos de Triagem (LabMembership WAITING_APPROVAL)
  let pendingWorkspaces: any[] = [];
  let pendingUsers: any[] = [];
  if (canApproveInLab) {
    pendingWorkspaces = await prisma.workspace.findMany({
      where: {
        labId: activeLabId,
        status: "PENDING",
      },
      include: {
        requestedBy: {
          select: {
            name: true,
            email: true,
            course: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const pendingMemberships = await prisma.labMembership.findMany({
      where: {
        labId: activeLabId,
        status: "WAITING_APPROVAL",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            academicId: true,
            phone: true,
            course: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    pendingUsers = pendingMemberships.map((m) => ({
      ...m.user,
      createdAt: m.createdAt,
    }));
  }

  // E. Lista dos últimos apontamentos de horas do usuário neste laboratório
  const recentEntriesRaw = await prisma.timeEntry.findMany({
    where: {
      labId: activeLabId,
      userId: userId,
    },
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      task: { select: { title: true } },
      workspace: { select: { name: true } },
    },
  });

  const recentEntries = recentEntriesRaw.map((entry) => ({
    id: entry.id,
    taskTitle: entry.task?.title || "Atividade de Pesquisa",
    workspaceName: entry.workspace?.name || activeLab.name,
    date: entry.date.toLocaleDateString("pt-BR"),
    minutes: entry.durationMinutes,
    summary: entry.summary,
  }));

  // F. Tarefas prioritárias do laboratório ativo
  const upcomingTasksRaw = await prisma.task.findMany({
    where: {
      labId: activeLabId,
      OR: [
        { assignees: { some: { userId: userId } } },
        { allowSelfAssign: true },
      ],
      completedAt: null,
    },
    take: 5,
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: true } },
    },
  });

  const upcomingTasks = upcomingTasksRaw.map((task) => ({
    id: task.id,
    title: task.title,
    workspaceName: task.workspace.name,
    workspaceId: task.workspace.id,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toLocaleDateString("pt-BR") : null,
    allowSelfAssign: task.allowSelfAssign,
    tags: task.tags.map((t) => t.tag.name),
  }));

  // G. Tarefas disponíveis para seleção no modal neste laboratório
  const availableTasksForModalRaw = await prisma.task.findMany({
    where: {
      labId: activeLabId,
      completedAt: null,
    },
    select: {
      id: true,
      title: true,
      workspace: { select: { id: true, name: true } },
    },
    take: 20,
  });

  const availableTasksForModal = availableTasksForModalRaw.map((t) => ({
    id: t.id,
    title: t.title,
    workspaceName: t.workspace.name,
    workspaceId: t.workspace.id,
  }));

  // H. Documentos recentes do laboratório ativo
  const recentDocsRaw = await prisma.document.findMany({
    where: {
      labId: activeLabId,
      OR: [{ ownerId: userId }, { type: "WORKSPACE" }],
    },
    take: 3,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      icon: true,
      type: true,
      updatedAt: true,
    },
  });

  const recentDocuments = recentDocsRaw.map((doc) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    icon: doc.icon,
    updatedAt: doc.updatedAt.toLocaleDateString("pt-BR"),
  }));

  const totalDocumentsCount = await prisma.document.count({
    where: {
      labId: activeLabId,
      OR: [{ ownerId: userId }, { type: "WORKSPACE" }],
    },
  });

  return (
    <div className="space-y-8">
      {/* 1. Header de Boas-Vindas Acadêmico com Nome Real da Sessão e Laboratório Ativo */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Olá, {userName}
            </h1>
            <Badge
              variant="lab"
              className="text-xs px-2.5 py-0.5 border border-primary/20 font-semibold"
            >
              {ROLE_LABELS[roleInLab] || roleInLab}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              <strong>{activeLab.name}</strong> • {activeLab.departmentName} ({activeLab.institutionName})
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/5 text-xs font-medium"
          >
            <Link href="/docs">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              Caderno Pessoal
            </Link>
          </Button>

          <TimeEntryButton tasks={availableTasksForModal} />
        </div>
      </div>

      {/* 2. Grid de Métricas Principais Calculadas do Prisma (Escopadas por Lab) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Horas no Mês */}
        <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Horas Acumuladas (Mês)
            </CardTitle>
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-foreground">{totalHoursThisMonth}h</div>
              <span className="text-xs text-muted-foreground">Meta: {hoursGoal}h</span>
            </div>
            <div className="space-y-1">
              <Progress
                value={monthlyProgress}
                className="h-2 bg-primary/10"
                indicatorClassName="bg-primary"
              />
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-primary">{monthlyProgress}%</span> da carga horária acadêmica cumprida
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Tarefas Kanban */}
        <Card className="border border-border/80 shadow-xs hover:border-secondary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Atividades no Kanban
            </CardTitle>
            <div className="rounded-md bg-secondary/10 p-2 text-secondary">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {assignedTasksCount} {assignedTasksCount === 1 ? "Tarefa" : "Tarefas"}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
              Atividades sob sua responsabilidade
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Braços do Lab */}
        <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Braços de Pesquisa
            </CardTitle>
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <FolderGit2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {activeWorkspaces.length} Ativos
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingWorkspaces.length > 0 ? (
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {pendingWorkspaces.length} {pendingWorkspaces.length === 1 ? "solicitação pendente" : "solicitações pendentes"}
                </span>
              ) : (
                "Todos os braços homologados"
              )}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Documentação Notion-like */}
        <Card className="border border-border/80 shadow-xs hover:border-secondary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cadernos de Notas
            </CardTitle>
            <div className="rounded-md bg-secondary/10 p-2 text-secondary">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {totalDocumentsCount} Páginas
            </div>
            <p className="text-xs text-muted-foreground">
              Documentação em blocos sincronizada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Módulo Especial RBAC Multi-Tenant: Triagem de Membros e Workspaces pelo Responsável (PROFESSOR) e Líderes (LEADER) */}
      {canApproveInLab && (pendingWorkspaces.length > 0 || pendingUsers.length > 0) && (
        <PendingApprovals
          workspaces={pendingWorkspaces}
          pendingUsers={pendingUsers}
          activeWorkspaces={activeWorkspaces.map((ws) => ({
            id: ws.id,
            name: ws.name,
            department: ws.department,
          }))}
        />
      )}

      {/* 4. Braços de Pesquisa Ativos com Rotas Dinâmicas /workspace/[id]/kanban e docs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-primary" />
              Braços de Pesquisa ({activeLab.name})
            </h2>
            <p className="text-xs text-muted-foreground">
              Cada espaço possui seu próprio fluxo Kanban e documentação colaborativa neste laboratório.
            </p>
          </div>
          <Link
            href="/workspaces"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Gerenciar todos
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {activeWorkspaces.length === 0 ? (
          <Card className="border-dashed p-6 text-center text-xs text-muted-foreground">
            Nenhum braço de pesquisa ativo no momento neste laboratório. Solicite a abertura de um novo espaço de trabalho!
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeWorkspaces.map((ws, index) => {
              const isEven = index % 2 === 0;

              return (
                <Card
                  key={ws.id}
                  className={`border border-border transition-all duration-200 shadow-2xs hover:shadow-xs group ${
                    isEven ? "hover:border-primary/50" : "hover:border-secondary/50"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle
                          className={`text-sm font-semibold text-foreground transition-colors ${
                            isEven ? "group-hover:text-primary" : "group-hover:text-secondary"
                          }`}
                        >
                          {ws.name}
                        </CardTitle>
                        {ws.department && (
                          <CardDescription className="text-xs mt-0.5">
                            {ws.department}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant="lab" className="text-[10px]">
                        Ativo
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {ws.description || "Espaço colaborativo de pesquisa científica e desenvolvimento."}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                        {ws._count.members} integrantes
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                        {ws._count.tasks} tarefas
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 border-input hover:bg-primary/5 hover:text-primary"
                    >
                      <Link href={`/workspace/${ws.id}/kanban`}>Ver Kanban</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 border-input hover:bg-secondary/5 hover:text-secondary"
                    >
                      <Link href={`/workspace/${ws.id}/docs`}>Caderno Docs</Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Seções Interativas: Minhas Atividades, Apontamentos Recentes e Documentos */}
      <DashboardInteractiveSections
        tasks={upcomingTasks}
        recentEntries={recentEntries}
        recentDocuments={recentDocuments}
        availableTasksForModal={availableTasksForModal}
      />
    </div>
  );
}
