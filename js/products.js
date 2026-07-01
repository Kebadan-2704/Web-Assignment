/* ============================================
   PRODUCTS — Product Data Loading & Rendering
   ============================================ */

import { formatCurrency, generateStarRating, calculateDiscount, icon, ICONS, generateProductGradient } from './helpers.js';
import { wishlist } from './wishlist.js';
import { compare } from './wishlist.js';
import { cart } from './cart.js';
import { localStore } from './storage.js';
import { eventBus } from './utils.js';
import { CONFIG } from './config.js';
import { Toast } from './ui.js';
import { supabase } from './supabase.js';

class ProductManager {
  constructor() {
    this.products = [];
    this.categories = [];
    this.loaded = false;
  }

  /**
   * Load product data from JSON
   */
  async loadData() {
    if (this.loaded) return;

    try {
      if (CONFIG.USE_SUPABASE_DB) {
        /* Try to fetch from Supabase first */
        const { data: pData, error: pError } = await supabase.from('products').select('*');
        const { data: cData, error: cError } = await supabase.from('categories').select('*');

        if (pError) throw pError;

        if (pData && pData.length > 0) {
          /* Map lowercase Postgres columns back to camelCase for the frontend */
          this.products = pData.map(p => ({
            ...p,
            salePrice: p.saleprice !== undefined ? p.saleprice : p.salePrice,
            reviewCount: p.reviewcount !== undefined ? p.reviewcount : p.reviewCount
          }));

          this.categories = (cData || []).map(c => ({
            ...c,
            productCount: c.productcount !== undefined ? c.productcount : c.productCount
          }));

          this.loaded = true;
          return;
        }
      }
    } catch (error) {
      console.warn('Supabase fetch failed or table missing. Falling back to local data.');
    }

    /* Fallback to local JSON if Supabase fails or is empty */
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('./data/products.json'),
        fetch('./data/categories.json')
      ]);

      this.products = await productsRes.json();
      this.categories = await categoriesRes.json();
    } catch (error) {
      console.error('Failed to load local JSON data:', error);
      this.products = this._getFallbackProducts();
      this.categories = this._getFallbackCategories();
    }

    this.loaded = true;
  }

  /**
   * Get all products
   */
  getAll() {
    return this.products;
  }

  /**
   * Get product by slug
   */
  getBySlug(slug) {
    return this.products.find(p => p.slug === slug);
  }

  /**
   * Get product by ID
   */
  getById(id) {
    return this.products.find(p => p.id === id);
  }

  /**
   * Get products by category
   */
  getByCategory(category) {
    return this.products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  /**
   * Get featured products
   */
  getFeatured() {
    return this.products.filter(p => p.featured).slice(0, 8);
  }

  /**
   * Get products on sale
   */
  getOnSale() {
    return this.products.filter(p => p.salePrice && p.salePrice < p.price);
  }

  /**
   * Get new arrivals
   */
  getNewArrivals() {
    return this.products.filter(p => p.badges?.includes('new')).slice(0, 8);
  }

  /**
   * Get trending/best sellers
   */
  getTrending() {
    return [...this.products].sort((a, b) => b.rating - a.rating).slice(0, 8);
  }

  /**
   * Get related products
   */
  getRelated(product, limit = 4) {
    return this.products
      .filter(p => p.id !== product.id && p.category === product.category)
      .slice(0, limit);
  }

  /**
   * Get recently viewed products
   */
  getRecentlyViewed() {
    const ids = localStore.get('recentlyViewed', []);
    return ids.map(id => this.getById(id)).filter(Boolean).slice(0, CONFIG.MAX_RECENT_VIEWED);
  }

  /**
   * Track product view
   */
  trackView(productId) {
    const viewed = localStore.get('recentlyViewed', []);
    const updated = [productId, ...viewed.filter(id => id !== productId)].slice(0, CONFIG.MAX_RECENT_VIEWED);
    localStore.set('recentlyViewed', updated);
  }

  /**
   * Get all categories
   */
  getCategories() {
    return this.categories;
  }

  /**
   * Render a product card
   */
  renderCard(product) {
    const isWished = wishlist.has(product.id);
    const discount = calculateDiscount(product.price, product.salePrice);
    const gradient = product.gradient || generateProductGradient(product.category, product.id);
    const bgStyle = product.images && product.images.length > 0
      ? `background: url('${product.images[0]}') center/cover no-repeat;`
      : `background: ${gradient};`;

    return `
      <article class="product-card" data-product-id="${product.id}">
        <div class="product-card__image">
          <div class="product-card__img" role="img" aria-label="${product.name}" style="${bgStyle} width: 100%; height: 100%;"></div>

          ${product.badges?.length ? `
            <div class="product-card__badges">
              ${product.badges.map(badge => `<span class="badge badge--${badge}">${badge}</span>`).join('')}
            </div>
          ` : ''}
          ${discount > 0 ? `<div class="product-card__badges"><span class="badge badge--sale">-${discount}%</span></div>` : ''}

          <div class="product-card__actions">
            <button class="product-card__action-btn ${isWished ? 'product-card__action-btn--active' : ''}"
                    data-wishlist-toggle="${product.id}"
                    aria-label="${isWished ? 'Remove from wishlist' : 'Add to wishlist'}"
                    title="Wishlist">
              ${isWished ? ICONS.heartFilled : ICONS.heart}
            </button>
            <button class="product-card__action-btn"
                    data-compare-toggle="${product.id}"
                    aria-label="Add to compare"
                    title="Compare">
              ${ICONS.shuffle}
            </button>
            <button class="product-card__action-btn"
                    data-quick-view="${product.slug}"
                    aria-label="Quick view"
                    title="Quick View">
              ${ICONS.eye}
            </button>
          </div>

          <div class="product-card__quick-add">
            <button class="btn" data-add-to-cart="${product.id}">Add to Cart</button>
          </div>
        </div>

        <div class="product-card__body">
          <span class="product-card__category">${product.category}</span>
          <h3 class="product-card__name">
            <a href="/product/${product.slug}" data-nav-link>${product.name}</a>
          </h3>

          ${product.colors?.length ? `
            <div class="product-card__colors">
              ${product.colors.slice(0, 5).map(color => `
                <span class="color-swatch" style="background: ${color}" title="${color}" aria-label="Color: ${color}"></span>
              `).join('')}
              ${product.colors.length > 5 ? `<span class="text-xs text-muted">+${product.colors.length - 5}</span>` : ''}
            </div>
          ` : ''}

          <div class="rating">
            ${generateStarRating(product.rating)}
            <span class="rating__count">(${product.reviewCount})</span>
          </div>

          <div class="product-card__price">
            ${product.salePrice ? `
              <span class="price price--sale">${formatCurrency(product.salePrice)}</span>
              <span class="price price--original">${formatCurrency(product.price)}</span>
            ` : `
              <span class="price">${formatCurrency(product.price)}</span>
            `}
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Render a grid of product cards
   */
  renderGrid(products, className = 'products-grid') {
    if (products.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state__icon">${ICONS.package}</div>
          <h3 class="empty-state__title">No Products Found</h3>
          <p class="empty-state__text">Try adjusting your filters or search criteria.</p>
        </div>
      `;
    }

    return `<div class="${className}">${products.map(p => this.renderCard(p)).join('')}</div>`;
  }

  /**
   * Bind product card interaction events
   */
  bindCardEvents(container) {
    if (!container) return;

    /* Wishlist toggle */
    container.querySelectorAll('[data-wishlist-toggle]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = parseInt(btn.dataset.wishlistToggle);
        const product = this.getById(id);
        if (!product) return;

        const added = wishlist.toggle(product);
        btn.classList.toggle('product-card__action-btn--active', added);
        btn.innerHTML = added ? ICONS.heartFilled : ICONS.heart;
        Toast.show({
          type: 'success',
          title: added ? 'Added to Wishlist' : 'Removed from Wishlist',
          message: product.name,
          duration: 2000
        });
      });
    });

    /* Compare toggle */
    container.querySelectorAll('[data-compare-toggle]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = parseInt(btn.dataset.compareToggle);
        const product = this.getById(id);
        if (!product) return;

        const result = compare.toggle(product);
        if (typeof result === 'object' && !result.success) {
          Toast.warning('Compare', result.message);
        } else {
          Toast.success('Compare', result ? 'Added to compare' : 'Removed from compare');
        }
      });
    });

    /* Add to cart */
    container.querySelectorAll('[data-add-to-cart]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = parseInt(btn.dataset.addToCart);
        const product = this.getById(id);
        if (!product) return;

        cart.addItem(product);
        Toast.success('Added to Cart', `${product.name} has been added to your cart.`);
      });
    });

    /* Quick view */
    container.querySelectorAll('[data-quick-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const slug = btn.dataset.quickView;
        const product = this.getBySlug(slug);
        if (!product) return;
        this._showQuickView(product);
      });
    });
  }

  /**
   * Show quick view modal
   */
  _showQuickView(product) {
    import('./ui.js').then(({ Modal }) => {
      const discount = calculateDiscount(product.price, product.salePrice);
      const gradient = product.gradient || generateProductGradient(product.category, product.id);
      Modal.show({
        title: '',
        size: 'lg',
        content: `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);">
            <div style="background: ${gradient}; border-radius: var(--radius-xl); aspect-ratio: 1; width: 100%;"></div>
            <div>
              <span class="text-caption">${product.category}</span>
              <h3 style="margin: var(--space-2) 0;">${product.name}</h3>
              <div class="rating" style="margin-bottom: var(--space-3);">
                ${generateStarRating(product.rating)}
                <span class="rating__count">(${product.reviewCount} reviews)</span>
              </div>
              <div style="margin-bottom: var(--space-4);">
                ${product.salePrice ? `
                  <span class="price price--sale price--large">${formatCurrency(product.salePrice)}</span>
                  <span class="price price--original" style="margin-left: var(--space-2);">${formatCurrency(product.price)}</span>
                  <span class="badge badge--sale" style="margin-left: var(--space-2);">-${discount}%</span>
                ` : `
                  <span class="price price--large">${formatCurrency(product.price)}</span>
                `}
              </div>
              <p style="color: var(--text-secondary); font-size: var(--fs-sm); margin-bottom: var(--space-4);">${product.description || ''}</p>
              <div class="btn-group" style="margin-top: var(--space-4);">
                <button class="btn btn--primary" data-add-to-cart="${product.id}" onclick="this.closest('.modal-backdrop')?.remove(); document.body.style.overflow='';">Add to Cart</button>
                <a href="/product/${product.slug}" class="btn btn--secondary">View Details</a>
              </div>
            </div>
          </div>
        `
      });
    });
  }

  /* Fallback data if JSON fetch fails */
  _getFallbackProducts() {
    return [
      { id: 1, name: 'Premium Leather Jacket', slug: 'premium-leather-jacket', category: 'Fashion', brand: 'LUXE Originals', price: 24999, salePrice: 20999, rating: 4.8, reviewCount: 124, stock: 15, badges: ['hot'], featured: true, colors: ['#1a1a1a', '#8B4513', '#4a2c2a'], sizes: ['S', 'M', 'L', 'XL'], gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', description: 'Handcrafted from premium Italian leather with a modern slim fit.', images: [], tags: ['leather', 'jacket', 'premium'], specifications: { Material: '100% Italian Leather', Fit: 'Slim Fit', Lining: 'Silk Blend', Care: 'Professional Leather Clean' } },
      { id: 2, name: 'Wireless Noise-Cancelling Headphones', slug: 'wireless-noise-cancelling-headphones', category: 'Electronics', brand: 'SoundElite', price: 29999, salePrice: 23999, rating: 4.9, reviewCount: 256, stock: 30, badges: ['new'], featured: true, colors: ['#1a1a1a', '#c0c0c0', '#1e3a5f'], gradient: 'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)', description: 'Experience pure sound with active noise cancellation and 40-hour battery.', images: [], tags: ['headphones', 'wireless', 'audio'], specifications: { Driver: '40mm Custom', Battery: '40 hours', Noise: 'Active NC', Bluetooth: '5.3' } },
      { id: 3, name: 'Classic Running Shoes', slug: 'classic-running-shoes', category: 'Sports', brand: 'RunPro', price: 14999, salePrice: null, rating: 4.6, reviewCount: 89, stock: 45, badges: [], featured: true, colors: ['#ffffff', '#1a1a1a', '#ff4444'], sizes: ['7', '8', '9', '10', '11', '12'], gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', description: 'Engineered for performance with responsive cushioning.', images: [], tags: ['shoes', 'running', 'sports'], specifications: { Upper: 'Breathable Mesh', Sole: 'Responsive Foam', Weight: '280g', Drop: '8mm' } },
      { id: 4, name: 'Organic Face Serum', slug: 'organic-face-serum', category: 'Beauty', brand: 'GlowNaturals', price: 7499, salePrice: 5999, rating: 4.7, reviewCount: 203, stock: 60, badges: ['sale'], featured: true, colors: [], gradient: 'linear-gradient(135deg, #f5576c 0%, #ff6f91 100%)', description: 'Vitamin C enriched serum for radiant, youthful skin.', images: [], tags: ['skincare', 'serum', 'organic'], specifications: { Volume: '30ml', Ingredients: 'Vitamin C, Hyaluronic Acid', 'Skin Type': 'All Skin Types', Usage: 'Twice Daily' } },
      { id: 5, name: 'Minimalist Ceramic Vase', slug: 'minimalist-ceramic-vase', category: 'Home', brand: 'ArtHome', price: 4999, salePrice: null, rating: 4.5, reviewCount: 67, stock: 25, badges: ['new'], featured: true, colors: ['#ffffff', '#f5f5dc', '#808080'], gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', description: 'Hand-crafted ceramic vase with a contemporary design.', images: [], tags: ['vase', 'home', 'decor'], specifications: { Material: 'Premium Ceramic', Height: '30cm', Weight: '1.2kg', Care: 'Hand Wash' } },
      { id: 6, name: 'Designer Sunglasses', slug: 'designer-sunglasses', category: 'Fashion', brand: 'VisionLux', price: 16999, salePrice: 13499, rating: 4.4, reviewCount: 178, stock: 35, badges: ['sale'], featured: true, colors: ['#1a1a1a', '#8B4513', '#4169E1'], gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', description: 'UV400 protection with polarized lenses in a timeless aviator frame.', images: [], tags: ['sunglasses', 'fashion', 'accessories'], specifications: { Lens: 'Polarized UV400', Frame: 'Titanium Alloy', Weight: '28g', Case: 'Included' } },
      { id: 7, name: 'Smart Fitness Watch', slug: 'smart-fitness-watch', category: 'Electronics', brand: 'TechFit', price: 20999, salePrice: null, rating: 4.6, reviewCount: 312, stock: 50, badges: ['hot'], featured: true, colors: ['#1a1a1a', '#c0c0c0', '#003366'], gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', description: 'Advanced health monitoring with GPS and 7-day battery life.', images: [], tags: ['watch', 'fitness', 'smart'], specifications: { Display: '1.4" AMOLED', Battery: '7 days', Water: '5ATM', Sensors: 'HR, SpO2, GPS' } },
      { id: 8, name: 'Cashmere Blend Scarf', slug: 'cashmere-blend-scarf', category: 'Fashion', brand: 'LUXE Originals', price: 10999, salePrice: 8499, rating: 4.8, reviewCount: 95, stock: 20, badges: [], featured: true, colors: ['#8B0000', '#191970', '#808080', '#F5F5DC'], gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', description: 'Luxuriously soft cashmere blend scarf for effortless elegance.', images: [], tags: ['scarf', 'cashmere', 'winter'], specifications: { Material: '70% Cashmere, 30% Silk', Size: '200cm x 70cm', Weight: '180g', Care: 'Dry Clean' } },
      { id: 9, name: 'Yoga Mat Premium', slug: 'yoga-mat-premium', category: 'Sports', brand: 'ZenFit', price: 6999, salePrice: null, rating: 4.7, reviewCount: 142, stock: 40, badges: ['new'], featured: false, colors: ['#4B0082', '#008080', '#FF6347'], gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', description: 'Eco-friendly TPE yoga mat with superior grip and cushioning.', images: [], tags: ['yoga', 'mat', 'fitness'], specifications: { Material: 'TPE Eco-Friendly', Thickness: '6mm', Size: '183cm x 61cm', Weight: '1.5kg' } },
      { id: 10, name: 'Luxury Candle Set', slug: 'luxury-candle-set', category: 'Home', brand: 'ArtHome', price: 3999, salePrice: 2999, rating: 4.6, reviewCount: 88, stock: 55, badges: ['sale'], featured: false, colors: [], gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', description: 'Set of 3 hand-poured soy candles with natural essential oils.', images: [], tags: ['candle', 'home', 'gift'], specifications: { Material: 'Soy Wax', 'Burn Time': '45 hours each', Scents: 'Lavender, Vanilla, Cedar', Quantity: '3 candles' } },
      { id: 11, name: 'Anti-Aging Night Cream', slug: 'anti-aging-night-cream', category: 'Beauty', brand: 'GlowNaturals', price: 9999, salePrice: null, rating: 4.5, reviewCount: 167, stock: 30, badges: [], featured: false, colors: [], gradient: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)', description: 'Retinol-enriched night cream for firmer, younger-looking skin.', images: [], tags: ['cream', 'anti-aging', 'skincare'], specifications: { Volume: '50ml', 'Key Ingredient': 'Retinol 0.5%', 'Skin Type': 'Mature Skin', Usage: 'Nightly' } },
      { id: 12, name: 'Bluetooth Portable Speaker', slug: 'bluetooth-portable-speaker', category: 'Electronics', brand: 'SoundElite', price: 12999, salePrice: 9999, rating: 4.5, reviewCount: 198, stock: 65, badges: ['sale'], featured: false, colors: ['#1a1a1a', '#FF4500', '#006400'], gradient: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)', description: 'Waterproof portable speaker with 360° immersive sound.', images: [], tags: ['speaker', 'bluetooth', 'portable'], specifications: { Output: '30W', Battery: '12 hours', Waterproof: 'IPX7', Bluetooth: '5.0' } },
      { id: 13, name: 'Silk Blend Dress Shirt', slug: 'silk-blend-dress-shirt', category: 'Fashion', brand: 'LUXE Originals', price: 12999, salePrice: null, rating: 4.4, reviewCount: 76, stock: 22, badges: [], featured: false, colors: ['#FFFFFF', '#87CEEB', '#FFC0CB', '#000000'], sizes: ['S', 'M', 'L', 'XL', 'XXL'], gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', description: 'Premium silk blend dress shirt for a sophisticated look.', images: [], tags: ['shirt', 'silk', 'formal'], specifications: { Material: '60% Silk, 40% Cotton', Fit: 'Regular', Collar: 'Spread', Care: 'Dry Clean Recommended' } },
      { id: 14, name: 'Essential Oil Diffuser', slug: 'essential-oil-diffuser', category: 'Home', brand: 'ArtHome', price: 5999, salePrice: null, rating: 4.8, reviewCount: 231, stock: 48, badges: ['hot'], featured: false, colors: ['#FFFFFF', '#D2B48C'], gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', description: 'Ultrasonic aromatherapy diffuser with ambient LED lighting.', images: [], tags: ['diffuser', 'aromatherapy', 'wellness'], specifications: { Capacity: '400ml', Runtime: '10 hours', Features: '7 LED Colors', Coverage: '30-50m²' } },
      { id: 15, name: 'Performance Training Shorts', slug: 'performance-training-shorts', category: 'Sports', brand: 'RunPro', price: 3999, salePrice: 2999, rating: 4.3, reviewCount: 54, stock: 75, badges: ['sale'], featured: false, colors: ['#1a1a1a', '#191970', '#228B22'], sizes: ['S', 'M', 'L', 'XL'], gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', description: 'Moisture-wicking training shorts with zippered pockets.', images: [], tags: ['shorts', 'training', 'gym'], specifications: { Material: 'Polyester/Elastane', Features: 'Moisture-Wicking', Pockets: '2 Zippered', Length: '7 inch' } },
      { id: 16, name: 'Rose Gold Watch', slug: 'rose-gold-watch', category: 'Fashion', brand: 'VisionLux', price: 32999, salePrice: 27999, rating: 4.9, reviewCount: 87, stock: 10, badges: ['hot'], featured: false, colors: ['#B76E79'], gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', description: 'Elegant rose gold timepiece with sapphire crystal glass.', images: [], tags: ['watch', 'rose gold', 'luxury'], specifications: { Movement: 'Swiss Quartz', Case: '36mm Rose Gold', Crystal: 'Sapphire', Water: '50m' } },
      { id: 17, name: 'Lip Care Collection', slug: 'lip-care-collection', category: 'Beauty', brand: 'GlowNaturals', price: 2999, salePrice: null, rating: 4.6, reviewCount: 145, stock: 80, badges: ['new'], featured: false, colors: ['#FF69B4', '#DC143C', '#CD853F'], gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', description: 'Nourishing lip care trio: balm, scrub, and mask.', images: [], tags: ['lip care', 'beauty', 'set'], specifications: { Contents: 'Balm, Scrub, Mask', Weight: '30g total', Ingredients: 'Shea Butter, Vitamin E', Cruelty: 'Cruelty-Free' } },
      { id: 18, name: 'Ergonomic Office Chair', slug: 'ergonomic-office-chair', category: 'Home', brand: 'ComfortPro', price: 41999, salePrice: 32999, rating: 4.7, reviewCount: 112, stock: 8, badges: ['sale'], featured: false, colors: ['#1a1a1a', '#808080'], gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', description: 'Premium ergonomic chair with lumbar support and breathable mesh.', images: [], tags: ['chair', 'office', 'ergonomic'], specifications: { Material: 'Mesh + Memory Foam', Adjustable: 'Height, Arms, Lumbar', Weight: '18kg', Warranty: '5 Years' } },
      { id: 19, name: 'Wireless Earbuds Pro', slug: 'wireless-earbuds-pro', category: 'Electronics', brand: 'SoundElite', price: 16999, salePrice: 13999, rating: 4.8, reviewCount: 345, stock: 70, badges: ['hot'], featured: false, colors: ['#FFFFFF', '#1a1a1a'], gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', description: 'True wireless earbuds with studio-quality audio and ANC.', images: [], tags: ['earbuds', 'wireless', 'audio'], specifications: { Driver: '11mm', ANC: 'Hybrid ANC', Battery: '8h + 24h case', Codec: 'LDAC, aptX' } },
      { id: 20, name: 'Cotton Linen Throw Blanket', slug: 'cotton-linen-throw-blanket', category: 'Home', brand: 'ArtHome', price: 7499, salePrice: null, rating: 4.5, reviewCount: 63, stock: 35, badges: [], featured: false, colors: ['#F5F5DC', '#D2B48C', '#808080'], gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', description: 'Soft cotton-linen throw blanket for cozy living spaces.', images: [], tags: ['blanket', 'throw', 'home'], specifications: { Material: 'Cotton/Linen Blend', Size: '150cm x 200cm', Weight: '800g', Care: 'Machine Washable' } }
    ];
  }

  _getFallbackCategories() {
    return [
      { id: 1, name: 'Fashion', slug: 'fashion', description: 'Curated fashion for the modern individual', productCount: 6, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      { id: 2, name: 'Electronics', slug: 'electronics', description: 'Cutting-edge technology and gadgets', productCount: 4, gradient: 'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)' },
      { id: 3, name: 'Home', slug: 'home', description: 'Beautiful pieces for your living space', productCount: 5, gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
      { id: 4, name: 'Beauty', slug: 'beauty', description: 'Premium skincare and beauty essentials', productCount: 3, gradient: 'linear-gradient(135deg, #f5576c 0%, #ff6f91 100%)' },
      { id: 5, name: 'Sports', slug: 'sports', description: 'Performance gear for active lifestyles', productCount: 3, gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' }
    ];
  }
}

export const productManager = new ProductManager();