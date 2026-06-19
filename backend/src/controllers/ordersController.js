import { supabase } from '../config/supabase.js';
import { mpPreference } from '../services/mercadopago.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

// POST /api/orders
// body: { first_name, last_name, email, phone, material_id }
// Crea buyer+order+order_item (RPC atomico) y una preferencia de pago MP.
// Devuelve { order_id, init_point }.
export const createOrder = asyncHandler(async (req, res) => {
  const first_name = str(req.body.first_name);
  const last_name = str(req.body.last_name);
  const email = str(req.body.email);
  const phone = str(req.body.phone);
  const material_id = str(req.body.material_id);

  // ---- Validacion ----
  const errors = [];
  if (!first_name) errors.push('first_name requerido');
  if (!last_name) errors.push('last_name requerido');
  if (!EMAIL_RE.test(email)) errors.push('email invalido');
  if (!UUID_RE.test(material_id)) errors.push('material_id invalido');
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });

  // ---- Crear orden atomica (precio sale de la DB, no del cliente) ----
  const { data, error } = await supabase.rpc('create_order', {
    p_full_name: `${first_name} ${last_name}`,
    p_email: email,
    p_phone: phone,
    p_material_id: material_id,
  });

  if (error) {
    // P0002 = material no disponible (lo levanta la function)
    if (error.code === 'P0002' || /no disponible/i.test(error.message)) {
      return res.status(404).json({ error: 'Material no disponible' });
    }
    throw error;
  }

  const { order_id, total, download_token } = data[0];

  // ---- Preferencia de pago MP ----
  // external_reference = order_id -> el webhook sabe que orden actualizar.
  const body = {
    items: [
      {
        id: material_id,
        title: 'Material de estudio',
        quantity: 1,
        unit_price: Number(total),
        currency_id: env.mp.currency,
      },
    ],
    payer: { name: first_name, surname: last_name, email },
    external_reference: order_id,
    back_urls: env.mp.backUrls,
  };

  // notification_url y auto_return solo si tenemos URLs publicas (https).
  // MP rechaza auto_return con back_urls de localhost.
  if (env.mp.webhookUrl) body.notification_url = env.mp.webhookUrl;
  if (env.mp.backUrls.success?.startsWith('https')) body.auto_return = 'approved';

  const pref = await mpPreference.create({ body });

  res.status(201).json({
    order_id,
    download_token, // el front lo guarda; lo necesita para descargar
    init_point: pref.init_point,
  });
});
