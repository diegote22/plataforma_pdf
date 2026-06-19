import { supabase } from '../config/supabase.js';
import { mpPayment, verifyWebhookSignature } from '../services/mercadopago.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

// POST /api/webhooks/mercadopago
// MP notifica cambios de pago. Validamos firma, consultamos el pago real a MP
// y actualizamos la orden. Idempotente: mp_payment_id es UNIQUE en la DB.
export const mercadopagoWebhook = asyncHandler(async (req, res) => {
  // data.id puede venir por query (?data.id=) o en el body.
  const dataId =
    req.query['data.id'] || req.body?.data?.id || req.body?.id;
  const requestId = req.headers['x-request-id'];
  const signatureHeader = req.headers['x-signature'];

  // Solo nos interesan notificaciones de pago.
  const type = req.query.type || req.body?.type;
  if (type && type !== 'payment') return res.sendStatus(200);

  if (!dataId) return res.sendStatus(200);

  // ---- Validar firma ----
  if (!verifyWebhookSignature({ dataId, requestId, signatureHeader })) {
    return res.status(401).json({ error: 'firma invalida' });
  }

  // ---- Consultar el pago REAL a MP (no confiar en el body) ----
  const payment = await mpPayment.get({ id: dataId });
  const orderId = payment.external_reference;
  const status = payment.status; // approved | pending | rejected | ...
  if (!orderId) return res.sendStatus(200);

  // SEC-004: no degradar una orden ya aprobada con una notificacion tardia.
  // Solo se permite cambiar desde 'approved' si es reverso real.
  const { data: current, error: readErr } = await supabase
    .from('orders')
    .select('mp_status')
    .eq('id', orderId)
    .maybeSingle();
  if (readErr) throw readErr;

  const isReversal = status === 'refunded' || status === 'charged_back';
  if (current?.mp_status === 'approved' && !isReversal) {
    return res.sendStatus(200); // ya pagada, ignorar
  }

  // ---- Actualizar la orden ----
  const { error } = await supabase
    .from('orders')
    .update({ mp_status: status, mp_payment_id: String(payment.id) })
    .eq('id', orderId);

  if (error) throw error;

  // Siempre 200 para que MP no reintente en loop.
  res.sendStatus(200);
});
