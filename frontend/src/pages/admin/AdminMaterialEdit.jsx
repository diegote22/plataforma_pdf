import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminGetMaterial, adminUpdateMaterial } from '../../lib/admin.js';
import { Loading, ErrorState } from '../../components/States.jsx';

export default function AdminMaterialEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loadErr, setLoadErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    adminGetMaterial(id)
      .then((m) => setForm({
        title: m.title || '',
        description: m.description || '',
        features: m.features || '',
        price: m.price ?? '',
        price_view: m.price_view ?? '',
        is_active: m.is_active,
        _category: m.categories?.name,
        _file_type: m.file_type,
      }))
      .catch((e) => setLoadErr(e.message));
  }, [id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    if (!form.title.trim()) return setErr('El título no puede quedar vacío');
    if (!(Number(form.price) >= 0)) return setErr('Precio de descarga inválido');

    setBusy(true);
    try {
      await adminUpdateMaterial(id, {
        title: form.title,
        description: form.description,
        features: form.features,
        price: form.price,
        price_view: form.price_view === '' ? null : form.price_view,
        is_active: form.is_active,
      });
      navigate('/admin');
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  if (loadErr) return <ErrorState message={loadErr} onRetry={() => navigate(0)} />;
  if (!form) return <Loading label="Cargando material" />;

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <Link to="/admin" className="label text-ink-faint hover:text-ink">← Volver al panel</Link>
      <h1 className="font-display mt-4 text-4xl font-black">Editar material</h1>
      <p className="mt-1 text-sm text-ink-faint">
        {form._category} · {form._file_type?.toUpperCase()} · El archivo no se cambia desde acá.
      </p>

      <form onSubmit={onSubmit} className="mt-7 grid gap-5">
        <Field label="Título" value={form.title} onChange={set('title')} />

        <label className="block">
          <span className="label text-ink-soft">Descripción</span>
          <textarea value={form.description} onChange={set('description')} rows={3}
            className="mt-1.5 w-full border border-line bg-paper px-4 py-3 outline-none focus:border-ink" />
        </label>

        <label className="block">
          <span className="label text-ink-soft">Características (separá con ;)</span>
          <input value={form.features} onChange={set('features')}
            className="mt-1.5 w-full border border-line bg-paper px-4 py-3 outline-none focus:border-ink" />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Precio descarga (ARS)" type="number" min="0" value={form.price} onChange={set('price')} />
          <Field label="Precio ver online (vacío = no se ofrece)" type="number" min="0"
            value={form.price_view} onChange={set('price_view')} />
        </div>

        <label className="flex items-center gap-3">
          <input type="checkbox" checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            className="h-5 w-5" />
          <span className="text-sm">Activo (visible en el catálogo)</span>
        </label>

        {err && <p className="border border-mat bg-mat-soft px-4 py-3 text-sm text-mat">{err}</p>}

        <button type="submit" disabled={busy} className="btn-ink mt-2 py-4 text-lg disabled:opacity-60">
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="label text-ink-soft">{label}</span>
      <input {...props}
        className="mt-1.5 w-full border border-line bg-paper px-4 py-3 outline-none focus:border-ink" />
    </label>
  );
}
