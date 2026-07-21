# 📨 E-Surat - Sistem Manajemen Surat & Pendokumentasian Digital

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)

**E-Surat** adalah aplikasi web modern berbasis Next.js App Router yang dirancang untuk mengelola pendokumentasian, kearsipan, pencatatan agenda, serta distribusi surat masuk dan keluar secara terstruktur, aman, dan efisien.

Aplikasi ini dilengkapi dengan fitur **Role-Based Access Control (RBAC)**, **Audit Logging imutabel**, **Riwayat Versi Dokumen (Versioning)**, serta kemampuan ekspor laporan langsung ke format **PDF** dan **Excel**.

---

## 🌟 Fitur Utama

- 📋 **Pengelolaan Surat Multi-Kategori**:
  - **Surat Agenda**: Pencatatan surat dinas agenda (Jenis 1 - 14) dilengkapi nomor berkas dan petunjuk.
  - **Keluar / Masuk**: Pengelolaan surat masuk dan keluar secara rinci beserta tanggal penerimaan.
  - **Nota Verifikasi**: Pengelolaan nota verifikasi transaksi/pembayaran beserta pencatatan nominal.
- 🔐 **Autentikasi & Kontrol Akses berbasis Peran (RBAC)**:
  - `ADMIN`: Akses penuh pengelolaan user, konfigurasi sistem, dan audit log.
  - `STAFF`: Hak akses mengelola, membuat, merubah, dan mengarsipkan surat.
  - `VIEWER`: Hak akses khusus membaca dan mengunduh rekapitulasi surat/laporan.
- 📜 **Audit Trail Imutabel**: Log aktivitas otomatis yang mencatat setiap aksi (`CREATE`, `UPDATE`, `ARCHIVE`, `LOGIN`, `LOGOUT`) lengkap dengan timestamp, User ID, dan IP Address.
- 🕒 **Riwayat Versi Dokumen (Version History)**: Menyimpan snapshot data otomatis setiap kali terjadi pengeditan surat sehingga riwayat perubahan dapat ditelusuri.
- 📁 **Pengarsipan & Soft Delete**: Pengarsipan surat dengan pengisian alasan pengarsipan secara transparan tanpa kehilangan data historis.
- 🔍 **Pencarian & Multi-Filtering**: Penyaringan cepat berdasarkan rentang tanggal, kategori, klasifikasi (*Biasa*, *Rahasia*, *Penting*), pengirim/penerima, dan perihal.
- 📊 **Export Laporan (PDF & Excel)**: Ekspor daftar surat yang terekam secara kustom ke format PDF (siap cetak) atau Excel (`.xlsx`).
- 🌙 **Dukungan Mode Gelap/Terang (Dark/Light Theme)**: Antarmuka adaptif berbasis `next-themes` untuk kenyamanan pengguna.

---

## 🛠️ Teknologi yang Digunakan

