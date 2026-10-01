"use client";

import React, { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Search, Bell, Moon, Sun, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { data: session } = useSession();
  const [isDark, setIsDark] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <>
      <header className="flex h-16 w-full shrink-0 items-center justify-between border-b border-border bg-card/90 px-6 backdrop-blur transition-all">
        {/* 1. Barra de Busca Estilo Notion / Linear */}
        <div className="flex items-center gap-3">
          <div className="relative w-72 md:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar tarefas, notas, braços de pesquisa... (Ctrl + K)"
              className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-12 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs transition-colors"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* 2. Ações Rápidas */}
        <div className="flex items-center gap-3">

          {/* Notificações */}
          <button
            type="button"
            className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Notificações"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
          </button>

          {/* Toggle Dark Mode */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Alternar Tema"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Perfil & Menu com Logout */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "Usuário"} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {session?.user?.name
                    ? session.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                    : "UN"}
                </AvatarFallback>
              </Avatar>
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100 z-50">
                <div className="px-3 py-2 border-b border-border/60">
                  <p className="text-xs font-bold text-foreground truncate">
                    {session?.user?.name || "Pesquisador"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate font-mono">
                    {session?.user?.email}
                  </p>
                  <span className="inline-block mt-1 text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {session?.user?.role || "STUDENT"}
                  </span>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors font-medium"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sair da Conta (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
