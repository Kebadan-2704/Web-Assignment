/* ============================================
   INLINE.JS — LUXE
   - Purchase gate: opens the early-access modal
     ONLY on BUY actions (Add to Cart / Buy / Checkout).
   - Removes the old "Stay in the Loop" block.

   IMPORTANT:
   The Early Access form, Newsletter form, and the
   Gate modal FORM submissions are handled by the
   EmailJS script inside index.html (so an email is
   actually sent). They were removed from this file to
   avoid double submissions / conflicts.
   ============================================ */

/* ── Purchase Gate: intercept BUY actions only ── */
(function () {
  // Match common "buy" controls via attributes/classes...
  var PURCHASE_SELECTOR = [
    '[data-add-to-cart]',
    '[data-buy]',
    '[data-checkout]',
    '.add-to-cart',
    '.btn--add-to-cart',
    '.btn--buy',
    '.buy-now',
    '.btn-checkout',
    '.checkout-btn',
    '.product-card__add'
  ].join(',');

  // ...and via button text (kept short to avoid matching paragraphs)
  var PURCHASE_WORDS = [
    'add to cart',
    'add to bag',
    'buy now',
    'buy',
    'checkout',
    'proceed to checkout',
    'place order',
    'purchase',
    'get it now',
    'order now'
  ];

  function textLooksLikePurchase(el) {
    var t = (el.textContent || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!t || t.length > 24) return false; // ignore long text blocks
    for (var i = 0; i < PURCHASE_WORDS.length; i++) {
      if (t === PURCHASE_WORDS[i]) return true;
    }
    return false;
  }

  function isPurchase(el) {
    if (el.closest(PURCHASE_SELECTOR)) return true;
    var href = el.getAttribute && el.getAttribute('href');
    if (href && /\/(checkout|buy)(\/|$|\?)/i.test(href)) return true;
    return textLooksLikePurchase(el);
  }

  function findProductName(el) {
    var holder = el.closest('[data-product-name]');
    if (holder) return holder.getAttribute('data-product-name');

    var card = el.closest('.product-card, .product, [data-product], .product-detail');
    if (card) {
      var title = card.querySelector('.product-card__title, .product__title, .product-detail__title, h1, h2, h3');
      if (title && title.textContent) return title.textContent.trim();
    }
    return '';
  }

  // Capture phase so we intercept before app.js handlers run
  document.addEventListener('click', function (e) {
    var t = e.target.closest('a, button');
    if (!t) return;
    if (t.closest('#luxe-eam-modal')) return; // never block the modal itself
    if (!isPurchase(t)) return;

    e.preventDefault();
    e.stopPropagation();

    var product = findProductName(t);
    if (typeof window.LUXE_openGate === 'function') {
      window.LUXE_openGate(product);
    }
  }, true);
})();

/* ── Remove old "Stay in the Loop" newsletter injected by page JS ── */
(function () {
  function removeStayInLoop() {
    var heads = document.querySelectorAll('h1, h2, h3, h4');
    for (var i = 0; i < heads.length; i++) {
      var h = heads[i];
      if (!h.textContent || h.textContent.trim().toLowerCase() !== 'stay in the loop') continue;

      var target = h.closest('section');
      if (!target) {
        var node = h.parentElement;
        while (node && node !== document.body) {
          if (node.querySelector('input, form')) { target = node; break; }
          node = node.parentElement;
        }
      }
      if (target
          && target.id !== 'page-content'
          && target.id !== 'luxe-newsletter'
          && target.id !== 'early-access'
          && target.tagName !== 'MAIN'
          && target.tagName !== 'BODY') {
        target.remove();
      }
    }
  }

  removeStayInLoop();
  document.addEventListener('DOMContentLoaded', removeStayInLoop);

  var obs = new MutationObserver(function () { removeStayInLoop(); });
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();