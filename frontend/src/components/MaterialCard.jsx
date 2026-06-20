import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { metaFor, fmtPrice, lowestPrice, hasBothModes } from '../lib/meta.js';

// Card estilo ficha de campo: lomo de color + portada + metadatos en mono.
export default function MaterialCard({ material, index = 0 }) {
  const slug = material.categories?.slug;
  const m = metaFor(slug);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.4), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={`/material/${material.id}`}
        className="group flex h-full flex-col overflow-hidden border border-line bg-paper-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-[5px_7px_0_0_var(--color-ink)]"
      >
        {/* lomo */}
        <div className="flex items-center justify-between px-4 py-2" style={{ background: m.color }}>
          <span className="label text-paper">{material.categories?.name || '—'}</span>
          <span className="text-paper/90" aria-hidden="true">{m.glyph}</span>
        </div>

        {/* portada */}
        <div className="relative aspect-[4/3] overflow-hidden border-b border-line" style={{ background: m.soft }}>
          {material.cover_image_url ? (
            <img
              src={material.cover_image_url}
              alt={material.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-display text-6xl opacity-25" style={{ color: m.color }}>
                {m.glyph}
              </span>
            </div>
          )}
          <span className="label absolute right-2 top-2 bg-paper px-2 py-0.5 uppercase">
            {material.file_type || 'pdf'}
          </span>
        </div>

        {/* cuerpo */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="font-display text-xl font-semibold leading-tight">{material.title}</h3>
          {material.description && (
            <p className="line-clamp-2 text-sm text-ink-soft">{material.description}</p>
          )}
          <div className="mt-auto flex items-end justify-between pt-3">
            <span className="font-mono text-lg font-bold">
              {hasBothModes(material) && <span className="text-xs font-normal text-ink-faint">desde </span>}
              {fmtPrice(lowestPrice(material))}
            </span>
            <span className="label text-ink-faint transition-colors group-hover:text-ink">
              Ver →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
