import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveLabContext } from "@/lib/lab-context";
import { BookOpen, FileText, ChevronRight } from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocsHeaderActions } from "@/components/docs/docs-header-actions";

export default async function DocsCentralPage() {
  const { user, activeLab, activeLabId } = await getActiveLabContext();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  const documents = await prisma.document.findMany({
    where: {
      labId: activeLabId,
      OR: [{ ownerId: userId }, { type: "WORKSPACE" }],
    },
    include: {
      owner: { select: { name: true } },
      workspace: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const workspaces = await prisma.workspace.findMany({
    where: { labId: activeLabId, status: "APPROVED" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs">
              {activeLab.name} • Notion-like Docs
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
            <BookOpen className="h-7 w-7 text-secondary" />
            Cadernos de Notas & Documentação Científica
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Repositório de protocolos, metodologias experimentais e anotações colaborativas do <strong>{activeLab.name}</strong>.
          </p>
        </div>

        <DocsHeaderActions workspaces={workspaces} label="Nova Página de Notas" />
      </div>

      {/* Grid de Documentos */}
      {documents.length === 0 ? (
        <Card className="border-dashed p-12 text-center bg-card/40">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <CardTitle className="text-base font-semibold">Nenhuma nota ou documento cadastrado neste laboratório</CardTitle>
          <CardDescription className="text-xs max-w-sm mx-auto mt-1">
            Crie sua primeira página de anotações ou acesse um dos braços de pesquisa para documentar seus experimentos.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => {
            const href = doc.workspaceId
              ? `/workspace/${doc.workspaceId}/docs/${doc.id}`
              : `/docs/${doc.id}`;

            return (
              <Link key={doc.id} href={href} className="block group">
                <Card className="p-4 h-full hover:border-secondary/60 transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="text-2xl">{doc.icon || "📄"}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={doc.type === "WORKSPACE" ? "default" : "outline"}
                          className="text-[10px]"
                        >
                          {doc.type === "WORKSPACE" ? doc.workspace?.name || "Workspace" : "Pessoal"}
                        </Badge>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <CardTitle className="text-sm font-semibold mt-3 group-hover:text-secondary transition-colors line-clamp-1">
                      {doc.title}
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                      Documentação e notas de pesquisa sincronizadas na plataforma.
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Por {doc.owner?.name || "Pesquisador"}</span>
                    <span>{new Date(doc.updatedAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
