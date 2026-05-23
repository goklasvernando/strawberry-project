import { useState } from 'react';
import { createOrder } from '../lib/api';

const initialState = {
  name: '',
  phone: '',
  address: '',
  category: 'Kecil',
  gram: 250,
  payment_method: 'Bank Transfer Mandiri'
};

export default function ClientPage() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function onChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await createOrder({
        ...form,
        gram: Number(form.gram)
      });

      window.location.href = result.whatsappUrl;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Form Pemesanan Strawberry</h2>
      <form onSubmit={onSubmit} className="form-grid">
        <label>
          Nama
          <input name="name" value={form.name} onChange={onChange} required />
        </label>

        <label>
          No HP
          <input name="phone" value={form.phone} onChange={onChange} required />
        </label>

        <label className="full">
          Alamat
          <textarea name="address" value={form.address} onChange={onChange} required />
        </label>

        <label>
          Kategori
          <select name="category" value={form.category} onChange={onChange}>
            <option value="Kecil">Kecil</option>
            <option value="Sedang">Sedang</option>
            <option value="Jumbo">Jumbo</option>
          </select>
        </label>

        <label>
          Berat (gram)
          <input name="gram" type="number" min="1" value={form.gram} onChange={onChange} required />
        </label>

        <label className="full">
          Metode Pembayaran
          <select name="payment_method" value={form.payment_method} onChange={onChange}>
            <option value="Bank Transfer Mandiri">Bank Transfer Mandiri</option>
            <option value="Bank Transfer BCA">Bank Transfer BCA</option>
            <option value="Cash">Cash</option>
            <option value="Other">Other</option>
          </select>
        </label>

        {error ? <p className="error full">{error}</p> : null}

        <button type="submit" disabled={loading} className="full">
          {loading ? 'Menyimpan...' : 'Submit Order'}
        </button>
      </form>
    </section>
  );
}
