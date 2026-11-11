import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { gh } from "@/lib/github";
import { assertSameOrigin, safeBranch, safePath } from "@/lib/validation";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Silakan login kembali." }, { status: 401 });
  try {
    assertSameOrigin(request);
    const body = await request.json();
    const owner = String(body.owner || "");
    const repo = String(body.repo || "");
    const branch = safeBranch(body.branch || "main");
    const message = String(body.message || "Upload project with XIYU Studio").trim().slice(0, 250);
    const files = body.files as Array<{ path: string; sha: string }>;
    if (!/^[A-Za-z0-9-]+$/.test(owner) || !/^[A-Za-z0-9._-]+$/.test(repo)) throw new Error("Tujuan repository tidak valid.");
    if (!Array.isArray(files) || files.length < 1 || files.length > 1500) throw new Error("Daftar file tidak valid.");
    const seen = new Set<string>();
    const tree = files.map(item => {
      const path = safePath(item.path);
      if (seen.has(path)) throw new Error(`Path duplikat: ${path}`);
      seen.add(path);
      if (!/^[a-f0-9]{40}$/i.test(item.sha)) throw new Error("SHA file tidak valid.");
      return { path, mode: "100644", type: "blob", sha: item.sha };
    });

    let parentSha: string | undefined;
    let baseTree: string | undefined;
    let refExists = true;
    try {
      const ref = await gh<any>(session.token, `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch).replaceAll("%2F", "/")}`);
      parentSha = ref.object.sha;
      const parent = await gh<any>(session.token, `/repos/${owner}/${repo}/git/commits/${parentSha}`);
      baseTree = parent.tree.sha;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (!msg.toLowerCase().includes("not found")) throw e;
      refExists = false;
    }

    const newTree = await gh<any>(session.token, `/repos/${owner}/${repo}/git/trees`, {
      method: "POST", body: JSON.stringify({ ...(baseTree ? { base_tree: baseTree } : {}), tree })
    });
    const commit = await gh<any>(session.token, `/repos/${owner}/${repo}/git/commits`, {
      method: "POST", body: JSON.stringify({ message, tree: newTree.sha, ...(parentSha ? { parents: [parentSha] } : []) })
    });

    if (refExists) {
      await gh(session.token, `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch).replaceAll("%2F", "/")}`, {
        method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false })
      });
    } else {
      await gh(session.token, `/repos/${owner}/${repo}/git/refs`, {
        method: "POST", body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha })
      });
    }
    return NextResponse.json({ ok: true, commit: commit.sha, url: commit.html_url, branch, files: files.length });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Commit gagal." }, { status: 400 }); }
}
