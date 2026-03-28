import { NextRequest, NextResponse } from "next/server";

import { createUser, listUsersForAdmin } from "@/features/users/user.service";
import type { UserRole } from "@/features/users/user.types";
import { requireApiSession } from "@/lib/auth/api";

export const runtime = "nodejs";

function parseRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "editor";
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireApiSession(request, ["admin"]);
    if (!auth.ok) {
      return auth.response;
    }

    const users = await listUsersForAdmin();
    return NextResponse.json({ data: users });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load users"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireApiSession(request, ["admin"]);
    if (!auth.ok) {
      return auth.response;
    }

    const payload = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
    };

    const name = payload.name?.trim();
    const email = payload.email?.trim();
    const password = payload.password || "";
    const role = parseRole(payload.role);

    if (!name || !email || password.length < 8) {
      return NextResponse.json(
        {
          error: "name, email and password (min 8 chars) are required"
        },
        { status: 400 }
      );
    }

    const user = await createUser({
      name,
      email,
      password,
      role
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create user"
      },
      { status: 400 }
    );
  }
}
