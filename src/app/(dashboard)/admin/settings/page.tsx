import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/settings";
import { Sliders, Palette, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PlatformSettingsForm } from "@/components/admin/platform-settings-form";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "PROFESSOR") {
    redirect("/");
  }

  const settings = await getPlatformSettings();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="lab" className="text-xs">
            Coordenação Geral
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
          <Sliders className="h-7 w-7 text-primary" />
          Configurações da Plataforma (White-label)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalize a identidade institucional, o nome do laboratório e a paleta de cores padrão de toda a aplicação.
        </p>
      </div>

      {/* Formulário com Pré-visualização em Tempo Real */}
      <PlatformSettingsForm settings={settings} />
    </div>
  );
}
