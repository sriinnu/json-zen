// JSON Zen - Background Service Worker
// Minimal version to avoid registration issues

// Handle keyboard shortcuts - they will only work if there's a content script
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
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

  // Try to send to content script
  try {
    chrome.tabs.sendMessage(tab.id, {
      command: command,
      json: info.selectionText
    }, (response) => {
      if (chrome.runtime.lastError) {
        // No content script - that's okay
        console.log('No content script available');
      }
    });
  } catch (e) {
    console.warn('Message send error:', e);
  }
});

console.log('JSON Zen background service worker loaded');
