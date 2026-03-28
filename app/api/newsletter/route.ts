import { NextRequest, NextResponse } from "next/server";

import { subscribeToNewsletter } from "@/features/newsletter/newsletter.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      email?: string;
      source?: string;
    };

    if (!payload.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const subscribed = await subscribeToNewsletter(payload.email, payload.source || "site-footer");

    return NextResponse.json(
      {
        data: {
          id: subscribed._id.toString(),
          email: subscribed.email
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to subscribe"
      },
      { status: 400 }
    );
  }
}
