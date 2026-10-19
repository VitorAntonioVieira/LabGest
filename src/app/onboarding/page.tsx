import React from "react";
import { redirect } from "next/navigation";
import { getActiveLabContext } from "@/lib/lab-context";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { user, approvedLabs, pendingLabs, allLaboratories } = await getActiveLabContext();

  if (!user) {
    redirect("/login");
  }

  // Se já possui laboratório aprovado, vai para o seletor de laboratórios disponíveis (/labs)
  if (approvedLabs.length > 0) {
    redirect("/labs");
  }

  // Se já enviou triagem e aguarda aprovação, vai para a sala de espera
  if (user.status === "WAITING_APPROVAL" && pendingLabs.length > 0) {
    redirect("/waiting-room");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4 sm:p-6">
      <div className="w-full max-w-xl space-y-6">
        <OnboardingForm
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            status: user.status,
            academicId: user.academicId,
            phone: user.phone,
            course: user.course,
          }}
          laboratories={allLaboratories as any}
        />
      </div>
    </div>
  );
}
