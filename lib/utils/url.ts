export function normalizeHost(host: string): string {
  const trimmed = host.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return "localhost:3000";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).host.toLowerCase();
    } catch {
      return trimmed.replace(/^https?:\/\//i, "").toLowerCase();
    }
  }

  return trimmed.toLowerCase();
}

export function buildAbsoluteUrl(baseUrl: string, path = "/"): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, baseUrl).toString();
}
