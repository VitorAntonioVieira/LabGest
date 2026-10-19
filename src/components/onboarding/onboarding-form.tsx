"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { completeOnboarding } from "@/app/actions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  GraduationCap,
  Phone,
  Hash,
  LogOut,
  CheckCircle2,
  Building2,
  ShieldCheck,
} from "lucide-react";
import type { LaboratorySummary } from "@/types";

interface OnboardingFormProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    status: string;
    academicId: string | null;
    phone: string | null;
    course: string | null;
  };
  laboratories?: LaboratorySummary[];
}

export function OnboardingForm({ user, laboratories = [] }: OnboardingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [academicId, setAcademicId] = useState(user.academicId || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [course, setCourse] = useState(user.course || "");
  const [selectedLabIds, setSelectedLabIds] = useState<string[]>(
    laboratories.length > 0 ? [laboratories[0].id] : ["lab-ctpp"]
  );
  const [error, setError] = useState<string | null>(null);

  const toggleLabSelection = (labId: string) => {
    setSelectedLabIds((prev) =>
      prev.includes(labId) ? prev.filter((id) => id !== labId) : [...prev, labId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!academicId.trim()) {
      setError("Por favor, preencha o seu Registro Acadêmico (RA).");
      return;
    }

    if (!phone.trim()) {
      setError("Por favor, informe seu número de WhatsApp / Telefone para contato.");
      return;
    }

    if (selectedLabIds.length === 0) {
      setError("Selecione ao menos um laboratório para enviar sua solicitação de triagem.");
      return;
    }

    startTransition(async () => {
      try {
        await completeOnboarding({
          academicId,
          phone,
          course: course.trim() || undefined,
          labIds: selectedLabIds,
        });
        router.push("/waiting-room");
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Erro ao enviar solicitação de triagem.");
      }
    });
  };

  return (
    <Card className="border border-border/80 shadow-lg backdrop-blur bg-card/95">
      <CardHeader className="text-center pb-4 pt-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
          <GraduationCap className="h-6 w-6" />
        </div>

        <div className="flex items-center justify-center font-bold tracking-tight text-xl leading-none">
          <span className="text-primary font-black">LabGest</span>
          <span className="text-secondary ml-1 font-extrabold">UNIFESP</span>
        </div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">
          Plataforma Multi-Laboratórios • UNIFESP
        </p>

        <CardTitle className="text-lg font-bold text-foreground mt-3">
          Cadastro Acadêmico & Escolha de Laboratório
        </CardTitle>
        <CardDescription className="text-xs max-w-md mx-auto mt-1">
          Escolha para qual laboratório deseja realizar a triagem e preencha seus dados. O pedido será enviado ao Responsável do laboratório e aos Líderes para aprovação.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50/90 dark:bg-red-950/40 dark:border-red-900/60 p-3 text-xs text-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Dados do Google (Read-only) */}
          <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1 border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Nome:</span>
              <span className="font-semibold text-foreground">{user.name || "Integrante"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">E-mail Institucional:</span>
              <span className="font-mono text-[11px] text-primary">{user.email}</span>
            </div>
          </div>

          {/* 1. Escolha do(s) Laboratório(s) para Triagem */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                Para qual laboratório deseja fazer a triagem? *
              </span>
              <Badge variant="outline" className="text-[10px]">
                {selectedLabIds.length} selecionado(s)
              </Badge>
            </label>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {laboratories.map((lab) => {
                const isSelected = selectedLabIds.includes(lab.id);
                return (
                  <div
                    key={lab.id}
                    onClick={() => toggleLabSelection(lab.id)}
                    className={`flex items-start justify-between gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border/80 bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 rounded border-input accent-primary"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: lab.primaryColor }}
                          />
                          <span className="text-xs font-bold text-foreground">
                            {lab.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ({lab.departmentName})
                          </span>
                        </div>
                        {lab.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {lab.description}
                          </p>
                        )}
                        {lab.responsible && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-0.5">
                            <ShieldCheck className="h-3 w-3 text-primary" />
                            Responsável: <strong>{lab.responsible.name || lab.responsible.email}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Sua solicitação chegará diretamente para o Professor Responsável e para os Líderes do laboratório escolhido.
            </p>
          </div>

          {/* 2. RA */}
          <div className="space-y-1.5">
            <label
              htmlFor="academicId"
              className="text-xs font-semibold text-foreground flex items-center gap-1.5"
            >
              <Hash className="h-3.5 w-3.5 text-primary" />
              Registro Acadêmico (RA) *
            </label>
            <Input
              id="academicId"
              value={academicId}
              onChange={(e) => setAcademicId(e.target.value)}
              placeholder="Ex: 142857"
              required
              className="h-9 text-xs"
            />
          </div>

          {/* 3. WhatsApp / Telefone */}
          <div className="space-y-1.5">
            <label
              htmlFor="phone"
              className="text-xs font-semibold text-foreground flex items-center gap-1.5"
            >
              <Phone className="h-3.5 w-3.5 text-primary" />
              WhatsApp / Telefone para contato *
            </label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: (11) 98765-4321"
              required
              className="h-9 text-xs"
            />
          </div>

          {/* 4. Curso */}
          <div className="space-y-1.5">
            <label
              htmlFor="course"
              className="text-xs font-semibold text-foreground flex items-center gap-1.5"
            >
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              Curso / Programa de Pós-Graduação (Opcional)
            </label>
            <Input
              id="course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="Ex: Engenharia Biomédica / Farmácia / Ciência da Computação"
              className="h-9 text-xs"
            />
          </div>
        </CardContent>

        <CardFooter className="pt-2 pb-6 flex flex-col gap-3">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs shadow-xs gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>Enviar Solicitação de Triagem ao Laboratório</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-[11px] text-muted-foreground hover:text-foreground h-8"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Sair ou entrar com outra conta
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
