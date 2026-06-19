import crypto from 'node:crypto';
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SIGNED_URL_TTL = 300; // segundos (5 min)

// Comparacion en tiempo constante (evita timing attacks al adivinar token).
function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// GET /api/download/:orderId?token=<download_token>
// Devuelve signed URLs temporales SOLO si: token valido + orden aprobada.
// file_url guarda la RUTA del objeto dentro del bucket privado 'materials'.
export const getDownloads = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const token = req.query.token;

  if (!UUID_RE.test(orderId)) {
    return res.status(400).json({ error: 'orderId invalido' });
  }
  if (!token) {
    return res.status(401).json({ error: 'token requerido' });
  }

  // ---- Verificar orden ----
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, mp_status, download_token')
    .eq('id', orderId)
    .maybeSingle();

  if (orderErr) throw orderErr;
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

  // SEC-002: el token debe coincidir (segundo factor).
  if (!safeEqual(token, order.download_token)) {
    return res.status(403).json({ error: 'token invalido' });
  }

  if (order.mp_status !== 'approved') {
    return res.status(403).json({ error: 'Pago no confirmado' });
  }

  // ---- Traer los materiales de la orden ----
  const { data: items, error: itemsErr } = await supabase
    .from('order_items')
    .select('materials(title, file_url)')
    .eq('order_id', orderId);

  if (itemsErr) throw itemsErr;

  // ---- Generar signed URL por cada archivo ----
  const downloads = [];
  for (const item of items) {
    const mat = item.materials;
    if (!mat?.file_url) continue;

    const { data: signed, error: signErr } = await supabase.storage
      .from(env.supabase.storageBucket)
      .createSignedUrl(mat.file_url, SIGNED_URL_TTL);

    if (signErr) throw signErr;
    downloads.push({ title: mat.title, url: signed.signedUrl });
  }

  res.json({ expires_in: SIGNED_URL_TTL, downloads });
});
