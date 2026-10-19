import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveLabContext } from "@/lib/lab-context";
import { DocumentEditor } from "@/components/docs/document-editor";

interface PersonalDocEditorPageProps {
  params: {
    docId: string;
  };
}

export default async function PersonalDocEditorPage({
  params,
}: PersonalDocEditorPageProps) {
  const { user, activeLabId, roleInLab } = await getActiveLabContext();
  if (!user) {
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

  if (document.workspaceId) {
    redirect(`/workspace/${document.workspaceId}/docs/${document.id}`);
  }

  const siblingDocs = await prisma.document.findMany({
    where: {
      labId: document.labId || activeLabId,
      ownerId: user.id,
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
        id: user.id,
        name: user.name || null,
        role: roleInLab,
      }}
    />
  );
}
