// Cliente Supabase con SERVICE ROLE key.
// Ignora RLS => acceso total. Usar SOLO en backend, jamas exponer al cliente.
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const supabase = createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
