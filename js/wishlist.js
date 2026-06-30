/* ============================================
   WISHLIST — Wishlist State Management
   ============================================ */

import { localStore } from './storage.js';
import { eventBus } from './utils.js';

class WishlistManager {
  constructor() {
    this.items = [];
  }

  init() {
    this.items = localStore.get('wishlist', []);
    this._updateBadge();
  }

  add(product) {
    if (this.has(product.id)) return false;
    
    this.items.push({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.salePrice || product.price,
      originalPrice: product.price,
      image: product.images?.[0] || product.gradient,
      category: product.category,
      rating: product.rating,
      addedAt: new Date().toISOString()
    });

    this._save();
    eventBus.emit('wishlist:updated', this.items);
    return true;
  }

  remove(id) {
    this.items = this.items.filter(item => item.id !== id);
    this._save();
    eventBus.emit('wishlist:updated', this.items);
  }

  toggle(product) {
    if (this.has(product.id)) {
      this.remove(product.id);
      return false;
    } else {
      this.add(product);
      return true;
    }
  }

  has(id) {
    return this.items.some(item => item.id === id);
  }

  getAll() {
    return this.items;
  }

  getCount() {
    return this.items.length;
  }

  clear() {
    this.items = [];
    this._save();
    eventBus.emit('wishlist:updated', this.items);
  }

  _save() {
    localStore.set('wishlist', this.items);
    this._updateBadge();
  }

  _updateBadge() {
    document.querySelectorAll('[data-wishlist-count]').forEach(badge => {
      badge.textContent = this.items.length > 0 ? this.items.length : '';
    });
  }
}

export const wishlist = new WishlistManager();

/* ============================================
   COMPARE — Product Comparison
   ============================================ */

import { CONFIG } from './config.js';

class CompareManager {
  constructor() {
    this.items = [];
  }

  init() {
    this.items = localStore.get('compare', []);
  }

  add(product) {
    if (this.has(product.id)) return { success: false, message: 'Already in compare list' };
    if (this.items.length >= CONFIG.MAX_COMPARE_ITEMS) {
      return { success: false, message: `Maximum ${CONFIG.MAX_COMPARE_ITEMS} items for comparison` };
    }

    this.items.push({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.salePrice || product.price,
      originalPrice: product.price,
      image: product.images?.[0] || product.gradient,
      category: product.category,
      brand: product.brand,
      rating: product.rating,
      reviewCount: product.reviewCount,
      specifications: product.specifications || {}
    });

    this._save();
    eventBus.emit('compare:updated', this.items);
    return { success: true, message: 'Added to compare' };
  }

  remove(id) {
    this.items = this.items.filter(item => item.id !== id);
    this._save();
    eventBus.emit('compare:updated', this.items);
  }

  toggle(product) {
    if (this.has(product.id)) {
      this.remove(product.id);
      return false;
    }
    return this.add(product).success;
  }

  has(id) {
    return this.items.some(item => item.id === id);
  }

  getAll() {
    return this.items;
  }

  clear() {
    this.items = [];
    this._save();
    eventBus.emit('compare:updated', this.items);
  }

  _save() {
    localStore.set('compare', this.items);
  }
}

export const compare = new CompareManager();
