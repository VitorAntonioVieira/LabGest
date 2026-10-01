"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  Calendar,
  UserPlus,
  BookOpen,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMinutesToHours } from "@/lib/utils";
import { TimeEntryDialog } from "./time-entry-dialog";
import type { TaskPriority } from "@/types";

interface TaskItem {
  id: string;
  title: string;
  workspaceName: string;
  workspaceId: string;
  priority: TaskPriority;
  dueDate?: string | null;
  allowSelfAssign: boolean;
  tags: string[];
}

interface TimeEntryItem {
  id: string;
  taskTitle: string;
  workspaceName: string;
  date: string;
  minutes: number;
  summary: string;
}

interface DocumentItem {
  id: string;
  title: string;
  type: string;
  icon?: string | null;
  updatedAt: string;
}

interface DashboardInteractiveSectionsProps {
  tasks: TaskItem[];
  recentEntries: TimeEntryItem[];
  recentDocuments: DocumentItem[];
  availableTasksForModal: {
    id: string;
    title: string;
    workspaceName: string;
    workspaceId: string;
  }[];
}

export function DashboardInteractiveSections({
  tasks,
  recentEntries,
  recentDocuments,
  availableTasksForModal,
}: DashboardInteractiveSectionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prefilledTitle, setPrefilledTitle] = useState("");

  const handleOpenForTask = (taskTitle: string) => {
    setPrefilledTitle(taskTitle);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Coluna 1 & 2: Minhas Atividades Prioritárias */}
        <div className="space-y-8 lg:col-span-2">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-secondary" />
                  Minhas Atividades Prioritárias
                </h2>
                <p className="text-xs text-muted-foreground">
                  Tarefas atribuídas a você ou abertas para auto-atribuição no living lab.
                </p>
              </div>
            </div>

            {tasks.length === 0 ? (
              <Card className="border-dashed p-6 text-center text-xs text-muted-foreground">
                Nenhuma tarefa pendente atribuída no momento. Participe dos quadros Kanban nos braços de pesquisa!
              </Card>
            ) : (
              <div className="space-y-2.5">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-card p-3.5 hover:border-primary/40 transition-all shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">
                          {task.title}
                        </span>
                        {task.priority === "URGENT" && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Urgente
                          </Badge>
                        )}
                        {task.priority === "HIGH" && (
                          <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                            Alta Prioridade
                          </Badge>
                        )}
                        {task.allowSelfAssign && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Auto-atribuível
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                        <span className="font-medium text-secondary">{task.workspaceName}</span>
                        {task.dueDate && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Prazo: {task.dueDate}
                            </span>
                          </>
                        )}
                        {task.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{task.tags.join(", ")}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2.5 hover:bg-primary hover:text-white transition-colors"
                        onClick={() => handleOpenForTask(task.title)}
                      >
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Apontar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Coluna 3: Apontamentos Recentes e Documentos */}
        <div className="space-y-8">
          {/* Apontamentos Recentes de Horas */}
          <Card className="border border-border shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Apontamentos Recentes
                </CardTitle>
                <Link
                  href="/time-tracking"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Relatório
                </Link>
              </div>
              <CardDescription className="text-xs">
                Registro de produtividade para certificados e bolsas acadêmicas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  Nenhum apontamento realizado ainda.
                </p>
              ) : (
                recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-border/70 p-3 bg-muted/20 space-y-1.5"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-foreground line-clamp-1">
                        {entry.taskTitle}
                      </span>
                      <Badge variant="lab" className="text-[10px] font-bold shrink-0">
                        {formatMinutesToHours(entry.minutes)}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {entry.summary}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                      <span>{entry.workspaceName}</span>
                      <span>{entry.date}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-dashed text-primary hover:bg-primary/5"
                onClick={() => {
                  setPrefilledTitle("");
                  setIsModalOpen(true);
                }}
              >
                + Novo Lançamento de Horas
              </Button>
            </CardFooter>
          </Card>

          {/* Cadernos de Anotações Recentes */}
          <Card className="border border-border shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-secondary" />
                  Cadernos & Documentos
                </CardTitle>
                <Link
                  href="/docs"
                  className="text-xs text-secondary hover:underline font-medium"
                >
                  Abrir Docs
                </Link>
              </div>
              <CardDescription className="text-xs">
                Páginas colaborativas e notas pessoais em blocos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentDocuments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  Nenhuma anotação criada ainda.
                </p>
              ) : (
                recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-md p-2 hover:bg-accent/70 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{doc.icon || "📄"}</span>
                      <div>
                        <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                          {doc.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{doc.updatedAt}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px]">
                      {doc.type === "WORKSPACE" ? "Grupo" : "Privado"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Interativo de Apontamento de Horas */}
      <TimeEntryDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tasks={availableTasksForModal}
        initialTaskTitle={prefilledTitle}
      />
    </>
  );
}
