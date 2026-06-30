/* ============================================
   SHOP PAGE — Product Listing with Filters
   ============================================ */

import { productManager } from '../js/products.js';
import { filterManager } from '../js/filter.js';
import { formatCurrency, icon, ICONS } from '../js/helpers.js';
import { eventBus } from '../js/utils.js';

export async function renderShop({ query = {} }) {
  await productManager.loadData();
  const allProducts = productManager.getAll();
  filterManager.init(allProducts);
  
  /* Apply URL query filters */
  if (query.category) filterManager.setFilter('category', query.category);
  if (query.q) filterManager.setFilter('search', query.q);

  const state = filterManager.getState();
  const categories = filterManager.getCategories();
  const brands = filterManager.getBrands();
  const priceRange = filterManager.getPriceRange();

  const html = `
    <div class="container section--sm">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a><span class="breadcrumbs__separator">/</span>
        <span class="breadcrumbs__current">Shop</span>
      </nav>

      <div class="shop-layout">
        <!-- Sidebar Filters -->
        <aside class="shop-sidebar" id="filter-sidebar" aria-label="Product filters">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
            <h3 style="font-size: var(--fs-lg);">${icon('filter')} Filters</h3>
            <button class="btn btn--ghost btn--xs" id="clear-filters" style="display: ${state.hasActiveFilters ? 'inline-flex' : 'none'};">Clear All</button>
          </div>

          <!-- Categories -->
          <div class="filter-group">
            <div class="filter-group__title">Categories</div>
            <div class="filter-group__options">
              ${categories.map(cat => `
                <label class="form-checkbox filter-option">
                  <input type="checkbox" name="category" value="${cat.name}" ${filterManager.filters.category.includes(cat.name) ? 'checked' : ''} data-filter-category>
                  <span>${cat.name}</span>
                  <span class="filter-option__count">${cat.count}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Brands -->
          <div class="filter-group">
            <div class="filter-group__title">Brands</div>
            <div class="filter-group__options">
              ${brands.map(brand => `
                <label class="form-checkbox filter-option">
                  <input type="checkbox" name="brand" value="${brand.name}" ${filterManager.filters.brand.includes(brand.name) ? 'checked' : ''} data-filter-brand>
                  <span>${brand.name}</span>
                  <span class="filter-option__count">${brand.count}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Price Range -->
          <div class="filter-group">
            <div class="filter-group__title">Price Range</div>
            <div class="range-slider" id="price-slider">
              <div class="range-slider__track"></div>
              <div class="range-slider__fill" id="price-fill"></div>
              <input type="range" min="${priceRange.min}" max="${priceRange.max}" value="${filterManager.filters.priceMin}" id="price-min" aria-label="Minimum price">
              <input type="range" min="${priceRange.min}" max="${priceRange.max}" value="${filterManager.filters.priceMax}" id="price-max" aria-label="Maximum price">
            </div>
            <div class="range-slider__values">
              <span id="price-min-val">${formatCurrency(filterManager.filters.priceMin)}</span>
              <span id="price-max-val">${formatCurrency(filterManager.filters.priceMax)}</span>
            </div>
          </div>

          <!-- Rating -->
          <div class="filter-group">
            <div class="filter-group__title">Rating</div>
            <div class="filter-group__options">
              ${[4, 3, 2, 1].map(r => `
                <label class="form-radio filter-option">
                  <input type="radio" name="rating" value="${r}" ${filterManager.filters.rating === r ? 'checked' : ''} data-filter-rating>
                  <span>${'★'.repeat(r)}${'☆'.repeat(5 - r)} & up</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Availability -->
          <div class="filter-group">
            <div class="filter-group__title">Availability</div>
            <div class="filter-group__options">
              <label class="form-radio filter-option">
                <input type="radio" name="availability" value="all" ${filterManager.filters.availability === 'all' ? 'checked' : ''} data-filter-availability>
                <span>All</span>
              </label>
              <label class="form-radio filter-option">
                <input type="radio" name="availability" value="in-stock" ${filterManager.filters.availability === 'in-stock' ? 'checked' : ''} data-filter-availability>
                <span>In Stock</span>
              </label>
              <label class="form-radio filter-option">
                <input type="radio" name="availability" value="on-sale" ${filterManager.filters.availability === 'on-sale' ? 'checked' : ''} data-filter-availability>
                <span>On Sale</span>
              </label>
            </div>
          </div>
        </aside>

        <!-- Main Content -->
        <div class="shop-main">
          <!-- Controls Bar -->
          <div class="shop-controls">
            <div class="shop-controls__info" id="results-count">
              Showing <strong>${state.products.length}</strong> of <strong>${state.totalProducts}</strong> products
            </div>
            <div class="shop-controls__actions">
              <select class="form-input form-select" id="sort-select" aria-label="Sort products" style="width: auto; padding: var(--space-2) var(--space-8) var(--space-2) var(--space-3); font-size: var(--fs-sm);">
                <option value="featured" ${state.sort === 'featured' ? 'selected' : ''}>Featured</option>
                <option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Newest</option>
                <option value="price-asc" ${state.sort === 'price-asc' ? 'selected' : ''}>Price: Low to High</option>
                <option value="price-desc" ${state.sort === 'price-desc' ? 'selected' : ''}>Price: High to Low</option>
                <option value="rating" ${state.sort === 'rating' ? 'selected' : ''}>Top Rated</option>
                <option value="name-asc" ${state.sort === 'name-asc' ? 'selected' : ''}>Name: A-Z</option>
              </select>
              <div class="view-toggle">
                <button class="view-toggle__btn ${state.viewMode === 'grid' ? 'view-toggle__btn--active' : ''}" data-view="grid" aria-label="Grid view">${ICONS.grid}</button>
                <button class="view-toggle__btn ${state.viewMode === 'list' ? 'view-toggle__btn--active' : ''}" data-view="list" aria-label="List view">${ICONS.list}</button>
              </div>
            </div>
          </div>

          <!-- Active Filters -->
          <div class="active-filters" id="active-filters"></div>

          <!-- Products Grid -->
          <div id="products-container">
            ${productManager.renderGrid(state.products)}
          </div>

          <!-- Pagination -->
          <div id="pagination-container">
            ${_renderPagination(state)}
          </div>
        </div>
      </div>
    </div>
  `;

  /* Post-render: bind filter events */
  setTimeout(() => _bindShopEvents(), 50);

  return html;
}

function _bindShopEvents() {
  const container = document.getElementById('page-content');
  if (!container) return;

  /* Category filters */
  container.querySelectorAll('[data-filter-category]').forEach(input => {
    input.addEventListener('change', () => {
      filterManager.setFilter('category', input.value);
      _updateShopUI();
    });
  });

  /* Brand filters */
  container.querySelectorAll('[data-filter-brand]').forEach(input => {
    input.addEventListener('change', () => {
      filterManager.setFilter('brand', input.value);
      _updateShopUI();
    });
  });

  /* Rating filter */
  container.querySelectorAll('[data-filter-rating]').forEach(input => {
    input.addEventListener('change', () => {
      filterManager.setFilter('rating', parseInt(input.value));
      _updateShopUI();
    });
  });

  /* Availability filter */
  container.querySelectorAll('[data-filter-availability]').forEach(input => {
    input.addEventListener('change', () => {
      filterManager.setFilter('availability', input.value);
      _updateShopUI();
    });
  });

  /* Price range */
  const priceMin = document.getElementById('price-min');
  const priceMax = document.getElementById('price-max');
  if (priceMin && priceMax) {
    const updatePrice = () => {
      let min = parseInt(priceMin.value);
      let max = parseInt(priceMax.value);
      if (min > max) [min, max] = [max, min];
      
      filterManager.filters.priceMin = min;
      filterManager.filters.priceMax = max;
      
      document.getElementById('price-min-val').textContent = formatCurrency(min);
      document.getElementById('price-max-val').textContent = formatCurrency(max);
      
      /* Update fill bar */
      const range = parseInt(priceMax.max) - parseInt(priceMax.min);
      const fill = document.getElementById('price-fill');
      if (fill) {
        const left = ((min - parseInt(priceMax.min)) / range) * 100;
        const right = ((max - parseInt(priceMax.min)) / range) * 100;
        fill.style.left = left + '%';
        fill.style.width = (right - left) + '%';
      }
      
      filterManager.apply();
      _updateShopUI();
    };
    priceMin.addEventListener('input', updatePrice);
    priceMax.addEventListener('input', updatePrice);
    updatePrice();
  }

  /* Sort */
  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    filterManager.setSort(e.target.value);
    _updateShopUI();
  });

  /* View toggle */
  container.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.view-toggle__btn').forEach(b => b.classList.remove('view-toggle__btn--active'));
      btn.classList.add('view-toggle__btn--active');
      filterManager.setViewMode(btn.dataset.view);
      _updateShopUI();
    });
  });

  /* Clear all */
  document.getElementById('clear-filters')?.addEventListener('click', () => {
    filterManager.clearAll();
    /* Uncheck all checkboxes/radios */
    container.querySelectorAll('input[type="checkbox"]').forEach(i => i.checked = false);
    container.querySelectorAll('input[type="radio"][value="all"]').forEach(i => i.checked = true);
    _updateShopUI();
  });

  /* Bind product card events */
  productManager.bindCardEvents(container);
}

function _updateShopUI() {
  const state = filterManager.getState();
  const productsContainer = document.getElementById('products-container');
  const paginationContainer = document.getElementById('pagination-container');
  const resultsCount = document.getElementById('results-count');
  const clearBtn = document.getElementById('clear-filters');

  if (productsContainer) {
    productsContainer.innerHTML = productManager.renderGrid(state.products);
    productManager.bindCardEvents(productsContainer);
  }

  if (paginationContainer) {
    paginationContainer.innerHTML = _renderPagination(state);
    _bindPaginationEvents();
  }

  if (resultsCount) {
    resultsCount.innerHTML = `Showing <strong>${state.products.length}</strong> of <strong>${state.totalProducts}</strong> products`;
  }

  if (clearBtn) {
    clearBtn.style.display = state.hasActiveFilters ? 'inline-flex' : 'none';
  }
}

function _renderPagination(state) {
  if (state.totalPages <= 1) return '';

  let html = '<nav class="pagination" aria-label="Product pagination">';
  html += `<button class="pagination__btn" ${state.currentPage === 1 ? 'disabled' : ''} data-page="${state.currentPage - 1}" aria-label="Previous page">${ICONS.chevronLeft}</button>`;

  for (let i = 1; i <= state.totalPages; i++) {
    if (i === 1 || i === state.totalPages || Math.abs(i - state.currentPage) <= 1) {
      html += `<button class="pagination__btn ${i === state.currentPage ? 'pagination__btn--active' : ''}" data-page="${i}">${i}</button>`;
    } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
      html += '<span class="pagination__ellipsis">…</span>';
    }
  }

  html += `<button class="pagination__btn" ${state.currentPage === state.totalPages ? 'disabled' : ''} data-page="${state.currentPage + 1}" aria-label="Next page">${ICONS.chevronRight}</button>`;
  html += '</nav>';
  return html;
}

function _bindPaginationEvents() {
  document.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      filterManager.setPage(parseInt(btn.dataset.page));
      _updateShopUI();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}
