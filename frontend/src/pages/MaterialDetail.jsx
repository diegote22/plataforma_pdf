import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { getMaterial } from '../lib/api.js';
import { metaFor, fmtPrice } from '../lib/meta.js';
import { Loading, ErrorState } from '../components/States.jsx';

export default function MaterialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getMaterial(id)
      .then((m) => alive && setMaterial(m))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  if (loading) return <Loading label="Abriendo material" />;
  if (error) return <ErrorState message={error} onRetry={() => navigate(0)} />;

  const m = metaFor(material.categories?.slug);
  const features = (material.features || '')
    .split(/[\n;,]+/)
    .map((f) => f.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <Link to="/" className="label text-ink-faint transition-colors hover:text-ink">
        ← Volver al catálogo
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Portada */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden border border-line"
        >
          <div className="flex items-center justify-between px-4 py-2" style={{ background: m.color }}>
            <span className="label text-paper">{material.categories?.name}</span>
            <span className="text-paper" aria-hidden="true">{m.glyph}</span>
          </div>
          <div className="relative aspect-[4/3]" style={{ background: m.soft }}>
            {material.cover_image_url ? (
              <img src={material.cover_image_url} alt={material.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="font-display text-8xl opacity-25" style={{ color: m.color }}>{m.glyph}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <span className="label" style={{ color: m.color }}>
            {material.file_type?.toUpperCase() || 'PDF'} · Descarga digital
          </span>
          <h1 className="font-display mt-2 text-4xl font-bold leading-tight sm:text-5xl">
            {material.title}
          </h1>

          {material.description && (
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">{material.description}</p>
          )}

          {features.length > 0 && (
            <ul className="mt-6 space-y-2">
              {features.map((f, i) => (
                <li key={i} className="flex gap-3 text-ink-soft">
                  <span className="font-mono" style={{ color: m.color }}>{String(i + 1).padStart(2, '0')}</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}

          <hr className="rule my-7" />

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="label text-ink-faint">Precio</span>
              <p className="font-mono text-4xl font-bold">{fmtPrice(material.price)}</p>
            </div>
            <Link to={`/checkout/${material.id}`} className="btn-ink px-8 py-4 text-lg">
              Comprar →
            </Link>
          </div>

          <p className="label mt-5 text-ink-faint">
            🔒 Pago seguro · Descarga inmediata tras la confirmación
          </p>
        </motion.div>
      </div>
    </div>
  );
}
