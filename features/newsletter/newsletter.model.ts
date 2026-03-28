import { Schema, model, models } from "mongoose";

const newsletterSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    source: { type: String, default: "site-footer", trim: true },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    collection: "newsletters"
  }
);

newsletterSchema.index({ email: 1 }, { unique: true });
newsletterSchema.index({ createdAt: -1 });

export const NewsletterModel = models.Newsletter || model("Newsletter", newsletterSchema);
