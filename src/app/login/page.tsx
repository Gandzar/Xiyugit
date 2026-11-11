import Link from "next/link";
import { Github, ShieldCheck, ArrowLeft, Sparkles } from "lucide-react";
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const messages: Record<string,string> = {
    oauth_config: "Konfigurasi GitHub OAuth belum lengkap.",
    oauth_state: "Sesi verifikasi tidak cocok. Silakan mulai login lagi."
  };
  const error = params.error ? (messages[params.error] || params.error) : "";
  return <main className="auth-page"><Link href="/" className="brand auth-brand"><span className="brand-mark">✿</span> XIYU<span className="brand-muted">STUDIO</span></Link><section className="auth-card"><div className="auth-flower">✿</div><div className="eyebrow">RUANG KERJAMU DIMULAI DI SINI</div><h1>Selamat datang<br/><em>kembali.</em></h1><p>Hubungkan akun GitHub untuk membuat repository dan mengirim proyek milikmu.</p>{error && <div className="error-box">{error}</div>}<a className="btn-primary auth-button" href="/api/auth/github/start"><Github size={19}/> Lanjut dengan GitHub</a><div className="secure-line"><ShieldCheck size={15}/> Login resmi GitHub · Password tidak dibagikan</div><Link href="/" className="back-link"><ArrowLeft size={15}/> Kembali ke halaman awal</Link></section><div className="auth-foot"><Sparkles size={14}/> Build something lovely, one commit at a time.</div></main>;
}
