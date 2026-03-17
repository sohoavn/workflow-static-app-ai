/**
 * Settings Page Controller
 * Handles API key management
 */

(function() {
  console.log('⚙️ Settings Page Script Loaded');
  
  // Simple API Key Manager (inline)
  const API_KEYS_STORAGE_KEY = 'gemini_api_keys';
  
  function getKeys() {
    try {
      const data = localStorage.getItem(API_KEYS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading keys:', error);
      return [];
    }
  }
  
  function saveKeys(keys) {
    try {
      localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
      return true;
    } catch (error) {
      console.error('Error saving keys:', error);
      return false;
    }
  }
  
  function maskKey(key) {
    if (key.length < 12) return key;
    return key.substring(0, 6) + '****...****' + key.substring(key.length - 4);
  }
  
  function showToast(message, type = 'success') {
    console.log(`🍞 Toast: ${message} (${type})`);
    if (window.notificationManager) {
      if (type === 'success') {
        window.notificationManager.success(message);
      } else if (type === 'error') {
        window.notificationManager.error(message);
      } else {
        window.notificationManager.info(message);
      }
    } else {
      // Fallback alert
      console.warn('⚠️ NotificationManager not found, using alert');
      alert(message);
    }
  }
  
  function renderKeys() {
    const container = document.getElementById('api-keys-list');
    if (!container) {
      console.error('❌ Container #api-keys-list not found');
      return;
    }
    
    const keys = getKeys();
    console.log(`📋 Rendering ${keys.length} keys`);
    
    if (keys.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <p class="text-lg">📝 No API keys added yet</p>
          <p class="text-sm mt-1">Add your first Gemini API key above</p>
        </div>
      `;
      updateStats();
      return;
    }
    
    container.innerHTML = keys.map((key, index) => `
      <div class="flex items-center justify-between p-4 border rounded-lg bg-white">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <p class="font-medium text-gray-900">${key.nickname || 'Key ' + (index + 1)}</p>
            <span class="badge badge-success text-xs">Active</span>
          </div>
          <p class="text-sm text-gray-600 font-mono mt-1">${maskKey(key.key)}</p>
          <p class="text-xs text-gray-500 mt-1">
            Added: ${new Date(key.addedAt).toLocaleString()}
          </p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-sm btn-danger" onclick="window.SettingsPage.deleteKey(${index})">
            🗑️ Delete
          </button>
        </div>
      </div>
    `).join('');
    
    updateStats();
  }
  
  function updateStats() {
    const keys = getKeys();
    const statTotal = document.getElementById('stat-total');
    const statActive = document.getElementById('stat-active');
    const statExceeded = document.getElementById('stat-exceeded');
    const statRequests = document.getElementById('stat-requests');
    
    if (statTotal) statTotal.textContent = keys.length;
    if (statActive) statActive.textContent = keys.length;
    if (statExceeded) statExceeded.textContent = '0';
    if (statRequests) statRequests.textContent = '0';
  }
  
  function addKey(e) {
    e.preventDefault();
    console.log('🔑 Add Key button clicked');
    
    const keyInput = document.getElementById('api-key-input');
    const nicknameInput = document.getElementById('api-key-nickname');
    
    if (!keyInput) {
      console.error('❌ Input #api-key-input not found');
      return;
    }
    
    const key = keyInput.value.trim();
    const nickname = nicknameInput ? nicknameInput.value.trim() : '';
    
    console.log(`📝 Adding key: ${key.substring(0, 10)}... (nickname: ${nickname})`);
    
    if (!key) {
      showToast('Please enter an API key', 'error');
      return;
    }
    
    if (key.length < 10) {
      showToast('API key seems too short', 'error');
      return;
    }
    
    const keys = getKeys();
    
    // Check duplicate
    if (keys.some(k => k.key === key)) {
      showToast('This API key already exists', 'error');
      return;
    }
    
    // Add new key
    const newKey = {
      id: Date.now().toString(),
      key: key,
      nickname: nickname || `Key ${keys.length + 1}`,
      addedAt: new Date().toISOString(),
      quotaExceeded: false,
      requestCount: 0
    };
    
    keys.push(newKey);
    console.log('✅ New key object:', newKey);
    
    if (saveKeys(keys)) {
      console.log('✅ Key saved to localStorage');
      showToast('✓ API key added successfully!', 'success');
      keyInput.value = '';
      if (nicknameInput) nicknameInput.value = '';
      renderKeys();
    } else {
      console.error('❌ Failed to save keys');
      showToast('Failed to save API key', 'error');
    }
  }
  
  function deleteKey(index) {
    console.log(`🗑️ Delete key at index ${index}`);
    if (!confirm('Are you sure you want to delete this API key?')) {
      return;
    }
    
    const keys = getKeys();
    keys.splice(index, 1);
    
    if (saveKeys(keys)) {
      showToast('API key deleted', 'success');
      renderKeys();
    } else {
      showToast('Failed to delete API key', 'error');
    }
  }
  
  // Initialize function
  function init() {
    console.log('🚀 Initializing Settings Page...');
    
    const form = document.getElementById('add-key-form');
    const container = document.getElementById('api-keys-list');
    
    console.log('🔍 DOM Check:');
    console.log('  - Form:', form ? '✓ Found' : '✗ NOT FOUND');
    console.log('  - Container:', container ? '✓ Found' : '✗ NOT FOUND');
    console.log('  - NotificationManager:', window.notificationManager ? '✓ Found' : '✗ NOT FOUND');
    
    if (form) {
      form.addEventListener('submit', addKey);
      console.log('✅ Form event listener attached');
    } else {
      console.error('❌ Form #add-key-form not found! Cannot attach event listener.');
    }
    
    if (container) {
      renderKeys();
      console.log('✅ Settings page initialized successfully');
    } else {
      console.error('❌ Container not found! Page may not be loaded yet.');
    }
    
    // Test notification
    if (window.notificationManager) {
      setTimeout(() => {
        window.notificationManager.info('⚙️ Settings page ready!');
      }, 500);
    }
  }
  
  // Export to window for global access
  window.SettingsPage = {
    init: init,
    deleteKey: deleteKey,
    getKeys: getKeys
  };
  
  // Auto-init if DOM is ready
  if (document.getElementById('add-key-form')) {
    console.log('📄 Form already present, initializing immediately');
    init();
  } else {
    console.log('⏳ Form not present yet, call SettingsPage.init() manually');
  }
})();
