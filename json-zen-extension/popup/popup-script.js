// JSON Zen - Popup Script
const $ = id => document.getElementById(id);
const input = $('input');
const output = $('output');
const status = $('status');
const info = $('info');
const themeBtn = $('theme');
let result = '';

// Default settings
let settings = { theme: 'dark', autoCopy: false, autoFormat: false, indentSize: 2 };

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
$('validate').onclick = () => run(t => JSONUtils.validate(t), 'Valid');
$('sort').onclick = () => run(t => JSONUtils.sortKeys(t), 'Sorted');
$('stats').onclick = () => run(t => JSONUtils.stats(t), 'Stats');

// Convert dropdown
document.querySelectorAll('.dropdown-item').forEach(item => {
  item.onclick = () => {
    const convertType = item.dataset.convert;
    const text = input.value.trim();
    if (!text) { setStatus('Enter JSON', 'error'); return; }

    let r;
    switch (convertType) {
      case 'yaml': r = JSONUtils.toYAML(text); break;
      case 'xml': r = JSONUtils.toXML(text); break;
      case 'csv': r = JSONUtils.toCSV(text); break;
      case 'toml': r = JSONUtils.toTOML(text); break;
      case 'base64': r = JSONUtils.encodeBase64(text); break;
      case 'url': r = JSONUtils.urlEncode(text); break;
    }

    if (r && r.success) {
      result = r.result;
      output.textContent = result;
      setStatus('Done', 'success');
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

loadSettings();

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.querySelector('.dropdown');
  if (dropdown && !dropdown.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});

// Toggle dropdown on click
const convertBtn = $('convertBtn');
if (convertBtn) {
  convertBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelector('.dropdown').classList.toggle('active');
  });
}