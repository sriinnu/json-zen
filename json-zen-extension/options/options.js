// JSON Zen - Options Script

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const indentSize = document.getElementById('indent-size');
  const theme = document.getElementById('theme');
  const autoCopy = document.getElementById('auto-copy');
  const autoFormat = document.getElementById('auto-format');
  const saveBtn = document.getElementById('save-btn');
  const resetBtn = document.getElementById('reset-btn');

  // Default settings
  const defaults = {
    indentSize: '2',
    theme: 'dark',
    autoCopy: false,
    autoFormat: false
  };

  // Load settings
  function loadSettings() {
    chrome.storage.sync.get(defaults, (items) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to load settings:', chrome.runtime.lastError);
        showMessage('Failed to load settings', 'error');
        return;
      }
      try {
        indentSize.value = items.indentSize;
        theme.value = items.theme;
        autoCopy.checked = items.autoCopy;
        autoFormat.checked = items.autoFormat;
      } catch (e) {
        console.error('Error applying settings:', e);
        showMessage('Error applying settings', 'error');
      }
    });
  }

  // Save settings
  function saveSettings() {
    const settings = {
      indentSize: indentSize.value,
      theme: theme.value,
      autoCopy: autoCopy.checked,
      autoFormat: autoFormat.checked
    };

    chrome.storage.sync.set(settings, () => {
      showMessage('Settings saved!', 'success');
    });
  }

  // Reset settings
  function resetSettings() {
    chrome.storage.sync.set(defaults, () => {
      loadSettings();
      showMessage('Settings reset to defaults', 'success');
    });
  }

  // Show message
  function showMessage(text, type) {
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.textContent = text;
    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 2000);
  }

  // Event listeners
  saveBtn.addEventListener('click', saveSettings);
  resetBtn.addEventListener('click', resetSettings);

  // Load on start
  loadSettings();
});
