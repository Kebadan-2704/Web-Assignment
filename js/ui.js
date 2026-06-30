/* ============================================
   UI — UI Components (Modal, Toast, Drawer, Tabs, Accordion)
   ============================================ */

import { trapFocus, eventBus, generateId } from './utils.js';
import { ICONS } from './helpers.js';

/* ═══════════════════════════════════════════
   MODAL
   ═══════════════════════════════════════════ */

export class Modal {
  /**
   * @param {Object} options
   * @param {string} options.title 
   * @param {string} options.content - HTML content
   * @param {string} options.size - 'sm' | 'md' | 'lg'
   * @param {boolean} options.closable
   * @param {Function} options.onClose
   */
  static show({ title = '', content = '', size = 'md', closable = true, onClose = null, footer = '' } = {}) {
    /* Remove existing modals */
    Modal.closeAll();

    const id = generateId('modal');
    const sizeMap = { sm: '400px', md: '560px', lg: '720px', xl: '900px' };

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.id = id;
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-label', title);

    backdrop.innerHTML = `
      <div class="modal" style="max-width: ${sizeMap[size] || sizeMap.md}">
        ${title || closable ? `
          <div class="modal__header">
            <h3 class="modal__title">${title}</h3>
            ${closable ? `<button class="modal__close" aria-label="Close dialog">${ICONS.close}</button>` : ''}
          </div>
        ` : ''}
        <div class="modal__body">${content}</div>
        ${footer ? `<div class="modal__footer">${footer}</div>` : ''}
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    /* Animate in */
    requestAnimationFrame(() => {
      backdrop.classList.add('modal-backdrop--open');
    });

    /* Focus trap */
    const releaseFocus = trapFocus(backdrop);

    /* Close handlers */
    const close = () => {
      backdrop.classList.remove('modal-backdrop--open');
      setTimeout(() => {
        backdrop.remove();
        document.body.style.overflow = '';
        releaseFocus();
        if (onClose) onClose();
      }, 250);
    };

    if (closable) {
      backdrop.querySelector('.modal__close')?.addEventListener('click', close);
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) close();
      });
      backdrop.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
      });
    }

    return { close, element: backdrop };
  }

  static closeAll() {
    document.querySelectorAll('.modal-backdrop').forEach(m => {
      m.classList.remove('modal-backdrop--open');
      setTimeout(() => m.remove(), 250);
    });
    document.body.style.overflow = '';
  }
}

/* ═══════════════════════════════════════════
   TOAST NOTIFICATIONS
   ═══════════════════════════════════════════ */

export class Toast {
  static _container = null;

  static _getContainer() {
    if (!Toast._container) {
      Toast._container = document.createElement('div');
      Toast._container.className = 'toast-container';
      Toast._container.setAttribute('aria-live', 'polite');
      Toast._container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(Toast._container);
    }
    return Toast._container;
  }

  /**
   * Show a toast notification
   * @param {Object} options
   * @param {string} options.type - 'success' | 'error' | 'warning' | 'info'
   * @param {string} options.title
   * @param {string} options.message
   * @param {number} options.duration - ms (0 = persistent)
   * @param {string} options.action - Optional action button HTML
   */
  static show({ type = 'info', title = '', message = '', duration = 4000, action = '' } = {}) {
    const container = Toast._getContainer();
    const id = generateId('toast');
    
    const iconMap = {
      success: ICONS.checkCircle,
      error: ICONS.alertCircle,
      warning: ICONS.warning,
      info: ICONS.info
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.id = id;
    toast.setAttribute('role', 'alert');
    toast.style.setProperty('--toast-duration', `${duration}ms`);

    toast.innerHTML = `
      <span class="toast__icon">${iconMap[type] || iconMap.info}</span>
      <div class="toast__content">
        ${title ? `<div class="toast__title">${title}</div>` : ''}
        ${message ? `<div class="toast__message">${message}</div>` : ''}
        ${action}
      </div>
      <button class="toast__close" aria-label="Dismiss">${ICONS.close}</button>
      ${duration > 0 ? '<div class="toast__progress"></div>' : ''}
    `;

    container.appendChild(toast);

    /* Close handler */
    const dismiss = () => {
      toast.classList.add('toast--exiting');
      setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.toast__close').addEventListener('click', dismiss);

    /* Auto dismiss */
    if (duration > 0) {
      setTimeout(dismiss, duration);
    }

    /* Limit visible toasts */
    const toasts = container.querySelectorAll('.toast');
    if (toasts.length > 5) {
      toasts[0].remove();
    }

    return { dismiss, element: toast };
  }

  static success(title, message) { return Toast.show({ type: 'success', title, message }); }
  static error(title, message) { return Toast.show({ type: 'error', title, message }); }
  static warning(title, message) { return Toast.show({ type: 'warning', title, message }); }
  static info(title, message) { return Toast.show({ type: 'info', title, message }); }
}

/* ═══════════════════════════════════════════
   DRAWER (Side Panel)
   ═══════════════════════════════════════════ */

export class Drawer {
  /**
   * @param {string} selector - Drawer element selector 
   */
  constructor(selector) {
    this.element = document.querySelector(selector);
    this.overlay = document.querySelector('.overlay');
    this.isOpen = false;
    this._releaseFocus = null;
  }

  open() {
    if (!this.element) return;
    this.isOpen = true;
    this.element.classList.add('mobile-drawer--open');
    if (this.overlay) this.overlay.classList.add('overlay--visible');
    document.body.style.overflow = 'hidden';
    this._releaseFocus = trapFocus(this.element);
    
    /* Close on overlay click */
    const handleOverlayClick = () => {
      this.close();
      this.overlay?.removeEventListener('click', handleOverlayClick);
    };
    this.overlay?.addEventListener('click', handleOverlayClick);
    
    /* Close on Escape */
    this._escHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this._escHandler);
  }

  close() {
    if (!this.element) return;
    this.isOpen = false;
    this.element.classList.remove('mobile-drawer--open');
    if (this.overlay) this.overlay.classList.remove('overlay--visible');
    document.body.style.overflow = '';
    if (this._releaseFocus) this._releaseFocus();
    document.removeEventListener('keydown', this._escHandler);
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }
}

/* ═══════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════ */

export function initTabs(container) {
  if (!container) return;
  
  const tabs = container.querySelectorAll('.tabs__tab');
  const panels = container.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      
      /* Deactivate all */
      tabs.forEach(t => t.classList.remove('tabs__tab--active'));
      panels.forEach(p => p.classList.remove('tab-content--active'));
      
      /* Activate selected */
      tab.classList.add('tabs__tab--active');
      const panel = container.querySelector(`[data-tab-content="${target}"]`);
      if (panel) panel.classList.add('tab-content--active');
    });
  });
  
  /* Keyboard navigation */
  const tabList = container.querySelector('.tabs');
  if (tabList) {
    tabList.addEventListener('keydown', (e) => {
      const currentTab = document.activeElement;
      const tabArray = Array.from(tabs);
      const currentIndex = tabArray.indexOf(currentTab);
      
      let nextIndex;
      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabArray.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + tabArray.length) % tabArray.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = tabArray.length - 1;
      } else {
        return;
      }
      
      e.preventDefault();
      tabArray[nextIndex].focus();
      tabArray[nextIndex].click();
    });
  }
}

/* ═══════════════════════════════════════════
   ACCORDION
   ═══════════════════════════════════════════ */

export function initAccordion(container, allowMultiple = false) {
  if (!container) return;
  
  const triggers = container.querySelectorAll('.accordion__trigger');
  
  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion__item');
      const content = item.querySelector('.accordion__content');
      const isOpen = item.classList.contains('accordion__item--open');
      
      if (!allowMultiple) {
        /* Close all others */
        container.querySelectorAll('.accordion__item--open').forEach(openItem => {
          if (openItem !== item) {
            openItem.classList.remove('accordion__item--open');
            openItem.querySelector('.accordion__content').style.maxHeight = '0';
          }
        });
      }
      
      if (isOpen) {
        item.classList.remove('accordion__item--open');
        content.style.maxHeight = '0';
      } else {
        item.classList.add('accordion__item--open');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });
}

/* ═══════════════════════════════════════════
   BACK TO TOP
   ═══════════════════════════════════════════ */

export function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('back-to-top--visible');
    } else {
      btn.classList.remove('back-to-top--visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ═══════════════════════════════════════════
   SCROLL PROGRESS
   ═══════════════════════════════════════════ */

export function initScrollProgress() {
  const progress = document.querySelector('.scroll-progress');
  if (!progress) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progress.style.width = `${scrollPercent}%`;
  }, { passive: true });
}

/* ═══════════════════════════════════════════
   HEADER SCROLL BEHAVIOR
   ═══════════════════════════════════════════ */

export function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;

  let lastScroll = 0;
  const scrollThreshold = 100;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    /* Add shadow when scrolled */
    header.classList.toggle('header--scrolled', currentScroll > 10);

    /* Hide/show on scroll direction */
    if (currentScroll > scrollThreshold) {
      if (currentScroll > lastScroll && currentScroll - lastScroll > 10) {
        header.classList.add('header--hidden');
      } else if (lastScroll - currentScroll > 10) {
        header.classList.remove('header--hidden');
      }
    } else {
      header.classList.remove('header--hidden');
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

/* ═══════════════════════════════════════════
   DROPDOWN
   ═══════════════════════════════════════════ */

export function initDropdowns() {
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-dropdown-toggle]');
    
    if (toggle) {
      e.stopPropagation();
      const dropdown = toggle.closest('.dropdown');
      const isOpen = dropdown.classList.contains('dropdown--open');
      
      /* Close all dropdowns */
      document.querySelectorAll('.dropdown--open').forEach(d => d.classList.remove('dropdown--open'));
      
      if (!isOpen) {
        dropdown.classList.add('dropdown--open');
      }
    } else {
      /* Close all dropdowns on outside click */
      document.querySelectorAll('.dropdown--open').forEach(d => d.classList.remove('dropdown--open'));
    }
  });
}
