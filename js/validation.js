/* ============================================
   VALIDATION — Form Validation Engine
   ============================================ */

import { ICONS } from './helpers.js';

/**
 * FormValidator — real-time form validation with inline errors
 */
export class FormValidator {
  /**
   * @param {HTMLFormElement} form 
   * @param {Object} rules - { fieldName: [{ rule, message, param }] }
   * @param {Object} options
   */
  constructor(form, rules = {}, options = {}) {
    this.form = form;
    this.rules = rules;
    this.errors = {};
    this.options = {
      validateOnInput: true,
      validateOnBlur: true,
      showSuccessState: true,
      ...options
    };

    this._init();
  }

  _init() {
    /* Real-time validation on input */
    if (this.options.validateOnInput) {
      this.form.addEventListener('input', (e) => {
        const field = e.target;
        if (field.name && this.rules[field.name]) {
          this._validateField(field.name);
        }
      });
    }

    /* Validate on blur */
    if (this.options.validateOnBlur) {
      this.form.addEventListener('focusout', (e) => {
        const field = e.target;
        if (field.name && this.rules[field.name] && field.value.trim()) {
          this._validateField(field.name);
        }
      });
    }

    /* Prevent default submission, validate all */
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.validateAll()) {
        const event = new CustomEvent('valid-submit', {
          detail: this.getFormData()
        });
        this.form.dispatchEvent(event);
      }
    });
  }

  /**
   * Validate a single field
   * @param {string} fieldName 
   * @returns {boolean}
   */
  _validateField(fieldName) {
    const fieldRules = this.rules[fieldName];
    if (!fieldRules) return true;

    const input = this.form.querySelector(`[name="${fieldName}"]`);
    if (!input) return true;

    const value = input.value.trim();
    this.errors[fieldName] = null;

    for (const rule of fieldRules) {
      const isValid = this._checkRule(rule, value, input);
      if (!isValid) {
        this.errors[fieldName] = rule.message;
        this._showError(input, rule.message);
        return false;
      }
    }

    /* Show success */
    if (this.options.showSuccessState && value) {
      this._showSuccess(input);
    } else {
      this._clearState(input);
    }
    
    return true;
  }

  /**
   * Check a single validation rule
   */
  _checkRule(rule, value, input) {
    switch (rule.rule) {
      case 'required':
        return value.length > 0;
      
      case 'email':
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
      
      case 'minLength':
        return value.length >= (rule.param || 1);
      
      case 'maxLength':
        return value.length <= (rule.param || 255);
      
      case 'phone':
        return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(value);
      
      case 'password':
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(value);
      
      case 'match':
        const matchField = this.form.querySelector(`[name="${rule.param}"]`);
        return matchField && value === matchField.value;
      
      case 'postalCode':
        return /^[0-9]{5}(-[0-9]{4})?$/.test(value);
      
      case 'creditCard':
        return this._luhnCheck(value.replace(/\s/g, ''));
      
      case 'cvv':
        return /^[0-9]{3,4}$/.test(value);
      
      case 'expiry':
        return this._validateExpiry(value);
      
      case 'pattern':
        return new RegExp(rule.param).test(value);
      
      case 'custom':
        return typeof rule.param === 'function' ? rule.param(value, input) : true;
      
      default:
        return true;
    }
  }

  /**
   * Luhn algorithm for credit card validation
   */
  _luhnCheck(num) {
    if (!/^\d{13,19}$/.test(num)) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  /**
   * Validate card expiry (MM/YY)
   */
  _validateExpiry(value) {
    const match = value.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!match) return false;
    
    const month = parseInt(match[1], 10);
    const year = parseInt('20' + match[2], 10);
    const now = new Date();
    const expiry = new Date(year, month);
    
    return expiry > now;
  }

  /**
   * Show error state on input
   */
  _showError(input, message) {
    input.classList.remove('form-input--success');
    input.classList.add('form-input--error');
    
    /* Remove existing message */
    const existing = input.parentElement.querySelector('.form-message');
    if (existing) existing.remove();
    
    /* Add error message */
    const msg = document.createElement('div');
    msg.className = 'form-message form-message--error';
    msg.innerHTML = `<span>${ICONS.alertCircle}</span> ${message}`;
    msg.setAttribute('role', 'alert');
    
    input.parentElement.appendChild(msg);
    input.setAttribute('aria-invalid', 'true');
  }

  /**
   * Show success state on input
   */
  _showSuccess(input) {
    input.classList.remove('form-input--error');
    input.classList.add('form-input--success');
    
    const existing = input.parentElement.querySelector('.form-message');
    if (existing) existing.remove();
    
    input.removeAttribute('aria-invalid');
  }

  /**
   * Clear validation state
   */
  _clearState(input) {
    input.classList.remove('form-input--error', 'form-input--success');
    const existing = input.parentElement.querySelector('.form-message');
    if (existing) existing.remove();
    input.removeAttribute('aria-invalid');
  }

  /**
   * Validate all fields
   * @returns {boolean}
   */
  validateAll() {
    let isValid = true;
    
    for (const fieldName of Object.keys(this.rules)) {
      if (!this._validateField(fieldName)) {
        isValid = false;
      }
    }
    
    /* Focus first error field */
    if (!isValid) {
      const firstError = this.form.querySelector('.form-input--error');
      if (firstError) {
        firstError.focus();
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
    return isValid;
  }

  /**
   * Get form data as object
   * @returns {Object}
   */
  getFormData() {
    const formData = new FormData(this.form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      /* Sanitize input */
      data[key] = typeof value === 'string' ? this._sanitize(value) : value;
    }
    
    return data;
  }

  /**
   * Sanitize input string
   */
  _sanitize(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Reset form validation states
   */
  reset() {
    this.errors = {};
    this.form.querySelectorAll('.form-input').forEach(input => this._clearState(input));
    this.form.reset();
  }
}

/**
 * Password strength calculator
 * @param {string} password 
 * @returns {{ strength: string, score: number, label: string }}
 */
export function getPasswordStrength(password) {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&#^()_+=\-]/.test(password)) score++;
  
  const levels = [
    { min: 0, strength: 'weak', label: 'Weak' },
    { min: 2, strength: 'fair', label: 'Fair' },
    { min: 3, strength: 'good', label: 'Good' },
    { min: 4, strength: 'strong', label: 'Strong' }
  ];
  
  const level = levels.reverse().find(l => score >= l.min) || levels[0];
  
  return { strength: level.strength, score, label: level.label };
}

/**
 * Format credit card number with spaces
 * @param {string} value 
 * @returns {string}
 */
export function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').substring(0, 16);
  return digits.replace(/(\d{4})/g, '$1 ').trim();
}

/**
 * Format expiry date as MM/YY
 * @param {string} value 
 * @returns {string}
 */
export function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').substring(0, 4);
  if (digits.length > 2) {
    return digits.substring(0, 2) + '/' + digits.substring(2);
  }
  return digits;
}
