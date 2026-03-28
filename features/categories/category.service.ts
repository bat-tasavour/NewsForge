import { connectToDatabase } from "@/lib/db/mongodb";
import { toSlug } from "@/lib/utils/slug";

import { ArticleModel } from "@/features/news/news.model";

import { CategoryModel } from "./category.model";
import type { CategoryDocument } from "./category.types";

export type CategoryAdminItem = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  updatedAt: string;
};

export async function getCategoryBySlug(slug: string): Promise<CategoryDocument | null> {
  await connectToDatabase();
  return CategoryModel.findOne({ slug }).lean<CategoryDocument>();
}

export async function listCategories(): Promise<CategoryDocument[]> {
  await connectToDatabase();
  return CategoryModel.find({}).sort({ name: 1 }).lean<CategoryDocument[]>();
}

export async function countCategories(): Promise<number> {
  await connectToDatabase();
  return CategoryModel.countDocuments({});
}

export async function listCategoriesForAdmin(): Promise<CategoryAdminItem[]> {
  await connectToDatabase();

  const [categories, counts] = await Promise.all([
    CategoryModel.find({}).sort({ name: 1 }).lean<CategoryDocument[]>(),
    ArticleModel.aggregate<{ _id: string; count: number }>([
      {
        $group: {
          _id: "$categoryId",
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const countMap = new Map<string, number>();
  for (const item of counts) {
    countMap.set(String(item._id), item.count);
  }

  return categories.map((category) => ({
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description,
    postCount: countMap.get(category._id.toString()) || 0,
    updatedAt: category.updatedAt.toISOString()
  }));
}

export async function createCategory(input: {
  name: string;
  slug?: string;
  description?: string;
}): Promise<CategoryDocument> {
  await connectToDatabase();

  const name = input.name.trim();
  if (!name) {
    throw new Error("Category name is required");
  }

  const baseSlug = toSlug(input.slug?.trim() || name) || "category";
  let slug = baseSlug;
  let index = 1;

  while (await CategoryModel.exists({ slug })) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }

  const created = await CategoryModel.create({
    name,
    slug,
    description: input.description?.trim() || undefined
  });

  return created.toObject() as CategoryDocument;
}

export async function ensureDefaultCategory(): Promise<CategoryDocument> {
  await connectToDatabase();

  const category = await CategoryModel.findOne({ slug: "general" }).lean<CategoryDocument>();
  if (category) {
    return category;
  }

  const created = await CategoryModel.create({
    name: "General",
    slug: "general",
    description: "General coverage"
  });

  return created.toObject() as CategoryDocument;
}
