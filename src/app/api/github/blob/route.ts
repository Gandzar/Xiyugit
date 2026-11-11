import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { gh } from "@/lib/github";
import { assertSameOrigin, safePath } from "@/lib/validation";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
  try {
    assertSameOrigin(request);
    const body = await request.json();
    const owner = String(body.owner || "");
    const repo = String(body.repo || "");
    const content = String(body.content || "");
    const path = safePath(body.path);
    if (!/^[A-Za-z0-9-]+$/.test(owner) || !/^[A-Za-z0-9._-]+$/.test(repo)) throw new Error("Tujuan repository tidak valid.");
    if (!content || content.length > 3_900_000) throw new Error("Ukuran file melebihi batas aman per file.");
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(content)) throw new Error("Data file bukan base64 yang valid.");
    const result = await gh<{ sha: string }>(session.token, `/repos/${owner}/${repo}/git/blobs`, {
      method: "POST", body: JSON.stringify({ content, encoding: "base64" })
    });
    return NextResponse.json({ path, sha: result.sha });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal mengirim file." }, { status: 400 }); }
}
