import React from "react";
import { prisma } from "@/lib/prisma";
import { getActiveLabContext } from "@/lib/lab-context";
import { Calendar as CalendarIcon, Clock, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function CalendarPage() {
  const { activeLab, activeLabId } = await getActiveLabContext();

  // Busca tarefas com dueDate configurada neste laboratório
  const tasksWithDueDate = await prisma.task.findMany({
    where: {
      labId: activeLabId,
      dueDate: { not: null },
    },
    include: {
      workspace: { select: { name: true } },
      assignees: { include: { user: { select: { name: true } } } },
    },
    orderBy: { dueDate: "asc" },
    take: 10,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="lab" className="text-xs">
              {activeLab.name} • Cronograma Acadêmico
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <CalendarIcon className="h-7 w-7 text-primary" />
            Calendário do {activeLab.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe entregas, reuniões de bancas, prazos de relatórios científicos e seminários de pesquisa.
          </p>
        </div>

        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5 shadow-xs">
          <Plus className="h-4 w-4" />
          <span>Agendar Reunião / Marco</span>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Painel de Próximos Prazos / Entregas */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-border shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Próximas Entregas & Marcos de Projetos
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {tasksWithDueDate.length} Cadastradas
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {tasksWithDueDate.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-lg text-xs text-muted-foreground">
                  Nenhum prazo cadastrado para as próximas semanas neste laboratório.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasksWithDueDate.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/70 hover:bg-muted/40 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground">
                            {task.title}
                          </span>
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                            {task.workspace.name}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span>
                            Responsáveis:{" "}
                            {task.assignees.map((a) => a.user.name).filter(Boolean).join(", ") || "Geral"}
                          </span>
                        </p>
                      </div>
                      <Badge variant="warning" className="text-[10px] shrink-0">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString("pt-BR") : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Eventos Recorrentes do Laboratório */}
        <div className="space-y-4">
          <Card className="border border-border shadow-2xs bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground">
                Seminários & Atividades Fixas
              </CardTitle>
              <CardDescription className="text-xs">
                Reuniões gerais do {activeLab.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-1">
                <span className="font-semibold text-primary block">
                  Seminário de Alinhamento Semanal
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Toda Sexta-feira • 14:00 às 16:00
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Apresentação de resultados e triagem de novos braços de pesquisa.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-secondary/20 bg-secondary/5 space-y-1">
                <span className="font-semibold text-secondary block">
                  Workshop de Metodologia e Escrita
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Primeira Quarta do mês • 10:00 às 12:00
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Revisão de artigos científicos e teses de pós-graduação.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
