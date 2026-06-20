import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, isAuthed } from '../../lib/admin.js';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (isAuthed()) { navigate('/admin', { replace: true }); return null; }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminLogin(password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <div className="flex min-h-screen items-center justify-center px-5">
        <form onSubmit={onSubmit} className="w-full max-w-sm border border-line bg-paper-2 p-7">
          <p className="label text-ink-faint">Acceso restringido</p>
          <h1 className="font-display mt-1 text-3xl font-black">Panel admin</h1>
          <p className="mt-2 text-sm text-ink-soft">Ingresá tu contraseña para administrar el catálogo.</p>

          <label className="mt-6 block">
            <span className="label text-ink-soft">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="mt-1.5 w-full border border-line bg-paper px-4 py-3 outline-none focus:border-ink"
            />
          </label>

          {error && <p className="mt-3 border border-mat bg-mat-soft px-3 py-2 text-sm text-mat">{error}</p>}

          <button type="submit" disabled={loading} className="btn-ink mt-5 w-full py-3 disabled:opacity-60">
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </>
  );
}
