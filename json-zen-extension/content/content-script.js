// JSON Zen - Content Script
// Handles context menu actions and replaces selected text with processed JSON

(function() {
  'use strict';

  // Minimal JSON utilities for content script
  const JSONOps = {
    format(text) {
      try {
        return { success: true, result: JSON.stringify(JSON.parse(text), null, 2) };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    minify(text) {
      try {
        return { success: true, result: JSON.stringify(JSON.parse(text)) };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    fix(text) {
      let fixed = text;
      // Remove comments
      fixed = fixed.replace(/\/\/[^\n]*/g, '');
      fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
      // Replace single quotes
      fixed = fixed.replace(/'([^'\\]|\\.)*'/g, (m) =>
        '"' + m.slice(1, -1).replace(/\\'/g, "'").replace(/"/g, '\\"') + '"'
      );
      // Quote unquoted keys
      fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
      // Remove trailing commas
      fixed = fixed.replace(/,\s*([\]}])/g, '$1');
      try {
        return { success: true, result: JSON.stringify(JSON.parse(fixed), null, 2) };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    validate(text) {
      try {
        JSON.parse(text);
        return { valid: true };
      } catch (e) {
        return { valid: false, error: e.message };
      }
    }
  };

  // Show notification toast
  function showNotification(message, isError) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 2147483647;
      padding: 12px 20px; border-radius: 8px; font-family: -apple-system, sans-serif;
      font-size: 14px; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      background: ${isError ? '#ef4444' : '#22c55e'}; transition: opacity 0.3s;
    `;
    toast.textContent = 'JSON Zen: ' + message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // Replace selected text in editable fields
  function replaceSelection(newText) {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT' ||
        activeEl.isContentEditable)) {
      // For input/textarea elements
      if (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT') {
        const start = activeEl.selectionStart;
        const end = activeEl.selectionEnd;
        activeEl.value = activeEl.value.substring(0, start) + newText + activeEl.value.substring(end);
        activeEl.selectionStart = start;
        activeEl.selectionEnd = start + newText.length;
        activeEl.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        // ContentEditable
        document.execCommand('insertText', false, newText);
      }
      return true;
    }
    return false;
  }

  function hostnamesMatch(currentHost, targetHost) {
    return currentHost === targetHost ||
      currentHost.endsWith(`.${targetHost}`) ||
      targetHost.endsWith(`.${currentHost}`);
  }

  function isAuthLikeKey(key) {
    return /auth|token|bearer|jwt|session|csrf|xsrf|secret|api[_-]?key/i.test(key);
  }

  function collectStorageEntries(storage) {
    const entries = [];
    try {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        const value = storage.getItem(key);
        if (key && value !== null && isAuthLikeKey(key)) {
          entries.push({ key, value });
        }
      }
    } catch (e) {
      return [];
    }
    return entries;
  }

  function collectMetaTokens() {
    const selectors = [
      'meta[name="csrf-token"]',
      'meta[name="xsrf-token"]',
      'meta[name="csrf"]',
      'meta[name="auth-token"]',
      'meta[name="token"]',
      'input[name="csrfmiddlewaretoken"]',
      'input[name="_csrf"]'
    ];

    return selectors
      .map((selector) => document.querySelector(selector))
      .filter(Boolean)
      .map((element) => ({
        key: element.getAttribute('name') || element.getAttribute('id') || element.tagName.toLowerCase(),
        value: element.getAttribute('content') || element.value || ''
      }))
      .filter((entry) => entry.value);
  }

  function firstMatchingValue(entries, pattern) {
    const match = entries.find((entry) => pattern.test(entry.key));
    return match ? match.value : null;
  }

  function collectPageAuthContext(targetHost) {
    const currentHost = location.hostname;
    if (!hostnamesMatch(currentHost, targetHost)) {
      return {
        matched: false,
        hostname: currentHost,
        reason: `Active tab host ${currentHost} does not match ${targetHost}`
      };
    }

    const localStorageEntries = collectStorageEntries(window.localStorage);
    const sessionStorageEntries = collectStorageEntries(window.sessionStorage);
    const metaTokens = collectMetaTokens();
    const combined = [...localStorageEntries, ...sessionStorageEntries, ...metaTokens];

    return {
      matched: true,
      hostname: currentHost,
      url: location.href,
      localStorageEntries,
      sessionStorageEntries,
      metaTokens,
      csrfToken: firstMatchingValue(combined, /csrf|xsrf/i),
      sessionToken: firstMatchingValue(combined, /auth|bearer|jwt|session|token/i),
      storageToken: firstMatchingValue([...localStorageEntries, ...sessionStorageEntries], /auth|bearer|jwt|session|token/i)
    };
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'jsonZen:getPageAuthContext') {
      try {
        const context = collectPageAuthContext(message.targetHost);
        sendResponse({ ok: true, context });
      } catch (e) {
        sendResponse({ ok: false, error: e.message });
      }
      return;
    }

    const { command, json } = message;
    if (!command || !json) return;

    let result;
    switch (command) {
      case 'format':
        result = JSONOps.format(json);
        if (result.success) {
          if (!replaceSelection(result.result)) {
            navigator.clipboard.writeText(result.result).then(() => {
              showNotification('Formatted JSON copied to clipboard');
            });
          } else {
            showNotification('JSON formatted');
          }
        } else {
          showNotification('Invalid JSON: ' + result.error, true);
        }
        break;

      case 'minify':
        result = JSONOps.minify(json);
        if (result.success) {
          if (!replaceSelection(result.result)) {
            navigator.clipboard.writeText(result.result).then(() => {
              showNotification('Minified JSON copied to clipboard');
            });
          } else {
            showNotification('JSON minified');
          }
        } else {
          showNotification('Invalid JSON: ' + result.error, true);
        }
        break;

      case 'fix':
        result = JSONOps.fix(json);
        if (result.success) {
          if (!replaceSelection(result.result)) {
            navigator.clipboard.writeText(result.result).then(() => {
              showNotification('Fixed JSON copied to clipboard');
            });
          } else {
            showNotification('JSON fixed');
          }
        } else {
          showNotification('Could not fix JSON: ' + result.error, true);
        }
        break;

      case 'validate':
        result = JSONOps.validate(json);
        if (result.valid) {
          showNotification('Valid JSON!');
        } else {
          showNotification('Invalid JSON: ' + result.error, true);
        }
        break;
    }

    sendResponse({ received: true });
  });
})();
