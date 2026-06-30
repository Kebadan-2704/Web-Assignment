/* ============================================
   APP — Main Application Entry Point
   ============================================ */

import { CONFIG } from './config.js';
import { themeManager } from './theme.js';
import { auth } from './auth.js';
import { cart } from './cart.js';
import { wishlist, compare } from './wishlist.js';
import { searchManager } from './search.js';
import { productManager } from './products.js';
import { animationManager } from './animations.js';
import { router } from './router.js';
import { Drawer, initDropdowns, initHeaderScroll, initBackToTop, initScrollProgress } from './ui.js';
import { eventBus } from './utils.js';
import { ICONS, getInitials } from './helpers.js';

/* Import Page Renderers */
import { renderHome } from '../pages/home.js';
import { renderShop } from '../pages/shop.js';
import { renderProduct } from '../pages/product.js';
import { renderCart } from '../pages/cart.js';
import { renderCheckout } from '../pages/checkout.js';
import { renderLogin, renderRegister, renderForgotPassword } from '../pages/auth.js';
import { 
  renderAccount, renderWishlist, renderCompare, renderOrderSuccess, renderTrackOrder, 
  renderSearchResults, renderCategories, renderCollections, renderAbout, renderContact, 
  renderFAQ, renderBlog, renderPrivacy, renderTerms, renderNotFound 
} from '../pages/secondary.js';

