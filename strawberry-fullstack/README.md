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

## Fitur Sesuai Spesifikasi

### Halaman Pembeli
- Form: Nama, No HP, Alamat, Kategori, Berat (gram), Metode Pembayaran.
- Submit flow:
  1. Data disimpan ke database backend.
  2. Backend mengembalikan URL WhatsApp (`wa.me`) dengan format pesan nota.
  3. Frontend redirect ke URL WhatsApp.

Format pesan:

```text
Nama: ...
No HP: ...
Alamat: ...
Pesanan: (Kategori / Gram)
Pembayaran: ...
```

### Dashboard Admin
- Menampilkan tabel order secara real-time.
- Kolom: ID, Tanggal, Nama, No HP, Pesanan (Kategori & Gram), Metode Pembayaran, Status.
- Status bisa diubah: `Pending`, `Diproses`, `Selesai`.

## Cara Menjalankan

### 1) Backend

```bash
cd /Users/goklasvernando/Documents/GITHUB_GVN/strawberry-fullstack/backend
npm install
npm run dev
```

Backend jalan di `http://localhost:4000`.

### 2) Frontend

```bash
cd /Users/goklasvernando/Documents/GITHUB_GVN/strawberry-fullstack/frontend
npm install
npm run dev
```

Frontend jalan di `http://localhost:5173`.

## Endpoint API Backend

- `GET /api/health`
- `GET /api/orders`
- `POST /api/orders`
- `PATCH /api/orders/:id/status`

Contoh body `POST /api/orders`:

```json
{
  "name": "Budi",
  "phone": "08123456789",
  "address": "Jl. Merdeka 1",
  "category": "Sedang",
  "gram": 500,
  "payment_method": "Bank Transfer BCA"
}
```

Response sukses berisi:
- `order` (data tersimpan)
- `whatsappUrl` (untuk redirect)

## Catatan Integrasi WhatsApp

Saat ini menggunakan `wa.me` link agar cepat dipakai. Jika ingin auto-send tanpa membuka chat manual, ganti bagian pembuatan `whatsappUrl` di backend dengan API provider WhatsApp Business (Twilio/Fonnte/Meta API).
