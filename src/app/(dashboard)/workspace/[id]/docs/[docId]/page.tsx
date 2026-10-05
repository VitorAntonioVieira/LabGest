import React from "react";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentEditor } from "@/components/docs/document-editor";

interface WorkspaceDocEditorPageProps {
  params: {
    id: string;
    docId: string;
  };
}

export default async function WorkspaceDocEditorPage({
  params,
}: WorkspaceDocEditorPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Busca o workspace por id ou slug
  const workspace = await prisma.workspace.findFirst({
    where: {
      OR: [{ id: params.id }, { slug: params.id }],
    },
  });

  if (!workspace) {
    notFound();
  }

  // Busca o caderno específico
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

  // Busca todas as páginas do caderno deste workspace para a navegação estilo OneNote
  const siblingDocs = await prisma.document.findMany({
    where: { workspaceId: workspace.id },
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
