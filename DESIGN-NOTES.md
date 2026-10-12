# Design Notes — [BRAND NAME]

Annotations for the implementation: tokens, component sheet, responsive behaviour, and the reasoning behind key decisions. The clickable prototype is the app itself: `npm run dev`.

## 1. Style guide (Tailwind tokens only — no arbitrary values)

### Colour (60-30-10)
| Role | Token | Usage |
|---|---|---|
| Page background (60%) | `gray-50` | `body`, app shell |
| Surfaces (30%) | `white` | Cards, navbar, tables |
| Borders | `gray-100` (dividers), `gray-200` (inputs, chips) | Everywhere |
| Text | `gray-900` primary, `gray-500` secondary, `gray-400` tertiary | Never pure black |
| Accent (10%) | `orange-700` buttons/links/active, `orange-50` highlights, `orange-800/900` hover/active | Single accent |
| Promo | `amber-100` bg + `amber-900` text (4.5:1) | Promo badges |
| Status | `emerald` paid/delivered/success · `amber` pending/preparing · `red-600` error/cancelled · `sky` out-for-delivery | Always paired with icon + text label — never colour alone |

### Type
Inter with system fallback. Scale: `text-sm` secondary, `text-base` body, `text-xl–text-5xl` headings, `tracking-tight` on headings, `font-semibold` emphasis, `leading-relaxed` body copy. `tabular-nums` on every price, quantity, and order number.

### Spacing / shape / depth
4-based scale only: component padding `p-4`–`p-6`, sections `py-12`–`py-20`, gaps `gap-4/6/8`. `rounded-lg` cards, `rounded-md` buttons/inputs, `rounded-full` badges. `shadow-sm` cards; `shadow-lg` reserved for modals, drawers, dropdowns.

### Motion
`transition-colors duration-150` hover; `transition-all duration-200 ease-out` drawers/toasts; nothing over 300ms; `prefers-reduced-motion` collapses all animation to ~0ms in `src/index.css`.

### Iconography
Single `Icon.vue` set (Heroicons-outline style, 24 viewBox, `stroke-width 1.5`, `currentColor`). Icon-only buttons always carry an `aria-label`.

## 2. Component sheet (structure-named, ≤5 variants each)
| Component | Variants | States |
|---|---|---|
| `Button` | primary, secondary, ghost, destructive | default, hover, focus-visible 2px ring, active, disabled (40% opacity), loading (spinner + `aria-busy`) |
| `Input` / `Select` / `Textarea` | — | default, focus, error (red border + `role="alert"` + `aria-invalid` + `aria-describedby`), disabled |
| `SearchField` | — | default, has-value (clear button), focus |
| `QuantityStepper` | — | default, min-reached (minus disabled), max-reached (capped at stock), disabled |
| `Card` | default padding | — |
| `Badge` / `StatusBadge` | neutral, success, warning, danger, info, promo, accent | icon + label always |
| `Chip` | selected / unselected | `aria-pressed`, focus ring |
| `Switch` | — | on, off, disabled (`role="switch"`, `aria-checked`) |
| `Modal` / `Drawer` | — | open/close with 200ms transitions, Esc to close, overlay click, focus return, `aria-modal` |
| `Toast` / `Toaster` | default, success, error | auto-dismiss, optional Undo action |
| `Skeleton` | — | `animate-pulse bg-gray-100` on every list while loading (>1s) |
| `EmptyState` / `ErrorState` | — | guidance text + primary action; ErrorState has "Try again" retry |
| `Stepper` | checkout progress | done (check), current (accent), upcoming |
| `Navbar` / `Footer` / `BottomNav` | — | desktop nav + mobile collapsible search + sticky bottom nav with cart badge |

Every list view (shop grid, cart, orders, admin tables) implements loading skeleton → empty state → error with retry → success.

## 3. Responsive behaviour
- **Mobile-first.** Grids: shop `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`; product detail stacks, gallery `aspect-4/3`.
- **Navbar:** full nav + inline search ≥`lg`; search collapses behind a toggle below `lg`; cart button with live count badge is always visible.
- **Bottom navigation** (<`md`): Home, Shop, Cart (badge), Orders, Contact — 56px bar with `safe-area-inset` padding; all pages add `pb-16` so content clears it. Toasts sit above the bar (`bottom-20`).
- **Sticky mobile add-to-cart bar** on product details (`bottom-16`, above the nav).
- **Admin:** left sidebar ≥`md`; below `md` a top bar with horizontally scrolling status pills and an overflow menu. Tables scroll horizontally (`overflow-x-auto`) with sticky-context captions.
- **Checkout summary:** sticky sidebar ≥`lg`, collapsible disclosure <`md`.
- Touch targets: buttons and steppers `min-h-11` (44px); icon buttons `h-11 w-11`.

