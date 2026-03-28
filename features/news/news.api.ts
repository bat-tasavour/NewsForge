import type { ArticleCard, CreateArticleInput } from "./news.types";

type GetArticlesParams = {
  page?: number;
  limit?: number;
  category?: string;
};

export async function fetchArticles(params: GetArticlesParams = {}): Promise<ArticleCard[]> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  const response = await fetch(`/api/articles?${searchParams.toString()}`, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Unable to fetch articles");
  }

  const data = (await response.json()) as { data: ArticleCard[] };
  return data.data;
}

export async function createArticleApi(payload: CreateArticleInput): Promise<{ id: string; slug: string }> {
  const response = await fetch("/api/articles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Unable to create article");
  }

  const data = (await response.json()) as { data: { id: string; slug: string } };
  return data.data;
}
