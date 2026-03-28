import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { requireServerSession } from "@/lib/auth/server";
import { getSiteConfig } from "@/lib/site/config";

type AdminPanelLayoutProps = {
  children: ReactNode;
};

export default async function AdminPanelLayout({ children }: AdminPanelLayoutProps) {
  const session = await requireServerSession(["admin", "editor"]);
  const site = getSiteConfig();

  return (
    <AdminShell
      siteName={site.name}
      userName={session.name}
      userRole={session.role}
      showUsers={session.role === "admin"}
    >
      {children}
    </AdminShell>
  );
}
