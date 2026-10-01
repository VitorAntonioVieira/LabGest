"use client";

import React, { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { FolderGit2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestWorkspace } from "@/app/actions";

interface RequestWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestWorkspaceDialog({ isOpen, onClose }: RequestWorkspaceDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

    if (!name.trim()) {
      setErrorMsg("O nome do espaço de trabalho é obrigatório.");
      return;
    }

    startTransition(async () => {
      try {
        await requestWorkspace({
          name: name.trim(),
          department: department.trim() || undefined,
          description: description.trim() || undefined,
        });
        setName("");
        setDepartment("");
        setDescription("");
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || "Erro ao solicitar espaço de trabalho.");
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
            <FolderGit2 className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Solicitar Novo Espaço de Trabalho
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
              Nome do Braço / Espaço de Pesquisa *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Farmácia Clínica & Terapêutica"
              className="text-xs h-9"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Departamento / Instituto UNIFESP
            </label>
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Ex: Departamento de Ciências Farmacêuticas"
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Resumo / Escopo de Pesquisa
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva os objetivos científicos, linhas de atuação e metodologias deste braço..."
              className="w-full rounded-md border border-input bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

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
              Submeter Solicitação
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
