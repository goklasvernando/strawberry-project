# Google Sheets Order API

Halaman pemesanan mengirim order ke Google Apps Script Web App berikut:

```text
https://script.google.com/macros/s/AKfycbwVcjuCGKcOcn2RGqAMpSkFFJwnHVYvU0CJ291rbqjIXPn1M8cWbWwta947k4Xi4LCR/exec
```

Tab tujuan harus bernama `Pesanan` dan memiliki header berikut pada baris pertama:

```text
ID | Tanggal | Nama | No HP | Alamat | Pesanan | Harga | Pembayaran | Status | Note
```

Untuk testimonial, buat tab kedua bernama `Testimonial` dengan header ini:

```text
ID | Tanggal | Nama Tampilan | Rating | Testimonial | Status | Foto
```

Website hanya menerima data dengan `Status` bernilai `Tayang`. Gunakan `Nama Tampilan` seperti `Kak Rina, Bandung` atau `R***, Jakarta`, bukan nomor WhatsApp atau alamat pelanggan.

Kolom `Foto` bersifat opsional. Isi dengan URL gambar publik yang dimulai dengan `https://` atau `http://`. Jika kosong atau gambar gagal dimuat, kartu testimonial tetap tampil tanpa foto. Pastikan pelanggan telah memberikan izin sebelum memakai fotonya.

## Perlindungan spam

- Validasi di browser dan Apps Script.
- Honeypot `website`: request bot yang mengisinya tidak dicatat.
- Cloudflare Turnstile: token diverifikasi di Apps Script sebelum pesanan ditulis.
- Duplikat: pesanan identik dari nomor yang sama ditolak selama 5 menit.

Karena website masih lokal, website memakai **test key** Cloudflare. Test key selalu lolos dan hanya untuk pengembangan:

```text
Site Key:   1x00000000000000000000AA
Secret Key: 1x0000000000000000000000000000000AA
```

## Kode Apps Script

Di spreadsheet, pilih **Extensions → Apps Script**, lalu ganti `Code.gs` dengan kode berikut.

