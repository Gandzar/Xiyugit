import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET() {
  const session = await getSession();
  return NextResponse.json(session ? { authenticated: true, login: session.login, avatar: session.avatar } : { authenticated: false });
}
