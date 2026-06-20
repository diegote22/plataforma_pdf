import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminCategories, adminCreateMaterial } from '../../lib/admin.js';

export default function AdminMaterialForm() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category_id: '', title: '', description: '', features: '', price: '', price_view: '',
  });
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => { adminCategories().then(setCategories).catch(() => {}); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    if (!form.category_id) return setErr('Elegí una categoría');
    if (!form.title.trim()) return setErr('Ingresá un título');
    if (!(Number(form.price) >= 0)) return setErr('Precio inválido');
    if (!file) return setErr('Subí el archivo del material');

    const fd = new FormData();
    fd.append('category_id', form.category_id);
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('features', form.features);
    fd.append('price', form.price);
    if (form.price_view !== '') fd.append('price_view', form.price_view);
    fd.append('file', file);
    if (cover) fd.append('cover', cover);

    setBusy(true);
    try {
      await adminCreateMaterial(fd);
      navigate('/admin');
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <Link to="/admin" className="label text-ink-faint hover:text-ink">← Volver al panel</Link>
      <h1 className="font-display mt-4 text-4xl font-black">Subir material</h1>

      <form onSubmit={onSubmit} className="mt-7 grid gap-5">
        <label className="block">
          <span className="label text-ink-soft">Categoría</span>
          <select value={form.category_id} onChange={set('category_id')}
            className="mt-1.5 w-full border border-line bg-paper px-4 py-3 outline-none focus:border-ink">
            <option value="">Elegí una…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>

        <Field label="Título" value={form.title} onChange={set('title')} placeholder="Ej. Resumen: La Célula" />

        <label className="block">
          <span className="label text-ink-soft">Descripción</span>
          <textarea value={form.description} onChange={set('description')} rows={3}
            className="mt-1.5 w-full border border-line bg-paper px-4 py-3 outline-none focus:border-ink" />
        </label>

        <label className="block">
          <span className="label text-ink-soft">Características (separá con ;)</span>
          <input value={form.features} onChange={set('features')} placeholder="12 páginas; Diagramas a color; Glosario"
            className="mt-1.5 w-full border border-line bg-paper px-4 py-3 outline-none focus:border-ink" />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Precio descarga (ARS)" type="number" min="0" value={form.price}
            onChange={set('price')} placeholder="1500" />
          <Field label="Precio ver online (opcional)" type="number" min="0" value={form.price_view}
            onChange={set('price_view')} placeholder="900" />
        </div>
        <p className="-mt-2 text-xs text-ink-faint">
          Dejá vacío “ver online” si ese material solo se vende para descargar.
        </p>

        <FileField label="Archivo del material (PDF, video, zip…)" accept=".pdf,.zip,video/*,image/*"
          file={file} onChange={(e) => setFile(e.target.files?.[0] || null)} required />
        <FileField label="Portada (imagen, opcional)" accept="image/*"
          file={cover} onChange={(e) => setCover(e.target.files?.[0] || null)} />

        {err && <p className="border border-mat bg-mat-soft px-4 py-3 text-sm text-mat">{err}</p>}

        <button type="submit" disabled={busy} className="btn-ink mt-2 py-4 text-lg disabled:opacity-60">
          {busy ? 'Subiendo…' : 'Publicar material'}
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

function FileField({ label, file, ...props }) {
  return (
    <label className="block cursor-pointer">
      <span className="label text-ink-soft">{label}</span>
      <div className="mt-1.5 flex items-center gap-3 border border-dashed border-line bg-paper px-4 py-3">
        <span className="btn-ink px-3 py-1.5 text-sm">Elegir</span>
        <span className="truncate text-sm text-ink-soft">{file ? file.name : 'Ningún archivo'}</span>
      </div>
      <input type="file" className="hidden" {...props} />
    </label>
  );
}
