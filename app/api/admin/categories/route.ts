import { NextRequest, NextResponse } from "next/server";

import { createCategory, listCategoriesForAdmin } from "@/features/categories/category.service";
import { requireApiSession } from "@/lib/auth/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = requireApiSession(request, ["admin", "editor"]);
    if (!auth.ok) {
      return auth.response;
    }

    const categories = await listCategoriesForAdmin();
    return NextResponse.json({ data: categories });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load categories"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireApiSession(request, ["admin", "editor"]);
    if (!auth.ok) {
      return auth.response;
    }

    const payload = (await request.json()) as {
      name?: string;
      slug?: string;
      description?: string;
    };

    if (!payload.name?.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const category = await createCategory({
      name: payload.name,
      slug: payload.slug,
      description: payload.description
    });

    return NextResponse.json(
      {
        data: {
          id: category._id.toString(),
          name: category.name,
          slug: category.slug,
          description: category.description
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create category"
      },
      { status: 400 }
    );
  }
}
