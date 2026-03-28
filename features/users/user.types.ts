import type { Types } from "mongoose";

export type UserRole = "admin" | "editor";

export type UserDocument = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AdminUserListItem = SafeUser & {
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
};
