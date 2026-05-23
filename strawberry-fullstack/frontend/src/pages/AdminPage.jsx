import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { fetchOrders, updateOrderStatus } from '../lib/api';

const socket = io('http://localhost:4000');
const statuses = ['Pending', 'Diproses', 'Selesai', 'Batal'];

function formatDate(iso) {
  return new Date(iso).toLocaleString('id-ID');
}

function formatRupiah(amount) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Number(amount || 0))}`;
}

function isSameDay(orderDate, now) {
  return (
    orderDate.getDate() === now.getDate() &&
    orderDate.getMonth() === now.getMonth() &&
    orderDate.getFullYear() === now.getFullYear()
  );
}

function statusClassName(status) {
  if (status === 'Selesai') return 'badge badge-success';
  if (status === 'Diproses') return 'badge badge-warning';
  if (status === 'Batal') return 'badge badge-cancel';
  return 'badge badge-pending';
}

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch((err) => setError(err.message));

    socket.on('order:created', (order) => {
      setOrders((prev) => [order, ...prev]);
    });

    socket.on('order:updated', (updated) => {
      setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)));
    });

    return () => {
      socket.off('order:created');
      socket.off('order:updated');
    };
  }, []);

  const total = useMemo(() => orders.length, [orders]);
  const revenue = useMemo(() => {
    const now = new Date();
    return orders.reduce(
      (acc, order) => {
        if (order.status !== 'Selesai') {
          return acc;
        }

        const orderDate = new Date(order.created_at);
        const amount = Number(order.total_price || 0);

        if (isSameDay(orderDate, now)) {
          acc.daily += amount;
        }
        if (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        ) {
          acc.monthly += amount;
        }
        if (orderDate.getFullYear() === now.getFullYear()) {
          acc.yearly += amount;
        }
        return acc;
      },
      { daily: 0, monthly: 0, yearly: 0 }
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'Semua') return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  async function onStatusChange(id, status) {
    try {
      await updateOrderStatus(id, status);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="card">
      <h2>Dashboard Admin</h2>
      <p>Total pesanan: {total}</p>

      <div className="revenue-grid">
        <article className="revenue-card daily">
          <p>Pendapatan Harian</p>
          <h3>{formatRupiah(revenue.daily)}</h3>
        </article>
        <article className="revenue-card monthly">
          <p>Pendapatan Bulanan</p>
          <h3>{formatRupiah(revenue.monthly)}</h3>
        </article>
        <article className="revenue-card yearly">
          <p>Pendapatan Tahunan</p>
          <h3>{formatRupiah(revenue.yearly)}</h3>
        </article>
      </div>

      <div className="toolbar">
        <label htmlFor="status-filter">Filter status</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="Semua">Semua</option>
          {statuses.map((status) => (
            <option value={status} key={status}>{status}</option>
          ))}
        </select>
      </div>
      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tanggal</th>
              <th>Nama</th>
              <th>No HP</th>
              <th>Alamat</th>
              <th>Pesanan</th>
              <th>Harga</th>
              <th>Pembayaran</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{formatDate(order.created_at)}</td>
                <td>{order.name}</td>
                <td>{order.phone}</td>
                <td>{order.address}</td>
                <td>{order.category} / {order.gram} Gram</td>
                <td>{formatRupiah(order.total_price)}</td>
                <td>{order.payment_method}</td>
                <td><span className={statusClassName(order.status)}>{order.status}</span></td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => onStatusChange(order.id, e.target.value)}
                  >
                    {statuses.map((status) => (
                      <option value={status} key={status}>{status}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
