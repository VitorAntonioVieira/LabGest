import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/components/providers/session-provider";
import { getPlatformSettings } from "@/lib/settings";
import { hexToHsl, hexToDarkHsl } from "@/lib/colors";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();

  return {
    title: `${settings.labName} | Plataforma ${settings.institutionName}`,
    description: `Plataforma integrada de gestão, kanban, documentos e produtividade científica para o ${settings.labName} da ${settings.institutionName}.`,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getPlatformSettings();
  const primaryHsl = hexToHsl(settings.primaryColor);
  const secondaryHsl = hexToHsl(settings.secondaryColor);
  const darkPrimaryHsl = hexToDarkHsl(settings.primaryColor);
  const darkSecondaryHsl = hexToDarkHsl(settings.secondaryColor);
  const fontLightHsl = hexToHsl(settings.fontColorLight || "#111827");
  const fontDarkHsl = hexToHsl(settings.fontColorDark || "#F8FAFC");

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Favicon Dinâmico da White-label */}
        <link rel="icon" href={settings.faviconUrl || "/favicon.ico"} />

        {/* Injeção Dinâmica de Variáveis CSS White-label (Cores da Marca e Fontes) */}
        <style
          id="dynamic-brand-theme"
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --primary: ${primaryHsl};
                --secondary: ${secondaryHsl};
                --ring: ${primaryHsl};
                --foreground: ${fontLightHsl};
                --card-foreground: ${fontLightHsl};
                --popover-foreground: ${fontLightHsl};
              }
              .dark {
                --primary: ${darkPrimaryHsl};
                --secondary: ${darkSecondaryHsl};
                --ring: ${darkPrimaryHsl};
                --foreground: ${fontDarkHsl};
                --card-foreground: ${fontDarkHsl};
                --popover-foreground: ${fontDarkHsl};
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
