/**
 * Gemini Client
 * API wrapper with auto-retry, model detection, and quota handling
 */

import APIKeyManager from './api-key-manager.js';

class GeminiClient {
  constructor(apiKeyManager = null) {
    this.apiKeyManager = apiKeyManager || new APIKeyManager();
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.availableModels = [];
    this.defaultModel = 'gemini-1.5-pro';
    this.modelsCacheKey = 'gemini_models_cache';
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Fetch available models from Gemini API
   * @returns {Promise<Array>} List of models
   */
  async fetchAvailableModels() {
    try {
      const apiKey = this.apiKeyManager.getNextKey();
      const url = `${this.baseUrl}/models?key=${apiKey}`;
      
      console.log('📋 Fetching available models from Gemini API...');
      
      const response = await fetch(url);
      
      if (response.status === 429) {
        // Quota exceeded, mark and retry
        console.warn('⚠️ Quota exceeded while fetching models, rotating key...');
        this.apiKeyManager.markQuotaExceeded(apiKey);
        return this.fetchAvailableModels(); // Recursive retry
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Filter only models that support generateContent
      this.availableModels = data.models
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => ({
          name: m.name.replace('models/', ''),
          displayName: m.displayName,
          description: m.description,
          inputTokenLimit: m.inputTokenLimit,
          outputTokenLimit: m.outputTokenLimit
        }));
      
      console.log(`✅ Fetched ${this.availableModels.length} models`);
      
      // Cache models
      this.cacheModels();
      
      return this.availableModels;
    } catch (error) {
      console.error('Failed to fetch models:', error);
      
      // Try to load from cache
      const cachedModels = this.loadCachedModels();
      if (cachedModels.length > 0) {
        console.log('📦 Using cached models');
        return cachedModels;
      }
      
      // Return default models as fallback
      return this.getDefaultModels();
    }
  }

  /**
   * Cache models to localStorage
   */
  cacheModels() {
    try {
      const cache = {
        models: this.availableModels,
        timestamp: Date.now()
      };
      localStorage.setItem(this.modelsCacheKey, JSON.stringify(cache));
      console.log('💾 Models cached');
    } catch (error) {
      console.error('Failed to cache models:', error);
    }
  }

  /**
   * Load models from cache
   * @returns {Array} Cached models or empty array
   */
  loadCachedModels() {
    try {
      const cache = JSON.parse(localStorage.getItem(this.modelsCacheKey));
      
      if (cache && (Date.now() - cache.timestamp < this.cacheExpiry)) {
        this.availableModels = cache.models;
        return this.availableModels;
      }
    } catch (error) {
      console.error('Failed to load cached models:', error);
    }
    
    return [];
  }

  /**
   * Get default models (fallback)
   * @returns {Array} Default models list
   */
  getDefaultModels() {
    return [
      {
        name: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        description: 'Fast and efficient model for quick tasks',
        inputTokenLimit: 1000000,
        outputTokenLimit: 8192
      },
      {
        name: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        description: 'Advanced model for complex tasks',
        inputTokenLimit: 2000000,
        outputTokenLimit: 8192
      },
      {
        name: 'gemini-2.0-flash-exp',
        displayName: 'Gemini 2.0 Flash (Experimental)',
        description: 'Latest experimental model with improved capabilities',
        inputTokenLimit: 1000000,
        outputTokenLimit: 8192
      }
    ];
  }

  /**
   * Recommend best model for task
   * @param {string} taskType - Type of task (workflow_generation, code_generation, analysis)
   * @param {string} complexity - Complexity level (low, medium, high)
   * @returns {Object} Recommended model with reason
   */
  recommendModel(taskType, complexity = 'medium') {
    const recommendations = {
      'workflow_generation': {
        'low': 'gemini-1.5-flash',
        'medium': 'gemini-1.5-pro',
        'high': 'gemini-2.0-flash-exp'
      },
      'code_generation': {
        'low': 'gemini-1.5-flash',
        'medium': 'gemini-1.5-pro',
        'high': 'gemini-2.0-flash-exp'
      },
      'analysis': {
        'low': 'gemini-1.5-flash',
        'medium': 'gemini-1.5-pro',
        'high': 'gemini-2.0-flash-exp'
      }
    };

    const recommendedName = recommendations[taskType]?.[complexity] || 'gemini-1.5-pro';
    
    // Try to find in available models
    let model = this.availableModels.find(m => m.name.includes(recommendedName));
    
    // Fallback to default models
    if (!model) {
      model = this.getDefaultModels().find(m => m.name.includes(recommendedName));
    }
    
    // Fallback to first available model
    if (!model) {
      model = this.availableModels[0] || this.getDefaultModels()[0];
    }
    
    return {
      model: model,
      reason: `Recommended for ${taskType} with ${complexity} complexity`,
      taskType,
      complexity
    };
  }

  /**
   * Generate content with auto key rotation
   * @param {string} prompt - User prompt
   * @param {string} modelName - Model to use (default: gemini-1.5-pro)
   * @param {Object} config - Generation config
   * @returns {Promise<string>} Generated content
   */
  async generateContent(prompt, modelName = null, config = {}) {
    const model = modelName || this.defaultModel;
    const apiKey = this.apiKeyManager.getNextKey();
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${apiKey}`;
    
    const defaultConfig = {
      temperature: 0.7,
      maxOutputTokens: 8192,
      topP: 0.95,
      topK: 40
    };
    
    const generationConfig = { ...defaultConfig, ...config };
    
    try {
      console.log(`🤖 Generating content with ${model}...`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig
        })
      });

      if (response.status === 429) {
        console.warn('⚠️ Quota exceeded, rotating to next key...');
        this.apiKeyManager.markQuotaExceeded(apiKey);
        return this.generateContent(prompt, modelName, config); // Retry
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        throw new Error(`API error: ${errorMessage}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response generated. The model may have filtered the content.');
      }
      
      const text = data.candidates[0].content.parts[0].text;
      console.log(`✅ Generated ${text.length} characters`);
      
      return text;
    } catch (error) {
      console.error('Content generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate content with streaming (for chat UI)
   * @param {string} prompt - User prompt
   * @param {Function} onChunk - Callback for each chunk (receives text chunk)
   * @param {string} modelName - Model to use
   * @param {Object} config - Generation config
   * @returns {Promise<string>} Full generated content
   */
  async generateContentStream(prompt, onChunk, modelName = null, config = {}) {
    const model = modelName || this.defaultModel;
    const apiKey = this.apiKeyManager.getNextKey();
    const url = `${this.baseUrl}/models/${model}:streamGenerateContent?key=${apiKey}`;
    
    const defaultConfig = {
      temperature: 0.7,
      maxOutputTokens: 8192,
      topP: 0.95,
      topK: 40
    };
    
    const generationConfig = { ...defaultConfig, ...config };
    
    try {
      console.log(`🤖 Streaming content with ${model}...`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig
        })
      });

      if (response.status === 429) {
        console.warn('⚠️ Quota exceeded, rotating to next key...');
        this.apiKeyManager.markQuotaExceeded(apiKey);
        return this.generateContentStream(prompt, onChunk, modelName, config);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        throw new Error(`API error: ${errorMessage}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Split by newlines to process complete JSON objects
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === ',') continue;
          
          try {
            const json = JSON.parse(trimmedLine);
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text) {
              fullText += text;
              if (onChunk) {
                onChunk(text);
              }
            }
          } catch (e) {
            // Skip invalid JSON lines
            console.debug('Skipped invalid JSON line:', trimmedLine);
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        try {
          const json = JSON.parse(buffer);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            fullText += text;
            if (onChunk) {
              onChunk(text);
            }
          }
        } catch (e) {
          console.debug('Skipped final buffer:', buffer);
        }
      }

      console.log(`✅ Streamed ${fullText.length} characters`);
      return fullText;
    } catch (error) {
      console.error('Streaming generation failed:', error);
      throw error;
    }
  }

  /**
   * Get available models (cached or fresh)
   * @returns {Promise<Array>} List of models
   */
  async getModels() {
    // Try cache first
    const cached = this.loadCachedModels();
    if (cached.length > 0) {
      return cached;
    }
    
    // Fetch fresh models
    return this.fetchAvailableModels();
  }

  /**
   * Test API key validity
   * @param {string} apiKey - API key to test
   * @returns {Promise<Object>} Test result with status and message
   */
  async testApiKey(apiKey) {
    const url = `${this.baseUrl}/models?key=${apiKey}`;
    
    try {
      const response = await fetch(url);
      
      if (response.ok) {
        return {
          valid: true,
          message: 'API key is valid and working'
        };
      } else if (response.status === 400) {
        return {
          valid: false,
          message: 'Invalid API key format'
        };
      } else if (response.status === 403) {
        return {
          valid: false,
          message: 'API key is invalid or disabled'
        };
      } else if (response.status === 429) {
        return {
          valid: true,
          message: 'API key is valid but quota exceeded'
        };
      } else {
        return {
          valid: false,
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        valid: false,
        message: `Network error: ${error.message}`
      };
    }
  }
}

// Export for use in other modules
export default GeminiClient;
