import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLdScript } from "@/components/news/JsonLdScript";
import { NewsContent } from "@/components/news/NewsContent";
import { Container } from "@/components/ui/Container";
import { getPublishedArticleBySlug, getRelatedArticles } from "@/features/news/news.service";
import { buildArticleMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd, buildNewsArticleJsonLd, buildOrganizationJsonLd } from "@/lib/seo/jsonld";
import { getSiteBaseUrl, getSiteConfig } from "@/lib/site/config";

type NewsDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const getCachedArticle = unstable_cache(async (slug: string) => getPublishedArticleBySlug(slug), ["news-article"], {
  revalidate: 120,
  tags: ["news-article"]
});

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = getSiteConfig();
  const article = await getCachedArticle(slug);

  if (!article) {
    return {
      title: `Article not found | ${site.organizationName}`
    };
  }

  return buildArticleMetadata(site, article);
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const site = getSiteConfig();
  const article = await getCachedArticle(slug);

  if (!article) {
    notFound();
  }

  const related = await getRelatedArticles(
    article._id,
    article.categoryId._id,
    article.tagIds.map((tag) => tag._id),
    4
  );

  const baseUrl = getSiteBaseUrl(site);
  const featuredImageUrl =
    article.featuredImage?.optimizedUrl || article.featuredImage?.thumbnailUrl || "/placeholder-news.svg";
  const featuredImageAlt = article.featuredImage?.alt || article.title;
  const featuredImageWidth = article.featuredImage?.width || 1600;
  const featuredImageHeight = article.featuredImage?.height || 900;

  const articleJsonLd = buildNewsArticleJsonLd(site, article, baseUrl);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(baseUrl, [
    { name: "Home", path: "/" },
    { name: article.categoryId.name, path: `/category/${article.categoryId.slug}` },
    { name: article.title, path: `/news/${article.slug}` }
  ]);
  const organizationJsonLd = buildOrganizationJsonLd(site, baseUrl);

  return (
    <main className="page-shell">
      <Container>
        <JsonLdScript id="news-article-jsonld" payload={articleJsonLd} />
        <JsonLdScript id="breadcrumb-jsonld" payload={breadcrumbJsonLd} />
        <JsonLdScript id="organization-jsonld" payload={organizationJsonLd} />

        <nav className="breadcrumb-nav" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href={`/category/${article.categoryId.slug}`}>{article.categoryId.name}</Link>
          <span>/</span>
          <span>{article.title}</span>
        </nav>

        <article className="article-layout">
          <section className="article-main">
            <header className="page-header">
              <h1>{article.title}</h1>
              <p className="article-meta">
                By {article.authorId.name} in{" "}
                <Link href={`/category/${article.categoryId.slug}`}>{article.categoryId.name}</Link>
                {article.publishedAt ? ` • ${new Date(article.publishedAt).toLocaleString("en-US")}` : ""}
              </p>
            </header>

            <Image
              src={featuredImageUrl}
              alt={featuredImageAlt}
              width={featuredImageWidth}
              height={featuredImageHeight}
              priority
              sizes="(max-width: 900px) 100vw, 70vw"
              style={{ width: "100%", height: "auto", borderRadius: "14px", marginBottom: "1.2rem" }}
            />

            <NewsContent html={article.content.html} theme={site.theme} />

            <section className="article-inline-ad" aria-label="Advertisement">
              <p>Advertisement</p>
              <strong>Responsive Ad Slot</strong>
            </section>
          </section>

          <aside className="related-panel">
            <details open>
              <summary>Related coverage</summary>
              <ul>
                {related.map((item) => (
                  <li key={item._id}>
                    <Link href={`/news/${item.slug}`}>{item.title}</Link>
                  </li>
                ))}
              </ul>
            </details>

            {(article.internalLinks?.length ?? 0) > 0 ? (
              <details open>
                <summary>Internal links</summary>
                <ul>
                  {article.internalLinks.map((item) => (
                    <li key={item.slug}>
                      <Link href={`/news/${item.slug}`}>{item.title}</Link>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </aside>
        </article>
      </Container>
    </main>
  );
}
