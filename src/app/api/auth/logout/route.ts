import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Tidak diizinkan." }, { status: 403 }); }
  await clearSession();
  return NextResponse.json({ ok: true });
}
