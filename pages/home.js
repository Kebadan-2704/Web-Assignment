/* ============================================
   HOME PAGE — Hero, Categories, Products, etc.
   ============================================ */

import { productManager } from '../js/products.js';
import { formatCurrency, generateStarRating, icon, ICONS, getInitials } from '../js/helpers.js';
import { CONFIG } from '../js/config.js';

export async function renderHome() {
  await productManager.loadData();
  
  const featured = productManager.getFeatured();
  const trending = productManager.getTrending();
  const onSale = productManager.getOnSale();
  const categories = productManager.getCategories();
  const recentlyViewed = productManager.getRecentlyViewed();
  
  let banners = [];
  try {
    const res = await fetch('./data/banners.json');
    banners = await res.json();
  } catch { 
    banners = [{ id: 1, title: 'Summer Collection 2026', subtitle: 'Discover premium fashion', cta: 'Shop Now', ctaLink: '/shop', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6366f1 100%)' }];
  }

  const html = `
    <!-- Hero Carousel -->
    <section class="hero-carousel" aria-label="Featured promotions">
      <div class="hero-carousel__track" id="hero-track">
        ${banners.map((banner, i) => `
          <div class="hero-carousel__slide" style="background: ${banner.image ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('${banner.image}') center/cover no-repeat` : banner.gradient};" role="group" aria-label="Slide ${i + 1} of ${banners.length}">
            <div class="hero-carousel__content animate-on-scroll">
              <p class="text-overline" style="color: rgba(255,255,255,0.7);">LUXE Collection</p>
              <h1 style="color: white; margin-bottom: var(--space-4);">${banner.title}</h1>
              <p style="color: rgba(255,255,255,0.8); font-size: var(--fs-lg); margin-bottom: var(--space-6); max-width: 500px;">${banner.subtitle}</p>
              <div class="btn-group">
                <a href="${banner.ctaLink}" class="btn btn--primary btn--lg">${banner.cta} ${ICONS.arrowRight}</a>
                <a href="/collections" class="btn btn--secondary btn--lg" style="background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: white;">View Collections</a>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="hero-carousel__nav" id="hero-nav">
        ${banners.map((_, i) => `<button class="hero-carousel__dot ${i === 0 ? 'hero-carousel__dot--active' : ''}" data-hero-dot="${i}" aria-label="Go to slide ${i + 1}"></button>`).join('')}
      </div>
      <button class="hero-carousel__arrow hero-carousel__arrow--prev" id="hero-prev" aria-label="Previous slide">${ICONS.chevronLeft}</button>
      <button class="hero-carousel__arrow hero-carousel__arrow--next" id="hero-next" aria-label="Next slide">${ICONS.chevronRight}</button>
    </section>

    <!-- Featured Categories -->
    <section class="section" aria-labelledby="categories-heading">
      <div class="container">
        <div class="section__header animate-on-scroll">
          <p class="text-overline">Browse</p>
          <h2 id="categories-heading">Shop by Category</h2>
          <p>Explore our curated collections across premium categories</p>
        </div>
        <div class="grid grid--auto-fit stagger-children" style="--min-col: 200px;">
          ${categories.map(cat => `
            <a href="/shop?category=${encodeURIComponent(cat.name)}" class="category-card">
              <div class="category-card__image" role="img" aria-label="${cat.name} category" style="background: ${cat.image ? `url('${cat.image}') center/cover no-repeat` : cat.gradient}; width: 100%; height: 100%;"></div>
              <div class="category-card__overlay">
                <h3 class="category-card__name">${cat.name}</h3>
                <span class="category-card__count">${cat.productCount} Products</span>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Trending Products -->
    <section class="section" style="background: var(--surface-raised);" aria-labelledby="trending-heading">
      <div class="container">
        <div class="section__header animate-on-scroll">
          <p class="text-overline">Popular</p>
          <h2 id="trending-heading">Trending Now</h2>
          <p>Our most popular products based on customer ratings</p>
        </div>
        <div class="products-grid stagger-children" id="trending-grid">
          ${trending.slice(0, 8).map(p => productManager.renderCard(p)).join('')}
        </div>
        <div class="text-center mt-8 animate-on-scroll">
          <a href="/shop" class="btn btn--secondary btn--lg">View All Products ${ICONS.arrowRight}</a>
        </div>
      </div>
    </section>

    <!-- Flash Sale + Countdown -->
    <section class="section" aria-labelledby="sale-heading">
      <div class="container">
        <div class="glass-card animated-gradient" style="background: var(--gradient-hero); padding: var(--space-12); text-align: center; border-radius: var(--radius-2xl); position: relative; overflow: hidden;">
          <div style="position: relative; z-index: 1;">
            <p class="text-overline" style="color: var(--color-secondary-400);">Limited Time Offer</p>
            <h2 id="sale-heading" style="color: white; margin-bottom: var(--space-2);">Flash Sale</h2>
            <p style="color: rgba(255,255,255,0.7); margin-bottom: var(--space-6);">Up to 40% off on selected items. Hurry, offer ends soon!</p>
            <div class="countdown" id="flash-countdown">
              <div class="countdown__block"><div class="countdown__value" data-hours>00</div><div class="countdown__label">Hours</div></div>
              <div class="countdown__block"><div class="countdown__value" data-minutes>00</div><div class="countdown__label">Minutes</div></div>
              <div class="countdown__block"><div class="countdown__value" data-seconds>00</div><div class="countdown__label">Seconds</div></div>
            </div>
            <div class="mt-8">
              <a href="/shop?sort=sale" class="btn btn--gold btn--lg">Shop the Sale ${ICONS.arrowRight}</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- New Arrivals -->
    ${productManager.getNewArrivals().length > 0 ? `
    <section class="section" style="background: var(--surface-raised);" aria-labelledby="new-heading">
      <div class="container">
        <div class="section__header animate-on-scroll">
          <p class="text-overline">Just In</p>
          <h2 id="new-heading">New Arrivals</h2>
          <p>The latest additions to our collection</p>
        </div>
        <div class="products-grid stagger-children">
          ${productManager.getNewArrivals().map(p => productManager.renderCard(p)).join('')}
        </div>
      </div>
    </section>
    ` : ''}

    <!-- Why Choose Us -->
    <section class="section" aria-labelledby="features-heading">
      <div class="container">
        <div class="section__header animate-on-scroll">
          <p class="text-overline">Why LUXE</p>
          <h2 id="features-heading">Why Choose Us</h2>
        </div>
        <div class="grid grid--4 stagger-children" style="gap: var(--space-8);">
          <div class="glass-card text-center">
            <div style="width: 56px; height: 56px; border-radius: var(--radius-xl); background: var(--badge-bg); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-4); color: var(--color-primary-600);">${ICONS.truck}</div>
            <h5>Free Shipping</h5>
            <p class="text-sm text-secondary mt-2">Free shipping on orders over $100. Fast and reliable delivery.</p>
          </div>
          <div class="glass-card text-center">
            <div style="width: 56px; height: 56px; border-radius: var(--radius-xl); background: var(--badge-bg); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-4); color: var(--color-primary-600);">${ICONS.shield}</div>
            <h5>Secure Payment</h5>
            <p class="text-sm text-secondary mt-2">Your payment information is processed securely with encryption.</p>
          </div>
          <div class="glass-card text-center">
            <div style="width: 56px; height: 56px; border-radius: var(--radius-xl); background: var(--badge-bg); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-4); color: var(--color-primary-600);">${ICONS.refresh}</div>
            <h5>Easy Returns</h5>
            <p class="text-sm text-secondary mt-2">30-day hassle-free return policy on all purchases.</p>
          </div>
          <div class="glass-card text-center">
            <div style="width: 56px; height: 56px; border-radius: var(--radius-xl); background: var(--badge-bg); display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-4); color: var(--color-primary-600);">${ICONS.headphones}</div>
            <h5>24/7 Support</h5>
            <p class="text-sm text-secondary mt-2">Our support team is available around the clock to help you.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="section" style="background: var(--surface-raised);" aria-labelledby="testimonials-heading">
      <div class="container">
        <div class="section__header animate-on-scroll">
          <p class="text-overline">Reviews</p>
          <h2 id="testimonials-heading">What Our Customers Say</h2>
        </div>
        <div class="grid grid--3 stagger-children">
          ${[
            { name: 'Emily Carter', role: 'Verified Buyer', quote: 'The quality of LUXE products is outstanding. I have been a loyal customer for over a year and every purchase exceeds my expectations.' },
            { name: 'David Kim', role: 'Fashion Enthusiast', quote: 'Finally found a store that combines premium quality with fair pricing. The leather jacket I purchased is absolutely stunning.' },
            { name: 'Sophie Laurent', role: 'Interior Designer', quote: 'The home decor collection is exquisite. Each piece feels carefully curated and the shipping was incredibly fast.' }
          ].map(t => `
            <div class="testimonial-card">
              <div class="testimonial-card__quote">${t.quote}</div>
              <div class="testimonial-card__author">
                <div class="testimonial-card__avatar">${getInitials(t.name)}</div>
                <div>
                  <div class="testimonial-card__name">${t.name}</div>
                  <div class="testimonial-card__role">${t.role}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Brands -->
    <section class="section" aria-labelledby="brands-heading">
      <div class="container">
        <div class="section__header animate-on-scroll">
          <p class="text-overline">Partners</p>
          <h2 id="brands-heading">Featured Brands</h2>
        </div>
        <div class="flex flex-wrap flex-center gap-8 stagger-children" style="opacity: 0.6;">
          ${['LUXE Originals', 'SoundElite', 'RunPro', 'GlowNaturals', 'ArtHome', 'VisionLux', 'TechFit', 'ZenFit'].map(brand => `
            <div style="font-family: var(--font-family-display); font-size: var(--fs-xl); font-weight: var(--fw-bold); color: var(--text-tertiary); padding: var(--space-4) var(--space-6);">${brand}</div>
          `).join('')}
        </div>
      </div>
    </section>


    ${recentlyViewed.length > 0 ? `
    <!-- Recently Viewed -->
    <section class="section" style="background: var(--surface-raised);" aria-labelledby="recent-heading">
      <div class="container">
        <div class="section__header animate-on-scroll">
          <p class="text-overline">History</p>
          <h2 id="recent-heading">Recently Viewed</h2>
        </div>
        <div class="products-grid stagger-children">
          ${recentlyViewed.slice(0, 4).map(p => productManager.renderCard(p)).join('')}
        </div>
      </div>
    </section>
    ` : ''}
  `;

  /* Post-render initialization */
  setTimeout(() => {
    _initHeroCarousel(banners.length);
    _initFlashCountdown();
    
    /* Bind product card events */
    const pageContent = document.getElementById('page-content');
    if (pageContent) productManager.bindCardEvents(pageContent);
  }, 50);

  return html;
}

/* ── Hero Carousel Logic ── */
function _initHeroCarousel(slideCount) {
  const track = document.getElementById('hero-track');
  const dots = document.querySelectorAll('[data-hero-dot]');
  const prevBtn = document.getElementById('hero-prev');
  const nextBtn = document.getElementById('hero-next');
  
  if (!track || slideCount <= 1) return;

  let currentSlide = 0;
  let autoplayTimer;

  function goToSlide(index) {
    currentSlide = ((index % slideCount) + slideCount) % slideCount;
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('hero-carousel__dot--active', i === currentSlide));
  }

  function nextSlide() { goToSlide(currentSlide + 1); }
  function prevSlide() { goToSlide(currentSlide - 1); }

  function startAutoplay() {
    autoplayTimer = setInterval(nextSlide, CONFIG.HERO_AUTOPLAY_INTERVAL);
  }

  function stopAutoplay() {
    clearInterval(autoplayTimer);
  }

  prevBtn?.addEventListener('click', () => { stopAutoplay(); prevSlide(); startAutoplay(); });
  nextBtn?.addEventListener('click', () => { stopAutoplay(); nextSlide(); startAutoplay(); });
  dots.forEach(dot => {
    dot.addEventListener('click', () => { stopAutoplay(); goToSlide(parseInt(dot.dataset.heroDot)); startAutoplay(); });
  });

  /* Touch/swipe support */
  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; stopAutoplay(); }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? nextSlide() : prevSlide(); }
    startAutoplay();
  }, { passive: true });

  startAutoplay();
}

/* ── Flash Sale Countdown ── */
function _initFlashCountdown() {
  const container = document.getElementById('flash-countdown');
  if (!container) return;

  /* Set end time to 24 hours from now */
  const endTime = new Date().getTime() + CONFIG.FLASH_SALE_HOURS * 60 * 60 * 1000;

  function update() {
    const now = new Date().getTime();
    const diff = endTime - now;

    if (diff <= 0) {
      container.innerHTML = '<p style="color: white; font-size: var(--fs-lg);">Sale has ended!</p>';
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const hoursEl = container.querySelector('[data-hours]');
    const minutesEl = container.querySelector('[data-minutes]');
    const secondsEl = container.querySelector('[data-seconds]');

    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');

    requestAnimationFrame(update);
  }

  update();
}

