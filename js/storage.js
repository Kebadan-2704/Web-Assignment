/* ============================================
   STORAGE — LocalStorage / SessionStorage Wrapper
   Type-safe, JSON parsing, expiry support
   ============================================ */

/**
 * StorageManager — wraps localStorage/sessionStorage with JSON parsing and expiry
 */
export class StorageManager {
  /**
   * @param {string} type - 'local' or 'session'
   */
  constructor(type = 'local') {
    this.storage = type === 'session' ? sessionStorage : localStorage;
    this.prefix = 'luxe_';
  }

  /**
   * Get a value from storage
   * @param {string} key 
   * @param {*} defaultValue 
   * @returns {*}
   */
  get(key, defaultValue = null) {
    try {
      const item = this.storage.getItem(this.prefix + key);
      if (item === null) return defaultValue;
      
      const parsed = JSON.parse(item);
      
      /* Check expiry */
      if (parsed._expires && Date.now() > parsed._expires) {
        this.remove(key);
        return defaultValue;
      }
      
      return parsed._value !== undefined ? parsed._value : parsed;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Set a value in storage
   * @param {string} key 
   * @param {*} value 
   * @param {number|null} ttlMs - Time to live in milliseconds (null = no expiry)
   */
  set(key, value, ttlMs = null) {
    try {
      const item = ttlMs 
        ? { _value: value, _expires: Date.now() + ttlMs }
        : { _value: value };
      
      this.storage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (e) {
      console.warn('Storage write failed:', e);
    }
  }

  /**
   * Remove a key from storage
   * @param {string} key 
   */
  remove(key) {
    this.storage.removeItem(this.prefix + key);
  }

  /**
   * Check if a key exists
   * @param {string} key 
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Clear all prefixed keys
   */
  clear() {
    const keysToRemove = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => this.storage.removeItem(key));
  }

  /**
   * Get all stored items (for debugging)
   * @returns {Object}
   */
  getAll() {
    const items = {};
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(this.prefix)) {
        items[key.replace(this.prefix, '')] = this.get(key.replace(this.prefix, ''));
      }
    }
    return items;
  }
}

/* Export singleton instances */
export const localStore = new StorageManager('local');
export const sessionStore = new StorageManager('session');
