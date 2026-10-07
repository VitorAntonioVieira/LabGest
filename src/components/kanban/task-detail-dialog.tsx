"use client";

import React, { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  X,
  Clock,
  Calendar,
  User,
  FileText,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Trash2,
  Columns as ColumnsIcon,
  Flag,
  Save,
} from "lucide-react";
import { cn, formatMinutesToHours } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createTimeEntry, updateTask, deleteTask } from "@/app/actions";
import type { TaskPriority } from "@/types";

export interface TaskTimeEntry {
  id: string;
  durationMinutes: number;
  summary: string;
  date: Date | string;
}

export interface TaskDetailData {
  id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  dueDate?: Date | string | null;
  columnTitle: string;
  columnId: string;
  workspaceId: string;
  workspaceName: string;
  assignees: {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }[];
  tags?: {
    tag: {
      id: string;
      name: string;
      color?: string;
    };
  }[];
  timeEntries?: TaskTimeEntry[];
}

export interface WorkspaceMemberInfo {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
  role?: string;
}

export interface ColumnOptionInfo {
  id: string;
  title: string;
}

interface TaskDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskDetailData | null;
  columns?: ColumnOptionInfo[];
  workspaceMembers?: WorkspaceMemberInfo[];
  onTaskUpdated?: (updatedTask: TaskDetailData) => void;
  onTaskDeleted?: (taskId: string) => void;
}

