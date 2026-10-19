import React from "react";
import { redirect } from "next/navigation";
import { getActiveLabContext } from "@/lib/lab-context";
import { getPlatformSettings } from "@/lib/settings";
import { Sliders } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PlatformSettingsForm } from "@/components/admin/platform-settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { user, activeLab, activeLabId, canManageLab } = await getActiveLabContext();

  if (!user) {
    redirect("/login");
  }

  if (!canManageLab) {
    redirect("/");
  }

  const settings = await getPlatformSettings(activeLabId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="lab" className="text-xs">
            {activeLab.name} • Coordenação Geral
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
          <Sliders className="h-7 w-7 text-primary" />
          Configurações White-label ({activeLab.name})
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalize a identidade institucional, o logotipo e a paleta de cores exclusivas do laboratório <strong>{activeLab.name}</strong>.
        </p>
      </div>

      {/* Formulário com Pré-visualização em Tempo Real */}
      <PlatformSettingsForm settings={settings} />
    </div>
  );
}
