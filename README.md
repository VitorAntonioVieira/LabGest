# 🏛️ LabGest — LabTechTPP (UNIFESP)

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js%2014-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript%205-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL%2016-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma%20ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Plataforma Integrada de Gestão de Projetos Científicos, Quadros Kanban, Apontamento de Horas e Cadernos de Laboratório**

*Centro de Tecnologia e Políticas Públicas (CTPP) — Universidade Federal de São Paulo (UNIFESP)*

</div>

---

## 📌 Visão Geral

O **LabGest** é a plataforma operacional do **Living Lab CTPP / UNIFESP**, projetada para substituir o uso fragmentado de planilhas eletrônicas, formulários dispersos e registros manuais na condução de projetos de pesquisa científica, extensão e inovação aberta (como parcerias institucionais com **EMBRAPA**, **FAPESP**, **CNPq** e **CAPES**).

A plataforma centraliza:
1. **Espaços de Trabalho (Workspaces):** Ambientes dedicados para cada braço e projeto de pesquisa.
2. **Quadros Kanban Vivos e Interativos:** Gerenciamento visual do ciclo de vida das atividades com Drag & Drop e criação dinâmica de colunas.
3. **Apontamento de Carga Horária:** Registro e rastreamento auditável de horas de bolsistas (IC, Mestrado, Doutorado e Pós-Doc) vinculado diretamente a cada tarefa.
4. **Governança Institucional e Triagem:** Fluxo rigoroso de admissão de pesquisadores e aprovação de novos workspaces com perfis de acesso (`PROFESSOR`, `LEADER`, `STUDENT`).
5. **Identidade White-label Parametrizável:** Personalização de nomes, marcas e paleta de cores via banco de dados.

---

## 🚀 Principais Funcionalidades

### 1. Quadro Kanban Completo & Drag and Drop
- **Movimentação Otimista (Zero Lag):** Arraste e solte cards entre qualquer coluna com atualização visual imediata e sincronização automática via Server Actions (`moveTask`).
- **Criação Dinâmica de Buckets/Colunas:** Adicione novos estágios ao seu fluxo de trabalho (ex: *Em Validação*, *Revisão FAPESP*, *Concluído*) diretamente pelo botão `+ Adicionar Novo Bucket`.
- **Criação Rápida de Atividades:** Adicione cards diretamente na coluna desejada usando o atalho `+` no cabeçalho de cada bucket.

### 2. Edição Granular do Card de Atividade
- **Modal Integrado (`TaskDetailDialog`):** Sem popups aninhados ou janelas cortadas.
- **Campos 100% Editáveis:**
  - Título da atividade editável in-place.
  - Dropdown para mover de coluna/bucket diretamente pelo modal.
  - Seletor de prioridade (*Baixa*, *Média*, *Alta*, *Urgente*).
  - Seletor de prazo de conclusão (*date picker*).
  - Seleção interativa de pesquisadores atribuídos (badges clicáveis com avatar e confirmação visual).
  - Textarea expansível para descrição técnica e metodologia de pesquisa.
  - Botão de exclusão com confirmação de segurança.

### 3. Apontamento de Horas Sem Sobreposição de Modais
- Destaque das horas acumuladas em cada tarefa (`Horas Registradas Nesta Atividade: Xh Ym`).
- Botão **"Apontar Horas"** dentro do próprio card da tarefa, que transiciona de forma fluida para o formulário de lançamento (minutos trabalhados, data e resumo).
- Histórico completo de apontamentos anteriores com data e justificativa.
- Apontador global no Dashboard principal para registros rápidos de pesquisa.

### 4. Autenticação Institucional JIT & Sala de Espera
- Autenticação via **Google OAuth** restrita aos domínios permitidos (`@unifesp.br` e `@aluno.unifesp.br`).
- **Ciclo de Onboarding:** Usuários recém-autenticados preenchem seus dados acadêmicos (RA, curso, telefone/WhatsApp) e são direcionados para a **Sala de Espera** (`/waiting-room`).
- **Painel de Homologação (`/admin/approvals`):** O Professor orientador avalia as solicitações de novos alunos e novos workspaces antes de liberar o acesso à plataforma.

---

## 🛠️ Stack Tecnológica

