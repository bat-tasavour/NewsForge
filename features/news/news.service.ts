import { Types } from "mongoose";
import sanitizeHtml from "sanitize-html";

import { getOrCreateAuthorByIdentity } from "@/features/authors/author.service";
import type { AuthorDocument } from "@/features/authors/author.types";
import { CategoryModel } from "@/features/categories/category.model";
import { ensureDefaultCategory } from "@/features/categories/category.service";
import type { CategoryDocument } from "@/features/categories/category.types";
import { ensureDefaultTag } from "@/features/tags/tag.service";
import type { TagDocument } from "@/features/tags/tag.types";
import { generateAltText, generateHeadline, generateSummary } from "@/lib/ai/contentAssistant";
import { connectToDatabase } from "@/lib/db/mongodb";
import { getSiteBaseUrl, getSiteConfig } from "@/lib/site/config";
import { toIsoString, toValidDate } from "@/lib/utils/date";
import { toSlug } from "@/lib/utils/slug";
import { buildAbsoluteUrl } from "@/lib/utils/url";

import { ArticleModel } from "./news.model";
import type { AdminArticleItem, ArticleCard, ArticleDocument, CreateArticleInput } from "./news.types";

export type PopulatedArticle = Omit<ArticleDocument, "authorId" | "categoryId" | "tagIds"> & {
  authorId: AuthorDocument;
  categoryId: CategoryDocument;
  tagIds: TagDocument[];
};

type ListArticlesOptions = {
  limit?: number;
  page?: number;
};

export type ArticleFeedItem = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt?: Date;
  updatedAt: Date;
  featuredImage: ArticleDocument["featuredImage"];
  author: {
    name: string;
  } | null;
  category: {
    name: string;
    slug: string;
  } | null;
};

const HTML_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "blockquote",
    "ul",
    "ol",
    "li",
    "strong",
    "em",
    "a",
    "img",
    "figure",
    "figcaption",
    "iframe",
    "br"
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    iframe: ["src", "title", "width", "height", "allow", "allowfullscreen", "frameborder"],
    "*": ["class"]
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" })
  }
};

function normalizeFeaturedImage(
  image: Partial<ArticleDocument["featuredImage"]> | undefined,
  title: string
): ArticleDocument["featuredImage"] {
  const fallback = defaultFeaturedImage(`${title || "News article"} featured image`);
  const optimizedUrl = image?.optimizedUrl || image?.thumbnailUrl || image?.originalUrl || fallback.optimizedUrl;
  const thumbnailUrl = image?.thumbnailUrl || image?.optimizedUrl || image?.originalUrl || fallback.thumbnailUrl;

  return {
    originalUrl: image?.originalUrl || optimizedUrl,
    optimizedUrl,
    thumbnailUrl,
    responsive: Array.isArray(image?.responsive) ? image.responsive : [],
    alt: image?.alt?.trim() || fallback.alt,
    width: image?.width || fallback.width,
    height: image?.height || fallback.height
  };
}

function mapArticleToCard(article: Partial<ArticleDocument> & { _id: Types.ObjectId | string }): ArticleCard {
  const title = article.title?.trim() || "Untitled story";
  const featuredImage = normalizeFeaturedImage(article.featuredImage, title);

  return {
    _id: article._id.toString(),
    title,
    slug: article.slug?.trim() || "",
    excerpt: article.excerpt?.trim() || "",
    publishedAt: toIsoString(article.publishedAt),
    featuredImage: {
      url: featuredImage.optimizedUrl || featuredImage.thumbnailUrl,
      alt: featuredImage.alt
    }
  };
}

function isRenderableCard(card: ArticleCard): boolean {
  return Boolean(card.slug && card.title);
}

function defaultFeaturedImage(alt: string): ArticleDocument["featuredImage"] {
  return {
    originalUrl: "/placeholder-news.svg",
    optimizedUrl: "/placeholder-news.svg",
    thumbnailUrl: "/placeholder-news.svg",
    responsive: [],
    alt,
    width: 1200,
    height: 675
  };
}

