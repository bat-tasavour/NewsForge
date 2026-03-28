import Image from "next/image";
import Link from "next/link";

import type { ArticleCard } from "@/features/news/news.types";

type NewsCardProps = {
  article: ArticleCard;
};

export function NewsCard({ article }: NewsCardProps) {
  const imageUrl = article.featuredImage?.url || "/placeholder-news.svg";
  const imageAlt = article.featuredImage?.alt || `${article.title} featured image`;
  const publishedLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "Latest";

  return (
    <article className="news-card">
      <Link href={`/news/${article.slug}`} className="news-card__media-link">
        <Image
          src={imageUrl}
          alt={imageAlt}
          width={640}
          height={360}
          className="news-card__image"
          sizes="(max-width: 768px) 100vw, 33vw"
          loading="lazy"
        />
      </Link>

      <div className="news-card__body">
        <p className="news-card__meta">{publishedLabel}</p>
        <h2>
          <Link href={`/news/${article.slug}`}>{article.title}</Link>
        </h2>
        <p>{article.excerpt}</p>
      </div>
    </article>
  );
}
