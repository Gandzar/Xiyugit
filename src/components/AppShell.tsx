"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Github, LayoutDashboard, FolderUp, LogOut, Sparkles, ArrowUpRight, CircleHelp } from "lucide-react";
import Uploader from "./Uploader";

type User = { authenticated: boolean; login?: string; avatar?: string };
export default function AppShell({ active }: { active: "dashboard" | "upload" }) {
  const [user,setUser] = useState<User | null>(null);
  const [busy,setBusy] = useState(false);
  const router = useRouter();
  useEffect(() => { fetch("/api/auth/session").then(r=>r.json()).then((d:User)=>{setUser(d); if(!d.authenticated) router.replace("/login");}).catch(()=>router.replace("/login")); },[router]);
  async function logout() { setBusy(true); await fetch("/api/auth/logout",{method:"POST"}); router.replace("/"); }
  if (!user?.authenticated) return <div className="loading-screen"><span className="brand-mark">✿</span><p>Menyiapkan ruang kerjamu…</p></div>;
  return <div className="workspace">
    <aside className="sidebar"><Link href="/" className="brand"><span className="brand-mark">✿</span> XIYU<span className="brand-muted">STUDIO</span></Link><div className="side-label">WORKSPACE</div><Link className={active==="dashboard"?"side-link selected":"side-link"} href="/dashboard"><LayoutDashboard size={17}/> Ringkasan</Link><Link className={active==="upload"?"side-link selected":"side-link"} href="/upload"><FolderUp size={17}/> Upload proyek</Link><div className="sidebar-bottom"><div className="help-card"><Sparkles size={17}/><b>Keep creating.</b><p>Setiap proyek besar dimulai dari satu file.</p><a href="https://docs.github.com/" target="_blank" rel="noreferrer">Panduan GitHub <ArrowUpRight size={13}/></a></div><div className="profile-row"><img src={user.avatar} alt="" /><div><b>@{user.login}</b><small>GitHub terhubung</small></div><button onClick={logout} disabled={busy} title="Keluar"><LogOut size={16}/></button></div></div></aside>
    <main className="workspace-main"><header className="mobile-head"><Link href="/" className="brand"><span className="brand-mark">✿</span> XIYU<span className="brand-muted">STUDIO</span></Link><button onClick={logout}><LogOut size={16}/></button></header>
      {active==="dashboard" ? <DashboardContent login={user.login || ""}/> : <Uploader login={user.login || ""}/>}
      <footer className="workspace-footer"><span>XIYU STUDIO · PRIVATE WORKSPACE</span><span><CircleHelp size={13}/> Butuh bantuan? Baca README proyek.</span></footer>
    </main>
  </div>;
}
function DashboardContent({login}:{login:string}) {
  const [repos,setRepos] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  useEffect(()=>{fetch("/api/github/repos").then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);setRepos(d);}).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
  return <div className="content-wrap"><div className="page-top"><div><div className="eyebrow">RUANG KERJAMU · OVERVIEW</div><h1>Halo, <em>{login}</em>.</h1><p>Siap mengirim sesuatu yang baru hari ini?</p></div><Link href="/upload" className="btn-primary"><FolderUp size={17}/> Upload proyek <ArrowUpRight size={15}/></Link></div>
    <div className="stat-grid"><div className="stat-card"><span>REPOSITORY DIMU</span><strong>{loading?"—":repos.length}</strong><small>Repository terbaru yang dapat diakses</small></div><div className="stat-card"><span>STATUS AKUN</span><strong className="status-good">Terhubung</strong><small>Autentikasi GitHub aktif</small></div><div className="stat-card"><span>UPLOAD BERIKUTNYA</span><strong>Siap ✿</strong><small>Belum ada file yang dikirim</small></div></div>
    <section className="panel"><div className="panel-heading"><div><div className="eyebrow">GITHUB REPOSITORIES</div><h2>Repository kamu</h2></div><a href="https://github.com/" target="_blank" rel="noreferrer" className="text-link">Buka GitHub ↗</a></div>
      {loading?<div className="empty-state">Sedang mengambil daftar repository…</div>:error?<div className="error-box">{error}</div>:repos.length===0?<div className="empty-state">Belum ada repository yang dapat ditampilkan. Mulai dengan mengunggah proyek pertamamu.</div>:<div className="repo-list">{repos.slice(0,12).map(r=><div className="repo-row" key={r.id}><div className="repo-icon"><Github size={18}/></div><div className="repo-info"><b>{r.name}</b><small>{r.description||"Tidak ada deskripsi"}</small></div><span className={r.private?"badge-private":"badge-public"}>{r.private?"Private":"Public"}</span><span className="repo-branch">{r.default_branch||"—"}</span><a href={`https://github.com/${r.full_name}`} target="_blank" rel="noreferrer" aria-label="Buka repository">↗</a></div>)}</div>}
    </section><div className="tip-banner"><Sparkles size={19}/><div><b>Idemu layak punya rumah.</b><p>Gunakan preview sebelum push supaya struktur proyek tetap rapi.</p></div><Link href="/upload">Mulai upload →</Link></div>
  </div>;
}
