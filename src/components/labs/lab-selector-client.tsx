"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  selectActiveLaboratory,
  requestLabTriage,
  createLaboratory,
} from "@/app/actions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  Users,
  FolderGit2,
  ShieldCheck,
  Loader2,
  LogOut,
  Sparkles,
  Send,
  X,
  Palette,
} from "lucide-react";
import type { LaboratorySummary, UserRole } from "@/types";
import { ROLE_LABELS } from "@/types";

interface LabSelectorClientProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: UserRole;
  };
  activeLabId: string;
  laboratories: LaboratorySummary[];
}

export function LabSelectorClient({
  user,
  activeLabId,
  laboratories,
}: LabSelectorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingLabId, setLoadingLabId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  // Estado para criação de novo laboratório (apenas Professor)
  const [isCreatingLab, setIsCreatingLab] = useState(false);
  const [newLabName, setNewLabName] = useState("");
  const [newLabDept, setNewLabDept] = useState("");
  const [newLabDesc, setNewLabDesc] = useState("");
  const [newLabPrimary, setNewLabPrimary] = useState("#0E4330");
  const [newLabSecondary, setNewLabSecondary] = useState("#24576C");
  const [newLabEmail, setNewLabEmail] = useState(user.email || "");

  const approvedLabs = laboratories.filter((l) => l.membershipStatus === "ACTIVE");
  const waitingLabs = laboratories.filter((l) => l.membershipStatus === "WAITING_APPROVAL");
  const availableToRequestLabs = laboratories.filter(
    (l) => !l.membershipStatus || l.membershipStatus === "REJECTED"
  );

  const handleEnterLab = (labId: string) => {
    setFeedback(null);
    setLoadingLabId(labId);
    startTransition(async () => {
      try {
        await selectActiveLaboratory(labId);
        router.push("/");
        router.refresh();
      } catch (err: any) {
        setFeedback({
          type: "error",
          message: err.message || "Não foi possível acessar o laboratório.",
        });
        setLoadingLabId(null);
      }
    });
  };

  const handleRequestTriage = (labId: string, labName: string) => {
    setFeedback(null);
    setLoadingLabId(labId);
    startTransition(async () => {
      try {
        await requestLabTriage(labId);
        setFeedback({
          type: "success",
          message: `Pedido de triagem enviado para "${labName}". O Responsável do laboratório e os Líderes foram notificados!`,
        });
        router.refresh();
      } catch (err: any) {
        setFeedback({
          type: "error",
          message: err.message || "Erro ao solicitar triagem no laboratório.",
        });
      } finally {
        setLoadingLabId(null);
      }
    });
  };

  const handleCreateLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabName.trim()) return;
    setFeedback(null);
    setLoadingLabId("create-new");

    startTransition(async () => {
      try {
        const res = await createLaboratory({
          name: newLabName.trim(),
          departmentName: newLabDept.trim() || "Laboratório de Pesquisa",
          description: newLabDesc.trim() || undefined,
          primaryColor: newLabPrimary,
          secondaryColor: newLabSecondary,
          supportEmail: newLabEmail.trim() || undefined,
        });
        setIsCreatingLab(false);
        setNewLabName("");
        setNewLabDept("");
        setNewLabDesc("");
        router.push("/");
        router.refresh();
      } catch (err: any) {
        setFeedback({
          type: "error",
          message: err.message || "Erro ao criar novo laboratório.",
        });
        setLoadingLabId(null);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Bar do Portal Multi-Tenant */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border/80 bg-card/95 p-5 shadow-xs backdrop-blur">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-xs shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Portal Multi-Laboratórios • LabGest UNIFESP
                </h1>
                <Badge variant="lab" className="text-[10px]">
                  Multi-Tenant
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Selecione um laboratório homologado para acessar ou solicite triagem em novos laboratórios.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="flex items-center gap-2.5 pr-2 border-r border-border">
              <Avatar className="h-8 w-8 border border-primary/20">
                <AvatarImage src={user.image || undefined} alt={user.name || "Usuário"} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {user.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                    : "UN"}
                </AvatarFallback>
              </Avatar>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-foreground leading-none">
                  {user.name || "Integrante UNIFESP"}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground mt-1">
                  {user.email}
                </p>
              </div>
            </div>

            {user.role === "PROFESSOR" && (
              <Button
                type="button"
                size="sm"
                variant={isCreatingLab ? "secondary" : "outline"}
                onClick={() => setIsCreatingLab(!isCreatingLab)}
                className="text-xs h-9 gap-1.5 font-semibold"
              >
                {isCreatingLab ? (
                  <>
                    <X className="h-3.5 w-3.5" />
                    Fechar Cadastro
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-3.5 w-3.5 text-primary" />
                    Novo Laboratório
                  </>
                )}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-muted-foreground hover:text-destructive h-9 gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`rounded-xl border p-4 text-xs font-medium flex items-center justify-between ${
              feedback.type === "success"
                ? "border-emerald-300 bg-emerald-50/90 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
                : "border-red-300 bg-red-50/90 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200"
            }`}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-current opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Formulário Inline de Criação de Novo Laboratório (Restrito a Professores) */}
        {isCreatingLab && user.role === "PROFESSOR" && (
          <Card className="border-2 border-primary/30 shadow-md bg-card/95 animate-in fade-in duration-150">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      Cadastrar Novo Laboratório (Tenant)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      O novo laboratório será servido neste mesmo endpoint com isolamento de dados e identidade White-label própria.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="lab" className="text-[10px]">
                  White-label Individual
                </Badge>
              </div>
            </CardHeader>
            <form onSubmit={handleCreateLab}>
              <CardContent className="pt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Nome do Laboratório *
                  </label>
                  <Input
                    value={newLabName}
                    onChange={(e) => setNewLabName(e.target.value)}
                    placeholder="Ex: LabBio • Biotecnologia Molecular"
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Departamento / Unidade Acadêmica
                  </label>
                  <Input
                    value={newLabDept}
                    onChange={(e) => setNewLabDept(e.target.value)}
                    placeholder="Ex: ICT UNIFESP São José dos Campos"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">
                    Descrição Institucional e Linhas de Pesquisa
                  </label>
                  <Input
                    value={newLabDesc}
                    onChange={(e) => setNewLabDesc(e.target.value)}
                    placeholder="Ex: Laboratório dedicado à pesquisa aplicada em..."
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-primary" />
                    Cores White-label (Primária & Secundária)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="color"
                        value={newLabPrimary}
                        onChange={(e) => setNewLabPrimary(e.target.value)}
                        className="h-8 w-10 rounded border border-border cursor-pointer"
                      />
                      <span className="font-mono text-[11px]">{newLabPrimary}</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="color"
                        value={newLabSecondary}
                        onChange={(e) => setNewLabSecondary(e.target.value)}
                        className="h-8 w-10 rounded border border-border cursor-pointer"
                      />
                      <span className="font-mono text-[11px]">{newLabSecondary}</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    E-mail de Coordenação / Suporte
                  </label>
                  <Input
                    type="email"
                    value={newLabEmail}
                    onChange={(e) => setNewLabEmail(e.target.value)}
                    placeholder="contato@unifesp.br"
                    className="h-9 text-xs"
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreatingLab(false)}
                  className="text-xs h-9"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending && loadingLabId === "create-new"}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-9 font-semibold gap-1.5"
                >
                  {isPending && loadingLabId === "create-new" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Criar e Acessar Laboratório
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* 1. Laboratórios Disponíveis para Acesso (Aprovados) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Laboratórios Disponíveis para Acesso ({approvedLabs.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Você já possui vínculo aprovado nestes laboratórios. Clique para carregar o ambiente e o tema White-label correspondente.
              </p>
            </div>
          </div>

          {approvedLabs.length === 0 ? (
            <Card className="border border-dashed border-border/80 p-8 text-center bg-card/60">
              <Clock className="mx-auto h-8 w-8 text-amber-500 mb-2" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Nenhum laboratório com acesso liberado no momento
              </CardTitle>
              <CardDescription className="text-xs max-w-md mx-auto mt-1">
                {waitingLabs.length > 0
                  ? "Sua solicitação de triagem já foi enviada e aguarda aprovação do Responsável ou Líderes do laboratório abaixo."
                  : "Escolha um dos laboratórios abaixo para enviar seu pedido de triagem."}
              </CardDescription>
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {approvedLabs.map((lab) => {
                const isCurrent = lab.id === activeLabId;
                const isLoadingThis = isPending && loadingLabId === lab.id;
                const roleLabel =
                  ROLE_LABELS[(lab.membershipRole as UserRole) || "STUDENT"] || "Integrante";

                return (
                  <Card
                    key={lab.id}
                    className={`flex flex-col justify-between overflow-hidden border transition-all shadow-xs hover:shadow-md ${
                      isCurrent
                        ? "border-primary ring-1 ring-primary/30 bg-card"
                        : "border-border/80 bg-card/95 hover:border-primary/50"
                    }`}
                  >
                    {/* Faixa de Identidade White-label do Laboratório */}
                    <div
                      className="h-2 w-full"
                      style={{
                        background: `linear-gradient(90deg, ${lab.primaryColor} 0%, ${lab.secondaryColor} 100%)`,
                      }}
                    />

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {lab.logoUrl ? (
                            <img
                              src={lab.logoUrl}
                              alt={lab.name}
                              className="h-10 w-10 rounded-lg object-contain border border-border p-1 bg-muted/20 shrink-0"
                            />
                          ) : (
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-sm shadow-2xs shrink-0"
                              style={{ backgroundColor: lab.primaryColor }}
                            >
                              {lab.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-base font-bold text-foreground">
                              {lab.name}
                            </CardTitle>
                            <CardDescription className="text-[11px] font-medium">
                              {lab.departmentName} • {lab.institutionName}
                            </CardDescription>
                          </div>
                        </div>

                        <Badge
                          variant={
                            lab.membershipRole === "PROFESSOR"
                              ? "default"
                              : lab.membershipRole === "LEADER"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[10px] shrink-0"
                        >
                          {roleLabel}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pb-4 flex-1">
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {lab.description ||
                          `Ambiente colaborativo de projetos, Kanban e cadernos científicos do ${lab.name}.`}
                      </p>

                      {lab.responsible && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">
                            Responsável:{" "}
                            <strong className="text-foreground">
                              {lab.responsible.name || lab.responsible.email}
                            </strong>
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {lab._count?.memberships ?? 1} membros ativos
                        </span>
                        <span className="flex items-center gap-1">
                          <FolderGit2 className="h-3.5 w-3.5" />
                          {lab._count?.workspaces ?? 0} workspaces
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-0 pb-4">
                      <Button
                        type="button"
                        disabled={isLoadingThis}
                        onClick={() => handleEnterLab(lab.id)}
                        className="w-full h-9 text-xs font-semibold gap-2 shadow-2xs text-white"
                        style={{ backgroundColor: lab.primaryColor }}
                      >
                        {isLoadingThis ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <span>
                              {isCurrent ? "Continuar neste Laboratório" : "Acessar Laboratório"}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. Solicitações de Triagem Pendentes (WAITING_APPROVAL) */}
        {waitingLabs.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 uppercase tracking-wider">
              <Clock className="h-4 w-4 text-amber-500" />
              Pedidos de Triagem Aguardando Aprovação ({waitingLabs.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {waitingLabs.map((lab) => (
                <Card
                  key={lab.id}
                  className="border border-amber-300/80 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/50"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-foreground">
                        {lab.name}
                      </CardTitle>
                      <Badge variant="warning" className="text-[10px]">
                        Em Triagem
                      </Badge>
                    </div>
                    <CardDescription className="text-[11px]">
                      {lab.departmentName} • {lab.institutionName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-1.5">
                    <p>
                      Seu pedido foi encaminhado para o{" "}
                      <strong className="text-foreground">Responsável do Laboratório</strong> e para os{" "}
                      <strong className="text-foreground">Líderes</strong>.
                    </p>
                    {lab.responsible && (
                      <p className="text-[11px]">
                        Coordenação: <strong>{lab.responsible.name || lab.responsible.email}</strong>
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* 3. Outros Laboratórios Disponíveis para Solicitar Triagem */}
        {availableToRequestLabs.length > 0 && (
          <section className="space-y-3 pt-2 border-t border-border">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-secondary" />
                Solicitar Triagem em Outro Laboratório
              </h2>
              <p className="text-xs text-muted-foreground">
                Deseja atuar em outro laboratório da UNIFESP? Envie sua solicitação de triagem para o responsável e líderes daquele laboratório.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableToRequestLabs.map((lab) => {
                const isLoadingThis = isPending && loadingLabId === lab.id;
                return (
                  <Card key={lab.id} className="border border-border/80 bg-card/80 flex flex-col justify-between">
                    <div>
                      <div
                        className="h-1.5 w-full rounded-t-xl"
                        style={{
                          background: `linear-gradient(90deg, ${lab.primaryColor} 0%, ${lab.secondaryColor} 100%)`,
                        }}
                      />
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-sm font-bold text-foreground">
                              {lab.name}
                            </CardTitle>
                            <CardDescription className="text-[11px]">
                              {lab.departmentName} • {lab.institutionName}
                            </CardDescription>
                          </div>
                          {lab.membershipStatus === "REJECTED" && (
                            <Badge variant="outline" className="text-[9px] text-red-600 border-red-200">
                              Recusado anteriormente
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground space-y-2 pb-3">
                        <p className="line-clamp-2">
                          {lab.description || `Laboratório de pesquisa e projetos ${lab.name}.`}
                        </p>
                        {lab.responsible && (
                          <p className="text-[11px]">
                            Responsável:{" "}
                            <strong className="text-foreground">
                              {lab.responsible.name || lab.responsible.email}
                            </strong>
                          </p>
                        )}
                      </CardContent>
                    </div>
                    <CardFooter className="pt-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isLoadingThis}
                        onClick={() => handleRequestTriage(lab.id, lab.name)}
                        className="w-full h-8 text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                      >
                        {isLoadingThis ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        <span>Solicitar Triagem neste Lab</span>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

