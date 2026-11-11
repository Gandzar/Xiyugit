import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(new URL("/login?error=oauth_config", process.env.APP_URL || "http://localhost:3000"));
  const state = randomBytes(24).toString("hex");
  const store = await cookies();
  store.set("xiyu_oauth_state", state, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 600
  });
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${process.env.APP_URL}/api/auth/github/callback`);
  url.searchParams.set("scope", "repo read:user user:email");
  url.searchParams.set("state", state);
  return NextResponse.redirect(url);
}
