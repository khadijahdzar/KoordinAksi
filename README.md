# KoordinAksi — Smart Volunteer Management System

KoordinAksi menghubungkan relawan dengan organisasi dan kegiatan sosial. Aplikasi MERN baru berada di `client/` dan `server/`; folder `backend/` dan `frontend/` yang sudah ada merupakan versi Laravel/HTML lama dan tidak digunakan oleh perintah MERN di root.

## Teknologi

- MongoDB + Mongoose
- Node.js + Express
- React 18 + Vite + React Router
- Axios, Context API, JWT, bcrypt

## Persyaratan

- Node.js 20 atau lebih baru dan npm
- MongoDB lokal atau MongoDB Atlas

## Instalasi dan menjalankan

1. Buat file konfigurasi backend dari template root:

   ```powershell
   Copy-Item .env.example server\.env
   ```

   `.env.example` hanya template dan tidak dibaca otomatis. Server membaca `server/.env`. File `server/.env.example` berisi template yang sama jika ingin menyalinnya dari folder server.

2. Edit `server/.env`:

   ```dotenv
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/koordinaksi
   JWT_SECRET=ganti-dengan-secret-acak-yang-panjang
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

   Pastikan MongoDB berjalan atau ubah `MONGO_URI` ke koneksi Atlas. Jangan menggunakan contoh `JWT_SECRET` pada production.

3. Dari direktori root project, install semua workspace dan jalankan frontend serta backend:

   ```powershell
   npm install
   npm run dev
   ```

   Frontend tersedia di `http://localhost:5173`, API di `http://localhost:5000/api`, dan health check di `http://localhost:5000/api/health`.

Perintah lain:

```powershell
npm run dev:server
npm run dev:client
npm run build
npm start
```

Untuk menjalankan frontend terpisah, opsional buat `client/.env` dan isi `VITE_API_URL=http://localhost:5000/api`.

### Transaksi dan kapasitas pendaftaran

Pendaftaran relawan menggunakan transaksi MongoDB dan penghitung `activeRegistrations` pada setiap kegiatan. Transaksi memerlukan MongoDB Atlas atau MongoDB lokal yang dikonfigurasi sebagai replica set; server standalone tidak mendukung transaksi. Untuk database yang sudah berisi kegiatan/pendaftaran, hentikan backend lalu jalankan migrasi satu kali sebelum menyalakannya kembali:

```powershell
npm run migrate:registration-counts --workspace=server
```

Jalankan migrasi ulang setelah impor data lama yang mengubah pendaftaran aktif. Jangan jalankan migrasi bersamaan dengan penulisan pendaftaran.

Verifikasi koneksi replica set sekaligus dukungan transaksi dengan probe sementara yang dibersihkan setelah tes:

```powershell
npm run verify:replica-set --workspace=server
```

### Uji E2E kapasitas (database lokal khusus tes)

Skrip ini membuat satu organisasi, satu kegiatan, dan tiga relawan; data tidak dihapus otomatis. Pastikan API backend tersambung ke **database lokal khusus tes**, bukan database berisi data penting, lalu jalankan dari root:

```powershell
powershell -ExecutionPolicy Bypass -File .\server\scripts\e2e-capacity.ps1
```

Skrip meminta kredensial admin secara tersembunyi, menguji bahwa organisasi belum terverifikasi tidak dapat membuat kegiatan, memverifikasi organisasi, membuat kegiatan berkuota dua, lalu mengirim tiga pendaftaran secara paralel. Hasil yang diharapkan: dua `201`, satu `409`, dan `activeRegistrations` sama dengan dua.

### Tes integrasi route backend

Tes otomatis memakai Node.js built-in test runner dan database MongoDB khusus berakhiran `test`. Tes menolak database yang namanya tidak mengandung `test`, membuat fixture unik, lalu membersihkan fixture tersebut. Karena pendaftaran dan audit verifikasi menggunakan transaksi, MongoDB harus berjalan sebagai replica set.

Buat `server/.env.test` dari `server/.env.example`, lalu gunakan database terpisah (contoh: `koordinaksi_test`) dan secret khusus tes. Jalankan dari root:

```powershell
npm run test:integration --workspace=server
```

Tes mencakup larangan membuat kegiatan oleh organisasi belum diverifikasi, invariant pengurangan kapasitas, pendaftaran ganda, transisi status, dan audit verifikasi admin.

## Fitur dan peran

- Relawan dapat membuat akun, mencari kegiatan berdasarkan kata kunci/kategori/lokasi, mendaftar, dan melihat status/riwayat.
- Organisasi dapat mendaftar, membuat/mengubah/membatalkan kegiatan, melihat pendaftar, serta menerima atau menolak pendaftaran.
- Admin dapat memverifikasi/menolak organisasi melalui endpoint khusus; status organisasi (`pending`, `verified`, `rejected`) dan setiap tindakan dicatat; audit log hanya dapat dibaca admin.
- Status pendaftaran mengikuti transisi `pending` → `approved`/`rejected`/`cancelled` dan `approved` → `attended`/`cancelled`; status akhir tidak dapat diaktifkan kembali.
- Kegiatan mendukung status `draft`, `published`, dan `cancelled`. Status pendaftaran: `pending`, `approved`, `rejected`, `attended`, dan `cancelled`.
- Registrasi publik hanya mengizinkan peran relawan atau organisasi; akun admin tidak dapat dibuat melalui form.
- Jelajah kegiatan tersedia di `/jelajah` (alias `/kegiatan`) dengan filter kata kunci, kategori, lokasi, tanggal, dan pagination.
- Direktori organisasi terverifikasi tersedia di `/organisasi`; pendaftaran lembaga tersedia melalui `/organisasi/pendaftaran` (alias `/register/organization`).
- Dashboard relawan tersedia di `/dashboard/relawan` (alias `/dashboard/volunteer`), dashboard organisasi di `/dashboard/organisasi` (alias `/dashboard/organization`), dan `/dashboard` mengarahkan pengguna ke dashboard sesuai role database terbaru. `/admin` dan turunannya selalu memuat ulang role dari `/api/auth/me` sebelum UI admin ditampilkan.

