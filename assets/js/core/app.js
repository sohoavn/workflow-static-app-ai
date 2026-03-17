/**
 * Main Application Entry Point
 * Workflow-as-App Platform v1.0
 */

class App {
  constructor() {
    this.version = '1.0.0';
    this.init();
  }

  async init() {
    console.log(`🚀 Workflow-as-App Platform v${this.version}`);
    
    try {
      // Check dependencies
      if (!this.checkDependencies()) {
        return;
      }
      
      // Initialize router
      await this.initRouter();
      
      // Load saved state
      this.loadState();
      
      // Initialize UI
      this.initUI();
      
      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Check if all required dependencies are loaded
   * @returns {boolean}
   */
  checkDependencies() {
    const required = {
      'PouchDB': 'Database storage',
      'JSZip': 'File compression',
      'lucide': 'Icons',
      'marked': 'Markdown rendering',
      'mermaid': 'Diagram rendering',
      'DOMPurify': 'XSS protection'
    };
    
    const missing = [];
    
    for (const [dep, description] of Object.entries(required)) {
      if (typeof window[dep] === 'undefined') {
        missing.push(`${dep} (${description})`);
      }
    }
    
    if (missing.length > 0) {
      console.error('❌ Missing dependencies:', missing);
      const message = `Failed to load required libraries:\n${missing.join('\n')}\n\nPlease check your internet connection and refresh the page.`;
      alert(message);
      return false;
    }
    
    console.log('✅ All dependencies loaded');
    return true;
  }

  /**
   * Initialize router
   */
  async initRouter() {
    this.router = new Router();
    await this.router.init();
    
    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      this.router.navigate();
    });
  }

  /**
   * Load saved application state
   */
  loadState() {
    // Load theme
    const savedTheme = localStorage.getItem('app_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Load last visited page
    const lastPage = localStorage.getItem('app_last_page');
    if (!window.location.hash && lastPage) {
      window.location.hash = lastPage;
    }
  }

  /**
   * Initialize UI components
   */
  initUI() {
    // Initialize Lucide icons
    if (window.lucide) {
      lucide.createIcons();
    }
    
    // Initialize Mermaid
    if (window.mermaid) {
      mermaid.initialize({ 
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose'
      });
    }
    
    // Setup global event listeners
    this.setupGlobalListeners();
  }

  /**
   * Setup global event listeners
   */
  setupGlobalListeners() {
    // Save last visited page
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        localStorage.setItem('app_last_page', hash);
      }
    });
    
    // Handle offline/online status
    window.addEventListener('offline', () => {
      this.showToast('You are offline. Some features may not work.', 'warning');
    });
    
    window.addEventListener('online', () => {
      this.showToast('You are back online!', 'success');
    });
    
    // Prevent accidental page close if there's unsaved data
    window.addEventListener('beforeunload', (e) => {
      const hasUnsavedData = localStorage.getItem('app_has_unsaved_data') === 'true';
      if (hasUnsavedData) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  /**
   * Show toast notification
   * @param {string} message
   * @param {string} type - success, error, warning, info
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };
    
    toast.innerHTML = `
      <div class="flex-shrink-0 text-2xl">${icons[type]}</div>
      <div class="flex-1">
        <p class="font-medium">${message}</p>
      </div>
      <button class="flex-shrink-0 text-gray-400 hover:text-gray-600" onclick="this.parentElement.remove()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  /**
   * Show error message
   * @param {string} message
   */
  showError(message) {
    const content = document.getElementById('app-content');
    if (content) {
      content.innerHTML = `
        <div class="container mx-auto px-4 py-12">
          <div class="max-w-md mx-auto text-center">
            <div class="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
            <p class="text-gray-600 mb-6">${message}</p>
            <button onclick="location.reload()" class="btn btn-primary">
              Reload Page
            </button>
          </div>
        </div>
      `;
    }
  }

  /**
   * Show/hide loading overlay
   * @param {boolean} show
   */
  setLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
    }
  }
}

/**
 * Simple SPA Router
 */
class Router {
  constructor() {
    this.routes = {
      '': './pages/designer.html',
      'designer': './pages/designer.html',
      'generator': './pages/generator.html',
      'library': './pages/library.html',
      'settings': './pages/settings.html'
    };
    
    this.currentPage = null;
  }

  async init() {
    await this.navigate();
  }

  /**
   * Navigate to route based on hash
   */
  async navigate() {
    const hash = window.location.hash.slice(1) || '';
    const page = this.routes[hash] || this.routes[''];
    
    // Don't reload if same page
    if (this.currentPage === page) {
      return;
    }
    
    console.log(`🔄 Navigating to: ${hash || 'home'}`);
    
    try {
      // Show loading
      this.setLoadingState(true);
      
      // Fetch page content
      const response = await fetch(page);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Update content
      const content = document.getElementById('app-content');
      if (content) {
        content.innerHTML = html;
      }
      
      // Update current page
      this.currentPage = page;
      
      // Update active nav link
      this.updateActiveNavLink(hash || 'designer');
      
      // Re-initialize icons
      if (window.lucide) {
        lucide.createIcons();
      }
      
      // Trigger page-specific initialization
      this.initPage(hash || 'designer');
      
      // Hide loading
      this.setLoadingState(false);
      
      console.log(`✅ Loaded page: ${hash || 'designer'}`);
    } catch (error) {
      console.error('❌ Navigation error:', error);
      this.showErrorPage(hash);
      this.setLoadingState(false);
    }
  }

  /**
   * Update active navigation link
   * @param {string} pageName
   */
  updateActiveNavLink(pageName) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${pageName}`) {
        link.classList.add('active');
      }
    });
  }

  /**
   * Trigger page-specific initialization
   * @param {string} pageName
   */
  initPage(pageName) {
    const event = new CustomEvent('page-loaded', { 
      detail: { page: pageName } 
    });
    window.dispatchEvent(event);
  }

  /**
   * Show loading state
   * @param {boolean} loading
   */
  setLoadingState(loading) {
    const content = document.getElementById('app-content');
    if (loading) {
      content.style.opacity = '0.5';
      content.style.pointerEvents = 'none';
    } else {
      content.style.opacity = '1';
      content.style.pointerEvents = 'auto';
    }
  }

  /**
   * Show error page
   * @param {string} attemptedRoute
   */
  showErrorPage(attemptedRoute) {
    const content = document.getElementById('app-content');
    if (content) {
      content.innerHTML = `
        <div class="container mx-auto px-4 py-12">
          <div class="max-w-md mx-auto text-center">
            <div class="text-6xl mb-4">🔍</div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
            <p class="text-gray-600 mb-6">
              The page "${attemptedRoute || 'home'}" could not be loaded.
            </p>
            <div class="space-x-4">
              <a href="#designer" class="btn btn-primary">Go to Designer</a>
              <button onclick="location.reload()" class="btn btn-secondary">Reload</button>
            </div>
          </div>
        </div>
      `;
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
  });
} else {
  window.app = new App();
}

// Export for use in other modules
export { App, Router };
