/**
 * API Key Manager
 * Multi-key rotation system with quota tracking
 */

class APIKeyManager {
  constructor() {
    this.storageKey = 'gemini_api_keys';
    this.keys = this.loadKeys();
    this.currentKeyIndex = 0;
  }

  /**
   * Load keys from localStorage
   * @returns {Array} Array of key objects
   */
  loadKeys() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const keys = stored ? JSON.parse(stored) : [];
      console.log(`📦 Loaded ${keys.length} API key(s)`);
      return keys;
    } catch (error) {
      console.error('Failed to load keys:', error);
      return [];
    }
  }

  /**
   * Reload keys from localStorage (use when keys might have changed)
   */
  reloadKeys() {
    this.keys = this.loadKeys();
    console.log('🔄 Reloaded keys from localStorage');
  }

  /**
   * Save keys to localStorage
   */
  saveKeys() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.keys));
      console.log('💾 Keys saved to localStorage');
    } catch (error) {
      console.error('Failed to save keys:', error);
      throw new Error('Failed to save API keys. Storage may be full.');
    }
  }

  /**
   * Add new API key
   * @param {string} apiKey - The API key
   * @param {string} nickname - Optional nickname for the key
   * @returns {Object} Added key object
   */
  addKey(apiKey, nickname = '') {
    // Validate key format
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Invalid API key format');
    }

    const trimmedKey = apiKey.trim();
    
    if (trimmedKey.length < 20) {
      throw new Error('API key is too short. Please check your key.');
    }

    // Check for duplicates
    if (this.keys.some(k => k.key === trimmedKey)) {
      throw new Error('This API key already exists');
    }

    const keyObj = {
      id: Date.now().toString(),
      key: trimmedKey,
      nickname: nickname.trim() || `Key ${this.keys.length + 1}`,
      requestCount: 0,
      quotaExceeded: false,
      lastUsed: null,
      createdAt: new Date().toISOString()
    };

    this.keys.push(keyObj);
    this.saveKeys();
    
    console.log(`✅ Added API key: ${keyObj.nickname}`);
    return keyObj;
  }

  /**
   * Get next available key (rotation logic)
   * @returns {string} API key
   * @throws {Error} If no keys available or all exceeded quota
   */
  getNextKey() {
    if (this.keys.length === 0) {
      throw new Error('No API keys available. Please add at least one key in Settings.');
    }

    let attempts = 0;
    const maxAttempts = this.keys.length;

    while (attempts < maxAttempts) {
      const keyObj = this.keys[this.currentKeyIndex];
      
      if (!keyObj.quotaExceeded) {
        // Update stats
        keyObj.lastUsed = new Date().toISOString();
        keyObj.requestCount++;
        this.saveKeys();
        
        console.log(`🔑 Using key: ${keyObj.nickname} (Request #${keyObj.requestCount})`);
        return keyObj.key;
      }

      // Move to next key
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
      attempts++;
    }

    throw new Error('All API keys have exceeded quota. Please add new keys or reset quotas in Settings.');
  }

  /**
   * Mark a key as quota exceeded
   * @param {string} apiKey - The API key that exceeded quota
   */
  markQuotaExceeded(apiKey) {
    const keyObj = this.keys.find(k => k.key === apiKey);
    
    if (keyObj) {
      keyObj.quotaExceeded = true;
      this.saveKeys();
      
      console.warn(`⚠️ API key "${keyObj.nickname}" quota exceeded. Rotating to next key...`);
      
      // Move to next key
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('api-key-quota-exceeded', {
        detail: { keyId: keyObj.id, nickname: keyObj.nickname }
      }));
    }
  }

  /**
   * Reset quota flags for all keys
   */
  resetQuotas() {
    this.keys.forEach(k => {
      k.quotaExceeded = false;
    });
    this.saveKeys();
    console.log('🔄 All quota flags reset');
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('api-key-quotas-reset'));
  }

  /**
   * Reset quota for a specific key
   * @param {string} keyId - Key ID to reset
   * @returns {boolean} Success status
   */
  resetQuota(keyId) {
    const keyObj = this.keys.find(k => k.id === keyId);
    
    if (keyObj) {
      keyObj.quotaExceeded = false;
      this.saveKeys();
      console.log(`🔄 Reset quota for: ${keyObj.nickname}`);
      return true;
    }
    
    return false;
  }

  /**
   * Delete a key
   * @param {string} keyId - Key ID to delete
   * @returns {boolean} Success status
   */
  deleteKey(keyId) {
    const index = this.keys.findIndex(k => k.id === keyId);
    
    if (index > -1) {
      const deleted = this.keys.splice(index, 1)[0];
      this.saveKeys();
      console.log(`🗑️ Deleted key: ${deleted.nickname}`);
      
      // Adjust current index if needed
      if (this.currentKeyIndex >= this.keys.length) {
        this.currentKeyIndex = 0;
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Update key nickname
   * @param {string} keyId - Key ID
   * @param {string} newNickname - New nickname
   * @returns {boolean} Success status
   */
  updateNickname(keyId, newNickname) {
    const keyObj = this.keys.find(k => k.id === keyId);
    
    if (keyObj && newNickname.trim()) {
      keyObj.nickname = newNickname.trim();
      this.saveKeys();
      console.log(`✏️ Updated nickname to: ${newNickname}`);
      return true;
    }
    
    return false;
  }

  /**
   * Get all keys (with masked key values for security)
   * @returns {Array} Array of key objects with masked keys
   */
  getAllKeys() {
    return this.keys.map(k => ({
      ...k,
      key: this.maskKey(k.key),
      maskedKey: this.maskKey(k.key)
    }));
  }

  /**
   * Get a specific key by ID (with masked key)
   * @param {string} keyId
   * @returns {Object|null}
   */
  getKeyById(keyId) {
    const keyObj = this.keys.find(k => k.id === keyId);
    
    if (keyObj) {
      return {
        ...keyObj,
        maskedKey: this.maskKey(keyObj.key)
      };
    }
    
    return null;
  }

  /**
   * Mask API key for display (security)
   * @param {string} key - Full API key
   * @returns {string} Masked key
   */
  maskKey(key) {
    if (!key || key.length < 10) {
      return '***';
    }
    return key.slice(0, 8) + '...' + key.slice(-4);
  }

  /**
   * Get statistics about all keys
   * @returns {Object} Stats object
   */
  getStats() {
    const total = this.keys.length;
    const active = this.keys.filter(k => !k.quotaExceeded).length;
    const exceeded = total - active;
    const totalRequests = this.keys.reduce((sum, k) => sum + k.requestCount, 0);
    
    // Find most used key
    let mostUsedKey = null;
    if (this.keys.length > 0) {
      mostUsedKey = this.keys.reduce((prev, current) => 
        (prev.requestCount > current.requestCount) ? prev : current
      );
    }

    return {
      totalKeys: total,
      activeKeys: active,
      exceededKeys: exceeded,
      totalRequests,
      mostUsedKey: mostUsedKey ? {
        nickname: mostUsedKey.nickname,
        requestCount: mostUsedKey.requestCount
      } : null
    };
  }

  /**
   * Check if there are any available keys
   * @returns {boolean}
   */
  hasAvailableKeys() {
    return this.keys.some(k => !k.quotaExceeded);
  }

  /**
   * Export keys (for backup)
   * @returns {string} JSON string of keys
   */
  exportKeys() {
    return JSON.stringify(this.keys, null, 2);
  }

  /**
   * Import keys (from backup)
   * @param {string} jsonString - JSON string of keys
   * @returns {number} Number of keys imported
   */
  importKeys(jsonString) {
    try {
      const importedKeys = JSON.parse(jsonString);
      
      if (!Array.isArray(importedKeys)) {
        throw new Error('Invalid format: expected array of keys');
      }

      let importedCount = 0;
      
      for (const key of importedKeys) {
        // Validate key structure
        if (key.key && typeof key.key === 'string') {
          // Check for duplicates
          if (!this.keys.some(k => k.key === key.key)) {
            this.keys.push({
              id: key.id || Date.now().toString() + Math.random(),
              key: key.key,
              nickname: key.nickname || `Imported Key ${importedCount + 1}`,
              requestCount: key.requestCount || 0,
              quotaExceeded: key.quotaExceeded || false,
              lastUsed: key.lastUsed || null,
              createdAt: key.createdAt || new Date().toISOString()
            });
            importedCount++;
          }
        }
      }

      this.saveKeys();
      console.log(`📥 Imported ${importedCount} key(s)`);
      
      return importedCount;
    } catch (error) {
      console.error('Failed to import keys:', error);
      throw new Error('Failed to import keys. Invalid JSON format.');
    }
  }

  /**
   * Clear all keys (use with caution)
   */
  clearAllKeys() {
    this.keys = [];
    this.currentKeyIndex = 0;
    this.saveKeys();
    console.log('🗑️ All keys cleared');
  }
}

// Export for use in other modules
export default APIKeyManager;
