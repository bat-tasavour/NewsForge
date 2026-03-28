import { NextRequest, NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth/api";
import { processArticleImage } from "@/lib/image/imageProcessor";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = requireApiSession(request, ["admin", "editor"]);
    if (!auth.ok) {
      return auth.response;
    }

    const formData = await request.formData();

    const file = formData.get("file");
    const articleTitle = String(formData.get("articleTitle") || "Untitled article");
    const context = String(formData.get("context") || "");
    const imageCaption = String(formData.get("caption") || "");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const image = await processArticleImage({
      file,
      articleTitle,
      context,
      imageCaption
    });

    return NextResponse.json({ data: image }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Image upload failed"
      },
      { status: 500 }
    );
  }
}
