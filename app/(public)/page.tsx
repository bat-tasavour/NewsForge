import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Image from "next/image";
import Link from "next/link";

import { NewsCard } from "@/components/news/NewsCard";
import { NewsletterForm } from "@/components/news/NewsletterForm";
import { Container } from "@/components/ui/Container";
import { listCategories } from "@/features/categories/category.service";
import { listPublishedArticles, listPublishedArticlesByCategory } from "@/features/news/news.service";
import type { ArticleCard } from "@/features/news/news.types";
import { buildHomeMetadata } from "@/lib/seo/metadata";
import { getSiteConfig } from "@/lib/site/config";

const getCachedHomeFeed = unstable_cache(async () => listPublishedArticles({ limit: 30 }), ["home-feed"], {
  revalidate: 180,
  tags: ["home-feed"]
});
const getCachedCategories = unstable_cache(async () => listCategories(), ["home-categories"], {
  revalidate: 300,
  tags: ["home-categories"]
});

async function getHomeFeedSafe(): Promise<ArticleCard[]> {
  try {
    return await getCachedHomeFeed();
  } catch (error) {
    console.error("Failed to load home feed", error);
    return [];
  }
}

async function getHomeCategoriesSafe() {
  try {
    return await getCachedCategories();
  } catch (error) {
    console.error("Failed to load categories", error);
    return [];
  }
}

