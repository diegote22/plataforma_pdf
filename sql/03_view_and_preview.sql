-- =====================================================================
-- Doble modalidad (descargar / ver online) + preview de 3 paginas.
-- Ejecutar en: Supabase Dashboard > SQL Editor (despues de 02_*).
--
-- Convencion de precios:
--   materials.price       = precio de DESCARGA (el archivo).
--   materials.price_view  = precio de VER ONLINE (nullable; null = no se ofrece).
--   materials.preview_url  = PDF de muestra (3 paginas) en bucket publico.
-- order_items.access_type = 'download' | 'view'
-- =====================================================================

alter table materials add column if not exists price_view numeric(10,2) check (price_view >= 0);
alter table materials add column if not exists preview_url text;

alter table order_items add column if not exists access_type text not null default 'download';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'order_items_access_chk'
  ) then
    alter table order_items
      add constraint order_items_access_chk check (access_type in ('download', 'view'));
  end if;
end $$;

-- Recrear create_order con modalidad de acceso.
create or replace function create_order(
  p_full_name   text,
  p_email       text,
  p_phone       text,
  p_material_id uuid,
  p_access_type text default 'download'
)
returns table (order_id uuid, total numeric, download_token text)
language plpgsql
set search_path = ''
as $$
declare
  v_price_dl   numeric;
  v_price_view numeric;
  v_price      numeric;
  v_buyer_id   uuid;
  v_order_id   uuid;
  v_token      text;
begin
  if p_access_type not in ('download', 'view') then
    raise exception 'Modalidad inválida' using errcode = 'P0001';
  end if;

  select price, price_view into v_price_dl, v_price_view
    from public.materials
   where id = p_material_id and is_active = true;

  if v_price_dl is null then
    raise exception 'Material no disponible' using errcode = 'P0002';
  end if;

  v_price := case when p_access_type = 'view' then v_price_view else v_price_dl end;
  if v_price is null then
    raise exception 'Modalidad no disponible para este material' using errcode = 'P0003';
  end if;

  insert into public.buyers (full_name, email, phone)
       values (p_full_name, p_email, p_phone)
    returning id into v_buyer_id;

  insert into public.orders (buyer_id, total, mp_status)
       values (v_buyer_id, v_price, 'pending')
    returning id, orders.download_token into v_order_id, v_token;

  insert into public.order_items (order_id, material_id, price_at_purchase, access_type)
       values (v_order_id, p_material_id, v_price, p_access_type);

  return query select v_order_id, v_price, v_token;
end;
$$;
