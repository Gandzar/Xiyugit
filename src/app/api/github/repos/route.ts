import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { gh } from "@/lib/github";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sesi berakhir. Silakan login kembali." }, { status: 401 });
  try {
    const url = new URL(request.url);
    const page = Math.min(10, Math.max(1, Number(url.searchParams.get("page") || 1)));
    const repos = await gh<any[]>(session.token, `/user/repos?sort=updated&per_page=100&page=${page}&affiliation=owner,collaborator`);
    return NextResponse.json(repos.map(r => ({
      id: r.id, name: r.name, full_name: r.full_name, private: r.private,
      default_branch: r.default_branch, description: r.description, updated_at: r.updated_at,
      permissions: r.permissions
    })));
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal memuat repository." }, { status: 502 }); }
}
