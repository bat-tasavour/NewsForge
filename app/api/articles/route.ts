import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { createArticle, listArticlesForAdmin, listPublishedArticles, listPublishedArticlesByCategory } from "@/features/news/news.service";
import type { CreateArticleInput } from "@/features/news/news.types";
import { requireApiSession } from "@/lib/auth/api";

export const runtime = "nodejs";

function parseStatus(value: string | null): "all" | "draft" | "published" | "scheduled" {
  if (value === "all" || value === "draft" || value === "scheduled") {
    return value;
  }

  return "published";
}

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get("category");
    const query = request.nextUrl.searchParams.get("q") || undefined;
    const page = Number(request.nextUrl.searchParams.get("page") || "1");
    const limit = Number(request.nextUrl.searchParams.get("limit") || "12");
    const status = parseStatus(request.nextUrl.searchParams.get("status"));

    if (status !== "published") {
      const auth = requireApiSession(request, ["admin", "editor"]);
      if (!auth.ok) {
        return auth.response;
      }

      const items = await listArticlesForAdmin({
        status,
        page,
        limit,
        query,
        categorySlug: category || undefined
      });
      return NextResponse.json({ data: items, meta: { status } });
    }

    const payload = category
      ? await listPublishedArticlesByCategory(category, { limit })
      : { articles: await listPublishedArticles({ page, limit }) };

    return NextResponse.json(
      {
        data: payload.articles,
        meta: {
          category: category || null,
          status: "published"
        }
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600"
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireApiSession(request, ["admin", "editor"]);
    if (!auth.ok) {
      return auth.response;
    }

    const payload = (await request.json()) as CreateArticleInput;
    const article = await createArticle(payload, {
      name: auth.session.name,
      email: auth.session.email
    });

    revalidateTag("home-feed", "max");
    revalidateTag("news-article", "max");
    revalidateTag("category-feed", "max");
    revalidateTag("home-categories", "max");
    revalidatePath("/");
    revalidatePath(`/news/${article.slug}`);

    return NextResponse.json(
      {
        data: {
          id: article._id.toString(),
          slug: article.slug
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create article"
      },
      { status: 400 }
    );
  }
}
