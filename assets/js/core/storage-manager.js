/**
 * Storage Manager
 * Unified interface for localStorage and IndexedDB
 * Handles small data (localStorage) and large data (IndexedDB)
 */

class StorageManager {
  constructor() {
    this.dbName = 'WorkflowAppDB';
    this.dbVersion = 1;
    this.db = null;
    this.localStoragePrefix = 'waa_';
    this.maxLocalStorageSize = 4 * 1024 * 1024; // 4MB limit for localStorage
  }

  /**
   * Initialize IndexedDB
   * @returns {Promise<IDBDatabase>}
   */
  async initDB() {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('workflows')) {
          const workflowStore = db.createObjectStore('workflows', { keyPath: 'id' });
          workflowStore.createIndex('name', 'name', { unique: false });
          workflowStore.createIndex('created_at', 'created_at', { unique: false });
          workflowStore.createIndex('industry', 'industry', { unique: false });
        }

        if (!db.objectStoreNames.contains('workflow_states')) {
          db.createObjectStore('workflow_states', { keyPath: 'workflow_id' });
        }

        if (!db.objectStoreNames.contains('generated_apps')) {
          db.createObjectStore('generated_apps', { keyPath: 'id' });
        }

        console.log('✅ IndexedDB schema upgraded');
      };
    });
  }

  /**
   * Save data (auto-select storage based on size)
   * @param {string} key - Storage key
   * @param {any} value - Data to save
   * @param {string} collection - Collection name (for IndexedDB)
   * @returns {Promise<boolean>}
   */
  async save(key, value, collection = null) {
    try {
      const serialized = JSON.stringify(value);
      const size = new Blob([serialized]).size;

      // Use localStorage for small data
      if (size < this.maxLocalStorageSize && !collection) {
        return this.saveToLocalStorage(key, value);
      }

      // Use IndexedDB for large data or collections
      return await this.saveToIndexedDB(key, value, collection || 'workflows');
    } catch (error) {
      console.error('Save failed:', error);
      throw error;
    }
  }

  /**
   * Load data (auto-detect storage)
   * @param {string} key - Storage key
   * @param {string} collection - Collection name (for IndexedDB)
   * @returns {Promise<any>}
   */
  async load(key, collection = null) {
    try {
      // Try localStorage first
      if (!collection) {
        const localData = this.loadFromLocalStorage(key);
        if (localData !== null) {
          return localData;
        }
      }

      // Try IndexedDB
      return await this.loadFromIndexedDB(key, collection || 'workflows');
    } catch (error) {
      console.error('Load failed:', error);
      return null;
    }
  }

  /**
   * Delete data
   * @param {string} key - Storage key
   * @param {string} collection - Collection name (for IndexedDB)
   * @returns {Promise<boolean>}
   */
  async delete(key, collection = null) {
    try {
      // Delete from localStorage
      if (!collection) {
        this.deleteFromLocalStorage(key);
      }

      // Delete from IndexedDB
      if (collection) {
        return await this.deleteFromIndexedDB(key, collection);
      }

      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }

  /**
   * Save to localStorage
   * @param {string} key
   * @param {any} value
   * @returns {boolean}
   */
  saveToLocalStorage(key, value) {
    try {
      const prefixedKey = this.localStoragePrefix + key;
      localStorage.setItem(prefixedKey, JSON.stringify(value));
      console.log(`💾 Saved to localStorage: ${key}`);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('⚠️ localStorage quota exceeded');
        throw new Error('Storage quota exceeded. Please clear old data.');
      }
      throw error;
    }
  }

  /**
   * Load from localStorage
   * @param {string} key
   * @returns {any|null}
   */
  loadFromLocalStorage(key) {
    try {
      const prefixedKey = this.localStoragePrefix + key;
      const stored = localStorage.getItem(prefixedKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * Delete from localStorage
   * @param {string} key
   */
  deleteFromLocalStorage(key) {
    const prefixedKey = this.localStoragePrefix + key;
    localStorage.removeItem(prefixedKey);
    console.log(`🗑️ Deleted from localStorage: ${key}`);
  }

  /**
   * Save to IndexedDB
   * @param {string} key
   * @param {any} value
   * @param {string} collection
   * @returns {Promise<boolean>}
   */
  async saveToIndexedDB(key, value, collection) {
    await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([collection], 'readwrite');
      const store = transaction.objectStore(collection);

      // Ensure the value has the correct key field
      const data = { ...value, id: key };

      const request = store.put(data);

      request.onsuccess = () => {
        console.log(`💾 Saved to IndexedDB (${collection}): ${key}`);
        resolve(true);
      };

      request.onerror = () => {
        console.error('IndexedDB save error:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Load from IndexedDB
   * @param {string} key
   * @param {string} collection
   * @returns {Promise<any>}
   */
  async loadFromIndexedDB(key, collection) {
    await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([collection], 'readonly');
      const store = transaction.objectStore(collection);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('IndexedDB load error:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete from IndexedDB
   * @param {string} key
   * @param {string} collection
   * @returns {Promise<boolean>}
   */
  async deleteFromIndexedDB(key, collection) {
    await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([collection], 'readwrite');
      const store = transaction.objectStore(collection);
      const request = store.delete(key);

      request.onsuccess = () => {
        console.log(`🗑️ Deleted from IndexedDB (${collection}): ${key}`);
        resolve(true);
      };

      request.onerror = () => {
        console.error('IndexedDB delete error:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all items from a collection
   * @param {string} collection
   * @returns {Promise<Array>}
   */
  async getAll(collection) {
    await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([collection], 'readonly');
      const store = transaction.objectStore(collection);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('IndexedDB getAll error:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all data from localStorage with prefix
   */
  clearLocalStorage() {
    const keys = Object.keys(localStorage);
    const prefixedKeys = keys.filter(k => k.startsWith(this.localStoragePrefix));
    
    prefixedKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`🗑️ Cleared ${prefixedKeys.length} items from localStorage`);
  }

  /**
   * Clear all data from IndexedDB
   * @param {string} collection
   * @returns {Promise<boolean>}
   */
  async clearIndexedDB(collection) {
    await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([collection], 'readwrite');
      const store = transaction.objectStore(collection);
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`🗑️ Cleared IndexedDB collection: ${collection}`);
        resolve(true);
      };

      request.onerror = () => {
        console.error('IndexedDB clear error:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get storage usage statistics
   * @returns {Promise<Object>}
   */
  async getStorageStats() {
    const stats = {
      localStorage: {
        used: 0,
        available: this.maxLocalStorageSize,
        items: 0
      },
      indexedDB: {
        workflows: 0,
        workflowStates: 0,
        generatedApps: 0
      }
    };

    // Calculate localStorage usage
    const keys = Object.keys(localStorage);
    const prefixedKeys = keys.filter(k => k.startsWith(this.localStoragePrefix));
    stats.localStorage.items = prefixedKeys.length;

    prefixedKeys.forEach(key => {
      const value = localStorage.getItem(key);
      stats.localStorage.used += new Blob([value]).size;
    });

    // Count IndexedDB items
    try {
      await this.initDB();
      stats.indexedDB.workflows = (await this.getAll('workflows')).length;
      stats.indexedDB.workflowStates = (await this.getAll('workflow_states')).length;
      stats.indexedDB.generatedApps = (await this.getAll('generated_apps')).length;
    } catch (error) {
      console.error('Failed to get IndexedDB stats:', error);
    }

    return stats;
  }

  /**
   * Export all data (for backup)
   * @returns {Promise<Object>}
   */
  async exportAllData() {
    const data = {
      localStorage: {},
      indexedDB: {
        workflows: [],
        workflow_states: [],
        generated_apps: []
      },
      exported_at: new Date().toISOString()
    };

    // Export localStorage
    const keys = Object.keys(localStorage);
    const prefixedKeys = keys.filter(k => k.startsWith(this.localStoragePrefix));
    
    prefixedKeys.forEach(key => {
      const cleanKey = key.replace(this.localStoragePrefix, '');
      data.localStorage[cleanKey] = JSON.parse(localStorage.getItem(key));
    });

    // Export IndexedDB
    try {
      await this.initDB();
      data.indexedDB.workflows = await this.getAll('workflows');
      data.indexedDB.workflow_states = await this.getAll('workflow_states');
      data.indexedDB.generated_apps = await this.getAll('generated_apps');
    } catch (error) {
      console.error('Failed to export IndexedDB:', error);
    }

    console.log('📤 Data exported');
    return data;
  }

  /**
   * Import data (from backup)
   * @param {Object} data
   * @returns {Promise<boolean>}
   */
  async importAllData(data) {
    try {
      // Import localStorage
      if (data.localStorage) {
        Object.entries(data.localStorage).forEach(([key, value]) => {
          this.saveToLocalStorage(key, value);
        });
      }

      // Import IndexedDB
      await this.initDB();
      
      if (data.indexedDB) {
        for (const workflow of data.indexedDB.workflows || []) {
          await this.saveToIndexedDB(workflow.id, workflow, 'workflows');
        }
        
        for (const state of data.indexedDB.workflow_states || []) {
          await this.saveToIndexedDB(state.workflow_id, state, 'workflow_states');
        }
        
        for (const app of data.indexedDB.generated_apps || []) {
          await this.saveToIndexedDB(app.id, app, 'generated_apps');
        }
      }

      console.log('📥 Data imported successfully');
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }
}

// Export for use in other modules
export default StorageManager;
