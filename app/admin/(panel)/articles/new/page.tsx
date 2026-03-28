import { ArticleComposer } from "@/components/admin/ArticleComposer";
import { getOrCreateAuthorByIdentity } from "@/features/authors/author.service";
import { listCategories, ensureDefaultCategory } from "@/features/categories/category.service";
import { listTags, ensureDefaultTag } from "@/features/tags/tag.service";
import { requireServerSession } from "@/lib/auth/server";

export default async function NewArticlePage() {
  const session = await requireServerSession(["admin", "editor"]);

  await Promise.all([ensureDefaultCategory(), ensureDefaultTag()]);

  const [author, categories, tags] = await Promise.all([
    getOrCreateAuthorByIdentity({
      name: session.name,
      email: session.email
    }),
    listCategories(),
    listTags()
  ]);

  return (
    <div className="admin-stack">
      <section className="admin-panel-card">
        <h1>Compose Article</h1>
        <p>Write, optimize, and publish stories with SEO-first defaults.</p>
      </section>

      <ArticleComposer
        authorId={author._id.toString()}
        categories={categories.map((item) => ({ id: item._id.toString(), name: item.name }))}
        tags={tags.map((item) => ({ id: item._id.toString(), name: item.name }))}
      />
    </div>
  );
}
