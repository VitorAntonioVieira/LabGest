"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Shield,
  ShieldCheck,
  Tag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  Sliders,
  MoreVertical,
  Mail,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Lock,
  Edit2,
  LayoutGrid,
  List,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EditMemberDialog } from "./edit-member-dialog";
import { AttributionDialog } from "./attribution-dialog";
import {
  ROLE_LABELS,
  SYSTEM_PERMISSIONS,
  type MemberSummary,
  type AttributionSummary,
  type UserRole,
  type UserStatus,
} from "@/types";

interface MembersManagementClientProps {
  currentUserRole: UserRole;
  initialMembers: MemberSummary[];
  initialAttributions: AttributionSummary[];
}

export function MembersManagementClient({
  currentUserRole,
  initialMembers,
  initialAttributions,
}: MembersManagementClientProps) {
  const [members, setMembers] = useState<MemberSummary[]>(initialMembers);
  const [attributions, setAttributions] = useState<AttributionSummary[]>(initialAttributions);
  const [activeTab, setActiveTab] = useState<"members" | "attributions">("members");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [attributionFilter, setAttributionFilter] = useState<string>("ALL");

  // Modais
  const [selectedMember, setSelectedMember] = useState<MemberSummary | null>(null);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [attributionToEdit, setAttributionToEdit] = useState<AttributionSummary | null>(null);
  const [isAttributionModalOpen, setIsAttributionModalOpen] = useState(false);

  const canManage = currentUserRole === "PROFESSOR" || currentUserRole === "LEADER";

  // Métricas
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "ACTIVE").length;
  const waitingMembers = members.filter((m) => m.status === "WAITING_APPROVAL").length;
  const totalAttributions = attributions.length;

  // Filtragem dos Integrantes
  const filteredMembers = members.filter((m) => {
    // Busca por texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name?.toLowerCase().includes(q) ?? false;
      const matchEmail = m.email?.toLowerCase().includes(q) ?? false;
      const matchAcademicId = m.academicId?.toLowerCase().includes(q) ?? false;
      const matchCourse = m.course?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchEmail && !matchAcademicId && !matchCourse) {
        return false;
      }
    }

    // Filtro de Papel
    if (roleFilter !== "ALL" && m.role !== roleFilter) {
      return false;
    }

    // Filtro de Status
    if (statusFilter !== "ALL" && m.status !== statusFilter) {
      return false;
    }

    // Filtro de Atribuição
    if (attributionFilter !== "ALL") {
      const hasAttr = m.attributions.some((a) => a.id === attributionFilter);
      if (!hasAttr) return false;
    }

    return true;
  });

  const handleEditMemberClick = (member: MemberSummary) => {
    setSelectedMember(member);
    setIsEditMemberOpen(true);
  };

  const handleNewAttributionClick = () => {
    setAttributionToEdit(null);
    setIsAttributionModalOpen(true);
  };

  const handleEditAttributionClick = (attr: AttributionSummary) => {
    setAttributionToEdit(attr);
    setIsAttributionModalOpen(true);
  };

  // Recarrega página após ação
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* 1. Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/" className="hover:text-primary transition-colors">
              Plataforma
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">Controle de Integrantes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="h-7 w-7 text-primary" />
            Controle de Integrantes & Atribuições
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Gestão unificada da equipe do Living Lab CTPP. Nem todos no laboratório trabalham apenas com pesquisas: gerencie papéis institucionais, múltiplas atribuições e controle de acesso a cada parte do sistema.
          </p>
        </div>

        {/* Ações do Topo */}
        <div className="flex items-center gap-2.5 shrink-0">
          {waitingMembers > 0 && canManage && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-xs gap-1.5"
            >
              <Link href="/admin/approvals">
                <Clock className="h-3.5 w-3.5" />
                {waitingMembers} Aguardando Aprovação
              </Link>
            </Button>
          )}

          {canManage && (
            <Button
              size="sm"
              onClick={handleNewAttributionClick}
              className="gap-1.5 bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Nova Atribuição
            </Button>
          )}
        </div>
      </div>

      {/* 2. Banner de Métricas / KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total de Integrantes
              </p>
              <p className="text-2xl font-black text-foreground mt-1">{totalMembers}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Integrantes Ativos
              </p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {activeMembers}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sala de Espera
              </p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {waitingMembers}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Atribuições Criadas
              </p>
              <p className="text-2xl font-black text-secondary dark:text-cyan-400 mt-1">
                {totalAttributions}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-secondary/10 text-secondary dark:text-cyan-400 flex items-center justify-center">
              <Tag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Seletor de Abas Principais */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "members"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Integrantes da Equipe</span>
            <Badge variant="outline" className="text-[10px] ml-0.5">
              {filteredMembers.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("attributions")}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "attributions"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Atribuições & Permissões do Sistema</span>
            <Badge variant="outline" className="text-[10px] ml-0.5">
              {attributions.length}
            </Badge>
          </button>
        </div>

        {/* Alternador de Modo de Visualização (somente na aba Integrantes) */}
        {activeTab === "members" && (
          <div className="flex items-center gap-1 mb-2 bg-muted/40 p-1 rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              title="Visualização em Cards"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "cards"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Visualização em Tabela"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          ABA 1: INTEGRANTES DA EQUIPE
          ========================================================================= */}
      {activeTab === "members" && (
        <div className="space-y-4">
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between rounded-xl border border-border/80 bg-card p-3 shadow-2xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, e-mail institucional, RA ou curso..."
                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro por Papel */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">Todas as Funções</option>
                <option value="PROFESSOR">Professor</option>
                <option value="LEADER">Líder (Gestão)</option>
                <option value="STUDENT">Integrante</option>
              </select>

              {/* Filtro por Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">Todos os Status</option>
                <option value="ACTIVE">Ativo</option>
                <option value="WAITING_APPROVAL">Sala de Espera</option>
                <option value="PENDING">Pendente</option>
                <option value="SUSPENDED">Suspenso</option>
              </select>

              {/* Filtro por Atribuição */}
              <select
                value={attributionFilter}
                onChange={(e) => setAttributionFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">Todas as Atribuições</option>
                {attributions.map((attr) => (
                  <option key={attr.id} value={attr.id}>
                    {attr.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Listagem Vazia */}
          {filteredMembers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-foreground">Nenhum integrante encontrado</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Tente ajustar os termos de pesquisa ou filtros selecionados acima.
              </p>
            </div>
          ) : viewMode === "cards" ? (
            /* Visualização em Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((m) => {
                const roleLabel = ROLE_LABELS[m.role] || "Integrante";
                const isProfessor = m.role === "PROFESSOR";
                const isLeader = m.role === "LEADER";

                return (
                  <Card
                    key={m.id}
                    className="border-border/80 hover:border-primary/40 transition-all flex flex-col justify-between shadow-2xs group"
                  >
                    <CardHeader className="p-4 pb-3 space-y-3">
                      {/* Topo: Avatar + Nome + Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Avatar className="h-11 w-11 border border-primary/20 shrink-0">
                            <AvatarImage src={m.image || undefined} alt={m.name || "Integrante"} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                              {m.name
                                ? m.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                : "IN"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col overflow-hidden">
                            <span className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                              {m.name || "Integrante"}
                            </span>
                            <span className="text-xs text-muted-foreground truncate font-mono">
                              {m.email}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <Badge
                          variant={
                            m.status === "ACTIVE"
                              ? "default"
                              : m.status === "WAITING_APPROVAL"
                              ? "warning"
                              : "outline"
                          }
                          className="text-[10px] px-2 py-0.5 shrink-0"
                        >
                          {m.status === "ACTIVE"
                            ? "Ativo"
                            : m.status === "WAITING_APPROVAL"
                            ? "Sala de Espera"
                            : m.status === "PENDING"
                            ? "Pendente"
                            : "Suspenso"}
                        </Badge>
                      </div>

                      {/* Função Base Institucional */}
                      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          Função:
                        </span>
                        <Badge
                          variant={isProfessor ? "default" : isLeader ? "secondary" : "outline"}
                          className="text-[10px] font-semibold"
                        >
                          {roleLabel}
                        </Badge>
                        {m.academicId && (
                          <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                            RA: {m.academicId}
                          </span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="px-4 pb-4 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                      {/* Atribuições do Integrante (Permite Múltiplas) */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Tag className="h-3 w-3 text-primary" />
                          Atribuições ({m.attributions.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5 min-h-6">
                          {m.attributions.length === 0 ? (
                            <span className="text-[11px] text-muted-foreground/70 italic">
                              Sem atribuições específicas definidas
                            </span>
                          ) : (
                            m.attributions.map((attr) => (
                              <span
                                key={attr.id}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border"
                                style={{
                                  borderColor: `${attr.color}40`,
                                  backgroundColor: `${attr.color}15`,
                                  color: attr.color,
                                }}
                              >
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: attr.color }}
                                />
                                {attr.name}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Módulos do Sistema Liberados */}
                      <div className="space-y-1 pt-2 border-t border-border/40">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Lock className="h-3 w-3 text-muted-foreground" />
                          Acesso aos Módulos
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {isProfessor ? (
                            <Badge variant="default" className="text-[9px] py-0 px-1.5 bg-primary/20 text-primary border-primary/30">
                              Acesso Total (Coordenação)
                            </Badge>
                          ) : m.attributions.length === 0 ? (
                            <span className="text-[10px] text-muted-foreground/80">
                              Workspaces & Kanban (Acesso Base)
                            </span>
                          ) : (
                            (() => {
                              const moduleIds = new Set<string>();
                              m.attributions.forEach((a) =>
                                a.permissions.forEach((p) => moduleIds.add(p))
                              );
                              return Array.from(moduleIds).slice(0, 4).map((pId) => {
                                const def = SYSTEM_PERMISSIONS.find((p) => p.id === pId);
                                return (
                                  <Badge
                                    key={pId}
                                    variant="outline"
                                    className="text-[9px] py-0 px-1.5 bg-muted/40 text-muted-foreground"
                                  >
                                    {def?.label || pId}
                                  </Badge>
                                );
                              });
                            })()
                          )}
                        </div>
                      </div>

                      {/* Botão de Gestão */}
                      {canManage && (
                        <div className="pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditMemberClick(m)}
                            className="w-full text-xs font-semibold gap-1.5 border-border/80 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Gerenciar Papel & Atribuições
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Visualização em Tabela Consolidada */
            <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border/80 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Integrante</th>
                      <th className="py-3 px-4">Função</th>
                      <th className="py-3 px-4">Atribuições</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">RA / Curso</th>
                      {canManage && <th className="py-3 px-4 text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredMembers.map((m) => {
                      const roleLabel = ROLE_LABELS[m.role] || "Integrante";
                      return (
                        <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
                                <AvatarImage src={m.image || undefined} alt={m.name || "Integrante"} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">
                                  {m.name
                                    ? m.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .slice(0, 2)
                                        .join("")
                                    : "IN"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-semibold text-foreground block">
                                  {m.name || "Integrante"}
                                </span>
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  {m.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                m.role === "PROFESSOR"
                                  ? "default"
                                  : m.role === "LEADER"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-[10px]"
                            >
                              {roleLabel}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {m.attributions.length === 0 ? (
                                <span className="text-muted-foreground italic text-[11px]">-</span>
                              ) : (
                                m.attributions.map((attr) => (
                                  <span
                                    key={attr.id}
                                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium border"
                                    style={{
                                      borderColor: `${attr.color}40`,
                                      backgroundColor: `${attr.color}15`,
                                      color: attr.color,
                                    }}
                                  >
                                    {attr.name}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                m.status === "ACTIVE"
                                  ? "default"
                                  : m.status === "WAITING_APPROVAL"
                                  ? "warning"
                                  : "outline"
                              }
                              className="text-[10px]"
                            >
                              {m.status === "ACTIVE"
                                ? "Ativo"
                                : m.status === "WAITING_APPROVAL"
                                ? "Sala de Espera"
                                : m.status === "PENDING"
                                ? "Pendente"
                                : "Suspenso"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {m.academicId ? (
                              <span className="font-mono text-foreground font-medium block">
                                {m.academicId}
                              </span>
                            ) : null}
                            <span className="text-[10px] truncate max-w-[140px] block">
                              {m.course || "Não informado"}
                            </span>
                          </td>
                          {canManage && (
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditMemberClick(m)}
                                className="text-xs gap-1 border-border/80"
                              >
                                <Edit2 className="h-3 w-3" />
                                Editar
                              </Button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          ABA 2: ATRIBUIÇÕES & PERMISSÕES DO SISTEMA
          ========================================================================= */}
      {activeTab === "attributions" && (
        <div className="space-y-5">
          {/* Banner Explicativo */}
          <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-secondary dark:text-cyan-400" />
                Estrutura Modular de Atribuições do Living Lab CTPP
              </h3>
              <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
                Cada atribuição representa uma especialidade ou frente de atuação no laboratório (ex: Gestão, Pesquisa Aplicada, TI & Infraestrutura, Comunicação, Financeiro). Aqui você cria novas atribuições e define quais áreas do sistema cada atribuição pode visualizar ou gerenciar.
              </p>
            </div>
            {canManage && (
              <Button
                size="sm"
                onClick={handleNewAttributionClick}
                className="gap-1.5 bg-primary hover:bg-primary/90 text-white font-semibold text-xs shrink-0"
              >
                <Plus className="h-4 w-4" />
                Criar Nova Atribuição
              </Button>
            )}
          </div>

          {/* Grid de Atribuições Cadastradas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attributions.map((attr) => (
              <Card
                key={attr.id}
                className="border-border/80 hover:border-primary/40 transition-all flex flex-col justify-between shadow-2xs group"
              >
                <CardHeader className="p-4 pb-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: attr.color }}
                      />
                      <CardTitle className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {attr.name}
                      </CardTitle>
                    </div>

                    <Badge variant="outline" className="text-[10px] shrink-0 font-medium">
                      {attr.userCount || 0} integrante(s)
                    </Badge>
                  </div>

                  <CardDescription className="text-xs line-clamp-2 leading-relaxed">
                    {attr.description || "Sem descrição cadastrada."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-4 pb-4 pt-0 space-y-3">
                  {/* Módulos do Sistema Liberados por esta Atribuição */}
                  <div className="space-y-1.5 pt-2 border-t border-border/50">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Sliders className="h-3 w-3 text-primary" />
                      Módulos com Acesso Liberado ({attr.permissions.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {attr.permissions.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground italic">
                          Nenhum módulo específico liberado
                        </span>
                      ) : (
                        attr.permissions.map((pId) => {
                          const def = SYSTEM_PERMISSIONS.find((p) => p.id === pId);
                          return (
                            <Badge
                              key={pId}
                              variant="outline"
                              className="text-[10px] py-0 px-2 font-medium bg-primary/5 text-primary border-primary/20"
                            >
                              {def?.label || pId}
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  {canManage && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditAttributionClick(attr)}
                        className="w-full text-xs font-semibold gap-1.5 border-border/80 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Editar Atribuição & Permissões
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Edição de Integrante */}
      <EditMemberDialog
        isOpen={isEditMemberOpen}
        onClose={() => setIsEditMemberOpen(false)}
        member={selectedMember}
        allAttributions={attributions}
        onSuccess={handleReload}
      />

      {/* Modal de Criação / Edição de Atribuição */}
      <AttributionDialog
        isOpen={isAttributionModalOpen}
        onClose={() => setIsAttributionModalOpen(false)}
        attributionToEdit={attributionToEdit}
        onSuccess={handleReload}
      />
    </div>
  );
}
