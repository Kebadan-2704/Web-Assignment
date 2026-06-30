/* ============================================
   CART — Shopping Cart State Management
   ============================================ */

import { localStore } from './storage.js';
import { eventBus } from './utils.js';
import { CONFIG } from './config.js';
import { formatCurrency } from './helpers.js';

class CartManager {
  constructor() {
    this.items = [];
    this.savedForLater = [];
    this.coupon = null;
    this.shippingMethod = 'standard';
  }

  init() {
    this.items = localStore.get('cart', []);
    this.savedForLater = localStore.get('savedForLater', []);
    this.coupon = localStore.get('cartCoupon', null);
    this._updateBadge();
  }

  /**
   * Add item to cart
   */
  addItem(product, quantity = 1, variant = {}) {
    const existingIndex = this.items.findIndex(item =>
      item.id === product.id &&
      item.variant?.color === variant.color &&
      item.variant?.size === variant.size
    );

    if (existingIndex > -1) {
      this.items[existingIndex].quantity = Math.min(
        this.items[existingIndex].quantity + quantity,
        CONFIG.MAX_QUANTITY
      );
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.salePrice || product.price,
        originalPrice: product.price,
        image: product.images?.[0] || product.gradient,
        variant,
        quantity: Math.min(quantity, CONFIG.MAX_QUANTITY)
      });
    }

    this._save();
    eventBus.emit('cart:updated', this.getState());
    eventBus.emit('cart:itemAdded', product);
    return true;
  }

  /**
   * Remove item from cart
   */
  removeItem(id, variant = {}) {
    const index = this._findIndex(id, variant);
    if (index === -1) return;

    const removed = this.items.splice(index, 1)[0];
    this._save();
    eventBus.emit('cart:updated', this.getState());
    return removed;
  }

  /**
   * Update item quantity
   */
  updateQuantity(id, quantity, variant = {}) {
    const index = this._findIndex(id, variant);
    if (index === -1) return;

    if (quantity <= 0) {
      return this.removeItem(id, variant);
    }

    this.items[index].quantity = Math.min(quantity, CONFIG.MAX_QUANTITY);
    this._save();
    eventBus.emit('cart:updated', this.getState());
  }

  /**
   * Save item for later
   */
  saveForLater(id, variant = {}) {
    const index = this._findIndex(id, variant);
    if (index === -1) return;

    const item = this.items.splice(index, 1)[0];
    this.savedForLater.push(item);
    this._save();
    eventBus.emit('cart:updated', this.getState());
  }

  /**
   * Move saved item back to cart
   */
  moveToCart(id, variant = {}) {
    const index = this.savedForLater.findIndex(item =>
      item.id === id &&
      item.variant?.color === variant.color &&
      item.variant?.size === variant.size
    );
    if (index === -1) return;

    const item = this.savedForLater.splice(index, 1)[0];
    this.items.push(item);
    this._save();
    eventBus.emit('cart:updated', this.getState());
  }

  /**
   * Apply coupon code
   */
  applyCoupon(code) {
    const couponData = CONFIG.COUPONS[code.toUpperCase()];
    if (!couponData) return { success: false, message: 'Invalid coupon code' };

    this.coupon = { code: code.toUpperCase(), ...couponData };
    localStore.set('cartCoupon', this.coupon);
    eventBus.emit('cart:updated', this.getState());
    return { success: true, message: `Coupon "${couponData.label}" applied!` };
  }

  /**
   * Remove coupon
   */
  removeCoupon() {
    this.coupon = null;
    localStore.remove('cartCoupon');
    eventBus.emit('cart:updated', this.getState());
  }

  /**
   * Set shipping method
   */
  setShipping(method) {
    this.shippingMethod = method;
    eventBus.emit('cart:updated', this.getState());
  }

  /**
   * Clear entire cart
   */
  clear() {
    this.items = [];
    this.coupon = null;
    this._save();
    eventBus.emit('cart:updated', this.getState());
  }

  /**
   * Get cart totals and summary
   */
  getState() {
    const subtotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    /* Discount */
    let discount = 0;
    if (this.coupon) {
      if (this.coupon.type === 'percentage') {
        discount = subtotal * this.coupon.discount;
      } else if (this.coupon.type === 'fixed') {
        discount = Math.min(this.coupon.discount, subtotal);
      }
    }

    const afterDiscount = subtotal - discount;

    /* Shipping */
    let shipping = 0;
    const isFreeShipping = this.coupon?.type === 'shipping' || afterDiscount >= CONFIG.FREE_SHIPPING_THRESHOLD;
    
    if (!isFreeShipping && this.items.length > 0) {
      shipping = this.shippingMethod === 'express' ? CONFIG.EXPRESS_SHIPPING : CONFIG.STANDARD_SHIPPING;
    }

    /* Tax */
    const tax = afterDiscount * CONFIG.TAX_RATE;

    /* Total */
    const total = afterDiscount + shipping + tax;

    return {
      items: this.items,
      savedForLater: this.savedForLater,
      itemCount: this.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      discount,
      shipping,
      isFreeShipping,
      tax,
      total,
      coupon: this.coupon,
      shippingMethod: this.shippingMethod,
      freeShippingThreshold: CONFIG.FREE_SHIPPING_THRESHOLD,
      freeShippingRemaining: Math.max(0, CONFIG.FREE_SHIPPING_THRESHOLD - afterDiscount)
    };
  }

  /**
   * Check if an item is in cart
   */
  hasItem(id) {
    return this.items.some(item => item.id === id);
  }

  /**
   * Get total item count
   */
  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /* Private helpers */
  _findIndex(id, variant = {}) {
    return this.items.findIndex(item =>
      item.id === id &&
      (!variant.color || item.variant?.color === variant.color) &&
      (!variant.size || item.variant?.size === variant.size)
    );
  }

  _save() {
    localStore.set('cart', this.items);
    localStore.set('savedForLater', this.savedForLater);
    this._updateBadge();
  }

  _updateBadge() {
    const count = this.getCount();
    document.querySelectorAll('[data-cart-count]').forEach(badge => {
      badge.textContent = count > 0 ? count : '';
    });
  }
}

export const cart = new CartManager();
