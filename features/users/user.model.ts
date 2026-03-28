import { Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "editor"],
      default: "editor"
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date }
  },
  {
    timestamps: true,
    collection: "users"
  }
);

const existingUserModel = models.User as { schema?: { path: (name: string) => unknown } } | undefined;
if (existingUserModel?.schema?.path("tenantId")) {
  delete models.User;
}

export const UserModel = models.User || model("User", userSchema);
