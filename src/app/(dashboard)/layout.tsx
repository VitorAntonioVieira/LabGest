import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlatformSettings } from "@/lib/settings";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Busca dinâmica dos braços ativos, contadores reais e configurações de marca
  const [activeWorkspaces, activeCount, pendingCount, platformSettings] = await Promise.all([
    prisma.workspace.findMany({
      where: { status: "APPROVED" },
      select: { id: true, name: true, slug: true },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
    prisma.workspace.count({
      where: { status: "APPROVED" },
    }),
    prisma.workspace.count({
      where: { status: "PENDING" },
    }),
    getPlatformSettings(),
  ]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar 100% Dinâmica com Dados Reais da Sessão, Banco e White-label */}
      <Sidebar
        currentUser={
          session?.user
            ? {
                name: session.user.name || "Integrante UNIFESP",
                email: session.user.email || "",
                role: session.user.role || "STUDENT",
                avatarUrl: session.user.image || undefined,
              }
            : undefined
        }
        workspaces={activeWorkspaces}
        activeWorkspacesCount={activeCount}
        pendingApprovalsCount={pendingCount}
        brandSettings={{
          labName: platformSettings.labName,
          institutionName: platformSettings.institutionName,
          departmentName: platformSettings.departmentName,
          logoUrl: platformSettings.logoUrl,
        }}
      />

      {/* Conteúdo Principal com Barra Superior e Scroll Independente */}
      <div className="flex flex-1 flex-col h-full overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 min-h-0">
          <div className="max-w-7xl w-full mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
