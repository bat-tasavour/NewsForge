import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import sharp from "sharp";

import { generateAltText } from "@/lib/ai/contentAssistant";
import { getSiteConfig } from "@/lib/site/config";
import { toSlug } from "@/lib/utils/slug";

type ProcessImageInput = {
  file: File;
  folderName?: string;
  articleTitle: string;
  context?: string;
  imageCaption?: string;
};

export type ProcessedImageResult = {
  original: {
    url: string;
    width: number;
    height: number;
  };
  optimized: {
    url: string;
    width: number;
    height: number;
  };
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  responsive: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  alt: string;
};

const WEBP_QUALITY = 78;
const THUMBNAIL_WIDTH = 480;
const RESPONSIVE_WIDTHS = [480, 768, 1200, 1600];

function getExtension(mimeType: string): string {
  if (mimeType.includes("png")) {
    return "png";
  }

  if (mimeType.includes("webp")) {
    return "webp";
  }

  return "jpg";
}

function toPublicPath(absPath: string): string {
  return absPath.split("/public")[1] || absPath;
}

export async function processArticleImage({
  file,
  folderName,
  articleTitle,
  context,
  imageCaption
}: ProcessImageInput): Promise<ProcessedImageResult> {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(fileBuffer).rotate();

  const metadata = await image.metadata();
  const originalWidth = metadata.width ?? 1600;
  const originalHeight = metadata.height ?? 900;
  const aspectRatio = originalWidth / originalHeight;

  const now = new Date();
  const segment = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const baseName = randomUUID();
  const siteFolder = folderName || toSlug(getSiteConfig().name) || "site";

  const uploadDir = path.join(process.cwd(), "public", "uploads", siteFolder, segment);
  await mkdir(uploadDir, { recursive: true });

  const ext = getExtension(file.type);
  const originalPath = path.join(uploadDir, `${baseName}-original.${ext}`);
  const optimizedPath = path.join(uploadDir, `${baseName}-optimized.webp`);
  const thumbnailPath = path.join(uploadDir, `${baseName}-thumbnail.webp`);

  await writeFile(originalPath, fileBuffer);

  const optimizedWidth = Math.min(originalWidth, 1600);
  const optimizedHeight = Math.round(optimizedWidth / aspectRatio);
  const optimizedBuffer = await image
    .clone()
    .resize({ width: optimizedWidth, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();
  await writeFile(optimizedPath, optimizedBuffer);

  const thumbnailWidth = Math.min(originalWidth, THUMBNAIL_WIDTH);
  const thumbnailHeight = Math.round(thumbnailWidth / aspectRatio);
  const thumbnailBuffer = await image
    .clone()
    .resize({ width: thumbnailWidth, withoutEnlargement: true })
    .webp({ quality: 72, effort: 5 })
    .toBuffer();
  await writeFile(thumbnailPath, thumbnailBuffer);

  const responsive: ProcessedImageResult["responsive"] = [];

  const uniqueWidths = Array.from(new Set(RESPONSIVE_WIDTHS.filter((w) => w <= originalWidth).concat(optimizedWidth))).sort(
    (a, b) => a - b
  );

  for (const width of uniqueWidths) {
    const height = Math.round(width / aspectRatio);
    const variantPath = path.join(uploadDir, `${baseName}-${width}.webp`);

    const variantBuffer = await image
      .clone()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer();

    await writeFile(variantPath, variantBuffer);

    responsive.push({
      url: toPublicPath(variantPath),
      width,
      height
    });
  }

  const alt = await generateAltText({
    articleTitle,
    context,
    imageCaption
  });

  return {
    original: {
      url: toPublicPath(originalPath),
      width: originalWidth,
      height: originalHeight
    },
    optimized: {
      url: toPublicPath(optimizedPath),
      width: optimizedWidth,
      height: optimizedHeight
    },
    thumbnail: {
      url: toPublicPath(thumbnailPath),
      width: thumbnailWidth,
      height: thumbnailHeight
    },
    responsive,
    alt
  };
}
