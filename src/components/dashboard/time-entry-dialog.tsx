"use client";

import React, { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { Clock, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMinutesToHours } from "@/lib/utils";
import { createTimeEntry } from "@/app/actions";

interface AvailableTask {
  id: string;
  title: string;
  workspaceName: string;
  workspaceId: string;
}

interface TimeEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tasks?: AvailableTask[];
  initialTaskId?: string;
  initialTaskTitle?: string;
}

export function TimeEntryDialog({
  isOpen,
  onClose,
  tasks = [],
  initialTaskId = "",
  initialTaskTitle = "",
}: TimeEntryDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    initialTaskId || (tasks.length === 1 ? tasks[0].id : "")
  );
  const [customTitle, setCustomTitle] = useState(
    initialTaskId || tasks.length === 1 ? "" : initialTaskTitle
  );
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [executionDate, setExecutionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [summary, setSummary] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedTaskId(initialTaskId || (tasks.length === 1 ? tasks[0].id : ""));
      setCustomTitle(initialTaskId || tasks.length === 1 ? "" : initialTaskTitle);
      setErrorMsg(null);
    }
  }, [isOpen, initialTaskId, tasks, initialTaskTitle]);

  // Fechar ao pressionar a tecla Escape
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

  if (!isOpen || !mounted) return null;

  const chosenTask = tasks.find((t) => t.id === selectedTaskId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      try {
        await createTimeEntry({
          taskId: selectedTaskId || undefined,
          workspaceId: chosenTask?.workspaceId || undefined,
          taskTitle: chosenTask?.title || customTitle || "Atividade de Pesquisa",
          date: executionDate,
          durationMinutes: Number(durationMinutes),
          summary: summary,
        });

        // Reset e fecha
        setSummary("");
        setSelectedTaskId("");
        setCustomTitle("");
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || "Erro ao salvar o apontamento de horas.");
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
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Apontamento de Horas de Trabalho
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Fechar (Esc)"
            className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção ou vinculação de Tarefa */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Atividade / Tarefa Vinculada
            </label>
            {initialTaskId && chosenTask ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">
                    Atividade Vinculada
                  </span>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    [{chosenTask.workspaceName}] {chosenTask.title}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                  Kanban
                </span>
              </div>
            ) : tasks.length > 0 ? (
              <select
                value={selectedTaskId}
                onChange={(e) => {
                  setSelectedTaskId(e.target.value);
                  if (e.target.value) setCustomTitle("");
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Digitar atividade avulsa ou selecionar tarefa --</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    [{task.workspaceName}] {task.title}
                  </option>
                ))}
              </select>
            ) : null}

            {!initialTaskId && !selectedTaskId && (
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Ex: Análise estatística de dados genômicos no R"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary mt-1.5"
                required
              />
            )}
          </div>

          {/* Duração e Data */}
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

          {/* Resumo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Resumo das Atividades Executadas
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Descreva suscintamente o progresso técnico, metodologias aplicadas e resultados alcançados..."
              className="w-full rounded-md border border-input bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              required
            />
          </div>

          {/* Rodapé do Formulário */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Confirmar Apontamento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
