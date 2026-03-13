// JSON Zen - Popup Script with History
const $ = id => document.getElementById(id);
const input = $('input');
const output = $('output');
const status = $('status');
const info = $('info');
const themeBtn = $('theme');
let result = '';

// Default settings
let settings = { theme: 'dark', autoCopy: false, autoFormat: false, indentSize: 2 };

// History management
const HISTORY_KEY = 'jsonZenHistory';
const MAX_HISTORY = 50;
const MAX_RECENT = 5;
let historyData = [];

// Load settings from storage
function loadSettings() {
  try {
    chrome.storage.sync.get(settings, (items) => {
      if (chrome.runtime.lastError) return;
      settings = items;
      settings.indentSize = parseInt(settings.indentSize) || 2;
      applyTheme(settings.theme);
    });
  } catch (e) {}
  
  // Load history
  loadHistory();
}

// Apply theme
function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.classList.add('light');
    themeBtn.textContent = '☀️';
  } else if (theme === 'system') {
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    themeBtn.textContent = '🌙';
  } else {
    document.documentElement.classList.remove('light');
    themeBtn.textContent = '🌙';
  }
  settings.theme = theme;
}

// Toggle theme
themeBtn.onclick = () => {
  const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  try {
    chrome.storage.sync.set({ theme: newTheme });
  } catch (e) {}
};

// Listen for storage changes
try {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.theme) applyTheme(changes.theme.newValue);
    if (changes.autoCopy !== undefined) settings.autoCopy = changes.autoCopy.newValue;
    if (changes.autoFormat !== undefined) settings.autoFormat = changes.autoFormat.newValue;
  });
} catch (e) {}

function setStatus(msg, type) {
  status.textContent = msg;
  status.className = 'status-pill ' + (type || '');
}

// Key color mapping based on key name patterns
const keyColors = {
  // IDs and references
  'id': '#64d2ff',
  '_id': '#64d2ff',
  'uuid': '#64d2ff',
  'guid': '#64d2ff',
  'ref': '#64d2ff',
  'reference': '#64d2ff',

  // Names and titles
  'name': '#32d74b',
  'title': '#32d74b',
  'label': '#32d74b',
  'fullname': '#32d74b',
  'username': '#32d74b',
  'firstname': '#32d74b',
  'lastname': '#32d74b',
  'displayname': '#32d74b',

  // Descriptions and content
  'description': '#ffcc00',
  'content': '#ffcc00',
  'text': '#ffcc00',
  'message': '#ffcc00',
  'body': '#ffcc00',
  'summary': '#ffcc00',

  // URLs and links
  'url': '#5e5ce6',
  'href': '#5e5ce6',
  'link': '#5e5ce6',
  'uri': '#5e5ce6',
  'src': '#5e5ce6',
  'image': '#5e5ce6',
  'avatar': '#5e5ce6',
  'logo': '#5e5ce6',

  // Email
  'email': '#ff9f0a',
  'mail': '#ff9f0a',

  // Phone
  'phone': '#ff9f0a',
  'tel': '#ff9f0a',
  'mobile': '#ff9f0a',

  // Status
  'status': '#bf5af2',
  'state': '#bf5af2',
  'type': '#bf5af2',
  'kind': '#bf5af2',
  'category': '#bf5af2',
  'role': '#bf5af2',

  // Count and size
  'count': '#30d158',
  'total': '#30d158',
  'size': '#30d158',
  'length': '#30d158',
  'limit': '#30d158',
  'page': '#30d158',
  'offset': '#30d158',

  // Booleans
  'isactive': '#bf5af2',
  'isvalid': '#bf5af2',
  'isenabled': '#bf5af2',
  'ispublic': '#bf5af2',
  'isverified': '#bf5af2',
  'enabled': '#bf5af2',
  'active': '#bf5af2',
  'visible': '#bf5af2',
  'verified': '#bf5af2',
  'public': '#bf5af2',

  // Dates
  'createdat': '#ff453a',
  'updatedat': '#ff453a',
  'deletedat': '#ff453a',
  'timestamp': '#ff453a',
  'date': '#ff453a',
  'time': '#ff453a',

  // Passwords and secrets (redact)
  'password': '#ff453a',
  'secret': '#ff453a',
  'token': '#ff453a',
  'apikey': '#ff453a',
  'key': '#ff453a',

  // Default key color
  'default': '#64d2ff'
};

