import type { UserRole } from "@/features/users/user.types";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type SessionPayload = SessionUser & {
  iat: number;
  exp: number;
};
