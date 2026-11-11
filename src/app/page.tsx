import Link from "next/link";
import { ArrowUpRight, Github, FolderUp, ShieldCheck, Sparkles, GitBranch, Boxes } from "lucide-react";
export default function Home() {
  return <main className="landing">
    <nav className="topbar"><Link href="/" className="brand"><span className="brand-mark">✿</span> XIYU<span className="brand-muted">STUDIO</span></Link><Link className="nav-login" href="/login">Masuk <ArrowUpRight size={15}/></Link></nav>
    <section className="hero wrap">
      <div className="eyebrow"><span className="pulse-dot"/> GITHUB WORKSPACE · VERSI 2.0</div>
      <h1>Proyekmu punya<br/><em>tempat untuk tumbuh.</em></h1>
      <p className="hero-copy">Kirim folder, ZIP, atau kumpulan file ke GitHub. Atur repository, tinjau isi proyek, lalu buat satu commit dengan alur yang jelas.</p>
      <div className="hero-actions"><Link className="btn-primary" href="/login"><Github size={18}/> Hubungkan GitHub <ArrowUpRight size={16}/></Link><Link className="btn-quiet" href="/dashboard">Lihat workspace <span>→</span></Link></div>
      <div className="hero-note"><ShieldCheck size={15}/> Token disimpan terenkripsi di cookie server · Tidak ada token di localStorage</div>
      <div className="hero-card">
        <div className="mock-head"><span/><span/><span/><label>XIYU / project-upload</label><b>PREVIEW</b></div>
        <div className="mock-body"><div className="mock-side"><div className="mock-logo">✿</div><span className="side-active">Overview</span><span>Files</span><span>Commits</span><span>Settings</span></div><div className="mock-main"><div className="mock-kicker">YOUR NEXT COMMIT</div><h3>Semua file, satu tujuan.</h3><p>Periksa struktur sebelum dikirim ke repository.</p><div className="mock-file"><FolderUp size={19}/><div><b>aplikasi-kamu.zip</b><small>ZIP archive · siap diproses</small></div><span>READY</span></div><div className="mock-progress"><i/></div><div className="mock-bottom"><span>Preview file</span><span>Commit terkontrol ↗</span></div></div></div>
      </div>
    </section>
    <section className="features wrap"><div><FolderUp/><b>Impor fleksibel</b><p>ZIP, folder, banyak file, atau file teks manual.</p></div><div><GitBranch/><b>Commit terstruktur</b><p>Seluruh file masuk dalam satu commit Git.</p></div><div><ShieldCheck/><b>Kontrol keamanan</b><p>Validasi path, ukuran, dan sesi sebelum push.</p></div><div><Boxes/><b>Workspace rapi</b><p>Kelola repository dan tinjau isi proyek.</p></div></section>
    <footer className="footer wrap"><span>XIYU STUDIO · MADE FOR BUILDERS</span><span>Pelan-pelan, asal terus membangun. ✿</span></footer>
  </main>;
}
