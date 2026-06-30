/* ============================================
   AUTH — Supabase Authentication State Management
   ============================================ */

import { supabase } from './supabase.js';
import { eventBus } from './utils.js';
import { getPasswordStrength } from './validation.js';

class AuthManager {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
  }

  async init() {
    /* Check for active session */
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session) {
      this._setUser(session.user);
    } else {
      this.user = null;
      this.isAuthenticated = false;
    }
    
    this._updateUI();

    /* Listen for auth state changes */
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this._setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        this.user = null;
        this.isAuthenticated = false;
        this._updateUI();
        eventBus.emit('auth:logout');
      }
    });
  }

  /**
   * Register a new user
   */
  async register(userData) {
    const { name, email, password } = userData;

    /* Check password strength */
    const strength = getPasswordStrength(password);
    if (strength.score < 2) {
      return { success: false, message: 'Password is too weak. Include uppercase, lowercase, numbers, and special characters.' };
    }

    /* Create user in Supabase Auth */
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          addresses: [],
          orders: []
        }
      }
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, user: this._formatUser(data.user) };
  }

  /**
   * Login
   */
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, user: this._formatUser(data.user) };
  }

  /**
   * Logout
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true };
  }

  /**
   * Get current user
   */
  getUser() {
    return this.user;
  }

  /**
   * Update user profile metadata
   */
  async updateProfile(updates) {
    if (!this.isAuthenticated) return { success: false, message: 'Not authenticated' };

    const newMetadata = { ...this.user, ...updates };

    const { data, error } = await supabase.auth.updateUser({
      data: newMetadata
    });

    if (error) {
      return { success: false, message: error.message };
    }

    this._setUser(data.user);
    eventBus.emit('auth:profileUpdated', this.user);
    return { success: true };
  }

  /**
   * Add address
   */
  async addAddress(address) {
    if (!this.isAuthenticated) return;
    
    const id = 'addr-' + Date.now().toString(36);
    const addresses = this.user.addresses || [];
    
    if (address.isDefault) {
      addresses.forEach(a => a.isDefault = false);
    }
    
    addresses.push({ ...address, id });
    return await this.updateProfile({ addresses });
  }

  /**
   * Remove address
   */
  async removeAddress(id) {
    if (!this.isAuthenticated) return;
    const addresses = (this.user.addresses || []).filter(a => a.id !== id);
    return await this.updateProfile({ addresses });
  }

  /**
   * Add order to history
   */
  async addOrder(order) {
    if (!this.isAuthenticated) return;
    const orders = this.user.orders || [];
    orders.unshift(order);
    return await this.updateProfile({ orders });
  }

  /* Private */
  _setUser(supabaseUser) {
    if (!supabaseUser) return;
    this.user = this._formatUser(supabaseUser);
    this.isAuthenticated = true;
    this._updateUI();
    eventBus.emit('auth:login', this.user);
  }

  _formatUser(supabaseUser) {
    if (!supabaseUser) return null;
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.name || supabaseUser.email.split('@')[0],
      avatar: supabaseUser.user_metadata?.avatar || null,
      phone: supabaseUser.user_metadata?.phone || '',
      addresses: supabaseUser.user_metadata?.addresses || [],
      orders: supabaseUser.user_metadata?.orders || [],
      createdAt: supabaseUser.created_at
    };
  }

  _updateUI() {
    /* Update auth-dependent elements */
    document.querySelectorAll('[data-auth-show]').forEach(el => {
      el.style.display = this.isAuthenticated ? '' : 'none';
    });
    document.querySelectorAll('[data-guest-show]').forEach(el => {
      el.style.display = this.isAuthenticated ? 'none' : '';
    });
    document.querySelectorAll('[data-user-name]').forEach(el => {
      el.textContent = this.user?.name || '';
    });
  }
}

export const auth = new AuthManager();
