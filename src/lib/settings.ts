import { prisma } from "@/lib/prisma";

export interface PlatformConfig {
  labName: string;
  institutionName: string;
  departmentName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontColorLight: string;
  fontColorDark: string;
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
  fontColorLight: "#111827",
  fontColorDark: "#F8FAFC",
  logoUrl: null,
  faviconUrl: null,
  supportEmail: "contato@labctpp.unifesp.br",
};

/**
 * Obtém as configurações White-label da plataforma com fallback seguro
 */
export async function getPlatformSettings(): Promise<PlatformConfig> {
  try {
    const settings = await prisma.platformSettings.findFirst();

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
      fontColorLight: (settings as any).fontColorLight || DEFAULT_PLATFORM_CONFIG.fontColorLight,
      fontColorDark: (settings as any).fontColorDark || DEFAULT_PLATFORM_CONFIG.fontColorDark,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      supportEmail: settings.supportEmail || "contato@labctpp.unifesp.br",
    };
  } catch (error) {
    console.warn("[PlatformSettings] Usando configurações padrão de White-label.");
    return DEFAULT_PLATFORM_CONFIG;
  }
}
