import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { initDb } from './db.js';

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER || '6281220000956';
const EXTRA_ALLOWED_ORIGINS = ['http://localhost:5500', 'http://127.0.0.1:5500'];

const PAYMENT_METHODS = [
  'Bank Transfer Mandiri',
  'Bank Transfer BCA',
  'Cash'
];

const CATEGORIES = ['Kecil', 'Sedang', 'Jumbo'];
const STATUSES = ['Pending', 'Diproses', 'Selesai', 'Batal'];

const app = express();
const server = http.createServer(app);
let db;

const allowedOrigins = [CLIENT_ORIGIN, ...EXTRA_ALLOWED_ORIGINS];
function isPrivateNetworkOrigin(origin) {
  return /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
}

function corsOrigin(origin, callback) {
  if (!origin || origin === 'null' || allowedOrigins.includes(origin) || isPrivateNetworkOrigin(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error(`Origin ${origin} not allowed by CORS`));
}

const io = new Server(server, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST', 'PATCH'] }
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

function buildWhatsappMessage(order) {
  const formattedPrice = new Intl.NumberFormat('id-ID').format(Number(order.total_price || 0));
  return [
    '*NOTA PEMESANAN STRAWBERRY*',
    '------------------------------',
    `Nama       : ${order.name}`,
    `No HP      : ${order.phone}`,
    `Alamat     : ${order.address}`,
    `Pesanan    : ${order.category} / ${order.gram} gram`,
    `Pembayaran : ${order.payment_method}`,
    `Harga      : Rp. ${formattedPrice}`,
    '------------------------------',
    'Terima kasih, pesanan Anda sedang diproses.'
  ].join('\n');
}

function normalizePhone(phone) {
  return String(phone || '').replace(/[^0-9]/g, '');
}

function validateOrder(body) {
  const gram = Number(body.gram);
  const totalPrice = Number(body.total_price);
  if (!body.name || !body.phone || !body.address) return 'Nama, No HP, dan Alamat wajib diisi.';
  if (!CATEGORIES.includes(body.category)) return 'Kategori tidak valid.';
  if (!Number.isInteger(gram) || gram <= 0) return 'Berat harus angka gram lebih dari 0.';
  if (!PAYMENT_METHODS.includes(body.payment_method)) return 'Metode pembayaran tidak valid.';
  if (!Number.isInteger(totalPrice) || totalPrice <= 0) return 'Total harga tidak valid.';
  return null;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/orders', async (_req, res) => {
  const rows = await db.all('SELECT * FROM orders ORDER BY id DESC');
  res.json(rows);
});

app.post('/api/orders', async (req, res) => {
  const validationError = validateOrder(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const payload = {
    created_at: new Date().toISOString(),
    name: req.body.name.trim(),
    phone: normalizePhone(req.body.phone),
    address: req.body.address.trim(),
    category: req.body.category,
    gram: Number(req.body.gram),
    payment_method: req.body.payment_method,
    total_price: Number(req.body.total_price),
    status: 'Pending'
  };

  const result = await db.run(
    `INSERT INTO orders (created_at, name, phone, address, category, gram, payment_method, total_price, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    payload.created_at,
    payload.name,
    payload.phone,
    payload.address,
    payload.category,
    payload.gram,
    payload.payment_method,
    payload.total_price,
    payload.status
  );

  const order = await db.get('SELECT * FROM orders WHERE id = ?', result.lastID);
  io.emit('order:created', order);

  const message = buildWhatsappMessage(order);
  const waText = encodeURIComponent(message);
  const waNumber = normalizePhone(ADMIN_WHATSAPP_NUMBER);
  const whatsappUrl = `https://wa.me/${waNumber}?text=${waText}`;

  return res.status(201).json({ order, whatsappUrl });
});

app.patch('/api/orders/:id/status', async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'ID tidak valid.' });
  }
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Status tidak valid.' });
  }

  const existing = await db.get('SELECT * FROM orders WHERE id = ?', id);
  if (!existing) {
    return res.status(404).json({ error: 'Order tidak ditemukan.' });
  }

  await db.run('UPDATE orders SET status = ? WHERE id = ?', status, id);
  const updated = await db.get('SELECT * FROM orders WHERE id = ?', id);
  io.emit('order:updated', updated);

  return res.json(updated);
});

io.on('connection', () => {});

async function bootstrap() {
  db = await initDb();
  server.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
    console.error('Failed to start backend:', error);
    process.exit(1);
});
