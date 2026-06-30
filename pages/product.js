/* ============================================
   PRODUCT DETAIL PAGE
   ============================================ */
import { productManager } from '../js/products.js';
import { cart } from '../js/cart.js';
import { wishlist } from '../js/wishlist.js';
import { formatCurrency, generateStarRating, calculateDiscount, icon, ICONS, getInitials } from '../js/helpers.js';
import { Toast, initTabs, initAccordion } from '../js/ui.js';

export async function renderProduct({ params }) {
  await productManager.loadData();
  const product = productManager.getBySlug(params.slug);
  if (!product) return '<div class="container section"><div class="empty-state"><h2>Product Not Found</h2><p>The product you are looking for does not exist.</p><a href="/shop" class="btn btn--primary mt-4">Back to Shop</a></div></div>';

  productManager.trackView(product.id);
  const discount = calculateDiscount(product.price, product.salePrice);
  const gradient = product.gradient || 'var(--surface-overlay)';
  const hasImage = product.images && product.images.length > 0;
  const imageBg = hasImage ? `url('${product.images[0]}') center/cover no-repeat` : gradient;
  const related = productManager.getRelated(product);
  const isWished = wishlist.has(product.id);

  const html = `
    <div class="container section--sm">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a><span class="breadcrumbs__separator">/</span>
        <a href="/shop">Shop</a><span class="breadcrumbs__separator">/</span>
        <a href="/shop?category=${encodeURIComponent(product.category)}">${product.category}</a><span class="breadcrumbs__separator">/</span>
        <span class="breadcrumbs__current">${product.name}</span>
      </nav>

      <div class="product-detail-layout" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-10); align-items: start;">
        <!-- Images -->
        <div>
          <div class="image-zoom" style="background: ${imageBg}; border-radius: var(--radius-2xl); aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-family: var(--font-family-display); font-size: var(--fs-4xl); color: rgba(255,255,255,0.3); font-weight: var(--fw-bold);">
            ${hasImage ? '' : 'LUXE'}
          </div>
          ${product.colors?.length ? `
            <div style="display: flex; gap: var(--space-2); margin-top: var(--space-4); overflow-x: auto; padding-bottom: var(--space-2);">
              <div style="width: 80px; height: 80px; border-radius: var(--radius-lg); background: ${imageBg}; border: 2px solid var(--color-primary-500); flex-shrink: 0; cursor: pointer;"></div>
              ${product.colors.map(c => `<div style="width: 80px; height: 80px; border-radius: var(--radius-lg); background: ${c}; border: 2px solid var(--border-default); flex-shrink: 0; cursor: pointer;"></div>`).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Info -->
        <div>
          <p class="text-overline" style="margin-bottom: var(--space-2);">${product.brand}</p>
          <h1 style="font-size: var(--fs-3xl); margin-bottom: var(--space-3);">${product.name}</h1>
          
          <div class="rating" style="margin-bottom: var(--space-4);">
            ${generateStarRating(product.rating)}
            <span class="rating__count">(${product.reviewCount} reviews)</span>
          </div>

          <div style="margin-bottom: var(--space-6);">
            ${product.salePrice ? `
              <span class="price price--sale price--large">${formatCurrency(product.salePrice)}</span>
              <span class="price price--original" style="margin-left: var(--space-2); font-size: var(--fs-lg);">${formatCurrency(product.price)}</span>
              <span class="badge badge--sale" style="margin-left: var(--space-2);">-${discount}% OFF</span>
            ` : `
              <span class="price price--large">${formatCurrency(product.price)}</span>
            `}
          </div>

          <p style="color: var(--text-secondary); line-height: var(--lh-relaxed); margin-bottom: var(--space-6);">${product.description}</p>

          ${product.colors?.length ? `
            <div style="margin-bottom: var(--space-5);">
              <label class="form-label">Color</label>
              <div style="display: flex; gap: var(--space-2); margin-top: var(--space-2);">
                ${product.colors.map((c, i) => `<button class="color-swatch ${i === 0 ? 'color-swatch--active' : ''}" style="background: ${c}; width: 32px; height: 32px;" data-color="${c}" aria-label="Color option"></button>`).join('')}
              </div>
            </div>
          ` : ''}

          ${product.sizes?.length ? `
            <div style="margin-bottom: var(--space-5);">
              <label class="form-label">Size</label>
              <div class="btn-group" style="margin-top: var(--space-2); flex-wrap: wrap;">
                ${product.sizes.map((s, i) => `<button class="btn btn--secondary btn--sm ${i === 0 ? '' : ''}" data-size="${s}" style="min-width: 48px;">${s}</button>`).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Quantity + Actions -->
          <div style="margin-bottom: var(--space-6);">
            <label class="form-label">Quantity</label>
            <div style="display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-2);">
              <div class="quantity-selector">
                <button class="quantity-selector__btn" data-qty-minus aria-label="Decrease quantity">${ICONS.minus}</button>
                <input type="number" class="quantity-selector__value" value="1" min="1" max="10" id="product-qty" aria-label="Quantity">
                <button class="quantity-selector__btn" data-qty-plus aria-label="Increase quantity">${ICONS.plus}</button>
              </div>
              <span class="stock-status stock-status--${product.stock > 10 ? 'in' : product.stock > 0 ? 'low' : 'out'}">
                ${product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
              </span>
            </div>
          </div>

          <div style="display: flex; gap: var(--space-3); margin-bottom: var(--space-6);">
            <button class="btn btn--primary btn--lg" style="flex: 1;" id="add-to-cart-btn" ${product.stock === 0 ? 'disabled' : ''}>
              ${icon('cart')} Add to Cart
            </button>
            <button class="btn btn--gold btn--lg" id="buy-now-btn" ${product.stock === 0 ? 'disabled' : ''}>Buy Now</button>
            <button class="btn btn--secondary btn--icon btn--icon-lg ${isWished ? 'product-card__action-btn--active' : ''}" id="wishlist-btn" aria-label="Add to wishlist" style="color: ${isWished ? 'var(--color-error-500)' : 'var(--text-secondary)'};">
              ${isWished ? ICONS.heartFilled : ICONS.heart}
            </button>
          </div>

          <!-- Delivery Info -->
          <div style="border: 1px solid var(--border-default); border-radius: var(--radius-xl); padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3);">
            <div style="display: flex; align-items: center; gap: var(--space-3); font-size: var(--fs-sm);">
              <span style="color: var(--color-primary-600);">${ICONS.truck}</span>
              <div><strong>Free Shipping</strong> on orders over $100</div>
            </div>
            <div style="display: flex; align-items: center; gap: var(--space-3); font-size: var(--fs-sm);">
              <span style="color: var(--color-primary-600);">${ICONS.refresh}</span>
              <div><strong>30-Day Returns</strong> hassle-free return policy</div>
            </div>
            <div style="display: flex; align-items: center; gap: var(--space-3); font-size: var(--fs-sm);">
              <span style="color: var(--color-primary-600);">${ICONS.shield}</span>
              <div><strong>Secure Checkout</strong> SSL encrypted payment</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs: Description, Specs, Reviews -->
      <div style="margin-top: var(--space-12);" id="product-tabs">
        <div class="tabs" role="tablist">
          <button class="tabs__tab tabs__tab--active" data-tab="description" role="tab">Description</button>
          <button class="tabs__tab" data-tab="specifications" role="tab">Specifications</button>
          <button class="tabs__tab" data-tab="reviews" role="tab">Reviews (${product.reviewCount})</button>
          ${product.faq?.length ? '<button class="tabs__tab" data-tab="faq" role="tab">FAQ</button>' : ''}
        </div>

        <div class="tab-content tab-content--active" data-tab-content="description">
          <div style="max-width: 700px;">
            <p style="line-height: var(--lh-relaxed); color: var(--text-secondary);">${product.description}</p>
            <p style="line-height: var(--lh-relaxed); color: var(--text-secondary); margin-top: var(--space-4);">Each product from LUXE is carefully selected for quality, ensuring our customers receive only the finest items. Our commitment to excellence extends from sourcing materials to final delivery.</p>
          </div>
        </div>

        <div class="tab-content" data-tab-content="specifications">
          ${product.specifications ? `
            <table style="width: 100%; max-width: 600px; border-collapse: collapse;">
              ${Object.entries(product.specifications).map(([key, val]) => `
                <tr style="border-bottom: 1px solid var(--border-default);">
                  <td style="padding: var(--space-3) var(--space-4); font-weight: var(--fw-semibold); color: var(--text-primary); width: 40%;">${key}</td>
                  <td style="padding: var(--space-3) var(--space-4); color: var(--text-secondary);">${val}</td>
                </tr>
              `).join('')}
            </table>
          ` : '<p class="text-secondary">No specifications available.</p>'}
        </div>

        <div class="tab-content" data-tab-content="reviews">
          <div style="max-width: 700px;">
            ${(product.reviews || []).map(review => `
              <div style="padding: var(--space-4) 0; border-bottom: 1px solid var(--border-default);">
                <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-2);">
                  <div style="width: 36px; height: 36px; border-radius: var(--radius-full); background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: white; font-size: var(--fs-xs); font-weight: var(--fw-bold);">${getInitials(review.author)}</div>
                  <div>
                    <div style="font-weight: var(--fw-semibold); font-size: var(--fs-sm);">${review.author}</div>
                    <div class="rating">${generateStarRating(review.rating)}</div>
                  </div>
                  <span style="margin-left: auto; color: var(--text-tertiary); font-size: var(--fs-xs);">${review.date}</span>
                </div>
                <p style="color: var(--text-secondary); font-size: var(--fs-sm); line-height: var(--lh-relaxed);">${review.text}</p>
              </div>
            `).join('') || '<p class="text-secondary">No reviews yet. Be the first to review this product!</p>'}
          </div>
        </div>

        ${product.faq?.length ? `
          <div class="tab-content" data-tab-content="faq">
            <div class="accordion" id="product-faq" style="max-width: 700px;">
              ${product.faq.map(item => `
                <div class="accordion__item">
                  <button class="accordion__trigger">${item.q}<span class="accordion__icon">${ICONS.chevronDown}</span></button>
                  <div class="accordion__content"><div class="accordion__body">${item.a}</div></div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Related Products -->
      ${related.length > 0 ? `
        <section class="section">
          <div class="section__header">
            <p class="text-overline">You May Also Like</p>
            <h2>Related Products</h2>
          </div>
          <div class="products-grid" id="related-grid">
            ${related.map(p => productManager.renderCard(p)).join('')}
          </div>
        </section>
      ` : ''}
    </div>
  `;

  setTimeout(() => {
    _bindProductDetailEvents(product);
    const tabContainer = document.getElementById('product-tabs');
    if (tabContainer) initTabs(tabContainer);
    const faqContainer = document.getElementById('product-faq');
    if (faqContainer) initAccordion(faqContainer);
    const relatedGrid = document.getElementById('related-grid');
    if (relatedGrid) productManager.bindCardEvents(relatedGrid);
  }, 50);

  return html;
}

function _bindProductDetailEvents(product) {
  /* Quantity controls */
  const qtyInput = document.getElementById('product-qty');
  document.querySelector('[data-qty-minus]')?.addEventListener('click', () => {
    if (qtyInput) qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1);
  });
  document.querySelector('[data-qty-plus]')?.addEventListener('click', () => {
    if (qtyInput) qtyInput.value = Math.min(10, parseInt(qtyInput.value) + 1);
  });

  /* Color swatches */
  document.querySelectorAll('[data-color]').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('[data-color]').forEach(s => s.classList.remove('color-swatch--active'));
      swatch.classList.add('color-swatch--active');
    });
  });

  /* Size buttons */
  document.querySelectorAll('[data-size]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-size]').forEach(b => b.classList.remove('btn--primary'));
      document.querySelectorAll('[data-size]').forEach(b => b.classList.add('btn--secondary'));
      btn.classList.remove('btn--secondary');
      btn.classList.add('btn--primary');
    });
  });

  /* Add to cart */
  document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
    const qty = parseInt(document.getElementById('product-qty')?.value || 1);
    const color = document.querySelector('[data-color].color-swatch--active')?.dataset.color;
    const size = document.querySelector('[data-size].btn--primary')?.dataset.size;
    cart.addItem(product, qty, { color, size });
    Toast.success('Added to Cart', `${product.name} (x${qty}) has been added to your cart.`);
  });

  /* Buy now */
  document.getElementById('buy-now-btn')?.addEventListener('click', () => {
    const qty = parseInt(document.getElementById('product-qty')?.value || 1);
    const color = document.querySelector('[data-color].color-swatch--active')?.dataset.color;
    const size = document.querySelector('[data-size].btn--primary')?.dataset.size;
    cart.addItem(product, qty, { color, size });
    import('../js/router.js').then(({ router }) => router.navigate('/checkout'));
  });

  /* Wishlist */
  document.getElementById('wishlist-btn')?.addEventListener('click', () => {
    const added = wishlist.toggle(product);
    const btn = document.getElementById('wishlist-btn');
    btn.innerHTML = added ? ICONS.heartFilled : ICONS.heart;
    btn.style.color = added ? 'var(--color-error-500)' : 'var(--text-secondary)';
    Toast.show({ type: 'success', title: added ? 'Added to Wishlist' : 'Removed from Wishlist', message: product.name, duration: 2000 });
  });
}
