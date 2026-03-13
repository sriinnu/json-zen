// JSON Zen - Background Service Worker

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
