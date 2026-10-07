"use client";

import React, { useState, useTransition } from "react";
import {
  UserCheck,
  X,
  Loader2,
  ShieldCheck,
  GraduationCap,
  Phone,
  Hash,
  FolderGit2,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { triageAndApproveUser, rejectPendingUser } from "@/app/actions";

interface PendingUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  academicId: string | null;
  phone: string | null;
  course: string | null;
  createdAt: Date;
}

interface WorkspaceOption {
  id: string;
  name: string;
  department?: string | null;
}

interface TriageApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: PendingUser | null;
  workspaces: WorkspaceOption[];
}

export function TriageApprovalDialog({
  isOpen,
  onClose,
  user,
  workspaces,
}: TriageApprovalDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedRole, setSelectedRole] = useState<"STUDENT" | "LEADER">("STUDENT");
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const toggleWorkspace = (id: string) => {
    setSelectedWorkspaceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApprove = () => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await triageAndApproveUser({
          userId: user.id,
          role: selectedRole,
          workspaceIds: selectedWorkspaceIds,
        });
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || "Erro ao aprovar usuário.");
      }
    });
  };

  const handleReject = () => {
    if (!window.confirm(`Tem certeza que deseja recusar o ingresso de ${user.name || user.email}?`)) {
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await rejectPendingUser(user.id);
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || "Erro ao recusar usuário.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-base font-bold text-foreground">
                Triagem e Homologação de Membro
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Defina o papel hierárquico e aloque o membro nos braços do Living Lab.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive shrink-0">
            {errorMsg}
          </div>
        )}

        {/* Conteúdo com Scroll Interno Bounded */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {/* Ficha Cadastral do Aluno */}
          <div className="rounded-lg border border-border/80 bg-muted/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground text-sm">
                {user.name || "Integrante"}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {new Date(user.createdAt).toLocaleDateString("pt-BR")}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-muted-foreground block text-[10px]">E-mail Institucional:</span>
                <span className="font-mono text-primary truncate block">{user.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Registro Acadêmico (RA):</span>
                <span className="font-semibold text-foreground">{user.academicId || "Não informado"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">WhatsApp / Contato:</span>
                <span className="font-medium text-foreground">{user.phone || "Não informado"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Curso / Formação:</span>
                <span className="font-medium text-foreground">{user.course || "Não informado"}</span>
              </div>
            </div>
          </div>

          {/* 1. Seleção de Papel (Role) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
              <GraduationCap className="h-4 w-4 text-primary" />
              1. Papel no Living Lab
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedRole === "STUDENT"
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                    : "border-border hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-foreground">Integrante</span>
                  <input
                    type="radio"
                    name="role"
                    checked={selectedRole === "STUDENT"}
                    onChange={() => setSelectedRole("STUDENT")}
                    className="accent-primary"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Acesso aos quadros Kanban, caderno de notas e apontamento de horas.
                </span>
              </label>

              <label
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedRole === "LEADER"
                    ? "border-secondary bg-secondary/5 text-foreground ring-1 ring-secondary"
                    : "border-border hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-foreground">Líder (Gestão)</span>
                  <input
                    type="radio"
                    name="role"
                    checked={selectedRole === "LEADER"}
                    onChange={() => setSelectedRole("LEADER")}
                    className="accent-secondary"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Capacidade de criar colunas, gerenciar membros e coordenar atividades.
                </span>
              </label>
            </div>
          </div>

          {/* 2. Alocação em Braços de Pesquisa (Workspaces) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
              <FolderGit2 className="h-4 w-4 text-primary" />
              2. Alocar nos Braços de Pesquisa (Workspaces)
            </label>
            <p className="text-[11px] text-muted-foreground">
              Selecione em quais espaços de trabalho o membro terá acesso imediato:
            </p>

            {workspaces.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic p-2 border border-dashed rounded-md">
                Nenhum espaço ativo disponível. Você poderá vinculá-lo posteriormente.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto border border-border/70 rounded-lg p-2 bg-muted/20">
                {workspaces.map((ws) => {
                  const isChecked = selectedWorkspaceIds.includes(ws.id);
                  return (
                    <label
                      key={ws.id}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                        isChecked ? "bg-primary/10 text-foreground font-semibold" : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleWorkspace(ws.id)}
                          className="rounded border-input accent-primary h-4 w-4"
                        />
                        <span className="text-xs">{ws.name}</span>
                      </div>
                      {ws.department && (
                        <span className="text-[10px] text-muted-foreground">{ws.department}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-between pt-3 border-t border-border shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleReject}
            className="border-red-200 text-red-600 hover:bg-red-50 text-xs h-9"
          >
            <UserX className="mr-1.5 h-3.5 w-3.5" />
            Recusar Ingresso
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={onClose}
              className="text-xs h-9"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={handleApprove}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-9 font-semibold gap-1.5 shadow-xs"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserCheck className="h-3.5 w-3.5" />
              )}
              Homologar & Atribuir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
