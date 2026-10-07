"use client";

import React, { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { KanbanSquare, X, Loader2, Plus, Calendar, Flag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTask } from "@/app/actions";
import { cn } from "@/lib/utils";
import type { WorkspaceMemberInfo } from "@/components/kanban/task-detail-dialog";

interface ColumnOption {
  id: string;
  title: string;
}

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  columns?: ColumnOption[];
  defaultColumnId?: string;
  workspaceMembers?: WorkspaceMemberInfo[];
}

export function CreateTaskDialog({
  isOpen,
  onClose,
  workspaceId,
  columns = [],
  defaultColumnId,
  workspaceMembers = [],
}: CreateTaskDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState(defaultColumnId || columns[0]?.id || "");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (defaultColumnId) {
      setColumnId(defaultColumnId);
    } else if (columns.length > 0 && !columnId) {
      setColumnId(columns[0].id);
    }
  }, [columns, columnId, defaultColumnId, isOpen]);

  // Fechar no Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("O título da atividade é obrigatório.");
      return;
    }

    startTransition(async () => {
      try {
        await createTask({
          workspaceId,
          columnId: columnId || undefined,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || undefined,
          allowSelfAssign: true,
          assigneeUserIds: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : undefined,
        });
        setTitle("");
        setDescription("");
        setDueDate("");
        setSelectedAssigneeIds([]);
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || "Erro ao criar atividade.");
      }
    });
  };

  const modalContent = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <KanbanSquare className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Nova Atividade no Kanban
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
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Título da Atividade *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Padronização do ensaio de citotoxicidade"
              className="text-xs h-9"
              required
            />
          </div>

          {columns.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Coluna Inicial
              </label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Data de Entrega
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Detalhes / Metodologia
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Informações técnicas, reagentes e referências para execução..."
              className="w-full rounded-md border border-input bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {workspaceMembers.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3 text-primary" /> Atribuir Integrantes (Opcional)
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  {selectedAssigneeIds.length} selecionado(s)
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-md border border-input bg-background/50">
                {workspaceMembers.map((m) => {
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
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border transition-all cursor-pointer",
                        isAssigned
                          ? "bg-primary/10 border-primary text-primary font-semibold"
                          : "bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span>{m.name || m.email || "Integrante"}</span>
                      {isAssigned && <span className="text-[10px] font-bold text-primary">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Criar Atividade
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
