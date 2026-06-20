// Carga .env y valida que las variables criticas existan al arrancar.
import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta variable de entorno requerida: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim()),

  supabase: {
    url: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'materials',
  },

  admin: {
    // Password de acceso al panel. Si esta vacio, el login queda deshabilitado.
    password: process.env.ADMIN_PASSWORD || '',
    // Secreto para firmar los JWT de sesion admin.
    jwtSecret: process.env.JWT_SECRET || '',
    tokenTtl: process.env.ADMIN_TOKEN_TTL || '12h',
  },

  mp: {
    accessToken: process.env.MP_ACCESS_TOKEN || '',
    // Secreto de firma del webhook (MP Dashboard > Webhooks). Valida que la
    // notificacion venga de MP y no de un atacante.
    webhookSecret: process.env.MP_WEBHOOK_SECRET || '',
    webhookUrl: process.env.MP_WEBHOOK_URL || '',
    currency: process.env.MP_CURRENCY || 'ARS',
    backUrls: {
      success: process.env.MP_BACK_URL_SUCCESS || '',
      failure: process.env.MP_BACK_URL_FAILURE || '',
      pending: process.env.MP_BACK_URL_PENDING || '',
    },
  },
};
