"use client";

import React, { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { BookOpen, X, Loader2, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDocument } from "@/app/actions";

interface WorkspaceOption {
  id: string;
  name: string;
}

interface CreateDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  workspaces?: WorkspaceOption[];
}

export function CreateDocumentDialog({
  isOpen,
  onClose,
  workspaceId,
  workspaces = [],
}: CreateDocumentDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("📄");
  const [selectedWsId, setSelectedWsId] = useState(workspaceId || "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const emojiPresets = ["📄", "🧬", "🧪", "📊", "🔬", "📝", "💡", "🎯"];

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

    if (!title.trim()) {
      setErrorMsg("O título da página é obrigatório.");
      return;
    }

    startTransition(async () => {
      try {
        await createDocument({
          title: title.trim(),
          icon: icon || "📄",
          workspaceId: selectedWsId || undefined,
          type: selectedWsId ? "WORKSPACE" : "PERSONAL",
        });
        setTitle("");
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || "Erro ao criar documento.");
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
            <BookOpen className="h-5 w-5 text-secondary" />
            <h3 className="text-base font-bold text-foreground">
              Nova Página de Documentação
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
          {/* Escolha do Ícone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Ícone da Página
            </label>
            <div className="flex items-center gap-2">
              <span className="text-2xl p-1 bg-muted rounded-md">{icon}</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {emojiPresets.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setIcon(e)}
                    className={`h-8 w-8 text-base rounded-md border transition-all ${
                      icon === e ? "border-secondary bg-secondary/15" : "border-border hover:bg-muted"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Título da Página *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Protocolo de Extração e Sequenciamento"
              className="text-xs h-9"
              required
            />
          </div>

          {workspaces.length > 0 && !workspaceId && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Espaço de Trabalho (Opcional)
              </label>
              <select
                value={selectedWsId}
                onChange={(e) => setSelectedWsId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
              >
                <option value="">Caderno Pessoal (Apenas Você)</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} (Compartilhado)
                  </option>
                ))}
              </select>
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
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Criar Página
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
