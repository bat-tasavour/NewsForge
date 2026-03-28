import { connectToDatabase } from "@/lib/db/mongodb";

import { TagModel } from "./tag.model";
import type { TagDocument } from "./tag.types";

export async function listTags(): Promise<TagDocument[]> {
  await connectToDatabase();
  return TagModel.find({}).sort({ name: 1 }).lean<TagDocument[]>();
}

export async function ensureDefaultTag(): Promise<TagDocument> {
  await connectToDatabase();

  const tag = await TagModel.findOne({ slug: "breaking" }).lean<TagDocument>();
  if (tag) {
    return tag;
  }

  const created = await TagModel.create({
    name: "Breaking",
    slug: "breaking"
  });

  return created.toObject() as TagDocument;
}
