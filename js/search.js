/* ============================================
   SEARCH — Instant Search with Suggestions
   ============================================ */

import { debounce, eventBus } from './utils.js';
import { localStore } from './storage.js';
import { CONFIG } from './config.js';
import { ICONS, icon, truncateText } from './helpers.js';
import { router } from './router.js';

class SearchManager {
  constructor() {
    this.products = [];
    this.recentSearches = [];
    this.popularSearches = ['Leather Jacket', 'Running Shoes', 'Wireless Headphones', 'Sunglasses', 'Watch'];
    this._searchInput = null;
    this._dropdown = null;
    this._isOpen = false;
  }

  init(products) {
    this.products = products;
    this.recentSearches = localStore.get('recentSearches', []);
    this._bindEvents();
  }

  _bindEvents() {
    /* Desktop search */
    this._searchInput = document.querySelector('#search-input');
    this._dropdown = document.querySelector('#search-dropdown');

    if (!this._searchInput) return;

    /* Debounced search */
    const debouncedSearch = debounce((query) => {
      this._handleSearch(query);
    }, CONFIG.SEARCH_DEBOUNCE_MS);

    this._searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value.trim());
    });

    this._searchInput.addEventListener('focus', () => {
      if (!this._searchInput.value.trim()) {
        this._showDefault();
      }
      this._openDropdown();
    });

    /* Close on outside click */
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-bar')) {
        this._closeDropdown();
      }
    });

    /* Keyboard navigation */
    this._searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this._closeDropdown();
        this._searchInput.blur();
      } else if (e.key === 'Enter') {
        const query = this._searchInput.value.trim();
        if (query) {
          this._submitSearch(query);
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this._navigateResults(e.key === 'ArrowDown' ? 1 : -1);
      }
    });
  }

  _handleSearch(query) {
    if (!query || query.length < CONFIG.SEARCH_MIN_CHARS) {
      this._showDefault();
      return;
    }

    const results = this.search(query);
    this._renderResults(query, results);
    this._openDropdown();
  }

  /**
   * Search products by query
   */
  search(query) {
    const q = query.toLowerCase();
    return this.products
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      )
      .slice(0, 8);
  }

  _renderResults(query, results) {
    if (!this._dropdown) return;

    if (results.length === 0) {
      this._dropdown.innerHTML = `
        <div class="search-dropdown__section" style="padding: var(--space-6); text-align: center;">
          <p style="color: var(--text-secondary); font-size: var(--fs-sm);">No results found for "<strong>${query}</strong>"</p>
          <p style="color: var(--text-tertiary); font-size: var(--fs-xs); margin-top: var(--space-2);">Try a different search term</p>
        </div>
      `;
      return;
    }

    this._dropdown.innerHTML = `
      <div class="search-dropdown__section">
        <div class="search-dropdown__title">Products (${results.length})</div>
        ${results.map(product => `
          <div class="search-dropdown__item" data-search-result data-slug="${product.slug}" role="option">
            <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: ${product.gradient || 'var(--surface-overlay)'}; flex-shrink: 0;"></div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: var(--fs-sm); font-weight: var(--fw-medium); color: var(--text-primary);">${this._highlightMatch(product.name, query)}</div>
              <div style="font-size: var(--fs-xs); color: var(--text-tertiary);">${product.category}</div>
            </div>
            <div style="font-size: var(--fs-sm); font-weight: var(--fw-semibold); color: var(--text-primary);">$${product.salePrice || product.price}</div>
          </div>
        `).join('')}
      </div>
      <div style="padding: var(--space-2) var(--space-3); border-top: 1px solid var(--border-default);">
        <button class="search-dropdown__item" data-search-all style="width: 100%; color: var(--color-primary-600); font-weight: var(--fw-medium); font-size: var(--fs-sm);">
          View all results for "${query}" →
        </button>
      </div>
    `;

    /* Bind click handlers */
    this._dropdown.querySelectorAll('[data-search-result]').forEach(item => {
      item.addEventListener('click', () => {
        const slug = item.dataset.slug;
        router.navigate(`/product/${slug}`);
        this._closeDropdown();
        this._searchInput.value = '';
      });
    });

    this._dropdown.querySelector('[data-search-all]')?.addEventListener('click', () => {
      this._submitSearch(query);
    });
  }

  _showDefault() {
    if (!this._dropdown) return;

    const recentHTML = this.recentSearches.length > 0 ? `
      <div class="search-dropdown__section">
        <div class="search-dropdown__title">Recent Searches</div>
        ${this.recentSearches.map(term => `
          <div class="search-dropdown__item" data-recent-search="${term}">
            ${icon('clock')}
            <span style="flex: 1; font-size: var(--fs-sm);">${term}</span>
            <button data-remove-recent="${term}" style="color: var(--text-tertiary); padding: 2px;" aria-label="Remove">${ICONS.close}</button>
          </div>
        `).join('')}
      </div>
    ` : '';

    this._dropdown.innerHTML = `
      ${recentHTML}
      <div class="search-dropdown__section">
        <div class="search-dropdown__title">Popular Searches</div>
        ${this.popularSearches.map(term => `
          <div class="search-dropdown__item" data-popular-search="${term}">
            ${icon('search')}
            <span style="flex: 1; font-size: var(--fs-sm);">${term}</span>
          </div>
        `).join('')}
      </div>
    `;

    /* Bind handlers */
    this._dropdown.querySelectorAll('[data-recent-search]').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('[data-remove-recent]')) return;
        this._searchInput.value = item.dataset.recentSearch;
        this._handleSearch(item.dataset.recentSearch);
      });
    });

    this._dropdown.querySelectorAll('[data-remove-recent]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeRecentSearch(btn.dataset.removeRecent);
        this._showDefault();
      });
    });

    this._dropdown.querySelectorAll('[data-popular-search]').forEach(item => {
      item.addEventListener('click', () => {
        this._searchInput.value = item.dataset.popularSearch;
        this._handleSearch(item.dataset.popularSearch);
      });
    });
  }

  _submitSearch(query) {
    this._addRecentSearch(query);
    this._closeDropdown();
    this._searchInput.value = '';
    router.navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  _addRecentSearch(query) {
    this.recentSearches = [query, ...this.recentSearches.filter(s => s !== query)].slice(0, CONFIG.MAX_RECENT_SEARCHES);
    localStore.set('recentSearches', this.recentSearches);
  }

  removeRecentSearch(term) {
    this.recentSearches = this.recentSearches.filter(s => s !== term);
    localStore.set('recentSearches', this.recentSearches);
  }

  _highlightMatch(text, query) {
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  _navigateResults(direction) {
    if (!this._dropdown) return;
    const items = this._dropdown.querySelectorAll('.search-dropdown__item');
    const current = this._dropdown.querySelector('.search-dropdown__item--active');
    let index = current ? Array.from(items).indexOf(current) + direction : 0;
    
    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;

    items.forEach(i => i.classList.remove('search-dropdown__item--active'));
    items[index]?.classList.add('search-dropdown__item--active');
    items[index]?.scrollIntoView({ block: 'nearest' });
  }

  _openDropdown() {
    this._dropdown?.classList.add('search-dropdown--open');
    this._isOpen = true;
  }

  _closeDropdown() {
    this._dropdown?.classList.remove('search-dropdown--open');
    this._isOpen = false;
  }
}

export const searchManager = new SearchManager();
