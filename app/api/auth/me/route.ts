import { NextRequest, NextResponse } from "next/server";

import { getApiSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = getApiSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    data: {
      user: {
        id: session.id,
        email: session.email,
        name: session.name,
        role: session.role
      }
    }
  });
}
