# UI Design Specification — [BRAND NAME] Food E-commerce

Role: senior UI/UX designer. Complete interface for a small food e-commerce website, "[BRAND NAME]", where customers browse food, order, and pay online, and administrators manage products and orders. Frontend built with Vue.js and Tailwind CSS — every design decision maps to Tailwind tokens (colours, spacing, type scale, radius, shadows). Prices in Nigerian Naira (₦). Most users on mobile phones, often on slow connections: design mobile-first.

## Users and goals
- Customer: find food quickly, trust the price and availability, pay without friction, know what happens to the order.
- Administrator: add and update products fast, see new orders at a glance, move orders through statuses without mistakes.

## Pages
Customer: Home, Shop (catalogue), Product details, Cart, Checkout, Order confirmation, Login/Register, My orders (list and detail), About us, Contact us.
Admin: Login, Overview, Products (list and add/edit form), Categories, Orders (list and detail).
Deliver each page at 1440px (desktop), 768px (tablet) and 390px (mobile).

## Story of the main flow (design around this)
Arrive and orient (Home) → find something appetising (Shop/Product) → build confidence (price, availability, delivery info visible) → commit (Cart, Checkout) → peak moment: payment succeeds and the confirmation screen feels like a reward → ending: clear next steps (order number, status, "View my orders", "Keep shopping").
The order confirmation screen is the emotional peak. Invest extra design effort there.

## Design tokens (Tailwind, no arbitrary values)
Colour (60-30-10): 60% neutrals, 30% white surfaces, 10% accent.
- Page background: gray-50; surfaces: white; borders: gray-100/gray-200
- Text: gray-900 (primary), gray-500 (secondary), gray-400 (tertiary). Never pure black or white text on white
- Single accent: orange-700 (buttons, links, active states), orange-50 for subtle highlights. Use amber-100 for promo badges
- Status colours: emerald (success/paid/delivered), amber (pending/preparing), red-600 (error/cancelled), sky (out for delivery). Never rely on colour alone: pair every status with a text label and icon

Typography: Inter (or system sans). Use the Tailwind scale: text-sm for secondary, text-base for body, text-xl to text-5xl for headings with tracking-tight, font-semibold (not bold) for emphasis, leading-relaxed for body. Use tabular-nums on all prices and quantities.

Spacing: 4-based Tailwind scale only. Component padding p-4 to p-6, section spacing py-12 to py-20, gaps gap-4/gap-6/gap-8.

Shape and depth: rounded-lg for cards, rounded-md for buttons and inputs, rounded-full for badges. shadow-sm for cards, shadow-lg only for modals, drawers and dropdowns.

Motion: transition-colors duration-150 for hover; transition-all duration-200 ease-out for drawers and toasts; nothing over 300ms; respect prefers-reduced-motion.

Imagery: close-up, naturally lit food photography with a consistent crop (4:3 on cards, 1:1 in the cart). Reserve image space to avoid layout shift and show a gray-100 skeleton while loading. Design for optimised, lazy-loaded images.

## Design system (functional + perceptual patterns)
Name components by structure, not content: Button (primary, secondary, ghost, destructive), Input, Select, Search field, Quantity stepper, Card, Badge, Tabs/Chips, Table, Modal, Drawer, Toast, Skeleton, Empty state, Stepper (checkout progress), Navbar, Footer.
Maximum 5 variants per component. For each component show anatomy and all states.

## Required states for every interactive element
Default, hover, focus (visible 2px ring, 3:1 contrast), active/pressed, disabled (40% opacity), loading, error, success, selected. For every list or data view also design: loading (skeleton), empty, error with a retry action.

