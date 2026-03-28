import type { Types } from "mongoose";

export type CategoryDocument = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};
