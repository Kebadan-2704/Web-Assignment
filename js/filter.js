/* ============================================
   FILTER — Shop Filters, Sorting, Pagination
   ============================================ */

import { eventBus } from './utils.js';
import { CONFIG } from './config.js';
import { formatCurrency } from './helpers.js';

class FilterManager {
  constructor() {
    this.products = [];
    this.filtered = [];
    this.filters = {
      category: [],
      brand: [],
      priceMin: 0,
      priceMax: 1000,
      rating: 0,
      availability: 'all',
      search: ''
    };
    this.sort = 'featured';
    this.currentPage = 1;
    this.perPage = CONFIG.PRODUCTS_PER_PAGE;
    this.viewMode = 'grid';
  }

  init(products) {
    this.products = products;
    this.filtered = [...products];
    this.filters.priceMax = Math.max(...products.map(p => p.price), 1000);
  }

  /**
   * Apply all active filters
   */
  apply() {
    let result = [...this.products];

    /* Category filter */
    if (this.filters.category.length > 0) {
      result = result.filter(p => this.filters.category.includes(p.category));
    }

    /* Brand filter */
    if (this.filters.brand.length > 0) {
      result = result.filter(p => this.filters.brand.includes(p.brand));
    }

    /* Price range */
    result = result.filter(p => {
      const price = p.salePrice || p.price;
      return price >= this.filters.priceMin && price <= this.filters.priceMax;
    });

    /* Rating filter */
    if (this.filters.rating > 0) {
      result = result.filter(p => p.rating >= this.filters.rating);
    }

    /* Availability filter */
    if (this.filters.availability === 'in-stock') {
      result = result.filter(p => p.stock > 0);
    } else if (this.filters.availability === 'on-sale') {
      result = result.filter(p => p.salePrice && p.salePrice < p.price);
    }

    /* Search filter */
    if (this.filters.search) {
      const q = this.filters.search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    }

    /* Apply sorting */
    result = this._sortProducts(result);

    this.filtered = result;
    this.currentPage = 1;

    eventBus.emit('filter:applied', this.getState());
    return this.getState();
  }

  /**
   * Set a filter value
   */
  setFilter(key, value) {
    if (key === 'category' || key === 'brand') {
      /* Toggle array values */
      const arr = this.filters[key];
      const index = arr.indexOf(value);
      if (index > -1) {
        arr.splice(index, 1);
      } else {
        arr.push(value);
      }
    } else {
      this.filters[key] = value;
    }
    return this.apply();
  }

  /**
   * Set sort order
   */
  setSort(sortBy) {
    this.sort = sortBy;
    return this.apply();
  }

  /**
   * Set current page
   */
  setPage(page) {
    this.currentPage = Math.max(1, Math.min(page, this.getTotalPages()));
    eventBus.emit('filter:applied', this.getState());
  }

  /**
   * Toggle view mode
   */
  setViewMode(mode) {
    this.viewMode = mode;
    eventBus.emit('filter:viewChanged', mode);
  }

  /**
   * Clear all filters
   */
  clearAll() {
    this.filters = {
      category: [],
      brand: [],
      priceMin: 0,
      priceMax: Math.max(...this.products.map(p => p.price), 1000),
      rating: 0,
      availability: 'all',
      search: ''
    };
    this.sort = 'featured';
    return this.apply();
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters() {
    return this.filters.category.length > 0 ||
           this.filters.brand.length > 0 ||
           this.filters.rating > 0 ||
           this.filters.availability !== 'all' ||
           this.filters.search !== '';
  }

  /**
   * Get active filter tags for display
   */
  getActiveFilterTags() {
    const tags = [];
    this.filters.category.forEach(c => tags.push({ key: 'category', value: c, label: c }));
    this.filters.brand.forEach(b => tags.push({ key: 'brand', value: b, label: b }));
    if (this.filters.rating > 0) tags.push({ key: 'rating', value: this.filters.rating, label: `${this.filters.rating}+ Stars` });
    if (this.filters.availability !== 'all') tags.push({ key: 'availability', value: this.filters.availability, label: this.filters.availability === 'in-stock' ? 'In Stock' : 'On Sale' });
    return tags;
  }

  /**
   * Get unique categories with counts
   */
  getCategories() {
    const counts = {};
    this.products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }

  /**
   * Get unique brands with counts
   */
  getBrands() {
    const counts = {};
    this.products.forEach(p => {
      counts[p.brand] = (counts[p.brand] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get price range
   */
  getPriceRange() {
    const prices = this.products.map(p => p.salePrice || p.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices))
    };
  }

  /**
   * Get paginated products for current page
   */
  getPaginated() {
    const start = (this.currentPage - 1) * this.perPage;
    return this.filtered.slice(start, start + this.perPage);
  }

  /**
   * Get total pages
   */
  getTotalPages() {
    return Math.ceil(this.filtered.length / this.perPage);
  }

  /**
   * Get full state object
   */
  getState() {
    return {
      products: this.getPaginated(),
      totalProducts: this.filtered.length,
      totalPages: this.getTotalPages(),
      currentPage: this.currentPage,
      filters: this.filters,
      sort: this.sort,
      viewMode: this.viewMode,
      hasActiveFilters: this.hasActiveFilters(),
      activeFilterTags: this.getActiveFilterTags()
    };
  }

  /* Private */
  _sortProducts(products) {
    const sorted = [...products];
    
    switch (this.sort) {
      case 'price-asc':
        sorted.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
        break;
      case 'price-desc':
        sorted.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
      case 'featured':
      default:
        /* Keep original order (featured) */
        break;
    }
    
    return sorted;
  }
}

export const filterManager = new FilterManager();
