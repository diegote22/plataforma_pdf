-- =====================================================================
-- SEC-002: download_token. Segundo factor para la descarga.
-- El comprador solo baja archivos si presenta orderId + token. Sin el
-- token, conocer el orderId no alcanza.
-- Ejecutar en: Supabase Dashboard > SQL Editor (despues de 02_*).
-- =====================================================================

alter table orders
  add column if not exists download_token text not null default gen_random_uuid()::text;

-- Recrear create_order para que genere y devuelva el token.
create or replace function create_order(
  p_full_name   text,
  p_email       text,
  p_phone       text,
  p_material_id uuid
)
returns table (order_id uuid, total numeric, download_token text)
language plpgsql
-- search_path fijo: evita secuestro via schema malicioso (advisor warning).
-- Por eso todas las tablas van calificadas con public.
set search_path = ''
as $$
declare
  v_price    numeric;
  v_buyer_id uuid;
  v_order_id uuid;
  v_token    text;
begin
  select price into v_price
    from public.materials
   where id = p_material_id and is_active = true;

  if v_price is null then
    raise exception 'Material no disponible' using errcode = 'P0002';
  end if;

  insert into public.buyers (full_name, email, phone)
       values (p_full_name, p_email, p_phone)
    returning id into v_buyer_id;

  insert into public.orders (buyer_id, total, mp_status)
       values (v_buyer_id, v_price, 'pending')
    returning id, orders.download_token into v_order_id, v_token;

  insert into public.order_items (order_id, material_id, price_at_purchase)
       values (v_order_id, p_material_id, v_price);

  return query select v_order_id, v_price, v_token;
end;
$$;
