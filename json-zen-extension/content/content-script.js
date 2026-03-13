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

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
