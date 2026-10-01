import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/components/providers/session-provider";
import { getPlatformSettings } from "@/lib/settings";
import { hexToHsl } from "@/lib/colors";

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

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Injeção Dinâmica de Variáveis CSS White-label */}
        <style
          id="dynamic-brand-theme"
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --primary: ${primaryHsl};
                --secondary: ${secondaryHsl};
                --ring: ${primaryHsl};
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