```javascript
var SHEET_NAME = 'Pesanan';
var TESTIMONIAL_SHEET_NAME = 'Testimonial';
var TIME_ZONE = 'Asia/Jakarta';
var DUPLICATE_WINDOW_SECONDS = 300;
var PAYMENT_METHODS = ['Bank Transfer Mandiri', 'Bank Transfer BCA', 'Cash'];
var CATEGORIES = ['Kecil', 'Sedang', 'Jumbo'];

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';
  if (action === 'testimonials') {
    return jsonResponse({ ok: true, testimonials: getPublishedTestimonials() });
  }
  return jsonResponse({ ok: true, message: 'Endpoint pesanan aktif.' });
}

function getPublishedTestimonials() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TESTIMONIAL_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];

  var expectedHeaders = ['ID', 'Tanggal', 'Nama Tampilan', 'Rating', 'Testimonial', 'Status', 'Foto'];
  var headers = sheet.getRange(1, 1, 1, 7).getValues()[0];
  if (headers.join('|') !== expectedHeaders.join('|')) return [];

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
  var testimonials = [];

  for (var index = rows.length - 1; index >= 0 && testimonials.length < 6; index--) {
    var row = rows[index];
    var status = clean(row[5]).toLowerCase();
    var name = clean(row[2]);
    var rating = Number(row[3]);
    var testimonial = clean(row[4]);
    var photo = publicImageUrl(row[6]);

    if (status !== 'tayang' || !name || !testimonial || !isFinite(rating)) continue;

    testimonials.push({
      name: name.slice(0, 80),
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      testimonial: testimonial.slice(0, 600),
      photo: photo
    });
  }

  return testimonials;
}

function doPost(e) {
  try {
    var data = e && e.parameter ? e.parameter : {};
    if (String(data.website || '').trim()) return jsonResponse({ ok: true });

    var name = clean(data.name);
    var phone = normalizePhone(data.phone);
    var address = clean(data.address);
    var category = clean(data.category);
    var gram = Number(data.gram);
    var paymentMethod = clean(data.payment_method);
    var totalPrice = Number(data.total_price);

    if (!name || !phone || !address) return jsonResponse({ ok: false, error: 'Nama, No HP, dan Alamat wajib diisi.' });
    if (!/^\d{10,16}$/.test(phone)) return jsonResponse({ ok: false, error: 'Nomor WhatsApp tidak valid.' });
    if (CATEGORIES.indexOf(category) === -1) return jsonResponse({ ok: false, error: 'Kategori tidak valid.' });
    if (!isFinite(gram) || Math.floor(gram) !== gram || gram <= 0) return jsonResponse({ ok: false, error: 'Berat pesanan tidak valid.' });
    if (PAYMENT_METHODS.indexOf(paymentMethod) === -1) return jsonResponse({ ok: false, error: 'Metode pembayaran tidak valid.' });
    if (!isFinite(totalPrice) || Math.floor(totalPrice) !== totalPrice || totalPrice <= 0) return jsonResponse({ ok: false, error: 'Harga tidak valid.' });
    if (!verifyTurnstile(data['cf-turnstile-response'])) return jsonResponse({ ok: false, error: 'Verifikasi keamanan gagal. Silakan coba lagi.' });

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Tab "' + SHEET_NAME + '" tidak ditemukan.');

    var expectedHeaders = ['ID', 'Tanggal', 'Nama', 'No HP', 'Alamat', 'Pesanan', 'Harga', 'Pembayaran', 'Status', 'Note'];
    var headers = sheet.getRange(1, 1, 1, 10).getValues()[0];
    if (headers.join('|') !== expectedHeaders.join('|')) throw new Error('Header tab Pesanan tidak sesuai.');

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (isDuplicateOrder(phone, category, gram, totalPrice)) {
        return jsonResponse({ ok: false, error: 'Pesanan yang sama baru saja dikirim. Tunggu 5 menit sebelum mengirim ulang.' });
      }

      var now = new Date();
      var orderId = 'ORD-' + Utilities.formatDate(now, TIME_ZONE, 'yyyyMMdd-HHmmss') + '-' + Math.floor(1000 + Math.random() * 9000);
      sheet.appendRow([
        orderId,
        Utilities.formatDate(now, TIME_ZONE, 'dd/MM/yyyy HH:mm:ss'),
        name, phone, address, category + ' / ' + gram + ' Gram', totalPrice,
        paymentMethod, 'Pending', ''
      ]);
      rememberOrder(phone, category, gram, totalPrice);
      return jsonResponse({ ok: true, orderId: orderId });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    Logger.log(error);
    return jsonResponse({ ok: false, error: 'Pesanan gagal dicatat. Silakan coba lagi.' });
  }
}

function verifyTurnstile(token) {
  var secret = PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET_KEY');
  if (!secret || !token) return false;
  var response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'post',
    payload: { secret: secret, response: token },
    muteHttpExceptions: true
  });
  var result = JSON.parse(response.getContentText());
  return result && result.success === true;
}

function orderCacheKey(phone, category, gram, totalPrice) {
  var source = [phone, category, gram, totalPrice].join('|');
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, source, Utilities.Charset.UTF_8);
  return 'order-' + Utilities.base64EncodeWebSafe(digest);
}

function isDuplicateOrder(phone, category, gram, totalPrice) {
  return CacheService.getScriptCache().get(orderCacheKey(phone, category, gram, totalPrice)) !== null;
}

function rememberOrder(phone, category, gram, totalPrice) {
  CacheService.getScriptCache().put(orderCacheKey(phone, category, gram, totalPrice), '1', DUPLICATE_WINDOW_SECONDS);
}

function clean(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function publicImageUrl(value) {
  var url = clean(value);
  if (!/^https?:\/\//i.test(url)) return '';
  return url.slice(0, 2000);
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
```

Di **Project Settings → Script properties**, tambahkan:

```text
Name:  TURNSTILE_SECRET_KEY
Value: 1x0000000000000000000000000000000AA
```

Kemudian buka **Deploy → Manage deployments**, edit Web App, pilih **New version**, lalu deploy. URL `/exec` tetap sama. Otorisasi ulang diperlukan karena Apps Script menghubungi layanan verifikasi Cloudflare.

## Saat website sudah online

1. Buat widget production di Cloudflare Turnstile dan batasi hostname pada domain website.
2. Ganti `data-sitekey` di `strawberry-single-page.html` dengan Site Key production.
3. Ganti `TURNSTILE_SECRET_KEY` di Script Properties dengan Secret Key production.
4. Deploy versi baru Apps Script dan uji pesanan.

Secret Key tidak boleh dimasukkan ke HTML, repository, atau dibagikan melalui chat. Site Key aman dipublikasikan di HTML.
