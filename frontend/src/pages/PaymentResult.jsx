import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';

const CONFIG = {
  success: {
    glyph: '✓',
    color: 'var(--color-bio)',
    soft: 'var(--color-bio-soft)',
    title: '¡Pago confirmado!',
    text: 'Gracias por tu compra. Ya podés descargar tu material.',
  },
  pending: {
    glyph: '◐',
    color: 'var(--color-mat)',
    soft: 'var(--color-mat-soft)',
    title: 'Pago pendiente',
    text: 'Tu pago se está procesando. Apenas se acredite, vas a poder descargar.',
  },
  failure: {
    glyph: '✕',
    color: 'var(--color-qui)',
    soft: 'var(--color-qui-soft)',
    title: 'No se pudo completar el pago',
    text: 'No te preocupes, no se realizó ningún cargo. Podés intentar de nuevo.',
  },
};

export default function PaymentResult({ kind }) {
  const c = CONFIG[kind];
  const [params] = useSearchParams();
  // MP devuelve el order_id en external_reference.
  const orderId = params.get('external_reference');
  const token = orderId ? localStorage.getItem(`order_${orderId}`) : null;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-5 py-20 text-center sm:px-8">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="flex h-24 w-24 items-center justify-center rounded-full text-5xl"
        style={{ background: c.soft, color: c.color }}
      >
        {c.glyph}
      </motion.div>

      <h1 className="font-display mt-7 text-4xl font-bold sm:text-5xl">{c.title}</h1>
      <p className="mt-3 text-lg text-ink-soft">{c.text}</p>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        {kind === 'success' && orderId && token ? (
          <Link to={`/descarga?order=${orderId}&token=${token}`} className="btn-ink px-7 py-3.5 text-lg">
            Ir a la descarga →
          </Link>
        ) : kind === 'pending' && orderId && token ? (
          <Link to={`/descarga?order=${orderId}&token=${token}`} className="btn-ink px-7 py-3.5 text-lg">
            Revisar estado
          </Link>
        ) : null}
        <Link
          to="/"
          className="label rounded-full border border-ink px-7 py-3.5 transition-colors hover:bg-ink hover:text-paper"
        >
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}
