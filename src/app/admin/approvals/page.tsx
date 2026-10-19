import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveLabContext } from "@/lib/lab-context";
import { ShieldCheck, Users, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PendingApprovals } from "@/components/dashboard/pending-approvals";

export const dynamic = "force-dynamic";

export default async function AdminApprovalsPage() {
  const { user, activeLab, activeLabId, roleInLab, canApproveInLab } =
    await getActiveLabContext();

  if (!user) {
    redirect("/login");
  }

  // Tanto o Responsável do Lab (PROFESSOR) quanto os Líderes (LEADER) podem aprovar pedidos de triagem!
  if (!canApproveInLab) {
    redirect("/");
  }

  // 1. Busca solicitações de triagem pendentes para este laboratório (LabMembership WAITING_APPROVAL)
  const pendingMemberships = await prisma.labMembership.findMany({
    where: {
      labId: activeLabId,
      status: "WAITING_APPROVAL",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          academicId: true,
          phone: true,
          course: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const pendingUsers = pendingMemberships.map((m) => ({
    ...m.user,
    createdAt: m.createdAt,
  }));

  // 2. Busca solicitações de Workspaces pendentes neste laboratório
  const pendingWorkspaces = await prisma.workspace.findMany({
    where: {
      labId: activeLabId,
      status: "PENDING",
    },
    include: {
      requestedBy: {
        select: {
          name: true,
          email: true,
          course: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // 3. Workspaces ativos neste laboratório para alocação durante a triagem
  const activeWorkspaces = await prisma.workspace.findMany({
    where: {
      labId: activeLabId,
      status: "APPROVED",
    },
    select: {
      id: true,
      name: true,
      department: true,
      _count: { select: { members: true, tasks: true } },
    },
    orderBy: { name: "asc" },
  });

  // 4. Membros já homologados neste laboratório
  const activeMemberships = await prisma.labMembership.findMany({
    where: {
      labId: activeLabId,
      status: "ACTIVE",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          academicId: true,
          phone: true,
          course: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const activeUsers = activeMemberships.map((m) => ({
    ...m.user,
    role: m.role,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="lab" className="text-xs">
            {activeLab.name} • {roleInLab === "PROFESSOR" ? "Coordenação Geral" : "Liderança do Lab"}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Aprovações, Triagem & Gestão de Acessos ({activeLab.name})
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Homologue pedidos de triagem enviados para o <strong>{activeLab.name}</strong>, defina papéis hierárquicos e aprove abertura de novos braços de pesquisa.
        </p>
      </div>

      {/* Solicitações Pendentes (Membros e Workspaces) */}
      {pendingUsers.length > 0 || pendingWorkspaces.length > 0 ? (
        <PendingApprovals
          workspaces={pendingWorkspaces}
          pendingUsers={pendingUsers}
          activeWorkspaces={activeWorkspaces}
        />
      ) : (
        <Card className="border border-dashed border-border/80 p-8 text-center bg-card/50">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-semibold text-foreground">
            Nenhuma solicitação de triagem pendente em {activeLab.name}
          </CardTitle>
          <CardDescription className="text-xs max-w-sm mx-auto mt-1">
            Todas as inscrições de integrantes e solicitações de espaços de trabalho deste laboratório estão em dia.
          </CardDescription>
        </Card>
      )}

      {/* Relação de Integrantes Ativos neste Laboratório */}
      <Card className="border border-border shadow-2xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-bold text-foreground">
                Integrantes Homologados em {activeLab.name} ({activeUsers.length})
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Status: Ativo
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Membros com acesso liberado aos quadros e cadernos deste laboratório.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="pb-2">Nome</th>
                  <th className="pb-2">E-mail</th>
                  <th className="pb-2">Função no Lab</th>
                  <th className="pb-2">RA</th>
                  <th className="pb-2">Contato</th>
                  <th className="pb-2">Curso / Área</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {activeUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 font-semibold text-foreground">
                      {u.name || "Integrante"}
                    </td>
                    <td className="py-2.5 font-mono text-[11px] text-muted-foreground">
                      {u.email}
                    </td>
                    <td className="py-2.5">
                      <Badge
                        variant={
                          u.role === "PROFESSOR"
                            ? "default"
                            : u.role === "LEADER"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-[10px] px-1.5 py-0 h-4"
                      >
                        {u.role === "PROFESSOR"
                          ? "Professor"
                          : u.role === "LEADER"
                          ? "Líder (Gestão)"
                          : "Integrante"}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {u.academicId || "-"}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {u.phone || "-"}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {u.course || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
