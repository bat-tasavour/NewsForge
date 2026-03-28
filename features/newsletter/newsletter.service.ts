import { connectToDatabase } from "@/lib/db/mongodb";

import { NewsletterModel } from "./newsletter.model";
import type { NewsletterDocument } from "./newsletter.types";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function subscribeToNewsletter(email: string, source = "site-footer"): Promise<NewsletterDocument> {
  await connectToDatabase();

  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error("Please enter a valid email address");
  }

  const existing = await NewsletterModel.findOne({ email: normalized }).lean<NewsletterDocument>();
  if (existing) {
    if (!existing.isActive) {
      const updated = await NewsletterModel.findOneAndUpdate(
        { _id: existing._id },
        { $set: { isActive: true, source } },
        { new: true }
      ).lean<NewsletterDocument>();

      if (updated) {
        return updated;
      }
    }

    return existing;
  }

  const created = await NewsletterModel.create({
    email: normalized,
    source,
    isActive: true
  });

  return created.toObject() as NewsletterDocument;
}
