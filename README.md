# XIYU Studio — GitHub Uploader

Uploader proyek berbasis Next.js untuk Vercel. Dibangun ulang berdasarkan alur XIYU yang terlihat pada snapshot halaman: beranda → login GitHub → dashboard → uploader. Ini **implementasi baru**, bukan salinan source code situs produksi; file yang diberikan berupa snapshot halaman MHTML, bukan source repository.

## Fitur

- Login GitHub OAuth dengan cookie `HttpOnly`, `Secure` di production, `SameSite=Lax`, dan sesi terenkripsi AES-256-GCM.
- Pilih repository yang sudah ada atau buat repository baru (private/public).
- Impor ZIP, folder, banyak file, atau file teks manual.
- Preview daftar file, ukuran, jumlah file, pilih/hapus file, pencarian file, dan progress per file.
- Membuat satu commit untuk seluruh file menggunakan Git Database API (blob → tree → commit → ref).
- Pilihan branch, pesan commit, README starter, lisensi, `.gitignore`, dan penghapusan folder `.git` bersarang.
- Pemeriksaan path traversal, file terlalu besar, jumlah file, total ukuran, serta daftar file yang diabaikan.
- UI responsif, tema gelap/terang, panel status, dan log aktivitas.
- Seluruh label antarmuka berbahasa Indonesia.

## Batas aman awal

Karena Vercel Functions memiliki batas request body, setiap file dikirim satu per satu. Default aplikasi membatasi **2.8 MiB per file**, **1500 file**, dan **150 MiB total hasil ekstraksi**. ZIP diproses di browser, bukan diekstrak di server. Batas ini sengaja konservatif agar base64 JSON tetap di bawah batas payload fungsi. File besar sebaiknya dipecah atau diunggah melalui Git LFS di luar aplikasi.

## Menjalankan lokal

1. Pasang Node.js 20 atau lebih baru.
2. Jalankan `npm install`.
3. Salin `.env.example` menjadi `.env.local`, lalu isi semua variabel.
4. Buat GitHub OAuth App:
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/github/callback`
5. Jalankan `npm run dev`, lalu buka `http://localhost:3000`.

## Deploy ke Vercel

1. Unggah repository ini ke GitHub.
2. Impor repository di Vercel sebagai proyek Next.js.
3. Tambahkan `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`, dan `APP_URL` pada Environment Variables.
4. Pada GitHub OAuth App, ubah callback URL menjadi `https://NAMA-PROYEK.vercel.app/api/auth/github/callback`.
5. Deploy ulang setelah environment variable disimpan.

## Keamanan penting

- Jangan menaruh GitHub Client Secret atau token di `NEXT_PUBLIC_*`, source frontend, screenshot, atau repository.
- Jangan bagikan cookie browser, callback URL yang memuat `state`, file `.env.local`, atau tangkapan layar yang memuat data akun.
- OAuth scope `repo` memberikan akses repository yang luas sesuai izin akun. Gunakan akun GitHub khusus bila ingin membatasi dampak.
- Aplikasi ini tidak menyimpan token di `localStorage`. Token disimpan dalam cookie terenkripsi dan hanya dibaca oleh server.
- Logout menghapus cookie sesi. Untuk mencabut izin aplikasi, buka GitHub Settings → Applications → Authorized OAuth Apps.
- Periksa perubahan file sebelum menekan tombol commit. Aplikasi tidak otomatis mengirim apa pun sebelum pengguna menekan tombol push.

## Struktur utama

```text
src/
  app/
    api/
      auth/github/start/route.ts
      auth/github/callback/route.ts
      auth/session/route.ts
      auth/logout/route.ts
      github/repos/route.ts
      github/create-repo/route.ts
      github/blob/route.ts
      github/commit/route.ts
    dashboard/page.tsx
    upload/page.tsx
    login/page.tsx
    layout.tsx
    page.tsx
    globals.css
  components/
    AppShell.tsx
    Uploader.tsx
  lib/
    auth.ts
    github.ts
    validation.ts
```

## Catatan teknis

- Tidak ada backend upload URL arbitrer. Fitur “dari link” pada snapshot lama tidak direplikasi sebagai fetch URL bebas karena berisiko SSRF dan sumber eksternal dapat memblokir CORS. Gunakan unduhan lokal lalu impor file/ZIP.
- GitHub API dapat menerapkan rate limit. Upload file memakai empat request paralel dengan satu request blob per file. Banyak file tetap dapat memerlukan waktu dan terkena rate limit GitHub.
- Jalankan `npm run build` sebelum deploy. Pengujian integrasi OAuth/commit membutuhkan GitHub OAuth App dan repository uji.