| Camada | Ferramenta | Finalidade |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 14](https://nextjs.org/) (App Router) | Renderização híbrida (Server/Client Components) |
| **Linguagem** | [TypeScript 5](https://www.typescriptlang.org/) | Tipagem estrita e segurança em tempo de compilação |
| **Estilização** | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | Design system responsivo e moderno |
| **Banco de Dados**| [PostgreSQL 16](https://www.postgresql.org/) | Banco relacional robusto com integridade referencial |
| **ORM** | [Prisma ORM](https://www.prisma.io/) | Modelagem declarativa e geração de migrations |
| **Autenticação** | [NextAuth.js v4](https://next-auth.js.org/) | Sessões JWT e integração com Google Provider |
| **Containerização** | [Docker](https://www.docker.com/) & Docker Compose | Ambientes isolados para produção e desenvolvimento |

---

## 👥 Perfis de Acesso (RBAC) e Status do Usuário

### Papéis de Acesso (`Role`)
- **`PROFESSOR`:** Administrador geral do laboratório. Homologa workspaces, aceita/rejeita alunos, gerencia configurações white-label e audita apontamentos.
- **`LEADER`:** Líder de um projeto específico. Cria colunas, gerencia atividades e supervisiona a equipe alocada no seu workspace.
- **`STUDENT`:** Pesquisador bolsista ou voluntário. Movimenta tarefas, atualiza metodologias e aponta suas horas de pesquisa.

### Ciclo de Vida do Usuário (`UserStatus`)
```
[Login Google] ──► PENDING ──(Onboarding: RA/WhatsApp)──► WAITING_APPROVAL
                                                                │
                         ┌──────────────────────────────────────┴──────────────────────────────────────┐
                         ▼                                                                             ▼
               ACTIVE (Aprovado pelo Prof.)                                                 REJECTED (Recusado)
```

---

## ⚙️ Instalação e Execução

### Pré-requisitos
- [Docker](https://www.docker.com/products/docker-desktop/) e Docker Compose instalados.
- [Node.js 20+](https://nodejs.org/) (opcional, caso queira rodar fora do Docker).

### Opção 1: Execução Completa via Docker Compose (Recomendado)

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/labtecpp/LabGest.git
   cd LabGest
   ```

2. **Configure o arquivo de ambiente:**
   ```bash
   cp .env.example .env
   ```
   *Edite o arquivo `.env` inserindo seu `NEXTAUTH_SECRET` e as credenciais do Google Cloud Console.*

3. **Suba os contêineres:**
   ```bash
   docker compose up -d --build
   ```

4. **Acesse a aplicação:**
   - Web App: [http://localhost:3000](http://localhost:3000)
   - PostgreSQL: porta `5432`

---

### Opção 2: Execução em Ambiente de Desenvolvimento Local

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Suba apenas o banco de dados via Docker:**
   ```bash
   docker compose up -d postgres
   ```

3. **Execute as migrações e popule o banco (Seed):**
   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000).

---

## 🔑 Variáveis de Ambiente (`.env`)

```ini
# Conexão com o Banco de Dados
DATABASE_URL="postgresql://labgest_admin:labgest_secure_password@localhost:5432/labgest_db?schema=public"

# Credenciais do Contêiner PostgreSQL
POSTGRES_USER="labgest_admin"
POSTGRES_PASSWORD="labgest_secure_password"
POSTGRES_DB="labgest_db"

# Autenticação (NextAuth)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua_chave_secreta_jwt_gerada_com_openssl"

# Google Cloud OAuth (Consent Screen institucional)
GOOGLE_CLIENT_ID="seu-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"

# Domínios Institucionais Permitidos (separados por vírgula)
ALLOWED_EMAIL_DOMAINS="unifesp.br,aluno.unifesp.br"
```

---

## 📁 Estrutura de Diretórios

```
LabGest/
├── prisma/
│   ├── schema.prisma         # Modelagem completa das 16 tabelas relacionais
│   └── seed.ts               # Dados iniciais de workspaces, usuários e tarefas
├── src/
│   ├── app/                  # Next.js 14 App Router (páginas e rotas de API)
│   │   ├── (dashboard)/      # Layout autenticado principal
│   │   │   ├── workspace/[id]/kanban/ # Quadro Kanban do projeto
│   │   │   ├── time-tracking/         # Relatório consolidado de horas
│   │   │   └── workspaces/            # Listagem de braços de pesquisa
│   │   ├── admin/            # Painel do Professor (aprovações e white-label)
│   │   ├── onboarding/       # Coleta de RA e dados acadêmicos
│   │   ├── waiting-room/     # Sala de espera com polling de aprovação
│   │   ├── actions.ts        # Server Actions (Kanban, Tarefas, Horas, Workspaces)
│   │   └── login/            # Tela de autenticação com Google
│   ├── components/
│   │   ├── kanban/           # Componentes do Kanban (Board, Cards, TaskDetailDialog)
│   │   ├── layout/           # Sidebar, Header dinâmico e navegação
│   │   ├── modals/           # Modais de criação de workspace, tarefas e horas
│   │   └── ui/               # Componentes base shadcn/ui estilizados
│   ├── lib/                  # Utilitários, instância Prisma e configuração Auth.js
│   └── types/                # Definições de tipos e interfaces TypeScript
├── docker-compose.yml        # Configuração de orquestração multi-container
├── Dockerfile                # Build multi-stage otimizado para produção
├── ROADMAP.md                # Memória viva e guia de execução do projeto
└── README.md                 # Documentação principal
```

---

## 🧭 Memória e Próximos Passos

Para entender o planejamento estratégico, fases de implementação e regras de contribuição, consulte o documento [ROADMAP.md](./ROADMAP.md).

---

## 📄 Licença e Créditos Institucionais

Desenvolvido para o **LabTechPP — Centro de Tecnologia e Políticas Públicas**  
**Universidade Federal de São Paulo (UNIFESP)**  
Todos os direitos reservados. Uso voltado para ensino, pesquisa e extensão universitária.
