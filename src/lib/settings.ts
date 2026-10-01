import { prisma } from "@/lib/prisma";

export interface PlatformConfig {
  labName: string;
  institutionName: string;
  departmentName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  supportEmail: string;
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  labName: "Lab CTPP",
  institutionName: "UNIFESP",
  departmentName: "Living Lab Universitário",
  primaryColor: "#0E4330",
  secondaryColor: "#24576C",
  accentColor: "#1F8A64",
  logoUrl: null,
  faviconUrl: null,
  supportEmail: "contato@labctpp.unifesp.br",
};

/**
 * Obtém as configurações White-label da plataforma com fallback seguro
 */
export async function getPlatformSettings(): Promise<PlatformConfig> {
  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      return DEFAULT_PLATFORM_CONFIG;
    }

    return {
      labName: settings.labName,
      institutionName: settings.institutionName,
      departmentName: settings.departmentName,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      supportEmail: settings.supportEmail || "contato@labctpp.unifesp.br", //TODO: Colocar o email correto do Lab CTPP
    };
  } catch (error) {
    console.warn("[PlatformSettings] Usando configurações padrão de White-label.");
    return DEFAULT_PLATFORM_CONFIG;
  }
}