### Membuat akun admin

Admin awal harus dibuat secara manual dan hanya untuk operator tepercaya. Setelah dependency terpasang, jalankan:

```powershell
node --env-file=server/.env --input-type=module -e "import mongoose from 'mongoose'; import User from './server/src/models/User.js'; await mongoose.connect(process.env.MONGO_URI); const user = await User.create({ name: 'Administrator', email: 'admin@example.com', password: 'ganti-password-aman', role: 'admin' }); console.log('Admin dibuat:', user.email); await mongoose.disconnect();"
```

Jalankan perintah dari root dengan konfigurasi environment tersedia di `server/.env`. Password disimpan menggunakan bcrypt. Jangan membagikan akun admin atau kredensial tersebut.

Jika akun sudah terdaftar sebagai relawan atau organisasi, operator database dapat mengubah perannya tanpa mengganti password:

```powershell
node --env-file=server/.env server/scripts/promote-admin.js nama@email.com
```

Perintah ini hanya memperbarui akun dengan email yang cocok; tidak ada endpoint publik untuk membuat atau menaikkan role admin. Setelah role diperbarui, buka `/admin` atau gunakan tombol periksa ulang status akun agar `AuthContext` memuat role terbaru dari `/api/auth/me`.

## REST API

Semua endpoint berawalan `/api`.

| Method | Endpoint | Akses | Keterangan |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Publik | Daftar relawan/organisasi (`name`, `email`, `password`, opsional `phone`; organisasi memerlukan `organizationName`) |
| `POST` | `/auth/login` | Publik | Login dan memperoleh JWT |
| `GET` | `/auth/me` | Login | Profil pengguna aktif |
| `GET` | `/activities` | Publik | Daftar kegiatan; query `search`, `category`, `location`, `date` (`YYYY-MM-DD`), `page`, `limit` |
| `GET` | `/activities/stats` | Publik | Statistik homepage |
| `GET` | `/activities/meta` | Publik | Daftar kategori |
| `GET` | `/activities/:id` | Publik | Detail kegiatan |
| `GET` | `/activities/mine` | Organisasi/admin | Kegiatan yang dikelola |
| `POST` | `/activities` | Organisasi/admin | Buat kegiatan |
| `PATCH` | `/activities/:id` | Pemilik/admin | Ubah kegiatan |
| `DELETE` | `/activities/:id` | Pemilik/admin | Batalkan kegiatan secara soft delete |
| `POST` | `/registrations` | Relawan | Daftar (`activityId`, opsional `note`) |
| `GET` | `/registrations/mine` | Relawan | Riwayat pendaftaran |
| `GET` | `/registrations/activity/:activityId` | Pemilik/admin | Daftar peserta kegiatan |
| `PATCH` | `/registrations/:id/status` | Pemilik/admin | Ubah status pendaftaran |
| `GET` | `/organizations` | Publik | Direktori organisasi terverifikasi; query `search`, `focus`, `region`, `scale`, `legalRegistered`, `page`, `limit` |
| `GET` | `/organizations/pending` | Admin | Organisasi menunggu verifikasi |
| `PATCH` | `/organizations/:id/verify` | Admin | Verifikasi (`{ "verified": true }`) |
| `GET` | `/admin/audit-logs` | Admin | Audit log verifikasi organisasi; mendukung `page` dan `limit` |

Endpoint terlindungi menerima `Authorization: Bearer <token>`. API mengembalikan status `401` untuk sesi tidak valid dan `403` untuk role yang tidak berwenang. Respons error berbentuk JSON dengan properti `message`.

## Struktur MERN

```text
koordinaksi/
├── client/
│   ├── index.html
│   └── src/                # React pages, Auth Context, API client, styles
├── server/
│   ├── src/
│   │   ├── config/         # Koneksi MongoDB
│   │   ├── middleware/     # JWT auth, role authorization, errors
│   │   ├── models/         # User, Organization, Activity, Registration
│   │   └── routes/         # REST API
│   └── .env.example
├── .env.example
├── package.json            # npm workspaces dan perintah root
└── README.md
```

## Catatan production

Gunakan secret JWT acak yang panjang, HTTPS, MongoDB dengan autentikasi, dan konfigurasi CORS yang hanya mengizinkan domain frontend production. UI menyimpan JWT di `localStorage`; untuk threat model yang lebih ketat, pertimbangkan migrasi ke cookie `httpOnly` dengan perlindungan CSRF.
