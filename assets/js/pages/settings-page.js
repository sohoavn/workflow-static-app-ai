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
    
    // Model management
    const refreshBtn = document.getElementById('btn-refresh-models');
    const modelSelector = document.getElementById('model-selector');
    
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        console.log('🔄 Refreshing models...');
        loadModels();
      });
      console.log('✅ Refresh models button attached');
    }
    
    if (modelSelector) {
      modelSelector.addEventListener('change', (e) => {
        selectModel(e.target.value);
      });
      console.log('✅ Model selector attached');
    }
    
    // Auto-load models
    loadModels();
    
    // Test notification
    if (window.notificationManager) {
      setTimeout(() => {
        window.notificationManager.info('⚙️ Settings page ready!');
      }, 500);
    }
  }
  
  // ============================================
  // MODEL MANAGEMENT
  // ============================================
  
  const SELECTED_MODEL_KEY = 'gemini_selected_model';
  let availableModels = [];
  
  async function loadModels() {
    const container = document.getElementById('models-list');
    const selector = document.getElementById('model-selector');
    const statsDiv = document.getElementById('model-stats');
    
    if (!container || !selector) {
      console.warn('⚠️ Model UI elements not found');
      return;
    }
    
    try {
      container.innerHTML = '<div class="text-center py-4"><div class="animate-pulse">Fetching models from Gemini API...</div></div>';
      
      // Get API key to fetch models
      const keys = getKeys();
      if (keys.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-gray-500"><p>⚠️ Please add an API key first to fetch models</p></div>';
        return;
      }
      
      const apiKey = keys[0].key;
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter models that support generateContent
      availableModels = data.models
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => ({
          name: m.name.replace('models/', ''),
          displayName: m.displayName,
          description: m.description,
          inputLimit: m.inputTokenLimit,
          outputLimit: m.outputTokenLimit
        }));
      
      console.log(`✅ Loaded ${availableModels.length} models`);
      
      // Render models
      renderModels();
      
      // Show stats
      if (statsDiv) {
        statsDiv.style.display = 'block';
      }
      
      showToast(`Loaded ${availableModels.length} models successfully!`, 'success');
      
    } catch (error) {
      console.error('Failed to load models:', error);
      container.innerHTML = `
        <div class="text-center py-8 text-red-600">
          <p class="font-medium">❌ Failed to load models</p>
          <p class="text-sm mt-2">${error.message}</p>
          <button onclick="window.SettingsPage.refreshModels()" class="btn btn-sm btn-secondary mt-4">Retry</button>
        </div>
      `;
    }
  }
  
  function renderModels() {
    const container = document.getElementById('models-list');
    const selector = document.getElementById('model-selector');
    
    if (!container || !selector) return;
    
    if (availableModels.length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-gray-500">No models available</div>';
      return;
    }
    
    // Get current selected model
    const selectedModel = localStorage.getItem(SELECTED_MODEL_KEY) || 'gemini-1.5-pro';
    
    // Update selector
    selector.innerHTML = availableModels.map(model => 
      `<option value="${model.name}" ${model.name === selectedModel ? 'selected' : ''}>
        ${model.displayName || model.name}
      </option>`
    ).join('');
    
    // Render model cards with ratings
    container.innerHTML = availableModels.map(model => {
      const rating = getModelRating(model.name);
      const isSelected = model.name === selectedModel;
      
      return `
        <div class="border rounded-lg p-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'bg-white hover:border-gray-400'}">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h4 class="font-semibold text-gray-900">${model.displayName || model.name}</h4>
                ${isSelected ? '<span class="badge badge-primary text-xs">Current</span>' : ''}
                ${rating.badge}
              </div>
              
              <p class="text-sm text-gray-600 mt-2">${model.description || 'No description'}</p>
              
              <div class="flex gap-4 mt-3 text-xs text-gray-500">
                <span>📥 Input: ${formatTokenLimit(model.inputLimit)}</span>
                <span>📤 Output: ${formatTokenLimit(model.outputLimit)}</span>
              </div>
              
              <div class="mt-3 text-xs">
                <span class="text-gray-700">⭐ ${rating.stars}</span>
                <span class="text-gray-500 ml-2">${rating.description}</span>
              </div>
            </div>
            
            ${!isSelected ? `
              <button onclick="window.SettingsPage.selectModel('${model.name}')" class="btn btn-sm btn-secondary">
                Select
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
  
  function getModelRating(modelName) {
    const ratings = {
      'gemini-1.5-pro': {
        stars: '⭐⭐⭐⭐⭐',
        badge: '<span class="badge badge-success text-xs">🏆 Best Quality</span>',
        description: 'Highest accuracy and capability'
      },
      'gemini-1.5-pro-002': {
        stars: '⭐⭐⭐⭐⭐',
        badge: '<span class="badge badge-success text-xs">🏆 Best Quality</span>',
        description: 'Latest version with improved performance'
      },
      'gemini-1.5-flash': {
        stars: '⭐⭐⭐⭐',
        badge: '<span class="badge badge-primary text-xs">⚡ Fast</span>',
        description: 'Great balance of speed and quality'
      },
      'gemini-1.5-flash-002': {
        stars: '⭐⭐⭐⭐',
        badge: '<span class="badge badge-primary text-xs">⚡ Fast</span>',
        description: 'Latest fast model with improved performance'
      },
      'gemini-1.5-flash-8b': {
        stars: '⭐⭐⭐',
        badge: '<span class="badge badge-secondary text-xs">💰 Economical</span>',
        description: 'Most cost-effective option'
      }
    };
    
    return ratings[modelName] || {
      stars: '⭐⭐⭐',
      badge: '',
      description: 'Standard model'
    };
  }
  
  function formatTokenLimit(limit) {
    if (limit >= 1000000) {
      return `${(limit / 1000000).toFixed(1)}M`;
    }
    if (limit >= 1000) {
      return `${(limit / 1000).toFixed(0)}K`;
    }
    return limit.toString();
  }
  
  function selectModel(modelName) {
    console.log(`🎯 Selecting model: ${modelName}`);
    localStorage.setItem(SELECTED_MODEL_KEY, modelName);
    renderModels();
    
    // Update selector
    const selector = document.getElementById('model-selector');
    if (selector) {
      selector.value = modelName;
    }
    
    showToast(`Model changed to ${modelName}`, 'success');
  }
  
  // ============================================
  // END MODEL MANAGEMENT
  // ============================================
  
  // Export to window for global access
  window.SettingsPage = {
    init: init,
    deleteKey: deleteKey,
    getKeys: getKeys,
    loadModels: loadModels,
    refreshModels: loadModels,
    selectModel: selectModel
  };
  
  // Auto-init if DOM is ready
  if (document.getElementById('add-key-form')) {
    console.log('📄 Form already present, initializing immediately');
    init();
  } else {
    console.log('⏳ Form not present yet, call SettingsPage.init() manually');
  }
})();
