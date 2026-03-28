"use client";

import { useEffect, useState } from "react";

import type { ArticleCard } from "@/features/news/news.types";

type UseNewsOptions = {
  limit?: number;
  category?: string;
};

export function useNews(options: UseNewsOptions = {}) {
  const [articles, setArticles] = useState<ArticleCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (options.limit) {
          params.set("limit", String(options.limit));
        }

        if (options.category) {
          params.set("category", options.category);
        }

        const response = await fetch(`/api/articles?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Failed to load news feed");
        }

        const payload = (await response.json()) as { data: ArticleCard[] };
        setArticles(payload.data);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      controller.abort();
    };
  }, [options.category, options.limit]);

  return {
    articles,
    loading,
    error
  };
}
