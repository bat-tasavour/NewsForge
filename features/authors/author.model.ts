import { Schema, model, models } from "mongoose";

const authorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    email: { type: String, trim: true, lowercase: true },
    bio: { type: String },
    avatarUrl: { type: String }
  },
  {
    timestamps: true,
    collection: "authors"
  }
);

authorSchema.index({ email: 1 }, { unique: true, sparse: true });

const existingAuthorModel = models.Author as { schema?: { path: (name: string) => unknown } } | undefined;
if (existingAuthorModel?.schema?.path("tenantId")) {
  delete models.Author;
}

export const AuthorModel = models.Author || model("Author", authorSchema);