## 4. Main-flow decisions (Home → … → Confirmation)
- **Confidence before commit:** every card shows price (`tabular-nums`), availability badge ("In stock" / "Low stock" / "Sold out"), and "Only N left" urgency. Delivery fee and free-delivery threshold are visible in cart *and* drawer, with a "Add ₦X more for free delivery" nudge.
- **Cart removal uses Undo**, never a confirmation dialog (reversible action). Undo restores at the original index and clamps to current stock.
- **Checkout:** single page, three labelled steps (Contact → Delivery → Payment). Every field has a visible label (no placeholder-only inputs), validates on blur, and the Pay button stays disabled with the *reason* shown ("Enter your phone number"). Cart survives login: an inline sign-in panel sits inside the Contact step, so items are never re-added.
- **Payment truth:** `processPayment` runs two phases — authorise → **server verify**. The UI shows "Redirecting…" then "Verifying payment…"; the order becomes Paid *only after* the server confirms. On failure: red banner with the "what failed, why, what to do" pattern, "Try again" on the same screen, cart and order preserved (order stays Pending).
- **Confirmation (emotional peak):** centred emerald success hero, large copyable order number, "What happens next" timeline with the promised delivery window, full summary, payment method badge, then two clear exits: "View my orders" (primary) and "Keep shopping" (secondary).
- **Error prevention:** steppers clamp at stock; price input snaps to ₦50 steps and rejects ≤0; stock input clamps 0–9,999; Pay is double-submit guarded (`doubleSubmitGuard` + disabled while paying).

## 5. Edge cases handled
- **Sold out while in cart:** cart re-validates on load; row shows a red "Sold out — removed at checkout" alert, stepper caps at 0, checkout server-rejects with an actionable message.
- **Price changed:** the server is the source of truth — order totals are recalculated from live prices at `createOrder`.
- **Failed payment:** order stays Pending, cart preserved, "Try again" flow.
- **Expired session:** guarded routes redirect to `/auth?next=…`; checkout shows inline sign-in instead of blocking.
- **Offline / slow network:** every API call has 250–700ms simulated latency (skeletons); the footer has a "Simulate offline" switch that makes every call fail fast with a retry-able error state; real `navigator.onLine` is respected by the same path.
- **Empty search results:** Shop shows "No matches found" + "Clear filters".
- **Admin status discipline:** the "Move order" select only offers `STATUS_TRANSITIONS[status]` — you cannot jump Pending → Delivered; cancel requires a confirmation modal that explains the refund consequence.
- **Deletes:** product delete = Undo toast (restores in place). Category delete with products = confirmation modal explaining products move to "Uncategorized" (with Undo restore).
- **Unsaved changes:** product form tracks dirtiness, warns on route leave and tab close, and shows an "Unsaved changes" pill.

## 6. Accessibility (WCAG 2.2 AA)
Skip link, semantic landmarks (`header`, `main`, `nav`, `aside`, `footer`, `table` with `<caption>`), `:focus-visible` 2px orange-700 ring, labelled icon buttons, `aria-current="page"`, `aria-live` toasts and stepper output, errors linked via `aria-describedby` + `role="alert"`, status never colour-only (icon + text), contrast-checked token pairs, 44px minimum targets.

## 7. Security-aware UX
Checkout shows lock icons and "Card details never touch our servers" cues. No secret keys or credentials anywhere in the UI. Admin login is a separate, visually distinct screen ("Staff only") with a visible "Administrator" role badge in the sidebar/top bar. In production, Paystack/Flutterwave run server-side via Express (PRD §9) — this demo simulates the same contract with a two-phase client/server mock.

## 8. Demo shortcuts
- Customer: `demo@brand.ng / demo1234` · Admin: `admin@brand.ng / admin1234`
- Checkout has a "Simulate a declined card" switch to exercise the failed-payment state.
- Placeholder imagery uses emoji + per-item hue gradients; admin photo upload (drag & drop, 5 MB cap, preview) stores a data URL that overrides the placeholder.
