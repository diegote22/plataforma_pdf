import { Link } from 'react-router-dom';
import { Empty } from '../components/States.jsx';

// Las compras se guardan en localStorage como order_<id> = download_token.
function readOrders() {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('order_')) {
      out.push({ orderId: key.slice(6), token: localStorage.getItem(key) });
    }
  }
  return out;
}

export default function MisDescargas() {
  const orders = readOrders();

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <p className="label text-ink-faint">En este navegador</p>
      <h1 className="font-display text-4xl font-black sm:text-5xl">Mis descargas</h1>
      <p className="mt-3 text-ink-soft">
        Tus compras quedan guardadas acá en este dispositivo. Si cambiás de navegador,
        usá el enlace que te dejamos al pagar.
      </p>

      {orders.length === 0 ? (
        <div className="mt-8">
          <Empty message="Todavía no compraste nada desde este navegador." />
          <div className="text-center">
            <Link to="/" className="btn-ink inline-block px-6 py-3">Ir al catálogo</Link>
          </div>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((o) => (
            <li key={o.orderId} className="flex items-center justify-between gap-4 border border-line bg-paper-2 p-4">
              <div className="min-w-0">
                <p className="label text-ink-faint">Orden</p>
                <p className="truncate font-mono text-sm">{o.orderId}</p>
              </div>
              <Link to={`/descarga?order=${o.orderId}&token=${o.token}`} className="btn-ink shrink-0 px-5 py-2.5">
                Ver descarga →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
