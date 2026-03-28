import { NextRequest, NextResponse } from "next/server";

import type { UserRole } from "@/features/users/user.types";

import { getApiSession } from "./session";

export function requireApiSession(request: NextRequest, roles?: UserRole[]) {
  const session = getApiSession(request);

  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  if (roles && !roles.includes(session.role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 })
    };
  }

  return {
    ok: true as const,
    session
  };
}
