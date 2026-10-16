-- ============================================================================
-- SOMMYBITE - SUPABASE SETUP (single-file copy of supabase/migrations/)
--
-- HOW TO RUN:
--   1. Open https://supabase.com/dashboard and select your project.
--   2. Left sidebar -> SQL Editor -> "+ New query".
--   3. Paste this ENTIRE file into the editor and click "Run"
--      (or press Ctrl+Enter). Re-running the file is safe.
--
-- CONFIRM THE TABLES EXIST:
--   * Left sidebar -> Table Editor -> you should see five tables:
--     profiles, products, orders, order_items, promo_codes.
--     products should list 14 seeded rows; promo_codes should contain
--     SOMMY20 (20% off, active).
--   * Left sidebar -> Storage -> you should see the "product-images" bucket.
--
-- MAKE YOUR OWN ACCOUNT AN ADMIN - after you sign up in the app, run this
-- ONE line in the SQL Editor (replace the email with yours):
--
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
--
-- It answers "Success. No rows returned" when the email matches an
-- existing account - then reload the app and the admin area unlocks.
-- ============================================================================

-- ============================================================================
-- Migration: 0001_tables.sql
-- ============================================================================
-- ============================================================================
-- SommyBite — Migration 0001: core tables, triggers, promo seed
-- Run order: 0001 → 0002 → 0003 → 0004 (or paste supabase/setup.sql once).
-- Every statement is idempotent-ish (create ... if not exists / drop ... if
-- exists / on conflict do nothing) so the file is safe to re-run.
-- ============================================================================

-- Human-friendly order numbers, shown in the UI as FD-00001.
create sequence if not exists public.order_number_seq start with 1025;

-- ----------------------------------------------------------------------------
-- profiles: 1-to-1 with auth.users. A row is created automatically by the
-- on_auth_user_created trigger below on every signup. role defaults to
-- 'customer' and may only be changed from the SQL Editor / backend service
-- role (see the prevent_self_role_change trigger in 0002).
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  phone      text,
  role       text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- products: id is a text slug (matches the frontend catalogue keys such as
-- 'p-jollof') so cart/order line items stay stable across the two systems.
-- active = false hides the product from customers; admins still see it.
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id           text primary key default 'p-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  name         text not null,
  description  text not null default '',
  price        numeric(12, 2) not null check (price >= 0),
  category_id  text,
  image        text,
  emoji        text,
  hue          integer,
  stock        integer not null default 0 check (stock >= 0),
  active       boolean not null default true,
  featured     boolean not null default false,
  chef_special boolean not null default false,
  tags         text[] not null default '{}',
  rating       numeric(2, 1) not null default 0,
  reviews      integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_active_idx on public.products (active);

