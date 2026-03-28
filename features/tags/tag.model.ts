import { Schema, model, models } from "mongoose";

const tagSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true }
  },
  {
    timestamps: true,
    collection: "tags"
  }
);

const existingTagModel = models.Tag as { schema?: { path: (name: string) => unknown } } | undefined;
if (existingTagModel?.schema?.path("tenantId")) {
  delete models.Tag;
}

export const TagModel = models.Tag || model("Tag", tagSchema);
