import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookOpen, ArrowLeft, Plus, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DocsHeaderActions } from "@/components/docs/docs-header-actions";

interface DocsPageProps {
  params: {
    id: string;
  };
}

export default async function WorkspaceDocsPage({ params }: DocsPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      OR: [
        { id: params.id },
        { slug: params.id },
      ],
    },
    include: {
      documents: {
        orderBy: { updatedAt: "desc" },
        include: {
          owner: { select: { name: true } },
        },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
              <Link href="/">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                Voltar ao Dashboard
              </Link>
            </Button>
            <Badge variant="secondary" className="text-[10px]">
              Notion Docs
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-secondary" />
            {workspace.name} • Caderno de Documentação
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Documentação colaborativa, protocolos científicos e notas do braço de pesquisa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href={`/workspace/${workspace.id}/kanban`}>Ver Quadro Kanban</Link>
          </Button>
          <DocsHeaderActions workspaceId={workspace.id} />
        </div>
      </div>

      {/* Lista de Documentos */}
      {workspace.documents.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
          <h3 className="text-sm font-semibold text-foreground">Nenhuma página criada ainda</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Comece a documentar protocolos, metodologias experimentais e registros da equipe de pesquisa.
          </p>
          <div className="mt-4 flex justify-center">
            <DocsHeaderActions workspaceId={workspace.id} label="Criar Primeira Página" />
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workspace.documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/workspace/${workspace.id}/docs/${doc.id}`}
              className="block group"
            >
              <Card className="p-4 h-full hover:border-secondary/60 transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{doc.icon || "📄"}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardTitle className="text-sm font-semibold mt-2 group-hover:text-secondary transition-colors line-clamp-1">
                    {doc.title}
                  </CardTitle>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border/60">
                  Atualizado em {doc.updatedAt.toLocaleDateString("pt-BR")} por {doc.owner?.name || "Pesquisador"}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
