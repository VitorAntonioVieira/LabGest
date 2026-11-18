"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { completePlatformTour } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X, Check } from "lucide-react";
import type { UserRole } from "@/types";

interface SpotlightStep {
  id: string;
  selector: string;
  title: string;
  description: string;
  placement?: "right" | "bottom" | "left" | "top";
  onlyLeaderOrProf?: boolean;
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

export function PlatformTourWizard({
  userId,
  userRole = "STUDENT",
  labName = "Lab CTPP",
  hasCompletedTour = false,
}: PlatformTourWizardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<RectBox | null>(null);
  const [isPending, startTransition] = useTransition();

  const storageKey = userId ? `labgest_tour_done_${userId}` : "labgest_tour_done_default";
  const isGestor = userRole === "PROFESSOR" || userRole === "LEADER";

  const allSteps: SpotlightStep[] = [
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
        "Aqui você acompanha suas horas registradas no mês, quantas tarefas estão com você e os projetos ativos do laboratório.",
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
      id: "nav-workspaces",
      selector: '[data-tour="nav-workspaces"]',
      title: "Projetos e Quadro de Tarefas",
      description:
        "Cada projeto do laboratório tem seu próprio espaço com quadro de tarefas (para organizar o que está sendo feito) e caderno da equipe.",
      placement: "right",
    },
    {
      id: "request-workspace",
      selector: '[data-tour="request-workspace"]',
      title: "Criar Novo Projeto",
      description:
        "Vai começar uma nova pesquisa ou frente de trabalho? Clique aqui para solicitar a abertura de um novo espaço.",
      placement: "right",
    },
    {
      id: "nav-docs",
      selector: '[data-tour="nav-docs"]',
      title: "Cadernos de Anotações",
      description:
        "Escreva relatórios, protocolos e anotações do dia a dia. Digite '/' no texto para adicionar títulos, tabelas ou listas.",
      placement: "right",
    },
    {
      id: "nav-timetracking",
      selector: '[data-tour="nav-timetracking"]',
      title: "Apontamento de Horas",
      description:
        "Consulte todo o seu histórico de horas trabalhadas e registre novas atividades do mês.",
      placement: "right",
    },
    {
      id: "nav-members",
      selector: '[data-tour="nav-members"]',
      title: "Equipe do Laboratório",
      description:
        "Veja quem faz parte do laboratório, a área de atuação de cada colega e os contatos da equipe.",
      placement: "right",
    },
    {
      id: "nav-calendar",
      selector: '[data-tour="nav-calendar"]',
      title: "Calendário de Entregas",
      description:
        "Acompanhe os prazos das atividades e as reuniões do laboratório organizadas por data.",
      placement: "right",
    },
    {
      id: "nav-approvals",
      selector: '[data-tour="nav-approvals"]',
      title: "Aprovar Novos Membros e Projetos",
      description:
        "Como gestor do laboratório, é aqui que você aprova quem pediu para entrar no laboratório ou criar novos projetos.",
      placement: "right",
      onlyLeaderOrProf: true,
    },
    {
      id: "header-tour-btn",
      selector: '[data-tour="header-tour-btn"]',
      title: "Rever este Tour",
      description:
        "Sempre que quiser relembrar onde fica alguma ferramenta, basta clicar neste botão no topo da tela.",
      placement: "bottom",
    },
  ];

  const steps = allSteps.filter((s) => !s.onlyLeaderOrProf || isGestor);
  const currentStep = steps[stepIndex] || steps[0];

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

  useEffect(() => {
    setMounted(true);

    try {
      const doneLocally = window.localStorage.getItem(storageKey) === "true";
      if (!hasCompletedTour && !doneLocally && userId) {
        setIsOpen(true);
      }
    } catch {
      if (!hasCompletedTour && userId) {
        setIsOpen(true);
      }
    }

    const handleOpenTour = () => {
      if (pathname !== "/") {
        router.push("/");
      }
      setStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener("labgest:open-tour", handleOpenTour);
    return () => {
      window.removeEventListener("labgest:open-tour", handleOpenTour);
    };
  }, [hasCompletedTour, storageKey, userId, pathname, router]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(updateHighlightPosition, 80);
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
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateHighlightPosition);
      window.removeEventListener("scroll", updateHighlightPosition, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, stepIndex, pathname, updateHighlightPosition]);

  const handleFinish = () => {
    try {
      window.localStorage.setItem(storageKey, "true");
    } catch {
      // Ignore storage error
    }
    setIsOpen(false);
    startTransition(async () => {
      await completePlatformTour();
    });
  };

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
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
    } else if (placement === "bottom" || targetRect.top + targetRect.height + 220 < vh) {
      const clampedLeft = Math.max(
        16,
        Math.min(vw - tooltipWidth - 16, targetRect.left + targetRect.width / 2 - tooltipWidth / 2)
      );
      tooltipStyle = {
        top: `${targetRect.top + targetRect.height + 14}px`,
        left: `${clampedLeft}px`,
      };
    } else {
      const clampedLeft = Math.max(
        16,
        Math.min(vw - tooltipWidth - 16, targetRect.left + targetRect.width / 2 - tooltipWidth / 2)
      );
      tooltipStyle = {
        top: `${Math.max(16, targetRect.top - 210)}px`,
        left: `${clampedLeft}px`,
      };
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Camada de clique fora ou recorte Spotlight ao redor da ferramenta real */}
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
        className="fixed z-50 rounded-xl border border-border bg-card p-4 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95"
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[11px] font-semibold text-primary">
            Passo {stepIndex + 1} de {steps.length}
          </span>
          <button
            type="button"
            onClick={handleFinish}
            title="Fechar tour"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <h3 className="text-sm font-bold text-foreground">{currentStep.title}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {currentStep.description}
        </p>

        {/* Indicadores de progresso + botões */}
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
              {stepIndex < steps.length - 1 ? (
                <>
                  Próximo
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </>
              ) : (
                <>
                  Concluir
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
