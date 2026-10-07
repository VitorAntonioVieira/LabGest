"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Tag,
  Check,
  AlertCircle,
  Sliders,
  Shield,
  Trash2,
  Palette,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createLabAttribution,
  updateLabAttribution,
  deleteLabAttribution,
} from "@/app/actions";
import {
  SYSTEM_PERMISSIONS,
  type AttributionSummary,
  type LabModulePermission,
} from "@/types";

interface AttributionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attributionToEdit?: AttributionSummary | null;
  onSuccess: () => void;
}

const COLOR_PRESETS = [
  { label: "Verde Lab CTPP", hex: "#0E4330" },
  { label: "Azul Petróleo", hex: "#24576C" },
  { label: "Esmeralda", hex: "#059669" },
  { label: "Índigo / TI", hex: "#4F46E5" },
  { label: "Laranja Queimado", hex: "#D97706" },
  { label: "Violeta", hex: "#7C3AED" },
  { label: "Rosa Quente", hex: "#DB2777" },
  { label: "Ciano Tecnológico", hex: "#0891B2" },
];

export function AttributionDialog({
  isOpen,
  onClose,
  attributionToEdit,
  onSuccess,
}: AttributionDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#0E4330");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (attributionToEdit) {
      setName(attributionToEdit.name);
      setDescription(attributionToEdit.description || "");
      setColor(attributionToEdit.color);
      setSelectedPermissions(attributionToEdit.permissions || []);
    } else {
      setName("");
      setDescription("");
      setColor("#0E4330");
      setSelectedPermissions([
        "workspaces",
        "time_tracking",
        "docs",
        "calendar",
        "members_view",
      ]);
    }
    setError(null);
  }, [attributionToEdit, isOpen]);

  if (!mounted || !isOpen) return null;

  const isEditing = !!attributionToEdit;

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((p) => p !== permId)
        : [...prev, permId]
    );
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(SYSTEM_PERMISSIONS.map((p) => p.id));
  };

  const clearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome da atribuição é obrigatório.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (isEditing && attributionToEdit) {
        await updateLabAttribution({
          id: attributionToEdit.id,
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          permissions: selectedPermissions,
        });
      } else {
        await createLabAttribution({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          permissions: selectedPermissions,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Falha ao salvar a atribuição.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!attributionToEdit) return;
    if (
      !confirm(
        `Tem certeza de que deseja remover a atribuição "${attributionToEdit.name}"? Os integrantes perderão este vínculo.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteLabAttribution(attributionToEdit.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Falha ao excluir atribuição.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Agrupamento por categorias
  const categories = ["Operacional", "Coordenação", "Administrativo"] as const;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isEditing ? "Editar Atribuição" : "Nova Atribuição do Laboratório"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Defina o nome, cor de identificação e quais módulos do sistema ela libera.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Nome e Cor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nome da Atribuição *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Gestão & Operações, TI & Infra, Comunicação..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Palette className="h-3.5 w-3.5" /> Cor do Badge
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-12 rounded-lg border border-input bg-transparent cursor-pointer p-0.5"
                />
                <span className="font-mono text-xs text-muted-foreground uppercase">{color}</span>
              </div>
            </div>
          </div>

          {/* Presets de Cor */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-muted-foreground mr-1">Sugestões:</span>
            {COLOR_PRESETS.map((cp) => (
              <button
                type="button"
                key={cp.hex}
                onClick={() => setColor(cp.hex)}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] border transition-transform ${
                  color.toLowerCase() === cp.hex.toLowerCase()
                    ? "ring-2 ring-primary scale-105 border-transparent text-foreground font-bold"
                    : "border-border/60 hover:scale-105 text-muted-foreground"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cp.hex }}
                />
                {cp.label}
              </button>
            ))}
          </div>

          {/* 2. Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Descrição de Atuação
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva as responsabilidades e escopo de quem tem esta atribuição no laboratório..."
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* 3. Matriz de Permissões de Acesso */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-primary" />
                Partes do Sistema com Acesso Liberado
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllPermissions}
                  className="text-[11px] text-primary hover:underline font-semibold"
                >
                  Selecionar Todas
                </button>
                <span className="text-muted-foreground text-xs">•</span>
                <button
                  type="button"
                  onClick={clearAllPermissions}
                  className="text-[11px] text-muted-foreground hover:underline"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {categories.map((cat) => {
                const permsInCat = SYSTEM_PERMISSIONS.filter(
                  (p) => p.category === cat
                );
                return (
                  <div key={cat} className="space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                      {cat}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {permsInCat.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.id);
                        return (
                          <div
                            key={perm.id}
                            onClick={() => togglePermission(perm.id)}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? "border-primary/50 bg-primary/5"
                                : "border-border/60 hover:bg-muted/30"
                            }`}
                          >
                            <div
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border mt-0.5 transition-colors ${
                                isChecked
                                  ? "bg-primary border-primary text-white"
                                  : "border-muted-foreground/40 bg-background"
                              }`}
                            >
                              {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="font-semibold text-xs text-foreground">
                                {perm.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                                {perm.description}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border/60">
            {isEditing ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? "Excluindo..." : "Excluir Atribuição"}
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || isDeleting}
                className="gap-2 bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                {isSubmitting ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Atribuição"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
