// JSON Zen — Background Service Worker
// Owns: side panel + workspace window lifecycle, install splash, context menus, keyboard commands.

const WORKSPACE_URL = 'popup/popup.html';
const WORKSPACE_WIDTH = 1280;
const WORKSPACE_HEIGHT = 820;
const SPLASH_URL = 'options/splash.html';

// Default behavior: clicking the toolbar icon opens the side panel.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(err =>
  console.warn('sidePanel.setPanelBehavior failed:', err)
);

async function popOutWorkspaceWindow(commandHint) {
  const url = chrome.runtime.getURL(WORKSPACE_URL);
  const existing = await chrome.windows.getAll({ populate: true, windowTypes: ['popup'] });
  const match = existing.find(w => (w.tabs || []).some(t => t.url && t.url.startsWith(url)));

  if (match) {
    await chrome.windows.update(match.id, { focused: true, state: 'normal' });
    if (commandHint) {
      const tab = (match.tabs || []).find(t => t.url && t.url.startsWith(url));
      if (tab) chrome.tabs.sendMessage(tab.id, { command: commandHint }).catch(() => {});
    }
    return match;
  }

  const qs = commandHint ? `?mode=window&cmd=${encodeURIComponent(commandHint)}` : '?mode=window';
  return chrome.windows.create({
    url: `${WORKSPACE_URL}${qs}`,
    type: 'popup',
    width: WORKSPACE_WIDTH,
    height: WORKSPACE_HEIGHT
  });
}

// Pop-out trigger from inside the side panel.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'jsonzen:popout') {
    popOutWorkspaceWindow().then(() => sendResponse({ ok: true })).catch(err => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
});

// Keyboard shortcuts → open the side panel on the active tab and forward the command.
chrome.commands.onCommand.addListener(async (command) => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.sidePanel.open({ tabId: tab.id });
      chrome.runtime.sendMessage({ type: 'jsonzen:command', command: command.replace('-json', '') }).catch(() => {});
    }
  } catch (err) {
    console.warn('command handler failed:', err);
  }
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  try {
    chrome.contextMenus.create({ id: 'json-zen-format', title: 'Format JSON', contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'json-zen-minify', title: 'Minify JSON', contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'json-zen-fix', title: 'Fix JSON', contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'json-zen-validate', title: 'Validate JSON', contexts: ['selection'] });
  } catch (e) {
    console.warn('context menu setup failed:', e);
  }

  if (reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL(SPLASH_URL) }).catch(() => {});
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText || !tab) return;
  const command = info.menuItemId.replace('json-zen-', '');
  chrome.tabs.sendMessage(tab.id, { command, json: info.selectionText }).catch(() => {});
});