| Kategori | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router) | Framework React modern dengan Server Actions & SSR |
| **UI Library** | [React 19](https://react.dev/) | Core UI rendering engine |
| **Bahasa Pemrograman** | [TypeScript](https://www.typescriptlang.org/) | Pengetikan statis untuk keamanan kode |
| **Styling & Ikon** | [Tailwind CSS v4](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/) | Styling utilitas responsif & ikonografi modern |
| **Database & ORM** | [Prisma 6](https://www.prisma.io/) & SQLite | ORM intuitif dengan basis data SQLite lokal |
| **Security & Auth** | `jose` (JWT) & `bcryptjs` | Pengelolaan sesi berbasis HTTP-only Cookie & Hashing password |
| **Export Engines** | `jspdf`, `jspdf-autotable`, `xlsx` | Penjanaan dokumen PDF dan spreadsheet Excel secara konsisten |

---

## 📁 Struktur Direktori

```text
magang/
├── prisma/
│   ├── schema.prisma      # Skema database (User, Letter, LetterVersion, AuditLog)
│   └── dev.db             # File database SQLite lokal
├── public/                # Asset statis aplikasi
├── src/
│   ├── actions/           # Next.js Server Actions (Auth & Surat logic)
│   ├── app/               # Next.js App Router Pages & API Routes
│   │   ├── dashboard/     # Halaman Dashboard, Letters, & Audit Logs
│   │   ├── login/         # Halaman Otentikasi / Login
│   │   ├── globals.css    # Styling global Tailwind CSS
│   │   └── layout.tsx     # Root Layout & Provider
│   ├── components/        # Komponen UI Reusable (Modal, Filters, Sidebar, dsb.)
│   └── lib/               # Utility functions, Auth Session Handler, & Prisma Client
├── .env                   # Environment variables lokal
├── .env.example           # Template environment variables
├── package.json           # Dependensi dan script proyek
└── tsconfig.json          # Konfigurasi TypeScript
```

---

## 🚀 Panduan Memulai (Getting Started)

### Prasyarat

Pastikan perangkat Anda telah terinstal:
- **Node.js**: versi `18.x` atau lebih baru
- **npm** (atau `pnpm` / `yarn` / `bun`)

### Langkah Instalasi

1. **Clone repositori dan masuk ke direktori proyek**:
   ```bash
   cd magang
   ```

2. **Instal dependensi proyek**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables**:
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   *Catatan:* Pastikan `SESSION_SECRET` di dalam `.env` berisi string acak dengan panjang minimal 32 karakter.

4. **Migrasi / Setup Database**:
   Jalankan perintah berikut untuk menyiapkan tabel database SQLite melalui Prisma:
   ```bash
   npx prisma db push
   ```

5. **Jalankan Server Pengembang (Development Server)**:
   ```bash
   npm run dev
   ```

6. **Buka di Browser**:
   Buka alamat [http://localhost:3000](http://localhost:3000) pada peramban Anda.

---

## 🔑 Akun Bawaan (Default Credentials)

Untuk mencoba aplikasi pertama kali, Anda dapat menginisialisasi akun bawaan menggunakan fitur seed bawaan sistem:

| Peran (Role) | Email | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@esurat.local` | `admin123` | Akses Penuh (Manajemen User, Surat, & Audit Log) |
| **STAFF** | `staff@esurat.local` | `staff123` | Kelola Surat (Tambah, Edit, Hapus, Arsip) |
| **VIEWER** | `viewer@esurat.local` | `viewer123` | Hanya Lihat (Read-only & Ekspor Laporan) |

---

## 📜 Perintah Script yang Tersedia

Dalam proyek ini Anda dapat menjalankan perintah berikut:

- `npm run dev`: Menjalankan server pengembangan Next.js di port `3000`.
- `npm run build`: Membangun (compile) aplikasi untuk siap di-deploy ke lingkungan produksi.
- `npm run start`: Menjalankan server produksi hasil dari `npm run build`.
- `npm run lint`: Memeriksa kualitas dan aturan kode menggunakan ESLint.
- `npx prisma studio`: Membuka antarmuka GUI Prisma Studio untuk mengelola data SQLite di browser.

---

## 🗄️ Model Data (Prisma Schema Overview)

- **`User`**: Mengelola kredensial, peran (`ADMIN`, `STAFF`, `VIEWER`), dan status aktif pengguna.
- **`Letter`**: Menyimpan data utama surat (Nomor, Perihal, Kategori, Klasifikasi, Pengirim, Penerima, Nominal, dsb.).
- **`LetterVersion`**: Menyimpan rekam jejak versi lama surat sebelum dilakukan pengeditan.
- **`AuditLog`**: Catatan aktivitas pengguna imutabel untuk kebutuhan pengawasan keamanan dan audit internal.

---

## 🛡️ Keamanan & Best Practices Produksi

- Ubah nilai `SESSION_SECRET` pada lingkungan produksi menggunakan kunci acak yang kuat:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- Ganti kredensial bawaan admin dan user sebelum melakukan deployment produksi.
- Sesi pengguna disimpan secara aman dalam HTTP-Only Cookie terenkripsi.

---

## 📄 Lisensi

Proyek ini dikembangkan secara privat untuk kebutuhan internal pendokumentasian surat digital.
