"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { completePlatformTour } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X, Check } from "lucide-react";
import type { UserRole } from "@/types";

type PageTourKey =
  | "dashboard"
  | "workspaces"
  | "kanban"
  | "docs-list"
  | "doc-editor"
  | "time-tracking"
  | "members"
  | "calendar";

interface SpotlightStep {
  id: string;
  selector: string;
  title: string;
  description: string;
  placement?: "right" | "bottom" | "left" | "top";
  onlyLeaderOrProf?: boolean;
  onEnterEvent?: string;
}

interface PlatformTourWizardProps {
  userId?: string;
  userName?: string;
  userRole?: UserRole;
  labName?: string;
  hasCompletedTour?: boolean;
}

interface RectBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

function resolvePageTourKey(pathname: string): PageTourKey | null {
  if (pathname === "/") return "dashboard";
  if (pathname === "/workspaces") return "workspaces";
  if (pathname.includes("/kanban")) return "kanban";
  if (pathname === "/docs" || /^\/workspace\/[^/]+\/docs$/.test(pathname)) return "docs-list";
  if (pathname.startsWith("/docs/") || /^\/workspace\/[^/]+\/docs\/[^/]+/.test(pathname)) {
    return "doc-editor";
  }
  if (pathname === "/time-tracking") return "time-tracking";
  if (pathname === "/members") return "members";
  if (pathname === "/calendar") return "calendar";
  return null;
}

