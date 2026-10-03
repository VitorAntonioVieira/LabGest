"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sliders,
  Palette,
  CheckCircle2,
  Loader2,
  Sparkles,
  Building,
  Mail,
  RefreshCw,
  Image as ImageIcon,
  Globe,
  Sun,
  Moon,
  ExternalLink,
  Layers,
  Calendar,
  Check,
} from "lucide-react";
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
import { updatePlatformSettings } from "@/app/actions";
import { cn } from "@/lib/utils";

interface PlatformSettingsFormProps {
  settings: {
    labName: string;
    institutionName: string;
    departmentName: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontColorLight?: string | null;
    fontColorDark?: string | null;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    supportEmail: string;
  };
}

export function PlatformSettingsForm({ settings }: PlatformSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Estados dos campos de texto e identidade
  const [labName, setLabName] = useState(settings.labName || "Lab CTPP");
  const [institutionName, setInstitutionName] = useState(settings.institutionName || "UNIFESP");
  const [departmentName, setDepartmentName] = useState(settings.departmentName || "Living Lab");
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail || "contato@labctpp.unifesp.br");

  // Estados de Imagens e Favicon
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || "");
  const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl || "");

  // Estados de Paleta de Cores e Fontes
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || "#0E4330");
  const [secondaryColor, setSecondaryColor] = useState(settings.secondaryColor || "#24576C");
  const [accentColor, setAccentColor] = useState(settings.accentColor || "#1F8A64");
  const [fontColorLight, setFontColorLight] = useState(settings.fontColorLight || "#111827");
  const [fontColorDark, setFontColorDark] = useState(settings.fontColorDark || "#F8FAFC");

  // Modo de pré-visualização ativo: "light" ou "dark"
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");

  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Submissão do Formulário
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
          fontColorLight,
          fontColorDark,
          logoUrl: logoUrl.trim() || null,
          faviconUrl: faviconUrl.trim() || null,
          supportEmail,
        });

        setFeedback(
          "Configurações salvas e publicadas com sucesso! Logo, favicon, cores e fontes foram atualizados."
        );

        // Atualização reativa imediata no DOM
        document.documentElement.style.setProperty("--primary", primaryColor);
        document.documentElement.style.setProperty("--secondary", secondaryColor);
        document.documentElement.style.setProperty(
          "--foreground",
          document.documentElement.classList.contains("dark") ? fontColorDark : fontColorLight
        );

        router.refresh();
      } catch (err: any) {
        setErrorMsg(err.message || "Erro ao salvar configurações.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Alertas de Notificação */}
      {feedback && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-semibold text-destructive animate-in fade-in">
          {errorMsg}
        </div>
      )}

      {/* Grid Superior: Configurações em 2 Colunas */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ======================================================== */}
        {/* COLUNA 1: IDENTIDADE, LOGO E FAVICON                     */}
        {/* ======================================================== */}
        <div className="space-y-6">
          {/* Card: Identidade Geral */}
          <Card className="border border-border shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-bold">Identidade Institucional</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Nome do laboratório, departamento e universidade parceira.
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Universidade / Instituição
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
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  E-mail de Contato / Suporte
                </label>
                <Input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="Ex: labctpp@unifesp.br"
                  className="text-xs h-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card: Logotipo e Favicon */}
          <Card className="border border-border shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-secondary" />
                <CardTitle className="text-base font-bold">Logotipo & Favicon</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Altere o logotipo exibido na barra lateral e o favicon da aba do navegador.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Campo: Logo do Lab */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>URL do Logotipo do Laboratório</span>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      className="text-[10px] text-muted-foreground hover:text-destructive underline"
                    >
                      Remover / Restaurar padrão
                    </button>
                  )}
                </label>
                <div className="flex gap-2 items-center">
                  <div className="h-9 w-9 rounded-md border border-border bg-muted/30 flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo Preview"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Layers className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <Input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://exemplo.com/logo.png ou /logo.png"
                    className="text-xs h-9 flex-1"
                  />
                </div>
                {/* Sugestões Rápidas de Logo */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground mr-1">Exemplos:</span>
                  <button
                    type="button"
                    onClick={() => setLogoUrl("https://upload.wikimedia.org/wikipedia/commons/4/4b/Logo_Unifesp.png")}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Brasão UNIFESP
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoUrl("https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=100&auto=format&fit=crop&q=60")}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Símbolo de Pesquisa
                  </button>
                </div>
              </div>

              {/* Campo: Favicon */}
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>URL do Favicon (Aba do Navegador)</span>
                  {faviconUrl && (
                    <button
                      type="button"
                      onClick={() => setFaviconUrl("")}
                      className="text-[10px] text-muted-foreground hover:text-destructive underline"
                    >
                      Restaurar padrão
                    </button>
                  )}
                </label>
                <div className="flex gap-2 items-center">
                  <div className="h-9 w-9 rounded-md border border-border bg-muted/30 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
                    {faviconUrl ? (
                      <img
                        src={faviconUrl}
                        alt="Favicon Preview"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Globe className="h-4 w-4 text-secondary" />
                    )}
                  </div>
                  <Input
                    type="url"
                    value={faviconUrl}
                    onChange={(e) => setFaviconUrl(e.target.value)}
                    placeholder="https://exemplo.com/favicon.ico ou /favicon.ico"
                    className="text-xs h-9 flex-1"
                  />
                </div>
                {/* Sugestões Rápidas de Favicon */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground mr-1">Exemplos:</span>
                  <button
                    type="button"
                    onClick={() => setFaviconUrl("https://fav.farm/🌿")}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    🌿 Folha Lab
                  </button>
                  <button
                    type="button"
                    onClick={() => setFaviconUrl("https://fav.farm/🔬")}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    🔬 Microscópio
                  </button>
                  <button
                    type="button"
                    onClick={() => setFaviconUrl("https://fav.farm/📑")}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    📑 Caderno
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* COLUNA 2: CORES DA MARCA E CORES DAS FONTES              */}
        {/* ======================================================== */}
        <div className="space-y-6">
          <Card className="border border-border shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-bold">Cores da Marca & Ações</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Cores aplicadas em botões, destaques, barras e cabeçalhos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cor Primária */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Cor Primária (Verde Lab / Ações)</span>
                  <span className="text-[10px] text-muted-foreground">Botões principais e links</span>
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
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Cor Secundária (Petróleo CTPP)</span>
                  <span className="text-[10px] text-muted-foreground">Destaques e documentação</span>
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

              {/* Cor de Acento */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Cor de Acento (Alertas e Badges)</span>
                  <span className="text-[10px] text-muted-foreground">Status e notificações</span>
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
                    placeholder="#1F8A64"
                    className="text-xs font-mono h-9 uppercase"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Cor das Fontes (Modo Claro & Modo Escuro) */}
          <Card className="border border-border shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-secondary" />
                <CardTitle className="text-base font-bold">Cores das Fontes (Tipografia)</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Ajuste a cor principal dos textos nos modos claro e escuro para contraste perfeito.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fonte Modo Claro */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                  <span>Cor da Fonte — Modo Claro (Light Mode)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={fontColorLight}
                    onChange={(e) => setFontColorLight(e.target.value)}
                    className="h-9 w-12 rounded border border-border cursor-pointer p-0.5 bg-background"
                  />
                  <Input
                    value={fontColorLight}
                    onChange={(e) => setFontColorLight(e.target.value)}
                    placeholder="#111827"
                    className="text-xs font-mono h-9 uppercase"
                  />
                </div>
                {/* Presets de Fonte Clara */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setFontColorLight("#111827")}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Grafite Escuro (#111827)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontColorLight("#0F172A")}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Azul Ardósia (#0F172A)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontColorLight("#0E231C")}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Verde Floresta (#0E231C)
                  </button>
                </div>
              </div>

              {/* Fonte Modo Escuro */}
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Moon className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Cor da Fonte — Modo Escuro (Dark Mode)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={fontColorDark}
                    onChange={(e) => setFontColorDark(e.target.value)}
                    className="h-9 w-12 rounded border border-border cursor-pointer p-0.5 bg-background"
                  />
                  <Input
                    value={fontColorDark}
                    onChange={(e) => setFontColorDark(e.target.value)}
                    placeholder="#F8FAFC"
                    className="text-xs font-mono h-9 uppercase"
                  />
                </div>
                {/* Presets de Fonte Escura */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setFontColorDark("#F8FAFC")}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Branco Neve (#F8FAFC)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontColorDark("#F0FDF4")}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Menta Suave (#F0FDF4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontColorDark("#E2E8F0")}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cinza Prateado (#E2E8F0)
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEÇÃO COMPLETA: EXEMPLOS DE ESTILIZAÇÃO (LIVE PREVIEWS)  */}
      {/* ======================================================== */}
      <Card className="border border-border/80 shadow-md overflow-hidden bg-card">
        <CardHeader className="border-b border-border/60 pb-3 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-bold">
                  Exemplos de Estilização em Tempo Real (Showcase da White-label)
                </CardTitle>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Veja instantaneamente como o logotipo, o favicon, as cores e a tipografia interagem nos temas Claro e Escuro.
              </CardDescription>
            </div>

            {/* Alternador de Modo de Pré-visualização */}
            <div className="flex items-center rounded-lg border border-border bg-background p-1 self-start sm:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setPreviewMode("light")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                  previewMode === "light"
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span>Modo Claro</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewMode("dark")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                  previewMode === "dark"
                    ? "bg-indigo-900/40 text-indigo-200 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Moon className="h-3.5 w-3.5 text-indigo-400" />
                <span>Modo Escuro</span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* 1. Mockup da Aba do Navegador (Favicon + Título) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              1. Simulação da Aba do Navegador (Favicon & Título):
            </span>
            <div className="rounded-lg border border-border/80 bg-muted/40 p-2 max-w-sm flex items-center gap-2.5 shadow-2xs">
              <div className="h-4 w-4 shrink-0 flex items-center justify-center">
                {faviconUrl ? (
                  <img src={faviconUrl} alt="Favicon" className="h-full w-full object-contain" />
                ) : (
                  <Globe className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
              <span className="text-xs font-semibold text-foreground truncate">
                {labName} | Plataforma {institutionName}
              </span>
            </div>
          </div>

          {/* 2. Container de Demonstração (Muda conforme o previewMode) */}
          <div
            style={{
              backgroundColor: previewMode === "light" ? "#FAFAFA" : "#0A1310",
              borderColor: previewMode === "light" ? "#E2E8F0" : "#1A2E26",
              color: previewMode === "light" ? fontColorLight : fontColorDark,
            }}
            className="rounded-2xl border p-6 space-y-6 transition-all duration-200 shadow-inner"
          >
            {/* Topo: Logo + Identidade no Cabeçalho */}
            <div
              style={{
                borderColor: previewMode === "light" ? "#E2E8F0" : "#1A2E26",
              }}
              className="flex items-center justify-between border-b pb-4"
            >
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <div className="h-10 w-10 rounded-xl border border-border/50 bg-white/10 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    <img src={logoUrl} alt={labName} className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div
                    style={{ backgroundColor: primaryColor }}
                    className="h-10 w-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-base"
                  >
                    <Layers className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h3
                    style={{ color: previewMode === "light" ? fontColorLight : fontColorDark }}
                    className="text-base font-extrabold tracking-tight leading-none"
                  >
                    {labName}
                  </h3>
                  <p className="text-[11px] opacity-75 mt-0.5 font-medium uppercase tracking-wider">
                    {departmentName} • {institutionName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  style={{
                    backgroundColor: previewMode === "light" ? `${primaryColor}15` : `${primaryColor}30`,
                    borderColor: `${primaryColor}40`,
                    color: previewMode === "light" ? primaryColor : "#34D399",
                  }}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold border"
                >
                  {institutionName} Ativo
                </span>
              </div>
            </div>

            {/* Demonstração de Tipografia e Hierarquia de Texto */}
            <div className="space-y-2">
              <h2
                style={{ color: previewMode === "light" ? fontColorLight : fontColorDark }}
                className="text-lg font-black tracking-tight"
              >
                Quadro Kanban de Pesquisa & Governança Científica
              </h2>
              <p
                style={{ color: previewMode === "light" ? fontColorLight : fontColorDark }}
                className="text-xs leading-relaxed opacity-90 max-w-2xl"
              >
                Este texto demonstra a legibilidade da fonte configurada para o <strong>{previewMode === "light" ? "Modo Claro" : "Modo Escuro"}</strong>. O contraste foi calibrado para garantir conforto visual em longos períodos de leitura técnica, documentação experimental e relatórios de bolsas.
              </p>
            </div>

            {/* Demonstração de Componentes: Botões, Badges e Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Card Simulado de Tarefa Kanban */}
              <div
                style={{
                  backgroundColor: previewMode === "light" ? "#FFFFFF" : "#11201A",
                  borderColor: previewMode === "light" ? "#E2E8F0" : "#1E362C",
                  color: previewMode === "light" ? fontColorLight : fontColorDark,
                }}
                className="p-4 rounded-xl border shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{
                      backgroundColor: `${primaryColor}20`,
                      color: previewMode === "light" ? primaryColor : "#34D399",
                    }}
                    className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                  >
                    Em Andamento
                  </span>
                  <span className="text-[10px] opacity-60 flex items-center gap-1 font-mono">
                    <Calendar className="h-3 w-3" /> 20/11/2026
                  </span>
                </div>

                <h4
                  style={{ color: previewMode === "light" ? fontColorLight : fontColorDark }}
                  className="text-xs font-bold leading-snug"
                >
                  Mapeamento de Políticas Públicas e Tecnologias Sociais
                </h4>

                <p className="text-[11px] opacity-75 line-clamp-2">
                  Análise comparativa das metodologias ativas do Living Lab CTPP.
                </p>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                  <span
                    style={{ color: secondaryColor }}
                    className="text-[10px] font-bold"
                  >
                    12h Apontadas
                  </span>
                  <span
                    style={{
                      backgroundColor: primaryColor,
                      color: "#FFFFFF",
                    }}
                    className="h-5 px-2 rounded text-[9px] font-bold flex items-center justify-center shadow-xs"
                  >
                    Ver Atividade
                  </span>
                </div>
              </div>

              {/* Bloco de Botões e Ações Rápidas */}
              <div
                style={{
                  backgroundColor: previewMode === "light" ? "#FFFFFF" : "#11201A",
                  borderColor: previewMode === "light" ? "#E2E8F0" : "#1E362C",
                }}
                className="p-4 rounded-xl border shadow-xs flex flex-col justify-between gap-3"
              >
                <span
                  style={{ color: previewMode === "light" ? fontColorLight : fontColorDark }}
                  className="text-[11px] font-bold uppercase tracking-wider opacity-80"
                >
                  Botões de Ação do Tema:
                </span>

                <div className="flex flex-wrap gap-2">
                  {/* Botão Primário */}
                  <button
                    type="button"
                    style={{
                      backgroundColor: primaryColor,
                      color: "#FFFFFF",
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Ação Primária</span>
                  </button>

                  {/* Botão Secundário */}
                  <button
                    type="button"
                    style={{
                      backgroundColor: secondaryColor,
                      color: "#FFFFFF",
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity"
                  >
                    <span>Secundário</span>
                  </button>

                  {/* Badge de Alerta / Acento */}
                  <div
                    style={{
                      backgroundColor: `${accentColor}25`,
                      borderColor: accentColor,
                      color: accentColor,
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1"
                  >
                    <span>Destaque</span>
                  </div>
                </div>

                <p className="text-[10px] opacity-70">
                  Paleta sincronizada: Primária ({primaryColor}) • Secundária ({secondaryColor}) • Acento ({accentColor})
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/20 border-t border-border/60 p-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Alterne os modos Claro/Escuro acima para validar contraste antes de publicar.
          </span>

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
        </CardFooter>
      </Card>
    </form>
  );
}