function getKeyColor(key) {
  const lowerKey = key.toLowerCase().replace(/[_-]/g, '');
  for (const [pattern, color] of Object.entries(keyColors)) {
    if (lowerKey === pattern || lowerKey.endsWith(pattern)) {
      return color;
    }
  }
  return keyColors['default'];
}

function highlight(json) {
  if (!json) return '';

  // First escape HTML
  let escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Highlight keys with smart coloring
  escaped = escaped.replace(/"([^"]+)":(\s*)()/g, (match, key, space) => {
    const color = getKeyColor(key);
    return `<span style="color:${color}">"${key}"</span>:${space}`;
  });

  // Highlight string values (after the key:value)
  escaped = escaped.replace(/:(\s*)"([^"]*)"/g, (match, space, value) => {
    return `:${space}<span class="string">"${value}"</span>`;
  });

  // Highlight numbers
  escaped = escaped.replace(/:(\s*)(\d+\.?\d*)/g, (match, space, num) => {
    return `:${space}<span class="number">${num}</span>`;
  });

  // Highlight booleans
  escaped = escaped.replace(/:(\s*)(true|false)/g, (match, space, bool) => {
    return `:${space}<span class="boolean">${bool}</span>`;
  });

  // Highlight null
  escaped = escaped.replace(/:(\s*)(null)/g, (match, space, n) => {
    return `:${space}<span class="null">${n}</span>`;
  });

  return escaped;
}

// ================================================
// HISTORY FUNCTIONS
// ================================================

function loadHistory() {
  try {
    chrome.storage.local.get([HISTORY_KEY], (result) => {
      if (result[HISTORY_KEY]) {
        historyData = result[HISTORY_KEY];
        renderHistory();
        renderRecent();
      }
    });
  } catch (e) {
    console.error('Error loading history:', e);
  }
}

function saveHistory() {
  try {
    chrome.storage.local.set({ [HISTORY_KEY]: historyData });
  } catch (e) {
    console.error('Error saving history:', e);
  }
}

function addToHistory(operation, inputData, outputData) {
  const now = Date.now();
  const preview = inputData.substring(0, 100);
  
  const historyItem = {
    id: now.toString(),
    timestamp: now,
    operation: operation,
    input: inputData,
    output: outputData,
    preview: preview,
    starred: false
  };
  
  // Add to beginning of array
  historyData.unshift(historyItem);
  
  // Keep only MAX_HISTORY items
  if (historyData.length > MAX_HISTORY) {
    historyData = historyData.slice(0, MAX_HISTORY);
  }
  
  saveHistory();
  renderHistory();
  renderRecent();
}

function toggleStar(id) {
  const item = historyData.find(h => h.id === id);
  if (item) {
    item.starred = !item.starred;
    saveHistory();
    renderHistory();
  }
}

function deleteHistoryItem(id) {
  historyData = historyData.filter(h => h.id !== id);
  saveHistory();
  renderHistory();
  renderRecent();
}

function clearHistory() {
  if (confirm('Are you sure you want to clear all history?')) {
    historyData = [];
    saveHistory();
    renderHistory();
    renderRecent();
  }
}

function loadHistoryItem(id) {
  const item = historyData.find(h => h.id === id);
  if (item) {
    input.value = item.input;
    info.textContent = item.input.length + ' chars';
    output.innerHTML = highlight(item.output);
    result = item.output;
    setStatus('Loaded from history', 'success');
    closeHistorySidebar();
  }
}

