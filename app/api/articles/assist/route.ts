import { NextRequest, NextResponse } from "next/server";

import { generateAltText, generateHeadline, generateSummary } from "@/lib/ai/contentAssistant";
import { requireApiSession } from "@/lib/auth/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = requireApiSession(request, ["admin", "editor"]);
    if (!auth.ok) {
      return auth.response;
    }

    const payload = (await request.json()) as {
      title?: string;
      contentHtml: string;
      context?: string;
    };

    if (!payload.contentHtml) {
      return NextResponse.json({ error: "contentHtml is required" }, { status: 400 });
    }

    const generatedHeadline = payload.title || (await generateHeadline({ contentHtml: payload.contentHtml }));
    const generatedSummary = await generateSummary({ title: generatedHeadline, contentHtml: payload.contentHtml });
    const generatedAlt = await generateAltText({
      articleTitle: generatedHeadline,
      context: payload.context || generatedSummary
    });

    return NextResponse.json({
      data: {
        headline: generatedHeadline,
        summary: generatedSummary,
        altText: generatedAlt
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to generate suggestions"
      },
      { status: 500 }
    );
  }
}