export function TaskDetailDialog({
  isOpen,
  onClose,
  task,
  columns = [],
  workspaceMembers = [],
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailDialogProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"details" | "log-time">("details");

  // Transitions for Server Actions
  const [isSavingTask, startSavingTask] = useTransition();
  const [isLoggingTime, startLoggingTime] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  // Local state for editable task fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  // Time entries state
  const [localEntries, setLocalEntries] = useState<TaskTimeEntry[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Time logging form fields
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [executionDate, setExecutionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [timeSummary, setTimeSummary] = useState("");
  const [timeFormError, setTimeFormError] = useState<string | null>(null);

  // Combina todos os pesquisadores disponíveis do sistema com quaisquer pesquisadores já atribuídos nesta tarefa
  const availableMembers = React.useMemo(() => {
    const map = new Map<string, WorkspaceMemberInfo>();
    workspaceMembers.forEach((m) => map.set(m.id, m));
    task?.assignees?.forEach((a) => {
      if (a.user && !map.has(a.user.id)) {
        map.set(a.user.id, {
          id: a.user.id,
          name: a.user.name,
          email: a.user.email || null,
          image: a.user.image,
        });
      }
    });
    return Array.from(map.values());
  }, [workspaceMembers, task]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state whenever selected task changes or dialog opens
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setColumnId(task.columnId || "");
      setPriority(task.priority || "MEDIUM");
      setDueDate(
        task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : ""
      );
      setSelectedAssigneeIds(task.assignees?.map((a) => a.user.id) || []);
      setLocalEntries(task.timeEntries || []);
      setMode("details");
      setSaveSuccess(null);
      setSaveError(null);
      setTimeFormError(null);
      setTimeSummary("");
      setDurationMinutes(90);
      setExecutionDate(new Date().toISOString().split("T")[0]);
    }
  }, [task, isOpen]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task || !mounted) return null;

  const totalMinutes = localEntries.reduce(
    (acc, curr) => acc + curr.durationMinutes,
    0
  );

  // Save changes to all task fields
  const handleSaveTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    if (!title.trim()) {
      setSaveError("O título da atividade é obrigatório.");
      return;
    }

    startSavingTask(async () => {
      try {
        await updateTask({
          taskId: task.id,
          workspaceId: task.workspaceId,
          title: title.trim(),
          description: description.trim() || null,
          priority,
          dueDate: dueDate || null,
          columnId: columnId || undefined,
          assigneeUserIds: selectedAssigneeIds,
        });

        const chosenCol = columns.find((c) => c.id === columnId);
        const chosenAssignees = availableMembers
          .filter((m) => selectedAssigneeIds.includes(m.id))
          .map((m) => ({
            user: {
              id: m.id,
              name: m.name,
              email: m.email,
              image: m.image || null,
            },
          }));

        const updatedData: TaskDetailData = {
          ...task,
          title: title.trim(),
          description: description.trim() || null,
          priority,
          dueDate: dueDate || null,
          columnId: columnId || task.columnId,
          columnTitle: chosenCol ? chosenCol.title : task.columnTitle,
          assignees: chosenAssignees,
        };

        setSaveSuccess("Alterações salvas com sucesso!");
        onTaskUpdated?.(updatedData);
        router.refresh();
      } catch (err: any) {
        setSaveError(err.message || "Erro ao salvar alterações da atividade.");
      }
    });
  };

  // Delete task
  const handleDeleteTask = () => {
    if (
      !confirm(
        "Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    startDeleting(async () => {
      try {
        await deleteTask(task.id, task.workspaceId);
        onTaskDeleted?.(task.id);
        onClose();
        router.refresh();
      } catch (err: any) {
        setSaveError(err.message || "Erro ao excluir atividade.");
      }
    });
  };

  // Submit time entry
  const handleTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeFormError(null);

    if (!timeSummary.trim()) {
      setTimeFormError("Descreva sucintamente as atividades executadas.");
      return;
    }

    startLoggingTime(async () => {
      try {
        await createTimeEntry({
          taskId: task.id,
          workspaceId: task.workspaceId,
          taskTitle: title.trim(),
          date: executionDate,
          durationMinutes: Number(durationMinutes),
          summary: timeSummary.trim(),
        });

        const newEntry: TaskTimeEntry = {
          id: `local-${Date.now()}`,
          durationMinutes: Number(durationMinutes),
          summary: timeSummary.trim(),
          date: executionDate,
        };

        setLocalEntries((prev) => [newEntry, ...prev]);
        setSaveSuccess(
          `${formatMinutesToHours(Number(durationMinutes))} apontadas com sucesso nesta atividade!`
        );
        setTimeSummary("");
        setMode("details");
        router.refresh();
      } catch (err: any) {
        setTimeFormError(err.message || "Erro ao registrar horas.");
      }
    });
  };

  const modalContent = (
    <div
      onClick={(e) => {
        // Fechar ao clicar fora da caixa (no backdrop)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col relative animate-in zoom-in-95 duration-150">
        {/* ======================================================== */}
        {/* MODO 1: DETALHES E EDIÇÃO COMPLETA DA ATIVIDADE         */}
        {/* ======================================================== */}
        {mode === "details" && (
          <>
            {/* Header da Tarefa */}
            <div className="flex items-start justify-between border-b border-border pb-3 shrink-0">
              <div className="space-y-1.5 flex-1 pr-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                    {task.workspaceName}
                  </Badge>

                  <Badge variant="secondary" className="text-[10px]">
                    Bucket: {columns.find((c) => c.id === columnId)?.title || task.columnTitle}
                  </Badge>

                  <Badge
                    variant={
                      priority === "URGENT" || priority === "HIGH"
                        ? "destructive"
                        : priority === "MEDIUM"
                        ? "warning"
                        : "outline"
                    }
                    className="text-[10px]"
                  >
                    {priority}
                  </Badge>
                </div>

                {/* Título Editável */}
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da atividade..."
                  className="w-full text-base font-bold text-foreground bg-transparent border border-transparent hover:border-border focus:border-primary focus:bg-muted/30 rounded-md px-2 py-1 outline-none transition-colors"
                  required
                />
              </div>

              {/* Ações do Header (Excluir e Fechar) */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                  title="Excluir atividade"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  title="Fechar (Esc)"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mensagens de Sucesso ou Erro */}
            {saveSuccess && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="font-medium">{saveSuccess}</span>
              </div>
            )}

            {saveError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-2.5 text-xs text-destructive">
                {saveError}
              </div>
            )}

            {/* Conteúdo com Scroll */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Bloco de Ação: Apontamento de Horas Integrado na Mesma Caixa */}
              <div className="rounded-xl border border-primary/20 dark:border-primary/40 bg-primary/5 dark:bg-primary/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-primary dark:text-emerald-400 text-xs">
                    <Clock className="h-4 w-4 text-primary dark:text-emerald-400 shrink-0" />
                    <span>Horas Registradas Nesta Atividade:</span>
                    <span className="font-extrabold text-foreground ml-1">
                      {formatMinutesToHours(totalMinutes)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground dark:text-zinc-300">
                    Lance o tempo dedicado a esta pesquisa para a validação da sua carga horária.
                  </p>
                </div>

                <Button
                  size="sm"
                  type="button"
                  onClick={() => {
                    setSaveSuccess(null);
                    setMode("log-time");
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5 shadow-xs text-xs h-8 shrink-0 cursor-pointer"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Apontar Horas</span>
                </Button>
              </div>

              {/* Grid de Campos Editáveis: Bucket/Coluna, Prioridade e Prazo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Mover de Bucket / Coluna */}
                <div className="space-y-1 rounded-lg border border-border/70 p-2.5 bg-card">
                  <label className="text-[10px] font-semibold text-muted-foreground dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                    <ColumnsIcon className="h-3 w-3 text-primary dark:text-emerald-400" /> Coluna / Bucket
                  </label>
                  <select
                    value={columnId}
                    onChange={(e) => setColumnId(e.target.value)}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {columns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Prioridade */}
                <div className="space-y-1 rounded-lg border border-border/70 p-2.5 bg-card">
                  <label className="text-[10px] font-semibold text-muted-foreground dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                    <Flag className="h-3 w-3 text-primary dark:text-emerald-400" /> Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>

                {/* 3. Prazo de Conclusão */}
                <div className="space-y-1 rounded-lg border border-border/70 p-2.5 bg-card">
                  <label className="text-[10px] font-semibold text-muted-foreground dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary dark:text-emerald-400" /> Prazo de Conclusão
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* 4. Integrantes Atribuídos (Seleção Interativa com Badges) */}
              <div className="rounded-lg border border-border/70 p-3 space-y-2 bg-card">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-muted-foreground dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                    <User className="h-3 w-3 text-primary dark:text-emerald-400" /> Integrantes Atribuídos
                  </label>
                  <span className="text-[10px] text-muted-foreground dark:text-zinc-400">
                    Clique no integrante para atribuir ou desatribuir
                  </span>
                </div>

                {availableMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nenhum integrante cadastrado no sistema.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {availableMembers.map((m) => {
                      const isAssigned = selectedAssigneeIds.includes(m.id);
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => {
                            if (isAssigned) {
                              setSelectedAssigneeIds((prev) => prev.filter((id) => id !== m.id));
                            } else {
                              setSelectedAssigneeIds((prev) => [...prev, m.id]);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-all cursor-pointer",
                            isAssigned
                              ? "bg-primary/10 dark:bg-emerald-950/60 border-primary dark:border-emerald-600 text-primary dark:text-emerald-300 shadow-2xs font-semibold"
                              : "bg-muted/40 border-border text-muted-foreground dark:text-zinc-300 hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={m.image || undefined} />
                            <AvatarFallback className="text-[8px] font-bold">
                              {m.name ? m.name[0] : "P"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{m.name || m.email || "Pesquisador"}</span>
                          {isAssigned && <span className="text-[10px] font-bold ml-0.5 text-primary dark:text-emerald-400">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 5. Descrição & Metodologia (Editável) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground dark:text-zinc-100 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary dark:text-emerald-400" />
                  Descrição & Metodologia
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Informações técnicas, procedimentos, reagentes, links e referências para a execução desta atividade..."
                  className="w-full rounded-lg border border-input bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Histórico de Apontamentos da Atividade */}
              {localEntries.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <span className="text-[11px] font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-secondary" />
                    Histórico de Apontamentos Nesta Tarefa ({localEntries.length})
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {localEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-lg border border-border/60 bg-muted/20 p-2 flex items-start justify-between gap-2 text-[11px]"
                      >
                        <p className="text-muted-foreground line-clamp-2">
                          {entry.summary}
                        </p>
                        <div className="text-right shrink-0">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono font-bold text-primary"
                          >
                            {formatMinutesToHours(entry.durationMinutes)}
                          </Badge>
                          <span className="block text-[9px] text-muted-foreground mt-0.5">
                            {new Date(entry.date).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé: Botão de Salvar Alterações */}
            <div className="flex items-center justify-between pt-3 border-t border-border shrink-0">
              <span className="text-[11px] text-muted-foreground">
                Edite os campos e clique em Salvar Alterações.
              </span>

              <Button
                type="button"
                size="sm"
                disabled={isSavingTask}
                onClick={() => handleSaveTask()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
              >
                {isSavingTask ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>Salvar Alterações</span>
              </Button>
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* MODO 2: FORMULÁRIO DE APONTAMENTO INTEGRADO              */}
        {/* ======================================================== */}
        {mode === "log-time" && (
          <form onSubmit={handleTimeSubmit} className="space-y-4">
            {/* Header com Navegação de Volta para Detalhes */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <button
                  type="button"
                  onClick={() => setMode("details")}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold mb-1 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Voltar aos detalhes da atividade</span>
                </button>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-bold text-foreground">
                    Apontamento de Horas de Trabalho
                  </h3>
                </div>
              </div>

              {/* Botão Único de Fechar (X) */}
              <button
                type="button"
                onClick={onClose}
                title="Fechar (Esc)"
                className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors p-1.5 rounded-lg shrink-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {timeFormError && (
              <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
                {timeFormError}
              </div>
            )}

            {/* Banner da Tarefa Vinculada */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">
                  Atividade Vinculada
                </span>
                <p className="text-xs font-semibold text-foreground mt-0.5">
                  [{task.workspaceName}] {title || task.title}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30 shrink-0">
                {formatMinutesToHours(totalMinutes)} acumuladas
              </Badge>
            </div>

            {/* Tempo Gasto e Data da Execução */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Tempo Gasto (Minutos)
                </label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
                <span className="text-[10px] text-muted-foreground block">
                  = {formatMinutesToHours(durationMinutes)}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Data da Execução
                </label>
                <input
                  type="date"
                  value={executionDate}
                  onChange={(e) => setExecutionDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Resumo Técnico */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Resumo das Atividades Executadas
              </label>
              <textarea
                rows={3}
                value={timeSummary}
                onChange={(e) => setTimeSummary(e.target.value)}
                placeholder="Descreva sucintamente o progresso técnico, metodologias aplicadas e resultados alcançados..."
                className="w-full rounded-md border border-input bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                required
              />
            </div>

            {/* Rodapé de Ações do Formulário */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoggingTime}
                onClick={() => setMode("details")}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoggingTime}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold"
              >
                {isLoggingTime && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Confirmar Apontamento
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
