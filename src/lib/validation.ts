export function safeRepoName(value: unknown): string {
  const name = String(value ?? "").trim();
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(name) || name === "." || name === "..") {
    throw new Error("Nama repository hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung.");
  }
  return name;
}

export function safeBranch(value: unknown): string {
  const branch = String(value ?? "").trim();
  if (!branch || branch.length > 200 || branch.startsWith("-") || branch.includes("..") ||
      branch.includes("@{") || /[\s~^:?*\\[\]]/.test(branch) || branch.endsWith("/") || branch.endsWith(".") ||
      branch.split("/").some(part => !part || part.startsWith(".") || part.endsWith(".lock"))) {
    throw new Error("Nama branch tidak valid.");
  }
  return branch;
}

export function safePath(value: unknown): string {
  const path = String(value ?? "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!path || path.length > 500 || path.split("/").some(p => !p || p === "." || p === "..") ||
      path.includes("\0") || path.startsWith(".git/") || path === ".git") {
    throw new Error(`Path file tidak aman: ${path.slice(0, 80)}`);
  }
  return path;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!origin || !host) throw new Error("Permintaan tidak memiliki Origin yang valid.");
  const originHost = new URL(origin).host;
  if (originHost !== host) throw new Error("Origin tidak cocok.");
}
