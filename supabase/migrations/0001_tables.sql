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
