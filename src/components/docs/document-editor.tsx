"use client";

import React, { useState, useEffect, useRef, useTransition, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  Save,
  Check,
  Loader2,
  Trash2,
  Share2,
  Image as ImageIcon,
  Smile,
  X,
  Plus,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  MoreVertical,
  Calendar,
  User,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { updateWorkspaceDocument, deleteWorkspaceDocument } from "@/app/actions";
import { CreateDocumentDialog } from "@/components/modals/create-document-dialog";

// Carregamento dinâmico do editor de blocos (client-only)
const BlockEditor = dynamic(() => import("./block-editor"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4 py-8 px-4 animate-pulse">
      <div className="h-6 bg-muted/60 rounded-md w-1/3" />
      <div className="h-4 bg-muted/40 rounded-md w-full" />
      <div className="h-4 bg-muted/40 rounded-md w-5/6" />
      <div className="h-4 bg-muted/40 rounded-md w-4/6" />
      <div className="h-20 bg-muted/20 rounded-md w-full mt-4" />
    </div>
  ),
});

export interface SiblingDocument {
  id: string;
  title: string;
  icon: string | null;
  updatedAt: Date | string;
}

export interface DocumentEditorProps {
  initialDocument: {
    id: string;
    title: string;
    icon: string | null;
    coverImage: string | null;
    content: any;
    type: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    owner: {
      id: string;
      name: string | null;
      image: string | null;
      email: string | null;
    } | null;
    workspace: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
  workspaceDocuments?: SiblingDocument[];
  currentUser?: {
    id: string;
    name: string | null;
    role?: string;
  };
}

const COVER_PRESETS = [
  {
    name: "Verde CTPP (Bio)",
    value: "linear-gradient(135deg, #0E4330 0%, #1F8A64 100%)",
  },
  {
    name: "Petróleo CTPP (Pesquisa)",
    value: "linear-gradient(135deg, #0d2836 0%, #24576C 100%)",
  },
  {
    name: "Genômica & Nanotech",
    value: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #06b6d4 100%)",
  },
  {
    name: "Síntese Química",
    value: "linear-gradient(135deg, #0d324d 0%, #7f5a83 100%)",
  },
  {
    name: "Aurora Boreal",
    value: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  },
  {
    name: "Bancada Experimental",
    value: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Microscopia & Células",
    value: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Grafite Minimalista",
    value: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
  },
];

const EMOJI_PALETTE = [
  "🔬", "🧪", "🧬", "📑", "📊", "💻", "🧫", "⚗️",
  "🌿", "🎯", "🚀", "💡", "📝", "📌", "⚙️", "🔍",
  "📈", "🩺", "🗂️", "📖", "🌱", "🔭", "📐", "✅",
];

export function DocumentEditor({
  initialDocument,
  workspaceDocuments = [],
  currentUser,
}: DocumentEditorProps) {
  const router = useRouter();
  const [doc, setDoc] = useState(initialDocument);
  const [title, setTitle] = useState(initialDocument.title || "Sem título");
  const [icon, setIcon] = useState<string | null>(initialDocument.icon || "📄");
  const [coverImage, setCoverImage] = useState<string | null>(initialDocument.coverImage || null);
  const [content, setContent] = useState<any>(initialDocument.content);

  // Estados de Autosave
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // OneNote Sidebar Drawer
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pageSearch, setPageSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Modais de Cover e Confirmação de Exclusão
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [customCoverUrl, setCustomCoverUrl] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Dark Mode Detection
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Formata a data de atualização
  const formatTime = (dateInput: Date | string) => {
    try {
      const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Função central de salvamento no backend
  const performSave = useCallback(
    async (overrideData?: {
      title?: string;
      icon?: string | null;
      coverImage?: string | null;
      content?: any;
    }) => {
      setSaveStatus("saving");
      try {
        const payload = {
          docId: doc.id,
          title: overrideData?.title !== undefined ? overrideData.title : title,
          icon: overrideData?.icon !== undefined ? overrideData.icon : icon,
          coverImage:
            overrideData?.coverImage !== undefined ? overrideData.coverImage : coverImage,
          content: overrideData?.content !== undefined ? overrideData.content : content,
        };

        const res = await updateWorkspaceDocument(payload);
        if (res?.success) {
          setSaveStatus("saved");
          setLastSavedTime(
            new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
          if (res.document) {
            setDoc((prev) => ({
              ...prev,
              title: res.document.title,
              icon: res.document.icon,
              coverImage: res.document.coverImage,
              updatedAt: res.document.updatedAt,
            }));
          }
        } else {
          setSaveStatus("error");
        }
      } catch (err) {
        console.error("Erro ao salvar:", err);
        setSaveStatus("error");
      }
    },
    [doc.id, title, icon, coverImage, content]
  );

  // Debounced Autosave após alterações
  const triggerAutosave = useCallback(
    (newContent?: any, newTitle?: string) => {
      setSaveStatus("unsaved");
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
      autosaveTimeoutRef.current = setTimeout(() => {
        performSave({
          content: newContent,
          title: newTitle,
        });
      }, 1400);
    },
    [performSave]
  );

  // Handler de alteração no conteúdo do BlockNote
  const handleContentChange = useCallback(
    (blocks: any) => {
      setContent(blocks);
      triggerAutosave(blocks, undefined);
    },
    [triggerAutosave]
  );

  // Handler de alteração de título
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutosave(undefined, val);
  };

  // Alteração imediata de Ícone
  const handleSelectEmoji = (emoji: string | null) => {
    setIcon(emoji);
    setIsEmojiPickerOpen(false);
    performSave({ icon: emoji });
  };

  // Alteração imediata de Capa
  const handleSelectCover = (cover: string | null) => {
    setCoverImage(cover);
    setIsCoverModalOpen(false);
    performSave({ coverImage: cover });
  };

  // Exclusão de documento
  const handleDeleteDocument = async () => {
    setIsDeleting(true);
    try {
      await deleteWorkspaceDocument(doc.id, doc.workspace?.id);
      if (doc.workspace?.id) {
        router.push(`/workspace/${doc.workspace.id}/docs`);
      } else {
        router.push("/docs");
      }
    } catch (err) {
      console.error("Erro ao excluir caderno:", err);
      setIsDeleting(false);
    }
  };

  // Copiar link da página
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Atalho de teclado: Ctrl+S / Cmd+S para salvar imediatamente
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        performSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [performSave]);

  // Filtra páginas no painel lateral OneNote
  const filteredPages = workspaceDocuments.filter((p) =>
    p.title.toLowerCase().includes(pageSearch.toLowerCase())
  );

  return (
    <div className="flex -m-4 sm:-m-6 lg:-m-8 min-h-[calc(100vh-4rem)] bg-background">
      {/* ========================================================= */}
      {/* 1. ONENOTE-INSPIRED NOTEBOOK PAGES SIDEBAR (COLLAPSIBLE)  */}
      {/* ========================================================= */}
      <aside
        className={`border-r border-border bg-card/60 backdrop-blur-xs flex flex-col transition-all duration-300 ease-in-out shrink-0 z-20 ${
          isSidebarOpen ? "w-72 sm:w-80" : "w-0 overflow-hidden border-none"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <BookOpen className="h-4 w-4 text-secondary shrink-0" />
            <div className="truncate">
              <h2 className="text-xs font-bold text-foreground truncate">
                {doc.workspace?.name || "Caderno Pessoal"}
              </h2>
              <p className="text-[10px] text-muted-foreground">
                {workspaceDocuments.length} {workspaceDocuments.length === 1 ? "página" : "páginas"} no caderno
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Recolher painel de páginas"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        {/* Search & New Page Button */}
        <div className="p-3 space-y-2 border-b border-border/60">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={pageSearch}
              onChange={(e) => setPageSearch(e.target.value)}
              placeholder="Pesquisar páginas..."
              className="text-xs h-8 pl-8 bg-background/80"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full text-xs h-8 justify-start gap-1.5 font-medium border-dashed hover:border-secondary hover:text-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Página de Pesquisa</span>
          </Button>
        </div>

        {/* List of Pages in OneNote style */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredPages.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Nenhuma página encontrada.
            </div>
          ) : (
            filteredPages.map((page) => {
              const isCurrent = page.id === doc.id;
              const linkHref = doc.workspace?.id
                ? `/workspace/${doc.workspace.id}/docs/${page.id}`
                : `/docs/${page.id}`;

              return (
                <Link
                  key={page.id}
                  href={linkHref}
                  className={`group flex items-start gap-2.5 p-2 rounded-lg text-xs transition-all ${
                    isCurrent
                      ? "bg-secondary/15 text-foreground font-semibold border-l-3 border-secondary shadow-2xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground border-l-3 border-transparent"
                  }`}
                >
                  <span className="text-base shrink-0 select-none">
                    {page.icon || "📄"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs group-hover:text-foreground font-medium">
                      {page.title || "Sem título"}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                      {formatTime(page.updatedAt)}
                    </p>
                  </div>
                  {isCurrent && (
                    <ChevronRight className="h-3.5 w-3.5 text-secondary shrink-0 self-center" />
                  )}
                </Link>
              );
            })
          )}
        </div>

        {/* Sidebar Footer Link */}
        <div className="p-3 border-t border-border/60 bg-muted/20">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full text-[11px] h-7 justify-start text-muted-foreground hover:text-foreground gap-1.5"
          >
            <Link
              href={
                doc.workspace?.id
                  ? `/workspace/${doc.workspace.id}/docs`
                  : "/docs"
              }
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Voltar ao índice de cadernos</span>
            </Link>
          </Button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. NOTION-INSPIRED MAIN PAGE CANVAS & EDITOR              */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Control Bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-2 overflow-hidden">
            {!isSidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                title="Abrir painel de páginas (OneNote)"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
              {doc.workspace ? (
                <>
                  <Link
                    href={`/workspace/${doc.workspace.id}/docs`}
                    className="hover:text-foreground hover:underline truncate"
                  >
                    {doc.workspace.name}
                  </Link>
                  <span>/</span>
                  <Badge variant="outline" className="text-[10px] py-0 h-4 hidden sm:inline-flex">
                    Caderno
                  </Badge>
                  <span className="hidden sm:inline">/</span>
                </>
              ) : (
                <>
                  <Link href="/docs" className="hover:text-foreground hover:underline">
                    Notas Pessoais
                  </Link>
                  <span>/</span>
                </>
              )}
              <span className="font-semibold text-foreground truncate max-w-[140px] sm:max-w-[200px]">
                {title || "Sem título"}
              </span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Status de Salvamento */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground px-2 py-1 rounded-md bg-muted/30">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                  <span className="text-amber-500 font-medium">Salvando...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span className="text-muted-foreground">
                    Salvo {lastSavedTime ? `às ${lastSavedTime}` : ""}
                  </span>
                </>
              )}
              {saveStatus === "unsaved" && (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Não salvo</span>
                </>
              )}
              {saveStatus === "error" && (
                <span className="text-destructive font-semibold">Falha ao salvar</span>
              )}
            </div>

            {/* Botão Salvar Explícito */}
            <Button
              size="sm"
              onClick={() => performSave()}
              disabled={saveStatus === "saving"}
              className="text-xs h-7 px-3 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold gap-1.5 shadow-xs"
            >
              {saveStatus === "saving" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              <span>Salvar</span>
            </Button>

            {/* Compartilhar / Copiar Link */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Copiar Link da Página"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
            </Button>

            {/* Excluir Caderno */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Excluir Caderno"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>

        {/* Page Content Body */}
        <div className="flex-1 pb-24">
          {/* Cover Banner (Notion-style) */}
          <div className="relative group/cover w-full">
            {coverImage ? (
              <div className="w-full h-44 sm:h-52 relative overflow-hidden bg-muted">
                {coverImage.startsWith("linear-gradient") ? (
                  <div
                    style={{ background: coverImage }}
                    className="w-full h-full transition-transform duration-500 group-hover/cover:scale-[1.01]"
                  />
                ) : (
                  <img
                    src={coverImage}
                    alt="Capa da Página"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/cover:scale-[1.01]"
                  />
                )}

                {/* Cover Overlay Controls */}
                <div className="absolute bottom-3 right-4 flex items-center gap-1.5 opacity-0 group-hover/cover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs p-1 rounded-lg">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsCoverModalOpen(true)}
                    className="h-6 text-[11px] text-white hover:bg-white/20 gap-1 px-2"
                  >
                    <ImageIcon className="h-3 w-3" />
                    Trocar Capa
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSelectCover(null)}
                    className="h-6 text-[11px] text-white/80 hover:text-red-300 hover:bg-red-500/20 px-2"
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-6 w-full group/addcover flex items-center px-8 sm:px-16 pt-4">
                <div className="opacity-0 group-hover/addcover:opacity-100 transition-opacity flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCoverModalOpen(true)}
                    className="h-6 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-2"
                  >
                    <ImageIcon className="h-3 w-3" />
                    Adicionar Capa
                  </Button>
                  {!icon && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEmojiPickerOpen(true)}
                      className="h-6 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-2"
                    >
                      <Smile className="h-3 w-3" />
                      Adicionar Ícone
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Document Canvas Container */}
          <div className="max-w-4xl mx-auto px-6 sm:px-12 lg:px-16 pt-2">
            {/* Page Icon (Emoji) */}
            <div className="relative mb-3">
              <div className="flex items-center gap-3">
                <div className="relative group/icon inline-block">
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    title="Clique para alterar ícone"
                    className={`text-4xl sm:text-5xl p-2 rounded-xl hover:bg-muted/80 transition-all cursor-pointer select-none ${
                      coverImage ? "-mt-10 sm:-mt-12 bg-background shadow-md border border-border/80" : ""
                    }`}
                  >
                    {icon || "📄"}
                  </button>

                  {/* Icon Quick Menu Tooltip on Hover */}
                  <div className="absolute left-0 bottom-full mb-1 hidden group-hover/icon:flex items-center gap-1 bg-popover border border-border shadow-md rounded-md p-1 text-[10px] z-30 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(true)}
                      className="px-1.5 py-0.5 hover:bg-muted rounded text-foreground font-medium"
                    >
                      Alterar
                    </button>
                    {icon && (
                      <button
                        type="button"
                        onClick={() => handleSelectEmoji(null)}
                        className="px-1.5 py-0.5 hover:bg-destructive/10 text-destructive rounded"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>

                {/* Emoji Picker Popover */}
                {isEmojiPickerOpen && (
                  <div className="absolute top-14 left-0 z-40 w-72 rounded-xl border border-border bg-card p-3 shadow-xl space-y-2 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-secondary" />
                        Escolha um Ícone Científico
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEmojiPickerOpen(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1">
                      {EMOJI_PALETTE.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => handleSelectEmoji(e)}
                          className={`h-9 w-9 text-xl rounded-lg hover:bg-secondary/15 hover:scale-110 transition-all flex items-center justify-center ${
                            icon === e ? "bg-secondary/20 ring-1 ring-secondary" : ""
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>

                    {icon && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectEmoji(null)}
                        className="w-full text-xs h-7 text-destructive hover:bg-destructive/10"
                      >
                        Remover Ícone
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Notion-style Auto-resizing Title */}
            <div className="mb-4">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Sem título"
                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground placeholder:text-muted-foreground/30 p-0"
              />
            </div>

            {/* Document Metadata Strip */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground py-2 border-b border-border/60 mb-6">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-secondary" />
                <span>
                  Autor: <strong className="text-foreground font-medium">{doc.owner?.name || "Pesquisador"}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-secondary" />
                <span>Última edição: {formatTime(doc.updatedAt)}</span>
              </div>

              {doc.workspace && (
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] font-medium">
                    {doc.workspace.name}
                  </Badge>
                </div>
              )}
            </div>

            {/* BlockNote Interactive Rich Editor */}
            <div className="prose dark:prose-invert max-w-none">
              <BlockEditor
                initialContent={content}
                onChange={handleContentChange}
                editable={true}
                theme={isDark ? "dark" : "light"}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. MODAL DE SELEÇÃO DE CAPA (NOTION COVER GALLERY)        */}
      {/* ========================================================= */}
      {isCoverModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCoverModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="w-full max-w-xl rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-secondary" />
                Galeria de Capas para Documentação
              </h3>
              <button
                type="button"
                onClick={() => setIsCoverModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">
                Gradientes & Imagens de Laboratório
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {COVER_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectCover(preset.value)}
                    className="group flex flex-col rounded-lg overflow-hidden border border-border hover:border-secondary transition-all text-left"
                  >
                    <div className="h-16 w-full overflow-hidden bg-muted">
                      {preset.value.startsWith("linear-gradient") ? (
                        <div
                          style={{ background: preset.value }}
                          className="w-full h-full group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <img
                          src={preset.value}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                    </div>
                    <span className="p-1.5 text-[10px] font-medium text-foreground truncate w-full">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL Input */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <p className="text-xs font-semibold text-foreground">
                Ou insira a URL de uma imagem personalizada
              </p>
              <div className="flex gap-2">
                <Input
                  value={customCoverUrl}
                  onChange={(e) => setCustomCoverUrl(e.target.value)}
                  placeholder="https://exemplo.com/minha-imagem.jpg"
                  className="text-xs h-8"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (customCoverUrl.trim()) {
                      handleSelectCover(customCoverUrl.trim());
                      setCustomCoverUrl("");
                    }
                  }}
                  className="text-xs h-8 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO                       */}
      {/* ========================================================= */}
      {isDeleteDialogOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDeleteDialogOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="w-full max-w-sm rounded-xl border border-destructive/30 bg-card p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <div className="p-2 rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Excluir Caderno?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Você tem certeza que deseja excluir permanentemente o caderno{" "}
              <strong className="text-foreground">"{title || "Sem título"}"</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteDocument}
                disabled={isDeleting}
                className="text-xs gap-1.5"
              >
                {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação de Nova Página */}
      <CreateDocumentDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        workspaceId={doc.workspace?.id}
      />
    </div>
  );
}
