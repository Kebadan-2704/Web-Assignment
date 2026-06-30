/* ============================================
   CHECKOUT PAGE — Multi-step Checkout
   ============================================ */
import { cart } from '../js/cart.js';
import { auth } from '../js/auth.js';
import { formatCurrency, ICONS, generateOrderNumber, getEstimatedDelivery } from '../js/helpers.js';
import { FormValidator, formatCardNumber, formatExpiry } from '../js/validation.js';
import { Toast } from '../js/ui.js';
import { router } from '../js/router.js';

let currentStep = 1;

export function renderCheckout() {
  const state = cart.getState();
  if (state.items.length === 0) { router.navigate('/cart'); return '<div class="container section"><p>Redirecting to cart...</p></div>'; }

  const html = `
    <div class="container section--sm">
      <nav class="breadcrumbs"><a href="/">Home</a><span class="breadcrumbs__separator">/</span><a href="/cart">Cart</a><span class="breadcrumbs__separator">/</span><span class="breadcrumbs__current">Checkout</span></nav>
      <h1 style="margin-bottom: var(--space-8);">Checkout</h1>

      <!-- Steps -->
      <div class="steps" id="checkout-steps">
        ${['Billing', 'Shipping', 'Payment', 'Review'].map((label, i) => `
          <div class="step ${i + 1 < currentStep ? 'step--completed' : i + 1 === currentStep ? 'step--active' : ''}">
            <div class="step__number">${i + 1 < currentStep ? ICONS.check : i + 1}</div>
            <span class="step__label">${label}</span>
          </div>
          ${i < 3 ? '<div class="step__connector"></div>' : ''}
        `).join('')}
      </div>

      <div style="display: grid; grid-template-columns: 1fr 380px; gap: var(--space-8); align-items: start;" class="checkout-layout">
        <div id="checkout-form-area">
          ${_renderStep(currentStep)}
        </div>

        <!-- Order Summary -->
        <div class="order-summary" style="position: sticky; top: 100px;">
          <h3 class="order-summary__title">Order Summary</h3>
          ${state.items.map(item => `
            <div style="display: flex; gap: var(--space-3); padding: var(--space-2) 0; font-size: var(--fs-sm);">
              <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: ${item.image || 'var(--surface-overlay)'}; flex-shrink: 0;"></div>
              <div style="flex: 1;"><div style="font-weight: var(--fw-medium);">${item.name}</div><div class="text-muted text-xs">Qty: ${item.quantity}</div></div>
              <div style="font-weight: var(--fw-semibold);">${formatCurrency(item.price * item.quantity)}</div>
            </div>
          `).join('')}
          <hr class="divider">
          <div class="order-summary__row"><span class="order-summary__label">Subtotal</span><span class="order-summary__value">${formatCurrency(state.subtotal)}</span></div>
          ${state.discount > 0 ? `<div class="order-summary__row"><span class="order-summary__label">Discount</span><span class="order-summary__value order-summary__value--discount">-${formatCurrency(state.discount)}</span></div>` : ''}
          <div class="order-summary__row"><span class="order-summary__label">Shipping</span><span class="order-summary__value">${state.isFreeShipping ? 'Free' : formatCurrency(state.shipping)}</span></div>
          <div class="order-summary__row"><span class="order-summary__label">Tax</span><span class="order-summary__value">${formatCurrency(state.tax)}</span></div>
          <div class="order-summary__row order-summary__row--total"><span>Total</span><span>${formatCurrency(state.total)}</span></div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => _bindCheckoutEvents(), 50);
  return html;
}

function _renderStep(step) {
  switch(step) {
    case 1: return `
      <div class="glass-card">
        <h3 style="margin-bottom: var(--space-6);">Billing Address</h3>
        <form id="billing-form">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
            <div class="form-group"><label class="form-label form-label--required">First Name</label><input class="form-input" name="firstName" placeholder="John" required></div>
            <div class="form-group"><label class="form-label form-label--required">Last Name</label><input class="form-input" name="lastName" placeholder="Doe" required></div>
          </div>
          <div class="form-group"><label class="form-label form-label--required">Email</label><input class="form-input" name="email" type="email" placeholder="john@example.com" required></div>
          <div class="form-group"><label class="form-label form-label--required">Phone</label><input class="form-input" name="phone" type="tel" placeholder="+1 (555) 123-4567" required></div>
          <div class="form-group"><label class="form-label form-label--required">Address</label><input class="form-input" name="address" placeholder="123 Main Street" required></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-4);">
            <div class="form-group"><label class="form-label form-label--required">City</label><input class="form-input" name="city" placeholder="New York" required></div>
            <div class="form-group"><label class="form-label form-label--required">State</label><input class="form-input" name="state" placeholder="NY" required></div>
            <div class="form-group"><label class="form-label form-label--required">ZIP Code</label><input class="form-input" name="zip" placeholder="10001" required></div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4);">
            <button type="submit" class="btn btn--primary btn--lg">Continue to Shipping ${ICONS.arrowRight}</button>
          </div>
        </form>
      </div>`;
    case 2: return `
      <div class="glass-card">
        <h3 style="margin-bottom: var(--space-6);">Shipping Method</h3>
        <div style="display: flex; flex-direction: column; gap: var(--space-3);" id="shipping-options">
          <label class="form-radio" style="padding: var(--space-4); border: 1.5px solid var(--border-default); border-radius: var(--radius-xl); cursor: pointer; transition: border-color 0.2s;">
            <input type="radio" name="shipping" value="standard" checked>
            <div style="flex: 1;"><div style="font-weight: var(--fw-semibold);">Standard Shipping</div><div class="text-xs text-muted">5-7 business days</div></div>
            <span style="font-weight: var(--fw-semibold);">$9.99</span>
          </label>
          <label class="form-radio" style="padding: var(--space-4); border: 1.5px solid var(--border-default); border-radius: var(--radius-xl); cursor: pointer;">
            <input type="radio" name="shipping" value="express">
            <div style="flex: 1;"><div style="font-weight: var(--fw-semibold);">Express Shipping</div><div class="text-xs text-muted">2-3 business days</div></div>
            <span style="font-weight: var(--fw-semibold);">$19.99</span>
          </label>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: var(--space-6);">
          <button class="btn btn--secondary btn--lg" id="back-step">${ICONS.arrowLeft} Back</button>
          <button class="btn btn--primary btn--lg" id="next-step">Continue to Payment ${ICONS.arrowRight}</button>
        </div>
      </div>`;
    case 3: return `
      <div class="glass-card">
        <h3 style="margin-bottom: var(--space-6);">Payment Details</h3>
        <form id="payment-form">
          <div class="form-group"><label class="form-label form-label--required">Card Number</label><input class="form-input" name="cardNumber" placeholder="4242 4242 4242 4242" id="card-number-input" required></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
            <div class="form-group"><label class="form-label form-label--required">Expiry Date</label><input class="form-input" name="expiry" placeholder="MM/YY" id="expiry-input" required></div>
            <div class="form-group"><label class="form-label form-label--required">CVV</label><input class="form-input" name="cvv" placeholder="123" maxlength="4" required></div>
          </div>
          <div class="form-group"><label class="form-label form-label--required">Name on Card</label><input class="form-input" name="cardName" placeholder="John Doe" required></div>
          <div style="display: flex; justify-content: space-between; margin-top: var(--space-4);">
            <button type="button" class="btn btn--secondary btn--lg" id="back-step">${ICONS.arrowLeft} Back</button>
            <button type="submit" class="btn btn--primary btn--lg">Review Order ${ICONS.arrowRight}</button>
          </div>
        </form>
      </div>`;
    case 4:
      const state = cart.getState();
      return `
      <div class="glass-card">
        <h3 style="margin-bottom: var(--space-6);">Review Your Order</h3>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-6);">Please review your order details before placing the order.</p>
        <div style="margin-bottom: var(--space-6);">
          ${state.items.map(item => `
            <div style="display: flex; gap: var(--space-3); padding: var(--space-3) 0; border-bottom: 1px solid var(--border-subtle);">
              <div style="width: 60px; height: 60px; border-radius: var(--radius-md); background: ${item.image || 'var(--surface-overlay)'}; flex-shrink: 0;"></div>
              <div style="flex: 1;"><div style="font-weight: var(--fw-medium);">${item.name}</div><div class="text-xs text-muted">Qty: ${item.quantity}</div></div>
              <div style="font-weight: var(--fw-semibold);">${formatCurrency(item.price * item.quantity)}</div>
            </div>
          `).join('')}
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: var(--space-6);">
          <button class="btn btn--secondary btn--lg" id="back-step">${ICONS.arrowLeft} Back</button>
          <button class="btn btn--gold btn--lg" id="place-order">${ICONS.shield} Place Order — ${formatCurrency(state.total)}</button>
        </div>
      </div>`;
    default: return '';
  }
}

function _bindCheckoutEvents() {
  /* Form submissions advance steps */
  document.getElementById('billing-form')?.addEventListener('submit', (e) => { e.preventDefault(); _goToStep(2); });
  document.getElementById('payment-form')?.addEventListener('submit', (e) => { e.preventDefault(); _goToStep(4); });
  document.getElementById('next-step')?.addEventListener('click', () => _goToStep(currentStep + 1));
  document.getElementById('back-step')?.addEventListener('click', () => _goToStep(currentStep - 1));

  /* Card number formatting */
  document.getElementById('card-number-input')?.addEventListener('input', (e) => { e.target.value = formatCardNumber(e.target.value); });
  document.getElementById('expiry-input')?.addEventListener('input', (e) => { e.target.value = formatExpiry(e.target.value); });

  /* Place order */
  document.getElementById('place-order')?.addEventListener('click', () => {
    const orderNumber = generateOrderNumber();
    if (auth.isAuthenticated) {
      auth.addOrder({ id: orderNumber, date: new Date().toISOString(), status: 'processing', total: cart.getState().total, items: cart.getState().itemCount });
    }
    cart.clear();
    Toast.success('Order Placed!', `Your order ${orderNumber} has been confirmed.`);
    router.navigate('/order-success?order=' + orderNumber);
  });
}

function _goToStep(step) {
  currentStep = Math.max(1, Math.min(step, 4));
  const formArea = document.getElementById('checkout-form-area');
  const stepsEl = document.getElementById('checkout-steps');
  if (formArea) formArea.innerHTML = _renderStep(currentStep);
  if (stepsEl) {
    stepsEl.querySelectorAll('.step').forEach((s, i) => {
      s.classList.toggle('step--completed', i + 1 < currentStep);
      s.classList.toggle('step--active', i + 1 === currentStep);
    });
  }
  _bindCheckoutEvents();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
