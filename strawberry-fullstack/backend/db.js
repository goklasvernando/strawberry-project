import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function initDb() {
  const db = await open({
    filename: './strawberry.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      category TEXT NOT NULL,
      gram INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending'
    )
  `);

  const columns = await db.all(`PRAGMA table_info(orders)`);
  const hasTotalPrice = columns.some((column) => column.name === 'total_price');
  if (!hasTotalPrice) {
    await db.exec(`ALTER TABLE orders ADD COLUMN total_price INTEGER NOT NULL DEFAULT 0`);
  }

  return db;
}
