# Plataforma de venta de apuntes

Venta de materiales de estudio (PDFs, infografías, resúmenes, audiovisuales).
Compra sin registro → pago con Mercado Pago → descarga.

## Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **DB + Storage:** Supabase (PostgreSQL)
- **Pagos:** Mercado Pago (Checkout + webhook)
- **Hosting:** Railway

## Estructura
```
.
├── backend/          API Express
│   └── src/
│       ├── config/       env + cliente Supabase
│       ├── controllers/  logica por recurso
│       ├── routes/       routers Express
│       ├── services/     Mercado Pago, Storage
│       └── middlewares/  errores, validacion
├── frontend/         React + Vite
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── lib/          cliente API
│       └── hooks/
└── sql/
    └── schema.sql    DDL + seed para Supabase
```

## Arranque

### 1. Base de datos
Pegar `sql/schema.sql` en Supabase Dashboard > SQL Editor y ejecutar.
Crear 2 buckets de Storage:
- `covers` → **público** (portadas del catálogo)
- `materials` → **privado** (archivos vendibles; solo signed URL post-pago)

### 2. Backend
```bash
cd backend
cp .env.example .env   # rellenar valores
npm install
npm run dev
```
Probar: `GET http://localhost:3000/health` → debe responder `supabase: "connected"`.

### 3. Frontend
```bash
cd frontend
npm create vite@latest . -- --template react
cp .env.example .env
npm install
npm run dev
```

## Notas de seguridad
- **Backend-only:** el frontend nunca toca Supabase directo. Todo dato pasa por
  el backend Express, que usa la `SUPABASE_SERVICE_ROLE_KEY` (ignora RLS).
- RLS prendido en las 5 tablas, sin policies → la `ANON key` no lee ni escribe
  nada. Acceso exclusivo via service_role.
- `file_url` nunca se entrega directo: el backend genera una **signed URL**
  temporal del bucket privado `materials` solo si `orders.mp_status='approved'`.
- `mp_payment_id` es `unique` → el webhook de MP es idempotente.
