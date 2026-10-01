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
