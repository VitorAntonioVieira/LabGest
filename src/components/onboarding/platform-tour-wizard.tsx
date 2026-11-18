"use client";

import React, { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { completePlatformTour } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Building2,
  LayoutDashboard,
  FolderGit2,
  KanbanSquare,
  Clock,
  BookOpen,
  Users,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  Lightbulb,
  ExternalLink,
} from "lucide-react";
import type { UserRole } from "@/types";
import { ROLE_LABELS } from "@/types";

export interface TourStepDefinition {
  id: string;
  stepNumber: number;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accentClass: string;
  route?: string;
  routeLabel?: string;
  howItWorks: string[];
  practicalSteps: {
    title: string;
    description: string;
  }[];
  proTip: string;
}

interface PlatformTourWizardProps {
  userId?: string;
  userName?: string;
  userRole?: UserRole;
  labName?: string;
  hasCompletedTour?: boolean;
}

export function PlatformTourWizard({
  userId,
  userName = "Integrante",
  userRole = "STUDENT",
  labName = "Lab CTPP",
  hasCompletedTour = false,
}: PlatformTourWizardProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  const storageKey = userId ? `labgest_tour_done_${userId}` : "labgest_tour_done_default";

  useEffect(() => {
    setMounted(true);

    // Verifica se é o primeiro acesso do usuário (banco + fallback localStorage)
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

    // Listener global para permitir reabrir o Wizard a qualquer momento pelo Header
    const handleOpenTour = () => {
      setCurrentStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener("labgest:open-tour", handleOpenTour);
    return () => {
      window.removeEventListener("labgest:open-tour", handleOpenTour);
    };
  }, [hasCompletedTour, storageKey, userId]);

  const steps: TourStepDefinition[] = [
    {
      id: "multitenant-labs",
      stepNumber: 1,
      badge: "Passo 1 de 7 • Ecossistema Multi-Tenant",
      title: `Bem-vindo(a) ao ${labName} no LabGest!`,
      subtitle:
        "Entenda como funciona o portal unificado de laboratórios, a triagem de acesso e a troca de ambiente.",
      icon: Building2,
      accentClass: "bg-primary/10 text-primary border-primary/20",
      route: "/labs",
      routeLabel: "Conhecer Portal /labs",
      howItWorks: [
        "O LabGest opera em arquitetura Multi-Tenant: múltiplos laboratórios da UNIFESP são servidos em um único endereço com isolamento total de dados e identidade visual (White-label) própria.",
        "Ao fazer login, você visualiza todos os laboratórios nos quais já foi aprovado e pode solicitar triagem para ingressar em novos laboratórios.",
        "Cada pedido de triagem é enviado diretamente ao Professor Responsável e aos Líderes daquele laboratório para homologação.",
      ],
      practicalSteps: [
        {
          title: "1. Alternância Rápida na Barra Lateral",
          description:
            "No topo da barra lateral esquerda, use o seletor 'Laboratório Ativo' ou clique em 'Trocar / Ver Laboratórios' para mudar de laboratório sem sair da conta.",
        },
        {
          title: "2. Solicitar Triagem em Outro Laboratório",
          description:
            "Acesse a página '/labs' para ver outros laboratórios cadastrados na plataforma e enviar uma solicitação de ingresso com 1 clique.",
        },
        {
          title: "3. Identidade Visual Automática",
          description:
            "Ao entrar em um laboratório, as cores institucionais, logotipo e braços de pesquisa se adaptam automaticamente ao laboratório selecionado.",
        },
      ],
      proTip:
        "Você pode participar de mais de um laboratório simultaneamente (por exemplo, atuar como Líder em um laboratório e Integrante em outro).",
    },
    {
      id: "dashboard-overview",
      stepNumber: 2,
      badge: "Passo 2 de 7 • Visão Geral",
      title: "Dashboard & Indicadores Acadêmicos",
      subtitle:
        "Seu painel central de produtividade científica, metas mensais e entregas prioritárias.",
      icon: LayoutDashboard,
      accentClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      route: "/",
      routeLabel: "Ver Dashboard",
      howItWorks: [
        "A tela de Visão Geral consolida em tempo real todas as suas métricas dentro do laboratório ativo.",
        "Os 4 cartões superiores mostram: Horas Acumuladas no Mês (com barra de progresso da meta acadêmica), Atividades no Kanban sob sua responsabilidade, Braços de Pesquisa ativos e Cadernos de Notas.",
        "Mais abaixo, você encontra seus Braços de Pesquisa, a lista de Tarefas Prioritárias e seus últimos apontamentos.",
      ],
      practicalSteps: [
        {
          title: "1. Acompanhe sua Meta Mensal de Horas",
          description:
            "Verifique no primeiro cartão quantas horas você já registrou no mês corrente e a porcentagem concluída da carga horária.",
        },
        {
          title: "2. Ações Rápidas no Topo",
          description:
            "Use os botões 'Caderno Pessoal' e 'Apontar Horas' no canto superior direito do Dashboard para registrar atividades em segundos.",
        },
        {
          title: "3. Interação Direta nas Seções Inferiores",
          description:
            "Clique diretamente sobre qualquer tarefa prioritária ou documento recente listado no Dashboard para abri-lo imediatamente.",
        },
      ],
      proTip:
        "Se você for Professor Responsável ou Líder do laboratório, um painel âmbar especial aparecerá automaticamente no Dashboard sempre que houver novos pedidos de triagem pendentes.",
    },
    {
      id: "workspaces-projects",
      stepNumber: 3,
      badge: "Passo 3 de 7 • Organização de Projetos",
      title: "Espaços de Trabalho (Braços de Pesquisa)",
      subtitle:
        "Como os projetos científicos, frentes de estudo e grupos de trabalho são estruturados.",
      icon: FolderGit2,
      accentClass: "bg-secondary/10 text-secondary border-secondary/20",
      route: "/workspaces",
      routeLabel: "Explorar Workspaces",
      howItWorks: [
        "Cada projeto, linha de pesquisa ou grupo operacional do laboratório funciona como um 'Workspace' (Braço de Pesquisa) independente.",
        "Dentro de cada Workspace existem dois ambientes integrados: o Quadro Kanban de atividades daquele projeto e o Caderno de Documentação (Docs) compartilhado da equipe.",
        "Qualquer integrante pode solicitar a criação de um novo Workspace, que passa pela aprovação da coordenação/liderança do laboratório.",
      ],
      practicalSteps: [
        {
          title: "1. Acessar um Braço de Pesquisa",
          description:
            "Clique em 'Espaços de Trabalho' no menu lateral (ou nos atalhos 'Braços do Lab' na barra esquerda) para abrir o Kanban ou o Caderno Docs do projeto.",
        },
        {
          title: "2. Solicitar Abertura de Novo Workspace",
          description:
            "Clique no botão '+ Solicitar Workspace' no topo da barra lateral, informe o nome do projeto, departamento/área e objetivos.",
        },
        {
          title: "3. Acompanhar Membros, Tarefas e Docs",
          description:
            "Nos cartões de Workspaces você visualiza rapidamente quantos pesquisadores, tarefas e documentos estão ativos em cada frente.",
        },
      ],
      proTip:
        "Quando um Professor ou Líder cria um Workspace, ele já nasce aprovado automaticamente com as colunas padrão do Kanban configuradas.",
    },
    {
      id: "kanban-engine",
      stepNumber: 4,
      badge: "Passo 4 de 7 • Gestão Ágil de Atividades",
      title: "Quadros Kanban Dinâmicos & Tarefas",
      subtitle:
        "Crie colunas personalizadas, movimente cartões (Drag & Drop) e gerencie entregas em equipe.",
      icon: KanbanSquare,
      accentClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      howItWorks: [
        "O Quadro Kanban permite organizar todas as etapas de uma pesquisa ou desenvolvimento (ex: 'A Fazer', 'Em Andamento', 'Revisão', 'Concluído').",
        "Você pode arrastar e soltar (Drag & Drop) cartões entre colunas com atualização instantânea.",
        "Ao clicar sobre qualquer cartão do Kanban, abre-se o modal completo de detalhes da atividade.",
      ],
      practicalSteps: [
        {
          title: "1. Criar Colunas (Buckets) e Nova Tarefa",
          description:
            "Dentro do Kanban de um Workspace, use '+ Nova Atividade' no topo para criar uma tarefa ou '+ Adicionar Novo Bucket' ao final das colunas para criar uma nova etapa.",
        },
        {
          title: "2. Editar Campos e Alocar Pesquisadores",
          description:
            "Clique no cartão para editar título, descrição metodológica, prioridade (Baixa, Média, Alta, Urgente), prazo de entrega e selecionar os pesquisadores responsáveis.",
        },
        {
          title: "3. Arrastar entre Colunas",
          description:
            "Segure e arraste o cartão para a próxima coluna conforme o trabalho avança. O status é salvo automaticamente no banco de dados.",
        },
      ],
      proTip:
        "Ao atribuir um pesquisador a uma tarefa no Kanban, o sistema garante automaticamente o vínculo dele como membro daquele Workspace.",
    },
    {
      id: "time-tracking",
      stepNumber: 5,
      badge: "Passo 5 de 7 • Prestação de Contas & Bolsas",
      title: "Apontamento Auditável de Horas",
      subtitle:
        "Registre suas sessões de estudo e desenvolvimento para relatórios FAPESP, CNPq, CAPES e certificados.",
      icon: Clock,
      accentClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      route: "/time-tracking",
      routeLabel: "Abrir Apontamento de Horas",
      howItWorks: [
        "Todo tempo dedicado às atividades do laboratório é registrado de forma estruturada com data, duração, atividade vinculada e resumo executivo.",
        "Você pode apontar horas tanto de forma avulsa/geral quanto diretamente dentro de um cartão específico do Kanban.",
        "A soma de minutos é convertida automaticamente em horas e exibida no próprio cartão da tarefa e nos seus indicadores mensais.",
      ],
      practicalSteps: [
        {
          title: "1. Apontar Direto pelo Card do Kanban (Recomendado)",
          description:
            "Abra qualquer tarefa no Kanban e clique no botão 'Apontar Horas' dentro do bloco de tempo acumulado. O modal alterna suavemente para o formulário de registro.",
        },
        {
          title: "2. Apontar pelo Dashboard ou Aba 'Apontamento de Horas'",
          description:
            "Clique em 'Apontar Horas', selecione uma tarefa existente (ou digite uma nova atividade), informe a duração em minutos e descreva o que foi realizado.",
        },
        {
          title: "3. Consultar Histórico Consolidado",
          description:
            "Na aba 'Apontamento de Horas' no menu lateral, consulte todas as suas sessões registradas, datas e status de homologação.",
        },
      ],
      proTip:
        "Escreva resumos objetivos do que foi feito em cada sessão — isso facilita a geração de relatórios técnicos para agências de fomento.",
    },
    {
      id: "notion-docs",
      stepNumber: 6,
      badge: "Passo 6 de 7 • Gestão do Conhecimento",
      title: "Cadernos de Laboratório (Estilo Notion & OneNote)",
      subtitle:
        "Documente protocolos experimentais, revisões de literatura, códigos e atas em blocos interativos.",
      icon: BookOpen,
      accentClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      route: "/docs",
      routeLabel: "Abrir Cadernos Docs",
      howItWorks: [
        "O sistema possui um editor de documentos em blocos rico (inspirado no Notion e Microsoft OneNote).",
        "Existem dois tipos de documentos: os Cadernos do Workspace (compartilhados com toda a equipe do braço de pesquisa) e o seu Caderno Pessoal.",
        "As páginas contam com salvamento automático (Autosave) e também atalho manual 'Ctrl + S'.",
      ],
      practicalSteps: [
        {
          title: "1. Usar Comandos Slash ('/') no Editor",
          description:
            "Dentro de qualquer página, digite '/' para inserir títulos, listas de verificação (checklists), tabelas, blocos de código ou citações.",
        },
        {
          title: "2. Personalizar Ícone Científico e Capa",
          description:
            "Clique sobre o emoji/ícone no topo da página para escolher entre dezenas de ícones acadêmicos e clique em 'Alterar Capa' para aplicar banners temáticos.",
        },
        {
          title: "3. Navegação Lateral Estilo OneNote",
          description:
            "Use o painel retrátil à esquerda do editor para buscar e alternar instantaneamente entre diferentes páginas do mesmo caderno.",
        },
      ],
      proTip:
        "Ao criar uma nova página em '/docs', você pode escolher se ela será privada ('Pessoal') ou vinculada a um 'Workspace' específico.",
    },
    {
      id: "members-calendar-admin",
      stepNumber: 7,
      badge: "Passo 7 de 7 • Equipe, Prazos & Governança",
      title: "Integrantes, Atribuições, Calendário & Triagem",
      subtitle:
        "Conheça a equipe do laboratório, acompanhe o cronograma de entregas e gerencie permissões.",
      icon: userRole === "PROFESSOR" || userRole === "LEADER" ? ShieldCheck : Users,
      accentClass: "bg-primary/10 text-primary border-primary/20",
      route: "/members",
      routeLabel: "Ver Equipe & Atribuições",
      howItWorks: [
        "Na aba 'Integrantes' (/members), você consulta todos os membros do laboratório, seus contatos, cursos e suas Atribuições Modulares (ex: Pesquisa, Gestão, TI, Comunicação, Administrativo).",
        "Na aba 'Calendário do Lab' (/calendar), todas as tarefas com prazo de entrega (Due Date) e os seminários fixos ficam organizados cronologicamente.",
        "Em 'Aprovações & Triagem' (/admin/approvals), o Professor Responsável e os Líderes homologam novos integrantes e workspaces do laboratório.",
      ],
      practicalSteps: [
        {
          title: "1. Consultar Integrantes e Especialidades",
          description:
            "Acesse 'Integrantes' na barra lateral para filtrar colegas por função institucional (Professor, Líder, Integrante) ou por atribuição modular.",
        },
        {
          title: "2. Aprovar Triagem (Professores e Líderes)",
          description:
            "Se você é Responsável ou Líder do laboratório, acesse 'Aprovações & Triagem' para aprovar pedidos de ingresso e já alocar o novo membro nos Workspaces.",
        },
        {
          title: "3. Reabrir este Guia Quando Quiser",
          description:
            "Sempre que tiver dúvida sobre alguma ferramenta, basta clicar no botão 'Guia / Tour' na barra superior do sistema!",
        },
      ],
      proTip: `Seu perfil atual neste laboratório está configurado como "${
        ROLE_LABELS[userRole] || "Integrante"
      }". Bom trabalho e excelentes pesquisas!`,
    },
  ];

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleFinishTour = () => {
    try {
      window.localStorage.setItem(storageKey, "true");
    } catch {
      // Ignore storage errors
    }
    setIsOpen(false);
    startTransition(async () => {
      await completePlatformTour();
    });
  };

  const handleNavigateAndClose = (route?: string) => {
    handleFinishTour();
    if (route) {
      router.push(route);
    }
  };

  if (!mounted || !isOpen) return null;

  const StepIcon = currentStep.icon;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Barra Superior de Progresso Colorida */}
        <div className="h-1.5 w-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Header do Wizard */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  Tour Guiado da Plataforma • LabGest UNIFESP
                </span>
                <Badge variant="lab" className="text-[10px]">
                  {currentStep.badge}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Olá, <strong>{userName}</strong>! Veja passo a passo como utilizar cada ferramenta do{" "}
                <strong>{labName}</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinishTour}
            title="Pular ou fechar guia"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corpo Principal: Navegação de Passos à Esquerda + Conteúdo Detalhado à Direita */}
        <div className="flex flex-1 min-h-0 overflow-hidden flex-col md:flex-row">
          {/* Coluna Lateral: Mapa dos 7 Passos */}
          <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-border bg-muted/15 p-3 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1.5">
            <p className="hidden md:block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Roteiro de Ferramentas
            </p>
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentStepIndex;
              const isCompleted = idx < currentStepIndex;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all shrink-0 md:w-full ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : isCompleted
                      ? "text-foreground hover:bg-muted/60"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-bold shrink-0 ${
                      isActive
                        ? "bg-white/20 text-white"
                        : isCompleted
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.stepNumber}
                  </div>
                  <span className="truncate">{step.title.replace(/^Bem-vindo\(a\) ao .*!$/, "1. Multi-Laboratórios")}</span>
                </button>
              );
            })}
          </div>

          {/* Conteúdo do Passo Selecionado */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Cabeçalho do Passo */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0 ${currentStep.accentClass}`}
                >
                  <StepIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                    {currentStep.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {currentStep.subtitle}
                  </p>
                </div>
              </div>

              {currentStep.route && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigateAndClose(currentStep.route)}
                  className="hidden sm:flex text-xs h-8 gap-1.5 shrink-0 border-primary/30 text-primary hover:bg-primary/5"
                >
                  <span>{currentStep.routeLabel || "Ir para página"}</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Bloco 1: Como Funciona */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Como funciona esta ferramenta
              </h3>
              <ul className="space-y-1.5">
                {currentStep.howItWorks.map((item, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bloco 2: Passo a Passo Prático */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Passo a Passo Prático:
              </h3>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {currentStep.practicalSteps.map((ps, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-card p-3.5 shadow-2xs flex flex-col justify-between space-y-1.5"
                  >
                    <span className="text-xs font-bold text-foreground block">
                      {ps.title}
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {ps.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloco 3: Dica de Produtividade */}
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 flex items-start gap-2.5">
              <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/90 leading-relaxed">
                <strong className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Dica de Uso:{" "}
                </strong>
                {currentStep.proTip}
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé de Controle do Wizard */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border bg-muted/20 px-6 py-3.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFinishTour}
              disabled={isPending}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
            >
              Pular tutorial (não exibir automaticamente)
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isFirstStep}
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              className="text-xs h-9 gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </Button>

            {!isLastStep ? (
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-9 font-semibold gap-1.5 shadow-xs"
              >
                <span>Próximo Passo ({currentStepIndex + 2}/{steps.length})</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={handleFinishTour}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Concluir Guia e Começar!</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

