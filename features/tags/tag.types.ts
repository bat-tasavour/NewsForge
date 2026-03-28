import type { Types } from "mongoose";

export type TagDocument = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};
