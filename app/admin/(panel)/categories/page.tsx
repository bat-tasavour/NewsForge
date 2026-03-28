import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { ensureDefaultCategory, listCategoriesForAdmin } from "@/features/categories/category.service";
import { requireServerSession } from "@/lib/auth/server";

export default async function AdminCategoriesPage() {
  await requireServerSession(["admin", "editor"]);
  await ensureDefaultCategory();
  const categories = await listCategoriesForAdmin();

  return (
    <div className="admin-stack">
      <section className="admin-panel-card">
        <h1>Categories</h1>
        <p>Manage taxonomy used across articles and section pages.</p>
      </section>
      <CategoriesManager initialCategories={categories} />
    </div>
  );
}
