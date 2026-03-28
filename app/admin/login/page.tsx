import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/LoginForm";
import { countUsers, ensureBootstrapAdmin } from "@/features/users/user.service";
import { getServerSession } from "@/lib/auth/session";
import { getSiteConfig } from "@/lib/site/config";

export default async function AdminLoginPage() {
  const isProduction = process.env.NODE_ENV === "production";
  let bootstrapUnavailable = false;
  let hasUsers = true;

  try {
    await ensureBootstrapAdmin();
    hasUsers = (await countUsers()) > 0;
  } catch {
    bootstrapUnavailable = true;
  }

  const session = await getServerSession();
  if (session) {
    redirect("/admin");
  }

  const site = getSiteConfig();

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <p className="template1-hero__eyebrow">Admin Panel</p>
        <h1>{site.organizationName}</h1>
        <p>Sign in as admin/editor to manage articles.</p>

        <LoginForm />

        {bootstrapUnavailable ? (
          <p className="admin-error">Database is unavailable right now. Retry once MongoDB is reachable.</p>
        ) : isProduction && !hasUsers ? (
          <p className="admin-login-help">
            No admin account exists yet. Create the first admin user in MongoDB, then sign in.
          </p>
        ) : isProduction ? (
          <p className="admin-login-help">Use your admin or editor credentials to sign in.</p>
        ) : (
          <p className="admin-login-help">
            First run default login: <strong>admin@newsforge.local</strong> / <strong>ChangeMe123!</strong>
          </p>
        )}
      </section>
    </main>
  );
}
