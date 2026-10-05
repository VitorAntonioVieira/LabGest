import React from "react";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentEditor } from "@/components/docs/document-editor";

interface PersonalDocEditorPageProps {
  params: {
    docId: string;
  };
}

export default async function PersonalDocEditorPage({
  params,
}: PersonalDocEditorPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const document = await prisma.document.findUnique({
    where: { id: params.docId },
    include: {
      owner: {
        select: { id: true, name: true, image: true, email: true },
      },
      workspace: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!document) {
    notFound();
  }

  // Se o documento pertencer a um workspace, redireciona para a rota contextualizada do workspace
  if (document.workspaceId) {
    redirect(`/workspace/${document.workspaceId}/docs/${document.id}`);
  }

  // Para notas pessoais, busca irmãos do mesmo proprietário
  const siblingDocs = await prisma.document.findMany({
    where: {
      ownerId: session.user.id,
      type: "PERSONAL",
    },
    select: {
      id: true,
      title: true,
      icon: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <DocumentEditor
      initialDocument={document}
      workspaceDocuments={siblingDocs}
      currentUser={{
        id: session.user.id,
        name: session.user.name || null,
        role: (session.user as any).role,
      }}
    />
  );
}
