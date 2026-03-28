"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { TiptapEditor } from "@/components/news/TiptapEditor";

type Option = {
  id: string;
  name: string;
};

type ArticleComposerProps = {
  categories: Option[];
  tags: Option[];
  authorId: string;
};

export function ArticleComposer({ categories, tags, authorId }: ArticleComposerProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "scheduled">("published");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(tags.slice(0, 1).map((tag) => tag.id));
  const [scheduledFor, setScheduledFor] = useState("");
  const [content, setContent] = useState<{ json: Record<string, unknown>; html: string }>({
    json: {
      type: "doc",
      content: []
    },
    html: ""
  });

  const [image, setImage] = useState<{
    originalUrl: string;
    optimizedUrl: string;
    thumbnailUrl: string;
    responsive: Array<{ url: string; width: number; height: number }>;
    alt?: string;
    width?: number;
    height?: number;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [assisting, setAssisting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(content.html.trim() && categoryId && !saving && !uploading);
  }, [content.html, categoryId, saving, uploading]);

  const submitLabel =
    status === "published" ? "Publish Article" : status === "scheduled" ? "Schedule Article" : "Save Draft";

  async function onUploadImage(file: File) {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("articleTitle", title || "Untitled article");
      formData.set("context", excerpt || "Feature image");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const payload = (await response.json()) as {
        data: {
          original: { url: string; width: number; height: number };
          optimized: { url: string; width: number; height: number };
          thumbnail: { url: string; width: number; height: number };
          responsive: Array<{ url: string; width: number; height: number }>;
          alt: string;
        };
      };

      setImage({
        originalUrl: payload.data.original.url,
        optimizedUrl: payload.data.optimized.url,
        thumbnailUrl: payload.data.thumbnail.url,
        responsive: payload.data.responsive,
        alt: payload.data.alt,
        width: payload.data.optimized.width,
        height: payload.data.optimized.height
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onAssist() {
    if (!content.html.trim()) {
      setError("Write content first so AI can generate headline/summary.");
      return;
    }

    setAssisting(true);
    setError(null);

    try {
      const response = await fetch("/api/articles/assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: title || undefined,
          contentHtml: content.html,
          context: excerpt || undefined
        })
      });

      const payload = (await response.json()) as {
        data?: {
          headline: string;
          summary: string;
        };
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to generate suggestions");
      }

      if (!title.trim()) {
        setTitle(payload.data.headline);
      }
      if (!excerpt.trim()) {
        setExcerpt(payload.data.summary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI assist failed");
    } finally {
      setAssisting(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          slug: slug || undefined,
          excerpt,
          content,
          featuredImage: image || undefined,
          categoryId,
          tagIds: selectedTagIds,
          authorId,
          status,
          scheduledFor: status === "scheduled" ? scheduledFor : undefined
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Failed to save article");
      }

      router.push("/admin/articles");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-compose" onSubmit={onSubmit}>
      <div className="admin-compose__main">
        <div className="admin-panel-card">
          <div className="admin-panel-card__header">
            <h2>Story Details</h2>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={onAssist} disabled={assisting}>
              {assisting ? "Generating..." : "AI Suggest"}
            </button>
          </div>

          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <label>
            Slug
            <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="auto-generated-if-empty" />
          </label>

          <label>
            Excerpt
            <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} rows={3} />
          </label>
        </div>

        <div className="admin-panel-card">
          <p className="admin-editor-label">Content</p>
          <TiptapEditor onChange={setContent} />
          <p className="admin-inline-note">Only published articles are visible on the homepage and category pages.</p>
        </div>
      </div>

      <aside className="admin-compose__side">
        <section className="admin-panel-card admin-publish-panel">
          <h3>Publish</h3>

          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value as "draft" | "published" | "scheduled")}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </label>

          {status === "scheduled" ? (
            <label>
              Schedule For
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
                required
              />
            </label>
          ) : null}

          <label>
            Category
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tags
            <select
              multiple
              value={selectedTagIds}
              onChange={(event) => {
                const values = Array.from(event.target.selectedOptions).map((item) => item.value);
                setSelectedTagIds(values);
              }}
            >
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="featured-image">Featured Image</label>
          <input
            id="featured-image"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void onUploadImage(file);
              }
            }}
          />
          {uploading ? <p className="admin-inline-note">Optimizing image...</p> : null}
          {image ? <p className="admin-inline-note">Image ready</p> : null}

          {error ? <p className="admin-error">{error}</p> : null}

          <button type="submit" className="admin-btn" disabled={!canSubmit}>
            {saving ? "Saving..." : submitLabel}
          </button>
        </section>
      </aside>
    </form>
  );
}
