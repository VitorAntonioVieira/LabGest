"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Shield,
  User,
  Users,
  Check,
  Tag,
  AlertCircle,
  Briefcase,
  Layers,
  Sparkles,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateMemberRoleAndAttributions } from "@/app/actions";
import { SYSTEM_PERMISSIONS, type MemberSummary, type AttributionSummary, type UserRole, type UserStatus } from "@/types";

interface EditMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberSummary | null;
  allAttributions: AttributionSummary[];
  onSuccess: () => void;
}

export function EditMemberDialog({
  isOpen,
  onClose,
  member,
  allAttributions,
  onSuccess,
}: EditMemberDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [status, setStatus] = useState<UserStatus>("ACTIVE");
  const [selectedAttrIds, setSelectedAttrIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (member) {
      setRole(member.role);
      setStatus(member.status);
      setSelectedAttrIds(member.attributions.map((a) => a.id));
      setError(null);
    }
  }, [member]);

  if (!mounted || !isOpen || !member) return null;

  // Calcula todas as permissões concedidas pelas atribuições selecionadas + papel
  const isProfessor = role === "PROFESSOR";
  const permissionsFromAttrs = new Set<string>();
  allAttributions
    .filter((a) => selectedAttrIds.includes(a.id))
    .forEach((a) => {
      a.permissions.forEach((p) => permissionsFromAttrs.add(p));
    });

  const toggleAttribution = (attrId: string) => {
    setSelectedAttrIds((prev) =>
      prev.includes(attrId) ? prev.filter((id) => id !== attrId) : [...prev, attrId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await updateMemberRoleAndAttributions({
        userId: member.id,
        role,
        status,
        attributionIds: selectedAttrIds,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Falha ao salvar as alterações do integrante.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Gerenciar Papel & Atribuições
              </h2>
              <p className="text-xs text-muted-foreground truncate max-w-sm">
                {member.name || "Integrante"} • {member.email}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Função / Papel Base Institucional */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              1. Função Institucional no Laboratório
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Professor */}
              <label
                className={`relative flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                  role === "PROFESSOR"
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary shadow-xs"
                    : "border-border hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-foreground">Professor</span>
                  <input
                    type="radio"
                    name="member-role"
                    checked={role === "PROFESSOR"}
                    onChange={() => setRole("PROFESSOR")}
                    className="accent-primary"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Coordenação Geral, aprovação total e administração.
                </span>
              </label>

              {/* Líder (Gestão) */}
              <label
                className={`relative flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                  role === "LEADER"
                    ? "border-secondary bg-secondary/10 text-foreground ring-1 ring-secondary shadow-xs"
                    : "border-border hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-foreground">Líder (Gestão)</span>
                  <input
                    type="radio"
                    name="member-role"
                    checked={role === "LEADER"}
                    onChange={() => setRole("LEADER")}
                    className="accent-secondary"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Gestão de equipes, projetos e acompanhamento.
                </span>
              </label>

              {/* Integrante */}
              <label
                className={`relative flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                  role === "STUDENT"
                    ? "border-emerald-600 bg-emerald-500/10 text-foreground ring-1 ring-emerald-600 shadow-xs"
                    : "border-border hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-foreground">Integrante</span>
                  <input
                    type="radio"
                    name="member-role"
                    checked={role === "STUDENT"}
                    onChange={() => setRole("STUDENT")}
                    className="accent-emerald-600"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Membro de equipe, bolsista ou colaborador técnico.
                </span>
              </label>
            </div>
          </div>

          {/* 2. Status do Ciclo de Vida */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              2. Status do Cadastro
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { val: "ACTIVE", label: "Ativo", desc: "Acesso regular" },
                { val: "WAITING_APPROVAL", label: "Na Sala de Espera", desc: "Aguardando homologação" },
                { val: "PENDING", label: "Pendente", desc: "Perfil incompleto" },
                { val: "SUSPENDED", label: "Suspenso", desc: "Acesso bloqueado" },
              ].map((st) => (
                <label
                  key={st.val}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    status === st.val
                      ? "border-primary bg-primary/10 text-foreground font-semibold"
                      : "border-border hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{st.label}</span>
                    <input
                      type="radio"
                      name="member-status"
                      checked={status === st.val}
                      onChange={() => setStatus(st.val as UserStatus)}
                      className="accent-primary h-3.5 w-3.5"
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Múltiplas Atribuições no Laboratório */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" />
                3. Atribuições do Integrante (Permite Múltiplas)
              </label>
              <span className="text-[11px] text-muted-foreground font-medium">
                {selectedAttrIds.length} selecionada(s)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cada integrante pode acumular uma ou mais atribuições no laboratório (como Gestão, Pesquisa, TI, Comunicação).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1 rounded-xl border border-border/60 bg-muted/10">
              {allAttributions.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 italic">
                  Nenhuma atribuição customizada cadastrada. Crie uma na aba &quot;Atribuições & Permissões&quot;.
                </p>
              ) : (
                allAttributions.map((attr) => {
                  const isChecked = selectedAttrIds.includes(attr.id);
                  return (
                    <div
                      key={attr.id}
                      onClick={() => toggleAttribution(attr.id)}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? "border-primary/50 bg-primary/5 shadow-2xs"
                          : "border-border/70 hover:bg-muted/40"
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

                      <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: attr.color }}
                          />
                          <span className="font-bold text-xs text-foreground truncate">
                            {attr.name}
                          </span>
                        </div>
                        {attr.description && (
                          <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                            {attr.description}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 4. Resumo de Permissões e Acesso aos Módulos */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Acesso aos Módulos do Sistema
              </span>
              {isProfessor && (
                <Badge variant="default" className="text-[10px] bg-primary">
                  Acesso Total (Coordenação)
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isProfessor
                ? "Como Professor, este usuário possui acesso irrestrito a todos os módulos e configurações da plataforma."
                : "Módulos liberados para este usuário a partir do papel institucional e da combinação de suas atribuições:"}
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {SYSTEM_PERMISSIONS.map((perm) => {
                const hasAccess = isProfessor || permissionsFromAttrs.has(perm.id);
                return (
                  <Badge
                    key={perm.id}
                    variant={hasAccess ? "default" : "outline"}
                    className={`text-[10px] px-2 py-0.5 font-medium transition-colors ${
                      hasAccess
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "opacity-40 text-muted-foreground line-through decoration-muted-foreground/60 border-dashed"
                    }`}
                  >
                    {perm.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-2 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
