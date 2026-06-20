// Meta por categoria: color, tinte y glifo. Fallback para slugs desconocidos.
export const CATEGORY_META = {
  biologia: { color: 'var(--color-bio)', soft: 'var(--color-bio-soft)', glyph: '⬡', label: 'Bio' },
  fisica: { color: 'var(--color-fis)', soft: 'var(--color-fis-soft)', glyph: '◎', label: 'Fís' },
  quimica: { color: 'var(--color-qui)', soft: 'var(--color-qui-soft)', glyph: '⬢', label: 'Quí' },
  matematicas: { color: 'var(--color-mat)', soft: 'var(--color-mat-soft)', glyph: '∑', label: 'Mat' },
};

export const metaFor = (slug) =>
  CATEGORY_META[slug] || {
    color: 'var(--color-ink)',
    soft: 'var(--color-paper-2)',
    glyph: '✦',
    label: '·',
  };

// Formato de precio ARS.
export const fmtPrice = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(n));

// Precio mas bajo entre descarga y ver online (para mostrar "desde").
export const lowestPrice = (m) => {
  const opts = [m.price, m.price_view].filter((p) => p != null).map(Number);
  return opts.length ? Math.min(...opts) : Number(m.price);
};

// True si el material ofrece ambas modalidades.
export const hasBothModes = (m) => m.price != null && m.price_view != null;
