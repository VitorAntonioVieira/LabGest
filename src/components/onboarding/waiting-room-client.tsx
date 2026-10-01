"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
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
import {
  Clock,
  RefreshCw,
  LogOut,
  ShieldAlert,
  UserCheck,
  CheckCircle,
  FileCheck2,
} from "lucide-react";

interface WaitingRoomClientProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    status: string;
    academicId: string | null;
    phone: string | null;
    course: string | null;
    createdAt: Date;
  };
}

export function WaitingRoomClient({ user }: WaitingRoomClientProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Card className="border border-border/80 shadow-lg backdrop-blur bg-card/95">
      <CardHeader className="text-center pb-4 pt-8">
        <div className="mx-auto mb-4 relative flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
          <Clock className="h-7 w-7 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
          </span>
        </div>

        <div className="flex items-center justify-center font-bold tracking-tight text-xl leading-none">
          <span className="text-primary font-black">Lab</span>
          <span className="text-secondary ml-1 font-extrabold">CTPP</span>
        </div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">
          Living Lab • UNIFESP
        </p>

        <CardTitle className="text-lg font-bold text-foreground mt-4">
          Sala de Espera e Triagem
        </CardTitle>
        <CardDescription className="text-xs max-w-sm mx-auto mt-1">
          Sua solicitação de ingresso foi registrada com sucesso e aguarda homologação pela Coordenação Geral do Laboratório.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Badge e Card Informativo */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900/40 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Status Atual da Inscrição:
            </span>
            <Badge variant="warning" className="text-[10px] h-5 px-2">
              Aguardando Aprovação
            </Badge>
          </div>
          <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
            Durante a triagem, o professor coordenador definirá o seu papel (Pesquisador ou Líder) e alocará o seu perfil nos braços de pesquisa correspondentes.
          </p>
        </div>

        {/* Resumo dos Dados Submetidos */}
        <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 text-xs space-y-2">
          <div className="text-[11px] font-bold text-foreground uppercase tracking-wider border-b border-border/40 pb-1.5">
            Dados Submetidos para Homologação:
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-muted-foreground">Nome:</span>
              <p className="font-medium text-foreground">{user.name || "Pesquisador"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">E-mail:</span>
              <p className="font-medium text-foreground font-mono text-[10px] truncate">
                {user.email}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">RA Institucional:</span>
              <p className="font-medium text-foreground">{user.academicId || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Contato:</span>
              <p className="font-medium text-foreground">{user.phone || "-"}</p>
            </div>
            {user.course && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Curso / Área:</span>
                <p className="font-medium text-foreground">{user.course}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 pb-6 flex flex-col gap-3">
        <Button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-2 shadow-xs"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Verificar se Fui Aprovado</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-[11px] text-muted-foreground hover:text-foreground h-8"
        >
          <LogOut className="mr-1.5 h-3.5 w-3.5" />
          Sair da Sessão
        </Button>
      </CardFooter>
    </Card>
  );
}
