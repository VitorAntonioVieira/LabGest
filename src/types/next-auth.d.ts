import { DefaultSession } from "next-auth";
import { UserRole, UserStatus } from "./index";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      status: UserStatus;
      hasActiveLab?: boolean;
      hasWaitingLab?: boolean;
      approvedLabCount?: number;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: UserRole;
    status?: UserStatus;
    hasActiveLab?: boolean;
    hasWaitingLab?: boolean;
    approvedLabCount?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    status?: UserStatus;
    hasActiveLab?: boolean;
    hasWaitingLab?: boolean;
    approvedLabCount?: number;
  }
}
