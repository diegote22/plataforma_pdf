import { Link, useNavigate } from 'react-router-dom';
import { clearToken } from '../lib/admin.js';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const logout = () => { clearToken(); navigate('/admin/login'); };

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <header className="sticky top-0 z-30 border-b border-line bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link to="/admin" className="flex items-baseline gap-2">
            <span className="font-display text-xl font-black">Apuntes</span>
            <span className="label text-paper/60">panel admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" target="_blank" className="label rounded-full border border-paper/40 px-3 py-1.5 transition-colors hover:bg-paper hover:text-ink">
              Ver sitio ↗
            </Link>
            <button onClick={logout} className="label rounded-full border border-paper/40 px-3 py-1.5 transition-colors hover:bg-paper hover:text-ink">
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="min-h-[80vh]">{children}</main>
    </>
  );
}
