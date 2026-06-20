import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  adminMaterials, adminCategories, adminCreateCategory,
  adminUpdateMaterial, adminDeleteMaterial,
} from '../../lib/admin.js';
import { fmtPrice, metaFor } from '../../lib/meta.js';
import { Loading } from '../../components/States.jsx';

export default function AdminDashboard() {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const reload = async () => {
    try {
      const [mats, cats] = await Promise.all([adminMaterials(), adminCategories()]);
      setMaterials(mats);
      setCategories(cats);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  async function toggleActive(m) {
    await adminUpdateMaterial(m.id, { is_active: !m.is_active });
    reload();
  }
  async function remove(m) {
    if (!confirm(`¿Borrar "${m.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await adminDeleteMaterial(m.id);
      reload();
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) return <Loading label="Cargando panel" />;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label text-ink-faint">Administración</p>
          <h1 className="font-display text-4xl font-black">Catálogo</h1>
        </div>
        <Link to="/admin/material/nuevo" className="btn-ink px-5 py-3">+ Subir material</Link>
      </div>

      {err && <p className="mt-4 border border-mat bg-mat-soft px-4 py-2 text-sm text-mat">{err}</p>}

      {/* Categorias */}
      <CategoriesPanel categories={categories} onCreated={reload} />

      {/* Materiales */}
      <section className="mt-10">
        <h2 className="font-display mb-4 text-2xl font-bold">Materiales ({materials.length})</h2>
        {materials.length === 0 ? (
          <p className="border border-line bg-paper-2 p-6 text-center text-ink-soft">
            Todavía no hay materiales. Subí el primero con “+ Subir material”.
          </p>
        ) : (
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-paper-3">
                <tr className="label">
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => {
                  const meta = metaFor(m.categories?.slug);
                  return (
                    <tr key={m.id} className="border-t border-line">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center" style={{ background: meta.soft, color: meta.color }}>
                            {m.cover_image_url
                              ? <img src={m.cover_image_url} alt="" className="h-full w-full object-cover" />
                              : meta.glyph}
                          </span>
                          <span className="font-medium">{m.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{m.categories?.name || '—'}</td>
                      <td className="px-4 py-3 font-mono">{fmtPrice(m.price)}</td>
                      <td className="px-4 py-3">
                        <span className={`label rounded-full px-2.5 py-1 ${m.is_active ? 'bg-bio-soft text-bio' : 'bg-paper-3 text-ink-faint'}`}>
                          {m.is_active ? 'Activo' : 'Oculto'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => toggleActive(m)} className="label rounded-full border border-line px-3 py-1.5 hover:border-ink">
                            {m.is_active ? 'Ocultar' : 'Activar'}
                          </button>
                          <button onClick={() => remove(m)} className="label rounded-full border border-mat px-3 py-1.5 text-mat hover:bg-mat hover:text-paper">
                            Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function CategoriesPanel({ categories, onCreated }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function add(e) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) return;
    setBusy(true);
    try {
      await adminCreateCategory({ name: name.trim(), icon: icon.trim() });
      setName(''); setIcon('');
      onCreated();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 border border-line bg-paper-2 p-5">
      <h2 className="font-display text-xl font-bold">Categorías</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {categories.map((c) => {
          const meta = metaFor(c.slug);
          return (
            <span key={c.id} className="label flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5" style={{ color: meta.color }}>
              <span aria-hidden="true">{c.icon || meta.glyph}</span>{c.name}
            </span>
          );
        })}
      </div>

      <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="label text-ink-soft">Nueva categoría</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Fisiología"
            className="mt-1 block w-48 border border-line bg-paper px-3 py-2 outline-none focus:border-ink" />
        </label>
        <label className="block">
          <span className="label text-ink-soft">Ícono (opcional)</span>
          <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="❤" maxLength={2}
            className="mt-1 block w-24 border border-line bg-paper px-3 py-2 outline-none focus:border-ink" />
        </label>
        <button type="submit" disabled={busy} className="btn-ink px-4 py-2 disabled:opacity-60">
          {busy ? 'Creando…' : 'Agregar'}
        </button>
      </form>
      {err && <p className="mt-2 text-sm text-mat">{err}</p>}
    </section>
  );
}
