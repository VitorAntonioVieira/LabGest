"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Card Principal */}
        <Card className="border border-border/80 shadow-lg backdrop-blur bg-card/95">
          <CardHeader className="text-center pb-4 pt-8">
            {/* Símbolo Gráfico Lab CTPP */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
              <svg
                className="h-8 w-8"
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

            <div className="flex items-center justify-center font-bold tracking-tight text-2xl leading-none">
              <span className="text-primary font-black">Lab</span>
              <span className="text-secondary ml-1 font-extrabold">CTPP</span>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1.5">
              LabGest • UNIFESP
            </p>

            <CardTitle className="text-lg font-bold text-foreground mt-4">
              Acesso à Plataforma
            </CardTitle>
            <CardDescription className="text-xs max-w-xs mx-auto mt-1">
              Ambiente integrado de gestão de projetos e atividades.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Alerta de Erro de Acesso / Restrição Institucional */}
            {error === "AccessDenied" && (
              <div className="rounded-lg border border-red-200 bg-red-50/90 dark:bg-red-950/40 dark:border-red-900/60 p-3.5 text-xs text-red-800 dark:text-red-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span>Acesso Não Autorizado</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  São permitidos exclusivamente e-mails institucionais da UNIFESP terminados em{" "}
                  <strong>@unifesp.br</strong> ou <strong>@aluno.unifesp.br</strong>.
                </p>
              </div>
            )}

            {/* Botão Oficial do Google OAuth */}
            <Button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full h-11 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-xs font-semibold text-xs transition-all gap-3"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Entrar com Google Institucional</span>
            </Button>

            {/* Informação sobre os domínios permitidos */}
            <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1.5 border border-border/50">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Domínios autorizados no login único:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] pl-1 text-muted-foreground/90">
                <li>
                  <span className="font-mono text-primary font-medium">@unifesp.br</span> (Professores, pesquisadores e servidores)
                </li>
                <li>
                  <span className="font-mono text-secondary font-medium">@aluno.unifesp.br</span> (Graduação e pós-graduação)
                </li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="pt-2 pb-6 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] text-muted-foreground">
              Primeiro acesso? Sua conta será provisionada automaticamente ao efetuar o login institucional.
            </p>
          </CardFooter>
        </Card>

        {/* Rodapé institucional */}
        <p className="text-center text-[11px] text-muted-foreground">
          Universidade Federal de São Paulo • UNIFESP
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-xs text-muted-foreground">
          Carregando tela de acesso...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
