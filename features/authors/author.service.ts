import { connectToDatabase } from "@/lib/db/mongodb";
import { toSlug } from "@/lib/utils/slug";

import { AuthorModel } from "./author.model";
import type { AuthorDocument } from "./author.types";

export async function listAuthors(): Promise<AuthorDocument[]> {
  await connectToDatabase();
  return AuthorModel.find({}).sort({ name: 1 }).lean<AuthorDocument[]>();
}

export async function getOrCreateAuthorByIdentity(input: { name: string; email?: string }): Promise<AuthorDocument> {
  await connectToDatabase();

  if (input.email) {
    const byEmail = await AuthorModel.findOne({ email: input.email }).lean<AuthorDocument>();
    if (byEmail) {
      return byEmail;
    }
  }

  const baseSlug = toSlug(input.name) || "staff-writer";
  let slug = baseSlug;
  let index = 1;

  while (await AuthorModel.exists({ slug })) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }

  const created = await AuthorModel.create({
    name: input.name,
    slug,
    email: input.email,
    bio: "Staff writer"
  });

  return created.toObject() as AuthorDocument;
}
