/* ============================================
   UTILS — Utility Functions
   Debounce, Throttle, DOM helpers, Observers
   ============================================ */

/**
 * Debounce — delays fn execution until after `delay` ms since last call
 * @param {Function} fn 
 * @param {number} delay 
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle — ensures fn runs at most once every `limit` ms
 * @param {Function} fn 
 * @param {number} limit 
 * @returns {Function}
 */
export function throttle(fn, limit = 100) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

/**
 * Create DOM element with attributes and children
 * @param {string} tag 
 * @param {Object} attrs 
 * @param {...(string|HTMLElement)} children 
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([k, v]) => { el.dataset[k] = v; });
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key === 'innerHTML') {
      el.innerHTML = value;
    } else {
      el.setAttribute(key, value);
    }
  }
  
  children.forEach(child => {
    if (child == null) return;
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof HTMLElement || child instanceof DocumentFragment) {
      el.appendChild(child);
    }
  });
  
  return el;
}

/**
 * Sanitize HTML string to prevent XSS
 * @param {string} str 
 * @returns {string}
 */
export function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

/**
 * Generate a unique ID
 * @param {string} prefix 
 * @returns {string}
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create an Intersection Observer for scroll animations
 * @param {Function} callback 
 * @param {Object} options 
 * @returns {IntersectionObserver}
 */
export function createScrollObserver(callback, options = {}) {
  const defaultOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1,
    ...options
  };
  
  return new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      callback(entry, observer);
    });
  }, defaultOptions);
}

/**
 * Event delegation helper
 * @param {HTMLElement} parent 
 * @param {string} eventType 
 * @param {string} selector 
 * @param {Function} handler 
 */
export function delegate(parent, eventType, selector, handler) {
  parent.addEventListener(eventType, (e) => {
    const target = e.target.closest(selector);
    if (target && parent.contains(target)) {
      handler.call(target, e, target);
    }
  });
}

/**
 * Wait for specified milliseconds
 * @param {number} ms 
 * @returns {Promise}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp a number between min and max
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Simple event emitter for state management
 */
export class EventEmitter {
  constructor() {
    this._events = new Map();
  }

  on(event, callback) {
    if (!this._events.has(event)) {
      this._events.set(event, new Set());
    }
    this._events.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this._events.has(event)) {
      this._events.get(event).delete(callback);
    }
  }

  emit(event, ...args) {
    if (this._events.has(event)) {
      this._events.get(event).forEach(cb => {
        try { cb(...args); } catch (e) { console.error(`Event handler error [${event}]:`, e); }
      });
    }
  }

  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

/**
 * Global event bus for cross-module communication
 */
export const eventBus = new EventEmitter();

/**
 * Smoothly scroll to element
 * @param {string|HTMLElement} target 
 * @param {number} offset 
 */
export function scrollToElement(target, offset = 80) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

/**
 * Detect if reduced motion is preferred
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Trap focus within an element (for modals, drawers)
 * @param {HTMLElement} element 
 * @returns {Function} cleanup function
 */
export function trapFocus(element) {
  const focusableSelectors = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const focusableElements = element.querySelectorAll(focusableSelectors);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown);
  firstFocusable?.focus();

  return () => element.removeEventListener('keydown', handleKeyDown);
}

/**
 * Copy text to clipboard
 * @param {string} text 
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* Fallback for older browsers */
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      textarea.remove();
    }
  }
}

/**
 * Format number with commas
 * @param {number} num 
 * @returns {string}
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}
