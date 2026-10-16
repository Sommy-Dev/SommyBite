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
