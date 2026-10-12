/** Centralised brand + commerce config.
 *  The promo code, delivery details and brand identity live here so the
 *  design system and the checkout/payflow stay in sync. */
export const BRAND = 'SommyBite'
export const BRAND_TAGLINE = 'Fresh Nigerian food, delivered hot'

export const PROMO_CODE = 'SOMMY20'
export const PROMO_DISCOUNT = 20 // percent off first order
export const PROMO_LABEL = '20% off your first order'

export const HERO_IMAGE = '/images/hero.jpg'
export const HERO_HEADLINE = 'Craving authentic taste?'
export const HERO_SUBTEXT = 'Get 20% off your first order today. Prepared fresh on demand.'

// Trust / value pillars shown below the hero strip
export const FEATURES = [
  { icon: 'clock', title: '30-min Delivery', desc: 'Hot to your doorstep' },
  { icon: 'leaf', title: 'Fresh & Organic', desc: 'Farm-sourced quality' },
  { icon: 'lock', title: 'Secure Checkout', desc: 'Paystack & Flutterwave' },
]

export const DELIVERY = {
  fee: 500, // ₦ flat rate under the free threshold
  freeOver: 10000, // ₦ free delivery above this
  estimate: '25–40 min',
  cutoff: 'Order before 8 PM for same-day delivery',
}

export const LOCATION = {
  name: 'SommyBite Kitchen',
  city: 'Lagos',
  address: '12 Kitchen Lane, Lekki, Lagos',
  phone: '0801 234 5678',
  email: 'hello@sommybite.com',
  hours: 'Open daily, 10 AM – 10 PM',
}

export const SOCIAL = {
  instagram: 'https://instagram.com/sommybite',
  twitter: 'https://twitter.com/sommybite',
}

// Chef's daily special countdown target (24h wall clock, rebuilt by a timer component)
export const CHEF_SPECIAL = {
  label: "Chef's Daily Special",
  countdownTo: '23:59:59',
}
