import { UserManager } from "@/components/admin/UserManager";
import { listUsersForAdmin } from "@/features/users/user.service";
import { requireServerSession } from "@/lib/auth/server";

export default async function AdminUsersPage() {
  await requireServerSession(["admin"]);
  const users = await listUsersForAdmin();

  return (
    <div className="admin-stack">
      <section className="admin-panel-card">
        <h1>User Management</h1>
        <p>Create newsroom users and assign roles.</p>
        <UserManager initialUsers={users} />
      </section>
    </div>
  );
}
