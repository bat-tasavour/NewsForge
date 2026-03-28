import { requireServerSession } from "@/lib/auth/server";

const staticPages = [
  { title: "Homepage", slug: "/", updatedAt: "Auto-generated" },
  { title: "Article Template", slug: "/news/[slug]", updatedAt: "Auto-generated" },
  { title: "Category Template", slug: "/category/[slug]", updatedAt: "Auto-generated" },
  { title: "RSS Feed", slug: "/rss.xml", updatedAt: "Auto-generated" },
  { title: "Sitemap", slug: "/sitemap.xml", updatedAt: "Auto-generated" }
];

export default async function AdminPagesPage() {
  await requireServerSession(["admin", "editor"]);

  return (
    <div className="admin-stack">
      <section className="admin-panel-card">
        <h1>Pages</h1>
        <p>Manage static and system pages used by the frontend.</p>
      </section>

      <section className="admin-panel-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staticPages.map((page) => (
              <tr key={page.slug}>
                <td data-label="Title">{page.title}</td>
                <td data-label="Slug">{page.slug}</td>
                <td data-label="Updated">{page.updatedAt}</td>
                <td data-label="Actions">
                  <span className="admin-row-actions">
                    <a href={page.slug} target="_blank" rel="noreferrer">
                      View
                    </a>
                    <button type="button" disabled>
                      Edit
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
