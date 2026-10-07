"use client";

import React, { useTransition, useState } from "react";
import {
  ShieldCheck,
  Check,
  X,
  Loader2,
  Users,
  FolderGit2,
  UserCheck,
  GraduationCap,
  Phone,
  Hash,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveWorkspace, rejectWorkspace } from "@/app/actions";
import { TriageApprovalDialog } from "@/components/dashboard/triage-approval-dialog";

export interface PendingWorkspaceItem {
  id: string;
  name: string;
  department?: string | null;
  description?: string | null;
  createdAt: Date;
  requestedBy: {
    name?: string | null;
    email?: string | null;
    course?: string | null;
  };
}

export interface PendingUserItem {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  academicId: string | null;
  phone: string | null;
  course: string | null;
  createdAt: Date;
}

export interface WorkspaceOption {
  id: string;
  name: string;
  department?: string | null;
}

interface PendingApprovalsProps {
  workspaces?: PendingWorkspaceItem[];
  pendingUsers?: PendingUserItem[];
  activeWorkspaces?: WorkspaceOption[];
}

export function PendingApprovals({
  workspaces = [],
  pendingUsers = [],
  activeWorkspaces = [],
}: PendingApprovalsProps) {
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [triageUser, setTriageUser] = useState<PendingUserItem | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "workspaces">(
    pendingUsers.length > 0 ? "users" : "workspaces"
  );

  const totalPending = workspaces.length + pendingUsers.length;

  if (totalPending === 0) {
    return null;
  }

  const handleApproveWs = (id: string, name: string) => {
    setProcessingId(id);
    startTransition(async () => {
      try {
        await approveWorkspace(id);
        setFeedback(`Espaço de trabalho "${name}" aprovado com sucesso.`);
      } catch (err: any) {
        setFeedback(err.message || "Erro ao aprovar workspace.");
      } finally {
        setProcessingId(null);
      }
    });
  };

  const handleRejectWs = (id: string, name: string) => {
    const reason = window.prompt("Informe a justificativa da recusa:") || undefined;
    setProcessingId(id);
    startTransition(async () => {
      try {
        await rejectWorkspace(id, reason);
        setFeedback(`Espaço de trabalho "${name}" recusado.`);
      } catch (err: any) {
        setFeedback(err.message || "Erro ao recusar workspace.");
      } finally {
        setProcessingId(null);
      }
    });
  };

  return (
    <>
      <Card className="border-l-4 border-l-amber-500 border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/40 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <CardTitle className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Painel da Coordenação: Solicitações Pendentes de Homologação
                </CardTitle>
                <CardDescription className="text-xs text-amber-800/80 dark:text-amber-300/80">
                  Realize a triagem de novos integrantes e aprove a abertura de braços de pesquisa.
                </CardDescription>
              </div>
            </div>
            <Badge variant="warning">
              {totalPending} {totalPending === 1 ? "Pendente" : "Pendentes"}
            </Badge>
          </div>

          {/* Abas / Filtros */}
          <div className="flex items-center gap-2 pt-3 border-t border-amber-200/60 dark:border-amber-900/40 mt-2">
            {pendingUsers.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={`text-xs px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === "users"
                    ? "bg-amber-500 text-white shadow-2xs"
                    : "text-amber-900 dark:text-amber-200 hover:bg-amber-100/70"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Novos Integrantes ({pendingUsers.length})
              </button>
            )}

            {workspaces.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("workspaces")}
                className={`text-xs px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === "workspaces"
                    ? "bg-amber-500 text-white shadow-2xs"
                    : "text-amber-900 dark:text-amber-200 hover:bg-amber-100/70"
                }`}
              >
                <FolderGit2 className="h-3.5 w-3.5" />
                Espaços de Trabalho ({workspaces.length})
              </button>
            )}
          </div>

          {feedback && (
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mt-2">
              ✓ {feedback}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 1. Lista de Membros Aguardando Triagem */}
          {activeTab === "users" && (
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg border border-amber-200/80 dark:border-amber-900/60 bg-white dark:bg-background p-4 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {user.name || "Integrante UNIFESP"}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {user.email}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-1">
                      {user.academicId && (
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3 text-primary" />
                          RA: <strong className="text-foreground">{user.academicId}</strong>
                        </span>
                      )}
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-primary" />
                          Contato: <strong className="text-foreground">{user.phone}</strong>
                        </span>
                      )}
                      {user.course && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3 text-secondary" />
                          Curso: <strong className="text-foreground">{user.course}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => setTriageUser(user)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8 shadow-xs font-semibold gap-1.5"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Fazer Triagem & Homologar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Lista de Workspaces Pendentes */}
          {activeTab === "workspaces" && (
            <div className="space-y-3">
              {workspaces.map((ws) => {
                const isCurrentLoading = isPending && processingId === ws.id;

                return (
                  <div
                    key={ws.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg border border-amber-200/80 dark:border-amber-900/60 bg-white dark:bg-background p-4 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{ws.name}</span>
                        {ws.department && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            {ws.department}
                          </Badge>
                        )}
                      </div>
                      {ws.description && (
                        <p className="text-xs text-muted-foreground">{ws.description}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground/80 pt-1">
                        Solicitado por:{" "}
                        <span className="font-medium text-foreground">
                          {ws.requestedBy.name || ws.requestedBy.email || "Integrante"}
                        </span>{" "}
                        • {new Date(ws.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isCurrentLoading}
                        className="border-red-200 text-red-700 hover:bg-red-50 text-xs h-8"
                        onClick={() => handleRejectWs(ws.id, ws.name)}
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Recusar
                      </Button>
                      <Button
                        size="sm"
                        disabled={isCurrentLoading}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8 shadow-xs"
                        onClick={() => handleApproveWs(ws.id, ws.name)}
                      >
                        {isCurrentLoading ? (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="mr-1 h-3.5 w-3.5" />
                        )}
                        Aprovar Workspace
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Triagem e Alocação */}
      {triageUser && (
        <TriageApprovalDialog
          isOpen={!!triageUser}
          onClose={() => setTriageUser(null)}
          user={triageUser}
          workspaces={activeWorkspaces}
        />
      )}
    </>
  );
}
