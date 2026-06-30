/* ============================================
   ANIMATIONS — Scroll-triggered animations
   ============================================ */

import { createScrollObserver, prefersReducedMotion, eventBus } from './utils.js';

class AnimationManager {
  constructor() {
    this.observer = null;
    this.staggerObserver = null;
  }

  init() {
    if (prefersReducedMotion()) return;
    this._initScrollAnimations();
    
    /* Re-initialize when new content is rendered */
    eventBus.on('page:rendered', () => {
      setTimeout(() => this._initScrollAnimations(), 100);
    });
  }

  _initScrollAnimations() {
    /* Disconnect previous observers */
    if (this.observer) this.observer.disconnect();
    if (this.staggerObserver) this.staggerObserver.disconnect();

    /* Reveal on scroll */
    this.observer = createScrollObserver((entry, observer) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-on-scroll--visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      this.observer.observe(el);
    });

    /* Stagger children */
    this.staggerObserver = createScrollObserver((entry, observer) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('stagger-children--visible');
        observer.unobserve(entry.target);
      }
    });

    document.querySelectorAll('.stagger-children').forEach(el => {
      this.staggerObserver.observe(el);
    });
  }

  /**
   * Animate counter from 0 to target
   * @param {HTMLElement} element 
   * @param {number} target 
   * @param {number} duration ms
   */
  static animateCounter(element, target, duration = 2000) {
    if (prefersReducedMotion()) {
      element.textContent = target;
      return;
    }

    let start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      /* Ease out quad */
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(eased * target);

      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }
}

export const animationManager = new AnimationManager();
