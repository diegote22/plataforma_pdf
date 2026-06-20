import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getMaterial, createOrder } from '../lib/api.js';
import { metaFor, fmtPrice } from '../lib/meta.js';
import { Loading, ErrorState } from '../components/States.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const access = params.get('access') === 'view' ? 'view' : 'download';
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);

  useEffect(() => {
    let alive = true;
    getMaterial(id)
      .then((m) => alive && setMaterial(m))
      .catch((e) => alive && setLoadErr(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const er = {};
    if (!form.first_name.trim()) er.first_name = 'Ingresá tu nombre';
    if (!form.last_name.trim()) er.last_name = 'Ingresá tu apellido';
    if (!EMAIL_RE.test(form.email.trim())) er.email = 'Email inválido';
    setErrors(er);
    return Object.keys(er).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitErr(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { order_id, download_token, init_point } = await createOrder({
        ...form,
        material_id: id,
        access_type: access,
      });
      // Guardamos el token para recuperarlo al volver del pago.
      localStorage.setItem(`order_${order_id}`, download_token);
      window.location.href = init_point; // a Checkout Pro
    } catch (err) {
      setSubmitErr(err.message);
      setSubmitting(false);
    }
  }

  if (loading) return <Loading label="Preparando compra" />;
  if (loadErr) return <ErrorState message={loadErr} onRetry={() => navigate(0)} />;

  const m = metaFor(material.categories?.slug);
  const unitPrice = access === 'view' ? material.price_view : material.price;
  const modeLabel = access === 'view' ? 'Ver online' : 'Descargar';

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <Link to={`/material/${id}`} className="label text-ink-faint transition-colors hover:text-ink">
        ← Volver al material
      </Link>

      <h1 className="font-display mt-6 text-4xl font-bold sm:text-5xl">Finalizar compra</h1>

      {/* Resumen */}
      <div className="mt-6 flex items-center gap-4 border border-line bg-paper-2 p-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center"
          style={{ background: m.soft }}
        >
          {material.cover_image_url ? (
            <img src={material.cover_image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-3xl" style={{ color: m.color }}>{m.glyph}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="label" style={{ color: m.color }}>{material.categories?.name} · {modeLabel}</p>
          <p className="truncate font-display text-lg font-semibold">{material.title}</p>
        </div>
        <p className="font-mono text-xl font-bold">{fmtPrice(unitPrice)}</p>
      </div>

      {/* Formulario */}
      <form onSubmit={onSubmit} className="mt-8 grid gap-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nombre" value={form.first_name} onChange={set('first_name')}
            error={errors.first_name} autoComplete="given-name" />
          <Field label="Apellido" value={form.last_name} onChange={set('last_name')}
            error={errors.last_name} autoComplete="family-name" />
        </div>
        <Field label="Email" type="email" inputMode="email" value={form.email}
          onChange={set('email')} error={errors.email} autoComplete="email"
          hint="Te enviaremos el comprobante acá." />
        <Field label="Celular (opcional)" type="tel" inputMode="tel" value={form.phone}
          onChange={set('phone')} autoComplete="tel" />

        {submitErr && (
          <p className="border border-mat bg-mat-soft px-4 py-3 text-sm text-mat">{submitErr}</p>
        )}

        <button type="submit" disabled={submitting}
          className="btn-ink mt-2 flex items-center justify-center gap-2 px-6 py-4 text-lg disabled:opacity-60">
          {submitting ? 'Redirigiendo a Mercado Pago…' : `Pagar ${fmtPrice(unitPrice)} →`}
        </button>

        <p className="label text-center text-ink-faint">
          🔒 Vas a pagar de forma segura en Mercado Pago
        </p>
      </form>
    </div>
  );
}

function Field({ label, error, hint, ...props }) {
  return (
    <label className="block">
      <span className="label text-ink-soft">{label}</span>
      <input
        {...props}
        className={`mt-1.5 w-full border bg-paper px-4 py-3 text-base outline-none transition-colors focus:border-ink ${
          error ? 'border-mat' : 'border-line'
        }`}
      />
      {error ? (
        <span className="mt-1 block text-xs text-mat">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-faint">{hint}</span>
      ) : null}
    </label>
  );
}
