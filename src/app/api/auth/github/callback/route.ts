import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sealSession, setSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const store = await cookies();
  const savedState = store.get("xiyu_oauth_state")?.value;
  store.set("xiyu_oauth_state", "", { path: "/", maxAge: 0 });
  const base = process.env.APP_URL || url.origin;

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/login?error=oauth_state", base));
  }

  try {
    const exchange = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      }),
      cache: "no-store"
    });
    const tokenData = await exchange.json();
    if (!exchange.ok || !tokenData.access_token) throw new Error(tokenData.error_description || "Gagal mendapatkan token GitHub.");

    const userResponse = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      cache: "no-store"
    });
    if (!userResponse.ok) throw new Error("Tidak bisa membaca profil GitHub.");
    const user = await userResponse.json();
    const session = sealSession({ token: tokenData.access_token, login: user.login, avatar: user.avatar_url });
    await setSession(session);
    return NextResponse.redirect(new URL("/dashboard", base));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login gagal.";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message.slice(0, 120))}`, base));
  }
}
