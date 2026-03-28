import Image from "next/image";
import Link from "next/link";

import { ArticleRowActions } from "@/components/admin/ArticleRowActions";
import { listCategories } from "@/features/categories/category.service";
import { listArticlesForAdmin } from "@/features/news/news.service";
import { requireServerSession } from "@/lib/auth/server";

type ArticlesPageProps = {
  searchParams: Promise<{
    status?: "all" | "draft" | "published" | "scheduled";
    q?: string;
    category?: string;
  }>;
};

function parseStatus(value: string | undefined): "all" | "draft" | "published" | "scheduled" {
  if (value === "draft" || value === "published" || value === "scheduled") {
    return value;
  }

  return "all";
}

export default async function AdminArticlesPage({ searchParams }: ArticlesPageProps) {
  await requireServerSession(["admin", "editor"]);

  const query = await searchParams;
  const status = parseStatus(query.status);
  const search = query.q?.trim() || "";
  const category = query.category || "all";

  const [articles, categories] = await Promise.all([
    listArticlesForAdmin({
      status,
      limit: 100,
      query: search || undefined,
      categorySlug: category
    }),
    listCategories()
  ]);

  return (
    <div className="admin-stack">
      <section className="admin-panel-card">
        <div className="admin-panel-card__header">
          <h1>Articles</h1>
          <Link className="admin-btn" href="/admin/articles/new">
            Add New Article
          </Link>
        </div>

        <form className="admin-toolbar" method="get">
          <label>
            Search
            <input type="search" name="q" defaultValue={search} placeholder="Search by title or excerpt" />
          </label>

          <label>
            Category
            <select name="category" defaultValue={category}>
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item._id.toString()} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Status
            <select name="status" defaultValue={status}>
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </label>

          <button className="admin-btn" type="submit">
            Apply
          </button>
        </form>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article._id}>
                  <td data-label="Thumbnail">
                    <Image
                      src={article.thumbnailUrl}
                      alt={article.title}
                      width={88}
                      height={56}
                      className="admin-article-thumb"
                      sizes="88px"
                    />
                  </td>
                  <td data-label="Title">
                    <p className="admin-table__title">
                      <Link href={`/news/${article.slug}`} target="_blank" rel="noopener noreferrer">
                        {article.title}
                      </Link>
                    </p>
                    <small>{article.excerpt}</small>
                  </td>
                  <td data-label="Category">{article.category}</td>
                  <td data-label="Status">
                    <span className={`admin-status admin-status--${article.status}`}>{article.status}</span>
                  </td>
                  <td data-label="Date">{new Date(article.updatedAt).toLocaleString("en-US")}</td>
                  <td data-label="Actions">
                    <ArticleRowActions id={article._id} slug={article.slug} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
