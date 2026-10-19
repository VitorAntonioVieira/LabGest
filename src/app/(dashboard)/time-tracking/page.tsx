import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveLabContext } from "@/lib/lab-context";
import { Clock, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TimeEntryButton } from "@/components/dashboard/time-entry-button";
import { formatMinutesToHours } from "@/lib/utils";

export default async function TimeTrackingPage() {
  const { user, activeLab, activeLabId } = await getActiveLabContext();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  // Busca todos os apontamentos de horas do usuário no laboratório ativo
  const entries = await prisma.timeEntry.findMany({
    where: {
      labId: activeLabId,
      userId: userId,
    },
    include: {
      task: { select: { title: true } },
      workspace: { select: { name: true } },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Calcula total do mês
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const monthlyEntries = entries.filter(
    (e) => new Date(e.date) >= startOfMonth && new Date(e.date) <= endOfMonth
  );

  const totalMinutesThisMonth = monthlyEntries.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalHoursThisMonth = (totalMinutesThisMonth / 60).toFixed(1);
  const hoursGoal = 40;
  const progressPercent = Math.min(100, Math.round((totalMinutesThisMonth / (hoursGoal * 60)) * 100));

  // Tarefas disponíveis no laboratório ativo para o modal
  const availableTasksRaw = await prisma.task.findMany({
    where: { labId: activeLabId, completedAt: null },
    select: {
      id: true,
      title: true,
      workspace: { select: { id: true, name: true } },
    },
    take: 20,
  });

  const availableTasks = availableTasksRaw.map((t) => ({
    id: t.id,
    title: t.title,
    workspaceName: t.workspace.name,
    workspaceId: t.workspace.id,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="lab" className="text-xs">
              {activeLab.name} • Apontamento de Horas
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <Clock className="h-7 w-7 text-primary" />
            Gestão & Registro de Horas de Pesquisa
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registre suas atividades semanais no <strong>{activeLab.name}</strong> para cumprimento da carga horária acadêmica e emissão de certificados.
          </p>
        </div>

        <TimeEntryButton tasks={availableTasks} />
      </div>

      {/* Cartões de Indicadores */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Total Acumulado no Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-foreground">{totalHoursThisMonth}h</span>
              <span className="text-xs text-muted-foreground">Meta: {hoursGoal}h</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-primary/10" indicatorClassName="bg-primary" />
            <p className="text-[11px] text-muted-foreground">
              <strong className="text-primary">{progressPercent}%</strong> concluído neste mês.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Atividades Registradas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-foreground">{entries.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de sessões de trabalho lançadas neste laboratório
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Status de Homologação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-extrabold text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="h-7 w-7" />
              Regular
            </div>
            <p className="text-xs text-muted-foreground">
              Suas horas foram validadas pela coordenação do laboratório
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Apontamentos */}
      <Card className="border border-border shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-foreground">
            Histórico de Apontamentos ({activeLab.name})
          </CardTitle>
          <CardDescription className="text-xs">
            Lista de todas as tarefas e resumos de atividades executadas neste laboratório.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg text-xs text-muted-foreground">
              Nenhum apontamento registrado ainda neste laboratório. Clique em "Apontar Horas" para começar!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/80 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="pb-2">Data</th>
                    <th className="pb-2">Atividade / Tarefa</th>
                    <th className="pb-2">Braço de Pesquisa</th>
                    <th className="pb-2">Duração</th>
                    <th className="pb-2">Resumo Executivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-medium text-foreground whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 font-semibold text-foreground">
                        {entry.task?.title || "Atividade de Pesquisa"}
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="text-[10px]">
                          {entry.workspace?.name || "Geral"}
                        </Badge>
                      </td>
                      <td className="py-3 font-mono font-medium text-primary">
                        {formatMinutesToHours(entry.durationMinutes)}
                      </td>
                      <td className="py-3 text-muted-foreground max-w-xs truncate">
                        {entry.summary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
