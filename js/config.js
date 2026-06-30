/* ============================================
   CONFIG — Application Configuration Constants
   ============================================ */

export const CONFIG = {
  APP_NAME: 'LUXE',
  APP_TAGLINE: 'Premium Shopping Experience',
  APP_VERSION: '1.0.0',
  
  /* Supabase Configuration */
  SUPABASE_URL: 'https://nbjhewccwtyuqvohhfhy.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iamhld2Njd3R5dXF2b2hoZmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MDg3OTUsImV4cCI6MjA5ODI4NDc5NX0.VMzwbjvNqUVUKia8e85KlcljFN0e3PhLGmrXxqehCB4',
  USE_SUPABASE_DB: false, // Set to true once you create the products and categories tables in Supabase

  /* Currency */
  CURRENCY: 'USD',
  CURRENCY_SYMBOL: '$',
  LOCALE: 'en-US',
  
  /* Tax & Shipping */
  TAX_RATE: 0.08,
  FREE_SHIPPING_THRESHOLD: 100,
  STANDARD_SHIPPING: 9.99,
  EXPRESS_SHIPPING: 19.99,
  
  /* Pagination */
  PRODUCTS_PER_PAGE: 12,
  
  /* Search */
  SEARCH_DEBOUNCE_MS: 300,
  SEARCH_MIN_CHARS: 2,
  MAX_RECENT_SEARCHES: 5,
  
  /* Cart */
  MAX_QUANTITY: 10,
  MIN_QUANTITY: 1,
  
  /* Compare */
  MAX_COMPARE_ITEMS: 4,
  
  /* Toast */
  TOAST_DURATION: 4000,
  
  /* Carousel */
  HERO_AUTOPLAY_INTERVAL: 5000,
  
  /* Countdown (Flash Sale ends in 24h from now) */
  FLASH_SALE_HOURS: 24,
  
  /* Recently Viewed */
  MAX_RECENT_VIEWED: 10,
  
  /* Coupon Codes (mock) */
  COUPONS: {
    'WELCOME10': { discount: 0.10, type: 'percentage', label: '10% Off' },
    'SAVE20': { discount: 0.20, type: 'percentage', label: '20% Off' },
    'FLAT15': { discount: 15, type: 'fixed', label: '$15 Off' },
    'FREESHIP': { discount: 0, type: 'shipping', label: 'Free Shipping' }
  },

  /* Demo Account */
  DEMO_USER: {
    email: 'demo@luxe.com',
    password: 'Demo@123'
  },

  /* Routes */
  ROUTES: {
    HOME: '/',
    SHOP: '/shop',
    CATEGORIES: '/categories',
    COLLECTIONS: '/collections',
    PRODUCT: '/product/:slug',
    CART: '/cart',
    CHECKOUT: '/checkout',
    WISHLIST: '/wishlist',
    COMPARE: '/compare',
    ORDER_SUCCESS: '/order-success',
    TRACK_ORDER: '/track-order',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    ACCOUNT: '/account',
    ACCOUNT_ORDERS: '/account/orders',
    ACCOUNT_ADDRESSES: '/account/addresses',
    ACCOUNT_PAYMENTS: '/account/payments',
    ACCOUNT_SETTINGS: '/account/settings',
    BLOG: '/blog',
    BLOG_POST: '/blog/:slug',
    ABOUT: '/about',
    CONTACT: '/contact',
    FAQ: '/faq',
    PRIVACY: '/privacy',
    TERMS: '/terms',
    SEARCH: '/search',
    NOT_FOUND: '/404'
  },

  /* Social Links */
  SOCIAL: {
    facebook: '#',
    twitter: '#',
    instagram: '#',
    youtube: '#',
    pinterest: '#'
  },

  /* Contact Info */
  CONTACT: {
    phone: '+1 (555) 123-4567',
    email: 'hello@luxe.com',
    address: '123 Fashion Avenue, New York, NY 10001',
    hours: 'Mon–Fri: 9AM–6PM EST'
  }
};
