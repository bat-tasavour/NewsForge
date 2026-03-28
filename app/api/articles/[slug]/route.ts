import { NextRequest, NextResponse } from "next/server";

import { getArticleBySlugAnyStatus, getPublishedArticleBySlug } from "@/features/news/news.service";
import { requireApiSession } from "@/lib/auth/api";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const preview = request.nextUrl.searchParams.get("preview") === "true";

    if (preview) {
      const auth = requireApiSession(request, ["admin", "editor"]);
      if (!auth.ok) {
        return auth.response;
      }

      const article = await getArticleBySlugAnyStatus(slug);
      if (!article) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
      }

      return NextResponse.json({ data: article });
    }

    const article = await getPublishedArticleBySlug(slug);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ data: article });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
