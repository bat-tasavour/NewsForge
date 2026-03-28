"use client";

import { DragEvent, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type MediaItem = {
  url: string;
  alt: string;
  createdAt: string;
};

type MediaLibraryProps = {
  initialItems: MediaItem[];
};

export function MediaLibrary({ initialItems }: MediaLibraryProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState(initialItems);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(files: FileList | File[]) {
    if (!files.length) {
      return;
    }

    setUploading(true);
    setError(null);

    const created: MediaItem[] = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("articleTitle", file.name.replace(/\.[^.]+$/, ""));
        formData.set("context", "Media library upload");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });

        const payload = (await response.json()) as {
          data?: {
            optimized: { url: string };
            alt: string;
          };
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error || "Upload failed");
        }

        created.push({
          url: payload.data.optimized.url,
          alt: payload.data.alt,
          createdAt: new Date().toISOString()
        });
      }

      setItems((current) => [...created, ...current]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void uploadFiles(event.dataTransfer.files);
  }

  return (
    <div className="admin-stack">
      <div className="admin-panel-card">
        <div className="admin-panel-card__header">
          <h2>Media Library</h2>
          <button type="button" className="admin-btn" onClick={() => inputRef.current?.click()}>
            Upload Media
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files) {
              void uploadFiles(event.target.files);
            }
          }}
        />

        <div
          className="admin-dropzone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <p>Drag & drop images here</p>
          <small>or click to browse files</small>
        </div>

        {uploading ? <p className="admin-inline-note">Uploading and optimizing images...</p> : null}
        {error ? <p className="admin-error">{error}</p> : null}
      </div>

      <div className="admin-media-grid">
        {items.map((item) => (
          <article key={`${item.url}-${item.createdAt}`} className="admin-media-card">
            <Image src={item.url} alt={item.alt} width={640} height={640} sizes="(max-width: 767px) 100vw, 20vw" />
            <div className="admin-media-card__meta">
              <p>{item.alt}</p>
              <small>{new Date(item.createdAt).toLocaleString("en-US")}</small>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
