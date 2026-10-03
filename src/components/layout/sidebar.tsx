"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  KanbanSquare,
  Calendar,
  BookOpen,
  Clock,
  ShieldCheck,
  PlusCircle,
  FolderGit2,
  ChevronRight,
  Sparkles,
  Sliders,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RequestWorkspaceDialog } from "@/components/modals/request-workspace-dialog";
import type { UserRole } from "@/types";

interface SidebarProps {
  currentUser?: {
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
  };
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
  workspaces = [],
  activeWorkspacesCount = 0,
  pendingApprovalsCount = 0,
  brandSettings,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isRequestWsOpen, setIsRequestWsOpen] = useState(false);

  // Usuário 100% dinâmico (prioriza SSR e fallback reativo para useSession)
  const user = {
    name: currentUser?.name || session?.user?.name || "Pesquisador UNIFESP",
    email: currentUser?.email || session?.user?.email || "",
    role: (currentUser?.role || session?.user?.role || "STUDENT") as UserRole,
    avatarUrl: currentUser?.avatarUrl || session?.user?.image || undefined,
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
      title: "Aprovações & Gestão",
      href: "/admin/approvals",
      icon: ShieldCheck,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Pendente` : undefined,
      isAlert: pendingApprovalsCount > 0,
    },
    {
      title: "Configurações White-label",
      href: "/admin/settings",
      icon: Sliders,
    },
  ];

  return (
    <aside className="h-full w-64 shrink-0 flex flex-col border-r border-border bg-card/95 backdrop-blur z-30 transition-all duration-300">
      {/* 1. Header do Logo Lab CTPP */}
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <Link href="/" className="flex items-center gap-2.5 group overflow-hidden">
          {/* Logotipo Customizado ou Símbolo Padrão */}
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
                {/* Folhas e livro combinados */}
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

        {/* 4. Módulo Restrito ao Professor (RBAC Dinâmico) */}
        {user.role === "PROFESSOR" && (
          <div className="space-y-1 border-t border-border pt-4">
            <p className="px-3 text-[11px] font-semibold text-primary dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span>Coordenação Geral</span>
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
                  {user.role}
                </Badge>
                <span className="truncate text-[10px] text-muted-foreground">
                  UNIFESP
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
