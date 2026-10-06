"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Calendar,
  User,
  ChevronRight,
  Plus,
  Loader2,
  Check,
  X,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TaskDetailDialog,
  TaskDetailData,
  WorkspaceMemberInfo,
} from "./task-detail-dialog";
import { CreateTaskDialog } from "@/components/modals/create-task-dialog";
import { createKanbanColumn, moveTask } from "@/app/actions";
import type { TaskPriority } from "@/types";

export interface KanbanTaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: Date | string | null;
  assignees: {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }[];
  tags: {
    tag: {
      id: string;
      name: string;
      color?: string;
    };
  }[];
  timeEntries?: {
    id: string;
    durationMinutes: number;
    summary: string;
    date: Date | string;
  }[];
}

export interface ColumnWithTasks {
  id: string;
  title: string;
  order?: number;
  color?: string | null;
  tasks: KanbanTaskItem[];
}

interface KanbanBoardProps {
  workspaceId: string;
  workspaceName: string;
  columns: ColumnWithTasks[];
  workspaceMembers?: WorkspaceMemberInfo[];
}

export function KanbanBoard({
  workspaceId,
  workspaceName,
  columns,
  workspaceMembers = [],
}: KanbanBoardProps) {
  const router = useRouter();

  // Colunas do Kanban com estado local para atualizações otimistas instantâneas
  const [columnsState, setColumnsState] = useState<ColumnWithTasks[]>(columns);

  // Sincroniza com as props do servidor quando a página revalida
  useEffect(() => {
    setColumnsState(columns);
  }, [columns]);

  // Estado do modal de detalhes / edição do card
  const [selectedTask, setSelectedTask] = useState<TaskDetailData | null>(null);

  // Estado de criação de novo bucket / coluna
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isCreatingColumn, startCreateColumn] = useTransition();
  const [createColumnError, setCreateColumnError] = useState<string | null>(null);

  // Estado para criação rápida de card em uma coluna específica
  const [quickCreateColumnId, setQuickCreateColumnId] = useState<string | null>(null);

  // Estados de Drag & Drop
  const [draggedTask, setDraggedTask] = useState<{
    taskId: string;
    sourceColumnId: string;
  } | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Handler: Início do arrasto
  const handleDragStart = (
    e: React.DragEvent,
    taskId: string,
    sourceColumnId: string
  ) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ taskId, sourceColumnId })
    );
    e.dataTransfer.effectAllowed = "move";
    setDraggedTask({ taskId, sourceColumnId });
  };

  // Handler: Fim do arrasto
  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumnId(null);
  };

  // Handler: Hover sobre uma coluna (Drop Zone)
  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  // Handler: Saída da coluna
  const handleDragLeave = (e: React.DragEvent, columnId: string) => {
    if (
      e.currentTarget.contains(e.relatedTarget as Node) ||
      (e.relatedTarget as HTMLElement)?.dataset?.columnId === columnId
    ) {
      return;
    }
    if (dragOverColumnId === columnId) {
      setDragOverColumnId(null);
    }
  };

  // Handler: Soltar o card em um novo bucket
  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);

    let droppedTaskId = draggedTask?.taskId;
    let sourceColId = draggedTask?.sourceColumnId;

    if (!droppedTaskId || !sourceColId) {
      try {
        const data = JSON.parse(e.dataTransfer.getData("application/json"));
        droppedTaskId = data.taskId;
        sourceColId = data.sourceColumnId;
      } catch {
        // Sem dados válidos de drag
        return;
      }
    }

    if (!droppedTaskId || !sourceColId || sourceColId === targetColumnId) {
      setDraggedTask(null);
      return;
    }

    // 1. Atualização Otimista no estado do React (zero delay visual)
    let movedTask: KanbanTaskItem | null = null;

    setColumnsState((prev) => {
      // Remove do bucket de origem
      const intermediate = prev.map((col) => {
        if (col.id === sourceColId) {
          const remaining = col.tasks.filter((t) => {
            if (t.id === droppedTaskId) {
              movedTask = t;
              return false;
            }
            return true;
          });
          return { ...col, tasks: remaining };
        }
        return col;
      });

      if (!movedTask) return prev;

      // Adiciona ao bucket de destino
      return intermediate.map((col) => {
        if (col.id === targetColumnId) {
          return {
            ...col,
            tasks: [...col.tasks, movedTask!],
          };
        }
        return col;
      });
    });

    setDraggedTask(null);

    // 2. Persistência via Server Action
    moveTask({
      taskId: droppedTaskId,
      workspaceId,
      targetColumnId,
    })
      .then(() => {
        router.refresh();
      })
      .catch((err) => {
        console.error("[KanbanBoard] Falha ao persistir movimento do card:", err);
        router.refresh();
      });
  };

  // Handler: Criar novo Bucket
  const handleCreateColumn = () => {
    if (!newColumnTitle.trim()) return;
    setCreateColumnError(null);

    startCreateColumn(async () => {
      try {
        const res = await createKanbanColumn({
          workspaceId,
          title: newColumnTitle.trim(),
        });

        if (res.success && res.column) {
          // Atualiza estado local adicionando o novo bucket
          const newCol: ColumnWithTasks = {
            id: res.column.id,
            title: res.column.title,
            order: res.column.order,
            color: res.column.color,
            tasks: [],
          };
          setColumnsState((prev) => [...prev, newCol]);
          setNewColumnTitle("");
          setIsAddingColumn(false);
          router.refresh();
        }
      } catch (err: any) {
        setCreateColumnError(err.message || "Erro ao criar novo bucket.");
      }
    });
  };

  // Handler: Atualização de Atividade (Edição Completa de Campos)
  const handleTaskUpdated = (updatedTask: TaskDetailData) => {
    setColumnsState((prev) => {
      // Verifica se a coluna foi alterada pelo dropdown de edição
      const oldCol = prev.find((col) =>
        col.tasks.some((t) => t.id === updatedTask.id)
      );
      const targetColId = updatedTask.columnId;

      if (oldCol && oldCol.id !== targetColId) {
        // Coluna mudou: remove da antiga e insere na nova
        let taskCopy: KanbanTaskItem | null = null;
        const filteredCols = prev.map((col) => {
          if (col.id === oldCol.id) {
            const remaining = col.tasks.filter((t) => {
              if (t.id === updatedTask.id) {
                taskCopy = {
                  ...t,
                  title: updatedTask.title,
                  description: updatedTask.description || null,
                  priority: updatedTask.priority,
                  dueDate: updatedTask.dueDate || null,
                  assignees: updatedTask.assignees,
                };
                return false;
              }
              return true;
            });
            return { ...col, tasks: remaining };
          }
          return col;
        });

        if (!taskCopy) return prev;

        return filteredCols.map((col) => {
          if (col.id === targetColId) {
            return {
              ...col,
              tasks: [...col.tasks, taskCopy!],
            };
          }
          return col;
        });
      }

      // Mesma coluna: atualiza dados in-place
      return prev.map((col) => {
        const taskIdx = col.tasks.findIndex((t) => t.id === updatedTask.id);
        if (taskIdx === -1) return col;

        const updatedTasks = [...col.tasks];
        updatedTasks[taskIdx] = {
          ...updatedTasks[taskIdx],
          title: updatedTask.title,
          description: updatedTask.description || null,
          priority: updatedTask.priority,
          dueDate: updatedTask.dueDate || null,
          assignees: updatedTask.assignees,
        };

        return { ...col, tasks: updatedTasks };
      });
    });

    setSelectedTask(updatedTask);
  };

  // Handler: Exclusão de Atividade
  const handleTaskDeleted = (taskId: string) => {
    setColumnsState((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      }))
    );
    setSelectedTask(null);
  };

  return (
    <>
      {/* Colunas do Kanban com Rolagem Horizontal e Altura Bounded */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[580px] max-h-[calc(100vh-15rem)] select-none">
        {columnsState.map((column) => {
          const isOver = dragOverColumnId === column.id;

          return (
            <div
              key={column.id}
              data-column-id={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={(e) => handleDragLeave(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={cn(
                "w-80 shrink-0 flex flex-col rounded-xl border p-3 max-h-[calc(100vh-16rem)] transition-all duration-150",
                isOver
                  ? "border-primary bg-primary/[0.04] ring-2 ring-primary/30 shadow-md"
                  : "border-border/80 bg-muted/30 hover:border-border"
              )}
            >
              {/* Header do Bucket */}
              <div className="flex items-center justify-between px-1 pb-2.5 shrink-0 border-b border-border/40">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: column.color || "hsl(var(--primary))" }}
                  />
                  {column.title}
                </span>

                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-medium">
                    {column.tasks.length}
                  </Badge>

                  {/* Botão rápido para adicionar tarefa neste bucket específico */}
                  <button
                    type="button"
                    onClick={() => setQuickCreateColumnId(column.id)}
                    title={`Adicionar atividade em ${column.title}`}
                    className="h-5 w-5 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Lista de Cards da Coluna com Drop Zone */}
              <div className="space-y-2 flex-1 overflow-y-auto mt-2 pr-1 min-h-[120px]">
                {column.tasks.length === 0 ? (
                  <div
                    className={cn(
                      "rounded-lg border border-dashed p-6 text-center text-xs transition-colors",
                      isOver
                        ? "border-primary/50 bg-primary/10 text-primary font-medium"
                        : "border-border/70 text-muted-foreground/70"
                    )}
                  >
                    {isOver ? "Solte o card aqui para mover" : "Nenhuma atividade"}
                  </div>
                ) : (
                  column.tasks.map((task) => {
                    const isDraggingThis = draggedTask?.taskId === task.id;

                    return (
                      <Card
                        key={task.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, task.id, column.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() =>
                          setSelectedTask({
                            ...task,
                            columnId: column.id,
                            columnTitle: column.title,
                            workspaceId,
                            workspaceName,
                          })
                        }
                        className={cn(
                          "p-3 shadow-2xs hover:shadow-md hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing bg-card group relative select-none",
                          isDraggingThis &&
                            "opacity-40 ring-2 ring-primary scale-[0.98] border-primary/50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-1.5 flex-1">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/80 shrink-0 mt-0.5 transition-colors" />
                            <CardTitle className="text-xs font-semibold leading-snug group-hover:text-primary transition-colors">
                              {task.title}
                            </CardTitle>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 pl-5">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/40 text-[10px] text-muted-foreground pl-1">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant={
                                task.priority === "URGENT" || task.priority === "HIGH"
                                  ? "destructive"
                                  : task.priority === "MEDIUM"
                                  ? "warning"
                                  : "outline"
                              }
                              className="text-[9px] px-1 py-0 h-4 font-medium"
                            >
                              {task.priority}
                            </Badge>

                            {task.assignees.length > 0 && (
                              <span
                                className="flex items-center gap-0.5 text-[9px] text-muted-foreground font-medium"
                                title={`${task.assignees.length} pesquisador(es) atribuído(s)`}
                              >
                                <User className="h-3 w-3" />
                                {task.assignees.length}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                              </span>
                            )}

                            <span
                              className="p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors"
                              title="Clique para editar campos ou apontar horas"
                            >
                              <Clock className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}

                {/* Feedback visual quando estiver arrastando sobre esta coluna */}
                {isOver && column.tasks.length > 0 && (
                  <div className="rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-3 text-center text-[11px] text-primary font-medium animate-pulse">
                    Solte o card aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* ======================================================== */}
        {/* BLOCO: CRIAR NOVO BUCKET / COLUNA NO QUADRO              */}
        {/* ======================================================== */}
        {isAddingColumn ? (
          <div className="w-80 shrink-0 rounded-xl border border-primary/50 bg-card p-3 shadow-lg space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-border/50">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <Plus className="h-3.5 w-3.5 text-primary" /> Novo Bucket
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAddingColumn(false);
                  setNewColumnTitle("");
                  setCreateColumnError(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {createColumnError && (
              <div className="text-[11px] text-destructive bg-destructive/10 border border-destructive/30 rounded p-1.5">
                {createColumnError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Nome do Bucket
              </label>
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Ex: Em Validação, Revisão FAPESP..."
                className="w-full text-xs rounded-md border border-input bg-background px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateColumn();
                  if (e.key === "Escape") setIsAddingColumn(false);
                }}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleCreateColumn}
                disabled={isCreatingColumn || !newColumnTitle.trim()}
                className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 flex-1 gap-1.5 font-semibold cursor-pointer shadow-xs"
              >
                {isCreatingColumn ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>Criar Bucket</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingColumn(false);
                  setNewColumnTitle("");
                  setCreateColumnError(null);
                }}
                className="h-8 text-xs text-muted-foreground cursor-pointer"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingColumn(true)}
            className="w-80 shrink-0 h-16 rounded-xl border-2 border-dashed border-border/80 hover:border-primary/70 hover:bg-primary/[0.03] text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2 text-xs font-semibold group cursor-pointer shadow-2xs"
          >
            <div className="h-6 w-6 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span>Adicionar Novo Bucket</span>
          </button>
        )}
      </div>

      {/* Modal de Detalhes da Atividade com Edição Completa de Campos e Apontamento de Horas */}
      <TaskDetailDialog
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        columns={columnsState.map((c) => ({ id: c.id, title: c.title }))}
        workspaceMembers={workspaceMembers}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />

      {/* Modal para Criação Rápida de Atividade no Bucket Escolhido */}
      <CreateTaskDialog
        isOpen={!!quickCreateColumnId}
        onClose={() => setQuickCreateColumnId(null)}
        workspaceId={workspaceId}
        columns={columnsState.map((c) => ({ id: c.id, title: c.title }))}
        defaultColumnId={quickCreateColumnId || undefined}
        workspaceMembers={workspaceMembers}
      />
    </>
  );
}
