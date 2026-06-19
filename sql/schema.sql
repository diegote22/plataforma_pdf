-- =====================================================================
-- Plataforma de venta de apuntes — esquema PostgreSQL (Supabase)
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =====================================================================

-- Extensión para gen_random_uuid() (Postgres 13+ ya la trae vía pgcrypto)
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create table if not exists categories (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  slug  text not null unique,
  icon  text
);

-- ---------------------------------------------------------------------
-- materials
-- ---------------------------------------------------------------------
create table if not exists materials (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid not null references categories(id) on delete restrict,
  title           text not null,
  description     text,
  features        text,
  price           numeric(10,2) not null check (price >= 0),
  cover_image_url text,
  file_url        text,
  file_type       text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists idx_materials_category on materials(category_id);
create index if not exists idx_materials_active   on materials(is_active);

-- ---------------------------------------------------------------------
-- buyers
-- ---------------------------------------------------------------------
create table if not exists buyers (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  email      text not null,
  phone      text,
  created_at timestamptz not null default now()
);

create index if not exists idx_buyers_email on buyers(email);

-- ---------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------
create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  buyer_id      uuid not null references buyers(id) on delete restrict,
  -- unique: idempotencia. MP reenvia webhooks; evita procesar 2 veces.
  -- nullable: varias orders 'pending' pueden tener mp_payment_id = null.
  mp_payment_id text unique,
  mp_status     text not null default 'pending',
  total         numeric(10,2) not null check (total >= 0),
  created_at    timestamptz not null default now()
);

create index if not exists idx_orders_buyer      on orders(buyer_id);
create index if not exists idx_orders_mp_payment on orders(mp_payment_id);

-- ---------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------
create table if not exists order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references orders(id) on delete cascade,
  material_id       uuid not null references materials(id) on delete restrict,
  price_at_purchase numeric(10,2) not null check (price_at_purchase >= 0)
);

create index if not exists idx_order_items_order    on order_items(order_id);
create index if not exists idx_order_items_material on order_items(material_id);

-- =====================================================================
-- Row Level Security (RLS)
-- =====================================================================
-- Arquitectura backend-only: TODO acceso a datos pasa por el backend
-- Express, que usa la SERVICE_ROLE key (ignora RLS). El frontend NUNCA
-- toca Supabase directo. Por eso: RLS prendido en todas las tablas y
-- SIN policies => la anon key no puede leer ni escribir nada. file_url
-- jamas sale de la DB salvo signed URL temporal que genera el backend.

alter table categories  enable row level security;
alter table materials   enable row level security;
alter table buyers      enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;

-- Sin policies en ninguna tabla => acceso exclusivo via service_role.

-- =====================================================================
-- Seed de categorías base
-- =====================================================================
insert into categories (name, slug, icon) values
  ('Biología',    'biologia',    'dna'),
  ('Física',      'fisica',      'atom'),
  ('Química',     'quimica',     'flask'),
  ('Matemáticas', 'matematicas', 'sigma')
on conflict (slug) do nothing;
