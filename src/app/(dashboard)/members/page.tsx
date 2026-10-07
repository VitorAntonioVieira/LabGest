import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLabMembers, getLabAttributions } from "@/app/actions";
import { MembersManagementClient } from "@/components/members/members-management-client";
import type { UserRole } from "@/types";

export const metadata: Metadata = {
  title: "Controle de Integrantes & Atribuições | LabGest CTPP",
  description: "Gestão unificada de equipe, funções institucionais e permissões de acesso aos módulos do laboratório.",
};

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Busca dados consolidados de integrantes e atribuições no banco
  const [members, attributions] = await Promise.all([
    getLabMembers(),
    getLabAttributions(),
  ]);

  const currentUserRole = (session.user.role || "STUDENT") as UserRole;

  return (
    <MembersManagementClient
      currentUserRole={currentUserRole}
      initialMembers={members as any}
      initialAttributions={attributions}
    />
  );
}
