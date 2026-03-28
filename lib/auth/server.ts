import { redirect } from "next/navigation";

import type { UserRole } from "@/features/users/user.types";

import { getServerSession } from "./session";

export async function requireServerSession(roles?: UserRole[]) {
  const session = await getServerSession();
  if (!session) {
    redirect("/admin/login");
  }

  if (roles && !roles.includes(session.role)) {
    redirect("/admin/login");
  }

  return session;
}
