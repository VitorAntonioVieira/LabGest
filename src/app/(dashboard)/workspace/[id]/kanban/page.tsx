import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveLabContext } from "@/lib/lab-context";
import { KanbanSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KanbanHeaderActions } from "@/components/kanban/kanban-header-actions";
import { KanbanBoard } from "@/components/kanban/kanban-board";

interface KanbanPageProps {
  params: {
    id: string;
  };
}

export default async function WorkspaceKanbanPage({ params }: KanbanPageProps) {
  const { user } = await getActiveLabContext();
  if (!user) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      OR: [
        { id: params.id },
        { slug: params.id },
      ],
    },
    include: {
      columns: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
            include: {
              assignees: { include: { user: { select: { id: true, name: true, image: true, email: true } } } },
              tags: { include: { tag: true } },
              timeEntries: {
                select: { id: true, durationMinutes: true, summary: true, date: true },
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true, image: true } },
        },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  // Busca todos os integrantes vinculados ao laboratório deste workspace
  const labMemberships = await prisma.labMembership.findMany({
    where: {
      labId: workspace.labId,
      status: { notIn: ["REJECTED", "SUSPENDED"] },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  const assignableUsersMap = new Map<
    string,
    {
      id: string;
      name: string | null;
      email: string | null;
      image?: string | null;
      role?: string;
    }
  >();

  // 1. Prioriza todos os usuários vinculados ao laboratório deste workspace
  for (const lm of labMemberships) {
    if (lm.user) {
      assignableUsersMap.set(lm.user.id, {
        id: lm.user.id,
        name: lm.user.name,
        email: lm.user.email,
        image: lm.user.image,
        role: lm.role,
      });
    }
  }

  // 2. Inclui quaisquer membros já vinculados ao workspace
  for (const m of workspace.members) {
    if (m.user && !assignableUsersMap.has(m.user.id)) {
      assignableUsersMap.set(m.user.id, {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        role: m.user.role,
      });
    }
  }

  // 3. Inclui quaisquer pesquisadores que já estejam atribuídos em tarefas existentes
  for (const col of workspace.columns) {
    for (const t of col.tasks) {
      for (const a of t.assignees) {
        if (a.user && !assignableUsersMap.has(a.user.id)) {
          assignableUsersMap.set(a.user.id, {
            id: a.user.id,
            name: a.user.name,
            email: a.user.email || null,
            image: a.user.image,
          });
        }
      }
    }
  }

  const assignableUsers = Array.from(assignableUsersMap.values());

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
              <Link href="/">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                Voltar ao Dashboard
              </Link>
            </Button>
            <Badge variant="lab" className="text-[10px]">
              {workspace.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <KanbanSquare className="h-6 w-6 text-primary" />
            {workspace.name} • Quadro Kanban
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {workspace.description || "Gerenciamento de atividades e fluxo de pesquisa."}
          </p>
        </div>

        <KanbanHeaderActions
          workspaceId={workspace.id}
          columns={workspace.columns.map((c) => ({ id: c.id, title: c.title }))}
          workspaceMembers={assignableUsers}
        />
      </div>

      {/* Colunas do Kanban Interativo com Abertura de Card, DnD e Edição Completa */}
      <KanbanBoard
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        columns={workspace.columns as any}
        workspaceMembers={assignableUsers}
      />
    </div>
  );
}
