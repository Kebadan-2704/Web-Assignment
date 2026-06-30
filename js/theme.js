/* ============================================
   THEME — Dark / Light Mode Toggle
   ============================================ */

import { localStore } from './storage.js';
import { eventBus } from './utils.js';
import { ICONS } from './helpers.js';

class ThemeManager {
  constructor() {
    this.theme = 'light';
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  }

  /**
   * Initialize theme from stored preference or system
   */
  init() {
    /* Check stored preference */
    const stored = localStore.get('theme');
    
    if (stored) {
      this.theme = stored;
    } else {
      /* Use system preference */
      this.theme = this.mediaQuery.matches ? 'dark' : 'light';
    }

    this._apply(false);

    /* Listen for system preference changes */
    this.mediaQuery.addEventListener('change', (e) => {
      if (!localStore.has('theme')) {
        this.theme = e.matches ? 'dark' : 'light';
        this._apply(true);
      }
    });
  }

  /**
   * Toggle between light and dark
   */
  toggle() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStore.set('theme', this.theme);
    this._apply(true);
  }

  /**
   * Set a specific theme
   * @param {'light'|'dark'} theme 
   */
  set(theme) {
    this.theme = theme;
    localStore.set('theme', this.theme);
    this._apply(true);
  }

  /**
   * Get current theme
   * @returns {string}
   */
  get() {
    return this.theme;
  }

  /**
   * Check if dark mode is active
   * @returns {boolean}
   */
  isDark() {
    return this.theme === 'dark';
  }

  /**
   * Apply the theme to the DOM
   * @param {boolean} animate 
   */
  _apply(animate = true) {
    const root = document.documentElement;
    
    if (animate) {
      document.body.classList.add('theme-transitioning');
      setTimeout(() => {
        document.body.classList.remove('theme-transitioning');
      }, 500);
    }

    root.setAttribute('data-theme', this.theme);
    
    /* Update theme toggle buttons */
    this._updateToggles();
    
    /* Update meta theme-color */
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = this.theme === 'dark' ? '#0b0f19' : '#ffffff';
    }

    /* Emit event */
    eventBus.emit('theme:changed', this.theme);
  }

  /**
   * Update all theme toggle buttons in the DOM
   */
  _updateToggles() {
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      const iconEl = btn.querySelector('.icon');
      if (iconEl) {
        iconEl.innerHTML = this.theme === 'dark' ? ICONS.sun : ICONS.moon;
      }
      btn.setAttribute('aria-label', `Switch to ${this.theme === 'dark' ? 'light' : 'dark'} mode`);
    });
  }
}

export const themeManager = new ThemeManager();
