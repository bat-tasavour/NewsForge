import { readdir, stat } from "fs/promises";
import path from "path";

import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { requireServerSession } from "@/lib/auth/server";

type MediaItem = {
  url: string;
  alt: string;
  createdAt: string;
};

function isImage(filename: string): boolean {
  return /\.(webp|png|jpe?g|gif|avif)$/i.test(filename);
}

async function scanMedia(dir: string): Promise<MediaItem[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const items: MediaItem[] = [];

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const nested = await scanMedia(entryPath);
        items.push(...nested);
      } else if (entry.isFile() && isImage(entry.name)) {
        const relative = entryPath.replace(path.join(process.cwd(), "public"), "");
        const fileStat = await stat(entryPath);
        const alt = entry.name
          .replace(/\.[^.]+$/, "")
          .replace(/[-_]+/g, " ")
          .trim();

        items.push({
          url: relative.startsWith("/") ? relative : `/${relative}`,
          alt: alt || "Media item",
          createdAt: fileStat.mtime.toISOString()
        });
      }
    }

    return items;
  } catch {
    return [];
  }
}

export default async function AdminMediaPage() {
  await requireServerSession(["admin", "editor"]);
  const uploadRoot = path.join(process.cwd(), "public", "uploads");
  const media = (await scanMedia(uploadRoot)).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="admin-stack">
      <section className="admin-panel-card">
        <h1>Media</h1>
        <p>Upload optimized assets and manage thumbnails in one place.</p>
      </section>
      <MediaLibrary initialItems={media.slice(0, 80)} />
    </div>
  );
}
