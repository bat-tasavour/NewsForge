import type { Types } from "mongoose";

export type AuthorDocument = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};
