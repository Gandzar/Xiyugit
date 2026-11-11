import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "xiyu_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

type SessionData = { token: string; login: string; avatar: string; exp: number };

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET harus minimal 32 karakter.");
  // Derive a fixed 256-bit key from the configured secret.
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  return createHash("sha256").update(secret).digest();
}

export function sealSession(data: Omit<SessionData, "exp">) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const payload = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + SESSION_SECONDS * 1000 }));
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function openSession(value?: string | null): SessionData | null {
  if (!value) return null;
  try {
    const raw = Buffer.from(value, "base64url");
    if (raw.length < 29) return null;
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const parsed = JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString()) as SessionData;
    if (!parsed.token || !parsed.login || parsed.exp < Date.now()) return null;
    return parsed;
  } catch { return null; }
}

export async function getSession() {
  const store = await cookies();
  return openSession(store.get(SESSION_COOKIE)?.value);
}

export async function setSession(value: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, value, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: SESSION_SECONDS
  });
}

export async function clearSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}
