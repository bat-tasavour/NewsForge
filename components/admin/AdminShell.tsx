"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import type { UserRole } from "@/features/users/user.types";

import { LogoutButton } from "./LogoutButton";

type AdminShellProps = {
  siteName: string;
  userName: string;
  userRole: UserRole;
  showUsers: boolean;
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  show?: boolean;
  external?: boolean;
};

function getPageTitle(pathname: string): string {
  if (pathname === "/admin") {
    return "Dashboard";
  }

  if (pathname.startsWith("/admin/articles/new")) {
    return "New Article";
  }

  if (pathname.startsWith("/admin/articles")) {
    return "Articles";
  }

  if (pathname.startsWith("/admin/users")) {
    return "Users";
  }

  if (pathname.startsWith("/admin/categories")) {
    return "Categories";
  }

  if (pathname.startsWith("/admin/media")) {
    return "Media";
  }

  if (pathname.startsWith("/admin/pages")) {
    return "Pages";
  }

  return "Newsroom";
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname.startsWith(href);
}

export function AdminShell({ siteName, userName, userRole, showUsers, children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  const navItems: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: "⌂" },
    { href: "/admin/articles", label: "Articles", icon: "📰" },
    { href: "/admin/articles/new", label: "New Article", icon: "✎" },
    { href: "/admin/users", label: "Users", icon: "👥", show: showUsers },
    { href: "/admin/categories", label: "Categories", icon: "▣" },
    { href: "/admin/media", label: "Media", icon: "🖼" },
    { href: "/admin/pages", label: "Pages", icon: "📄" },
    { href: "/", label: "View Site", icon: "↗", external: true }
  ];

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    if (!query) {
      router.push("/admin/articles");
      return;
    }

    router.push(`/admin/articles?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className={`admin-shell ${open ? "is-open" : ""}`}>
      <aside className="admin-sidebar" aria-label="Admin sidebar">
        <div className="admin-sidebar__top">
          <p className="admin-sidebar__brand">{siteName}</p>
          <button type="button" className="admin-icon-btn admin-close-btn" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>

        <nav className="admin-sidebar__nav">
          {navItems
            .filter((item) => item.show !== false)
            .map((item) =>
              item.external ? (
                <Link
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-nav-link admin-nav-link--external"
                >
                  <span aria-hidden>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`admin-nav-link ${isActive(pathname, item.href) ? "is-active" : ""}`}
                >
                  <span aria-hidden>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            )}
        </nav>
      </aside>

      <button
        type="button"
        aria-label="Close sidebar"
        className="admin-sidebar-overlay"
        onClick={() => setOpen(false)}
      />

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button
              type="button"
              className="admin-icon-btn admin-menu-btn"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              ☰
            </button>
            <h1 className="admin-page-title">{pageTitle}</h1>
          </div>

          <div className="admin-topbar__right">
            <form className="admin-search" role="search" onSubmit={onSearch}>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search articles..."
                aria-label="Search articles"
              />
            </form>

            <button type="button" className="admin-icon-btn" aria-label="Notifications">
              🔔
            </button>

            <div className="admin-user-chip">
              <span className="admin-avatar" aria-hidden>
                {userName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((item) => item[0]?.toUpperCase() || "")
                  .join("") || "U"}
              </span>
              <div>
                <p>{userName}</p>
                <small>{userRole}</small>
              </div>
            </div>

            <LogoutButton />
          </div>
        </header>

        <section className="admin-content">{children}</section>
      </div>
    </div>
  );
}