-- ----------------------------------------------------------------------------
-- orders: money columns are the SERVER-CALCULATED values (the backend always
-- recalculates from live product prices — frontend totals are never trusted).
-- customer / delivery are snapshot jsonb copied from checkout; timeline is an
-- append-only status trail rendered by the order detail screens.
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  number            bigint not null unique default nextval('public.order_number_seq'),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  status            text not null default 'pending'
                    check (status in ('pending', 'paid', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  payment_status    text not null default 'pending'
                    check (payment_status in ('pending', 'verifying', 'paid', 'failed', 'refunded', 'void')),
  payment_method    text,
  payment_reference text unique,
  subtotal          numeric(12, 2) not null default 0 check (subtotal >= 0),
  discount          numeric(12, 2) not null default 0 check (discount >= 0),
  delivery_fee      numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  total             numeric(12, 2) not null default 0 check (total >= 0),
  promo_code        text,
  customer          jsonb not null default '{}'::jsonb,
  delivery          jsonb not null default '{}'::jsonb,
  timeline          jsonb not null default '[]'::jsonb,
  paid_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- ----------------------------------------------------------------------------
-- order_items: one row per product line, snapshotted (name/price at purchase
-- time) so later price edits never rewrite order history.
-- ----------------------------------------------------------------------------
create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  product_id text references public.products (id) on delete set null,
  name       text not null,
  price      numeric(12, 2) not null check (price >= 0),
  qty        integer not null check (qty > 0),
  emoji      text,
  hue        integer,
  image      text,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ----------------------------------------------------------------------------
-- promo_codes: percent-off codes. Only the backend (service role) reads this
-- table and validates codes server-side; no anon/authenticated read policy.
-- ----------------------------------------------------------------------------
create table if not exists public.promo_codes (
  code        text primary key,
  percent_off integer not null check (percent_off between 1 and 100),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into public.promo_codes (code, percent_off, active)
values ('SOMMY20', 20, true)
on conflict (code) do nothing;

-- ----------------------------------------------------------------------------
-- Triggers
-- ----------------------------------------------------------------------------

-- Keep updated_at honest on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Auto-create a profiles row whenever a user signs up (email or OAuth).
-- security definer so it can write to public.profiles regardless of RLS;
-- search_path pinned to avoid hijacking. Reads signup metadata:
-- full_name and phone are taken from raw_user_meta_data when provided,
-- role is ALWAYS 'customer' here — nobody can self-signup as admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone',
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin check helper used by the RLS policies in 0002/0003.
-- security definer keeps policies on profiles from recursing, and stable
-- lets Postgres evaluate it once per statement.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- Migration: 0002_rls.sql
-- ============================================================================
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

-- ============================================================================
-- Migration: 0003_storage.sql
-- ============================================================================
-- ============================================================================
-- SommyBite — Migration 0003: storage bucket for product images
-- Run after 0002. Bucket is public-read (anyone can view product images);
-- only admins can upload, update or delete files.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB cap, matching the admin upload UI
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read: product images render for logged-out visitors.
drop policy if exists "product images: public read" on storage.objects;
create policy "product images: public read"
  on storage.objects
  for select
  using (bucket_id = 'product-images');

-- Admin-only writes.
drop policy if exists "product images: admin insert" on storage.objects;
create policy "product images: admin insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product images: admin update" on storage.objects;
create policy "product images: admin update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product images: admin delete" on storage.objects;
create policy "product images: admin delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- ============================================================================
-- Migration: 0004_seed_products.sql
-- ============================================================================
-- ============================================================================
-- SommyBite — Migration 0004: seed catalogue
-- Mirrors src/data/catalog.js exactly (same ids, prices, stock, copy) so the
-- Shop page has live data on day one. on conflict (id) do update makes this
-- re-runnable: existing rows are refreshed, not duplicated.
-- ============================================================================

insert into public.products
  (id, name, description, price, category_id, image, emoji, hue, stock, active, featured, chef_special, tags, rating, reviews, created_at)
values
  ('p-jollof', 'Classic Jollof Rice', 'Long-grain rice simmered in a rich tomato and pepper base, smoked over firewood for that deep, savoury flavour. Served with fried plantain on request.', 3500, 'bowls', '/images/jollof.jpg', '🍛', 22, 24, true, true, false, array['popular'], 4.9, 128, '2026-09-01T09:00:00Z'),
  ('p-fried-rice', 'Fried Rice & Plantain', 'Wok-tossed rice with carrots, peas and spring onions, paired with golden fried plantain. A hearty all-day favourite.', 4000, 'combos', '/images/jollof.jpg', '🍚', 32, 18, true, true, false, array['vegetarian'], 4.7, 84, '2026-09-01T09:00:00Z'),
  ('p-ofada', 'Ofada Rice & Stew', 'Unpolished local rice with a spicy ayamase stew made from green bell peppers and assorted meat. Rustic and bold.', 3200, 'bowls', '/images/curry.jpg', '🥘', 26, 12, true, false, false, array['spicy'], 4.6, 61, '2026-09-03T09:00:00Z'),
  ('p-egusi', 'Egusi & Pounded Yam', 'Ground melon soup cooked with leafy greens and smoked fish, served with smooth, hand-pounded yam. A classic pairing.', 4500, 'bowls', '/images/curry.jpg', '🍲', 24, 15, true, true, false, array['popular', 'high-protein'], 4.8, 156, '2026-09-02T09:00:00Z'),
  ('p-ogbono', 'Ogbono Soup (Bowl)', 'Thick, drawy ogbono soup with uziza leaves and assorted meat. Choose your swallow on the side.', 2800, 'bowls', '/images/curry.jpg', '🥣', 30, 8, true, false, false, array['spicy'], 4.5, 43, '2026-09-04T09:00:00Z'),
  ('p-chicken', 'Grilled Chicken (Half)', 'Half chicken marinated in garlic and herbs, grilled until the skin is crisp. Comes with a side of peppered sauce.', 3200, 'grills', '/images/wings.jpg', '🍗', 18, 10, true, true, true, array['popular', 'spicy', 'high-protein'], 4.7, 92, '2026-09-02T09:00:00Z'),
  ('p-suya', 'Beef Suya (Spicy)', 'Skewered beef basted in yaji spice and grilled over open coals. Served with sliced onions and extra spice on the side.', 1500, 'grills', '/images/suya.jpg', '🍢', 16, 20, true, true, false, array['spicy', 'high-protein'], 4.9, 140, '2026-09-05T09:00:00Z'),
  ('p-fish', 'Peppered Fish', 'Whole fish grilled with a fiery pepper sauce. Sold out for today — check back tomorrow morning.', 3800, 'grills', '/images/prawns.jpg', '🐟', 205, 0, true, false, false, array['spicy'], 4.3, 27, '2026-09-06T09:00:00Z'),
  ('p-shawarma', 'Shawarma Wrap', 'Seasoned chicken and fresh vegetables rolled in warm flatbread with garlic sauce.', 1800, 'grills', '/images/placeholders/p-shawarma.svg', '🌯', 36, 16, true, false, false, array['spicy', 'high-protein'], 4.2, 19, '2026-09-07T09:00:00Z'),
  ('p-egg-roll', 'Egg Roll (x2)', 'Crispy golden pastry wrapped around a seasoned egg filling. Perfect with a cold drink.', 900, 'sides', '/images/placeholders/p-egg-roll.svg', '🥚', 42, 30, true, false, false, array['vegetarian'], 4.1, 15, '2026-09-07T09:00:00Z'),
  ('p-moi-moi', 'Moi Moi (Pair)', 'Steamed bean pudding with peppers and sardines, wrapped and served warm. Only a few left today.', 1200, 'sides', '/images/placeholders/p-moi-moi.svg', '🍮', 34, 4, true, false, false, array['high-protein'], 4.6, 58, '2026-09-08T09:00:00Z'),
  ('p-pasta', 'Pasta Bake', 'Baked pasta in a creamy tomato sauce with a melted cheese crust. Comfort food, done right.', 2800, 'sides', '/images/placeholders/p-pasta.svg', '🍝', 28, 6, true, false, false, array['vegetarian'], 4.4, 33, '2026-09-09T09:00:00Z'),
  ('p-zobo', 'Zobo (Chilled)', 'Chilled hibiscus drink, lightly sweetened with ginger and pineapple. Refreshing and natural.', 700, 'drinks', '/images/citrus.jpg', '🥤', 340, 40, true, false, false, array['vegetarian'], 4.8, 109, '2026-09-08T09:00:00Z'),
  ('p-chapman', 'Chapman', 'A bright mix of grenadine, Fanta and citrus garnished with cucumber. A party classic.', 900, 'drinks', '/images/citrus.jpg', '🧃', 14, 25, true, false, false, array['vegetarian'], 4.5, 77, '2026-09-09T09:00:00Z')
on conflict (id) do update set
  name         = excluded.name,
  description  = excluded.description,
  price        = excluded.price,
  category_id  = excluded.category_id,
  image        = excluded.image,
  emoji        = excluded.emoji,
  hue          = excluded.hue,
  stock        = excluded.stock,
  active       = excluded.active,
  featured     = excluded.featured,
  chef_special = excluded.chef_special,
  tags         = excluded.tags,
  rating       = excluded.rating,
  reviews      = excluded.reviews;

-- Discount note: prices above are in Naira (₦), matching the frontend.
