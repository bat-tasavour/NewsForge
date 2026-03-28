import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";

import { NewsCard } from "@/components/news/NewsCard";
import { Container } from "@/components/ui/Container";
import { listPublishedArticlesByCategory } from "@/features/news/news.service";
import { buildCategoryMetadata } from "@/lib/seo/metadata";
import { getSiteConfig } from "@/lib/site/config";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const getCachedCategoryFeed = unstable_cache(
  async (slug: string) => listPublishedArticlesByCategory(slug, { limit: 24 }),
  ["category-feed"],
  { revalidate: 180, tags: ["category-feed"] }
);

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = getSiteConfig();
  const payload = await getCachedCategoryFeed(slug);

  if (!payload.category) {
    return {
      title: `Category not found | ${site.organizationName}`
    };
  }

  return buildCategoryMetadata(site, payload.category);
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const payload = await getCachedCategoryFeed(slug);

  if (!payload.category) {
    notFound();
  }

  return (
    <main className="page-shell">
      <Container>
        <header className="page-header page-header--category">
          <h1>{payload.category.name}</h1>
          <p>{payload.category.description || `Coverage and updates from ${payload.category.name}.`}</p>
        </header>

        <section className="news-grid news-grid--dense" aria-label={`${payload.category.name} stories`}>
          {payload.articles.map((article) => (
            <NewsCard key={article._id} article={article} />
          ))}
        </section>
      </Container>
    </main>
  );
}
