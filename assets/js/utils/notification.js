/**
 * Notification System
 * Toast notifications with various types
 */

class NotificationManager {
  constructor() {
    this.container = null;
    this.notifications = [];
    this.maxNotifications = 5;
    this.defaultDuration = 5000; // 5 seconds
    this.init();
  }

  /**
   * Initialize notification system
   */
  init() {
    this.container = document.getElementById('toast-container');
    
    if (!this.container) {
      console.warn('Toast container not found, creating one...');
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'fixed top-20 right-4 z-50 space-y-2';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {number} duration - Duration in ms (0 = no auto-dismiss)
   * @returns {string} Notification ID
   */
  show(message, type = 'info', duration = null) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const effectiveDuration = duration !== null ? duration : this.defaultDuration;

    // Remove oldest notification if max reached
    if (this.notifications.length >= this.maxNotifications) {
      const oldest = this.notifications[0];
      this.dismiss(oldest.id);
    }

    const notification = {
      id,
      message,
      type,
      duration: effectiveDuration,
      element: this.createNotificationElement(id, message, type)
    };

    this.notifications.push(notification);
    this.container.appendChild(notification.element);

    // Auto-dismiss
    if (effectiveDuration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, effectiveDuration);
    }

    return id;
  }

  /**
   * Create notification DOM element
   * @param {string} id
   * @param {string} message
   * @param {string} type
   * @returns {HTMLElement}
   */
  createNotificationElement(id, message, type) {
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: `<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>`,
      error: `<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>`,
      warning: `<svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>`,
      info: `<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>`
    };

    toast.innerHTML = `
      <div class="flex-shrink-0">
        ${icons[type] || icons.info}
      </div>
      <div class="flex-1 ml-3">
        <p class="text-sm font-medium text-gray-900">${this.escapeHtml(message)}</p>
      </div>
      <button class="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600" onclick="window.notificationManager.dismiss('${id}')">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    `;

    return toast;
  }

  /**
   * Dismiss notification
   * @param {string} id - Notification ID
   */
  dismiss(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    
    if (index > -1) {
      const notification = this.notifications[index];
      
      // Animate out
      if (notification.element) {
        notification.element.style.animation = 'slideOut 0.3s ease';
        
        setTimeout(() => {
          if (notification.element.parentNode) {
            notification.element.parentNode.removeChild(notification.element);
          }
        }, 300);
      }

      // Remove from array
      this.notifications.splice(index, 1);
    }
  }

  /**
   * Dismiss all notifications
   */
  dismissAll() {
    const ids = this.notifications.map(n => n.id);
    ids.forEach(id => this.dismiss(id));
  }

  /**
   * Show success notification
   * @param {string} message
   * @param {number} duration
   * @returns {string} Notification ID
   */
  success(message, duration = null) {
    return this.show(message, 'success', duration);
  }

  /**
   * Show error notification
   * @param {string} message
   * @param {number} duration
   * @returns {string} Notification ID
   */
  error(message, duration = null) {
    return this.show(message, 'error', duration || 7000); // Errors stay longer
  }

  /**
   * Show warning notification
   * @param {string} message
   * @param {number} duration
   * @returns {string} Notification ID
   */
  warning(message, duration = null) {
    return this.show(message, 'warning', duration);
  }

  /**
   * Show info notification
   * @param {string} message
   * @param {number} duration
   * @returns {string} Notification ID
   */
  info(message, duration = null) {
    return this.show(message, 'info', duration);
  }

  /**
   * Show loading notification (no auto-dismiss)
   * @param {string} message
   * @returns {string} Notification ID
   */
  loading(message) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const toast = document.createElement('div');
    toast.id = id;
    toast.className = 'toast';
    
    toast.innerHTML = `
      <div class="flex-shrink-0">
        <svg class="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <div class="flex-1 ml-3">
        <p class="text-sm font-medium text-gray-900">${this.escapeHtml(message)}</p>
      </div>
    `;

    const notification = {
      id,
      message,
      type: 'loading',
      duration: 0,
      element: toast
    };

    this.notifications.push(notification);
    this.container.appendChild(toast);

    return id;
  }

  /**
   * Update loading notification to success/error
   * @param {string} id - Loading notification ID
   * @param {string} message - New message
   * @param {string} type - success or error
   */
  updateLoading(id, message, type = 'success') {
    this.dismiss(id);
    this.show(message, type);
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text
   * @returns {string}
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create global instance
window.notificationManager = new NotificationManager();

// Export for modules
export default NotificationManager;
