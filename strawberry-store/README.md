# Strawberry Store (WordPress + WooCommerce)

Project ini menyiapkan:
- Local WordPress via Docker (`http://localhost:8080`)
- Plugin kustom `Strawberry Order WhatsApp`
- Payment gateway tambahan: `Other`
- Notifikasi WhatsApp otomatis saat order dibuat (admin + opsional pelanggan)

## 1) Jalankan WordPress lokal

```bash
cd /Users/goklasvernando/Documents/GITHUB_GVN/strawberry-store
docker compose up -d
```

Lalu buka `http://localhost:8080` dan selesaikan instalasi WordPress.

## 2) Install plugin wajib

Dari wp-admin:
1. `Plugins > Add New`
2. Install dan aktifkan `WooCommerce`
3. Pastikan plugin ini aktif: `Strawberry Order WhatsApp`

## 3) Setup produk strawberry (3 variasi gram)

1. `Products > Attributes`
2. Tambah atribut: `Ukuran`
3. Isi terms: `Kecil`, `Sedang`, `Jumbo`
4. `Products > Add New`
5. Nama produk: `Strawberry Fresh`
6. Product Data: pilih `Variable product`
7. Tab `Attributes`: pilih `Ukuran`, centang `Used for variations`
8. Tab `Variations`: `Generate variations`
9. Isi tiap variasi:
   - `Kecil` -> set berat (Weight) contoh `250` gram
   - `Sedang` -> set berat contoh `500` gram
   - `Jumbo` -> set berat contoh `1000` gram
10. Publish

## 4) Setup metode pembayaran

Di `WooCommerce > Settings > Payments`:
- Aktifkan `Direct bank transfer` dan isi rekening Mandiri + BCA pada account details.
- Aktifkan `Cash on delivery`.
- Aktifkan `Other` (dari plugin ini).
- (Opsional) `Cheque` bisa dinonaktifkan jika tidak dipakai.

## 5) Setup WhatsApp otomatis

Di `WooCommerce > Strawberry WhatsApp` isi:
- `API Endpoint URL`: endpoint dari provider WA API kamu.
- `API Token`: token API.
- `Nomor Admin`: format internasional, contoh `62812xxxx`.
- `Kirim ke pelanggan juga`: centang jika ingin kirim ke nomor billing pelanggan.

Payload JSON yang dikirim plugin ini:
```json
{
  "target": "62812xxxx",
  "message": "Nama: ...\nNo HP: ...\nAlamat: ...\nPesanan: Kategori / Gram\nPembayaran: ...",
  "order_id": 123
}
```

Template nota otomatis:
- Nama:
- No HP:
- Alamat:
- Pesanan: (Kategori / Gram)
- Pembayaran:

## 6) Uji end-to-end

1. Buat pesanan dari halaman shop.
2. Cek masuk ke `WooCommerce > Orders`.
3. Cek log: `WooCommerce > Status > Logs` pilih source `strawberry-order-whatsapp`.
4. Verifikasi pesan masuk ke WhatsApp admin/pelanggan.

## Rekomendasi plugin

### Gratis
- WooCommerce (core)
- Strawberry Order WhatsApp (plugin kustom di repo ini)
- Notiqoo / ArrayCodes Order Notifications (alternatif integrasi WA siap pakai)

### Berbayar
- Notiqoo Pro
- Besked Notifications
- FunnelKit Automations + Twilio/WA provider

## Catatan penting
- Untuk produksi, gunakan WhatsApp Business API resmi (Meta Cloud API / BSP).
- Pastikan endpoint menerima payload `target`, `message`, `order_id`.
- Jika format provider berbeda, ubah fungsi `send_api_request()` pada plugin.
