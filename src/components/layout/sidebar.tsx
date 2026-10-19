"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Clock,
  ShieldCheck,
  PlusCircle,
  FolderGit2,
  ChevronRight,
  Sliders,
  LogOut,
  Users,
  Building2,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RequestWorkspaceDialog } from "@/components/modals/request-workspace-dialog";
import { selectActiveLaboratory } from "@/app/actions";
import type { UserRole } from "@/types";

interface SidebarProps {
  currentUser?: {
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
  };
  activeLabId?: string;
  approvedLabs?: {
    id: string;
    name: string;
    slug: string;
    primaryColor: string;
    role?: UserRole | null;
  }[];
  workspaces?: {
    id: string;
    name: string;
    slug: string;
  }[];
  activeWorkspacesCount?: number;
  pendingApprovalsCount?: number;
  brandSettings?: {
    labName: string;
    institutionName: string;
    departmentName: string;
    logoUrl?: string | null;
  };
}

export function Sidebar({
  currentUser,
  activeLabId,
  approvedLabs = [],
  workspaces = [],
  activeWorkspacesCount = 0,
  pendingApprovalsCount = 0,
  brandSettings,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isRequestWsOpen, setIsRequestWsOpen] = useState(false);
  const [isSwitchingLab, startTransition] = useTransition();

  // Usuário 100% dinâmico (prioriza papel no laboratório ativo via SSR)
  const user = {
    name: currentUser?.name || session?.user?.name || "Integrante UNIFESP",
    email: currentUser?.email || session?.user?.email || "",
    role: (currentUser?.role || session?.user?.role || "STUDENT") as UserRole,
    avatarUrl: currentUser?.avatarUrl || session?.user?.image || undefined,
  };

  const canApproveInLab = user.role === "PROFESSOR" || user.role === "LEADER";
  const canManageWhiteLabel = user.role === "PROFESSOR";

  const handleQuickLabSwitch = (newLabId: string) => {
    if (newLabId === activeLabId) return;
    startTransition(async () => {
      try {
        await selectActiveLaboratory(newLabId);
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  };

  const navItems = [
    {
      title: "Visão Geral",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Espaços de Trabalho",
      href: "/workspaces",
      icon: FolderGit2,
      badge: activeWorkspacesCount > 0 ? `${activeWorkspacesCount} Ativos` : undefined,
    },
    {
      title: "Integrantes",
      href: "/members",
      icon: Users,
    },
    {
      title: "Calendário do Lab",
      href: "/calendar",
      icon: Calendar,
    },
    {
      title: "Caderno Pessoal",
      href: "/docs",
      icon: BookOpen,
      badge: "Notion",
    },
    {
      title: "Apontamento de Horas",
      href: "/time-tracking",
      icon: Clock,
    },
  ];

  const adminItems = [
    {
      title: "Aprovações & Triagem",
      href: "/admin/approvals",
      icon: ShieldCheck,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Pendente` : undefined,
      isAlert: pendingApprovalsCount > 0,
      visible: canApproveInLab,
    },
    {
      title: "Configurações White-label",
      href: "/admin/settings",
      icon: Sliders,
      visible: canManageWhiteLabel,
    },
  ].filter((item) => item.visible);

  return (
    <aside className="h-full w-64 shrink-0 flex flex-col border-r border-border bg-card/95 backdrop-blur z-30 transition-all duration-300">
      {/* 1. Header do Logo White-label do Laboratório Ativo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <Link href="/" className="flex items-center gap-2.5 group overflow-hidden">
          {brandSettings?.logoUrl ? (
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted/20 p-1 shadow-xs transition-transform group-hover:scale-105 shrink-0 overflow-hidden">
              <img
                src={brandSettings.logoUrl}
                alt={brandSettings.labName}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-xs transition-transform group-hover:scale-105 shrink-0">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
                <circle cx="18" cy="4" r="1.5" className="fill-secondary stroke-none" />
                <circle cx="21" cy="7" r="1.2" className="fill-secondary stroke-none" />
                <path d="M16 5l2-1 3 3" />
              </svg>
            </div>
          )}

          <div className="flex flex-col overflow-hidden">
            <span className="font-bold tracking-tight text-base leading-none text-foreground truncate">
              {brandSettings?.labName || "Lab CTPP"}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1 truncate">
              {brandSettings?.departmentName || "Living Lab"} • {brandSettings?.institutionName || "UNIFESP"}
            </span>
          </div>
        </Link>
      </div>

      {/* Seletor Multi-Tenant de Laboratório & Acesso ao Hub /labs */}
      <div className="px-3 pt-3 pb-1 space-y-1.5 border-b border-border/60">
        {approvedLabs.length > 1 && (
          <div className="space-y-1">
            <label className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3 text-primary" />
              Laboratório Ativo
            </label>
            <select
              value={activeLabId}
              disabled={isSwitchingLab}
              onChange={(e) => handleQuickLabSwitch(e.target.value)}
              className="w-full h-8 rounded-md border border-border bg-muted/40 px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {approvedLabs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <Link
          href="/labs"
          className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <ArrowLeftRight className="h-3 w-3 text-primary" />
            Trocar / Ver Laboratórios
          </span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
            {approvedLabs.length || 1} Lab(s)
          </Badge>
        </Link>
      </div>

      {/* 2. Botão de Ação Rápida */}
      <div className="p-3">
        <Button
          size="sm"
          onClick={() => setIsRequestWsOpen(true)}
          className="w-full justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-700/50 dark:hover:bg-emerald-900/50 border border-primary/25 shadow-xs font-semibold text-xs cursor-pointer transition-colors"
        >
          <PlusCircle className="h-4 w-4 text-primary dark:text-emerald-400 shrink-0" />
          <span className="text-foreground dark:text-emerald-200 font-semibold">Solicitar Workspace</span>
        </Button>
      </div>

      {/* 3. Navegação Principal */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Plataforma
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <Badge
                    variant={isActive ? "secondary" : "outline"}
                    className={cn(
                      "text-[10px] px-2 py-0.5 h-auto min-h-4 border-none whitespace-nowrap shrink-0 font-semibold leading-tight",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>

        {/* 4. Módulo de Coordenação e Liderança do Laboratório (Responsável PROFESSOR + Líderes LEADER) */}
        {canApproveInLab && adminItems.length > 0 && (
          <div className="space-y-1 border-t border-border pt-4">
            <p className="px-3 text-[11px] font-semibold text-primary dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span>{user.role === "PROFESSOR" ? "Coordenação do Lab" : "Liderança do Lab"}</span>
              <ShieldCheck className="h-3.5 w-3.5 text-primary dark:text-emerald-400" />
            </p>
            {adminItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                    isActive
                      ? "bg-secondary text-secondary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-secondary dark:text-cyan-400 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </div>
                  {item.badge && (
                    <Badge
                      variant="warning"
                      className="text-[10px] px-2 py-0.5 h-auto min-h-4 animate-pulse whitespace-nowrap shrink-0 font-semibold leading-tight"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* 5. Braços de Pesquisa Ativos Dinâmicos */}
        <div className="space-y-1 border-t border-border pt-4">
          <div className="flex items-center justify-between px-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Braços do Lab
            </p>
            <Link
              href="/workspaces"
              className="text-[11px] text-primary dark:text-emerald-400 hover:underline font-semibold"
            >
              Ver todos
            </Link>
          </div>
          <div className="space-y-0.5 mt-2">
            {workspaces.length === 0 ? (
              <p className="px-3 py-1 text-[11px] text-muted-foreground/70 italic">
                Nenhum braço ativo
              </p>
            ) : (
              workspaces.map((ws, i) => {
                const colors = [
                  "bg-emerald-500",
                  "bg-teal-500",
                  "bg-blue-500",
                  "bg-cyan-500",
                  "bg-indigo-500",
                ];
                const color = colors[i % colors.length];

                return (
                  <Link
                    key={ws.slug}
                    href={`/workspace/${ws.slug}/kanban`}
                    className="flex items-center justify-between rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full shrink-0", color)} />
                      <span className="truncate max-w-[130px]">{ws.name}</span>
                    </div>
                    <ChevronRight className="h-3 w-3 opacity-40 shrink-0" />
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 6. Footer com Perfil do Usuário Dinâmico e Logout */}
      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-accent/60 transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
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
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-xs font-semibold text-foreground">
                {user.name}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge
                  variant={
                    user.role === "PROFESSOR"
                      ? "default"
                      : user.role === "LEADER"
                      ? "secondary"
                      : "outline"
                  }
                  className="text-[9px] px-1 py-0 h-3.5 leading-none font-medium"
                >
                  {user.role === "PROFESSOR"
                    ? "Professor"
                    : user.role === "LEADER"
                    ? "Líder (Gestão)"
                    : "Integrante"}
                </Badge>
                <span className="truncate text-[10px] text-muted-foreground">
                  {brandSettings?.institutionName || "UNIFESP"}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sair da Conta (Logout)"
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Modal de Solicitação de Workspace */}
      <RequestWorkspaceDialog
        isOpen={isRequestWsOpen}
        onClose={() => setIsRequestWsOpen(false)}
      />
    </aside>
  );
}
