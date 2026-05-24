# Strawberry Full-Stack Order System

Full-stack website pemesanan Strawberry dengan:
- Backend: Node.js + Express + SQLite + Socket.IO
- Frontend: React (Vite)
- Halaman: Client Order Form + Admin Dashboard Real-time

## Struktur Folder

```text
strawberry-fullstack/
  backend/
    db.js
    server.js
    package.json
  frontend/
    index.html
    package.json
    vite.config.js
    src/
      main.jsx
      App.jsx
      styles.css
      lib/
        api.js
      pages/
        ClientPage.jsx
        AdminPage.jsx
  README.md
```

## Fitur

### Halaman Pembeli
- Form: Nama, No HP, Alamat, Kategori, Berat (gram), Metode Pembayaran.
- Submit flow:
  1. Data disimpan ke database backend.
  2. Backend mengembalikan URL WhatsApp (`wa.me`) dengan template nota.
  3. Frontend menampilkan notifikasi sukses dan redirect ke WhatsApp.

### Dashboard Admin
- Menampilkan tabel order secara real-time.
- Kolom: ID, Tanggal, Nama, No HP, Pesanan (Kategori & Gram), Harga, Metode Pembayaran, Status.
- Filter status: `Semua`, `Pending`, `Diproses`, `Selesai`.
- Status order bisa diubah langsung dari tabel.

## Cara Menjalankan

### 1) Backend

```bash
cd /Users/goklasvernando/Documents/GITHUB_GVN/strawberry-fullstack/backend
npm install
npm run dev
```

Backend jalan di `http://localhost:4000`.

### 2) Frontend Admin (React)

```bash
cd /Users/goklasvernando/Documents/GITHUB_GVN/strawberry-fullstack/frontend
npm install
npm run dev
```

Frontend jalan di `http://localhost:5173`.

### 3) Frontend Single Page (HTML)

Buka file:
`/Users/goklasvernando/Documents/GITHUB_GVN/strawberry-single-page.html`

Atau jalankan lewat local server:

```bash
cd /Users/goklasvernando/Documents/GITHUB_GVN
python3 -m http.server 5500
```

Lalu akses:
`http://localhost:5500/strawberry-single-page.html`

## Endpoint API Backend

- `GET /api/health`
- `GET /api/orders`
- `POST /api/orders`
- `PATCH /api/orders/:id/status`

Contoh body `POST /api/orders`:

```json
{
  "name": "Budi",
  "phone": "628123456789",
  "address": "Jl. Merdeka 1",
  "category": "Sedang",
  "gram": 1500,
  "payment_method": "Bank Transfer BCA",
  "total_price": 135000
}
```

Response sukses berisi:
- `order` (data tersimpan)
- `whatsappUrl` (untuk redirect)

## Catatan Integrasi WhatsApp

Saat ini menggunakan `wa.me` link agar cepat dipakai. Jika ingin auto-send tanpa membuka chat manual, ganti bagian pembuatan `whatsappUrl` di backend dengan API provider WhatsApp Business (Twilio/Fonnte/Meta API).

## Changelog

### 2026-05-24
- Mengubah label hero di halaman pemesanan menjadi `Strawberry Segar`.
- Menambahkan logo brand ke halaman pemesanan menggunakan file lokal `assets/strawberry-logo.jpeg`.

### 2026-05-23
- Menambahkan opsi status `Batal` pada aksi Dashboard Admin (frontend + validasi backend).
- Menampilkan kembali kolom `Alamat` pada tabel Dashboard Admin.
- Menambahkan kartu ringkasan pendapatan di Admin Panel: harian, bulanan, dan tahunan (berdasarkan `total_price` order).
- Mengubah perhitungan pendapatan agar hanya menghitung transaksi dengan status `Selesai`.
- Mengubah halaman utama React (`/`) agar langsung menampilkan `Dashboard Admin`.
- Mengubah tombol `Halaman Pembeli` di navbar React agar direct ke `http://localhost:5500/strawberry-single-page.html`.
- Menambahkan dukungan `total_price` pada backend (schema + validasi + penyimpanan DB).
- Memisahkan field `payment_method` dari harga agar data order lebih rapi.
- Mengubah template WhatsApp agar mencantumkan baris `Harga` terpisah.
- Menambahkan CORS untuk origin localhost, file origin (`null`), dan private network (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`).
- Menyesuaikan script backend agar kompatibel Node.js 12 (menghapus `--watch` dan top-level `await`).
- Menambahkan fitur dashboard admin: kolom harga, filter status, dan badge status.
- Menyesuaikan payment method backend menjadi: `Bank Transfer Mandiri`, `Bank Transfer BCA`, `Cash`.
