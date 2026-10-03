# 🏛️ LabGest — LabTechTPP (UNIFESP)

> **Plataforma Integrada de Gestão de Pesquisa, Quadros Kanban, Apontamento de Horas e Cadernos Científicos para o Living Lab do Centro de Tecnologia e Políticas Públicas (CTPP) da UNIFESP.**

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.21-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![Licença](https://img.shields.io/badge/Licen%C3%A7a-UNIFESP-0E4330?style=flat)](LICENSE)

---

## 📌 1. Visão Geral

O **LabGest CTPP** é a plataforma operacional do **Living Lab CTPP / UNIFESP**. O sistema centraliza a governança de projetos científicos e de extensão, substituindo planilhas manuais e formulários fragmentados por um ambiente colaborativo e auditável para prestação de contas institucional (FAPESP, CNPq, CAPES e parceiros como EMBRAPA).

### Principais Funcionalidades

- 📋 **Quadro Kanban Interativo & Ágil:**
  - Criação dinâmica de colunas/buckets personalizados diretamente pelo quadro.
  - Movimentação de tarefas via **Drag & Drop nativo** com transição otimista (sem delay visual).
  - Modal completo de edição de atividade: título, coluna, prioridade, prazo de conclusão, pesquisadores atribuídos interativamente, notas de metodologia e exclusão segura.
- ⏱️ **Apontamento de Horas Auditável:**
  - Registro integrado de tempo dedicado à pesquisa diretamente dentro do modal de cada atividade.
  - Histórico de lançamentos com data, minutos e justificativa técnica.
  - Contadores de carga horária acumulada por tarefa e workspace.
- 🛡️ **Segurança Institucional & Onboarding JIT:**
  - Autenticação Google OAuth com validação de domínios permitidos (`@unifesp.br`, `@aluno.unifesp.br`).
  - Fluxo de Onboarding com coleta de RA, curso e WhatsApp.
  - Sala de Espera (`/waiting-room`) e painel de triagem da coordenação (`/admin/approvals`).
- 🎨 **White-Label & Design System Adaptativo:**
  - Personalização de nome do laboratório, departamento e cores primária/secundária via banco de dados (`PlatformSettings`).
  - Suporte completo a **Modo Escuro (Dark Mode)** com contraste calibrado (WCAG AAA).
- 📑 **Cadernos de Documentação (Docs / Notion-like):**
  - Espaço de documentação colaborativa, protocolos científicos e anotações por workspace.

---

## 🏗️ 2. Stack Tecnológica

| Camada | Tecnologia | Propósito |
| :--- | :--- | :--- |
| **Frontend & Backend** | Next.js 14 (App Router) + React 18 | SSR para rotas protegidas e Client Components otimizados para interatividade. |
| **Linguagem** | TypeScript 5 (Strict Mode) | Tipagem estática rigorosa de ponta a ponta. |
| **Estilização** | Tailwind CSS + shadcn/ui | Componentes acessíveis baseados em Radix UI com tokens semânticos CSS. |
| **Banco de Dados** | PostgreSQL 16 | Armazenamento relacional com integridade referencial e enums nativos. |
| **ORM** | Prisma ORM 5 | Modelagem declarativa do banco e geração automática de tipos (`@prisma/client`). |
| **Autenticação** | NextAuth.js v4 | Estratégia JWT com Google Provider e adapter Prisma. |
| **Infraestrutura** | Docker & Docker Compose | Contêineres de produção isolados para o banco (`labgest_postgres`) e aplicação web (`labgest_web`). |

---

## 👥 3. Hierarquia de Usuários (RBAC)

1. **`PROFESSOR` (Coordenador Geral):**
   - Aprova ou recusa solicitações de novos workspaces (`/admin/approvals`).
   - Homologa novos alunos e bolsistas da instituição.
   - Acesso exclusivo às configurações de White-label (`/admin/settings`).
2. **`LEADER` (Pesquisador Líder / Pós-Doutorando):**
   - Gestão das atividades e buckets nos workspaces vinculados.
   - Atribuição de pesquisadores a tarefas específicas.
3. **`STUDENT` (Iniciação Científica / Mestrando / Bolsista):**
   - Movimentação de tarefas no Kanban (Drag & Drop).
   - Apontamento de horas em atividades de pesquisa.
   - Criação e consulta de documentações no Caderno de Laboratório.

---

## 🚀 4. Como Executar o Projeto

### Pré-requisitos
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados.
- Node.js 20+ e npm (caso deseje rodar comandos locais de desenvolvimento).
- Se estiver no Windows, recomenda-se o uso do [WSL2 (Ubuntu)](https://learn.microsoft.com/windows/wsl/).

### 1. Clonar o Repositório
```bash
git clone https://github.com/VitorAntonioVieira/LabGest.git
cd LabGest
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo e ajuste as chaves de autenticação e banco:
```bash
cp .env.example .env
```

Parâmetros essenciais no `.env`:
```ini
DATABASE_URL="postgresql://labgest_admin:labgest_secure_password@localhost:5432/labgest_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua_chave_jwt_secreta_aqui"
ALLOWED_EMAIL_DOMAINS="unifesp.br,aluno.unifesp.br"

# Credenciais Google OAuth (Console Google Cloud)
GOOGLE_CLIENT_ID="seu-google-client-id"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"
```

### 3. Execução via Docker Compose (Recomendado)
Para subir o banco de dados PostgreSQL e a aplicação web compilada:
```bash
docker compose up -d --build
```

A aplicação estará disponível em:
👉 **[http://localhost:3000](http://localhost:3000)**

Para acompanhar os logs dos contêineres:
```bash
docker compose logs -f web
```

### 4. Execução Local para Desenvolvimento (Opcional)
Se preferir rodar apenas o PostgreSQL via Docker e o Next.js localmente:
```bash
# Sobe apenas o banco de dados
docker compose up -d postgres

# Instala as dependências
npm install

# Aplica as migrations do Prisma
npx prisma migrate dev

# Popula o banco com os dados iniciais do Living Lab
npm run db:seed

# Inicia o servidor de desenvolvimento
npm run dev
```

---

## 📂 5. Estrutura de Diretórios

```
LabGest/
├── prisma/
│   ├── schema.prisma          # Modelagem relacional do banco de dados
│   ├── seed.ts                # Dados iniciais (Workspaces, membros, tarefas reais CTPP)
│   └── migrations/            # Histórico de migrações SQL versionadas
├── src/
│   ├── app/                   # Next.js App Router (Páginas, layouts e Server Actions)
│   │   ├── (dashboard)/       # Rotas autenticadas (Dashboard, Kanban, Docs, Apontamentos)
│   │   ├── admin/             # Módulo administrativo (Aprovações e White-label)
│   │   ├── api/auth/          # Endpoint NextAuth
│   │   ├── login/             # Tela de login institucional
│   │   ├── onboarding/        # Formulário de entrada de alunos
│   │   └── waiting-room/      # Sala de espera pós-cadastro
│   ├── components/            # Componentes reutilizáveis
│   │   ├── kanban/            # Quadro Kanban, cards e TaskDetailDialog
│   │   ├── layout/            # Sidebar dinâmica e Header com Dark Mode
│   │   ├── modals/            # Diálogos de criação e solicitação
│   │   └── ui/                # Primitivos shadcn/ui (Button, Card, Badge, etc.)
│   ├── lib/                   # Utilitários, AuthOptions, Prisma Client e conversor de cores
│   ├── types/                 # Definições de tipos TypeScript compartilhadas
│   └── middleware.ts          # Proteção de rotas e redirecionamento de status
├── docker-compose.yml         # Orquestração multi-container
├── Dockerfile                 # Multi-stage build otimizado para Next.js 14
├── ROADMAP.md                 # Memória do projeto e checklist detalhado de fases
└── README.md                  # Este documento
```

---

## 🗺️ 6. Roadmap & Memória do Projeto

Para conferir o planejamento detalhado das próximas fases, incluindo a **Fase 5 (Edição Funcional dos Cadernos do Workspace)** e as regras estritas de preservação de código para agentes de IA, consulte o arquivo:
📄 **[ROADMAP.md](./ROADMAP.md)**

---

## 🏛️ 7. Apoio e Realização

Desenvolvido para o **LabTechPP — Centro de Tecnologia e Políticas Públicas**  
**Universidade Federal de São Paulo (UNIFESP)**  
Todos os direitos reservados. Uso voltado para ensino, pesquisa e extensão universitária.
