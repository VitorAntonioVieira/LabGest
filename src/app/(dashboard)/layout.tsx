import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveLabContext } from "@/lib/lab-context";
import { getPlatformSettings } from "@/lib/settings";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    user,
    activeLabId,
    roleInLab,
    statusInLab,
    approvedLabs,
  } = await getActiveLabContext();

  if (user && statusInLab !== "ACTIVE" && approvedLabs.length === 0) {
    if (user.status === "PENDING") {
      redirect("/onboarding");
    }
    redirect("/waiting-room");
  }

  // Busca dinâmica dos braços ativos, contadores reais e configurações White-label do laboratório ativo
  const [
    activeWorkspaces,
    activeCount,
    pendingWorkspacesCount,
    pendingUsersCount,
    platformSettings,
  ] = await Promise.all([
    prisma.workspace.findMany({
      where: { labId: activeLabId, status: "APPROVED" },
      select: { id: true, name: true, slug: true },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
    prisma.workspace.count({
      where: { labId: activeLabId, status: "APPROVED" },
    }),
    prisma.workspace.count({
      where: { labId: activeLabId, status: "PENDING" },
    }),
    prisma.labMembership.count({
      where: { labId: activeLabId, status: "WAITING_APPROVAL" },
    }),
    getPlatformSettings(activeLabId),
  ]);

  const totalPendingApprovals = pendingWorkspacesCount + pendingUsersCount;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar 100% Dinâmica com Dados Reais da Sessão, Laboratório Ativo e White-label */}
      <Sidebar
        currentUser={
          user
            ? {
                name: user.name || "Integrante UNIFESP",
                email: user.email || "",
                role: roleInLab,
                avatarUrl: user.image || undefined,
              }
            : undefined
        }
        activeLabId={activeLabId}
        approvedLabs={approvedLabs.map((l) => ({
          id: l.id,
          name: l.name,
          slug: l.slug,
          primaryColor: l.primaryColor,
          role: l.membershipRole,
        }))}
        workspaces={activeWorkspaces}
        activeWorkspacesCount={activeCount}
        pendingApprovalsCount={totalPendingApprovals}
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
