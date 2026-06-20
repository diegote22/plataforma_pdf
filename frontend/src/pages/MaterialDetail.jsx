import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Document, Page } from 'react-pdf';
import '../lib/pdf.js';
import { getMaterial } from '../lib/api.js';
import { metaFor, fmtPrice, hasBothModes } from '../lib/meta.js';
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
    .split(/[\n;,]+/).map((f) => f.trim()).filter(Boolean);
  const both = hasBothModes(material);
  const hasView = material.price_view != null;

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
          className="overflow-hidden border border-line self-start"
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

        {/* Info + compra */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <span className="label" style={{ color: m.color }}>
            {material.file_type?.toUpperCase() || 'PDF'} · Material digital
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

          {/* Opciones de compra */}
          <div className="space-y-3">
            <BuyOption
              to={`/checkout/${material.id}?access=download`}
              title="Descargar"
              desc="Te llevás el archivo. Tuyo para siempre."
              price={material.price}
              accent={m.color}
              primary
            />
            {hasView && (
              <BuyOption
                to={`/checkout/${material.id}?access=view`}
                title="Ver online"
                desc="Leelo en el navegador, modo libro. Más barato."
                price={material.price_view}
                accent={m.color}
              />
            )}
          </div>

          <p className="label mt-5 text-ink-faint">
            🔒 Pago seguro · Acceso inmediato tras la confirmación
          </p>
          {both && (
            <p className="mt-1 text-xs text-ink-faint">
              Elegí cómo querés acceder al material.
            </p>
          )}
        </motion.div>
      </div>

      {/* Vista previa */}
      {material.preview_url && <PreviewSection url={material.preview_url} accent={m.color} />}
    </div>
  );
}

function BuyOption({ to, title, desc, price, accent, primary }) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-between gap-4 border p-4 transition-all hover:-translate-y-0.5 ${
        primary ? 'border-ink bg-ink text-paper' : 'border-line bg-paper-2 hover:border-ink'
      }`}
    >
      <div>
        <p className="font-display text-lg font-bold">{title}</p>
        <p className={`text-sm ${primary ? 'text-paper/70' : 'text-ink-soft'}`}>{desc}</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-xl font-bold" style={!primary ? { color: accent } : undefined}>
          {fmtPrice(price)}
        </p>
        <span className="label opacity-80">Elegir →</span>
      </div>
    </Link>
  );
}

function PreviewSection({ url, accent }) {
  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const calc = () => setWidth(Math.min(520, window.innerWidth - 60));
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  return (
    <section className="mt-14">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-display text-2xl font-bold">Vista previa</h2>
        <span className="label rounded-full px-2.5 py-1" style={{ background: accent, color: 'white' }}>
          3 páginas de muestra
        </span>
      </div>
      <div className="flex flex-col items-center gap-5 border border-line bg-paper-2 py-6">
        <Document file={url} loading={<p className="label py-10 text-ink-faint">Cargando muestra…</p>}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          error={<p className="label py-10 text-mat">No se pudo cargar la vista previa.</p>}>
          {Array.from({ length: numPages }, (_, i) => (
            <div key={i} className="mb-4 border border-line shadow-sm last:mb-0">
              <Page pageNumber={i + 1} width={width} renderTextLayer={false} renderAnnotationLayer={false} />
            </div>
          ))}
        </Document>
      </div>
    </section>
  );
}
