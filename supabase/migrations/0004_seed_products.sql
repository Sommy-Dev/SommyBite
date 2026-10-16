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
