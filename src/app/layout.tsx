import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/components/providers/session-provider";
import { getPlatformSettings } from "@/lib/settings";
import { hexToHsl, hexToDarkHsl } from "@/lib/colors";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  fallback: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

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
    <html lang="pt-BR" className={`${inter.variable} ${inter.className}`} suppressHydrationWarning>
      <head>
        {/* Favicon Dinâmico da White-label */}
        <link rel="icon" href={settings.faviconUrl || "/favicon.ico"} />

        {/* Preconnect e Carregamento Robusto do Google Fonts (Inter, Outfit, Plus Jakarta Sans) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />

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
      <body className={`${inter.variable} ${inter.className} font-sans antialiased bg-background text-foreground min-h-screen`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
