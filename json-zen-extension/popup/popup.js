// JSON Zen - Popup Script

const defaultSettings = {
  indentSize: '2',
  theme: 'dark',
  autoCopy: false,
  autoFormat: true
};

let settings = { ...defaultSettings };
let currentOutput = '';

function loadSettings() {
  try {
    chrome.storage.sync.get(defaultSettings, (items) => {
      if (chrome.runtime.lastError) return;
      settings = items;
    });
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  const inputJson = document.getElementById('input-json');
  const outputJson = document.getElementById('output-json');
  const statusBadge = document.getElementById('status-badge');
  const charInfo = document.getElementById('char-info');

  const formatBtn = document.getElementById('format-btn');
  const minifyBtn = document.getElementById('minify-btn');
  const fixBtn = document.getElementById('fix-btn');
  const validateBtn = document.getElementById('validate-btn');
  const sortBtn = document.getElementById('sort-btn');
  const statsBtn = document.getElementById('stats-btn');
  const toYamlBtn = document.getElementById('to-yaml-btn');
  const toXmlBtn = document.getElementById('to-xml-btn');
  const toCsvBtn = document.getElementById('to-csv-btn');
  const copyBtn = document.getElementById('copy-btn');
  const pasteBtn = document.getElementById('paste-btn');
  const clearBtn = document.getElementById('clear-btn');
  const settingsBtn = document.getElementById('settings-btn');

  loadSettings();

  function setStatus(type, message) {
    statusBadge.textContent = message;
    statusBadge.className = 'status-badge ' + (type || '');
  }

  function updateCharCount() {
    charInfo.textContent = `${inputJson.value.length.toLocaleString()} chars`;
  }

  function setOutput(text, highlight = true) {
    currentOutput = text;
    if (highlight) {
      outputJson.innerHTML = JSONUtils.highlight(text);
    } else {
      outputJson.textContent = text;
    }
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('success', 'Copied!');
    } catch (e) {
      setStatus('error', 'Copy failed');
    }
  }

  function handleResult(result, name) {
    if (result.success) {
      setOutput(result.result);
      setStatus('success', `${name}ed`);
      if (settings.autoCopy) copyToClipboard(result.result);
    } else if (result.valid !== undefined) {
      setOutput(result.valid ? 'Valid JSON' : result.error, false);
      setStatus(result.valid ? 'success' : 'error', result.valid ? 'Valid!' : 'Invalid');
    } else {
      setOutput(result.error, false);
      setStatus('error', 'Error');
    }
  }

  function getInput() {
    const input = inputJson.value.trim();
    if (!input) {
      setStatus('warning', 'Enter JSON');
      return null;
    }
    return input;
  }

  // Button handlers
  formatBtn.addEventListener('click', () => {
    const input = getInput();
    if (!input) return;
    handleResult(JSONUtils.format(input, parseInt(settings.indentSize) || 2), 'Format');
  });

  minifyBtn.addEventListener('click', () => {
    const input = getInput();
    if (!input) return;
    handleResult(JSONUtils.minify(input), 'Minify');
  });

  fixBtn.addEventListener('click', () => {
    const input = getInput();
    if (!input) return;
    handleResult(JSONUtils.fix(input), 'Fix');
  });

  validateBtn.addEventListener('click', () => {
    const input = getInput();
    if (!input) return;
    handleResult(JSONUtils.validate(input), 'Validate');
  });

  sortBtn.addEventListener('click', () => {
    const input = getInput();
    if (!input) return;
    handleResult(JSONUtils.sortKeys(input), 'Sort');
  });

  statsBtn.addEventListener('click', () => {
    const input = getInput();
    if (!input) return;
    handleResult(JSONUtils.stats(input), 'Stats');
  });

  toYamlBtn.addEventListener('click', () => {
    const input = getInput();
    if (!input) return;
    handleResult(JSONUtils.toYAML(input), 'YAML');
  });

  toXmlBtn.addEventListener('click', () => {
    const input = getInput();
    if (!input) return;
    handleResult(JSONUtils.toXML(input), 'XML');
  });

  toCsvBtn.addEventListener('click', () => {
    const input = getInput();
    if (!input) return;
    handleResult(JSONUtils.toCSV(input), 'CSV');
  });

  copyBtn.addEventListener('click', () => {
    if (currentOutput) copyToClipboard(currentOutput);
  });

  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      inputJson.value = text;
      updateCharCount();
      if (settings.autoFormat && text.trim()) {
        const result = JSONUtils.format(text, parseInt(settings.indentSize) || 2);
        if (result.success) {
          inputJson.value = result.result;
          setOutput(result.result);
          setStatus('success', 'Formatted');
        } else {
          setOutput(text);
          setStatus('warning', 'Invalid JSON');
        }
      }
    } catch (e) {}
  });

  clearBtn.addEventListener('click', () => {
    inputJson.value = '';
    outputJson.textContent = '';
    currentOutput = '';
    updateCharCount();
    setStatus('', 'Ready');
  });

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage ? chrome.runtime.openOptionsPage() : window.open(chrome.runtime.getURL('options/options.html'));
  });

  // Auto-format on input
  inputJson.addEventListener('input', () => {
    updateCharCount();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
      e.preventDefault();
      switch (e.key.toLowerCase()) {
        case 'f': formatBtn.click(); break;
        case 'm': minifyBtn.click(); break;
        case 'x': fixBtn.click(); break;
        case 'v': validateBtn.click(); break;
      }
    }
  });

  // Settings changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.indentSize) settings.indentSize = changes.indentSize.newValue;
    if (changes.autoCopy !== undefined) settings.autoCopy = changes.autoCopy.newValue;
    if (changes.autoFormat !== undefined) settings.autoFormat = changes.autoFormat.newValue;
    if (changes.theme) applyTheme(changes.theme.newValue);
  });

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'light') {
      root.style.setProperty('--bg', '#FFFFFF');
      root.style.setProperty('--bg-secondary', '#F5F5F7');
      root.style.setProperty('--bg-tertiary', '#E5E5EA');
      root.style.setProperty('--text', '#1D1D1F');
      root.style.setProperty('--text-secondary', '#6E6E73');
      root.style.setProperty('--text-tertiary', '#A1A1A6');
      root.style.setProperty('--border', '#D2D2D7');
    } else if (theme === 'dark') {
      root.style.setProperty('--bg', '#1C1C1E');
      root.style.setProperty('--bg-secondary', '#2C2C2E');
      root.style.setProperty('--bg-tertiary', '#3A3A3C');
      root.style.setProperty('--text', '#FFFFFF');
      root.style.setProperty('--text-secondary', '#98989D');
      root.style.setProperty('--text-tertiary', '#636366');
      root.style.setProperty('--border', '#38383A');
    }
  }

  setStatus('', 'Ready');
  updateCharCount();
});
