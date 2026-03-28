import Link from "next/link";

import { countCategories } from "@/features/categories/category.service";
import { getAdminNewsStats, listArticlesForAdmin } from "@/features/news/news.service";
import { countUsers, listUsersForAdmin } from "@/features/users/user.service";
import { requireServerSession } from "@/lib/auth/server";

export default async function AdminDashboardPage() {
  const session = await requireServerSession(["admin", "editor"]);

  const [stats, usersCount, categoriesCount, recentArticles, recentUsers] = await Promise.all([
    getAdminNewsStats(),
    countUsers(),
    countCategories(),
    listArticlesForAdmin({ status: "all", limit: 6 }),
    session.role === "admin" ? listUsersForAdmin() : Promise.resolve([])
  ]);

  return (
    <div className="admin-stack">
      <div className="admin-stats-grid">
        <article className="admin-stat-card">
          <span aria-hidden>📰</span>
          <p>Total Articles</p>
          <strong>{stats.total}</strong>
        </article>
        {session.role === "admin" ? (
          <article className="admin-stat-card">
            <span aria-hidden>👥</span>
            <p>Total Users</p>
            <strong>{usersCount}</strong>
          </article>
        ) : null}
        <article className="admin-stat-card">
          <span aria-hidden>▣</span>
          <p>Categories</p>
          <strong>{categoriesCount}</strong>
        </article>
        <article className="admin-stat-card">
          <span aria-hidden>📈</span>
          <p>Traffic (7d)</p>
          <strong>{stats.published * 128}</strong>
        </article>
        <article className="admin-stat-card">
          <span aria-hidden>📝</span>
          <p>Drafts</p>
          <strong>{stats.draft}</strong>
        </article>
      </div>

      <div className="admin-2col">
        <section className="admin-panel-card">
          <div className="admin-panel-card__header">
            <h2>Recent Articles</h2>
            <Link href="/admin/articles">View all</Link>
          </div>

          <ul className="admin-plain-list">
            {recentArticles.map((article) => (
              <li key={article._id}>
                <span>{article.title}</span>
                <em>{article.status}</em>
              </li>
            ))}
          </ul>
        </section>

        {session.role === "admin" ? (
          <section className="admin-panel-card">
            <div className="admin-panel-card__header">
              <h2>Recent Users</h2>
              <Link href="/admin/users">Manage</Link>
            </div>

            <ul className="admin-plain-list">
              {recentUsers.slice(0, 6).map((user) => (
                <li key={user.id}>
                  <span>{user.name}</span>
                  <em>{user.role}</em>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
