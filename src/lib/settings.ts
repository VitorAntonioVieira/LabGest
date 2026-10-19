import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ACTIVE_LAB_COOKIE, DEFAULT_LAB_ID, ensureDefaultLaboratory } from "@/lib/lab-context";

export interface PlatformConfig {
  labId: string;
  labSlug: string;
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
  labId: DEFAULT_LAB_ID,
  labSlug: "lab-ctpp",
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
 * Obtém as configurações White-label do laboratório ativo (ou de um labId específico) com fallback seguro
 */
export async function getPlatformSettings(explicitLabId?: string): Promise<PlatformConfig> {
  try {
    await ensureDefaultLaboratory();

    let targetLabId = explicitLabId;
    if (!targetLabId) {
      try {
        targetLabId = cookies().get(ACTIVE_LAB_COOKIE)?.value || DEFAULT_LAB_ID;
      } catch {
        targetLabId = DEFAULT_LAB_ID;
      }
    }

    const lab =
      (await prisma.laboratory.findUnique({
        where: { id: targetLabId },
        include: { platformSettings: true },
      })) ||
      (await prisma.laboratory.findUnique({
        where: { id: DEFAULT_LAB_ID },
        include: { platformSettings: true },
      })) ||
      (await prisma.laboratory.findFirst({
        include: { platformSettings: true },
        orderBy: { createdAt: "asc" },
      }));

    if (lab) {
      const ps = lab.platformSettings;
      return {
        labId: lab.id,
        labSlug: lab.slug,
        labName: ps?.labName || lab.name,
        institutionName: ps?.institutionName || lab.institutionName,
        departmentName: ps?.departmentName || lab.departmentName,
        primaryColor: ps?.primaryColor || lab.primaryColor,
        secondaryColor: ps?.secondaryColor || lab.secondaryColor,
        accentColor: ps?.accentColor || lab.accentColor,
        fontColorLight:
          ps?.fontColorLight || lab.fontColorLight || DEFAULT_PLATFORM_CONFIG.fontColorLight,
        fontColorDark:
          ps?.fontColorDark || lab.fontColorDark || DEFAULT_PLATFORM_CONFIG.fontColorDark,
        logoUrl: ps?.logoUrl !== undefined ? ps.logoUrl : lab.logoUrl,
        faviconUrl: ps?.faviconUrl !== undefined ? ps.faviconUrl : lab.faviconUrl,
        supportEmail:
          ps?.supportEmail || lab.supportEmail || DEFAULT_PLATFORM_CONFIG.supportEmail,
      };
    }

    const settings = await prisma.platformSettings.findFirst();
    if (!settings) {
      return DEFAULT_PLATFORM_CONFIG;
    }

    return {
      labId: settings.labId || DEFAULT_LAB_ID,
      labSlug: "lab-ctpp",
      labName: settings.labName,
      institutionName: settings.institutionName,
      departmentName: settings.departmentName,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      fontColorLight: settings.fontColorLight || DEFAULT_PLATFORM_CONFIG.fontColorLight,
      fontColorDark: settings.fontColorDark || DEFAULT_PLATFORM_CONFIG.fontColorDark,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      supportEmail: settings.supportEmail || "contato@labctpp.unifesp.br",
    };
  } catch (error) {
    console.warn("[PlatformSettings] Usando configurações padrão de White-label.");
    return DEFAULT_PLATFORM_CONFIG;
  }
}
