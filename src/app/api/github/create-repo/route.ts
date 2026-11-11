import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { gh } from "@/lib/github";
import { assertSameOrigin, safeRepoName } from "@/lib/validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
  try {
    assertSameOrigin(request);
    const body = await request.json();
    const name = safeRepoName(body.name);
    const repo = await gh<any>(session.token, "/user/repos", {
      method: "POST",
      body: JSON.stringify({
        name, description: String(body.description || "").slice(0, 350),
        private: body.visibility !== "public", auto_init: false
      })
    });
    return NextResponse.json({ id: repo.id, name: repo.name, full_name: repo.full_name, private: repo.private, default_branch: repo.default_branch });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal membuat repository." }, { status: 400 }); }
}
