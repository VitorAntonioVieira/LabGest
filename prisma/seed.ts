import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed com os projetos reais do Living Lab CTPP...");

  // 1. ELIMINAR TODOS OS APONTAMENTOS DE HORAS ANTERIORES E DADOS MOCKADOS
  console.log("Limpando apontamentos de horas anteriores e dados antigos...");
  await prisma.timeEntry.deleteMany({});
  await prisma.taskTag.deleteMany({});
  await prisma.taskComment.deleteMany({});
  await prisma.taskAssignee.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.kanbanColumn.deleteMany({});
  await prisma.workspaceMember.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.workspace.deleteMany({});

  // Remove qualquer usuário de teste ou mock residual da base de dados
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { in: ["mariana.costa@aluno.unifesp.br", "mariana.souza@aluno.unifesp.br"] } },
        { email: { contains: "mock", mode: "insensitive" } },
        { email: { contains: "fake", mode: "insensitive" } },
        { email: { startsWith: "teste@", mode: "insensitive" } },
        { email: { startsWith: "test@", mode: "insensitive" } },
      ],
      NOT: {
        email: {
          in: ["evandro.coggo@unifesp.br", "vitor.silva@unifesp.br", "vitor.antonio@unifesp.br"],
        },
      },
    },
  });

  // 2. CONFIGURAÇÕES WHITE-LABEL DA PLATAFORMA (LAB CTPP • UNIFESP)
  await prisma.platformSettings.upsert({
    where: { id: "default-settings" },
    update: {
      labName: "Lab CTPP",
      institutionName: "UNIFESP",
      departmentName: "Living Lab de Políticas Públicas & Tecnologia",
      primaryColor: "#0E4330",
      secondaryColor: "#24576C",
      accentColor: "#1F8A64",
      supportEmail: "evandro.coggo@unifesp.br",
    },
    create: {
      id: "default-settings",
      labName: "Lab CTPP",
      institutionName: "UNIFESP",
      departmentName: "Living Lab de Políticas Públicas & Tecnologia",
      primaryColor: "#0E4330",
      secondaryColor: "#24576C",
      accentColor: "#1F8A64",
      supportEmail: "evandro.coggo@unifesp.br",
    },
  });

  // 3. PROFESSOR REAL E USUÁRIOS REAIS
  // Professor Coordenador Oficial: Evandro Coggo
  const profEvandro = await prisma.user.upsert({
    where: { email: "evandro.coggo@unifesp.br" },
    update: {
      name: "Prof. Dr. Evandro Coggo",
      role: "PROFESSOR",
      status: "ACTIVE",
      course: "Políticas Públicas & Gestão Universitária",
      bio: "Coordenador Geral do Living Lab CTPP - UNIFESP",
    },
    create: {
      email: "evandro.coggo@unifesp.br",
      name: "Prof. Dr. Evandro Coggo",
      role: "PROFESSOR",
      status: "ACTIVE",
      academicId: "PROF-EVANDRO",
      course: "Políticas Públicas & Gestão Universitária",
      bio: "Coordenador Geral do Living Lab CTPP - UNIFESP",
    },
  });

  // Usuário do solicitante para testes com permissões totais
  const userVitor = await prisma.user.upsert({
    where: { email: "vitor.silva@unifesp.br" },
    update: {
      name: "Vitor Antonio Vieira da Silva",
      role: "PROFESSOR",
      status: "ACTIVE",
      course: "Políticas Públicas & Tecnologia",
      bio: "Pesquisador & Administrador de Sistemas - UNIFESP",
    },
    create: {
      email: "vitor.silva@unifesp.br",
      name: "Vitor Antonio Vieira da Silva",
      role: "PROFESSOR",
      status: "ACTIVE",
      academicId: "PROF-VITOR",
      course: "Políticas Públicas & Tecnologia",
      bio: "Pesquisador & Administrador de Sistemas - UNIFESP",
    },
  });

  // =========================================================================
  // WORKSPACE 1: REVISÃO RESPONSABILIDADE SOCIAL UNIVERSITÁRIA (RSU)
  // Estado: Em andamento | Responsável: Evandro | Prazo: 2026
  // =========================================================================
  const wsRSU = await prisma.workspace.create({
    data: {
      name: "Revisão Responsabilidade Social Universitária (RSU)",
      slug: "rsu-unifesp",
      department: "Políticas Públicas & Sociedade",
      description:
        "Revisão de literatura sobre Responsabilidade Social Universitária (RSU), a partir de buscas sistemáticas na SciELO e OpenAlex. Foco na leitura crítica, fichamento conjunto, organização de seminário interno e publicação científica.",
      status: "APPROVED",
      requestedById: profEvandro.id,
      approvedById: profEvandro.id,
      approvedAt: new Date(),
      members: {
        create: [
          { userId: profEvandro.id, role: "OWNER" },
          { userId: userVitor.id, role: "LEADER" },
        ],
      },
      columns: {
        create: [
          { title: "A Fazer", order: 0 },
          { title: "Em Andamento", order: 1 },
          { title: "Debate & Seminário", order: 2 },
          { title: "Concluído", order: 3 },
        ],
      },
    },
    include: { columns: true },
  });

  // Atividades no Kanban de RSU
  const rsuColTodo = wsRSU.columns.find((c) => c.title === "A Fazer")!;
  const rsuColProgress = wsRSU.columns.find((c) => c.title === "Em Andamento")!;
  const rsuColSeminar = wsRSU.columns.find((c) => c.title === "Debate & Seminário")!;
  const rsuColDone = wsRSU.columns.find((c) => c.title === "Concluído")!;

  // 1. Busca e extração (Concluído)
  await prisma.task.create({
    data: {
      workspaceId: wsRSU.id,
      columnId: rsuColDone.id,
      createdById: profEvandro.id,
      title: "Busca e extração de artigos na SciELO e OpenAlex",
      description:
        "Mapeamento de literatura acadêmica sobre RSU utilizando termos booleanos nas bases indexadas SciELO e OpenAlex com triagem inicial dos metadados.",
      priority: "HIGH",
      dueDate: new Date("2026-06-30"),
      completedAt: new Date(),
      assignees: {
        create: [{ userId: profEvandro.id }, { userId: userVitor.id }],
      },
    },
  });

  // 2. Divisão dos artigos (Concluído)
  await prisma.task.create({
    data: {
      workspaceId: wsRSU.id,
      columnId: rsuColDone.id,
      createdById: profEvandro.id,
      title: "Divisão dos artigos selecionados entre os integrantes da pesquisa",
      description:
        "Distribuição da carga de leitura crítica e matriz de análise entre os membros do grupo de pesquisa.",
      priority: "MEDIUM",
      completedAt: new Date(),
      assignees: {
        create: [{ userId: profEvandro.id }, { userId: userVitor.id }],
      },
    },
  });

  // 3. Submissão ao LAPIS / Unicamp (Debate & Seminário - Aguardando resultado)
  await prisma.task.create({
    data: {
      workspaceId: wsRSU.id,
      columnId: rsuColSeminar.id,
      createdById: profEvandro.id,
      title: "Submissão de Resumo Expandido ao II Workshop LAPIS (Unicamp)",
      description:
        "Resumo expandido submetido para o II Workshop Latino-Americano de Política, Inovação e Sociedade (LAPIS), Unicamp. Aguardando resultado da avaliação dos pareceristas.",
      priority: "URGENT",
      dueDate: new Date("2026-11-15"),
      assignees: {
        create: [{ userId: profEvandro.id }],
      },
    },
  });

  // 4. Debate e fichamento (Em Andamento)
  await prisma.task.create({
    data: {
      workspaceId: wsRSU.id,
      columnId: rsuColProgress.id,
      createdById: profEvandro.id,
      title: "Debate dos artigos e elaboração de sínteses conceituais",
      description:
        "Fase de leitura analítica aprofundada, fichamento e debate conceitual em reuniões periódicas do grupo de pesquisa.",
      priority: "HIGH",
      dueDate: new Date("2026-10-31"),
      assignees: {
        create: [{ userId: profEvandro.id }, { userId: userVitor.id }],
      },
    },
  });

  // 5. Seminário Interno (A Fazer)
  await prisma.task.create({
    data: {
      workspaceId: wsRSU.id,
      columnId: rsuColTodo.id,
      createdById: profEvandro.id,
      title: "Organização do Seminário Interno de RSU",
      description:
        "Estruturação do seminário interno do Lab CTPP para compartilhamento dos achados, debate teórico e fechamento do modelo conceitual.",
      priority: "MEDIUM",
      dueDate: new Date("2026-11-30"),
      assignees: {
        create: [{ userId: profEvandro.id }, { userId: userVitor.id }],
      },
    },
  });

  // 6. Redação do Artigo Final (A Fazer)
  await prisma.task.create({
    data: {
      workspaceId: wsRSU.id,
      columnId: rsuColTodo.id,
      createdById: profEvandro.id,
      title: "Redação do artigo científico e relatório técnico para publicação",
      description:
        "Escrita do artigo completo consolidado para submissão a periódico de alto impacto da área de Políticas Públicas e Ensino Superior.",
      priority: "HIGH",
      dueDate: new Date("2026-12-20"),
      assignees: {
        create: [{ userId: profEvandro.id }],
      },
    },
  });

  // Documento Explicativo Base 1: RSU
  await prisma.document.create({
    data: {
      workspaceId: wsRSU.id,
      ownerId: profEvandro.id,
      title: "Guia Metodológico & Protocolo da Revisão de Literatura em RSU",
      icon: "📚",
      type: "WORKSPACE",
      isPublished: true,
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Revisão de Literatura: Responsabilidade Social Universitária (RSU)" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Este caderno serve como base documental e guia de metodologia para a frente de pesquisa em Responsabilidade Social Universitária do Living Lab CTPP • UNIFESP.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "1. Justificativa e Escopo Científico" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "A pesquisa investiga as diferentes abordagens teóricas e empíricas da RSU na América Latina. O foco central é entender como a universidade pública articula ensino, pesquisa e extensão com as demandas sociais contemporâneas e a formulação de políticas públicas.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "2. Fontes de Dados e Critérios de Busca" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "• SciELO (Scientific Electronic Library Online): Mapeamento da literatura regional brasileira e latino-americana.\n• OpenAlex: Cobertura internacional de artigos, métricas de citação e afiliações institucionais.\n• Filtros aplicados: Artigos revisados por pares, período recente e aderência conceitual.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "3. Próximos Entregáveis e Prazos (2026)" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "1. Resumo expandido submetido ao II Workshop Latino-Americano de Política, Inovação e Sociedade (LAPIS), Unicamp.\n2. Seminário interno com os membros do Lab CTPP para debate das matrizes de leitura.\n3. Manuscrito de artigo científico completo para submissão a periódico indexado.",
              },
            ],
          },
        ],
      },
    },
  });

  // =========================================================================
  // WORKSPACE 2: PESQUISA ODS-UNIFESP
  // Estado: Em andamento | Responsável: Evandro | Prazo: 2026
  // =========================================================================
  const wsODS = await prisma.workspace.create({
    data: {
      name: "Pesquisa ODS-Unifesp",
      slug: "ods-unifesp",
      department: "Métricas Científicas & Avaliação de Impacto",
      description:
        "Pesquisa para testar a classificação da produção científica da UNIFESP nos Objetivos de Desenvolvimento Sustentável (ODS) via OpenAlex como métrica de impacto social da pesquisa.",
      status: "APPROVED",
      requestedById: profEvandro.id,
      approvedById: profEvandro.id,
      approvedAt: new Date(),
      members: {
        create: [
          { userId: profEvandro.id, role: "OWNER" },
          { userId: userVitor.id, role: "LEADER" },
        ],
      },
      columns: {
        create: [
          { title: "A Fazer", order: 0 },
          { title: "Em Andamento", order: 1 },
          { title: "Validação", order: 2 },
          { title: "Concluído", order: 3 },
        ],
      },
    },
    include: { columns: true },
  });

  // Atividades no Kanban de ODS
  const odsColTodo = wsODS.columns.find((c) => c.title === "A Fazer")!;
  const odsColProgress = wsODS.columns.find((c) => c.title === "Em Andamento")!;
  const odsColValidation = wsODS.columns.find((c) => c.title === "Validação")!;
  const odsColDone = wsODS.columns.find((c) => c.title === "Concluído")!;

  // 1. Planilha OpenAlex (Concluído)
  await prisma.task.create({
    data: {
      workspaceId: wsODS.id,
      columnId: odsColDone.id,
      createdById: profEvandro.id,
      title: "Levantamento da planilha com todos os artigos da Unifesp no OpenAlex",
      description:
        "Extração estruturada e limpeza da base integral de publicações científicas com afiliação UNIFESP indexadas no catálogo OpenAlex.",
      priority: "HIGH",
      completedAt: new Date(),
      assignees: {
        create: [{ userId: profEvandro.id }],
      },
    },
  });

  // 2. Testagem dos critérios (Em Andamento)
  await prisma.task.create({
    data: {
      workspaceId: wsODS.id,
      columnId: odsColProgress.id,
      createdById: profEvandro.id,
      title: "Testagem dos critérios de classificação dos artigos nos ODS",
      description:
        "Aplicação de taxonomias, palavras-chave e modelos de classificação para correlacionar as publicações da UNIFESP aos 17 ODS da ONU.",
      priority: "URGENT",
      dueDate: new Date("2026-10-25"),
      assignees: {
        create: [{ userId: profEvandro.id }, { userId: userVitor.id }],
      },
    },
  });

  // 3. Validação Amostral (Validação)
  await prisma.task.create({
    data: {
      workspaceId: wsODS.id,
      columnId: odsColValidation.id,
      createdById: profEvandro.id,
      title: "Validação amostral das métricas de impacto social por departamento",
      description:
        "Triagem manual por amostragem para verificar a acurácia da classificação por área de conhecimento nos campi da UNIFESP.",
      priority: "MEDIUM",
      dueDate: new Date("2026-11-20"),
      assignees: {
        create: [{ userId: profEvandro.id }, { userId: userVitor.id }],
      },
    },
  });

  // 4. Relatório e Artigo (A Fazer)
  await prisma.task.create({
    data: {
      workspaceId: wsODS.id,
      columnId: odsColTodo.id,
      createdById: profEvandro.id,
      title: "Redação do relatório técnico institucional e artigo de impacto",
      description:
        "Produção do relatório final com os indicadores de impacto social da pesquisa e redação de artigo científico com a metodologia desenvolvida.",
      priority: "HIGH",
      dueDate: new Date("2026-12-15"),
      assignees: {
        create: [{ userId: profEvandro.id }, { userId: userVitor.id }],
      },
    },
  });

  // Documento Explicativo Base 2: ODS UNIFESP
  await prisma.document.create({
    data: {
      workspaceId: wsODS.id,
      ownerId: profEvandro.id,
      title: "Metodologia de Classificação ODS da Produção Científica UNIFESP",
      icon: "🎯",
      type: "WORKSPACE",
      isPublished: true,
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Mapeamento dos ODS na Produção Científica da UNIFESP" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Documento orientador para o teste e aplicação dos Objetivos de Desenvolvimento Sustentável (ODS) como métrica quantitativa e qualitativa do impacto social da universidade.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "1. Objetivos da Frente" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "• Testar a viabilidade do OpenAlex como base pública de dados para aferição de relevância social.\n• Mapear a distribuição de artigos da UNIFESP entre os 17 ODS da Agenda 2030.\n• Subsidiar a pró-reitoria e a comunidade com evidências sobre o retorno social da ciência produzida.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "2. Estrutura do Conjunto de Dados" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "A planilha extraída do OpenAlex reúne metadados de publicações com filiação 'Universidade Federal de São Paulo', incluindo títulos, resumos, periódicos, citações e conceitos associados.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "3. Produtos Previstos" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "• Relatório executivo com infográficos da distribuição dos ODS.\n• Artigo científico com a validação da taxonomia de classificação.",
              },
            ],
          },
        ],
      },
    },
  });

  // =========================================================================
  // WORKSPACE 3: PROJETO: EMBRAPA E POLÍTICAS PÚBLICAS
  // Estado: A iniciar (Recrutando) | Responsável: Coordenador | Prazo: 2026-2027
  // =========================================================================
  const wsEMBRAPA = await prisma.workspace.create({
    data: {
      name: "Projeto: EMBRAPA e Políticas Públicas",
      slug: "embrapa-pp",
      department: "Agricultura Digital & Inovação",
      description:
        "Estudo da relação entre a pesquisa e as tecnologias produzidas pela EMBRAPA e políticas públicas, com foco no Projeto Semear Digital e tecnologias digitais para pequenos e médios agricultores. Envolve revisão de literatura, dados e estruturação de bolsas de IC.",
      status: "APPROVED",
      requestedById: profEvandro.id,
      approvedById: profEvandro.id,
      approvedAt: new Date(),
      members: {
        create: [
          { userId: profEvandro.id, role: "OWNER" },
          { userId: userVitor.id, role: "LEADER" },
        ],
      },
      columns: {
        create: [
          { title: "A Fazer", order: 0 },
          { title: "Em Andamento", order: 1 },
          { title: "Revisão", order: 2 },
          { title: "Concluído", order: 3 },
        ],
      },
    },
    include: { columns: true },
  });

  // Atividades no Kanban de EMBRAPA e PP
  const embColTodo = wsEMBRAPA.columns.find((c) => c.title === "A Fazer")!;
  const embColProgress = wsEMBRAPA.columns.find((c) => c.title === "Em Andamento")!;

  // 1. Mapeamento Semear Digital (Em Andamento)
  await prisma.task.create({
    data: {
      workspaceId: wsEMBRAPA.id,
      columnId: embColProgress.id,
      createdById: profEvandro.id,
      title: "Mapeamento e levantamento de dados no Projeto Semear Digital",
      description:
        "Consulta sistemática à plataforma Semear Digital (https://www.semear-digital.cnptia.embrapa.br/) para mapeamento do portfólio tecnológico voltado a agricultores.",
      priority: "HIGH",
      dueDate: new Date("2026-10-30"),
      assignees: {
        create: [{ userId: profEvandro.id }, { userId: userVitor.id }],
      },
    },
  });

  // 2. Revisão Bibliográfica (A Fazer)
  await prisma.task.create({
    data: {
      workspaceId: wsEMBRAPA.id,
      columnId: embColTodo.id,
      createdById: profEvandro.id,
      title: "Revisão de literatura sobre difusão de tecnologias digitais no campo",
      description:
        "Levantamento de referências teóricas sobre inovação agropecuária, políticas de extensão rural e barreira de conectividade para pequenos produtores.",
      priority: "MEDIUM",
      dueDate: new Date("2026-11-25"),
      assignees: {
        create: [{ userId: profEvandro.id }],
      },
    },
  });

  // 3. Estruturação das ICs (A Fazer)
  await prisma.task.create({
    data: {
      workspaceId: wsEMBRAPA.id,
      columnId: embColTodo.id,
      createdById: profEvandro.id,
      title: "Estruturação dos planos de Iniciação Científica (ICs) e submissão FAPESP",
      description:
        "Elaboração dos planos de trabalho de 2 bolsas de IC para recrutamento de estudantes e posterior submissão a editais FAPESP/PIBIC.",
      priority: "HIGH",
      dueDate: new Date("2026-12-10"),
      assignees: {
        create: [{ userId: profEvandro.id }],
      },
    },
  });

  // 4. Planejamento do Evento (A Fazer)
  await prisma.task.create({
    data: {
      workspaceId: wsEMBRAPA.id,
      columnId: embColTodo.id,
      createdById: profEvandro.id,
      title: "Planejamento do evento presencial: Embrapa Agricultura Digital (Novembro)",
      description:
        "Cadastro da ação de extensão no sistema SIEX UNIFESP, articulação de palestrantes da EMBRAPA e preparação de materiais de divulgação.",
      priority: "MEDIUM",
      dueDate: new Date("2026-11-10"),
      assignees: {
        create: [{ userId: userVitor.id }, { userId: profEvandro.id }],
      },
    },
  });

  // Documento Explicativo Base 3: EMBRAPA e PP
  await prisma.document.create({
    data: {
      workspaceId: wsEMBRAPA.id,
      ownerId: profEvandro.id,
      title: "Diretrizes de Pesquisa: EMBRAPA & Políticas Públicas de Agricultura Digital",
      icon: "🌱",
      type: "WORKSPACE",
      isPublished: true,
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Frente EMBRAPA e Políticas Públicas (Semear Digital)" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Documento de fundamentação da frente que investiga a conexão entre tecnologias geradas pela EMBRAPA e políticas públicas voltadas a pequenos e médios agricultores.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "1. Consulta à Plataforma Semear Digital" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Link de referência: https://www.semear-digital.cnptia.embrapa.br/\nO projeto busca identificar quais soluções tecnológicas em software, sensoriamento e conectividade estão prontas para difusão e quais gargalos de infraestrutura exigem ação pública articulada.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "2. Recrutamento e Bolsas de IC" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Serão abertas 2 vagas de Iniciação Científica (ICs) para apoiar o levantamento de campo, análise de dados e revisão bibliográfica para submissão à FAPESP.",
              },
            ],
          },
        ],
      },
    },
  });

  // =========================================================================
  // WORKSPACE 4 (PENDENTE PARA TESTE DE HOMOLOGAÇÃO / APROVAÇÃO DO PROFESSOR)
  // Estado: Pendente de Homologação pela coordenação
  // =========================================================================
  await prisma.workspace.create({
    data: {
      name: "Projeto: SciELO Ciência Aberta e PP",
      slug: "scielo-ciencia-aberta",
      department: "Ciência Aberta & Sociedade",
      description:
        "Estudo sobre a relação entre Ciência Aberta e relevância/impacto social da pesquisa, com atenção especial ao papel da abertura do conhecimento científico e iniciativas como a SciELO na aproximação entre ciência, sociedade e políticas públicas.",
      status: "PENDING",
      requestedById: profEvandro.id,
    },
  });

  console.log("Seed concluído com sucesso!");
  console.log("Workspaces reais criados: RSU, ODS-Unifesp, EMBRAPA e PP (+ 1 pendente para treinamento)");
  console.log("Todos os apontamentos de horas anteriores foram eliminados.");
  console.log("Prof. Evandro Coggo e Dr. Vitor Silva configurados como Professores.");
}

main()
  .catch((e) => {
    console.error("Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
