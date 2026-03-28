import { connectToDatabase } from "@/lib/db/mongodb";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

import { UserModel } from "./user.model";
import type { AdminUserListItem, SafeUser, UserDocument, UserRole } from "./user.types";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toSafeUser(user: UserDocument): SafeUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export async function ensureBootstrapAdmin(): Promise<void> {
  await connectToDatabase();

  const count = await UserModel.countDocuments({});
  if (count > 0) {
    return;
  }

  if (process.env.NODE_ENV === "production") {
    return;
  }

  const email = normalizeEmail(process.env.ADMIN_EMAIL || "admin@newsforge.local");
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const name = process.env.ADMIN_NAME || "News Admin";

  await UserModel.create({
    name,
    email,
    passwordHash: hashPassword(password),
    role: "admin",
    isActive: true
  });
}

export async function findUserByEmail(email: string): Promise<UserDocument | null> {
  await connectToDatabase();
  return UserModel.findOne({ email: normalizeEmail(email), isActive: true }).lean<UserDocument>();
}

export async function validateUserCredentials(email: string, password: string): Promise<SafeUser | null> {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  const valid = verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  await UserModel.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  return toSafeUser(user);
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<SafeUser> {
  await connectToDatabase();

  const email = normalizeEmail(input.email);
  const exists = await UserModel.findOne({ email }).select({ _id: 1 }).lean();
  if (exists) {
    throw new Error("A user with this email already exists");
  }

  const created = await UserModel.create({
    name: input.name,
    email,
    passwordHash: hashPassword(input.password),
    role: input.role,
    isActive: true
  });

  return toSafeUser(created.toObject() as UserDocument);
}

export async function listUsersForAdmin(): Promise<AdminUserListItem[]> {
  await connectToDatabase();

  const users = await UserModel.find({})
    .sort({ createdAt: -1 })
    .lean<UserDocument[]>();

  return users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString()
  }));
}

export async function countUsers(): Promise<number> {
  await connectToDatabase();
  return UserModel.countDocuments({});
}
