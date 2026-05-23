import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { fetchOrders, updateOrderStatus } from '../lib/api';

const socket = io('http://localhost:4000');
const statuses = ['Pending', 'Diproses', 'Selesai'];

function formatDate(iso) {
  return new Date(iso).toLocaleString('id-ID');
}

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

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
      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tanggal</th>
              <th>Nama</th>
              <th>No HP</th>
              <th>Pesanan</th>
              <th>Pembayaran</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{formatDate(order.created_at)}</td>
                <td>{order.name}</td>
                <td>{order.phone}</td>
                <td>{order.category} / {order.gram} Gram</td>
                <td>{order.payment_method}</td>
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
