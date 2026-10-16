-- ============================================================================
-- SommyBite — Migration 0002: Row Level Security
-- Run after 0001. RLS is enabled on every public table; the anon/authenticated
-- keys can only ever see what these policies allow. The Express backend uses
-- the service role key, which bypasses RLS (server-side checks live there).
-- ============================================================================

alter table public.profiles    enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.promo_codes enable row level security;
-- No policy on promo_codes: codes are only read by the backend (service role).

-- ----------------------------------------------------------------------------
-- profiles: read/update your own row. Role changes are blocked by the
-- prevent_self_role_change trigger at the bottom of this file.
-- ----------------------------------------------------------------------------
drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin"
  on public.profiles
  for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles: insert own as customer" on public.profiles;
create policy "profiles: insert own as customer"
  on public.profiles
  for insert
  with check (auth.uid() = id and role = 'customer');

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- products: anyone (anon or signed-in) can read ACTIVE products; only admins
-- can create, update or delete.
-- ----------------------------------------------------------------------------
drop policy if exists "products: public read active" on public.products;
create policy "products: public read active"
  on public.products
  for select
  using (active = true or public.is_admin());

drop policy if exists "products: admin insert" on public.products;
create policy "products: admin insert"
  on public.products
  for insert
  with check (public.is_admin());

drop policy if exists "products: admin update" on public.products;
create policy "products: admin update"
  on public.products
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "products: admin delete" on public.products;
create policy "products: admin delete"
  on public.products
  for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- orders: customers read and create only their own; only admins update
-- (this is what "change order status" means in RLS terms) or delete.
-- ----------------------------------------------------------------------------
drop policy if exists "orders: read own or admin" on public.orders;
create policy "orders: read own or admin"
  on public.orders
  for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders: insert own" on public.orders;
create policy "orders: insert own"
  on public.orders
  for insert
  with check (user_id = auth.uid());

drop policy if exists "orders: admin update" on public.orders;
create policy "orders: admin update"
  on public.orders
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "orders: admin delete" on public.orders;
create policy "orders: admin delete"
  on public.orders
  for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- order_items: same ownership model, joined through the parent order.
-- ----------------------------------------------------------------------------
drop policy if exists "order_items: read own order or admin" on public.order_items;
create policy "order_items: read own order or admin"
  on public.order_items
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "order_items: insert own order" on public.order_items;
create policy "order_items: insert own order"
  on public.order_items
  for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_items: admin update" on public.order_items;
create policy "order_items: admin update"
  on public.order_items
  for update
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and public.is_admin()
    )
  );

drop policy if exists "order_items: admin delete" on public.order_items;
create policy "order_items: admin delete"
  on public.order_items
  for delete
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and public.is_admin()
    )
  );

-- ----------------------------------------------------------------------------
-- Nobody can escalate their own role. RLS policies cannot compare old vs new
-- row values, so this trigger is what enforces it: any request carrying an
-- end-user JWT (auth.uid() is not null — the Supabase JS client from the
-- browser) that tries to change role is rejected. The SQL Editor and the
-- backend service-role key have no auth.uid(), so the one-line admin command
-- in supabase/setup.sql and server-side role maintenance still work.
-- ----------------------------------------------------------------------------
create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'You cannot change your own role.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_role_change on public.profiles;
create trigger prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_self_role_change();
