import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { deleteArticleById } from "@/features/news/news.service";
import { requireApiSession } from "@/lib/auth/api";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireApiSession(request, ["admin", "editor"]);
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;
    const deleted = await deleteArticleById(id);
    if (!deleted) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    revalidateTag("home-feed", "max");
    revalidateTag("news-article", "max");
    revalidateTag("category-feed", "max");
    revalidatePath("/");

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to delete article"
      },
      { status: 500 }
    );
  }
}
