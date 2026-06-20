import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { getCategories, getMaterials } from '../lib/api.js';
import { metaFor } from '../lib/meta.js';
import MaterialCard from '../components/MaterialCard.jsx';
import { Loading, ErrorState, Empty } from '../components/States.jsx';

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat');
  const q = params.get('q') || '';

  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // categorias una vez
  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  // materiales segun categoria
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getMaterials(cat)
      .then((m) => alive && setMaterials(m))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [cat]);

  // filtro de busqueda (cliente)
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return materials;
    return materials.filter(
      (m) =>
        m.title?.toLowerCase().includes(term) ||
        m.description?.toLowerCase().includes(term)
    );
  }, [materials, q]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const catName = cat ? categories.find((c) => c.slug === cat)?.name || cat : null;
  const isHome = !cat && !q.trim();

  return (
    <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label text-ink-faint">Edición {new Date().getFullYear()}</p>
          <h1 className="font-display text-4xl font-black tracking-tight sm:text-5xl">
            {catName ? catName : 'Descubrir'}
          </h1>
        </div>
        <Link to="/mis-descargas" className="label hidden rounded-full border border-ink px-4 py-2 transition-colors hover:bg-ink hover:text-paper lg:inline-block">
          ↓ Mis descargas
        </Link>
      </div>

      {/* Buscador */}
      <SearchBar
        q={q}
        cat={cat || ''}
        categories={categories}
        onSearch={(v) => setParam('q', v)}
        onCat={(v) => setParam('cat', v)}
      />

      {/* Contenido */}
      {loading ? (
        <Loading label="Buscando material" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setParam('cat', cat)} />
      ) : isHome ? (
        <HomeSections materials={filtered} categories={categories} onCat={(v) => setParam('cat', v)} />
      ) : filtered.length === 0 ? (
        <Empty message={q ? `Sin resultados para “${q}”.` : 'No hay material en esta categoría… por ahora.'} />
      ) : (
        <section className="mt-8">
          <p className="label mb-4 text-ink-faint">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
          <Grid items={filtered} />
        </section>
      )}
    </div>
  );
}

function SearchBar({ q, cat, categories, onSearch, onCat }) {
  const [local, setLocal] = useState(q);
  useEffect(() => setLocal(q), [q]);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSearch(local); }}
      className="mt-6 flex flex-col gap-2 border border-line bg-paper-2 p-2 sm:flex-row sm:items-center"
    >
      <div className="relative sm:w-52">
        <select
          value={cat}
          onChange={(e) => onCat(e.target.value)}
          className="w-full appearance-none border border-line bg-paper px-3 py-3 pr-8 text-sm outline-none focus:border-ink"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint">▾</span>
      </div>

      <div className="flex flex-1 items-center gap-2 border border-line bg-paper px-3">
        <span className="text-ink-faint" aria-hidden="true">⌕</span>
        <input
          value={local}
          onChange={(e) => { setLocal(e.target.value); onSearch(e.target.value); }}
          placeholder="Buscá el material que necesitás…"
          className="w-full bg-transparent py-3 text-base outline-none"
          aria-label="Buscar material"
        />
      </div>

      <button type="submit" className="btn-ink px-6 py-3">Buscar</button>
    </form>
  );
}

function HomeSections({ materials, categories, onCat }) {
  const recommended = materials.slice(0, 8);

  return (
    <div className="mt-9 space-y-12">
      {/* Recomendados */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold">Recomendados</h2>
          <span className="label text-ink-faint">Lo último cargado</span>
        </div>
        {recommended.length ? (
          <Grid items={recommended} />
        ) : (
          <Empty message="Pronto vas a encontrar material acá." />
        )}
      </section>

      {/* Explorar por categoria */}
      <section>
        <h2 className="font-display mb-4 text-2xl font-bold">Explorá por categoría</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {(categories.length ? categories : []).map((c, i) => {
            const m = metaFor(c.slug);
            return (
              <motion.button
                key={c.id}
                onClick={() => onCat(c.slug)}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group flex aspect-square flex-col items-start justify-between overflow-hidden border border-line p-5 text-left transition-all hover:-translate-y-1 hover:shadow-[5px_7px_0_0_var(--color-ink)]"
                style={{ background: m.soft }}
              >
                <span className="font-display text-4xl" style={{ color: m.color }} aria-hidden="true">{m.glyph}</span>
                <span className="font-display text-xl font-bold">{c.name}</span>
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Grid({ items }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((mat, i) => (
        <MaterialCard key={mat.id} material={mat} index={i} />
      ))}
    </div>
  );
}
