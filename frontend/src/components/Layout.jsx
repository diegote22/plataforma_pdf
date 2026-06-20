import { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { metaFor } from '../lib/meta.js';

const NAV = [
  { to: '/', glyph: '⌂', label: 'Descubrir', cat: null },
  { to: '/?cat=biologia', glyph: '⬡', label: 'Biología', cat: 'biologia' },
  { to: '/?cat=fisica', glyph: '◎', label: 'Física', cat: 'fisica' },
  { to: '/?cat=quimica', glyph: '⬢', label: 'Química', cat: 'quimica' },
  { to: '/?cat=matematicas', glyph: '∑', label: 'Matemáticas', cat: 'matematicas' },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Cerrar drawer al navegar.
  useEffect(() => setOpen(false), [location.key]);

  return (
    <>
      <div className="grain" aria-hidden="true" />

      {/* Sidebar desktop */}
      <Sidebar className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:flex" />

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <Sidebar className="absolute inset-y-0 left-0 flex w-72 max-w-[82%] shadow-2xl" onClose={() => setOpen(false)} />
        </div>
      )}

      {/* Contenido */}
      <div className="lg:pl-64">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/85 px-4 py-3 backdrop-blur-md lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Abrir menú" className="flex h-9 w-9 items-center justify-center border border-line text-lg">
            ≡
          </button>
          <Link to="/" className="font-display text-xl font-black">Apuntes</Link>
          <Link to="/mis-descargas" aria-label="Mis descargas" className="flex h-9 w-9 items-center justify-center border border-line text-lg">
            ↓
          </Link>
        </header>

        <main className="min-h-[80vh]">{children}</main>

        <footer className="mt-20 border-t border-line">
          <div className="mx-auto flex max-w-5xl flex-col gap-1 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="font-display text-lg">Apuntes</p>
            <p className="label text-ink-faint">Material de estudio · Pago seguro con Mercado Pago</p>
          </div>
        </footer>
      </div>
    </>
  );
}

function Sidebar({ className = '', onClose }) {
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const activeCat = params.get('cat');

  const isActive = (item) => pathname === '/' && (activeCat || null) === item.cat;

  return (
    <aside className={`flex-col border-r border-line bg-paper-2 ${className}`}>
      <div className="flex items-center justify-between px-6 py-6">
        <Link to="/" className="flex flex-col leading-none">
          <span className="font-display text-2xl font-black tracking-tight">Apuntes</span>
          <span className="label mt-1 text-ink-faint">índice de estudio</span>
        </Link>
        {onClose && (
          <button onClick={onClose} aria-label="Cerrar" className="text-xl text-ink-faint lg:hidden">✕</button>
        )}
      </div>

      <nav className="flex-1 px-3">
        <p className="label px-3 py-2 text-ink-faint">Menú</p>
        {NAV.map((item) => {
          const active = isActive(item);
          const m = item.cat ? metaFor(item.cat) : null;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${
                active ? 'bg-ink text-paper' : 'hover:bg-paper-3'
              }`}
            >
              <span
                className="flex h-6 w-6 items-center justify-center text-base"
                style={!active && m ? { color: m.color } : undefined}
                aria-hidden="true"
              >
                {item.glyph}
              </span>
              {item.label}
            </Link>
          );
        })}

        <hr className="rule my-4" />

        <Link to="/mis-descargas" className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${pathname === '/mis-descargas' ? 'bg-ink text-paper' : 'hover:bg-paper-3'}`}>
          <span className="flex h-6 w-6 items-center justify-center" aria-hidden="true">↓</span>
          Mis descargas
        </Link>
      </nav>

      <div className="px-6 py-5">
        <p className="label text-ink-faint">Pago seguro</p>
        <p className="mt-1 text-sm text-ink-soft">Mercado Pago · Descarga inmediata</p>
      </div>
    </aside>
  );
}