function formatPublishedDate(value?: string): string {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type PromoStoryProps = {
  article: ArticleCard;
  compact?: boolean;
};

function PromoStory({ article, compact = false }: PromoStoryProps) {
  return (
    <article className={`promo-story ${compact ? "promo-story--compact" : ""}`}>
      <Link href={`/news/${article.slug}`} className="promo-story__media-link">
        <Image
          src={article.featuredImage.url}
          alt={article.featuredImage.alt}
          width={compact ? 640 : 1280}
          height={compact ? 360 : 720}
          className="promo-story__media"
          sizes={compact ? "(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 32vw" : "(max-width: 1199px) 100vw, 48vw"}
          priority={!compact}
        />
      </Link>
      <div className="promo-story__overlay">
        <p className="promo-story__meta">{formatPublishedDate(article.publishedAt)}</p>
        <h2>
          <Link href={`/news/${article.slug}`}>{article.title}</Link>
        </h2>
      </div>
    </article>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const site = getSiteConfig();
  const latest = await getHomeFeedSafe();
  return buildHomeMetadata(site, latest);
}

export default async function HomePage() {
  const site = getSiteConfig();
  const [articles, categories] = await Promise.all([getHomeFeedSafe(), getHomeCategoriesSafe()]);

  const coverStory = articles[0];
  const topStories = articles.slice(1, 5);
  const specialReports = articles.slice(5, 9);
  const weeklyStories = articles.slice(9, 15);
  const latestStories = articles.slice(15);
  const featuredCategories = categories.slice(0, 3);
  const categoryBlocks = await Promise.all(
    featuredCategories.map(async (category) => {
      const payload = await listPublishedArticlesByCategory(category.slug, { limit: 3 }).catch(() => ({
        category: null,
        articles: [] as ArticleCard[]
      }));

      return {
        category,
        articles: payload.articles
      };
    })
  );

  return (
    <main className="page-shell">
      <Container>
        <section className="template1-intro">
          <p className="template1-intro__eyebrow">Live Newsroom</p>
          <h1>{site.organizationName}</h1>
          <p>{site.description}</p>
        </section>

        <section className="newsletter-strip" aria-label="Newsletter signup">
          <div>
            <h2>Get Breaking Headlines in Your Inbox</h2>
            <p>Simple daily briefing. No spam.</p>
          </div>
          <NewsletterForm source="home-hero" />
        </section>

        <section className="hero-layout" aria-label="Top headlines">
          <div className="hero-layout__top">
            <div className="section-head">
              <h2>Top Stories</h2>
            </div>
            <div className="hero-stack">
              {topStories.map((article) => (
                <PromoStory key={article._id} article={article} compact />
              ))}
            </div>
          </div>

          <div className="hero-layout__cover">
            <div className="section-head">
              <h2>Cover Story</h2>
            </div>
            {coverStory ? (
              <PromoStory article={coverStory} />
            ) : (
              <article className="news-card">
                <div className="news-card__body">
                  <h2>Publishing queue is empty</h2>
                  <p>Publish a story from admin and this cover block will auto-update.</p>
                </div>
              </article>
            )}
          </div>

          <aside className="hero-layout__special">
            <div className="section-head">
              <h2>Special Report</h2>
            </div>

            <ul className="special-list">
              {specialReports.map((article) => (
                <li key={article._id}>
                  <Link href={`/news/${article.slug}`}>{article.title}</Link>
                  <p>{article.excerpt}</p>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="weekly-section" aria-label="Weekly picks">
          <div className="section-head">
            <h2>Weekly Spotlight</h2>
            <span>Editor curated</span>
          </div>
          <div className="weekly-grid">
            {(weeklyStories.length > 0 ? weeklyStories : articles.slice(0, 6)).map((article) => (
              <NewsCard key={article._id} article={article} />
            ))}
            {articles.length === 0 ? (
              <article className="news-card">
                <div className="news-card__body">
                  <h2>No weekly stories yet</h2>
                  <p>Once editors publish stories, this section updates automatically.</p>
                </div>
              </article>
            ) : null}
          </div>
        </section>

        <section className="home-main-layout">
          <div>
            <div className="section-head">
              <h2>Latest News</h2>
              <span>Updated continuously</span>
            </div>
            <div className="news-grid news-grid--dense" aria-label="Latest articles">
              {(latestStories.length > 0 ? latestStories : articles.slice(0, 12)).map((article) => (
                <NewsCard key={article._id} article={article} />
              ))}
              {articles.length === 0 ? (
                <article className="news-card">
                  <div className="news-card__body">
                    <h2>No latest stories yet</h2>
                    <p>Use the admin panel to publish your first article.</p>
                  </div>
                </article>
              ) : null}
            </div>
          </div>

          <aside className="home-sidebar">
            <details className="sidebar-widget" open>
              <summary>Important Updates</summary>
              <ul>
                {articles.slice(0, 5).map((item) => (
                  <li key={item._id}>
                    <Link href={`/news/${item.slug}`}>{item.title}</Link>
                  </li>
                ))}
                {articles.length === 0 ? <li>Updates will appear after first publish.</li> : null}
              </ul>
            </details>

            <details className="sidebar-widget" open>
              <summary>Categories</summary>
              <ul>
                {categories.slice(0, 8).map((category) => (
                  <li key={category._id.toString()}>
                    <Link href={`/category/${category.slug}`}>{category.name}</Link>
                  </li>
                ))}
                {categories.length === 0 ? <li>No categories yet.</li> : null}
              </ul>
            </details>

            <section className="home-sidebar__ad" aria-label="Advertisement">
              <p>Advertisement</p>
              <strong>300 × 600</strong>
            </section>
          </aside>
        </section>

        {categoryBlocks.length > 0 ? (
          <section className="category-section-grid" aria-label="Category sections">
            {categoryBlocks.map((block) => (
              <article key={block.category._id.toString()} className="category-section-card">
                <header>
                  <h3>
                    <Link href={`/category/${block.category.slug}`}>{block.category.name}</Link>
                  </h3>
                </header>
                <ul>
                  {block.articles.map((article) => (
                    <li key={article._id}>
                      <Link href={`/news/${article.slug}`}>{article.title}</Link>
                    </li>
                  ))}
                  {block.articles.length === 0 ? <li>No stories in this category yet.</li> : null}
                </ul>
              </article>
            ))}
          </section>
        ) : null}
      </Container>
    </main>
  );
}
