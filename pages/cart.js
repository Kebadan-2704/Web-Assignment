/* ============================================
   CART PAGE
   ============================================ */
import { cart } from '../js/cart.js';
import { formatCurrency, icon, ICONS } from '../js/helpers.js';
import { Toast } from '../js/ui.js';
import { router } from '../js/router.js';

export function renderCart() {
  const state = cart.getState();

  if (state.items.length === 0) {
    return `
      <div class="container section">
        <div class="empty-state">
          <div class="empty-state__icon">${ICONS.cart}</div>
          <h2 class="empty-state__title">Your Cart is Empty</h2>
          <p class="empty-state__text">Looks like you haven't added any items to your cart yet.</p>
          <a href="/shop" class="btn btn--primary btn--lg mt-4">Start Shopping</a>
        </div>
      </div>
    `;
  }

  const html = `
    <div class="container section--sm">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a><span class="breadcrumbs__separator">/</span>
        <span class="breadcrumbs__current">Shopping Cart</span>
      </nav>
      <h1 style="margin-bottom: var(--space-6);">Shopping Cart <span class="text-secondary" style="font-weight: var(--fw-regular); font-size: var(--fs-lg);">(${state.itemCount} items)</span></h1>

      <div style="display: grid; grid-template-columns: 1fr 380px; gap: var(--space-8); align-items: start;" class="checkout-layout">
        <!-- Cart Items -->
        <div>
          ${state.items.map(item => `
            <div class="cart-item" style="display: grid; grid-template-columns: 100px 1fr; gap: var(--space-4); padding: var(--space-4); border: 1px solid var(--border-default); border-radius: var(--radius-xl); margin-bottom: var(--space-3); background: var(--card-bg);" data-cart-item="${item.id}">
              <div style="background: ${item.image || 'var(--surface-overlay)'}; border-radius: var(--radius-lg); aspect-ratio: 1;"></div>
              <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div>
                    <a href="/product/${item.slug}" style="font-weight: var(--fw-semibold); color: var(--text-primary); font-size: var(--fs-base);">${item.name}</a>
                    ${item.variant?.color ? `<p class="text-xs text-muted">Color: <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${item.variant.color}; vertical-align: middle;"></span></p>` : ''}
                    ${item.variant?.size ? `<p class="text-xs text-muted">Size: ${item.variant.size}</p>` : ''}
                  </div>
                  <button class="btn btn--ghost btn--icon btn--icon-sm" data-remove-item="${item.id}" data-color="${item.variant?.color || ''}" data-size="${item.variant?.size || ''}" aria-label="Remove item">${ICONS.trash}</button>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                  <div class="quantity-selector">
                    <button class="quantity-selector__btn" data-cart-minus="${item.id}" data-color="${item.variant?.color || ''}" data-size="${item.variant?.size || ''}" aria-label="Decrease">${ICONS.minus}</button>
                    <span class="quantity-selector__value">${item.quantity}</span>
                    <button class="quantity-selector__btn" data-cart-plus="${item.id}" data-color="${item.variant?.color || ''}" data-size="${item.variant?.size || ''}" aria-label="Increase">${ICONS.plus}</button>
                  </div>
                  <div>
                    <span class="price" style="font-size: var(--fs-md);">${formatCurrency(item.price * item.quantity)}</span>
                    ${item.originalPrice > item.price ? `<span class="price price--original" style="font-size: var(--fs-xs); display: block;">${formatCurrency(item.originalPrice * item.quantity)}</span>` : ''}
                  </div>
                </div>
                <button class="btn btn--ghost btn--xs text-muted" data-save-later="${item.id}" style="align-self: start;">${icon('bookmark')} Save for Later</button>
              </div>
            </div>
          `).join('')}

          <!-- Free Shipping Progress -->
          ${!state.isFreeShipping && state.freeShippingRemaining > 0 ? `
            <div style="background: var(--surface-raised); padding: var(--space-4); border-radius: var(--radius-xl); margin-top: var(--space-4);">
              <p style="font-size: var(--fs-sm); margin-bottom: var(--space-2);">
                ${icon('truck')} Add <strong>${formatCurrency(state.freeShippingRemaining)}</strong> more for <strong>free shipping!</strong>
              </p>
              <div style="height: 6px; background: var(--surface-overlay); border-radius: var(--radius-full); overflow: hidden;">
                <div style="height: 100%; width: ${Math.min(100, ((state.subtotal) / state.freeShippingThreshold) * 100)}%; background: var(--gradient-primary); border-radius: var(--radius-full); transition: width 0.3s;"></div>
              </div>
            </div>
          ` : ''}

          <a href="/shop" class="btn btn--ghost mt-4">${ICONS.arrowLeft} Continue Shopping</a>
        </div>

        <!-- Order Summary -->
        <div class="order-summary" style="position: sticky; top: 100px;">
          <h3 class="order-summary__title">Order Summary</h3>
          
          <!-- Coupon -->
          <div style="margin-bottom: var(--space-4);">
            ${state.coupon ? `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) var(--space-3); background: var(--color-success-50); border: 1px solid var(--color-success-500); border-radius: var(--radius-md); font-size: var(--fs-sm);">
                <span style="color: var(--color-success-700);">${icon('tag')} ${state.coupon.label} (${state.coupon.code})</span>
                <button class="btn btn--ghost btn--xs" id="remove-coupon" style="color: var(--color-error-500);">Remove</button>
              </div>
            ` : `
              <div class="coupon-input">
                <input type="text" class="form-input" id="coupon-input" placeholder="Coupon code" style="text-transform: uppercase;">
                <button class="btn btn--secondary" id="apply-coupon">Apply</button>
              </div>
            `}
          </div>

          <div class="order-summary__row"><span class="order-summary__label">Subtotal</span><span class="order-summary__value">${formatCurrency(state.subtotal)}</span></div>
          ${state.discount > 0 ? `<div class="order-summary__row"><span class="order-summary__label">Discount</span><span class="order-summary__value order-summary__value--discount">-${formatCurrency(state.discount)}</span></div>` : ''}
          <div class="order-summary__row"><span class="order-summary__label">Shipping</span><span class="order-summary__value ${state.isFreeShipping ? 'order-summary__value--free' : ''}">${state.isFreeShipping ? 'Free' : formatCurrency(state.shipping)}</span></div>
          <div class="order-summary__row"><span class="order-summary__label">Tax</span><span class="order-summary__value">${formatCurrency(state.tax)}</span></div>
          <div class="order-summary__row order-summary__row--total"><span>Total</span><span>${formatCurrency(state.total)}</span></div>
          
          <a href="/checkout" class="btn btn--primary btn--lg btn--block mt-4">Proceed to Checkout</a>
          <p style="text-align: center; margin-top: var(--space-3); font-size: var(--fs-xs); color: var(--text-tertiary);">${icon('shield')} Secure SSL Encrypted Checkout</p>
        </div>
      </div>

      <!-- Saved for Later -->
      ${state.savedForLater.length > 0 ? `
        <section style="margin-top: var(--space-12);">
          <h3 style="margin-bottom: var(--space-4);">Saved for Later (${state.savedForLater.length})</h3>
          <div class="products-grid">
            ${state.savedForLater.map(item => `
              <div style="border: 1px solid var(--border-default); border-radius: var(--radius-xl); padding: var(--space-4); background: var(--card-bg);">
                <div style="background: ${item.image || 'var(--surface-overlay)'}; border-radius: var(--radius-lg); aspect-ratio: 1; margin-bottom: var(--space-3);"></div>
                <h4 style="font-size: var(--fs-sm); margin-bottom: var(--space-2);">${item.name}</h4>
                <p class="price" style="margin-bottom: var(--space-3);">${formatCurrency(item.price)}</p>
                <button class="btn btn--primary btn--sm btn--block" data-move-to-cart="${item.id}">Move to Cart</button>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}
    </div>
  `;

  setTimeout(() => _bindCartEvents(), 50);
  return html;
}

function _bindCartEvents() {
  /* Quantity controls */
  document.querySelectorAll('[data-cart-minus]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.cartMinus);
      const variant = { color: btn.dataset.color, size: btn.dataset.size };
      const item = cart.items.find(i => i.id === id);
      if (item && item.quantity > 1) { cart.updateQuantity(id, item.quantity - 1, variant); _refreshCart(); }
    });
  });

  document.querySelectorAll('[data-cart-plus]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.cartPlus);
      const variant = { color: btn.dataset.color, size: btn.dataset.size };
      const item = cart.items.find(i => i.id === id);
      if (item) { cart.updateQuantity(id, item.quantity + 1, variant); _refreshCart(); }
    });
  });

  /* Remove item */
  document.querySelectorAll('[data-remove-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.removeItem);
      const variant = { color: btn.dataset.color, size: btn.dataset.size };
      const removed = cart.removeItem(id, variant);
      if (removed) {
        Toast.show({ type: 'info', title: 'Item Removed', message: `${removed.name} was removed from your cart.`, duration: 4000,
          action: `<button class="btn btn--ghost btn--xs" onclick="window._undoRemove && window._undoRemove()">Undo</button>`
        });
        window._undoRemove = () => { cart.addItem(removed, removed.quantity, removed.variant); _refreshCart(); window._undoRemove = null; };
      }
      _refreshCart();
    });
  });

  /* Save for later */
  document.querySelectorAll('[data-save-later]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.saveLater);
      cart.saveForLater(id);
      Toast.info('Saved', 'Item saved for later.');
      _refreshCart();
    });
  });

  /* Move to cart */
  document.querySelectorAll('[data-move-to-cart]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.moveToCart);
      cart.moveToCart(id);
      Toast.success('Moved', 'Item moved to cart.');
      _refreshCart();
    });
  });

  /* Apply coupon */
  document.getElementById('apply-coupon')?.addEventListener('click', () => {
    const input = document.getElementById('coupon-input');
    if (input?.value) {
      const result = cart.applyCoupon(input.value);
      Toast.show({ type: result.success ? 'success' : 'error', title: result.success ? 'Coupon Applied' : 'Invalid Coupon', message: result.message });
      if (result.success) _refreshCart();
    }
  });

  /* Remove coupon */
  document.getElementById('remove-coupon')?.addEventListener('click', () => {
    cart.removeCoupon();
    _refreshCart();
  });
}

function _refreshCart() {
  const content = document.getElementById('page-content');
  if (content) { content.innerHTML = renderCart(); }
}
