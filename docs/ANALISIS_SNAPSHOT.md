# Analisis snapshot XIYU yang diberikan

Berkas yang diterima adalah snapshot browser MHTML, bukan source code Next.js asli. Snapshot memperlihatkan alur halaman:
- `/` beranda
- `/login` login GitHub
- `/dashboard` ringkasan akun dan workspace
- `/upload` impor ZIP/folder/file, pemilihan repository, opsi commit, dan progress

Snapshot upload juga memperlihatkan UI untuk README, lisensi, `.gitignore`, visibilitas, dan mengabaikan folder `.git`. Snapshot sesi GitHub menampilkan halaman persetujuan OAuth; state pada URL bersifat sementara dan tidak boleh dibagikan.

Karena tidak ada source server/API dari snapshot, implementasi ini membangun ulang alur tersebut secara mandiri. Fitur URL bebas sengaja tidak dibuat: server-side fetch URL arbitrer membuka risiko SSRF. Token OAuth tidak ditanam di frontend; sesi dienkripsi dan disimpan sebagai cookie HttpOnly.
