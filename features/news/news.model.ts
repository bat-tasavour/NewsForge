import { Schema, model, models } from "mongoose";

const articleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    excerpt: { type: String, required: true, trim: true },
    content: {
      json: { type: Schema.Types.Mixed, required: true },
      html: { type: String, required: true }
    },
    featuredImage: {
      originalUrl: { type: String, required: true },
      optimizedUrl: { type: String, required: true },
      thumbnailUrl: { type: String, required: true },
      responsive: [
        {
          url: { type: String, required: true },
          width: { type: Number, required: true },
          height: { type: Number, required: true }
        }
      ],
      alt: { type: String, required: true },
      width: { type: Number },
      height: { type: Number }
    },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    tagIds: [{ type: Schema.Types.ObjectId, ref: "Tag", required: true }],
    authorId: { type: Schema.Types.ObjectId, ref: "Author", required: true },
    status: {
      type: String,
      enum: ["draft", "published", "scheduled"],
      default: "draft"
    },
    publishedAt: { type: Date },
    scheduledFor: { type: Date },
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      keywords: { type: [String], default: [] },
      canonicalUrl: { type: String }
    },
    internalLinks: [
      {
        title: { type: String, required: true },
        slug: { type: String, required: true },
        url: { type: String, required: true }
      }
    ]
  },
  {
    timestamps: true,
    collection: "articles"
  }
);

articleSchema.index({ slug: 1 }, { unique: true });
articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ categoryId: 1, status: 1, publishedAt: -1 });
articleSchema.index({ title: "text", excerpt: "text", "content.html": "text" });

const existingArticleModel = models.Article as { schema?: { path: (name: string) => unknown } } | undefined;
if (existingArticleModel?.schema?.path("tenantId")) {
  delete models.Article;
}

export const ArticleModel = models.Article || model("Article", articleSchema);
