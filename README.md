# strawberry-project

Strawberry Project.

## Changelog

### 2026-05-24
- Mengubah label `Fresh Harvest Strawberry` menjadi `Strawberry Segar` pada halaman pemesanan.
- Menambahkan logo dari lampiran pengguna ke website (`assets/strawberry-logo.jpeg`) dan menampilkannya di `strawberry-single-page.html`.
- Menambahkan tombol sosial media Instagram dan Facebook Page di bagian footer halaman pemesanan menggunakan ikon masing-masing platform.
- Menambahkan copyright footer pada halaman pemesanan.

### 2026-05-23
- Menambahkan `strawberry-fullstack` (Node.js/Express + React) untuk backend API dan admin dashboard real-time.
- Menambahkan `strawberry-single-page.html` sebagai halaman pemesanan utama berbasis HTML + Tailwind CSS.
- Integrasi submit form ke backend (`/api/orders`) dan redirect WhatsApp otomatis setelah penyimpanan sukses.
- Menambahkan kalkulasi harga dinamis per 500 gram berdasarkan kategori (`Kecil`, `Sedang`, `Jumbo`).
- Menambahkan validasi nomor WhatsApp, notifikasi sukses, dan fallback jika popup WhatsApp diblokir.
- Menambahkan kolom `total_price` di backend + tampilan harga/filter status/badge status di admin dashboard.
- Menghapus folder `strawberry-store` yang tidak dipakai.
