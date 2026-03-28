import type { CSSProperties, ReactNode } from "react";
import { unstable_cache } from "next/cache";

import { PublicHeader } from "@/components/news/PublicHeader";
import { listCategories } from "@/features/categories/category.service";
import { getSiteConfig } from "@/lib/site/config";

type PublicLayoutProps = {
  children: ReactNode;
};

const getCachedCategories = unstable_cache(async () => listCategories(), ["public-nav-categories"], {
  revalidate: 300,
  tags: ["home-categories"]
});

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const site = getSiteConfig();
  const year = new Date().getFullYear();
  const currentDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date());

  const navItems = [{ label: "Home", href: "/" }];

  const categoryItems = await getCachedCategories()
    .then((categories) =>
      categories.slice(0, 6).map((category) => ({
        label: category.name,
        href: `/category/${category.slug}`
      }))
    )
    .catch(() => []);

  navItems.push(...categoryItems);
  navItems.push({ label: "RSS", href: "/rss.xml" }, { label: "Admin", href: "/admin/login" });

  return (
    <div
      className="template1-shell"
      style={
        {
          "--t1-primary": site.theme.colors.primary,
          "--t1-accent": site.theme.colors.accent,
          "--t1-bg": site.theme.colors.background,
          "--t1-text": site.theme.colors.text,
          "--t1-panel": site.theme.colors.panel,
          "--t1-heading-font": site.theme.typography.headingFont,
          "--t1-body-font": site.theme.typography.bodyFont
        } as CSSProperties
      }
    >
      <a className="skip-link" href="#site-main">
        Skip to main content
      </a>

      <PublicHeader siteName={site.name} currentDate={currentDate} navItems={navItems} />

      <div id="site-main">{children}</div>

      <footer className="template1-footer">
        <div className="container">
          <p>
            © {year} {site.organizationName} · Designed & Developed by{" "}
            <a href="https://syedtasavour.me" target="_blank" rel="noopener noreferrer">
              Syed Tasavour
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