## Key page requirements
Global navbar: logo, Shop, About, Contact, search, cart icon with live item count (bring the data forward), account menu. On mobile: hamburger or bottom navigation with a sticky cart button. Footer with contact details and links.
Home: promo banner with one clear call to action, category shortcuts, featured items, short trust section (delivery, freshness, payment security), footer.
Shop: search, category chips, sort, product grid (1 column of cards on mobile with 2 per row, 3-4 on desktop). Each card shows image, name, price, availability badge ("In stock", "Low stock", "Sold out") and an "Add to cart" button. Sold-out items are visibly muted and cannot be added.
Product details: image gallery, name, price, description, availability, quantity stepper, "Add to cart" button (sticky at the bottom on mobile), related items.
Cart: item rows with thumbnail, quantity stepper, remove with an Undo toast (no confirmation dialog), order summary, "Proceed to checkout" button. Cart also available as a slide-in drawer from the navbar.
Checkout: single page with a progress stepper (Contact → Delivery → Payment). Prefill saved details, label every field visibly (no placeholder-only fields), inline validation on blur, a sticky order summary (collapsible on mobile), Paystack/Flutterwave payment choice, and a "Pay ₦[TOTAL]" button that shows a loading state and prevents double submission. Cart survives login so users never re-add items.
Payment states to design: Pending payment → Verifying payment → Paid / Payment failed (with a "Try again" action and the cart preserved). The order is shown as paid only after server verification.
Order confirmation: success headline, order number, summary, expected delivery information, "View my orders" and "Keep shopping" buttons.
Login/Register: one screen with a toggle, visible labels, show-password option, inline errors, clear recovery path ("Reset your password").
My orders: card list on mobile and table on desktop with date, total, and status badge (Pending, Paid, Preparing, Out for delivery, Delivered, Cancelled); detail view with item list and status timeline.
About / Contact: brand story with photography; business details (phone, email, address, hours), contact form, map placeholder.
Admin dashboard: left sidebar (collapses to a top bar on mobile), compact data-dense layout for repeated use.
- Overview: cards for new orders, pending orders and low-stock items; recent orders table.
- Products: searchable table with thumbnail, name, category, price, stock, availability toggle, edit/delete. Add/edit form with drag-and-drop image upload and preview, category select, price and stock number inputs (constrained inputs to prevent errors), availability switch, "Save product" button with unsaved-changes warning.
- Categories: simple add/rename/delete list.
- Orders: filter by status, search by order number, detail panel with customer info, delivery address, items, payment status, and a status dropdown that only offers valid next steps (cannot jump from Pending to Delivered).
- Deleting a product uses an Undo toast; deleting a category with products asks for confirmation and explains the consequence.
- Bulk-friendly: keyboard-accessible tables, sticky headers, clear row hover.

## UX writing rules
- Buttons: sentence case, verb + object ("Add to cart", "Save product", "Pay ₦12,500"). Never "Submit" or "OK".
- Page and modal titles in title case; headings below that in sentence case.
- Error pattern: what failed, why, what to do ("Payment failed. Your card was declined. Try another card or payment method."). Never blame the user or show raw error codes.
- Empty states explain and guide ("Your cart is empty. Browse the menu to add something tasty." + "Browse menu" button).
- Success messages in past tense, specific ("Order placed", "Product saved").
- Consistent vocabulary: always "Cart", "Order", "Menu/Shop", "Delivery".
- Plain language, short sentences, 8-14 words where possible.

## Interaction and error prevention
- Provide feedback within 100ms of every action; show skeletons or spinners for anything over 1 second.
- Prefer undo over "Are you sure?" for reversible actions.
- Prevent errors: quantity steppers capped at available stock, Naira-formatted inputs, address autofill where possible, disabled "Pay" button until the form is valid (with the reason shown).
- Define edge cases: out-of-stock while in cart, price changed, failed payment, expired session, offline/slow network, empty search results.

## Accessibility (WCAG 2.2 AA)
Text contrast of at least 4.5:1, touch targets at least 44x44px, full keyboard navigation with logical focus order, visible focus rings, semantic landmarks, alt text for all food images, labelled icon buttons, form errors linked to fields and announced to screen readers, no information conveyed by colour alone.

## Security-aware UX
Show clear "secure payment" cues at checkout. Never display secret keys or payment credentials in the interface. Admin area has a separate, clearly distinct login and visible signed-in role.

## Deliverables
1. Style guide: colour tokens, type scale, spacing, radius, shadow, iconography
2. Component library sheet with all states
3. High-fidelity screens: all pages at desktop, tablet and mobile
4. A clickable prototype of the main flow: Home → Shop → Product → Cart → Checkout → Payment → Confirmation
5. A state sheet: empty, loading, error and success screens for cart, checkout, orders and admin tables
6. Short annotations explaining key design decisions and the responsive behaviour

Use realistic placeholder food items and clearly marked placeholders such as [PRICE] and [BRAND NAME] where real content is missing.