export function PlatformTourWizard({
  userId,
  userRole = "STUDENT",
  labName = "Lab CTPP",
  hasCompletedTour = false,
}: PlatformTourWizardProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<RectBox | null>(null);
  const [isPending, startTransition] = useTransition();

  const pageKey = resolvePageTourKey(pathname);
  const isGestor = userRole === "PROFESSOR" || userRole === "LEADER";

  const getStorageKey = useCallback(
    (key: PageTourKey | null) => {
      const uid = userId || "default";
      if (!key || key === "dashboard") {
        return `labgest_tour_done_${uid}`;
      }
      return `labgest_tour_${key}_${uid}`;
    },
    [userId]
  );

  // Roteiros de Spotlight específicos para cada tela do sistema
  const toursByPage: Record<PageTourKey, SpotlightStep[]> = {
    dashboard: [
      {
        id: "lab-switcher",
        selector: '[data-tour="lab-switcher"]',
        title: "Trocar de Laboratório",
        description: `Você está no ${labName}. Use este botão sempre que quiser mudar de laboratório ou pedir acesso a outro.`,
        placement: "right",
      },
      {
        id: "dashboard-metrics",
        selector: '[data-tour="dashboard-metrics"]',
        title: "Seu Resumo do Mês",
        description:
          "Aqui você acompanha suas horas registradas no mês, quantas tarefas estão com você e os projetos ativos.",
        placement: "bottom",
      },
      {
        id: "dashboard-quick-actions",
        selector: '[data-tour="dashboard-quick-actions"]',
        title: "Atalhos Rápidos",
        description:
          "Precisa registrar as horas trabalhadas hoje ou abrir suas anotações? Use estes dois botões direto da tela inicial.",
        placement: "bottom",
      },
      {
        id: "dashboard-workspaces",
        selector: '[data-tour="dashboard-workspaces"]',
        title: "Seu Espaço Pessoal e Projetos",
        description:
          "Ao entrar no laboratório, você já ganha seu próprio espaço individual! Clique em 'Ver Kanban' em qualquer espaço para abrir o quadro de tarefas.",
        placement: "top",
      },
      {
        id: "nav-workspaces",
        selector: '[data-tour="nav-workspaces"]',
        title: "Espaços de Trabalho",
        description:
          "Por aqui você acessa todos os projetos do laboratório, os quadros de tarefas e os cadernos de equipe.",
        placement: "right",
      },
      {
        id: "nav-timetracking",
        selector: '[data-tour="nav-timetracking"]',
        title: "Apontamento de Horas",
        description:
          "Consulte todo o seu histórico de horas trabalhadas no mês e registre novas atividades.",
        placement: "right",
      },
      {
        id: "nav-approvals",
        selector: '[data-tour="nav-approvals"]',
        title: "Aprovar Membros e Projetos",
        description:
          "Como gestor, é aqui que você aprova quem pediu para entrar no laboratório ou criar novos espaços.",
        placement: "right",
        onlyLeaderOrProf: true,
      },
      {
        id: "header-tour-btn",
        selector: '[data-tour="header-tour-btn"]',
        title: "Guia de Cada Tela",
        description:
          "Na primeira vez que você entrar em uma tela nova (como o Kanban ou os Cadernos), mostraremos como ela funciona. Você também pode clicar aqui quando quiser rever!",
        placement: "bottom",
      },
    ],

    workspaces: [
      {
        id: "workspaces-first-card",
        selector: '[data-tour="workspaces-first-card"]',
        title: "Seu Espaço no Laboratório",
        description:
          "Cada cartão representa um espaço de trabalho. Você já conta com o seu próprio espaço individual criado automaticamente, além dos projetos compartilhados da equipe.",
        placement: "bottom",
      },
      {
        id: "workspaces-card-actions",
        selector: '[data-tour="workspaces-card-actions"]',
        title: "Quadro de Tarefas e Caderno",
        description:
          "Dentro de cada espaço você tem dois ambientes: clique em 'Kanban' para organizar tarefas e apontar horas, ou em 'Caderno Docs' para escrever anotações.",
        placement: "bottom",
      },
      {
        id: "workspaces-request-btn",
        selector: '[data-tour="workspaces-request-btn"]',
        title: "Solicitar Novo Espaço",
        description:
          "Vai iniciar um novo projeto em grupo no laboratório? Clique aqui para criar um novo espaço de trabalho.",
        placement: "bottom",
      },
    ],

    kanban: [
      {
        id: "kanban-new-task",
        selector: '[data-tour="kanban-new-task"]',
        title: "Criar Nova Atividade",
        description:
          "Clique neste botão sempre que quiser adicionar um novo cartão de tarefa ao quadro.",
        placement: "bottom",
        onEnterEvent: "labgest:tour-close-card",
      },
      {
        id: "kanban-first-column",
        selector: '[data-tour="kanban-first-column"]',
        title: "Etapas do Trabalho",
        description:
          "Suas atividades ficam divididas em colunas (A Fazer, Em Andamento, Concluído). Basta segurar e arrastar um cartão de uma coluna para outra conforme avançar.",
        placement: "right",
        onEnterEvent: "labgest:tour-close-card",
      },
      {
        id: "kanban-first-card",
        selector: '[data-tour="kanban-first-card"]',
        title: "Como Abrir uma Tarefa e Apontar Horas",
        description:
          "Clique sobre qualquer cartão para abrir os detalhes da atividade. Clique em 'Próximo' abaixo para abrirmos este cartão juntos!",
        placement: "right",
        onEnterEvent: "labgest:tour-close-card",
      },
      {
        id: "task-modal-log-hours",
        selector: '[data-tour="task-modal-log-hours"]',
        title: "Apontar Horas na Tarefa",
        description:
          "Dentro do cartão fica este botão 'Apontar Horas'. Ao clicar nele, você informa quanto tempo dedicou à atividade e descreve brevemente o que fez.",
        placement: "bottom",
        onEnterEvent: "labgest:tour-open-first-card",
      },
      {
        id: "task-modal-fields",
        selector: '[data-tour="task-modal-fields"]',
        title: "Prazo, Prioridade e Responsáveis",
        description:
          "Logo abaixo você pode mudar a etapa da tarefa, a prioridade, a data de entrega e marcar quais colegas estão participando.",
        placement: "bottom",
      },
      {
        id: "kanban-add-column",
        selector: '[data-tour="kanban-add-column"]',
        title: "Criar Nova Coluna",
        description:
          "Precisa de uma etapa extra no seu quadro? Clique aqui para adicionar uma nova coluna.",
        placement: "left",
        onEnterEvent: "labgest:tour-close-card",
      },
      {
        id: "kanban-docs-btn",
        selector: '[data-tour="kanban-docs-btn"]',
        title: "Caderno deste Espaço",
        description:
          "Use este atalho no topo para ir direto às anotações e relatórios deste espaço de trabalho.",
        placement: "bottom",
      },
    ],

    "docs-list": [
      {
        id: "docs-new-page-btn",
        selector: '[data-tour="docs-new-page-btn"]',
        title: "Criar Nova Página de Anotações",
        description:
          "Clique aqui para criar uma nova página. Você pode criar tanto notas pessoais quanto páginas compartilhadas dentro de um projeto.",
        placement: "bottom",
      },
      {
        id: "docs-grid",
        selector: '[data-tour="docs-grid"]',
        title: "Seus Cadernos e Páginas",
        description:
          "Aqui ficam listadas todas as páginas de anotações. Basta clicar em qualquer cartão para abrir o editor e escrever.",
        placement: "top",
      },
    ],

    "doc-editor": [
      {
        id: "doc-editor-sidebar",
        selector: '[data-tour="doc-editor-sidebar"]',
        title: "Navegação entre Páginas",
        description:
          "Neste painel lateral você encontra todas as páginas deste caderno, pode buscar pelo nome ou criar novas páginas rapidamente.",
        placement: "right",
      },
      {
        id: "doc-editor-header",
        selector: '[data-tour="doc-editor-header"]',
        title: "Título, Ícone e Capa",
        description:
          "Clique no título para renomear a página, no ícone acima para escolher outro símbolo ou adicione uma imagem de capa no topo.",
        placement: "bottom",
      },
      {
        id: "doc-editor-canvas",
        selector: '[data-tour="doc-editor-canvas"]',
        title: "Escreva e Use o Atalho '/'",
        description:
          "Digite normalmente seu texto ou tecle '/' (barra) em qualquer linha para inserir títulos, listas de tarefas, tabelas e blocos de código.",
        placement: "top",
      },
      {
        id: "doc-editor-save",
        selector: '[data-tour="doc-editor-save"]',
        title: "Salvamento Automático",
        description:
          "Tudo o que você escreve é salvo automaticamente, mas você também pode clicar em 'Salvar' (ou apertar Ctrl+S) quando quiser.",
        placement: "bottom",
      },
    ],

    "time-tracking": [
      {
        id: "timetracking-log-btn",
        selector: '[data-tour="timetracking-log-btn"]',
        title: "Registrar Horas Trabalhadas",
        description:
          "Clique neste botão para escolher uma atividade, informar por quanto tempo trabalhou e registrar um resumo do que foi feito.",
        placement: "bottom",
      },
      {
        id: "timetracking-summary",
        selector: '[data-tour="timetracking-summary"]',
        title: "Acompanhamento da Meta Mensal",
        description:
          "Veja quantas horas você já acumulou no mês atual e quanto falta para completar sua meta no laboratório.",
        placement: "bottom",
      },
      {
        id: "timetracking-history",
        selector: '[data-tour="timetracking-history"]',
        title: "Histórico de Registros",
        description:
          "Todos os seus apontamentos ficam listados nesta tabela com data, projeto, duração e o resumo da atividade.",
        placement: "top",
      },
    ],

    members: [
      {
        id: "members-kpis",
        selector: '[data-tour="members-kpis"]',
        title: "Visão da Equipe",
        description:
          "Acompanhe quantos integrantes fazem parte do laboratório e as áreas de atuação cadastradas.",
        placement: "bottom",
      },
      {
        id: "members-tabs",
        selector: '[data-tour="members-tabs"]',
        title: "Integrantes e Áreas de Atuação",
        description:
          "Alterne entre a lista de colegas do laboratório e as atribuições de cada área (Pesquisa, Gestão, Comunicação, TI).",
        placement: "bottom",
      },
    ],

    calendar: [
      {
        id: "calendar-deadlines",
        selector: '[data-tour="calendar-deadlines"]',
        title: "Prazos das Tarefas",
        description:
          "Todas as tarefas do Kanban que possuem data de entrega aparecem organizadas aqui para você não perder nenhum prazo.",
        placement: "right",
      },
      {
        id: "calendar-events",
        selector: '[data-tour="calendar-events"]',
        title: "Reuniões e Atividades Fixas",
        description:
          "Consulte os horários dos encontros e seminários regulares do laboratório.",
        placement: "left",
      },
    ],
  };

  const activeSteps = pageKey
    ? toursByPage[pageKey].filter((s) => !s.onlyLeaderOrProf || isGestor)
    : [];

  const currentStep = activeSteps[stepIndex] || activeSteps[0];

  const updateHighlightPosition = useCallback(() => {
    if (!isOpen || !currentStep) return;
    const el = document.querySelector(currentStep.selector) as HTMLElement | null;
    if (!el) {
      setTargetRect(null);
      return;
    }

    el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [isOpen, currentStep]);

  // Verifica automaticamente na primeira vez que o usuário abre CADA tela
  useEffect(() => {
    setMounted(true);
    if (!pageKey || !userId) return;

    const storageKey = getStorageKey(pageKey);
    let alreadySeen = false;
    try {
      alreadySeen = window.localStorage.getItem(storageKey) === "true";
    } catch {
      alreadySeen = false;
    }

    // Para o dashboard inicial, respeita também a flag do banco caso o localStorage tenha sido limpo
    if (pageKey === "dashboard" && hasCompletedTour && alreadySeen) {
      return;
    }

    if (!alreadySeen) {
      const timer = window.setTimeout(() => {
        setStepIndex(0);
        setIsOpen(true);
      }, 350);
      return () => window.clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [pageKey, userId, hasCompletedTour, getStorageKey]);

  // Permite reabrir o guia da tela atual a qualquer momento pelo botão "Tour Guiado" no topo
  useEffect(() => {
    const handleOpenTour = () => {
      if (!pageKey) return;
      setStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener("labgest:open-tour", handleOpenTour);
    return () => {
      window.removeEventListener("labgest:open-tour", handleOpenTour);
    };
  }, [pageKey]);

  // Dispara eventos interativos do passo (ex: abrir automaticamente o 1º card no Kanban para mostrar "Apontar Horas")
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    if (currentStep.onEnterEvent) {
      window.dispatchEvent(new CustomEvent(currentStep.onEnterEvent));
    }

    const timer1 = window.setTimeout(updateHighlightPosition, 120);
    const timer2 = window.setTimeout(updateHighlightPosition, 320);

    window.addEventListener("resize", updateHighlightPosition);
    window.addEventListener("scroll", updateHighlightPosition, true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleFinish();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      window.removeEventListener("resize", updateHighlightPosition);
      window.removeEventListener("scroll", updateHighlightPosition, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, stepIndex, currentStep, updateHighlightPosition]);

  const handleFinish = () => {
    if (pageKey === "kanban") {
      window.dispatchEvent(new CustomEvent("labgest:tour-close-card"));
    }
    try {
      window.localStorage.setItem(getStorageKey(pageKey), "true");
    } catch {
      // Ignore storage error
    }
    setIsOpen(false);
    if (pageKey === "dashboard" && !hasCompletedTour) {
      startTransition(async () => {
        await completePlatformTour();
      });
    }
  };

  const handleNext = () => {
    if (stepIndex < activeSteps.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  if (!mounted || !isOpen || !currentStep) return null;

  // Calcula posição do card explicativo ao lado do elemento destacado
  const pad = 6;
  const tooltipWidth = 340;
  let tooltipStyle: React.CSSProperties = {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  };

  if (targetRect && typeof window !== "undefined") {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const placement = currentStep.placement || "right";

    if (placement === "right" && targetRect.left + targetRect.width + tooltipWidth + 24 < vw) {
      const clampedTop = Math.max(16, Math.min(vh - 230, targetRect.top - 4));
      tooltipStyle = {
        top: `${clampedTop}px`,
        left: `${targetRect.left + targetRect.width + 16}px`,
      };
    } else if (placement === "left" && targetRect.left - tooltipWidth - 24 > 0) {
      const clampedTop = Math.max(16, Math.min(vh - 230, targetRect.top - 4));
      tooltipStyle = {
        top: `${clampedTop}px`,
        left: `${targetRect.left - tooltipWidth - 16}px`,
      };
    } else if (placement === "bottom" || targetRect.top + targetRect.height + 220 < vh) {
      const clampedLeft = Math.max(
        16,
        Math.min(vw - tooltipWidth - 16, targetRect.left + targetRect.width / 2 - tooltipWidth / 2)
      );
      tooltipStyle = {
        top: `${Math.min(vh - 210, targetRect.top + targetRect.height + 14)}px`,
        left: `${clampedLeft}px`,
      };
    } else {
      const clampedLeft = Math.max(
        16,
        Math.min(vw - tooltipWidth - 16, targetRect.left + targetRect.width / 2 - tooltipWidth / 2)
      );
      tooltipStyle = {
        top: `${Math.max(16, targetRect.top - 205)}px`,
        left: `${clampedLeft}px`,
      };
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] pointer-events-auto">
      {/* Recorte Spotlight ao redor da ferramenta real */}
      {targetRect ? (
        <div
          className="fixed rounded-xl transition-all duration-300 pointer-events-none ring-2 ring-primary ring-offset-2 ring-offset-background"
          style={{
            top: targetRect.top - pad,
            left: targetRect.left - pad,
            width: targetRect.width + pad * 2,
            height: targetRect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.58)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-black/55" />
      )}

      {/* Balão Guiado ancorado na ferramenta */}
      <div
        style={{ width: tooltipWidth, ...tooltipStyle }}
        className="fixed z-[80] rounded-xl border border-border bg-card p-4 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95"
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[11px] font-semibold text-primary">
            Passo {stepIndex + 1} de {activeSteps.length}
          </span>
          <button
            type="button"
            onClick={handleFinish}
            title="Fechar guia desta tela"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <h3 className="text-sm font-bold text-foreground">{currentStep.title}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {currentStep.description}
        </p>

        {/* Controles do Tour */}
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleFinish}
            disabled={isPending}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Pular
          </button>

          <div className="flex items-center gap-1.5">
            {stepIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                Voltar
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={handleNext}
              className="h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {stepIndex < activeSteps.length - 1 ? (
                <>
                  Próximo
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </>
              ) : (
                <>
                  Entendi!
                  <Check className="h-3.5 w-3.5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
