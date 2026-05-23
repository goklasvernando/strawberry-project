import { Link, Navigate, Route, Routes } from 'react-router-dom';
import ClientPage from './pages/ClientPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Strawberry Store</h1>
        <nav>
          <Link to="/client">Halaman Pembeli</Link>
          <Link to="/admin">Dashboard Admin</Link>
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/client" replace />} />
          <Route path="/client" element={<ClientPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}