function formatTimestamp(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

function renderHistory(searchQuery = '') {
  const historyList = $('historyList');
  if (!historyList) return;
  
  let filteredData = historyData;
  
  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredData = historyData.filter(item => 
      item.operation.toLowerCase().includes(query) ||
      item.preview.toLowerCase().includes(query) ||
      item.input.toLowerCase().includes(query)
    );
  }
  
  // Sort: starred first, then by timestamp
  filteredData.sort((a, b) => {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
    return b.timestamp - a.timestamp;
  });
  
  if (filteredData.length === 0) {
    historyList.innerHTML = `
      <div class="history-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p>${searchQuery ? 'No matching history found' : 'No history yet'}</p>
      </div>
    `;
    return;
  }
  
  historyList.innerHTML = filteredData.map(item => `
    <div class="history-item ${item.starred ? 'starred' : ''}" data-id="${item.id}">
      <div class="history-item-header">
        <span class="history-item-type ${item.operation === 'fix' ? 'fix' : item.operation === 'minify' ? 'minify' : ''}">${item.operation}</span>
        <div class="history-item-actions">
          <button class="history-star-btn ${item.starred ? 'active' : ''}" data-id="${item.id}" title="Toggle star">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
          </button>
          <button class="history-delete-btn" data-id="${item.id}" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="history-item-time">${formatTimestamp(item.timestamp)}</div>
      <div class="history-item-preview">${item.preview}</div>
    </div>
  `).join('');
  
  // Add event listeners
  historyList.querySelectorAll('.history-item').forEach(itemEl => {
    itemEl.addEventListener('click', (e) => {
      if (!e.target.closest('.history-star-btn') && !e.target.closest('.history-delete-btn')) {
        loadHistoryItem(itemEl.dataset.id);
      }
    });
  });
  
  historyList.querySelectorAll('.history-star-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStar(btn.dataset.id);
    });
  });
  
  historyList.querySelectorAll('.history-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteHistoryItem(btn.dataset.id);
    });
  });
}

function renderRecent() {
  const recentList = $('recentList');
  if (!recentList) return;
  
  // Get last 5 non-starred items, sorted by timestamp
  const recentItems = historyData
    .filter(item => !item.starred)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_RECENT);
  
  if (recentItems.length === 0) {
    recentList.innerHTML = '<div class="recent-empty">No recent items</div>';
    return;
  }
  
  recentList.innerHTML = recentItems.map(item => `
    <button class="recent-item" data-id="${item.id}">
      <span class="recent-item-type">${item.operation}</span>
      <span class="recent-item-preview">${item.preview}</span>
    </button>
  `).join('');
  
  // Add event listeners
  recentList.querySelectorAll('.recent-item').forEach(itemEl => {
    itemEl.addEventListener('click', () => {
      loadHistoryItem(itemEl.dataset.id);
      closeRecentDropdown();
    });
  });
}

// History sidebar controls
function openHistorySidebar() {
  $('historySidebar').classList.add('open');
  $('historyOverlay').classList.add('open');
}

function closeHistorySidebar() {
  $('historySidebar').classList.remove('open');
  $('historyOverlay').classList.remove('open');
}

function openRecentDropdown() {
  document.querySelector('.recent-dropdown').classList.add('active');
}

function closeRecentDropdown() {
  document.querySelector('.recent-dropdown').classList.remove('active');
}

// ================================================
// OPERATION WRAPPERS WITH HISTORY
// ================================================

function run(fn, name) {
  if (typeof JSONUtils === 'undefined') {
    setStatus('Error: JSONUtils not loaded', 'error');
    return;
  }
  const text = input.value.trim();
  if (!text) { setStatus('Enter JSON', 'error'); return; }
  const r = fn(text);
  if (r.success || r.valid) {
    result = r.result || 'Valid JSON';
    output.innerHTML = r.success ? highlight(result) : result;
    setStatus('Done', 'success');
    
    // Add to history
    if (r.success) {
      addToHistory(name.toLowerCase(), text, result);
    }
    
    if (settings.autoCopy && r.success) {
      navigator.clipboard.writeText(result).then(() => setStatus('Copied', 'success'));
    }
  } else {
    output.textContent = r.error;
    setStatus('Error', 'error');
  }
}

