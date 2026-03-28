"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ArticleRowActionsProps = {
  id: string;
  slug: string;
};

export function ArticleRowActions({ id, slug }: ArticleRowActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (!window.confirm("Delete this article permanently?")) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/articles/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Delete failed");
      }

      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="admin-row-actions">
      <Link href={`/news/${slug}`} target="_blank" rel="noopener noreferrer">
        Edit
      </Link>
      <button type="button" disabled={deleting} onClick={onDelete}>
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
