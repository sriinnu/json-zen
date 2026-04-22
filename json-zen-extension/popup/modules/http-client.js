/**
 * JSON Zen - HTTP Client Module (Postman-like functionality)
 * Makes HTTP requests directly from the browser extension
 */

const HttpClient = {
  initialized: false,
  // Request history
  history: [],
  maxHistory: 50,

  // Current request state
  currentRequest: null,

  // CSRF token state
  csrfToken: null,
  autoCsrf: false,
  autoAuth: false,

  // Saved tokens
  savedTokens: {},

  // Initialize HTTP client
  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.loadHistory();
    this.loadSavedTokens();
    this.loadCsrfSettings();
    this.setupEventListeners();
    this.addDefaultHeaders();
  },

  // Load request history from storage
  async loadHistory() {
    try {
      const result = await chrome.storage.local.get(['httpHistory']);
      this.history = result.httpHistory || [];
    } catch (e) {
      this.history = [];
    }
  },

  // Load saved tokens
  async loadSavedTokens() {
    try {
      const result = await chrome.storage.local.get(['httpAuthTokens']);
      this.savedTokens = result.httpAuthTokens || {};
      this.renderSavedTokens();
    } catch (e) {
      this.savedTokens = {};
    }
  },

  // Save tokens
  async saveTokens() {
    try {
      await chrome.storage.local.set({ httpAuthTokens: this.savedTokens });
    } catch (e) {
      console.error('Failed to save tokens:', e);
    }
  },

  // Load CSRF settings
  async loadCsrfSettings() {
    try {
      const result = await chrome.storage.local.get(['autoCsrf', 'autoAuth', 'customCsrfToken']);
      this.autoCsrf = result.autoCsrf || false;
      this.autoAuth = result.autoAuth || false;
      this.csrfToken = result.customCsrfToken || null;
      
      const autoAuthCheck = document.getElementById('autoAuthCheck');
      const autoCsrfCheck = document.getElementById('autoCsrfCheck');
      const customCsrfInput = document.getElementById('customCsrfToken');
      
      if (autoAuthCheck) autoAuthCheck.checked = this.autoAuth;
      if (autoCsrfCheck) autoCsrfCheck.checked = this.autoCsrf;
      if (customCsrfInput) customCsrfInput.value = this.csrfToken || '';
    } catch (e) {
      console.error('Failed to load CSRF settings:', e);
    }
  },

  // Save CSRF settings
  async saveCsrfSettings() {
    try {
      await chrome.storage.local.set({
        autoAuth: this.autoAuth,
        autoCsrf: this.autoCsrf,
        customCsrfToken: this.csrfToken
      });
    } catch (e) {
      console.error('Failed to save CSRF settings:', e);
    }
  },

  // Render saved tokens list
  renderSavedTokens() {
    const container = document.getElementById('savedTokensList');
    if (!container) return;
    
    const tokens = Object.entries(this.savedTokens);
    if (tokens.length === 0) {
      container.innerHTML = '<div style="font-size:11px;color:var(--text-muted);">No saved tokens</div>';
      return;
    }
    
    container.innerHTML = tokens.map(([domain, token]) => `
      <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--glass-bg);border-radius:4px;border:1px solid var(--glass-border);">
        <span style="flex:1;font-size:11px;font-family:var(--font-mono);overflow:hidden;text-overflow:ellipsis;">${domain}</span>
        <span style="font-size:10px;color:var(--text-muted);">${token.substring(0, 8)}...</span>
        <button class="icon-btn btn-sm delete-token-btn" data-domain="${domain}" title="Delete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `).join('');
    
    // Add delete handlers
    container.querySelectorAll('.delete-token-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const domain = btn.dataset.domain;
        delete this.savedTokens[domain];
        this.saveTokens();
        this.renderSavedTokens();
        ToastManager.success('Token deleted');
      });
    });
  },

  // Display detected auth tokens in UI
  displayDetectedAuth(detectedAuth, hostname) {
    const panel = document.getElementById('detectedAuthPanel');
    if (!panel) return;

    const sections = [];
    const addTokenSection = (label, token, buttonClass, tone = 'var(--brand-primary)') => {
      if (!token) return;
      sections.push(`
        <div style="margin-bottom:8px;">
          <div style="font-size:11px;font-weight:600;color:${tone};margin-bottom:4px;">${label}</div>
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:var(--glass-bg);border-radius:4px;">
            <span style="flex:1;font-size:10px;font-family:var(--font-mono);overflow:hidden;text-overflow:ellipsis;">${this.escapeHtml(token)}</span>
            <button class="icon-btn btn-sm ${buttonClass}" data-value="${this.escapeHtml(token)}" title="Use this value">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 13l4 4L19 7"/>
              </svg>
            </button>
          </div>
        </div>
      `);
    };

    const addEntrySection = (label, entries, buttonClass) => {
      if (!entries || entries.length === 0) return;
      sections.push(`
        <div style="margin-bottom:8px;">
          <div style="font-size:11px;font-weight:600;color:var(--brand-primary);margin-bottom:4px;">${label} (${entries.length})</div>
          ${entries.map((entry) => `
            <div style="display:flex;align-items:center;gap:8px;padding:6px;background:var(--glass-bg);border-radius:4px;margin-bottom:4px;">
              <span style="flex:1;font-size:10px;font-family:var(--font-mono);overflow:hidden;text-overflow:ellipsis;">${this.escapeHtml(entry.key || entry.name)}</span>
              <span style="font-size:9px;color:var(--text-muted);max-width:100px;overflow:hidden;text-overflow:ellipsis;">${this.escapeHtml(String(entry.value).substring(0, 20))}${String(entry.value).length > 20 ? '...' : ''}</span>
              <button class="icon-btn btn-sm ${buttonClass}" data-key="${this.escapeHtml(entry.key || entry.name)}" data-value="${this.escapeHtml(String(entry.value))}" title="Use this value">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
              </button>
            </div>
          `).join('')}
        </div>
      `);
    };

    addTokenSection('🔒 CSRF Token', detectedAuth.csrfToken, 'use-csrf-btn');
    addTokenSection('🎫 Authorization Token', detectedAuth.sessionToken || detectedAuth.storageToken || detectedAuth.token, 'use-auth-btn');
    addEntrySection('🍪 Cookies', detectedAuth.cookies, 'inspect-cookie-btn');
    addEntrySection('💾 Local Storage', detectedAuth.localStorageEntries, 'use-storage-entry-btn');
    addEntrySection('🧠 Session Storage', detectedAuth.sessionStorageEntries, 'use-storage-entry-btn');
    addEntrySection('🏷 Meta / DOM Tokens', detectedAuth.metaTokens, 'use-storage-entry-btn');

    const contextNote = detectedAuth.pageContext?.matched
      ? `Active tab matched ${this.escapeHtml(detectedAuth.pageContext.hostname)}`
      : detectedAuth.pageContext?.reason || 'Open a matching page in the active tab to load local/session storage auth.';

    panel.innerHTML = `
      <div style="font-size:11px;color:var(--text-secondary);margin-bottom:8px;">Detected for: ${this.escapeHtml(hostname)}</div>
      <div style="font-size:10px;color:var(--text-muted);margin-bottom:10px;padding:8px;background:var(--glass-bg);border-radius:4px;">${this.escapeHtml(contextNote)}</div>
      ${sections.length > 0 ? sections.join('') : '<div style="font-size:11px;color:var(--text-muted);padding:8px;background:var(--glass-bg);border-radius:4px;">No reusable authentication material detected</div>'}
    `;

    panel.querySelectorAll('.use-csrf-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.csrfToken = btn.dataset.value;
        document.getElementById('customCsrfToken').value = btn.dataset.value;
        this.autoCsrf = true;
        const autoCsrfCheck = document.getElementById('autoCsrfCheck');
        if (autoCsrfCheck) autoCsrfCheck.checked = true;
        this.saveCsrfSettings();
        ToastManager.success('CSRF token applied');
      });
    });

    panel.querySelectorAll('.use-auth-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.addOrReplaceHeader('Authorization', `Bearer ${btn.dataset.value}`);
        ToastManager.success('Authorization header applied');
      });
    });

    panel.querySelectorAll('.use-storage-entry-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const token = btn.dataset.value;
        const key = (btn.dataset.key || '').toLowerCase();
        if (key.includes('csrf') || key.includes('xsrf')) {
          this.csrfToken = token;
          document.getElementById('customCsrfToken').value = token;
          this.autoCsrf = true;
          const autoCsrfCheck = document.getElementById('autoCsrfCheck');
          if (autoCsrfCheck) autoCsrfCheck.checked = true;
          this.saveCsrfSettings();
          ToastManager.success('CSRF token applied');
          return;
        }

        this.addOrReplaceHeader('Authorization', `Bearer ${token}`);
        ToastManager.success('Authorization header applied');
      });
    });

    panel.querySelectorAll('.inspect-cookie-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        ToastManager.info('Cookies are attached through browser credentials, not a manual Cookie header.');
      });
    });
  },

  // Save request history
  async saveHistory() {
    try {
      await chrome.storage.local.set({ 
        httpHistory: this.history.slice(0, this.maxHistory) 
      });
    } catch (e) {
      console.error('Failed to save HTTP history:', e);
    }
  },

  // Add default headers row
  addDefaultHeaders() {
    const headersEditor = document.getElementById('httpHeadersEditor');
    if (headersEditor && headersEditor.children.length === 0) {
      this.addHeaderRow('Content-Type', 'application/json');
      this.addHeaderRow('Accept', 'application/json');
    }
  },

  // Add a header row
  addHeaderRow(key = '', value = '') {
    const container = document.getElementById('httpHeadersEditor');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'http-header-row';
    row.innerHTML = `
      <input type="text" class="json-input http-header-key" placeholder="Header" value="${this.escapeHtml(key)}">
      <input type="text" class="json-input http-header-value" placeholder="Value" value="${this.escapeHtml(value)}">
      <button class="icon-btn btn-sm remove-header-btn" title="Remove">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    `;
    
    row.querySelector('.remove-header-btn').addEventListener('click', () => {
      row.remove();
    });

    container.appendChild(row);
  },

  // Add a param row
  addParamRow(key = '', value = '') {
    const container = document.getElementById('httpParamsEditor');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'http-header-row';
    row.innerHTML = `
      <input type="text" class="json-input http-header-key" placeholder="Parameter" value="${this.escapeHtml(key)}">
      <input type="text" class="json-input http-header-value" placeholder="Value" value="${this.escapeHtml(value)}">
      <button class="icon-btn btn-sm remove-param-btn" title="Remove">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    `;
    
    row.querySelector('.remove-param-btn').addEventListener('click', () => {
      row.remove();
    });

    container.appendChild(row);
  },

  // Get headers from editor
  getHeaders() {
    const headers = {};
    const rows = document.querySelectorAll('#httpHeadersEditor .http-header-row');
    
    rows.forEach(row => {
      const key = row.querySelector('.http-header-key').value.trim();
      const value = row.querySelector('.http-header-value').value.trim();
      if (key && value) {
        headers[key] = value;
      }
    });

    // Add auth headers if configured
    const authHeaders = this.getAuthHeaders();
    Object.assign(headers, authHeaders);

    return headers;
  },

  // Get URL with params
  getFullUrl() {
    let url = document.getElementById('httpUrl').value.trim();
    if (!url) return '';

    // Add protocol if missing
    if (!url.match(/^https?:\/\//)) {
      url = 'https://' + url;
    }

    const params = [];
    const rows = document.querySelectorAll('#httpParamsEditor .http-header-row');
    
    rows.forEach(row => {
      const key = row.querySelector('.http-header-key').value.trim();
      const value = row.querySelector('.http-header-value').value.trim();
      if (key) {
        params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    });

    if (params.length > 0) {
      const separator = url.includes('?') ? '&' : '?';
      url += separator + params.join('&');
    }

    return url;
  },

  // Get auth headers based on auth type
  getAuthHeaders() {
    const authType = document.getElementById('authType')?.value || 'none';
    const headers = {};

    switch (authType) {
      case 'bearer':
        const token = document.getElementById('bearerToken')?.value.trim();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        break;
      
      case 'basic':
        const username = document.getElementById('basicUsername')?.value.trim();
        const password = document.getElementById('basicPassword')?.value.trim();
        if (username) {
          const encoded = btoa(`${username}:${password}`);
          headers['Authorization'] = `Basic ${encoded}`;
        }
        break;
      
      case 'apikey':
        const apiKey = document.getElementById('apiKey')?.value.trim();
        const apiKeyHeader = document.getElementById('apiKeyHeader')?.value.trim() || 'X-API-Key';
        if (apiKey) {
          headers[apiKeyHeader] = apiKey;
        }
        break;
    }

    return headers;
  },

  // Get request body
  getBody() {
    const method = document.getElementById('httpMethod').value;
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return null;
    }

    const bodyType = document.querySelector('input[name="bodyType"]:checked')?.value || 'json';
    const bodyText = document.getElementById('httpBody')?.value.trim();

    if (!bodyText) return null;

    if (bodyType === 'json') {
      // Validate JSON
      try {
        JSON.parse(bodyText);
        return bodyText;
      } catch (e) {
        throw new Error('Invalid JSON in request body: ' + e.message);
      }
    }

    return bodyText;
  },

  // Packet Trace Timeline
  packetTrace: [],
  
  // Start a new packet trace entry
  startPacketTrace(url, method) {
    this.packetTrace = [];
    this.addTraceStep('request_start', `Starting ${method} request to ${url}`);
  },
  
  // Add a trace step
  addTraceStep(phase, message, data = null) {
    const entry = {
      timestamp: performance.now(),
      phase,
      message,
      data
    };
    this.packetTrace.push(entry);
    this.updateTraceUI();
  },
  
  // Update packet trace UI
  updateTraceUI() {
    const tracePanel = document.getElementById('packetTracePanel');
    if (!tracePanel) return;
    
    if (this.packetTrace.length === 0) {
      tracePanel.innerHTML = '<div style="color:var(--text-muted);padding:16px;text-align:center;">Send a request to see the packet trace timeline</div>';
      return;
    }
    
    const format = (ms) => ms.toFixed(1) + 'ms';
    const firstTime = this.packetTrace[0]?.timestamp || 0;
    const totalTime = this.packetTrace[this.packetTrace.length - 1]?.timestamp - firstTime || 0;
    
    // Waterfall header
    let html = `
      <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--glass-bg);border-radius:4px;margin-bottom:8px;">
        <span style="font-size:11px;color:var(--text-muted);">Total Time:</span>
        <span style="font-family:monospace;font-size:12px;font-weight:600;color:var(--brand-primary);">${format(totalTime)}</span>
        <span style="font-size:11px;color:var(--text-muted);margin-left:auto;">Steps: ${this.packetTrace.length}</span>
      </div>
      <div style="position:relative;padding-left:80px;margin-bottom:12px;">
        <div style="position:absolute;left:0;top:0;bottom:0;width:1px;background:var(--glass-border);"></div>
        <div style="position:absolute;left:0;top:0;bottom:0;width:1px;background:linear-gradient(180deg,var(--brand-primary),var(--brand-secondary));opacity:0.5;"></div>
    `;
    
    // Trace steps with waterfall visualization
    html += this.packetTrace.map((step, i) => {
      const elapsed = step.timestamp - firstTime;
      const elapsedStr = format(elapsed);
      const icon = this.getPhaseIcon(step.phase);
      const color = this.getPhaseColor(step.phase);
      const progress = totalTime > 0 ? (elapsed / totalTime) * 100 : 0;
      
      let dataHtml = '';
      if (step.data) {
        if (typeof step.data === 'object') {
          dataHtml = `<pre style="margin:4px 0 0;font-size:10px;opacity:0.7;background:rgba(0,0,0,0.2);padding:4px;border-radius:4px;max-height:100px;overflow:auto;">${JSON.stringify(step.data, null, 2)}</pre>`;
        } else {
          dataHtml = `<div style="margin:4px 0 0;font-size:10px;opacity:0.7;">${step.data}</div>`;
        }
      }
      
      return `
        <div style="position:relative;padding:8px 0;">
          <div style="position:absolute;left:-80px;top:8px;font-family:monospace;font-size:11px;color:var(--text-muted);">${elapsedStr}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;box-shadow:0 0 8px ${color};"></div>
            <div style="flex:1;">
              <div style="font-size:12px;font-weight:500;color:${color};">${icon} ${step.message}</div>
              ${dataHtml}
            </div>
          </div>
          <div style="position:absolute;left:-80px;top:50%;width:80px;height:2px;background:linear-gradient(90deg,${color},transparent);opacity:0.3;"></div>
        </div>
      `;
    }).join('');
    
    html += '</div>';
    
    // Summary section
    const authSteps = this.packetTrace.filter(s => s.phase === 'auth_detected' || s.phase === 'cookie_found');
    const headerSteps = this.packetTrace.filter(s => s.phase === 'header_added');
    
    html += `
      <div style="margin-top:16px;padding:12px;background:var(--glass-bg);border-radius:4px;border:1px solid var(--glass-border);">
        <div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;">Request Summary</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;">
          <div style="color:var(--text-tertiary);">Auth Detected:</div>
          <div style="color:${authSteps.length > 0 ? 'var(--brand-primary)' : 'var(--text-muted)'};">${authSteps.length > 0 ? 'Yes' : 'No'}</div>
          <div style="color:var(--text-tertiary);">Headers Added:</div>
          <div style="color:var(--brand-primary);">${headerSteps.length}</div>
          <div style="color:var(--text-tertiary);">Cookies Found:</div>
          <div style="color:var(--brand-primary);">${authSteps.filter(s => s.phase === 'cookie_found').length}</div>
        </div>
      </div>
    `;
    
    tracePanel.innerHTML = html;
  },
  
  // Get icon for trace phase
  getPhaseIcon(phase) {
    const icons = {
      request_start: '▶',
      dns_lookup: '🔍',
      tcp_connect: '🔌',
      tls_handshake: '🔒',
      request_sent: '📤',
      waiting: '⏳',
      response_start: '📥',
      response_complete: '✓',
      auth_detected: '🔑',
      cookie_found: '🍪',
      header_added: '➕',
      error: '✗'
    };
    return icons[phase] || '●';
  },
  
  // Get color for trace phase
  getPhaseColor(phase) {
    const colors = {
      request_start: '#3b82f6',
      dns_lookup: '#8b5cf6',
      tcp_connect: '#22c55e',
      tls_handshake: '#f59e0b',
      request_sent: '#3b82f6',
      waiting: '#eab308',
      response_start: '#22c55e',
      response_complete: '#22c55e',
      auth_detected: '#ec4899',
      cookie_found: '#f97316',
      header_added: '#06b6d4',
      error: '#ef4444'
    };
    return colors[phase] || '#6b7280';
  },

  // Auto-detect authentication from browser
  async detectAuthFromBrowser(url) {
    const detected = {
      type: 'none',
      headers: {},
      cookies: [],
      localStorageEntries: [],
      sessionStorageEntries: [],
      metaTokens: [],
      pageContext: null
    };
    
    try {
      const normalizedUrl = this.normalizeUrl(url);
      const urlObj = new URL(normalizedUrl);
      const cookies = await this.getCookiesForUrl(normalizedUrl);
      
      if (cookies.length > 0) {
        this.addTraceStep('cookie_found', `Found ${cookies.length} cookies for ${urlObj.hostname}`, 
          cookies.map(c => c.name));
        detected.cookies = cookies;
        
        // Check for common auth cookies
        const authCookieNames = ['session', 'token', 'auth', 'jwt', 'sid', 'oauth', 'api_key', 'apikey'];
        const authCookie = cookies.find(c => 
          authCookieNames.some(name => c.name.toLowerCase().includes(name))
        );
        
        if (authCookie) {
          this.addTraceStep('auth_detected', `Auth cookie detected: ${authCookie.name}`);
          detected.type = 'cookie';
        }
      }
      
      const pageContext = await this.getPageAuthContext(normalizedUrl);
      detected.pageContext = pageContext;

      if (pageContext?.matched) {
        detected.localStorageEntries = pageContext.localStorageEntries || [];
        detected.sessionStorageEntries = pageContext.sessionStorageEntries || [];
        detected.metaTokens = pageContext.metaTokens || [];

        if (pageContext.csrfToken) {
          this.addTraceStep('auth_detected', 'CSRF token found in page context');
          detected.csrfToken = pageContext.csrfToken;
        }

        if (pageContext.sessionToken) {
          this.addTraceStep('auth_detected', 'Authorization token found in page context');
          detected.sessionToken = pageContext.sessionToken;
        }

        if (pageContext.storageToken) {
          this.addTraceStep('auth_detected', 'Storage token found in page context');
          detected.storageToken = pageContext.storageToken;
        }
      }

      // Try to get from extension storage for API tokens
      const storageResult = await chrome.storage.local.get(['httpAuthTokens', 'apiTokens']);
      const tokens = storageResult.httpAuthTokens || storageResult.apiTokens;
      
      if (tokens && Object.keys(tokens).length > 0) {
        const domainTokens = tokens[urlObj.hostname] || tokens['*'];
        if (domainTokens) {
          this.addTraceStep('auth_detected', 'API token found in extension storage');
          detected.type = 'token';
          detected.token = domainTokens;
        }
      }
      
      const csrfCookie = cookies.find((cookie) =>
        cookie.name.toLowerCase().includes('csrf') ||
        cookie.name.toLowerCase().includes('xsrf')
      );

      if (!detected.csrfToken && csrfCookie) {
        this.addTraceStep('auth_detected', `CSRF token found: ${csrfCookie.name}`);
        detected.csrfToken = csrfCookie.value;
      }
      
    } catch (e) {
      detected.pageContext = detected.pageContext || { matched: false, reason: e.message };
    }
    
    return detected;
  },
  
  // Get cookies for a URL
  async getCookiesForUrl(url) {
    return new Promise((resolve) => {
      try {
        if (chrome.cookies && chrome.cookies.getAll) {
          chrome.cookies.getAll({ url }, (cookies) => {
            resolve(cookies || []);
          });
        } else {
          resolve([]);
        }
      } catch (e) {
        resolve([]);
      }
    });
  },
  
  async getPageAuthContext(url) {
    try {
      const normalizedUrl = this.normalizeUrl(url);
      const targetHost = new URL(normalizedUrl).hostname;
      const tabs = await chrome.tabs.query({});
      const matchingTabs = tabs.filter((tab) => {
        if (!tab.id || !tab.url) return false;
        try {
          const tabHost = new URL(tab.url).hostname;
          return this.hostnamesMatch(tabHost, targetHost);
        } catch (e) {
          return false;
        }
      });

      const preferredTab = matchingTabs.find((tab) => tab.active && tab.highlighted) ||
        matchingTabs.find((tab) => tab.active) ||
        matchingTabs[0];

      if (!preferredTab?.id) {
        return { matched: false, reason: `No open tab found for ${targetHost}. Open that site in a tab first.` };
      }

      const response = await chrome.tabs.sendMessage(preferredTab.id, {
        type: 'jsonZen:getPageAuthContext',
        targetHost
      });

      if (!response?.ok) {
        return { matched: false, reason: response?.error || 'No page auth context available.' };
      }

      return response.context;
    } catch (e) {
      return { matched: false, reason: e.message };
    }
  },

  hostnamesMatch(currentHost, targetHost) {
    return currentHost === targetHost ||
      currentHost.endsWith(`.${targetHost}`) ||
      targetHost.endsWith(`.${currentHost}`);
  },

  sanitizeHeaders(headers = {}) {
    const forbiddenHeaders = new Set([
      'cookie',
      'host',
      'origin',
      'referer',
      'user-agent',
      'content-length'
    ]);

    const sanitized = {};
    const removed = [];

    Object.entries(headers).forEach(([key, value]) => {
      if (!key) return;
      const normalizedKey = key.toLowerCase();
      if (forbiddenHeaders.has(normalizedKey)) {
        removed.push(key);
        return;
      }
      sanitized[key] = value;
    });

    return { headers: sanitized, removed };
  },

  resolveAutoAuthToken(detectedAuth = {}) {
    const tokenMatcher = (entry) => {
      const key = (entry?.key || '').toLowerCase();
      return !/csrf|xsrf/.test(key) && /auth|bearer|jwt|session|access|token|api[_-]?key/.test(key);
    };

    const localToken = detectedAuth.localStorageEntries?.find(tokenMatcher)?.value;
    const sessionToken = detectedAuth.sessionStorageEntries?.find(tokenMatcher)?.value;
    const metaToken = detectedAuth.metaTokens?.find(tokenMatcher)?.value;

    return detectedAuth.sessionToken ||
      detectedAuth.storageToken ||
      detectedAuth.token ||
      metaToken ||
      localToken ||
      sessionToken ||
      null;
  },

  addOrReplaceHeader(key, value) {
    const container = document.getElementById('httpHeadersEditor');
    if (!container) return;

    const rows = container.querySelectorAll('.http-header-row');
    for (const row of rows) {
      const keyInput = row.querySelector('.http-header-key');
      const valueInput = row.querySelector('.http-header-value');
      if (keyInput?.value.trim().toLowerCase() === key.toLowerCase()) {
        valueInput.value = value;
        return;
      }
    }

    this.addHeaderRow(key, value);
  },

  // Apply auto-detected auth to request
  applyAutoAuth(headers, detectedAuth, url) {
    const newHeaders = { ...headers };
    const csrfToken = this.csrfToken || detectedAuth.csrfToken;
    const authToken = this.resolveAutoAuthToken(detectedAuth);

    if ((this.autoCsrf || this.autoAuth) && csrfToken && !newHeaders['X-CSRF-Token'] && !newHeaders['X-XSRF-Token']) {
      newHeaders['X-CSRF-Token'] = csrfToken;
      this.addTraceStep('header_added', 'Added CSRF token header', { header: 'X-CSRF-Token' });
    }

    if (authToken && !newHeaders['Authorization']) {
      newHeaders['Authorization'] = `Bearer ${authToken}`;
      this.addTraceStep('header_added', 'Added authorization token', { source: 'auto-detected' });
    }

    if (url) {
      const urlObj = new URL(this.normalizeUrl(url));
      const savedToken = this.savedTokens[urlObj.hostname] || this.savedTokens['*'];
      if (savedToken && !newHeaders['Authorization']) {
        newHeaders['Authorization'] = `Bearer ${savedToken}`;
        this.addTraceStep('header_added', 'Added saved API token', { domain: urlObj.hostname });
      }
    }

    return newHeaders;
  },

  // Send HTTP request
  async sendRequest() {
    const url = this.getFullUrl();

    if (!url) {
      ToastManager.show('Please enter a URL', 'error');
      return;
    }

    const normalizedUrl = this.normalizeUrl(url);
    const method = document.getElementById('httpMethod').value;
    const sendBtn = document.getElementById('httpSendBtn');
    if (!sendBtn) {
      return;
    }

    const originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinner" style="display:inline;vertical-align:middle;margin-right:4px;">
        <circle cx="12" cy="12" r="10"/>
      </svg>
      Sending...
    `;
    sendBtn.disabled = true;

    const startTime = performance.now();
    this.startPacketTrace(normalizedUrl, method);
    this.addTraceStep('request_sent', `Sending ${method} request`, { method, url: normalizedUrl });

    try {
      let headers = this.getHeaders();
      const body = this.getBody();
      const autoAuthEnabled = document.getElementById('autoAuthCheck')?.checked;

      if (autoAuthEnabled) {
        this.autoAuth = true;
        this.addTraceStep('auth_detected', 'Starting browser auth detection');
        const detectedAuth = await this.detectAuthFromBrowser(normalizedUrl);
        headers = this.applyAutoAuth(headers, detectedAuth, normalizedUrl);
      }

      const sanitized = this.sanitizeHeaders(headers);
      headers = sanitized.headers;

      if (sanitized.removed.length > 0) {
        this.addTraceStep('header_added', 'Removed browser-forbidden headers', sanitized.removed);
        ToastManager.info(`Skipped browser-forbidden headers: ${sanitized.removed.join(', ')}`);
      }

      if (body && !headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }

      const requestOptions = {
        method,
        headers,
        credentials: 'include'
      };

      if (body && !['GET', 'HEAD'].includes(method)) {
        requestOptions.body = body;
      }

      this.addTraceStep('waiting', 'Waiting for response...');
      
      const response = await fetch(normalizedUrl, requestOptions);
      
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      this.addTraceStep('response_start', `Response received: ${response.status} ${response.statusText}`);

      // Get response data
      let responseData;
      let responseSize = 0;
      const contentType = response.headers.get('content-type') || '';

      try {
        const text = await response.text();
        responseSize = new Blob([text]).size;
        
        // Try to parse as JSON
        if (contentType.includes('application/json')) {
          responseData = JSON.parse(text);
          responseData = JSON.stringify(responseData, null, 2);
        } else {
          responseData = text;
        }
      } catch (e) {
        responseData = 'Unable to parse response';
      }

      this.addTraceStep('response_complete', `Request completed in ${duration}ms`, { 
        status: response.status, 
        size: responseSize 
      });

      // Update response UI
      this.displayResponse(response, duration, responseSize, responseData);

      // Save to history
      this.addToHistory({
        url: normalizedUrl,
        method,
        headers,
        body,
        timestamp: Date.now(),
        status: response.status,
        duration
      });

    } catch (error) {
      this.addTraceStep('error', `Request failed: ${error.message}`);
      this.displayError(error);
    } finally {
      sendBtn.innerHTML = originalText;
      sendBtn.disabled = false;
    }
  },

  // Display response
  displayResponse(response, duration, size, data) {
    const statusEl = document.getElementById('httpStatus');
    const timeEl = document.getElementById('httpTime');
    const sizeEl = document.getElementById('httpSize');
    const bodyEl = document.getElementById('httpResponseBody');

    // Status styling
    statusEl.textContent = `${response.status} ${response.statusText}`;
    statusEl.className = '';
    
    if (response.status >= 200 && response.status < 300) {
      statusEl.style.background = 'rgba(34, 197, 94, 0.2)';
      statusEl.style.color = '#22c55e';
    } else if (response.status >= 400) {
      statusEl.style.background = 'rgba(239, 68, 68, 0.2)';
      statusEl.style.color = '#ef4444';
    } else {
      statusEl.style.background = 'rgba(245, 158, 11, 0.2)';
      statusEl.style.color = '#f59e0b';
    }

    timeEl.textContent = `${duration}ms`;
    sizeEl.textContent = this.formatBytes(size);
    bodyEl.textContent = data || 'No response body';
  },

  // Display error
  displayError(error) {
    const statusEl = document.getElementById('httpStatus');
    const bodyEl = document.getElementById('httpResponseBody');

    statusEl.textContent = 'Error';
    statusEl.style.background = 'rgba(239, 68, 68, 0.2)';
    statusEl.style.color = '#ef4444';
    document.getElementById('httpTime').textContent = '--';
    document.getElementById('httpSize').textContent = '--';
    bodyEl.textContent = `Error: ${error.message}`;

    ToastManager.show(`Request failed: ${error.message}`, 'error');
  },

  // Format bytes
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  normalizeUrl(url) {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;

    const lower = url.toLowerCase();
    const isLocalTarget = lower.startsWith('localhost') ||
      lower.startsWith('127.0.0.1') ||
      lower.startsWith('[::1]');

    return `${isLocalTarget ? 'http' : 'https'}://${url}`;
  },

  // Add request to history
  async addToHistory(request) {
    this.history.unshift(request);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }
    await this.saveHistory();
  },

  // Show history modal
  showHistory() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal-content modal-lg" style="animation: modalEnter 0.3s ease;">
        <div class="modal-header">
          <div class="modal-title">
            <div class="modal-title-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            Request History
          </div>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div id="historyList" style="display:flex;flex-direction:column;gap:4px;">
            ${this.history.length === 0 ? '<p style="color:var(--text-muted);text-align:center;padding:32px;">No requests yet</p>' : ''}
          </div>
        </div>
      </div>
    `;

    // Populate history list
    const list = modal.querySelector('#historyList');
    this.history.forEach((req, index) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div class="history-item-icon" style="background:${this.getMethodColor(req.method)};color:white;">
          ${req.method}
        </div>
        <div class="history-item-content">
          <div class="history-item-title">${this.escapeHtml(req.url)}</div>
          <div class="history-item-meta">${new Date(req.timestamp).toLocaleString()} · ${req.duration}ms · ${req.status}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        this.loadRequestFromHistory(index);
        modal.remove();
      });
      list.appendChild(item);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  },

  // Get method color
  getMethodColor(method) {
    const colors = {
      'GET': '#22c55e',
      'POST': '#3b82f6',
      'PUT': '#f59e0b',
      'PATCH': '#8b5cf6',
      'DELETE': '#ef4444'
    };
    return colors[method] || '#6b7280';
  },

  // Load request from history
  loadRequestFromHistory(index) {
    const req = this.history[index];
    if (!req) return;

    document.getElementById('httpUrl').value = req.url;
    document.getElementById('httpMethod').value = req.method;

    // Load headers
    const headersEditor = document.getElementById('httpHeadersEditor');
    headersEditor.innerHTML = '';
    Object.entries(req.headers || {}).forEach(([key, value]) => {
      this.addHeaderRow(key, value);
    });

    // Load body
    if (req.body) {
      document.getElementById('httpBody').value = req.body;
    }

    ToastManager.show('Request loaded from history', 'success');
  },

  // Save current request
  saveRequest() {
    const name = prompt('Enter a name for this request:');
    if (!name) return;

    const savedRequest = {
      name,
      url: this.getFullUrl(),
      method: document.getElementById('httpMethod').value,
      headers: this.getHeaders(),
      body: this.getBody(),
      savedAt: Date.now()
    };

    // Save to storage
    chrome.storage.local.get(['savedRequests'], (result) => {
      const saved = result.savedRequests || [];
      saved.push(savedRequest);
      chrome.storage.local.set({ savedRequests: saved.slice(-20) }, () => {
        ToastManager.show('Request saved', 'success');
      });
    });
  },

  // Setup event listeners
  setupEventListeners() {
    const sendBtn = document.getElementById('httpSendBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendRequest());
    }

    document.getElementById('autoAuthCheck')?.addEventListener('change', (e) => {
      this.autoAuth = e.target.checked;
      this.saveCsrfSettings();
    });

    // CSRF controls
    document.getElementById('autoCsrfCheck')?.addEventListener('change', (e) => {
      this.autoCsrf = e.target.checked;
      this.saveCsrfSettings();
    });

    document.getElementById('customCsrfToken')?.addEventListener('input', (e) => {
      this.csrfToken = e.target.value;
      this.saveCsrfSettings();
    });

    document.getElementById('clearCsrfBtn')?.addEventListener('click', () => {
      this.csrfToken = null;
      document.getElementById('customCsrfToken').value = '';
      this.saveCsrfSettings();
      ToastManager.success('CSRF token cleared');
    });

    document.getElementById('refreshCsrfBtn')?.addEventListener('click', async () => {
      const url = document.getElementById('httpUrl').value;
      if (!url) {
        ToastManager.error('Enter a URL first');
        return;
      }
      const cookies = await this.getCookiesForUrl(this.normalizeUrl(url));
      const csrfCookie = cookies.find(c => 
        c.name.toLowerCase().includes('csrf') || 
        c.name.toLowerCase().includes('xsrf')
      );
      if (csrfCookie) {
        this.csrfToken = csrfCookie.value;
        document.getElementById('customCsrfToken').value = csrfCookie.value;
        this.saveCsrfSettings();
        ToastManager.success('CSRF token refreshed from cookies');
      } else {
        ToastManager.warning('No CSRF token found in cookies');
      }
    });

    // Add token button
    document.getElementById('addTokenBtn')?.addEventListener('click', () => {
      const domain = prompt('Enter domain (e.g., api.example.com):');
      if (!domain) return;
      const token = prompt('Enter API token:');
      if (!token) return;
      
      this.savedTokens[domain] = token;
      this.saveTokens();
      this.renderSavedTokens();
      ToastManager.success('Token saved');
    });

    // Load from Browser button
    const loadAuthBtn = document.getElementById('loadAuthFromBrowserBtn');
    if (loadAuthBtn) {
      loadAuthBtn.addEventListener('click', async () => {
        const url = document.getElementById('httpUrl').value;
        if (!url) {
          ToastManager.error('Enter a URL first');
          return;
        }
        
        try {
          const normalizedUrl = this.normalizeUrl(url);
          const urlObj = new URL(normalizedUrl);
          const detectedAuth = await this.detectAuthFromBrowser(normalizedUrl);
          this.displayDetectedAuth(detectedAuth, urlObj.hostname);
          ToastManager.success('Auth loaded from browser');
        } catch (e) {
          ToastManager.error('Failed to load auth: ' + e.message);
        }
      });
    }

    // Add header button
    document.getElementById('addHeaderBtn')?.addEventListener('click', () => this.addHeaderRow());

    // Add param button
    document.getElementById('addParamBtn')?.addEventListener('click', () => this.addParamRow());

    // History button
    document.getElementById('httpHistoryBtn')?.addEventListener('click', () => this.showHistory());

    // Save button
    document.getElementById('httpSaveBtn')?.addEventListener('click', () => this.saveRequest());

    // Auth type change
    document.getElementById('authType')?.addEventListener('change', (e) => {
      this.updateAuthFields(e.target.value);
    });

    // Format response button
    document.getElementById('httpFormatResponse')?.addEventListener('click', () => {
      const bodyEl = document.getElementById('httpResponseBody');
      const text = bodyEl.textContent;
      try {
        const parsed = JSON.parse(text);
        bodyEl.textContent = JSON.stringify(parsed, null, 2);
        ToastManager.show('Response formatted', 'success');
      } catch (e) {
        ToastManager.show('Response is not valid JSON', 'warning');
      }
    });

    // Copy response button
    document.getElementById('httpCopyResponse')?.addEventListener('click', () => {
      const text = document.getElementById('httpResponseBody').textContent;
      navigator.clipboard.writeText(text).then(() => {
        ToastManager.show('Response copied to clipboard', 'success');
      });
    });

    // Tab switching for HTTP client
    document.querySelectorAll('.http-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.http-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.http-tab-content').forEach(c => c.classList.add('hidden'));
        tab.classList.add('active');
        const tabId = tab.dataset.httpTab;
        document.getElementById(`http-tab-${tabId}`)?.classList.remove('hidden');
      });
    });
  },

  // Update auth fields based on auth type
  updateAuthFields(type) {
    const container = document.getElementById('authFields');
    if (!container) return;

    container.innerHTML = '';

    switch (type) {
      case 'bearer':
        container.innerHTML = `
          <label class="json-label">Token</label>
          <input type="text" id="bearerToken" class="json-input" placeholder="eyJhbGciOiJIUzI1NiIs...">
        `;
        break;
      
      case 'basic':
        container.innerHTML = `
          <label class="json-label">Username</label>
          <input type="text" id="basicUsername" class="json-input" placeholder="username">
          <label class="json-label" style="margin-top:12px;">Password</label>
          <input type="password" id="basicPassword" class="json-input" placeholder="password">
        `;
        break;
      
      case 'apikey':
        container.innerHTML = `
          <label class="json-label">Key Name</label>
          <input type="text" id="apiKeyHeader" class="json-input" placeholder="X-API-Key" value="X-API-Key">
          <label class="json-label" style="margin-top:12px;">API Key</label>
          <input type="text" id="apiKey" class="json-input" placeholder="your-api-key">
        `;
        break;
    }
  },

  // Escape HTML for display
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
