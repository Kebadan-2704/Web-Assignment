/* Account Dashboard, Wishlist, Compare, Search Results, Order Success, Track Order, Categories, Collections, Content Pages, 404 */
import { auth } from '../js/auth.js';
import { wishlist } from '../js/wishlist.js';
import { compare } from '../js/wishlist.js';
import { cart } from '../js/cart.js';
import { productManager } from '../js/products.js';
import { formatCurrency, formatDate, icon, ICONS, getInitials, generateStarRating, getEstimatedDelivery } from '../js/helpers.js';
import { Toast, initAccordion } from '../js/ui.js';
import { router } from '../js/router.js';
import { CONFIG } from '../js/config.js';

/* ── ACCOUNT DASHBOARD ── */
export function renderAccount() {
  const user = auth.getUser();
  if (!user) { router.navigate('/login'); return '<p>Redirecting...</p>'; }

  return `
    <div class="container section--sm">
      <h1 style="margin-bottom: var(--space-8);">My Account</h1>
      <div class="account-layout" style="display: grid; grid-template-columns: 250px 1fr; gap: var(--space-8); align-items: start;">
        <aside style="background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius-2xl); padding: var(--space-4); position: sticky; top: 100px;">
          <div style="text-align: center; padding: var(--space-4);">
            <div style="width: 64px; height: 64px; border-radius: var(--radius-full); background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: white; font-size: var(--fs-xl); font-weight: var(--fw-bold); margin: 0 auto var(--space-3);">${getInitials(user.name)}</div>
            <h4>${user.name}</h4>
            <p class="text-sm text-muted">${user.email}</p>
          </div>
          <nav style="margin-top: var(--space-4);">
            <a href="/account" class="mobile-drawer__link" style="font-size: var(--fs-sm);">${icon('user')} Dashboard</a>
            <a href="/account/orders" class="mobile-drawer__link" style="font-size: var(--fs-sm);">${icon('package')} Orders</a>
            <a href="/account/addresses" class="mobile-drawer__link" style="font-size: var(--fs-sm);">${icon('mapPin')} Addresses</a>
            <a href="/wishlist" class="mobile-drawer__link" style="font-size: var(--fs-sm);">${icon('heart')} Wishlist</a>
            <a href="/account/settings" class="mobile-drawer__link" style="font-size: var(--fs-sm);">${icon('settings')} Settings</a>
            <button class="mobile-drawer__link" style="font-size: var(--fs-sm); color: var(--color-error-500); width: 100%; text-align: start;" id="logout-btn">${icon('logout')} Logout</button>
          </nav>
        </aside>
        <div>
          <div class="grid grid--3" style="margin-bottom: var(--space-8);">
            <div class="glass-card text-center"><h3>${(user.orders || []).length}</h3><p class="text-sm text-muted">Total Orders</p></div>
            <div class="glass-card text-center"><h3>${wishlist.getCount()}</h3><p class="text-sm text-muted">Wishlist Items</p></div>
            <div class="glass-card text-center"><h3>${(user.addresses || []).length}</h3><p class="text-sm text-muted">Saved Addresses</p></div>
          </div>
          <h3 style="margin-bottom: var(--space-4);">Recent Orders</h3>
          ${(user.orders || []).length > 0 ? `
            <div style="border: 1px solid var(--border-default); border-radius: var(--radius-xl); overflow: hidden;">
              ${(user.orders || []).map(order => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-4); border-bottom: 1px solid var(--border-subtle);">
                  <div><div style="font-weight: var(--fw-semibold);">${order.id}</div><div class="text-xs text-muted">${formatDate(order.date)}</div></div>
                  <span class="badge badge--${order.status === 'delivered' ? 'new' : order.status === 'shipping' ? 'hot' : 'sale'}">${order.status}</span>
                  <div style="font-weight: var(--fw-semibold);">${formatCurrency(order.total)}</div>
                </div>
              `).join('')}
            </div>
          ` : '<p class="text-secondary">No orders yet.</p>'}
        </div>
      </div>
    </div>
  `;
}

/* ── WISHLIST PAGE ── */
export function renderWishlist() {
  const items = wishlist.getAll();
  return `
    <div class="container section--sm">
      <nav class="breadcrumbs"><a href="/">Home</a><span class="breadcrumbs__separator">/</span><span class="breadcrumbs__current">Wishlist</span></nav>
      <h1 style="margin-bottom: var(--space-6);">My Wishlist <span class="text-secondary" style="font-weight: var(--fw-regular); font-size: var(--fs-lg);">(${items.length} items)</span></h1>
      ${items.length === 0 ? `
        <div class="empty-state"><div class="empty-state__icon">${ICONS.heart}</div><h3 class="empty-state__title">Your Wishlist is Empty</h3><p class="empty-state__text">Save items you love for later.</p><a href="/shop" class="btn btn--primary mt-4">Browse Products</a></div>
      ` : `
        <div class="products-grid">
          ${items.map(item => `
            <div style="border: 1px solid var(--border-default); border-radius: var(--radius-xl); overflow: hidden; background: var(--card-bg);">
              <div style="background: ${item.image || 'var(--surface-overlay)'}; aspect-ratio: 3/4; position: relative;">
                <button style="position: absolute; top: var(--space-3); right: var(--space-3);" class="product-card__action-btn product-card__action-btn--active" data-remove-wish="${item.id}">${ICONS.heartFilled}</button>
              </div>
              <div style="padding: var(--space-4);">
                <a href="/product/${item.slug}" style="font-weight: var(--fw-semibold);">${item.name}</a>
                <p class="price mt-2">${formatCurrency(item.price)}</p>
                <button class="btn btn--primary btn--sm btn--block mt-4" data-wish-to-cart="${item.id}">Add to Cart</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

/* ── COMPARE PAGE ── */
export function renderCompare() {
  const items = compare.getAll();
  return `
    <div class="container section--sm">
      <nav class="breadcrumbs"><a href="/">Home</a><span class="breadcrumbs__separator">/</span><span class="breadcrumbs__current">Compare</span></nav>
      <h1 style="margin-bottom: var(--space-6);">Compare Products</h1>
      ${items.length === 0 ? `
        <div class="empty-state"><div class="empty-state__icon">${ICONS.shuffle}</div><h3 class="empty-state__title">No Products to Compare</h3><p class="empty-state__text">Add products to compare their features side by side.</p><a href="/shop" class="btn btn--primary mt-4">Browse Products</a></div>
      ` : `
        <div class="compare-table" style="overflow-x: auto;">
          <table style="width: 100%; min-width: 600px; border-collapse: collapse;">
            <thead><tr><th style="padding: var(--space-4); text-align: left; width: 150px;"></th>${items.map(item => `<th style="padding: var(--space-4); text-align: center;">
              <div style="background: ${item.image || 'var(--surface-overlay)'}; aspect-ratio: 1; border-radius: var(--radius-xl); margin-bottom: var(--space-3);"></div>
              <a href="/product/${item.slug}" style="font-weight: var(--fw-semibold);">${item.name}</a>
              <button class="btn btn--ghost btn--xs mt-2" data-remove-compare="${item.id}">Remove</button>
            </th>`).join('')}</tr></thead>
            <tbody>
              <tr style="border-top: 1px solid var(--border-default);"><td style="padding: var(--space-3); font-weight: var(--fw-semibold);">Price</td>${items.map(i => `<td style="padding: var(--space-3); text-align: center;" class="price">${formatCurrency(i.price)}</td>`).join('')}</tr>
              <tr style="border-top: 1px solid var(--border-default);"><td style="padding: var(--space-3); font-weight: var(--fw-semibold);">Rating</td>${items.map(i => `<td style="padding: var(--space-3); text-align: center;">${generateStarRating(i.rating)} (${i.reviewCount})</td>`).join('')}</tr>
              <tr style="border-top: 1px solid var(--border-default);"><td style="padding: var(--space-3); font-weight: var(--fw-semibold);">Brand</td>${items.map(i => `<td style="padding: var(--space-3); text-align: center;">${i.brand}</td>`).join('')}</tr>
              <tr style="border-top: 1px solid var(--border-default);"><td style="padding: var(--space-3); font-weight: var(--fw-semibold);">Category</td>${items.map(i => `<td style="padding: var(--space-3); text-align: center;">${i.category}</td>`).join('')}</tr>
              <tr style="border-top: 1px solid var(--border-default);"><td style="padding: var(--space-3);"></td>${items.map(i => `<td style="padding: var(--space-3); text-align: center;"><button class="btn btn--primary btn--sm" data-compare-to-cart="${i.id}">Add to Cart</button></td>`).join('')}</tr>
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

/* ── ORDER SUCCESS ── */
export function renderOrderSuccess({ query }) {
  const orderNumber = query.order || 'LX-UNKNOWN';
  return `
    <div class="container section" style="text-align: center;">
      <div style="width: 80px; height: 80px; border-radius: var(--radius-full); background: var(--color-success-100); color: var(--color-success-600); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-6); font-size: 40px;">✓</div>
      <h1 style="color: var(--color-success-600);">Order Confirmed!</h1>
      <p class="text-lead mt-4">Thank you for your purchase. Your order has been placed successfully.</p>
      <div class="glass-card" style="max-width: 500px; margin: var(--space-8) auto; text-align: left;">
        <div class="order-summary__row"><span class="order-summary__label">Order Number</span><span class="order-summary__value" style="font-family: var(--font-family-mono);">${orderNumber}</span></div>
        <div class="order-summary__row"><span class="order-summary__label">Estimated Delivery</span><span class="order-summary__value">${getEstimatedDelivery(5)}</span></div>
        <div class="order-summary__row"><span class="order-summary__label">Status</span><span class="badge badge--new">Processing</span></div>
      </div>
      <div class="btn-group" style="justify-content: center;">
        <a href="/track-order" class="btn btn--primary btn--lg">${icon('package')} Track Order</a>
        <a href="/shop" class="btn btn--secondary btn--lg">Continue Shopping</a>
      </div>
    </div>
  `;
}

/* ── TRACK ORDER ── */
export function renderTrackOrder() {
  return `
    <div class="container section--sm" style="max-width: 700px; margin: 0 auto;">
      <h1 style="text-align: center; margin-bottom: var(--space-8);">Track Your Order</h1>
      <div class="glass-card">
        <form id="track-form" style="display: flex; gap: var(--space-3);">
          <input class="form-input" placeholder="Enter order number (e.g., LX-ORD001)" id="track-input" required>
          <button type="submit" class="btn btn--primary">Track</button>
        </form>
        <div id="track-result" style="margin-top: var(--space-6); display: none;">
          <h4 style="margin-bottom: var(--space-4);">Order Status</h4>
          <div class="timeline">
            <div class="timeline__item timeline__item--completed"><div class="timeline__dot"></div><div class="timeline__title">Order Placed</div><div class="timeline__date">June 28, 2026</div></div>
            <div class="timeline__item timeline__item--completed"><div class="timeline__dot"></div><div class="timeline__title">Payment Confirmed</div><div class="timeline__date">June 28, 2026</div></div>
            <div class="timeline__item timeline__item--active"><div class="timeline__dot"></div><div class="timeline__title">Shipped</div><div class="timeline__description">Your order is on its way!</div><div class="timeline__date">June 29, 2026</div></div>
            <div class="timeline__item"><div class="timeline__dot"></div><div class="timeline__title">Delivered</div><div class="timeline__date">Estimated: ${getEstimatedDelivery(3)}</div></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ── SEARCH RESULTS ── */
export async function renderSearchResults({ query }) {
  await productManager.loadData();
  const q = query.q || '';
  const results = q ? productManager.getAll().filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase())) : [];

  const html = `
    <div class="container section--sm">
      <h1 style="margin-bottom: var(--space-2);">Search Results</h1>
      <p class="text-secondary mb-6">${results.length} results for "<strong>${q}</strong>"</p>
      ${results.length > 0 ? `<div class="products-grid" id="search-grid">${results.map(p => productManager.renderCard(p)).join('')}</div>` : `
        <div class="empty-state"><div class="empty-state__icon">${ICONS.search}</div><h3 class="empty-state__title">No Results Found</h3><p class="empty-state__text">Try a different search term or browse our categories.</p><a href="/shop" class="btn btn--primary mt-4">Browse Shop</a></div>
      `}
    </div>
  `;
  setTimeout(() => { const grid = document.getElementById('search-grid'); if (grid) productManager.bindCardEvents(grid); }, 50);
  return html;
}

/* ── CATEGORIES PAGE ── */
export async function renderCategories() {
  await productManager.loadData();
  const categories = productManager.getCategories();
  return `
    <div class="container section--sm">
      <div class="section__header"><p class="text-overline">Browse</p><h1>All Categories</h1></div>
      <div class="grid grid--3" style="gap: var(--space-6);">
        ${categories.map(cat => `
          <a href="/shop?category=${encodeURIComponent(cat.name)}" class="category-card" style="aspect-ratio: 16/9;">
            <div style="background: ${cat.gradient}; width: 100%; height: 100%;"></div>
            <div class="category-card__overlay"><h3 class="category-card__name">${cat.name}</h3><span class="category-card__count">${cat.productCount} Products</span><p style="color: rgba(255,255,255,0.7); font-size: var(--fs-sm); margin-top: var(--space-1);">${cat.description}</p></div>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

/* ── COLLECTIONS PAGE ── */
export async function renderCollections() {
  await productManager.loadData();
  return `
    <div class="container section--sm">
      <div class="section__header"><p class="text-overline">Curated</p><h1>Collections</h1><p>Handpicked selections for every occasion</p></div>
      <div class="grid grid--2" style="gap: var(--space-6);">
        ${[
          { name: 'Summer Essentials', desc: 'Stay cool and stylish this season', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
          { name: 'Work From Home', desc: 'Comfort meets productivity', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
          { name: 'Gift Guide', desc: 'Perfect presents for everyone', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
          { name: 'Sustainable Living', desc: 'Eco-friendly choices', gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)' }
        ].map(col => `
          <a href="/shop" class="category-card" style="aspect-ratio: 16/9;">
            <div style="background: ${col.gradient}; width: 100%; height: 100%;"></div>
            <div class="category-card__overlay"><h3 class="category-card__name">${col.name}</h3><p style="color: rgba(255,255,255,0.7); font-size: var(--fs-sm);">${col.desc}</p></div>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

/* ── ABOUT PAGE ── */
export function renderAbout() {
  return `
    <div class="container section--sm">
      <div class="section__header"><p class="text-overline">Our Story</p><h1>About LUXE</h1><p>Redefining premium shopping since 2020</p></div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-10); align-items: center; margin-bottom: var(--space-16);" class="about-grid">
        <div style="background: var(--gradient-hero); border-radius: var(--radius-2xl); aspect-ratio: 4/3; display: flex; align-items: center; justify-content: center; font-family: var(--font-family-display); font-size: var(--fs-5xl); color: rgba(255,255,255,0.2); font-weight: var(--fw-extrabold);">LUXE</div>
        <div>
          <h3 style="margin-bottom: var(--space-4);">Our Mission</h3>
          <p style="color: var(--text-secondary); line-height: var(--lh-relaxed); margin-bottom: var(--space-4);">At LUXE, we believe that premium quality should be accessible to everyone. We carefully curate our collections from the world's finest brands and artisans, ensuring every product meets our exacting standards.</p>
          <p style="color: var(--text-secondary); line-height: var(--lh-relaxed);">Founded in 2020, we have grown from a small boutique concept to a global destination for discerning shoppers who value quality, craftsmanship, and exceptional design.</p>
        </div>
      </div>
      <div class="grid grid--4 stagger-children" style="text-align: center; margin-bottom: var(--space-16);">
        ${[{ num: '50K+', label: 'Happy Customers' }, { num: '500+', label: 'Premium Products' }, { num: '50+', label: 'Global Brands' }, { num: '99%', label: 'Satisfaction Rate' }].map(s => `
          <div class="glass-card"><h2 class="text-gradient">${s.num}</h2><p class="text-sm text-muted mt-2">${s.label}</p></div>
        `).join('')}
      </div>
    </div>
  `;
}

/* ── CONTACT PAGE ── */
export function renderContact() {
  return `
    <div class="container section--sm">
      <div class="section__header"><p class="text-overline">Get in Touch</p><h1>Contact Us</h1><p>We'd love to hear from you</p></div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-10);" class="about-grid">
        <div class="glass-card">
          <h3 style="margin-bottom: var(--space-6);">Send a Message</h3>
          <form id="contact-form">
            <div class="form-group"><label class="form-label form-label--required">Name</label><input class="form-input" name="name" placeholder="Your name" required></div>
            <div class="form-group"><label class="form-label form-label--required">Email</label><input class="form-input" name="email" type="email" placeholder="your@email.com" required></div>
            <div class="form-group"><label class="form-label">Subject</label><input class="form-input" name="subject" placeholder="How can we help?"></div>
            <div class="form-group"><label class="form-label form-label--required">Message</label><textarea class="form-input form-textarea" name="message" placeholder="Tell us more..." required></textarea></div>
            <button type="submit" class="btn btn--primary btn--lg btn--block">Send Message</button>
          </form>
        </div>
        <div>
          <div class="glass-card" style="margin-bottom: var(--space-4);">
            <div style="display: flex; gap: var(--space-3); align-items: center;"><span style="color: var(--color-primary-600);">${ICONS.mapPin}</span><div><h5>Address</h5><p class="text-sm text-secondary">${CONFIG.CONTACT.address}</p></div></div>
          </div>
          <div class="glass-card" style="margin-bottom: var(--space-4);">
            <div style="display: flex; gap: var(--space-3); align-items: center;"><span style="color: var(--color-primary-600);">${ICONS.phone}</span><div><h5>Phone</h5><p class="text-sm text-secondary">${CONFIG.CONTACT.phone}</p></div></div>
          </div>
          <div class="glass-card" style="margin-bottom: var(--space-4);">
            <div style="display: flex; gap: var(--space-3); align-items: center;"><span style="color: var(--color-primary-600);">${ICONS.mail}</span><div><h5>Email</h5><p class="text-sm text-secondary">${CONFIG.CONTACT.email}</p></div></div>
          </div>
          <div class="glass-card">
            <div style="display: flex; gap: var(--space-3); align-items: center;"><span style="color: var(--color-primary-600);">${ICONS.clock}</span><div><h5>Hours</h5><p class="text-sm text-secondary">${CONFIG.CONTACT.hours}</p></div></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ── FAQ PAGE ── */
export function renderFAQ() {
  const faqs = [
    { category: 'Orders', items: [{ q: 'How do I track my order?', a: 'Once your order ships, you will receive a tracking number via email. You can also track your order from your account dashboard.' }, { q: 'Can I modify my order after placing it?', a: 'You can modify your order within 1 hour of placing it. Contact our support team for assistance.' }] },
    { category: 'Shipping', items: [{ q: 'How long does shipping take?', a: 'Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days.' }, { q: 'Do you offer free shipping?', a: 'Yes! We offer free standard shipping on all orders over $100.' }] },
    { category: 'Returns', items: [{ q: 'What is your return policy?', a: 'We offer a 30-day hassle-free return policy on all unworn/unused items with original tags.' }, { q: 'How do I initiate a return?', a: 'Go to your account, find the order, and click "Return Item". Follow the instructions to generate a return label.' }] },
    { category: 'Payments', items: [{ q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, AMEX), PayPal, and Apple Pay.' }, { q: 'Is my payment information secure?', a: 'Absolutely. All payments are processed through SSL-encrypted connections. We never store your card details.' }] }
  ];

  return `
    <div class="container section--sm" style="max-width: 800px; margin: 0 auto;">
      <div class="section__header"><p class="text-overline">Help Center</p><h1>Frequently Asked Questions</h1></div>
      ${faqs.map(cat => `
        <div style="margin-bottom: var(--space-8);">
          <h3 style="margin-bottom: var(--space-4);">${cat.category}</h3>
          <div class="accordion" data-faq-accordion>
            ${cat.items.map(item => `
              <div class="accordion__item">
                <button class="accordion__trigger">${item.q}<span class="accordion__icon">${ICONS.chevronDown}</span></button>
                <div class="accordion__content"><div class="accordion__body">${item.a}</div></div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
      <div class="glass-card text-center" style="margin-top: var(--space-8);"><p>Still have questions?</p><a href="/contact" class="btn btn--primary mt-4">Contact Support</a></div>
    </div>
  `;
}

/* ── BLOG PAGE ── */
export function renderBlog() {
  const posts = [
    { slug: 'summer-fashion-trends', title: '10 Summer Fashion Trends for 2026', excerpt: 'Discover the hottest fashion trends this season and how to style them.', date: '2026-06-15', category: 'Fashion', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { slug: 'sustainable-fashion-guide', title: 'Your Guide to Sustainable Fashion', excerpt: 'Learn how to build an eco-conscious wardrobe without sacrificing style.', date: '2026-06-10', category: 'Lifestyle', gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
    { slug: 'skincare-routine', title: 'The Perfect Morning Skincare Routine', excerpt: 'Expert tips for a glowing complexion every morning.', date: '2026-06-05', category: 'Beauty', gradient: 'linear-gradient(135deg, #f5576c, #ff6f91)' },
    { slug: 'home-office-setup', title: 'Create the Ultimate Home Office', excerpt: 'Transform your workspace with these premium essentials.', date: '2026-05-28', category: 'Home', gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)' }
  ];

  return `
    <div class="container section--sm">
      <div class="section__header"><p class="text-overline">Journal</p><h1>The LUXE Blog</h1><p>Style tips, trends, and inspiration</p></div>
      <div class="grid grid--2" style="gap: var(--space-8);">
        ${posts.map(post => `
          <article class="product-card" style="cursor: pointer;" onclick="window.location.hash=''; window.scrollTo(0,0);">
            <div style="background: ${post.gradient}; aspect-ratio: 16/9; border-radius: var(--radius-xl) var(--radius-xl) 0 0;"></div>
            <div style="padding: var(--space-5);">
              <div style="display: flex; gap: var(--space-3); margin-bottom: var(--space-2);">
                <span class="badge badge--new">${post.category}</span>
                <span class="text-xs text-muted">${formatDate(post.date)}</span>
              </div>
              <h3 style="font-size: var(--fs-lg); margin-bottom: var(--space-2);">${post.title}</h3>
              <p class="text-sm text-secondary">${post.excerpt}</p>
            </div>
          </article>
        `).join('')}
      </div>
    </div>
  `;
}

/* ── PRIVACY POLICY ── */
export function renderPrivacy() {
  return `<div class="container section--sm" style="max-width: 800px; margin: 0 auto;">
    <h1 style="margin-bottom: var(--space-6);">Privacy Policy</h1><p class="text-sm text-muted mb-8">Last updated: June 2026</p>
    ${['Information We Collect', 'How We Use Your Information', 'Data Sharing', 'Data Security', 'Your Rights', 'Contact Us'].map(title => `
      <section style="margin-bottom: var(--space-8);"><h3 style="margin-bottom: var(--space-3);">${title}</h3><p style="color: var(--text-secondary); line-height: var(--lh-relaxed);">At LUXE, we are committed to protecting your privacy. This section details our practices regarding ${title.toLowerCase()}. We collect only the information necessary to provide you with the best shopping experience, and we never sell your personal data to third parties.</p></section>
    `).join('')}
  </div>`;
}

/* ── TERMS OF SERVICE ── */
export function renderTerms() {
  return `<div class="container section--sm" style="max-width: 800px; margin: 0 auto;">
    <h1 style="margin-bottom: var(--space-6);">Terms of Service</h1><p class="text-sm text-muted mb-8">Last updated: June 2026</p>
    ${['General Terms', 'User Accounts', 'Orders & Payments', 'Shipping & Delivery', 'Returns & Refunds', 'Intellectual Property', 'Limitation of Liability'].map(title => `
      <section style="margin-bottom: var(--space-8);"><h3 style="margin-bottom: var(--space-3);">${title}</h3><p style="color: var(--text-secondary); line-height: var(--lh-relaxed);">These terms govern your use of the LUXE platform. By accessing our website, you agree to comply with these terms. This section covers ${title.toLowerCase()} and outlines the rights and responsibilities of both LUXE and our customers.</p></section>
    `).join('')}
  </div>`;
}

/* ── 404 NOT FOUND ── */
export function renderNotFound() {
  return `
    <div class="container section" style="text-align: center;">
      <div style="font-family: var(--font-family-display); font-size: clamp(6rem, 15vw, 12rem); font-weight: var(--fw-extrabold); line-height: 1; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: var(--space-4);">404</div>
      <h2 style="margin-bottom: var(--space-3);">Page Not Found</h2>
      <p class="text-lead" style="max-width: 400px; margin: 0 auto var(--space-8);">The page you're looking for doesn't exist or has been moved.</p>
      <div class="btn-group" style="justify-content: center;">
        <a href="/" class="btn btn--primary btn--lg">${icon('home')} Go Home</a>
        <a href="/shop" class="btn btn--secondary btn--lg">Browse Shop</a>
      </div>
    </div>
  `;
}
