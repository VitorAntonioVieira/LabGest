import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveLabContext } from "@/lib/lab-context";
import { getLabMembers, getLabAttributions } from "@/app/actions";
import { MembersManagementClient } from "@/components/members/members-management-client";

export const metadata: Metadata = {
  title: "Controle de Integrantes & Atribuições | LabGest UNIFESP",
  description: "Gestão unificada de equipe, funções institucionais e permissões de acesso aos módulos do laboratório.",
};

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const { user, roleInLab } = await getActiveLabContext();

  if (!user) {
    redirect("/login");
  }

  // Busca dados consolidados de integrantes e atribuições do laboratório ativo
  const [members, attributions] = await Promise.all([
    getLabMembers(),
    getLabAttributions(),
  ]);

  return (
    <MembersManagementClient
      currentUserRole={roleInLab}
      initialMembers={members as any}
      initialAttributions={attributions}
    />
  );
}