async function createUniqueSlug(candidate: string): Promise<string> {
  const base = toSlug(candidate) || "article";
  let slug = base;
  let suffix = 1;

  while (await ArticleModel.exists({ slug })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function buildInternalLinks(
  categoryId: Types.ObjectId,
  tagIds: Types.ObjectId[],
  currentArticleId: Types.ObjectId
): Promise<ArticleDocument["internalLinks"]> {
  const baseUrl = getSiteBaseUrl(getSiteConfig());

  const related = await ArticleModel.find({
    status: "published",
    _id: { $ne: currentArticleId },
    $or: [{ categoryId }, { tagIds: { $in: tagIds } }]
  })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(3)
    .select({ title: 1, slug: 1 })
    .lean<Array<Pick<ArticleDocument, "title" | "slug">>>();

  return related.map((item) => ({
    title: item.title,
    slug: item.slug,
    url: buildAbsoluteUrl(baseUrl, `/news/${item.slug}`)
  }));
}

export async function createArticle(
  input: CreateArticleInput,
  actor?: { name: string; email?: string }
): Promise<ArticleDocument> {
  await connectToDatabase();

  if (!input.content?.html || !input.content?.json) {
    throw new Error("Both content.html and content.json are required");
  }

  const site = getSiteConfig();
  const safeHtml = sanitizeHtml(input.content.html, HTML_SANITIZE_OPTIONS);

  const generatedTitle =
    input.title?.trim() || (await generateHeadline({ contentHtml: safeHtml, publicationName: site.name }));
  const finalSlug = await createUniqueSlug(input.slug?.trim() || generatedTitle);

  const generatedExcerpt =
    input.excerpt?.trim() ||
    (await generateSummary({
      title: generatedTitle,
      contentHtml: safeHtml,
      publicationName: site.name
    }));

  const generatedAlt =
    input.featuredImage?.alt?.trim() ||
    (await generateAltText({
      articleTitle: generatedTitle,
      context: generatedExcerpt
    }));

  const requestedStatus = input.status ?? "draft";
  const scheduledFor = input.scheduledFor ? new Date(input.scheduledFor) : undefined;

  const publishImmediately =
    requestedStatus === "published" ||
    (requestedStatus === "scheduled" && scheduledFor instanceof Date && scheduledFor.getTime() <= Date.now());

  const status = publishImmediately ? "published" : requestedStatus;

  const category = input.categoryId ? { _id: new Types.ObjectId(input.categoryId) } : await ensureDefaultCategory();
  const defaultTag = await ensureDefaultTag();
  const tagIds = input.tagIds?.length ? input.tagIds.map((id) => new Types.ObjectId(id)) : [defaultTag._id];

  const authorId = input.authorId
    ? new Types.ObjectId(input.authorId)
    : (
        await getOrCreateAuthorByIdentity({
          name: actor?.name || "Editorial Team",
          email: actor?.email
        })
      )._id;

  const featuredImage =
    input.featuredImage
      ? {
          originalUrl: input.featuredImage.originalUrl,
          optimizedUrl: input.featuredImage.optimizedUrl,
          thumbnailUrl: input.featuredImage.thumbnailUrl,
          responsive: input.featuredImage.responsive || [],
          alt: generatedAlt,
          width: input.featuredImage.width,
          height: input.featuredImage.height
        }
      : defaultFeaturedImage(generatedAlt);

  const article = await ArticleModel.create({
    title: generatedTitle,
    slug: finalSlug,
    excerpt: generatedExcerpt,
    content: {
      json: input.content.json,
      html: safeHtml
    },
    featuredImage,
    categoryId: category._id,
    tagIds,
    authorId,
    status,
    publishedAt: publishImmediately ? new Date() : undefined,
    scheduledFor: requestedStatus === "scheduled" ? scheduledFor : undefined,
    seo: {
      metaTitle: input.seo?.metaTitle || generatedTitle,
      metaDescription: input.seo?.metaDescription || generatedExcerpt,
      keywords: input.seo?.keywords || [],
      canonicalUrl: input.seo?.canonicalUrl || buildAbsoluteUrl(getSiteBaseUrl(site), `/news/${finalSlug}`)
    },
    internalLinks: []
  });

  if (article.status === "published") {
    const links = await buildInternalLinks(article.categoryId, article.tagIds, article._id);
    article.internalLinks = links;
    await article.save();
  }

  return article.toObject() as ArticleDocument;
}

export async function getPublishedArticleBySlug(slug: string): Promise<PopulatedArticle | null> {
  await connectToDatabase();

  const article = await ArticleModel.findOne({
    slug,
    status: "published"
  })
    .populate({ path: "authorId", select: "name slug bio avatarUrl email" })
    .populate({ path: "categoryId", select: "name slug description" })
    .populate({ path: "tagIds", select: "name slug" })
    .lean<PopulatedArticle>();

  if (!article) {
    return null;
  }

  return {
    ...article,
    featuredImage: normalizeFeaturedImage(article.featuredImage, article.title),
    publishedAt: toValidDate(article.publishedAt),
    updatedAt: toValidDate(article.updatedAt) || new Date()
  };
}

export async function listPublishedArticles(options: ListArticlesOptions = {}): Promise<ArticleCard[]> {
  await connectToDatabase();

  const page = Math.max(options.page || 1, 1);
  const limit = Math.min(Math.max(options.limit || 12, 1), 50);

  const articles = await ArticleModel.find({ status: "published" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean<ArticleDocument[]>();

  return articles.map(mapArticleToCard).filter(isRenderableCard);
}

export async function listPublishedArticlesByCategory(
  categorySlug: string,
  options: ListArticlesOptions = {}
): Promise<{ category: CategoryDocument | null; articles: ArticleCard[] }> {
  await connectToDatabase();

  const category = await CategoryModel.findOne({ slug: categorySlug }).lean<CategoryDocument>();
  if (!category) {
    return { category: null, articles: [] };
  }

  const articles = await ArticleModel.find({
    categoryId: category._id,
    status: "published"
  })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(Math.min(Math.max(options.limit || 20, 1), 50))
    .lean<ArticleDocument[]>();

  return {
    category,
    articles: articles.map(mapArticleToCard).filter(isRenderableCard)
  };
}

export async function getRelatedArticles(
  currentArticleId: Types.ObjectId | string,
  categoryId: Types.ObjectId | string,
  tagIds: Array<Types.ObjectId | string>,
  limit = 4
): Promise<ArticleCard[]> {
  await connectToDatabase();

  const related = await ArticleModel.find({
    status: "published",
    _id: { $ne: currentArticleId },
    $or: [{ categoryId }, { tagIds: { $in: tagIds } }]
  })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(Math.max(limit, 1))
    .lean<ArticleDocument[]>();

  return related.map(mapArticleToCard).filter(isRenderableCard);
}

export async function getPublishedArticleSlugs(): Promise<string[]> {
  await connectToDatabase();

  const docs = await ArticleModel.find({ status: "published" })
    .select({ slug: 1 })
    .lean<Array<Pick<ArticleDocument, "slug">>>();
  return docs.map((doc) => doc.slug);
}

export async function listAllPublishedArticlesForSitemap(): Promise<Array<Pick<ArticleDocument, "slug" | "updatedAt">>> {
  await connectToDatabase();

  return ArticleModel.find({ status: "published" })
    .select({ slug: 1, updatedAt: 1 })
    .lean<Array<Pick<ArticleDocument, "slug" | "updatedAt">>>();
}

export async function listAllCategoriesForSitemap(): Promise<Array<Pick<CategoryDocument, "slug" | "updatedAt">>> {
  await connectToDatabase();

  return CategoryModel.find({})
    .select({ slug: 1, updatedAt: 1 })
    .lean<Array<Pick<CategoryDocument, "slug" | "updatedAt">>>();
}

export async function getArticleBySlugAnyStatus(slug: string): Promise<ArticleDocument | null> {
  await connectToDatabase();

  return ArticleModel.findOne({ slug }).lean<ArticleDocument>();
}

export async function listPublishedArticlesForRss(limit = 50): Promise<ArticleFeedItem[]> {
  await connectToDatabase();

  const docs = await ArticleModel.find({ status: "published" })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 200))
    .populate({ path: "authorId", select: "name" })
    .populate({ path: "categoryId", select: "name slug" })
    .select({
      title: 1,
      slug: 1,
      excerpt: 1,
      featuredImage: 1,
      publishedAt: 1,
      updatedAt: 1
    })
    .lean<
      Array<
        Pick<ArticleDocument, "_id" | "title" | "slug" | "excerpt" | "featuredImage" | "publishedAt" | "updatedAt"> & {
          authorId?: Pick<AuthorDocument, "name">;
          categoryId?: Pick<CategoryDocument, "name" | "slug">;
        }
      >
    >();

  return docs.map((item) => ({
    _id: item._id.toString(),
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    publishedAt: toValidDate(item.publishedAt),
    updatedAt: toValidDate(item.updatedAt) || new Date(),
    featuredImage: normalizeFeaturedImage(item.featuredImage, item.title),
    author: item.authorId ? { name: item.authorId.name } : null,
    category: item.categoryId
      ? {
          name: item.categoryId.name,
          slug: item.categoryId.slug
        }
      : null
  }));
}

export async function listArticlesForAdmin(options: {
  status?: "all" | "draft" | "published" | "scheduled";
  limit?: number;
  page?: number;
  query?: string;
  categorySlug?: string;
} = {}): Promise<AdminArticleItem[]> {
  await connectToDatabase();

  const page = Math.max(options.page || 1, 1);
  const limit = Math.min(Math.max(options.limit || 30, 1), 100);
  const searchQuery = options.query?.trim();
  let categoryId: Types.ObjectId | undefined;

  if (options.categorySlug && options.categorySlug !== "all") {
    const category = await CategoryModel.findOne({ slug: options.categorySlug })
      .select({ _id: 1 })
      .lean<Pick<CategoryDocument, "_id">>();

    if (!category) {
      return [];
    }

    categoryId = category._id;
  }

  const query: Record<string, unknown> = {};
  if (options.status && options.status !== "all") {
    query.status = options.status;
  }

  if (categoryId) {
    query.categoryId = categoryId;
  }

  if (searchQuery) {
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ title: regex }, { excerpt: regex }, { slug: regex }];
  }

  const docs = await ArticleModel.find(query)
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate({ path: "authorId", select: "name" })
    .populate({ path: "categoryId", select: "name slug" })
    .select({ title: 1, slug: 1, status: 1, updatedAt: 1, publishedAt: 1, excerpt: 1, featuredImage: 1 })
    .lean<
      Array<
        Pick<
          ArticleDocument,
          "_id" | "title" | "slug" | "status" | "updatedAt" | "publishedAt" | "excerpt" | "featuredImage"
        > & {
          authorId?: Pick<AuthorDocument, "name">;
          categoryId?: Pick<CategoryDocument, "name" | "slug">;
        }
      >
    >();

  return docs.map((item) => ({
    _id: item._id.toString(),
    title: item.title,
    slug: item.slug,
    status: item.status,
    updatedAt: toIsoString(item.updatedAt) || new Date().toISOString(),
    publishedAt: toIsoString(item.publishedAt),
    category: item.categoryId?.name || "Uncategorized",
    categorySlug: item.categoryId?.slug || "general",
    author: item.authorId?.name || "Editorial Team",
    thumbnailUrl: normalizeFeaturedImage(item.featuredImage, item.title).thumbnailUrl,
    excerpt: item.excerpt || ""
  }));
}

export async function getAdminNewsStats(): Promise<{
  total: number;
  draft: number;
  published: number;
  scheduled: number;
}> {
  await connectToDatabase();

  const [total, draft, published, scheduled] = await Promise.all([
    ArticleModel.countDocuments({}),
    ArticleModel.countDocuments({ status: "draft" }),
    ArticleModel.countDocuments({ status: "published" }),
    ArticleModel.countDocuments({ status: "scheduled" })
  ]);

  return { total, draft, published, scheduled };
}

export async function deleteArticleById(id: string): Promise<boolean> {
  await connectToDatabase();

  if (!Types.ObjectId.isValid(id)) {
    return false;
  }

  const result = await ArticleModel.deleteOne({ _id: new Types.ObjectId(id) });
  return result.deletedCount === 1;
}
