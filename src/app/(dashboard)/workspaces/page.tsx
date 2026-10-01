import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FolderGit2, Plus, Users, Layers, BookOpen, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkspacesHeaderActions } from "@/components/workspaces/workspaces-header-actions";

export default async function WorkspacesListPage() {
  const session = await getServerSession(authOptions);

  const workspaces = await prisma.workspace.findMany({
    where: {
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
      requestedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="lab" className="text-xs">
              Living Lab CTPP
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <FolderGit2 className="h-7 w-7 text-primary" />
            Espaços de Trabalho & Braços de Pesquisa
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Navegue pelos grupos de pesquisa do laboratório, acesse os fluxos Kanban e cadernos colaborativos.
          </p>
        </div>

        <WorkspacesHeaderActions />
      </div>

      {/* Grid de Workspaces */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((ws, idx) => (
          <Card
            key={ws.id}
            className="flex flex-col border border-border shadow-2xs hover:shadow-xs hover:border-primary/50 transition-all group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
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

            <CardContent className="flex-1 space-y-4 pb-3">
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {ws.description || "Espaço colaborativo de investigação científica e desenvolvimento do Living Lab."}
              </p>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-center">
                <div className="rounded-md bg-muted/40 p-2">
                  <span className="block text-sm font-bold text-foreground">
                    {ws._count.members}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Membros</span>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <span className="block text-sm font-bold text-foreground">
                    {ws._count.tasks}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Tarefas</span>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <span className="block text-sm font-bold text-foreground">
                    {ws._count.documents}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Docs</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-0 flex gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 hover:bg-primary/5 hover:text-primary"
              >
                <Link href={`/workspace/${ws.id}/kanban`}>
                  <Layers className="mr-1.5 h-3.5 w-3.5" />
                  Kanban
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 hover:bg-secondary/5 hover:text-secondary"
              >
                <Link href={`/workspace/${ws.id}/docs`}>
                  <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                  Caderno Docs
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
