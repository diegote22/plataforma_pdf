import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getDownloads } from '../lib/api.js';
import { Loading } from '../components/States.jsx';

// El webhook de MP puede tardar unos segundos en confirmar. Si el pago aun
// no esta aprobado (403), reintentamos unas veces antes de rendirnos.
const MAX_RETRIES = 5;

export default function Download() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const token = params.get('token');

  const [state, setState] = useState('loading'); // loading | ready | pending | error
  const [downloads, setDownloads] = useState([]);
  const [message, setMessage] = useState('');
  const [tries, setTries] = useState(0);

  const fetchOnce = useCallback(async () => {
    try {
      const data = await getDownloads(orderId, token);
      setDownloads(data.downloads || []);
      setState('ready');
    } catch (e) {
      if (e.status === 403 && /confirmado/i.test(e.message)) {
        setState('pending');
      } else {
        setMessage(e.message);
        setState('error');
      }
    }
  }, [orderId, token]);

  useEffect(() => {
    if (!orderId || !token) {
      setState('error');
      setMessage('Link de descarga incompleto.');
      return;
    }
    fetchOnce();
  }, [orderId, token, fetchOnce]);

  // Reintento automatico mientras el pago esta pendiente.
  useEffect(() => {
    if (state !== 'pending' || tries >= MAX_RETRIES) return;
    const t = setTimeout(() => {
      setTries((n) => n + 1);
      fetchOnce();
    }, 4000);
    return () => clearTimeout(t);
  }, [state, tries, fetchOnce]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
      {state === 'loading' && <Loading label="Verificando tu compra" />}

      {state === 'pending' && (
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-line border-t-ink" />
          <h1 className="font-display mt-6 text-3xl font-bold">Confirmando el pago…</h1>
          <p className="mt-2 text-ink-soft">
            Esto puede tardar unos segundos. Estamos esperando la confirmación de Mercado Pago.
          </p>
          {tries >= MAX_RETRIES && (
            <div className="mt-6">
              <p className="text-ink-soft">Está tardando más de lo normal.</p>
              <button onClick={() => { setTries(0); setState('pending'); }} className="btn-ink mt-4 px-6 py-3">
                Reintentar
              </button>
            </div>
          )}
        </div>
      )}

      {state === 'ready' && (
        <div>
          <span className="label" style={{ color: 'var(--color-bio)' }}>Compra confirmada</span>
          <h1 className="font-display mt-2 text-4xl font-bold sm:text-5xl">Tu material</h1>
          <p className="mt-3 text-ink-soft">
            Los enlaces son temporales (5 min). Si vencen, recargá esta página.
          </p>

          <ul className="mt-8 space-y-3">
            {downloads.map((d, i) => (
              <li key={i} className="flex items-center justify-between gap-4 border border-line bg-paper-2 p-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <p className="font-display text-lg font-semibold">{d.title}</p>
                    <span className="label text-ink-faint">
                      {d.access_type === 'view' ? 'Lectura online' : 'Descarga'}
                    </span>
                  </div>
                </div>
                {d.access_type === 'view' ? (
                  <Link to={`/leer?order=${orderId}&token=${token}&i=${i}`} className="btn-ink shrink-0 px-5 py-2.5">
                    Leer online →
                  </Link>
                ) : (
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="btn-ink shrink-0 px-5 py-2.5">
                    Descargar ↓
                  </a>
                )}
              </li>
            ))}
          </ul>

          <Link to="/" className="label mt-10 inline-block text-ink-faint hover:text-ink">
            ← Seguir explorando
          </Link>
        </div>
      )}

      {state === 'error' && (
        <div className="text-center">
          <p className="font-display text-3xl">No pudimos mostrar la descarga.</p>
          <p className="mt-2 text-ink-soft">{message}</p>
          <Link to="/" className="btn-ink mt-6 inline-block px-6 py-3">Volver al catálogo</Link>
        </div>
      )}
    </div>
  );
}
