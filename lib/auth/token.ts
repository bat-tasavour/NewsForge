import { createHmac } from "crypto";

import type { SessionPayload, SessionUser } from "./types";

const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): string {
  return process.env.AUTH_SECRET || "dev-only-change-this-secret";
}

function encode(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function decode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function createSessionToken(user: SessionUser, maxAge = ONE_WEEK_SECONDS): string {
  const now = Math.floor(Date.now() / 1000);

  const payload: SessionPayload = {
    ...user,
    iat: now,
    exp: now + maxAge
  };

  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = encode(JSON.stringify(payload));
  const signature = sign(`${header}.${body}`);

  return `${header}.${body}.${signature}`;
}

export function verifySessionToken(token?: string): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) {
    return null;
  }

  const expected = sign(`${header}.${body}`);
  if (expected !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(decode(body)) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
