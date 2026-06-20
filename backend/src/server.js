import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { supabase } from './config/supabase.js';
import categoriesRouter from './routes/categories.js';
import materialsRouter from './routes/materials.js';
import ordersRouter from './routes/orders.js';
import webhooksRouter from './routes/webhooks.js';
import downloadRouter from './routes/download.js';
import adminRouter from './routes/admin.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));

// JSON con limite para evitar DoS por body gigante.
// El webhook de MP firma sobre un manifest (data.id + x-request-id + ts),
// no sobre el body, asi que este parser le sirve igual.
app.use(express.json({ limit: '100kb' }));

// Healthcheck: confirma que el server vive y que Supabase responde.
// No exponemos el mensaje de error de Supabase al cliente; se loguea server-side.
app.get('/health', async (_req, res) => {
  const { error } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true });

  if (error) console.error('[health] supabase error:', error.message);

  res.json({
    status: 'ok',
    supabase: error ? 'error' : 'connected',
  });
});

// Routers
app.use('/api/categories', categoriesRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/download', downloadRouter);
app.use('/api/admin', adminRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler global: nunca filtra stack trace al cliente.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  });
});

app.listen(env.port, () => {
  console.log(`API escuchando en http://localhost:${env.port} [${env.nodeEnv}]`);
});
