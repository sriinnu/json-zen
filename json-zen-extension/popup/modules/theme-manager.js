/**
 * JSON Zen - Theme Manager Module
 * Advanced theming with smooth transitions and system preference detection
 */

const ThemeManager = {
  initialized: false,
  themes: ['dark', 'light', 'ocean', 'sunset', 'cyberpunk', 'synthwave', 'aurora', 'nebula', 'crystal', 'retro', 'system'],
  currentTheme: 'dark',
  storageKey: 'jsonZenTheme',
  fontScale: 1.0,
  fontFamily: 'system',
  settings: {
    autoFormat: false,
    autoCopy: false,
    indentSize: 2
  },
  spacing: {
    panelGap: 8,
    buttonSize: 'normal',
    lineHeight: 1.5,
    compactMode: false
  },

  // Initialize
  async init() {
    if (this.initialized) return;
    this.initialized = true;

    await this.loadSettings();
    this.applyFontScale();
    this.applyFontFamily();
    this.setupEventListeners();
    this.setupSystemPreferenceListener();
    this.setupSettingsPanel();
  },

  // Load all settings
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        this.storageKey,
        'jsonZenFontScale',
        'jsonZenFontFamily',
        'jsonZenAutoFormat',
        'jsonZenAutoCopy',
        'jsonZenIndentSize',
        'jsonZenPanelGap',
        'jsonZenButtonSize',
        'jsonZenLineHeight',
        'jsonZenCompactMode'
      ]);
      
      this.currentTheme = result[this.storageKey] || 'dark';
      this.fontScale = result.jsonZenFontScale || 1.0;
      this.fontFamily = result.jsonZenFontFamily || 'system';
      this.settings.autoFormat = result.jsonZenAutoFormat || false;
      this.settings.autoCopy = result.jsonZenAutoCopy || false;
      this.settings.indentSize = result.jsonZenIndentSize || 2;
      this.spacing.panelGap = result.jsonZenPanelGap || 8;
      this.spacing.buttonSize = result.jsonZenButtonSize || 'normal';
      this.spacing.lineHeight = result.jsonZenLineHeight || 1.5;
      this.spacing.compactMode = result.jsonZenCompactMode || false;
      
      this.applyTheme(this.currentTheme, false);
      this.applySpacing();
    } catch (e) {
      this.applyTheme('dark', false);
    }
  },

  // Apply font scale
  applyFontScale() {
    document.documentElement.style.setProperty('--font-scale', this.fontScale);
  },

  // Apply font family
  applyFontFamily() {
    const fonts = {
      'system': "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
      'fira': "'Fira Code', 'Fira Mono', monospace",
      'jetbrains': "'JetBrains Mono', 'Fira Code', monospace",
      'cascadia': "'Cascadia Code', 'Fira Code', monospace",
      'source': "'Source Code Pro', 'Fira Code', monospace",
      'consolas': "Consolas, 'Courier New', monospace",
      'courier': "'Courier New', Courier, monospace"
    };
    
    document.documentElement.style.setProperty('--font-mono', fonts[this.fontFamily] || fonts['system']);
  },

  // Apply spacing settings
  applySpacing() {
    document.documentElement.style.setProperty('--panel-gap', `${this.spacing.panelGap}px`);
    document.documentElement.style.setProperty('--editor-line-height', this.spacing.lineHeight);

    const buttonSizes = {
      compact: {
        smPadding: '2px 6px',
        smFontSize: '11px',
        smHeight: '20px',
        mdPadding: '4px 8px',
        mdFontSize: '12px',
        mdHeight: '24px',
        lgPadding: '6px 10px',
        lgFontSize: '13px',
        lgHeight: '30px',
        iconSize: '24px'
      },
      normal: {
        smPadding: '4px 6px',
        smFontSize: '12px',
        smHeight: '22px',
        mdPadding: '6px 10px',
        mdFontSize: '13px',
        mdHeight: '28px',
        lgPadding: '8px 12px',
        lgFontSize: '15px',
        lgHeight: '36px',
        iconSize: '28px'
      },
      large: {
        smPadding: '5px 8px',
        smFontSize: '13px',
        smHeight: '24px',
        mdPadding: '8px 12px',
        mdFontSize: '14px',
        mdHeight: '32px',
        lgPadding: '10px 16px',
        lgFontSize: '16px',
        lgHeight: '40px',
        iconSize: '32px'
      }
    };
    const size = buttonSizes[this.spacing.buttonSize] || buttonSizes.normal;
    document.documentElement.style.setProperty('--btn-sm-padding', size.smPadding);
    document.documentElement.style.setProperty('--btn-sm-font-size', size.smFontSize);
    document.documentElement.style.setProperty('--btn-sm-height', size.smHeight);
    document.documentElement.style.setProperty('--btn-md-padding', size.mdPadding);
    document.documentElement.style.setProperty('--btn-md-font-size', size.mdFontSize);
    document.documentElement.style.setProperty('--btn-md-height', size.mdHeight);
    document.documentElement.style.setProperty('--btn-lg-padding', size.lgPadding);
    document.documentElement.style.setProperty('--btn-lg-font-size', size.lgFontSize);
    document.documentElement.style.setProperty('--btn-lg-height', size.lgHeight);
    document.documentElement.style.setProperty('--icon-btn-size', size.iconSize);
    document.documentElement.setAttribute('data-compact-ui', this.spacing.compactMode ? 'true' : 'false');
  },

  // Save all settings
  async saveSettings() {
    try {
      await chrome.storage.sync.set({
        [this.storageKey]: this.currentTheme,
        jsonZenFontScale: this.fontScale,
        jsonZenFontFamily: this.fontFamily,
        jsonZenAutoFormat: this.settings.autoFormat,
        jsonZenAutoCopy: this.settings.autoCopy,
        jsonZenIndentSize: this.settings.indentSize,
        jsonZenPanelGap: this.spacing.panelGap,
        jsonZenButtonSize: this.spacing.buttonSize,
        jsonZenLineHeight: this.spacing.lineHeight,
        jsonZenCompactMode: this.spacing.compactMode
      });
      window.dispatchEvent(new CustomEvent('jsonzen:settingschange', {
        detail: {
          autoFormat: this.settings.autoFormat,
          autoCopy: this.settings.autoCopy,
          indentSize: this.settings.indentSize
        }
      }));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  // Setup settings panel
  setupSettingsPanel() {
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
      this.openSettingsModal();
    });

    // Theme selection (using event delegation for dynamically added elements)
    document.getElementById('themeGrid')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-option');
      if (btn) {
        const theme = btn.dataset.theme;
        this.applyTheme(theme);
        this.updateSettingsUI();
      }
    });

    // Font size slider
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');
    
    if (fontSizeSlider) {
      fontSizeSlider.value = this.fontScale * 100;
      fontSizeValue.textContent = `${Math.round(this.fontScale * 100)}%`;
      
      fontSizeSlider.addEventListener('input', (e) => {
        const scale = e.target.value / 100;
        this.fontScale = scale;
        this.applyFontScale();
        fontSizeValue.textContent = `${e.target.value}%`;
      });
    }

    // Font family select
    const fontFamilySelect = document.getElementById('fontFamilySelect');
    if (fontFamilySelect) {
      fontFamilySelect.value = this.fontFamily;
      fontFamilySelect.addEventListener('change', (e) => {
        this.fontFamily = e.target.value;
        this.applyFontFamily();
      });
    }

    // Auto format checkbox
    const autoFormatCheck = document.getElementById('autoFormatCheck');
    if (autoFormatCheck) {
      autoFormatCheck.checked = this.settings.autoFormat;
      autoFormatCheck.addEventListener('change', (e) => {
        this.settings.autoFormat = e.target.checked;
      });
    }

    // Auto copy checkbox
    const autoCopyCheck = document.getElementById('autoCopyCheck');
    if (autoCopyCheck) {
      autoCopyCheck.checked = this.settings.autoCopy;
      autoCopyCheck.addEventListener('change', (e) => {
        this.settings.autoCopy = e.target.checked;
      });
    }

    const indentSizeSelect = document.getElementById('indentSizeSelect');
    if (indentSizeSelect) {
      indentSizeSelect.value = String(this.settings.indentSize);
      indentSizeSelect.addEventListener('change', (e) => {
        this.settings.indentSize = e.target.value === 'tab' ? 'tab' : parseInt(e.target.value, 10);
      });
    }

    // Save popup size checkbox
    const savePopupSizeCheck = document.getElementById('savePopupSizeCheck');
    if (savePopupSizeCheck) {
      chrome.storage.local.get(['savePopupSize'], (result) => {
        savePopupSizeCheck.checked = result.savePopupSize !== false;
      });
      savePopupSizeCheck.addEventListener('change', (e) => {
        chrome.storage.local.set({ savePopupSize: e.target.checked });
      });
    }

    // Panel gap slider
    const panelGapSlider = document.getElementById('panelGapSlider');
    const panelGapValue = document.getElementById('panelGapValue');
    if (panelGapSlider) {
      panelGapSlider.value = this.spacing.panelGap;
      panelGapValue.textContent = `${this.spacing.panelGap}px`;
      panelGapSlider.addEventListener('input', (e) => {
        this.spacing.panelGap = parseInt(e.target.value);
        panelGapValue.textContent = `${e.target.value}px`;
        this.applySpacing();
      });
    }

    // Button size select
    const buttonSizeSelect = document.getElementById('buttonSizeSelect');
    const buttonSizeValue = document.getElementById('buttonSizeValue');
    if (buttonSizeSelect) {
      buttonSizeSelect.value = this.spacing.buttonSize;
      buttonSizeValue.textContent = this.capitalize(this.spacing.buttonSize);
      buttonSizeSelect.addEventListener('change', (e) => {
        this.spacing.buttonSize = e.target.value;
        buttonSizeValue.textContent = this.capitalize(e.target.value);
        this.applySpacing();
      });
    }

    // Line height slider
    const lineHeightSlider = document.getElementById('lineHeightSlider');
    const lineHeightValue = document.getElementById('lineHeightValue');
    if (lineHeightSlider) {
      lineHeightSlider.value = this.spacing.lineHeight;
      lineHeightValue.textContent = this.spacing.lineHeight;
      lineHeightSlider.addEventListener('input', (e) => {
        this.spacing.lineHeight = parseFloat(e.target.value);
        lineHeightValue.textContent = e.target.value;
        this.applySpacing();
      });
    }

    // Compact mode checkbox
    const compactModeCheck = document.getElementById('compactModeCheck');
    if (compactModeCheck) {
      compactModeCheck.checked = this.spacing.compactMode;
      compactModeCheck.addEventListener('change', (e) => {
        this.spacing.compactMode = e.target.checked;
        this.applySpacing();
      });
    }

    // Save button
    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
      this.saveSettings();
      ToastManager.success('Settings saved');
    });

    // Reset button
    document.getElementById('resetSettingsBtn')?.addEventListener('click', () => {
      this.fontScale = 1.0;
      this.fontFamily = 'system';
      this.settings.autoFormat = false;
      this.settings.autoCopy = false;
      this.settings.indentSize = 2;
      this.spacing.panelGap = 8;
      this.spacing.buttonSize = 'normal';
      this.spacing.lineHeight = 1.5;
      this.spacing.compactMode = false;
      this.applyTheme('dark');
      this.applyFontScale();
      this.applyFontFamily();
      this.applySpacing();
      this.updateSettingsUI();
      this.saveSettings();
      ToastManager.success('Settings reset to defaults');
    });
  },

  // Open settings modal
  openSettingsModal() {
    this.updateSettingsUI();
    window.dispatchEvent(new CustomEvent('jsonzen:open-tab', { detail: { tab: 'settings' } }));
  },

  // Close settings modal
  closeSettingsModal() {
    window.dispatchEvent(new CustomEvent('jsonzen:open-tab', { detail: { tab: 'json' } }));
  },

  // Update settings UI
  updateSettingsUI() {
    // Update active theme button
    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === this.currentTheme);
    });

    // Update font slider
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');
    if (fontSizeSlider) fontSizeSlider.value = this.fontScale * 100;
    if (fontSizeValue) fontSizeValue.textContent = `${Math.round(this.fontScale * 100)}%`;

    // Update font select
    const fontFamilySelect = document.getElementById('fontFamilySelect');
    if (fontFamilySelect) fontFamilySelect.value = this.fontFamily;

    const indentSizeSelect = document.getElementById('indentSizeSelect');
    if (indentSizeSelect) indentSizeSelect.value = String(this.settings.indentSize);

    // Update checkboxes
    const autoFormatCheck = document.getElementById('autoFormatCheck');
    const autoCopyCheck = document.getElementById('autoCopyCheck');
    if (autoFormatCheck) autoFormatCheck.checked = this.settings.autoFormat;
    if (autoCopyCheck) autoCopyCheck.checked = this.settings.autoCopy;

    const panelGapValue = document.getElementById('panelGapValue');
    const buttonSizeValue = document.getElementById('buttonSizeValue');
    const lineHeightValue = document.getElementById('lineHeightValue');
    const panelGapSlider = document.getElementById('panelGapSlider');
    const buttonSizeSelect = document.getElementById('buttonSizeSelect');
    const lineHeightSlider = document.getElementById('lineHeightSlider');
    const compactModeCheck = document.getElementById('compactModeCheck');
    const savePopupSizeCheck = document.getElementById('savePopupSizeCheck');

    if (panelGapSlider) panelGapSlider.value = this.spacing.panelGap;
    if (panelGapValue) panelGapValue.textContent = `${this.spacing.panelGap}px`;
    if (buttonSizeSelect) buttonSizeSelect.value = this.spacing.buttonSize;
    if (buttonSizeValue) buttonSizeValue.textContent = this.capitalize(this.spacing.buttonSize);
    if (lineHeightSlider) lineHeightSlider.value = this.spacing.lineHeight;
    if (lineHeightValue) lineHeightValue.textContent = this.spacing.lineHeight;
    if (compactModeCheck) compactModeCheck.checked = this.spacing.compactMode;
    if (savePopupSizeCheck) {
      chrome.storage.local.get(['savePopupSize'], (result) => {
        savePopupSizeCheck.checked = result.savePopupSize !== false;
      });
    }
  },

  // Load saved theme
  async loadTheme() {
    try {
      const result = await chrome.storage.sync.get([this.storageKey]);
      const savedTheme = result[this.storageKey] || 'dark';
      this.applyTheme(savedTheme, false);
    } catch (e) {
      this.applyTheme('dark', false);
    }
  },

  // Apply theme
  applyTheme(theme, save = true) {
    if (!this.themes.includes(theme)) {
      theme = 'dark';
    }

    this.currentTheme = theme;

    // Remove all theme classes
    document.documentElement.classList.remove(...this.themes);
    document.documentElement.removeAttribute('data-theme');

    // Handle system preference
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }

    // Update UI
    this.updateThemeButton();

    // Save if needed
    if (save) {
      this.saveTheme(theme);
    }

    // Emit event
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  },

  // Save theme to storage
  async saveTheme(theme) {
    try {
      await chrome.storage.sync.set({ [this.storageKey]: theme });
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  },

  // Cycle to next theme
  nextTheme() {
    const currentIndex = this.themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    this.applyTheme(this.themes[nextIndex]);
  },

  // Get theme icon
  getThemeIcon(theme) {
    const icons = {
      dark: '🌙',
      light: '☀️',
      ocean: '🌊',
      sunset: '🌅',
      cyberpunk: '⚡',
      synthwave: '🌴',
      aurora: '✨',
      nebula: '🌌',
      crystal: '💎',
      retro: '👾',
      system: '💻'
    };
    return icons[theme] || '🎨';
  },

  // Update theme button icon
  updateThemeButton() {
    const btn = document.getElementById('themeBtn');
    if (btn) {
      // Update tooltip
      btn.setAttribute('data-tooltip', `Theme: ${this.capitalize(this.currentTheme)}`);
      
      // You can also update an icon if you have one
      const iconSpan = btn.querySelector('.theme-icon');
      if (iconSpan) {
        iconSpan.textContent = this.getThemeIcon(this.currentTheme);
      }
    }
  },

  // Capitalize string
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Setup event listeners
  setupEventListeners() {
    document.getElementById('themeBtn')?.addEventListener('click', () => {
      this.nextTheme();
      ToastManager.success(`Theme changed to ${this.capitalize(this.currentTheme)}`);
    });
  },

  // Listen for system preference changes
  setupSystemPreferenceListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (this.currentTheme === 'system') {
        this.applyTheme('system', false);
      }
    });
  },

  // Get CSS variable value
  getCssVariable(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  },

  // Set CSS variable value
  setCssVariable(name, value) {
    document.documentElement.style.setProperty(name, value);
  }
};
