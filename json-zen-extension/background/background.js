// JSON Zen - Background Service Worker

const THEME_ICON_THEMES = new Set([
  'dark',
  'light',
  'ocean',
  'sunset',
  'retro',
  'cyberpunk',
  'synthwave',
  'aurora',
  'nebula',
  'crystal',
  'system'
]);

function getIconPaths(theme = 'dark') {
  const resolvedTheme = THEME_ICON_THEMES.has(theme) ? theme : 'dark';
  return {
    16: `icons/themes/${resolvedTheme}-16.png`,
    32: `icons/themes/${resolvedTheme}-32.png`,
    48: `icons/themes/${resolvedTheme}-48.png`,
    128: `icons/themes/${resolvedTheme}-128.png`
  };
}

async function applyThemeActionIcon(theme) {
  try {
    await chrome.action.setIcon({ path: getIconPaths(theme) });
  } catch (e) {
    console.warn('Action icon update failed:', e);
  }
}

async function syncActionIconFromSettings() {
  try {
    const result = await chrome.storage.sync.get(['jsonZenTheme']);
    await applyThemeActionIcon(result.jsonZenTheme || 'dark');
  } catch (e) {
    console.warn('Action icon sync failed:', e);
  }
}

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  // Open the popup when a command is received
  chrome.action.openPopup().catch(() => {
    // If popup can't be opened, try sending to active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { command: command.replace('-json', '') }).catch(() => {});
      }
    });
  });
});

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  syncActionIconFromSettings();

  try {
    chrome.contextMenus.create({
      id: 'json-zen-format',
      title: 'Format JSON',
      contexts: ['selection']
    });
    chrome.contextMenus.create({
      id: 'json-zen-minify',
      title: 'Minify JSON',
      contexts: ['selection']
    });
    chrome.contextMenus.create({
      id: 'json-zen-fix',
      title: 'Fix JSON',
      contexts: ['selection']
    });
    chrome.contextMenus.create({
      id: 'json-zen-validate',
      title: 'Validate JSON',
      contexts: ['selection']
    });
  } catch (e) {
    console.warn('Context menu error:', e);
  }
});

chrome.runtime.onStartup?.addListener(() => {
  syncActionIconFromSettings();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.jsonZenTheme) {
    applyThemeActionIcon(changes.jsonZenTheme.newValue || 'dark');
  }
});

syncActionIconFromSettings();

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText || !tab) return;

  const command = info.menuItemId.replace('json-zen-', '');

  chrome.tabs.sendMessage(tab.id, {
    command: command,
    json: info.selectionText
  }).catch(() => {
    console.log('No content script available on this page');
  });
});
