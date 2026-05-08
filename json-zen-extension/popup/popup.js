/**
 * JSON Zen - Main Popup Script (v2.0)
 * A++ 10/10 version with modular architecture and Postman integration
 */

const App = {
  initialized: false,

  // Settings
  settings: {
    indentSize: 2,
    autoCopy: false,
    autoFormat: false
  },

  // State
  input: null,
  output: null,
  status: null,
  activeTab: 'json',

  // Initialize app
  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.cacheElements();
    this.loadSettings();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.setupTabNavigation();
    this.setupResize();
    this.setupAdaptiveShell();
    this.setupContainerMode();
    
    // Initialize modules
    ToastManager.init();
    ThemeManager.init();
    HttpClient.init();
    DiffEngine.init();
    BulkProcessor.init();

  },

  // Detect container: side panel (default) vs popped-out workspace window.
  // bg.js opens the workspace with ?mode=window in the URL. In that case, hide
  // the pop-out button (already popped) and tag the body for any layout deltas.
  setupContainerMode() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') === 'window' ? 'window' : 'sidepanel';
    document.body.setAttribute('data-container-mode', mode);
    if (mode === 'window') {
      const popout = document.getElementById('popoutBtn');
      if (popout) popout.style.display = 'none';
    }
  },

  // Cache DOM elements
  cacheElements() {
    this.input = document.getElementById('input');
    this.output = document.getElementById('output');
    this.status = document.getElementById('status');
  },

  // Load settings from storage
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'indentSize',
        'autoCopy',
        'autoFormat',
        'jsonZenIndentSize',
        'jsonZenAutoCopy',
        'jsonZenAutoFormat'
      ]);

      this.settings = {
        indentSize: result.jsonZenIndentSize ?? result.indentSize ?? this.settings.indentSize,
        autoCopy: result.jsonZenAutoCopy ?? result.autoCopy ?? this.settings.autoCopy,
        autoFormat: result.jsonZenAutoFormat ?? result.autoFormat ?? this.settings.autoFormat
      };
    } catch (e) {
      this.settings = { ...this.settings };
    }
  },

  // Setup main event listeners
  setupEventListeners() {
    // Toolbar buttons
    document.getElementById('formatBtn')?.addEventListener('click', () => this.format());
    document.getElementById('minifyBtn')?.addEventListener('click', () => this.minify());
    document.getElementById('fixBtn')?.addEventListener('click', () => this.fix());
    document.getElementById('validateBtn')?.addEventListener('click', () => this.validate());
    document.getElementById('pasteBtn')?.addEventListener('click', () => this.paste());
    document.getElementById('clearBtn')?.addEventListener('click', () => this.clear());
    document.getElementById('copyBtn')?.addEventListener('click', () => this.copy());

    // Pop out from side panel into a workspace window
    document.getElementById('popoutBtn')?.addEventListener('click', () => {
      try {
        chrome.runtime.sendMessage({ type: 'jsonzen:popout' }).catch(() => {});
      } catch (e) { /* not in extension context */ }
    });

    // Keyboard-shortcut commands forwarded by the service worker (Ctrl+Shift+F/M/X/V).
    // Also accept ?cmd= on the URL for the workspace-window pop-out path.
    try {
      chrome.runtime.onMessage.addListener((msg) => {
        if (msg && msg.type === 'jsonzen:command' && msg.command) {
          this.runCommand(msg.command);
        }
      });
    } catch (e) { /* not in extension context */ }

    const urlCmd = new URLSearchParams(window.location.search).get('cmd');
    if (urlCmd) setTimeout(() => this.runCommand(urlCmd), 50);
  },

  runCommand(cmd) {
    const map = { format: 'format', minify: 'minify', fix: 'fix', validate: 'validate' };
    const fn = map[cmd];
    if (fn && typeof this[fn] === 'function') this[fn]();

    // Convert dropdown
    document.querySelectorAll('[data-convert]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.convert;
        this.convert(type);
      });
    });

    // Transform dropdown
    document.querySelectorAll('[data-transform]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.transform;
        this.transform(type);
      });
    });

    // Schema validation modal
    document.getElementById('schemaBtn')?.addEventListener('click', () => {
      this.openSchemaModal();
    });
    document.getElementById('closeSchemaModal')?.addEventListener('click', () => {
      this.closeSchemaModal();
    });
    document.getElementById('generateSchemaBtn')?.addEventListener('click', () => {
      this.generateSchemaFromJson();
    });
    document.getElementById('runSchemaValidation')?.addEventListener('click', () => {
      this.validateSchema();
    });
    document.getElementById('schemaModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.closeSchemaModal();
    });

    // Stats modal
    document.getElementById('statsBtn')?.addEventListener('click', () => {
      this.showStats();
    });
    document.getElementById('closeStatsModal')?.addEventListener('click', () => {
      this.closeStatsModal();
    });
    document.getElementById('statsModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.closeStatsModal();
    });

    // Input stats update
    this.input?.addEventListener('input', () => {
      this.updateInputStats();
    });

    this.input?.addEventListener('paste', () => {
      if (this.settings.autoFormat) {
        setTimeout(() => this.format(), 100);
      }
    });

    // Query bar
    document.getElementById('queryInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.executeQuery();
    });
    document.getElementById('queryExecute')?.addEventListener('click', () => this.executeQuery());
    document.getElementById('queryClose')?.addEventListener('click', () => this.hideQueryBar());

    // Dropdown toggles
    this.setupDropdowns();

    // History button
    document.getElementById('historyBtn')?.addEventListener('click', () => {
      this.selectTab('http');
      HttpClient.showHistory();
    });

    // Recent button
    document.getElementById('recentBtn')?.addEventListener('click', () => {
      this.selectTab('http');
      HttpClient.showHistory();
    });

    window.addEventListener('jsonzen:open-tab', (event) => {
      if (event.detail?.tab) {
        this.selectTab(event.detail.tab);
      }
    });

    window.addEventListener('jsonzen:settingschange', (event) => {
      const detail = event.detail || {};
      this.settings = {
        ...this.settings,
        indentSize: detail.indentSize ?? this.settings.indentSize,
        autoCopy: detail.autoCopy ?? this.settings.autoCopy,
        autoFormat: detail.autoFormat ?? this.settings.autoFormat
      };
    });

    // Context-rail [data-action] delegation — fires the same handlers
    // as the main toolbar buttons, so the right-rail Quick Tools and
    // the floating bottom command bar both reuse existing wiring.
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-action]');
      if (!trigger) return;
      const action = trigger.dataset.action;
      const targetId = {
        format: 'formatBtn',
        minify: 'minifyBtn',
        fix: 'fixBtn',
        validate: 'validateBtn',
        schema: 'schemaBtn',
        stats: 'statsBtn',
        copy: 'copyBtn',
        paste: 'pasteBtn',
        clear: 'clearBtn'
      }[action];
      if (targetId) {
        e.preventDefault();
        document.getElementById(targetId)?.click();
        return;
      }
      if (action === 'goto-diff') {
        e.preventDefault();
        this.selectTab('diff');
      } else if (action === 'help') {
        e.preventDefault();
        ToastManager.show('Cmd+Shift+F format · Cmd+Shift+M minify · Cmd+Shift+V validate', 'info');
      }
    });

    // Context-rail open/close toggle (header button, narrow widths only).
    document.getElementById('contextRailToggle')?.addEventListener('click', () => {
      document.body.classList.toggle('context-rail-open');
    });
  },

  // Setup dropdowns
  setupDropdowns() {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
      const toggle = dropdown.querySelector('.dropdown-toggle');
      if (toggle) {
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          // Close others
          document.querySelectorAll('.dropdown.open').forEach(d => {
            if (d !== dropdown) d.classList.remove('open');
          });
          dropdown.classList.toggle('open');
        });
      }
    });

    // Close on outside click
    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    });
  },

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const cmd = e.metaKey || e.ctrlKey;
      
      if (cmd && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'f':
            e.preventDefault();
            this.format();
            break;
          case 'm':
            e.preventDefault();
            this.minify();
            break;
          case 'x':
            e.preventDefault();
            this.fix();
            break;
          case 'v':
            e.preventDefault();
            this.validate();
            break;
          case 'c':
            e.preventDefault();
            this.copy();
            break;
        }
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        this.closeSchemaModal();
        this.closeStatsModal();
      }
    });
  },

  // Setup tab navigation
  setupTabNavigation() {
    const tabs = document.querySelectorAll('#mainTabs .tab-item');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.selectTab(tab.dataset.tab);
      });
    });

    this.selectTab(this.activeTab);
  },

  selectTab(tabId = 'json') {
    this.activeTab = tabId;
    document.documentElement.setAttribute('data-active-tab', tabId);

    document.querySelectorAll('#mainTabs .tab-item').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    document.querySelectorAll('.tab-content').forEach((content) => {
      const isActive = content.id === `tab-${tabId}`;
      content.classList.toggle('hidden', !isActive);
      content.style.display = isActive ? 'flex' : 'none';
    });

    this.syncShellDensity();
  },

  // Format JSON
  format() {
    const input = this.input.value.trim();
    if (!input) {
      ToastManager.show('Please paste some JSON first', 'warning');
      return;
    }

    const indent = this.settings.indentSize === 'tab' ? '\t' : parseInt(this.settings.indentSize) || 2;
    const result = JSONUtils.format(input, indent);

    if (result.success) {
      this.output.textContent = result.result;
      this.updateOutputStats(result.result.length);
      this.setStatus('Formatted', 'ready');
      ToastManager.success('JSON formatted');
      
      if (this.settings.autoCopy) {
        this.copy();
      }
    } else {
      this.setStatus('Invalid JSON', 'error');
      ToastManager.error(result.error);
      this.shakeElement(this.input);
    }
  },

  // Minify JSON
  minify() {
    const input = this.input.value.trim();
    if (!input) {
      ToastManager.show('Please paste some JSON first', 'warning');
      return;
    }

    const result = JSONUtils.minify(input);

    if (result.success) {
      this.output.textContent = result.result;
      this.updateOutputStats(result.result.length);
      this.setStatus('Minified', 'ready');
      ToastManager.success('JSON minified');
    } else {
      this.setStatus('Invalid JSON', 'error');
      ToastManager.error(result.error);
    }
  },

  // Fix JSON
  fix() {
    const input = this.input.value.trim();
    if (!input) {
      ToastManager.show('Please paste some JSON first', 'warning');
      return;
    }

    const result = JSONUtils.fix(input);

    if (result.success) {
      this.input.value = result.result;
      this.output.textContent = result.result;
      this.updateInputStats();
      this.updateOutputStats(result.result.length);
      this.setStatus('Fixed', 'ready');
      
      const changes = result.changes?.join(', ') || 'No changes needed';
      ToastManager.success(`Fixed: ${changes}`);
    } else {
      this.setStatus('Could not fix', 'error');
      ToastManager.error(result.error || 'Unable to fix JSON');
    }
  },

  // Validate JSON
  validate() {
    const input = this.input.value.trim();
    if (!input) {
      ToastManager.show('Please paste some JSON first', 'warning');
      return;
    }

    const result = JSONUtils.validate(input);

    if (result.valid) {
      this.setStatus('Valid JSON', 'ready');
      ToastManager.success('Valid JSON!');
    } else {
      this.setStatus('Invalid JSON', 'error');
      ToastManager.error(result.error);
      
      // Highlight error position
      if (result.errorPosition !== null) {
        this.input.focus();
        this.input.setSelectionRange(result.errorPosition, result.errorPosition + 1);
      }
    }
  },

  // Convert JSON to other formats
  convert(type) {
    const input = this.input.value.trim();
    if (!input) {
      ToastManager.show('Please paste some JSON first', 'warning');
      return;
    }

    let result;
    
    try {
      switch (type) {
        case 'yaml':
          result = JSONUtils.toYAML(input);
          break;
        case 'xml':
          result = JSONUtils.toXML(input);
          break;
        case 'csv':
          result = JSONUtils.toCSV(input);
          break;
        case 'toml':
          result = JSONUtils.toTOML(input);
          break;
        case 'base64':
          result = JSONUtils.toBase64(input);
          break;
        case 'decode-base64':
          result = JSONUtils.fromBase64(input);
          break;
        case 'url':
          result = encodeURIComponent(input);
          break;
        case 'escape':
          result = JSONUtils.escape(input);
          break;
        case 'from-yaml':
          result = JSONUtils.fromYAML(input);
          break;
        default:
          throw new Error('Unknown conversion type');
      }

      const normalized = this.normalizeOperationResult(result);

      if (normalized.success) {
        this.output.textContent = normalized.text;
        this.updateOutputStats(normalized.text.length);
        this.setStatus(`Converted to ${type.toUpperCase()}`, 'ready');
        ToastManager.success(`Converted to ${type.toUpperCase()}`);
      } else {
        throw new Error(normalized.error);
      }
    } catch (e) {
      ToastManager.error('Conversion failed: ' + e.message);
    }
  },

  // Transform JSON
  transform(type) {
    const input = this.input.value.trim();
    if (!input) {
      ToastManager.show('Please paste some JSON first', 'warning');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      let result;

      switch (type) {
        case 'sort':
          result = JSONUtils.sortKeys(parsed);
          break;
        case 'remove-nulls':
          result = JSONUtils.removeNulls(parsed);
          break;
        case 'redact-pii':
          result = JSONUtils.redactPII(parsed);
          break;
        case 'flatten':
          result = JSONUtils.flatten(parsed);
          break;
        default:
          throw new Error('Unknown transform type');
      }

      const normalized = this.normalizeOperationResult(result);
      if (!normalized.success) {
        throw new Error(normalized.error);
      }

      this.output.textContent = normalized.text;
      this.updateOutputStats(normalized.text.length);
      this.setStatus('Transformed', 'ready');
      ToastManager.success(`Applied: ${type}`);
    } catch (e) {
      ToastManager.error('Transform failed: ' + e.message);
    }
  },

  // Paste from clipboard
  async paste() {
    try {
      const text = await navigator.clipboard.readText();
      this.input.value = text;
      this.updateInputStats();
      ToastManager.success('Pasted from clipboard');
      
      if (this.settings.autoFormat) {
        setTimeout(() => this.format(), 100);
      }
    } catch (e) {
      ToastManager.error('Failed to read clipboard');
    }
  },

  // Clear input/output
  clear() {
    this.input.value = '';
    this.output.textContent = '';
    this.updateInputStats();
    this.updateOutputStats(0);
    this.setStatus('Ready', 'ready');
    ToastManager.show('Cleared', 'info');
  },

  // Copy output
  async copy() {
    const text = this.output.textContent;
    if (!text) {
      ToastManager.show('Nothing to copy', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      ToastManager.success('Copied to clipboard');
    } catch (e) {
      ToastManager.error('Failed to copy');
    }
  },

  // Show stats
  showStats() {
    const input = this.input.value.trim();
    if (!input) {
      ToastManager.show('Please paste some JSON first', 'warning');
      return;
    }

    try {
      const stats = JSONUtils.analyze(input);
      
      const grid = document.getElementById('statsGrid');
      grid.innerHTML = Object.entries(stats).map(([key, value]) => `
        <div class="stat-card">
          <div class="stat-value">${Number(value).toLocaleString()}</div>
          <div class="stat-label">${key.replace(/([A-Z])/g, ' $1').toUpperCase()}</div>
        </div>
      `).join('');

      document.getElementById('statsModal').classList.add('open');
    } catch (e) {
      ToastManager.error('Cannot analyze: ' + e.message);
    }
  },

  // Close stats modal
  closeStatsModal() {
    document.getElementById('statsModal').classList.remove('open');
  },

  // Open schema modal
  openSchemaModal() {
    document.getElementById('schemaJsonInput').value = this.input.value;
    document.getElementById('schemaModal').classList.add('open');
  },

  // Close schema modal
  closeSchemaModal() {
    document.getElementById('schemaModal').classList.remove('open');
  },

  // Generate schema from JSON
  generateSchemaFromJson() {
    const json = document.getElementById('schemaJsonInput').value;
    if (!json) {
      ToastManager.show('Please enter JSON data first', 'warning');
      return;
    }

    try {
      const generated = JSONUtils.generateSchema(json);
      if (!generated.success) {
        throw new Error(generated.error);
      }
      document.getElementById('schemaInput').value = generated.result;
      ToastManager.success('Schema generated');
    } catch (e) {
      ToastManager.error('Invalid JSON: ' + e.message);
    }
  },

  // Validate against schema
  validateSchema() {
    const json = document.getElementById('schemaJsonInput').value;
    const schema = document.getElementById('schemaInput').value;

    if (!json || !schema) {
      ToastManager.show('Please provide both JSON and schema', 'warning');
      return;
    }

    try {
      const result = JSONUtils.validateAgainstSchema(json, schema);
      if (result.valid) {
        ToastManager.success('JSON is valid against schema');
      } else {
        const message = result.errors
          .map((error) => `${error.path || 'root'}: ${error.message}`)
          .join(' | ');
        ToastManager.error('Validation failed: ' + message);
      }
    } catch (e) {
      ToastManager.error('Validation error: ' + e.message);
    }
  },

  // Execute JSON query
  executeQuery() {
    const input = this.input.value.trim();
    const query = document.getElementById('queryInput').value.trim();
    
    if (!input || !query) return;

    try {
      const result = JSONUtils.queryPath(input, query);
      const outputText = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
      
      this.output.textContent = outputText;
      this.updateOutputStats(outputText.length);
      ToastManager.success('Query executed');
    } catch (e) {
      ToastManager.error('Query failed: ' + e.message);
    }
  },

  // Show/hide query bar
  hideQueryBar() {
    document.getElementById('queryBar').style.display = 'none';
  },

  normalizeOperationResult(result) {
    if (result && typeof result === 'object' && 'success' in result) {
      return {
        success: !!result.success,
        text: typeof result.result === 'string'
          ? result.result
          : JSON.stringify(result.result, null, 2),
        error: result.error || 'Unknown error'
      };
    }

    return {
      success: true,
      text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
      error: null
    };
  },

  // Set status
  setStatus(message, type = 'ready') {
    if (this.status) {
      this.status.textContent = message;
      this.status.className = `status-pill ${type}`;
    }
  },

  // Update input stats
  updateInputStats() {
    const count = document.getElementById('inputStats');
    if (count) {
      const length = this.input.value.length;
      count.textContent = `${length.toLocaleString()} chars`;
    }
  },

  // Update output stats
  updateOutputStats(length) {
    const count = document.getElementById('outputStats');
    if (count) {
      count.textContent = `${length.toLocaleString()} chars`;
    }
  },

  // Shake animation for error
  shakeElement(element) {
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 500);
  },

  // Setup drag-to-resize functionality (legacy popup-only).
  // Side panel + workspace window own their own resize now, so the only thing
  // we still need from here is the adaptive density observer (handled separately).
  setupResize() {
    return;
  },

  setupResize_legacy_unused() {
    const resizeHandles = Array.from(document.querySelectorAll('[data-resize-axis]'));
    const app = document.getElementById('app');

    if (!resizeHandles.length || !app) {
      return;
    }

    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let resizeAxis = 'xy';
    const getPoint = (event) => {
      if (event.touches?.length) {
        return event.touches[0];
      }

      if (event.changedTouches?.length) {
        return event.changedTouches[0];
      }

      return event;
    };

    const handleResizeMove = (event) => {
      if (!isResizing) return;

      const point = getPoint(event);
      const nextWidth = resizeAxis.includes('x') ? startWidth + (point.clientX - startX) : startWidth;
      const nextHeight = resizeAxis.includes('y') ? startHeight + (point.clientY - startY) : startHeight;
      this.applyPopupSize(nextWidth, nextHeight);

      if (event.cancelable) {
        event.preventDefault();
      }
    };

    const beginResize = (event) => {
      const point = getPoint(event);
      const handle = event.currentTarget;
      isResizing = true;
      resizeAxis = handle.dataset.resizeAxis || 'xy';
      startX = point.clientX;
      startY = point.clientY;
      startWidth = app.offsetWidth;
      startHeight = app.offsetHeight;

      resizeHandles.forEach((item) => item.classList.toggle('active', item === handle));
      document.body.style.userSelect = 'none';
      document.body.style.cursor =
        resizeAxis === 'x' ? 'ew-resize' :
        resizeAxis === 'y' ? 'ns-resize' :
        'nwse-resize';

      if (event.cancelable) {
        event.preventDefault();
      }
    };

    this.loadSavedSize();

    const endResize = () => {
      if (!isResizing) return;

      isResizing = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      resizeHandles.forEach((item) => item.classList.remove('active'));
      this.saveSize();
    };

    resizeHandles.forEach((handle) => {
      handle.addEventListener('mousedown', beginResize);
      handle.addEventListener('touchstart', beginResize, { passive: false });
    });
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('touchmove', handleResizeMove, { passive: false });
    document.addEventListener('mouseup', endResize);
    document.addEventListener('touchend', endResize);
    document.addEventListener('touchcancel', endResize);
    window.addEventListener('blur', endResize);
  },

  applyPopupSize(width, height) {
    const boundedWidth = Math.max(560, Math.min(1200, Math.round(width)));
    const boundedHeight = Math.max(420, Math.min(900, Math.round(height)));
    this.syncPopupFrame(boundedWidth, boundedHeight);
    this.syncShellDensity(boundedWidth, boundedHeight);
    window.scrollTo(0, 0);
  },

  syncPopupFrame(width, height) {
    const html = document.documentElement;
    const body = document.body;
    const app = document.getElementById('app');
    const widthPx = `${width}px`;
    const heightPx = `${height}px`;

    html.style.setProperty('--popup-width', widthPx);
    html.style.setProperty('--popup-height', heightPx);
    html.style.width = widthPx;
    html.style.height = heightPx;

    if (body) {
      body.style.width = widthPx;
      body.style.height = heightPx;
    }

    if (app) {
      app.style.width = widthPx;
      app.style.height = heightPx;
    }
  },

  setupAdaptiveShell() {
    this.syncShellDensity();

    if (typeof ResizeObserver === 'function') {
      const app = document.getElementById('app');
      if (!app) return;

      this.shellResizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        this.syncShellDensity(entry.contentRect.width, entry.contentRect.height);
      });
      this.shellResizeObserver.observe(app);
      return;
    }

    window.addEventListener('resize', () => this.syncShellDensity());
  },

  syncShellDensity(width, height) {
    const app = document.getElementById('app');
    const shellWidth = Math.round(width ?? app?.offsetWidth ?? window.innerWidth ?? 900);
    const shellHeight = Math.round(height ?? app?.offsetHeight ?? window.innerHeight ?? 600);
    const html = document.documentElement;
    const density = shellWidth < 860 || shellHeight < 560 ? 'compact' : 'comfortable';

    html.setAttribute('data-shell-density', density);
    html.setAttribute('data-shell-width', shellWidth < 720 ? 'narrow' : 'wide');
    html.setAttribute('data-shell-height', shellHeight < 520 ? 'short' : 'tall');
  },

  // Load saved size from storage
  async loadSavedSize() {
    try {
      const result = await chrome.storage.local.get(['popupSize', 'savePopupSize']);
      const saveEnabled = result.savePopupSize !== false; // Default to true
      
      if (saveEnabled && result.popupSize) {
        const { width, height } = result.popupSize;

        if (width && height) {
          this.applyPopupSize(width, height);
        }
      }
    } catch (e) {}
  },

  // Save current size to storage
  async saveSize() {
    try {
      const result = await chrome.storage.local.get(['savePopupSize']);
      const saveEnabled = result.savePopupSize !== false; // Default to true
      
      if (saveEnabled) {
        const app = document.getElementById('app');
        await chrome.storage.local.set({
          popupSize: {
            width: app.offsetWidth,
            height: app.offsetHeight
          }
        });
      }
    } catch (e) {}
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.JsonZenApp = App;
  App.init();
});