class App {
  async init() {
    console.log(`🚀 Initializing ${CONFIG.APP_NAME} v${CONFIG.APP_VERSION}...`);

    /* 1. Initialize State Managers */
    themeManager.init();
    await auth.init();
    cart.init();
    wishlist.init();
    compare.init();

    /* 2. Load Global Data */
    await productManager.loadData();
    searchManager.init(productManager.getAll());

    /* 3. Setup Routing */
    this._setupRoutes();

    /* 4. Setup Global UI Components */
    this._setupGlobalUI();

    /* 5. Initialize Animations */
    animationManager.init();

    /* 6. Bind Global Events */
    this._bindEvents();

    /* Remove splash screen if it exists */
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 500);
    }
  }

  _setupRoutes() {
    /* Define navigation guards */
    const requireAuth = (to) => {
      if (!auth.isAuthenticated) {
        return '/login';
      }
      return true;
    };

    const requireGuest = (to) => {
      if (auth.isAuthenticated) {
        return '/account';
      }
      return true;
    };

    /* Public Routes */
    router.add(CONFIG.ROUTES.HOME, renderHome, { title: 'Home' })
          .add(CONFIG.ROUTES.SHOP, renderShop, { title: 'Shop' })
          .add(CONFIG.ROUTES.CATEGORIES, renderCategories, { title: 'Categories' })
          .add(CONFIG.ROUTES.COLLECTIONS, renderCollections, { title: 'Collections' })
          .add(CONFIG.ROUTES.PRODUCT, renderProduct, { title: 'Product Detail' })
          .add(CONFIG.ROUTES.SEARCH, renderSearchResults, { title: 'Search Results' })
          
    /* Cart & Checkout */
          .add(CONFIG.ROUTES.CART, renderCart, { title: 'Shopping Cart' })
          .add(CONFIG.ROUTES.CHECKOUT, renderCheckout, { title: 'Checkout' })
          .add(CONFIG.ROUTES.WISHLIST, renderWishlist, { title: 'Wishlist' })
          .add(CONFIG.ROUTES.COMPARE, renderCompare, { title: 'Compare' })
          .add(CONFIG.ROUTES.ORDER_SUCCESS, renderOrderSuccess, { title: 'Order Confirmation' })
          .add(CONFIG.ROUTES.TRACK_ORDER, renderTrackOrder, { title: 'Track Order' })

    /* Auth Routes (Guest Only) */
    router.beforeEach((to) => {
      const authRoutes = [CONFIG.ROUTES.LOGIN, CONFIG.ROUTES.REGISTER, CONFIG.ROUTES.FORGOT_PASSWORD];
      if (authRoutes.includes(to.path)) return requireGuest();
      return true;
    });
    
    router.add(CONFIG.ROUTES.LOGIN, renderLogin, { title: 'Login' })
          .add(CONFIG.ROUTES.REGISTER, renderRegister, { title: 'Create Account' })
          .add(CONFIG.ROUTES.FORGOT_PASSWORD, renderForgotPassword, { title: 'Forgot Password' })

    /* Account Routes (Auth Required) */
    router.beforeEach((to) => {
      if (to.path.startsWith('/account')) return requireAuth();
      return true;
    });

    router.add(CONFIG.ROUTES.ACCOUNT, renderAccount, { title: 'My Account' })
          .add(CONFIG.ROUTES.ACCOUNT_ORDERS, renderAccount, { title: 'My Orders' })
          .add(CONFIG.ROUTES.ACCOUNT_ADDRESSES, renderAccount, { title: 'My Addresses' })
          .add(CONFIG.ROUTES.ACCOUNT_PAYMENTS, renderAccount, { title: 'My Payments' })
          .add(CONFIG.ROUTES.ACCOUNT_SETTINGS, renderAccount, { title: 'Account Settings' })

    /* Content & Legal Pages */
          .add(CONFIG.ROUTES.ABOUT, renderAbout, { title: 'About Us' })
          .add(CONFIG.ROUTES.CONTACT, renderContact, { title: 'Contact Us' })
          .add(CONFIG.ROUTES.FAQ, renderFAQ, { title: 'FAQ' })
          .add(CONFIG.ROUTES.BLOG, renderBlog, { title: 'Blog' })
          .add(CONFIG.ROUTES.PRIVACY, renderPrivacy, { title: 'Privacy Policy' })
          .add(CONFIG.ROUTES.TERMS, renderTerms, { title: 'Terms of Service' })

    /* 404 Not Found */
          .add(CONFIG.ROUTES.NOT_FOUND, renderNotFound, { title: 'Page Not Found' });

    /* Start Router */
    router.init('#page-content');
  }

  _setupGlobalUI() {
    /* Initialize global UI behaviors */
    initDropdowns();
    initHeaderScroll();
    initBackToTop();
    initScrollProgress();

    /* Setup Mobile Menu Drawer */
    this.mobileMenu = new Drawer('#mobile-menu');
    document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
      this.mobileMenu.toggle();
    });

    /* Update dynamic year in footer */
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* Render initial UI states */
    this._updateAuthUI();
  }

  _bindEvents() {
    /* Listen for auth changes to update header */
    eventBus.on('auth:login', () => this._updateAuthUI());
    eventBus.on('auth:logout', () => {
      this._updateAuthUI();
      if (window.location.pathname.startsWith('/account')) {
        router.navigate('/login', true);
      }
    });

    /* Global Logout Button */
    document.addEventListener('click', (e) => {
      if (e.target.closest('#logout-btn')) {
        auth.logout();
      }
    });

    /* Theme Toggle */
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', () => themeManager.toggle());
    });

    /* Close mobile menu on route change */
    eventBus.on('route:changed', () => {
      if (this.mobileMenu?.isOpen) {
        this.mobileMenu.close();
      }
    });
  }

  _updateAuthUI() {
    const user = auth.getUser();
    
    /* Desktop Header User Account Dropdown / Link */
    const accountToggle = document.getElementById('account-toggle');
    const accountDropdownMenu = document.getElementById('account-dropdown-menu');
    
    if (accountToggle) {
      if (user) {
        accountToggle.innerHTML = `
          <div style="width: 32px; height: 32px; border-radius: var(--radius-full); background: var(--gradient-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: var(--fs-xs); font-weight: var(--fw-bold);">${getInitials(user.name)}</div>
        `;
        if (accountDropdownMenu) {
          accountDropdownMenu.innerHTML = `
            <div style="padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border-default);">
              <div style="font-weight: var(--fw-semibold);">${user.name}</div>
              <div class="text-xs text-muted">${user.email}</div>
            </div>
            <a href="/account" class="dropdown__item">${ICONS.user} Dashboard</a>
            <a href="/account/orders" class="dropdown__item">${ICONS.package} Orders</a>
            <button class="dropdown__item text-error" id="logout-btn" style="width: 100%; text-align: left; color: var(--color-error-500);">${ICONS.logout} Logout</button>
          `;
        }
      } else {
        accountToggle.innerHTML = ICONS.user;
        if (accountDropdownMenu) {
          accountDropdownMenu.innerHTML = `
            <a href="/login" class="dropdown__item">${ICONS.user} Sign In</a>
            <a href="/register" class="dropdown__item">${ICONS.user} Create Account</a>
          `;
        }
      }
    }

    /* Mobile Menu Auth Section */
    const mobileAuth = document.getElementById('mobile-auth-section');
    if (mobileAuth) {
      if (user) {
        mobileAuth.innerHTML = `
          <div style="padding: var(--space-4); background: var(--surface-raised); border-radius: var(--radius-lg); margin-bottom: var(--space-4);">
            <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
              <div style="width: 40px; height: 40px; border-radius: var(--radius-full); background: var(--gradient-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: var(--fw-bold);">${getInitials(user.name)}</div>
              <div><div style="font-weight: var(--fw-semibold);">${user.name}</div><div class="text-xs text-muted">${user.email}</div></div>
            </div>
            <a href="/account" class="btn btn--secondary btn--sm btn--block">Go to Dashboard</a>
          </div>
        `;
      } else {
        mobileAuth.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); margin-bottom: var(--space-4);">
            <a href="/login" class="btn btn--secondary">Sign In</a>
            <a href="/register" class="btn btn--primary">Register</a>
          </div>
        `;
      }
    }
  }
}

/* Boot the application when DOM is ready */
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();
});
