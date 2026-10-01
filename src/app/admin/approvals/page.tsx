import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShieldCheck, Users, FolderGit2, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PendingApprovals } from "@/components/dashboard/pending-approvals";

export default async function AdminApprovalsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "PROFESSOR") {
    redirect("/");
  }

  // 1. Busca solicitações pendentes
  const pendingUsers = await prisma.user.findMany({
    where: { status: "WAITING_APPROVAL" },
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
    orderBy: { createdAt: "asc" },
  });

  const pendingWorkspaces = await prisma.workspace.findMany({
    where: { status: "PENDING" },
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

  const activeWorkspaces = await prisma.workspace.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true,
      name: true,
      department: true,
      _count: { select: { members: true, tasks: true } },
    },
    orderBy: { name: "asc" },
  });

  const activeUsers = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      academicId: true,
      phone: true,
      course: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="lab" className="text-xs">
            Coordenação Geral
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Aprovações, Triagem & Gestão de Acessos
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Homologue novos membros do Living Lab, defina papéis hierárquicos e aprove abertura de novos braços de pesquisa.
        </p>
      </div>

      {/* Solicitações Pendentes (Membros e Workspaces) */}
      {(pendingUsers.length > 0 || pendingWorkspaces.length > 0) ? (
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
            Nenhuma solicitação pendente
          </CardTitle>
          <CardDescription className="text-xs max-w-sm mx-auto mt-1">
            Todas as inscrições de pesquisadores e solicitações de espaços de trabalho estão em dia.
          </CardDescription>
        </Card>
      )}

      {/* Relação de Pesquisadores Ativos */}
      <Card className="border border-border shadow-2xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-bold text-foreground">
                Pesquisadores & Membros Homologados ({activeUsers.length})
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Status: Ativo
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Membros com acesso liberado aos quadros e cadernos do laboratório.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="pb-2">Nome</th>
                  <th className="pb-2">E-mail</th>
                  <th className="pb-2">Papel (Role)</th>
                  <th className="pb-2">RA</th>
                  <th className="pb-2">Contato</th>
                  <th className="pb-2">Curso / Área</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {activeUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 font-semibold text-foreground">
                      {user.name || "Pesquisador"}
                    </td>
                    <td className="py-2.5 font-mono text-[11px] text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="py-2.5">
                      <Badge
                        variant={
                          user.role === "PROFESSOR"
                            ? "default"
                            : user.role === "LEADER"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-[10px] px-1.5 py-0 h-4"
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {user.academicId || "-"}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {user.phone || "-"}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {user.course || "-"}
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
