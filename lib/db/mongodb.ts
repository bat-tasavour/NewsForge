import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
  var mongooseConn:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cached =
  global.mongooseConn ||
  (global.mongooseConn = {
    conn: null,
    promise: null
  });

let tenantCleanupPromise: Promise<void> | null = null;

async function dropTenantIndexes(): Promise<void> {
  if (!cached.conn) {
    return;
  }

  const db = cached.conn.connection.db;
  if (!db) {
    return;
  }
  const collections = ["articles", "categories", "tags"];

  for (const name of collections) {
    try {
      const collection = db.collection(name);
      const indexes = await collection.indexes();

      for (const index of indexes) {
        const hasTenantKey = Object.keys(index.key || {}).some((key) => key === "tenantId");
        if (hasTenantKey && index.name && index.name !== "_id_") {
          await collection.dropIndex(index.name);
        }
      }
    } catch {
      // Ignore index cleanup issues to avoid blocking requests.
    }
  }
}

async function ensureSingleSiteIndexes(): Promise<void> {
  if (!cached.conn) {
    return;
  }

  const db = cached.conn.connection.db;
  if (!db) {
    return;
  }

  try {
    await db.collection("articles").createIndex({ slug: 1 }, { unique: true, background: true });
    await db.collection("articles").createIndex({ status: 1, publishedAt: -1 }, { background: true });
    await db.collection("articles").createIndex({ categoryId: 1, status: 1, publishedAt: -1 }, { background: true });
  } catch {
    // Ignore index ensure errors.
  }

  try {
    await db.collection("categories").createIndex({ slug: 1 }, { unique: true, background: true });
  } catch {
    // Ignore index ensure errors.
  }

  try {
    await db.collection("tags").createIndex({ slug: 1 }, { unique: true, background: true });
  } catch {
    // Ignore index ensure errors.
  }
}

async function runSingleSiteMigrations(): Promise<void> {
  await dropTenantIndexes();
  await ensureSingleSiteIndexes();
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in environment variables");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB || "newsforge"
    });
  }

  cached.conn = await cached.promise;

  if (!tenantCleanupPromise) {
    tenantCleanupPromise = runSingleSiteMigrations().catch(() => undefined);
  }

  await tenantCleanupPromise;
  return cached.conn;
}
