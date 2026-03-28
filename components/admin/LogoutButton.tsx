"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function onLogout() {
    await fetch("/api/auth/logout", {
      method: "POST"
    });

    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button type="button" className="admin-btn admin-btn--ghost" onClick={onLogout}>
      Logout
    </button>
  );
}
