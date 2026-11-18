# ClockSync v2.0 — Sistem Informasi Presensi & Logbook Magang Berbasis Web

[![Deploy](https://img.shields.io/badge/Production-Vercel-black?logo=vercel)](https://clocksync-eta.vercel.app/)
[![Frontend](https://img.shields.io/badge/Frontend-React.js%20%2B%20Tailwind%20CSS-38BDF8?logo=react)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express.js-339933?logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MySQL%208.4%20(Aiven)-4479A1?logo=mysql)](https://www.mysql.com/)
[![Storage](https://img.shields.io/badge/Media%20CDN-Cloudinary-3448C5?logo=cloudinary)](https://cloudinary.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**ClockSync** adalah sistem informasi presensi dan logbook kegiatan peserta magang/Kerja Praktik (KP) berbasis web yang dilengkapi validasi koordinat GPS (*Geofencing* dengan Formula Haversine), dukungan pemetaan multi-unit ULP, serta dasbor pemantauan terintegrasi. Aplikasi ini dirancang dan dikembangkan sebagai luaran Kerja Praktik di **PT. PLN (Persero) UP3 Parepare**.

- **URL Aplikasi Produksi:** [https://clocksync-eta.vercel.app/](https://clocksync-eta.vercel.app/)

---

## Fitur Utama

### 1. Autentikasi & Role-Based Access Control (RBAC)
- Autentikasi aman berbasis **JSON Web Token (JWT)** dan enkripsi kata sandi **Bcrypt**.
- Pembagian hak akses otomatis untuk 3 peran pengguna: **Mahasiswa / Peserta Magang**, **Pembimbing Lapangan**, dan **Administrator (Admin)**.
- Pembaruan profil, foto profil, kata sandi, serta perubahan *username* mandiri tanpa spasi.

### 2. Modul Mahasiswa / Peserta Magang
- **Presensi Berbasis Geofencing:** Validasi jarak titik koordinat HTML5 Geolocation pengguna terhadap titik koordinat kantor (UP3/ULP) secara *real-time* disertai unggah swafoto bukti kehadiran.
- **Jurnal / Logbook Harian:** Pencatatan aktivitas kerja harian terstruktur beserta riwayat timesheet kehadiran.
- **Pengajuan Izin & Sakit:** Pengajuan ketidakhadiran secara daring (termasuk unggah lampiran surat keterangan sakit) serta fitur pengakhiran masa izin lebih awal.

### 3. Modul Pembimbing Lapangan (Pembaruan Mayor v2.0)
- **Dashboard Monitoring Harian:** Pemantauan status kehadiran harian peserta (*In-Zone*, *Terlambat*, *Izin/Sakit*) dilengkapi *badge* lokasi ULP dan filter per unit.
- **Filter Demografi 3 Dimensi:** Penyaringan daftar bimbingan berdasarkan kombinasi **Lokasi ULP**, **Divisi**, dan **Asal Universitas/Sekolah** dengan penghitung populasi otomatis.
- **Manajemen Periode Magang:** Indikator pengingat peserta yang akan selesai dalam $\le 7$ hari serta modal *pop-up* untuk memperbarui tanggal mulai/selesai magang.
- **Detail Rekap Peserta:** Tinjauan profil demografi, rekap timesheet, dan logbook harian tiap peserta bimbingan.

### 4. Modul Administrator (Admin)
- **Manajemen Pengguna Lintas Unit:** Pengelolaan akun mahasiswa, pembimbing, admin, penempatan divisi/unit, serta pengaturan ulang (*reset*) kata sandi.
- **Konfigurasi Titik Geofence Kantor & ULP:** Pengaturan titik koordinat (*latitude* & *longitude*), batas radius meter, serta aturan jam masuk dan jam pulang untuk kantor induk UP3 maupun unit-unit ULP.

---

## Arsitektur & Teknologi

Aplikasi menerapkan arsitektur *decoupled client-server* berbasis *cloud* dan *serverless*:

- **Frontend:** React.js, React Router DOM, Tailwind CSS (di-hosting pada **Vercel**)
- **Backend:** Node.js, Express.js (dijalankan sebagai **Vercel Serverless Functions**)
- **Media Upload & CDN:** Multer (`multer.memoryStorage()`) terintegrasi dengan **Cloudinary API** untuk swafoto presensi, foto profil, dan surat keterangan sakit
- **Database:** MySQL 8.4 InnoDB (`absensi_magang`) terkelola pada **Aiven Cloud** dengan koneksi SSL

### Struktur Direktori Proyek

```text
Absensi Web/
├── Backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── absenController.js
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── jurnalController.js
│   │   ├── laporanController.js
│   │   ├── pembimbingController.js
│   │   └── pengajuanController.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── apiRoutes.js
│   │   ├── jurnalRoutes.js
│   │   ├── laporanRoutes.js
│   │   ├── pembimbingRoutes.js
│   │   └── pengajuanRoutes.js
│   ├── .env
│   ├── package.json
│   └── server.js
└── Frontend/
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   └── pages/
    └── package.json
```

---

## Struktur Basis Data (`absensi_magang`)

Basis data relasional MySQL terdiri atas 5 tabel utama:
1. `users` — Data profil pengguna, kredensial, peran (`role`), asal universitas, periode magang (`tgl_mulai`, `tgl_selesai`), serta relasi `lokasi_id` dan `pembimbing_id`.
2. `settings` — Daftar titik lokasi kantor UP3/ULP beserta koordinat pusat (`latitude`, `longitude`), `radius_meter`, dan jam kerja.
3. `absensi` — Catatan presensi harian, koordinat masuk/pulang, status ketepatan waktu, dan URL foto kehadiran.
4. `jurnal_logbook` — Catatan uraian aktivitas harian peserta magang dan status peninjauan pembimbing.
5. `pengajuan_izin` — Permohonan izin/sakit, tautan lampiran Cloudinary, status persetujuan, dan pembaruan akhir izin.

---

## Daftar Endpoint RESTful API (29 Endpoint)

| Modul Router | Metode | Endpoint | Deskripsi Singkat |
| :--- | :--- | :--- | :--- |
| **Auth, Profil & Absensi** (`apiRoutes.js`) | `POST` | `/api/login` | Autentikasi pengguna & penerbitan token JWT |
| | `POST` | `/api/register` | Registrasi akun peserta baru (kampus, periode, ULP) |
| | `POST` | `/api/ubah-kata-sandi` | Pembaruan kata sandi pengguna terautentikasi |
| | `PUT` | `/api/update-profile` | Pembaruan profil, username, dan foto profil (Cloudinary) |
| | `POST` | `/api/absen` | Pencatatan presensi masuk/pulang dengan validasi GPS |
| | `GET` | `/api/riwayat/:user_id` | Mengambil riwayat presensi harian peserta |
| | `GET` | `/api/status/:user_id` | Mengecek status kehadiran hari ini |
| **Jurnal Logbook** (`jurnalRoutes.js`) | `POST` | `/api/jurnal` | Menyimpan entri jurnal kegiatan harian |
| | `GET` | `/api/jurnal/:user_id` | Mengambil daftar riwayat jurnal peserta |
| **Pengajuan Izin/Sakit** (`pengajuanRoutes.js`) | `POST` | `/api/pengajuan/izin` | Mengajukan permohonan izin tidak masuk |
| | `POST` | `/api/pengajuan/sakit` | Mengajukan sakit disertai unggah lampiran (Cloudinary) |
| | `GET` | `/api/pengajuan/pending` | Mengambil daftar pengajuan menunggu persetujuan |
| | `PUT` | `/api/pengajuan/status/:id` | Menyetujui atau menolak pengajuan izin/sakit |
| | `GET` | `/api/pengajuan/riwayat/:user_id` | Mengambil riwayat pengajuan peserta |
| | `GET` | `/api/pengajuan/riwayat-pembimbing/:pembimbing_id` | Mengambil riwayat pengajuan peserta bimbingan |
| | `PUT` | `/api/pengajuan/akhiri/:id` | Mengakhiri masa izin/sakit peserta lebih awal |
| **Pembimbing** (`pembimbingRoutes.js`) | `GET` | `/api/pembimbing/bimbingan/:id` | Daftar peserta bimbingan, demografi & sisa hari |
| | `GET` | `/api/pembimbing/mahasiswa/:id/detail` | Detail profil, timesheet, dan logbook peserta |
| | `GET` | `/api/pembimbing/dashboard-hari-ini/:pembimbing_id` | Status kehadiran harian peserta lintas ULP |
| | `PUT` | `/api/pembimbing/mahasiswa/:id/periode` | Memperbarui tanggal mulai/selesai magang peserta |
| **Laporan** (`laporanRoutes.js`) | `GET` | `/api/laporan/rekap/:pembimbing_id` | Rekapitulasi kehadiran bulanan peserta bimbingan |
| **Administrator** (`adminRoutes.js`) | `GET` | `/api/admin/users` | Mengambil seluruh daftar akun pengguna |
| | `PUT` | `/api/admin/users/:id` | Memperbarui data akun, peran, dan penempatan user |
| | `DELETE` | `/api/admin/users/:id` | Menghapus akun pengguna |
| | `PUT` | `/api/admin/users/:id/reset-password` | Reset kata sandi pengguna oleh Admin |
| | `GET` | `/api/admin/settings` | Mengambil daftar titik koordinat & radius UP3/ULP |
| | `POST` | `/api/admin/settings` | Menambahkan titik lokasi geofence kantor/ULP baru |
| | `PUT` | `/api/admin/settings/:id` | Memperbarui koordinat, radius, atau jam kerja lokasi |
| | `DELETE` | `/api/admin/settings/:id` | Menghapus titik konfigurasi lokasi kantor/ULP |

---

## Instalasi & Menjalankan Secara Lokal

### 1. Clone Repositori
```bash
git clone https://github.com/<username-github-kamu>/clocksync.git
cd clocksync
```

### 2. Konfigurasi Backend
```bash
cd Backend
npm install
```
Buat file `.env` di dalam folder `Backend/` dan sesuaikan variabel lingkungan berikut:
```env
PORT=5000
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=absensi_magang
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```
Jalankan server backend:
```bash
npm start
```

### 3. Konfigurasi Frontend
```bash
cd ../Frontend
npm install
npm run dev
```

---

## Pengembang, Kolaborasi & Atribusi (Credit)

- **Original Developer:** **Hanbal Nur Iskandar** (NIM. 231011051) — Program Studi Ilmu Komputer, Institut Teknologi Bacharuddin Jusuf Habibie (ITH)
- **Role:** Full-Stack Developer & Assistant Project Manager (Technical Liaison)
- **Instansi Mitra:** PT. PLN (Persero) UP3 Parepare (Kerja Praktik 2026)

### Ketentuan Pengembangan Lanjutan & Hak Cipta
1. **Kolaborasi Pengembangan:** Bagi mahasiswa Kerja Praktik atau tim pengembang berikutnya di lingkungan PT. PLN (Persero) UP3 Parepare yang ingin melakukan pemeliharaan atau pengembangan fitur lanjutan (v3.0+), silakan menghubungi pengembang awal untuk ditambahkan sebagai **Collaborator** pada repositori ini (pengembangan dilakukan melalui *branch* terpisah dan *Pull Request*).
2. **Atribusi Wajib (*Credit*):** Setiap penggunaan ulang kode sumber, *deployment* ulang, maupun pengembangan versi turunan dari aplikasi **ClockSync** wajib tetap mencantumkan atribusi/kredit pengembang awal pada bagian *footer* antarmuka aplikasi serta mempertahankan pemberitahuan hak cipta pada berkas `LICENSE`.