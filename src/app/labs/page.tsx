import React from "react";
import { redirect } from "next/navigation";
import { getActiveLabContext } from "@/lib/lab-context";
import { LabSelectorClient } from "@/components/labs/lab-selector-client";

export const dynamic = "force-dynamic";

export default async function LabsHubPage() {
  const { user, activeLabId, allLaboratories } = await getActiveLabContext();

  if (!user) {
    redirect("/login");
  }

  // Se o usuário ainda não preencheu seus dados acadêmicos iniciais (RA/Telefone)
  if (user.status === "PENDING" && !user.academicId) {
    redirect("/onboarding");
  }

  return (
    <LabSelectorClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      }}
      activeLabId={activeLabId}
      laboratories={allLaboratories as any}
    />
  );
}

