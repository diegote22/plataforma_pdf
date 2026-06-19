// Cliente Mercado Pago (SDK v2) + helpers de firma de webhook.
import crypto from 'node:crypto';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { env } from '../config/env.js';

const client = new MercadoPagoConfig({ accessToken: env.mp.accessToken });

export const mpPreference = new Preference(client);
export const mpPayment = new Payment(client);

// Valida la firma del webhook de MP.
// MP arma el manifest: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
// y firma con HMAC-SHA256 usando el webhook secret. Comparamos contra v1.
export function verifyWebhookSignature({ dataId, requestId, signatureHeader }) {
  if (!env.mp.webhookSecret || !signatureHeader) return false;

  // header: "ts=1700000000,v1=abcdef..."
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((kv) => kv.split('=').map((s) => s.trim()))
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto
    .createHmac('sha256', env.mp.webhookSecret)
    .update(manifest)
    .digest('hex');

  // Comparacion en tiempo constante (evita timing attacks).
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
