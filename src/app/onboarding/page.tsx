import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      status: true,
      academicId: true,
      phone: true,
      course: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Se já está ativo, vai para o dashboard
  if (user.status === "ACTIVE") {
    redirect("/");
  }

  // Se já enviou e aguarda aprovação, vai para a sala de espera
  if (user.status === "WAITING_APPROVAL") {
    redirect("/waiting-room");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4 sm:p-6">
      <div className="w-full max-w-lg space-y-6">
        <OnboardingForm user={user} />
      </div>
    </div>
  );
}
