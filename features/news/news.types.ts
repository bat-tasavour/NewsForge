import type { Types } from "mongoose";

export type ArticleStatus = "draft" | "published" | "scheduled";

export type ArticleImage = {
  originalUrl: string;
  optimizedUrl: string;
  thumbnailUrl: string;
  responsive?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  alt: string;
  width?: number;
  height?: number;
};

export type ArticleInternalLink = {
  title: string;
  slug: string;
  url: string;
};

export type ArticleDocument = {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: {
    json: Record<string, unknown>;
    html: string;
  };
  featuredImage: ArticleImage;
  categoryId: Types.ObjectId;
  tagIds: Types.ObjectId[];
  authorId: Types.ObjectId;
  status: ArticleStatus;
  publishedAt?: Date;
  scheduledFor?: Date;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
  internalLinks: ArticleInternalLink[];
  createdAt: Date;
  updatedAt: Date;
};

export type CreateArticleInput = {
  title?: string;
  slug?: string;
  excerpt?: string;
  content: {
    json: Record<string, unknown>;
    html: string;
  };
  featuredImage?: {
    originalUrl: string;
    optimizedUrl: string;
    thumbnailUrl: string;
    responsive?: Array<{
      url: string;
      width: number;
      height: number;
    }>;
    alt?: string;
    width?: number;
    height?: number;
  };
  categoryId?: string;
  tagIds?: string[];
  authorId?: string;
  status?: ArticleStatus;
  scheduledFor?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
};

export type ArticleCard = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt?: string;
  featuredImage: {
    url: string;
    alt: string;
  };
};

export type AdminArticleItem = {
  _id: string;
  title: string;
  slug: string;
  status: ArticleStatus;
  updatedAt: string;
  publishedAt?: string;
  category: string;
  categorySlug: string;
  author: string;
  thumbnailUrl: string;
  excerpt: string;
};
