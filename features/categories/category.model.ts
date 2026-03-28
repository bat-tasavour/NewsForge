import { Schema, model, models } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    description: { type: String }
  },
  {
    timestamps: true,
    collection: "categories"
  }
);

const existingCategoryModel = models.Category as { schema?: { path: (name: string) => unknown } } | undefined;
if (existingCategoryModel?.schema?.path("tenantId")) {
  delete models.Category;
}

export const CategoryModel = models.Category || model("Category", categorySchema);
