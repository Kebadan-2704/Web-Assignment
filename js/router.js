/* ============================================
   ROUTER — SPA Router using History API
   Route matching, navigation, guards, transitions
   ============================================ */

import { eventBus } from './utils.js';

/**
 * Router — Client-side SPA router using pushState
 */
class Router {
  constructor() {
    this.routes = [];
    this.currentRoute = null;
    this.beforeHooks = [];
    this.afterHooks = [];
    this._container = null;
  }

  /**
   * Initialize the router
   * @param {string} containerSelector - CSS selector for the page container
   */
  init(containerSelector = '#page-content') {
    this._container = document.querySelector(containerSelector);
    
    /* Listen for popstate (back/forward) */
    window.addEventListener('popstate', () => this._resolve());
    
    /* Intercept link clicks */
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;
      
      const href = anchor.getAttribute('href');
      
      /* Skip external links, hash links, and special protocols */
      if (!href || href.startsWith('http') || href.startsWith('#') || 
          href.startsWith('mailto:') || href.startsWith('tel:') ||
          anchor.hasAttribute('target') || anchor.hasAttribute('download')) {
        return;
      }
      
      e.preventDefault();
      this.navigate(href);
    });

    /* Initial route resolution */
    this._resolve();
  }

  /**
   * Register a route
   * @param {string} path - Route pattern (e.g., '/product/:slug')
   * @param {Function} handler - Async function returning page HTML or calling render
   * @param {Object} options - { title, requiresAuth, layout }
   */
  add(path, handler, options = {}) {
    const paramNames = [];
    const regexPath = path.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });

    this.routes.push({
      path,
      pattern: new RegExp(`^${regexPath}$`),
      paramNames,
      handler,
      options
    });

    return this;
  }

  /**
   * Add a before-navigation guard
   * @param {Function} hook - (to, from) => boolean|string
   */
  beforeEach(hook) {
    this.beforeHooks.push(hook);
    return this;
  }

  /**
   * Add an after-navigation hook
   * @param {Function} hook 
   */
  afterEach(hook) {
    this.afterHooks.push(hook);
    return this;
  }

  /**
   * Navigate to a URL
   * @param {string} url 
   * @param {boolean} replace - Use replaceState instead of pushState
   */
  navigate(url, replace = false) {
    if (url === this._getCurrentPath()) return;
    
    if (replace) {
      history.replaceState(null, '', url);
    } else {
      history.pushState(null, '', url);
    }
    
    this._resolve();
  }

  /**
   * Go back in history
   */
  back() {
    history.back();
  }

  /**
   * Replace current URL without navigation
   * @param {string} url 
   */
  replace(url) {
    this.navigate(url, true);
  }

  /**
   * Get the current path
   * @returns {string}
   */
  _getCurrentPath() {
    return window.location.pathname || '/';
  }

  /**
   * Resolve the current URL to a route and render it
   */
  async _resolve() {
    const path = this._getCurrentPath();
    const queryString = window.location.search;
    const query = Object.fromEntries(new URLSearchParams(queryString));
    
    /* Find matching route */
    let matchedRoute = null;
    let params = {};

    for (const route of this.routes) {
      const match = path.match(route.pattern);
      if (match) {
        matchedRoute = route;
        route.paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });
        break;
      }
    }

    /* 404 fallback */
    if (!matchedRoute) {
      matchedRoute = this.routes.find(r => r.path === '/404') || this.routes[0];
    }

    const to = { path, params, query, route: matchedRoute };
    const from = this.currentRoute;

    /* Run before guards */
    for (const hook of this.beforeHooks) {
      const result = await hook(to, from);
      if (result === false) return;
      if (typeof result === 'string') {
        this.navigate(result, true);
        return;
      }
    }

    /* Page transition */
    await this._transition(matchedRoute, params, query);

    /* Update current route */
    this.currentRoute = to;

    /* Update page title */
    if (matchedRoute.options.title) {
      document.title = `LUXE`;
    }

    /* Update active nav links */
    this._updateActiveLinks(path);

    /* Scroll to top */
    window.scrollTo({ top: 0, behavior: 'instant' });

    /* Run after hooks */
    for (const hook of this.afterHooks) {
      hook(to, from);
    }

    /* Emit route change event */
    eventBus.emit('route:changed', to);
  }

  /**
   * Handle page transition and rendering
   */
  async _transition(route, params, query) {
    if (!this._container) return;

    /* Fade out current content */
    this._container.classList.add('page-exit');
    
    await new Promise(resolve => {
      setTimeout(resolve, 150);
    });

    /* Render new content */
    try {
      const content = await route.handler({ params, query });
      if (typeof content === 'string') {
        this._container.innerHTML = content;
      }
    } catch (error) {
      console.error('Route handler error:', error);
      this._container.innerHTML = `
        <div class="empty-state">
          <h2>Something went wrong</h2>
          <p class="text-secondary">Please try again later.</p>
          <a href="/" class="btn btn--primary">Go Home</a>
        </div>
      `;
    }

    /* Fade in new content */
    this._container.classList.remove('page-exit');
    this._container.classList.add('page-enter');
    
    setTimeout(() => {
      this._container.classList.remove('page-enter');
    }, 500);

    /* Re-initialize scroll animations on new content */
    eventBus.emit('page:rendered');
  }

  /**
   * Update active states on navigation links
   * @param {string} currentPath 
   */
  _updateActiveLinks(currentPath) {
    document.querySelectorAll('[data-nav-link]').forEach(link => {
      const href = link.getAttribute('href');
      const isActive = currentPath === href || 
                       (href !== '/' && currentPath.startsWith(href));
      link.classList.toggle('nav-main__link--active', isActive);
    });
  }
}

/* Export singleton router instance */
export const router = new Router();
