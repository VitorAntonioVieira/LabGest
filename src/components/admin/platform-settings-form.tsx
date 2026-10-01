"use client";

import React, { useState, useTransition } from "react";
import { Sliders, Palette, CheckCircle2, Loader2, Sparkles, Building, Mail, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updatePlatformSettings } from "@/app/actions";

interface PlatformSettingsFormProps {
  settings: {
    labName: string;
    institutionName: string;
    departmentName: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    supportEmail: string;
  };
}

export function PlatformSettingsForm({ settings }: PlatformSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [labName, setLabName] = useState(settings.labName);
  const [institutionName, setInstitutionName] = useState(settings.institutionName);
  const [departmentName, setDepartmentName] = useState(settings.departmentName);
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(settings.secondaryColor);
  const [accentColor, setAccentColor] = useState(settings.accentColor);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setErrorMsg(null);

    startTransition(async () => {
      try {
        await updatePlatformSettings({
          labName,
          institutionName,
          departmentName,
          primaryColor,
          secondaryColor,
          accentColor,
          supportEmail,
        });
        setFeedback("Configurações atualizadas com sucesso! O tema e as marcas visuais foram propagados em tempo real.");
        // Atualiza variáveis CSS diretamente no DOM para feedback imediato
        document.documentElement.style.setProperty("--primary", primaryColor);
        document.documentElement.style.setProperty("--secondary", secondaryColor);
      } catch (err: any) {
        setErrorMsg(err.message || "Erro ao salvar configurações.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {feedback && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-4 text-xs font-semibold text-red-800 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Painel 1: Identidade do Laboratório */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-bold">Identidade & Nomenclatura</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Defina o nome de exibição do laboratório e informações institucionais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Nome do Laboratório (Lab Name) *
              </label>
              <Input
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                placeholder="Ex: Lab CTPP"
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Instituição / Universidade
              </label>
              <Input
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="Ex: UNIFESP"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Departamento / Classificação
              </label>
              <Input
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="Ex: Living Lab"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                E-mail de Contato / Suporte
              </label>
              <Input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="Ex: labtecpp@unifesp.br"
                className="text-xs h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Painel 2: Paleta de Cores e Live Preview */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-secondary" />
              <CardTitle className="text-base font-bold">Cores da Interface (White-label)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Configure a paleta visual injetada como variáveis CSS em toda a aplicação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cor Primária */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Cor Primária (Verde / Ações Principais)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-12 rounded border border-border cursor-pointer p-0.5 bg-background"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#0E4330"
                  className="text-xs font-mono h-9 uppercase"
                />
              </div>
            </div>

            {/* Cor Secundária */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Cor Secundária (Azul Petróleo / Destaques)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-9 w-12 rounded border border-border cursor-pointer p-0.5 bg-background"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#24576C"
                  className="text-xs font-mono h-9 uppercase"
                />
              </div>
            </div>

            {/* Cor de Destaque */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Cor de Acento / Alertas
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-9 w-12 rounded border border-border cursor-pointer p-0.5 bg-background"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#F49E4C"
                  className="text-xs font-mono h-9 uppercase"
                />
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2 mt-4">
              <span className="text-[11px] font-bold text-foreground block uppercase tracking-wide">
                Pré-visualização do Tema:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <div
                  style={{ backgroundColor: primaryColor }}
                  className="px-3 py-1.5 rounded-md text-white text-xs font-semibold shadow-xs"
                >
                  Botão Primário
                </div>
                <div
                  style={{ backgroundColor: secondaryColor }}
                  className="px-3 py-1.5 rounded-md text-white text-xs font-semibold shadow-xs"
                >
                  Botão Secundário
                </div>
                <div
                  style={{ borderColor: primaryColor, color: primaryColor }}
                  className="px-2 py-0.5 rounded-md border text-[11px] font-bold"
                >
                  {labName}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2 shadow-xs text-xs h-10 px-6 cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <span>Salvar & Publicar Configurações</span>
        </Button>
      </div>
    </form>
  );
}
