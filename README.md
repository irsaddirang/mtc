# GPI Bawen Maintenance Studio

Dashboard React + Vite bergaya “Apple UI” untuk mengelola jadwal maintenance lengkap dengan CRUD lokal, filter dinamis, dan pengalaman animasi premium.

## Fitur Utama
- **CRUD lokal** dengan penyimpanan `localStorage` sehingga jadwal bertahan antar refresh.
- **UI Apple-inspired**: glassmorphism, gradient cards, timeline grouping per tanggal.
- **Modal proteksi password** (`6666`) sebelum menambah jadwal baru.
- **Selector mesin** siap pakai + field manual untuk mesin lain.
- **Siap GitHub Pages** berkat konfigurasi Vite `base: './'` dan workflow otomatis.

## Menjalankan Secara Lokal
```bash
npm install
npm run dev
```
Buka `http://localhost:5173`.

## Build Production
```bash
npm run build
npm run preview
```

## Deploy ke GitHub Pages
1. **Push project ke repositori GitHub** (misal branch `main`).
2. **Aktifkan Pages**: Settings → Pages → pilih “GitHub Actions”.
3. Workflow `Deploy Dashboard to GitHub Pages` (`.github/workflows/deploy.yml`) akan:
   - Install dependencies.
   - Build Vite (`dist`).
   - Upload dan deploy ke `gh-pages`.
4. Setelah workflow selesai, URL Pages muncul di tab *Actions* atau di Settings → Pages.

> Workflow berjalan otomatis setiap ada push ke `main`, atau bisa dijalankan manual via *Run workflow*.

## Password Scheduler
Klik tombol `Login Akses` → masukkan `6666`. Setelah login, tombol `Jadwalkan Maint` akan aktif sampai server di-restart/HMR terjadi.

## Struktur Penting
- `src/App.tsx` : logika dashboard + modal CRUD.
- `src/index.css` : gaya global + utilitas glassmorphism.
- `.github/workflows/deploy.yml` : workflow Pages.
- `vite.config.ts` : `base: './'` agar path relatif di Pages.

Selamat memantau jadwal maintenance dengan gaya yang kece! 🎛️✨
