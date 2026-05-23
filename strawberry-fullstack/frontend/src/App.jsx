import { Link, Navigate, Route, Routes } from 'react-router-dom';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Strawberry Store</h1>
        <nav>
          <a href="http://localhost:5500/strawberry-single-page.html">Halaman Pembeli</a>
          <Link to="/admin">Dashboard Admin</Link>
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<AdminPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
