export type UserRole = "PROFESSOR" | "LEADER" | "STUDENT";

export type UserStatus = "PENDING" | "WAITING_APPROVAL" | "ACTIVE" | "REJECTED" | "SUSPENDED";

export type WorkspaceStatus = "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";

export type WorkspaceMemberRole = "OWNER" | "LEADER" | "MEMBER" | "VIEWER";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TimeEntryStatus = "PENDING" | "APPROVED" | "REJECTED";

export type DocType = "WORKSPACE" | "PERSONAL";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  status: UserStatus;
  academicId?: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  department?: string | null;
  status: WorkspaceStatus;
  requestedBy: {
    name: string | null;
    email: string | null;
  };
  _count?: {
    members: number;
    tasks: number;
    documents: number;
  };
}

export interface TaskSummary {
  id: string;
  title: string;
  workspaceName: string;
  workspaceSlug: string;
  columnTitle: string;
  priority: TaskPriority;
  dueDate?: string | null;
  allowSelfAssign: boolean;
  assignees: {
    id: string;
    name: string | null;
    image: string | null;
  }[];
  tags: {
    id: string;
    name: string;
    color: string;
  }[];
  totalLoggedMinutes?: number;
}

export interface RecentTimeEntry {
  id: string;
  taskTitle: string;
  workspaceName: string;
  date: string;
  durationMinutes: number;
  summary: string;
  status: TimeEntryStatus;
  userName?: string;
}

export type LabModulePermission =
  | "workspaces"       // Acesso aos Espaços de Trabalho e Kanban
  | "workspaces_admin" // Criar e gerenciar Espaços de Trabalho
  | "time_tracking"    // Apontamento de Horas
  | "docs"             // Caderno de Laboratório & Documentos
  | "calendar"         // Calendário do Lab
  | "members_view"     // Visualizar lista de Integrantes
  | "members_manage"   // Gerenciar papéis e atribuições de Integrantes
  | "approvals"        // Triagem e aprovação de novos membros e projetos
  | "platform_settings"// Configurações White-label da Plataforma
  | "reports";         // Relatórios e Métricas Globais

export interface SystemPermissionDef {
  id: LabModulePermission;
  label: string;
  description: string;
  category: "Operacional" | "Coordenação" | "Administrativo";
}

export const SYSTEM_PERMISSIONS: SystemPermissionDef[] = [
  {
    id: "workspaces",
    label: "Espaços & Quadros Kanban",
    description: "Visualizar projetos, colunas e cartões de atividades.",
    category: "Operacional",
  },
  {
    id: "workspaces_admin",
    label: "Criação de Workspaces",
    description: "Solicitar ou criar novos projetos e braços de pesquisa.",
    category: "Operacional",
  },
  {
    id: "time_tracking",
    label: "Apontamento de Horas",
    description: "Registrar horas trabalhadas e consultar histórico.",
    category: "Operacional",
  },
  {
    id: "docs",
    label: "Cadernos de Laboratório (Docs)",
    description: "Escrever e consultar documentações e cadernos estilo Notion.",
    category: "Operacional",
  },
  {
    id: "calendar",
    label: "Calendário do Lab",
    description: "Acessar cronograma de reuniões, entregas e marcos.",
    category: "Operacional",
  },
  {
    id: "members_view",
    label: "Visualizar Integrantes",
    description: "Consultar lista de colegas, contatos e atribuições.",
    category: "Operacional",
  },
  {
    id: "members_manage",
    label: "Gestão de Integrantes & Atribuições",
    description: "Editar papéis, conceder atribuições e gerenciar permissões.",
    category: "Coordenação",
  },
  {
    id: "approvals",
    label: "Triagem & Aprovações",
    description: "Aprovar novos cadastros de integrantes e workspaces pendentes.",
    category: "Coordenação",
  },
  {
    id: "platform_settings",
    label: "Configurações White-label",
    description: "Personalizar logotipo, cores institucionais e identidade.",
    category: "Administrativo",
  },
  {
    id: "reports",
    label: "Relatórios & Prestação de Contas",
    description: "Exportar relatórios consolidados de horas e atividades.",
    category: "Administrativo",
  },
];

export interface AttributionSummary {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color: string;
  permissions: string[];
  userCount?: number;
}

export interface MemberSummary {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
  status: UserStatus;
  academicId?: string | null;
  phone?: string | null;
  course?: string | null;
  bio?: string | null;
  createdAt: string;
  attributions: {
    id: string;
    name: string;
    slug: string;
    color: string;
    permissions: string[];
  }[];
  workspaceCount?: number;
  timeEntriesCount?: number;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  PROFESSOR: "Professor",
  LEADER: "Líder (Gestão)",
  STUDENT: "Integrante",
};

