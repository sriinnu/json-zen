/**
 * JSON Zen - Toast Manager Module
 * Beautiful notification system with Pixar-level animations
 */

const ToastManager = {
  initialized: false,
  container: null,
  toasts: [],
  maxToasts: 5,

  // Initialize
  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.container = document.getElementById('toastContainer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toastContainer';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  // Show a toast
  show(message, type = 'info', options = {}) {
    const {
      duration = 4000,
      title,
      actions = [],
      showProgress = true
    } = options;

    // Remove oldest if at limit
    if (this.toasts.length >= this.maxToasts) {
      this.remove(this.toasts[0]);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = this.getIcon(type);
    const titleHtml = title ? `<div class="toast-title">${this.escapeHtml(title)}</div>` : '';
    
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        ${titleHtml}
        <div class="toast-message">${this.escapeHtml(message)}</div>
        ${actions.length > 0 ? this.renderActions(actions) : ''}
      </div>
      <button class="toast-close" aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      ${showProgress ? `<div class="toast-progress"><div class="toast-progress-bar" style="animation-duration:${duration}ms;"></div></div>` : ''}
    `;

    // Add to container
    this.container.appendChild(toast);
    this.toasts.push(toast);

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.remove(toast);
    });

    // Auto remove
    const timer = setTimeout(() => {
      this.remove(toast);
    }, duration);

    // Pause on hover
    toast.addEventListener('mouseenter', () => {
      clearTimeout(timer);
      const progressBar = toast.querySelector('.toast-progress-bar');
      if (progressBar) {
        progressBar.style.animationPlayState = 'paused';
      }
    });

    toast.addEventListener('mouseleave', () => {
      const progressBar = toast.querySelector('.toast-progress-bar');
      if (progressBar) {
        progressBar.style.animationPlayState = 'running';
      }
      // Resume timer
      setTimeout(() => this.remove(toast), duration / 2);
    });

    // Action buttons
    toast.querySelectorAll('.toast-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const actionId = btn.dataset.action;
        const action = actions.find(a => a.id === actionId);
        if (action?.handler) {
          action.handler();
        }
        this.remove(toast);
      });
    });

    return toast;
  },

  // Remove a toast
  remove(toast) {
    if (!toast || toast.classList.contains('exiting')) return;
    
    toast.classList.add('exiting');
    
    setTimeout(() => {
      toast.remove();
      this.toasts = this.toasts.filter(t => t !== toast);
    }, 300);
  },

  // Remove all toasts
  clear() {
    this.toasts.forEach(toast => this.remove(toast));
  },

  // Get icon SVG for toast type
  getIcon(type) {
    const icons = {
      success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <path d="M9 12l2 2 4-4"/>
      </svg>`,
      error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>`,
      warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>`,
      info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4M12 8h.01"/>
      </svg>`
    };
    return icons[type] || icons.info;
  },

  // Render action buttons
  renderActions(actions) {
    return `
      <div class="toast-actions">
        ${actions.map(action => `
          <button class="toast-action-btn ${action.primary ? 'primary' : 'secondary'}" data-action="${action.id}">
            ${this.escapeHtml(action.label)}
          </button>
        `).join('')}
      </div>
    `;
  },

  // Escape HTML
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  // Shorthand methods
  success(message, options = {}) {
    return this.show(message, 'success', options);
  },

  error(message, options = {}) {
    return this.show(message, 'error', { duration: 6000, ...options });
  },

  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  },

  info(message, options = {}) {
    return this.show(message, 'info', options);
  }
};