$('format').onclick = () => run(t => JSONUtils.format(t, settings.indentSize || 2), 'Format');
$('minify').onclick = () => run(t => JSONUtils.minify(t), 'Minify');
$('fix').onclick = () => run(t => JSONUtils.fix(t), 'Fix');
$('validate').onclick = () => run(t => JSONUtils.validate(t), 'Validate');
$('sort').onclick = () => run(t => JSONUtils.sortKeys(t), 'Sort');
$('stats').onclick = () => run(t => JSONUtils.stats(t), 'Stats');

// Schema validate button
if ($('schemaValidate')) {
  // Open schema validation modal
  $('schemaValidate').onclick = () => {
    const modal = $('schemaModal');
    if (modal) {
      modal.classList.add('active');

      // Pre-fill JSON input if there's content in main input
      const jsonInput = $('schemaJsonInput');
      if (jsonInput && input.value.trim()) {
        jsonInput.value = input.value.trim();
        validateSchemaJson();
      }

      // Clear previous results
      clearSchemaValidationResults();
    } else {
      // Fallback to basic validation if modal doesn't exist
      const text = input.value.trim();
      if (!text) { setStatus('Enter JSON', 'error'); return; }
      run(t => JSONUtils.validate(t), 'Schema');
    }
  };

  // Schema modal functionality
  const schemaModal = $('schemaModal');
  if (schemaModal) {
    const closeSchemaModal = $('closeSchemaModal');
    const cancelSchema = $('cancelSchema');
    const runSchemaValidation = $('runSchemaValidation');
    const schemaJsonInput = $('schemaJsonInput');
    const schemaInput = $('schemaInput');
    const schemaTemplate = $('schemaTemplate');
    const generateSchemaBtn = $('generateSchema');
    const clearSchemaBtn = $('clearSchema');
    const validationResults = $('validationResults');
    const validationSummary = $('validationSummary');
    const validationErrors = $('validationErrors');
    const jsonStatus = $('jsonStatus');
    const schemaStatus = $('schemaStatus');

    // Close modal handlers
    if (closeSchemaModal) {
      closeSchemaModal.onclick = () => schemaModal.classList.remove('active');
    }
    if (cancelSchema) {
      cancelSchema.onclick = () => schemaModal.classList.remove('active');
    }

    // Close modal on overlay click
    schemaModal.addEventListener('click', (e) => {
      if (e.target === schemaModal) {
        schemaModal.classList.remove('active');
      }
    });

    // Template selection
    if (schemaTemplate) {
      schemaTemplate.onchange = () => {
        const templateName = schemaTemplate.value;
        if (templateName && schemaInput) {
          const template = JSONUtils.getSchemaTemplate(templateName);
          if (template) {
            schemaInput.value = JSON.stringify(template, null, 2);
            validateSchemaSchema();
          }
        }
      };
    }

    // Generate schema from JSON
    if (generateSchemaBtn) {
      generateSchemaBtn.onclick = () => {
        if (!schemaJsonInput) return;
        const jsonText = schemaJsonInput.value.trim();
        if (!jsonText) {
          showSchemaValidationResult(false, 'Please enter JSON data first', []);
          return;
        }

        // First validate JSON
        const jsonValidation = JSONUtils.validate(jsonText);
        if (!jsonValidation.valid) {
          showSchemaValidationResult(false, 'Invalid JSON: ' + jsonValidation.error, []);
          return;
        }

        // Generate schema
        const result = JSONUtils.generateSchema(jsonText, {
          title: 'Generated Schema',
          description: 'Auto-generated from your JSON data'
        });

        if (result.success && schemaInput) {
          schemaInput.value = result.result;
          validateSchemaSchema();
          showSchemaValidationResult(true, 'Schema generated successfully!', []);
        } else {
          showSchemaValidationResult(false, 'Failed to generate schema: ' + result.error, []);
        }
      };
    }

    // Clear schema
    if (clearSchemaBtn) {
      clearSchemaBtn.onclick = () => {
        if (schemaInput) schemaInput.value = '';
        if (schemaTemplate) schemaTemplate.value = '';
        validateSchemaSchema();
        clearSchemaValidationResults();
      };
    }

    // Validate JSON input
    if (schemaJsonInput) {
      schemaJsonInput.oninput = () => {
        validateSchemaJson();
      };
    }

    // Validate schema input
    if (schemaInput) {
      schemaInput.oninput = () => {
        validateSchemaSchema();
      };
    }

    // Run schema validation
    if (runSchemaValidation) {
      runSchemaValidation.onclick = () => {
        if (!schemaJsonInput || !schemaInput) return;
        const jsonText = schemaJsonInput.value.trim();
        const schemaText = schemaInput.value.trim();

        if (!jsonText) {
          showSchemaValidationResult(false, 'Please enter JSON data to validate', []);
          return;
        }

        if (!schemaText) {
          showSchemaValidationResult(false, 'Please enter or generate a schema', []);
          return;
        }

        // First validate JSON
        const jsonValidation = JSONUtils.validate(jsonText);
        if (!jsonValidation.valid) {
          showSchemaValidationResult(false, 'Invalid JSON: ' + jsonValidation.error, []);
          return;
        }

        // Validate schema
        const schemaValidation = JSONUtils.validate(schemaText);
        if (!schemaValidation.valid) {
          showSchemaValidationResult(false, 'Invalid schema: ' + schemaValidation.error, []);
          return;
        }

        // Run schema validation
        const result = JSONUtils.validateSchema(jsonText, schemaText);

        if (result.valid) {
          showSchemaValidationResult(
            true,
            'Validation passed! JSON conforms to the schema.',
            []
          );
        } else {
          showSchemaValidationResult(
            false,
            `Validation failed with ${result.errors.length} error${result.errors.length > 1 ? 's' : ''}`,
            result.errors
          );
        }
      };
    }

    function validateSchemaJson() {
      if (!schemaJsonInput || !jsonStatus) return;
      const jsonText = schemaJsonInput.value.trim();

      if (!jsonText) {
        jsonStatus.textContent = '';
        jsonStatus.className = 'schema-panel-status';
        return;
      }

      const validation = JSONUtils.validate(jsonText);
      if (validation.valid) {
        jsonStatus.textContent = '✓ Valid';
        jsonStatus.className = 'schema-panel-status valid';
      } else {
        jsonStatus.textContent = '✗ Invalid';
        jsonStatus.className = 'schema-panel-status invalid';
      }
    }

    function validateSchemaSchema() {
      if (!schemaInput || !schemaStatus) return;
      const schemaText = schemaInput.value.trim();

      if (!schemaText) {
        schemaStatus.textContent = '';
        schemaStatus.className = 'schema-panel-status';
        return;
      }

      const validation = JSONUtils.validate(schemaText);
      if (validation.valid) {
        schemaStatus.textContent = '✓ Valid';
        schemaStatus.className = 'schema-panel-status valid';
      } else {
        schemaStatus.textContent = '✗ Invalid';
        schemaStatus.className = 'schema-panel-status invalid';
      }
    }

    function clearSchemaValidationResults() {
      if (!validationSummary || !validationErrors) return;
      validationSummary.className = 'validation-summary';
      validationSummary.innerHTML = '';
      validationErrors.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <p>Click "Validate" to check your JSON against the schema</p>
        </div>
      `;
    }

    function showSchemaValidationResult(isValid, summary, errors) {
      if (!validationSummary || !validationErrors) return;
      validationSummary.className = 'validation-summary ' + (isValid ? 'valid' : 'invalid');

      if (isValid) {
        validationSummary.innerHTML = `
          <div class="validation-summary-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <span class="validation-summary-text">${summary}</span>
        `;
        validationErrors.innerHTML = '';
      } else {
        validationSummary.innerHTML = `
          <div class="validation-summary-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </div>
          <span class="validation-summary-text">${summary}</span>
        `;

        if (errors.length > 0) {
          validationErrors.innerHTML = errors.map(error => `
            <div class="validation-error-item">
              <div class="validation-error-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
              </div>
              <div class="validation-error-content">
                <div class="validation-error-path">
                  ${error.path || 'root'}
                  <span class="validation-error-line">Line ${error.line || '?'}</span>
                </div>
                <div class="validation-error-message">${error.message}</div>
              </div>
            </div>
          `).join('');
        } else {
          validationErrors.innerHTML = '';
        }
      }
    }

    // Initialize empty validation results
    clearSchemaValidationResults();
  }
}

// Convert dropdown
document.querySelectorAll('.dropdown-item').forEach(item => {
  item.onclick = () => {
    const convertType = item.dataset.convert;
    const text = input.value.trim();
    if (!text) { setStatus('Enter JSON', 'error'); return; }

    let r;
    let operationName = '';
    switch (convertType) {
      case 'yaml': r = JSONUtils.toYAML(text); operationName = 'YAML'; break;
      case 'xml': r = JSONUtils.toXML(text); operationName = 'XML'; break;
      case 'csv': r = JSONUtils.toCSV(text); operationName = 'CSV'; break;
      case 'toml': r = JSONUtils.toTOML(text); operationName = 'TOML'; break;
      case 'base64': r = JSONUtils.encodeBase64(text); operationName = 'Base64'; break;
      case 'url': r = JSONUtils.urlEncode(text); operationName = 'URL Encode'; break;
    }

    if (r && r.success) {
      result = r.result;
      output.textContent = result;
      setStatus('Done', 'success');
      addToHistory(operationName.toLowerCase(), text, result);
    } else if (r) {
      output.textContent = r.error;
      setStatus('Error', 'error');
    }
  };
});

$('copy').onclick = () => result && navigator.clipboard.writeText(result).then(() => setStatus('Copied', 'success'));
$('paste').onclick = () => navigator.clipboard.readText().then(t => {
  input.value = t;
  info.textContent = t.length + ' chars';
  if (settings.autoFormat && t.trim()) {
    const r = JSONUtils.format(t, settings.indentSize || 2);
    if (r.success) {
      input.value = r.result;
      output.innerHTML = highlight(r.result);
      setStatus('Done', 'success');
    }
  }
});
$('clear').onclick = () => { input.value = ''; output.textContent = ''; result = ''; info.textContent = '0 chars'; setStatus('Ready', ''); };
input.oninput = () => info.textContent = input.value.length + ' chars';

document.onkeydown = e => {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
    if (e.key === 'f') $('format').click();
    else if (e.key === 'm') $('minify').click();
    else if (e.key === 'x') $('fix').click();
  }
};

// ================================================
// HISTORY UI EVENT LISTENERS
// ================================================

$('historyBtn').onclick = openHistorySidebar;
$('closeHistory').onclick = closeHistorySidebar;
$('historyOverlay').onclick = closeHistorySidebar;
$('recentBtn').onclick = (e) => {
  e.stopPropagation();
  document.querySelector('.recent-dropdown').classList.toggle('active');
  renderRecent();
};

$('clearHistory').onclick = clearHistory;

$('historySearch').oninput = (e) => {
  renderHistory(e.target.value);
};

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  // Close convert dropdown
  const convertDropdown = document.querySelector('.dropdown:not(.recent-dropdown)');
  if (convertDropdown && !convertDropdown.contains(e.target)) {
    convertDropdown.classList.remove('active');
  }
  
  // Close recent dropdown
  const recentDropdown = document.querySelector('.recent-dropdown');
  if (recentDropdown && !recentDropdown.contains(e.target)) {
    recentDropdown.classList.remove('active');
  }
});

// Toggle convert dropdown
const convertBtn = $('convertBtn');
if (convertBtn) {
  convertBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelector('.dropdown:not(.recent-dropdown)').classList.toggle('active');
  });
}

// Initialize
loadSettings();
