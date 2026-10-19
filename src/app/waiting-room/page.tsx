import React from "react";
import { redirect } from "next/navigation";
import { getActiveLabContext } from "@/lib/lab-context";
import { WaitingRoomClient } from "@/components/onboarding/waiting-room-client";

export const dynamic = "force-dynamic";

export default async function WaitingRoomPage() {
  const { user, approvedLabs, pendingLabs } = await getActiveLabContext();

  if (!user) {
    redirect("/login");
  }

  // Se já foi aprovado em ao menos um laboratório, exibe a tela de laboratórios disponíveis (/labs)
  if (approvedLabs.length > 0) {
    redirect("/labs");
  }

  // Se ainda não preencheu o formulário inicial
  if (user.status === "PENDING") {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4 sm:p-6">
      <div className="w-full max-w-lg space-y-6">
        <WaitingRoomClient
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            status: user.status,
            academicId: user.academicId,
            phone: user.phone,
            course: user.course,
            createdAt: user.createdAt,
          }}
          pendingLabs={pendingLabs as any}
        />
      </div>
    </div>
  );
}
