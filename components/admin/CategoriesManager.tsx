"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import type { CategoryAdminItem } from "@/features/categories/category.service";

type CategoriesManagerProps = {
  initialCategories: CategoryAdminItem[];
};

type CreatedCategoryPayload = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

export function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          slug: slug || undefined,
          description: description || undefined
        })
      });

      const payload = (await response.json()) as {
        data?: CreatedCategoryPayload;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to create category");
      }

      const created: CategoryAdminItem = {
        id: payload.data.id,
        name: payload.data.name,
        slug: payload.data.slug,
        description: payload.data.description,
        postCount: 0,
        updatedAt: new Date().toISOString()
      };

      setCategories((current) => [created, ...current]);
      setName("");
      setSlug("");
      setDescription("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create category");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-stack">
      <form className="admin-form admin-panel-card" onSubmit={onSubmit}>
        <h2>Add Category</h2>
        <div className="admin-grid-2">
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Slug (optional)
            <input value={slug} onChange={(event) => setSlug(event.target.value)} />
          </label>
        </div>

        <label>
          Description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
        </label>

        {error ? <p className="admin-error">{error}</p> : null}
        <button className="admin-btn" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Add Category"}
        </button>
      </form>

      <div className="admin-panel-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Posts</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td data-label="Name">{category.name}</td>
                <td data-label="Slug">{category.slug}</td>
                <td data-label="Posts">{category.postCount}</td>
                <td data-label="Updated">{new Date(category.updatedAt).toLocaleDateString("en-US")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
