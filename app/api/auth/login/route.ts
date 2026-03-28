import { NextRequest, NextResponse } from "next/server";

import { countUsers, ensureBootstrapAdmin, validateUserCredentials } from "@/features/users/user.service";
import { setSessionCookie } from "@/lib/auth/session";
import { createSessionToken } from "@/lib/auth/token";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await ensureBootstrapAdmin();
    if (process.env.NODE_ENV === "production" && (await countUsers()) === 0) {
      return NextResponse.json(
        {
          error: "No admin user configured. Create an admin account in MongoDB first."
        },
        { status: 503 }
      );
    }

    const payload = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!payload.email || !payload.password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await validateUserCredentials(payload.email, payload.password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    const response = NextResponse.json({ data: { user } });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Login failed"
      },
      { status: 500 }
    );
  }
}
