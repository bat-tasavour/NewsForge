import type { Types } from "mongoose";

export type NewsletterDocument = {
  _id: Types.ObjectId;
  email: string;
  source: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
