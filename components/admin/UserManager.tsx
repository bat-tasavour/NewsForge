"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { AdminUserListItem, UserRole } from "@/features/users/user.types";

type UserManagerProps = {
  initialUsers: AdminUserListItem[];
};

type CreatedUserPayload = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export function UserManager({ initialUsers }: UserManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("editor");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter((user) => {
      const roleMatched = roleFilter === "all" || user.role === roleFilter;
      if (!keyword) {
        return roleMatched;
      }

      const keywordMatched =
        user.name.toLowerCase().includes(keyword) || user.email.toLowerCase().includes(keyword);
      return roleMatched && keywordMatched;
    });
  }, [roleFilter, search, users]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role
        })
      });

      const payload = (await response.json()) as {
        data?: CreatedUserPayload;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to create user");
      }

      const createdUser: AdminUserListItem = {
        id: payload.data.id,
        name: payload.data.name,
        email: payload.data.email,
        role: payload.data.role,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: undefined
      };

      setUsers((current) => [createdUser, ...current]);
      setName("");
      setEmail("");
      setPassword("");
      setRole("editor");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-stack">
      <form className="admin-form" onSubmit={onSubmit}>
        <h2>Create User</h2>

        <div className="admin-grid-2">
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>

          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
        </div>

        <div className="admin-grid-2">
          <label>
            Password
            <input
              type="password"
              value={password}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <label>
            Role
            <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>

        {error ? <p className="admin-error">{error}</p> : null}

        <button className="admin-btn" type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create User"}
        </button>
      </form>

      <div className="admin-table-wrap">
        <div className="admin-toolbar">
          <label>
            Search
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users"
            />
          </label>
          <label>
            Role
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "all" | UserRole)}>
              <option value="all">All</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
            </select>
          </label>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Last Login</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td data-label="Name">{user.name}</td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Role">{user.role}</td>
                <td data-label="Last Login">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("en-US") : "Never"}</td>
                <td data-label="Created">{new Date(user.createdAt).toLocaleString("en-US")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
