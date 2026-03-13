// JSON Zen - Web Worker for Bulk Processing
// This worker handles JSON operations in separate threads

// Import JSONUtils logic (we'll need to redefine it here since workers can't import scripts directly)
const JSONUtils = {
  format: function(jsonString, indent = 2) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      return {
        success: true,
        result: JSON.stringify(parsed, null, indent),
        error: null
      };
    } catch (e) {
      return {
        success: false,
        result: null,
        error: e.message
      };
    }
  },

  minify: function(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      return {
        success: true,
        result: JSON.stringify(parsed),
        error: null
      };
    } catch (e) {
      return {
        success: false,
        result: null,
        error: e.message
      };
    }
  },

  validate: function(jsonString) {
    try {
      JSON.parse(jsonString);
      return {
        valid: true,
        error: null
      };
    } catch (e) {
      return {
        valid: false,
        error: e.message
      };
    }
  },

  fix: function(jsonString) {
    let fixed = jsonString;
    const changes = [];

    // Remove single-line comments
    if (fixed.includes('//')) {
      fixed = fixed.replace(/\/\/[^\n]*/g, '');
      changes.push('Removed single-line comments');
    }

    // Remove multi-line comments
    if (fixed.includes('/*')) {
      fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
      changes.push('Removed multi-line comments');
    }

    // Replace single quotes with double quotes
    if (fixed.includes("'")) {
      const original = fixed;
      fixed = fixed.replace(/'([^'\\]|\\.)*'/g, (match) => {
        return '"' + match.slice(1, -1).replace(/\\'/g, "'").replace(/"/g, '\\"') + '"';
      });
      if (original !== fixed) {
        changes.push('Replaced single quotes with double quotes');
      }
    }

    // Add quotes to unquoted keys
    const unquotedKeyRegex = /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g;
    if (fixed.match(unquotedKeyRegex)) {
      const original = fixed;
      fixed = fixed.replace(unquotedKeyRegex, '$1"$2"$3');
      if (original !== fixed) {
        changes.push('Added quotes to unquoted keys');
      }
    }

    // Remove trailing commas
    if (fixed.includes(',')) {
      const original = fixed;
      fixed = fixed.replace(/,\s*([\]}])/g, '$1');
      if (original !== fixed) {
        changes.push('Removed trailing commas');
      }
    }

    // Try to parse
    try {
      const parsed = JSON.parse(fixed);
      return {
        success: true,
        result: JSON.stringify(parsed, null, 2),
        changes: changes,
        error: null
      };
    } catch (e) {
      return {
        success: false,
        result: null,
        changes: changes,
        error: e.message
      };
    }
  },

  toYAML: function(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const yaml = jsonToYaml(parsed, 0);
      return { success: true, result: yaml, error: null };
    } catch (e) {
      return { success: false, result: null, error: e.message };
    }
  },

  toXML: function(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n' +
        jsonToXml(parsed, '  ') +
        '\n</root>';
      return { success: true, result: xml, error: null };
    } catch (e) {
      return { success: false, result: null, error: e.message };
    }
  },

  toCSV: function(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;

      if (!Array.isArray(parsed) || parsed.length === 0) {
        return { success: false, result: null, error: 'JSON must be an array of objects' };
      }

      const allKeys = new Set();
      parsed.forEach(obj => {
        if (typeof obj === 'object' && obj !== null) {
          Object.keys(obj).forEach(k => allKeys.add(k));
        }
      });

      const headers = Array.from(allKeys);
      const csvRows = [headers.join(',')];

      parsed.forEach(obj => {
        const row = headers.map(header => {
          const value = obj[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string') {
            return '"' + value.replace(/"/g, '""') + '"';
          }
          return String(value);
        });
        csvRows.push(row.join(','));
      });

      return { success: true, result: csvRows.join('\n'), error: null };
    } catch (e) {
      return { success: false, result: null, error: e.message };
    }
  },

  toTOML: function(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const toml = jsonToToml(parsed, '');
      return { success: true, result: toml, error: null };
    } catch (e) {
      return { success: false, result: null, error: e.message };
    }
  },

  encodeBase64: function(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const str = JSON.stringify(parsed);
      return {
        success: true,
        result: btoa(unescape(encodeURIComponent(str))),
        error: null
      };
    } catch (e) {
      return {
        success: false,
        result: null,
        error: e.message
      };
    }
  },

  urlEncode: function(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      return {
        success: true,
        result: encodeURIComponent(JSON.stringify(parsed)),
        error: null
      };
    } catch (e) {
      return {
        success: false,
        result: null,
        error: e.message
      };
    }
  }
};

// Helper functions
function jsonToYaml(obj, indent) {
  const spaces = '  '.repeat(indent);

  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return obj.toString();
  if (typeof obj === 'number') return obj.toString();
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
      return '"' + obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map(item => {
      const value = jsonToYaml(item, indent + 1);
      if (typeof item === 'object' && item !== null) {
        return spaces + '- ' + value.replace(new RegExp('^' + spaces + '  '), '');
      }
      return spaces + '- ' + value;
    }).join('\n');
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    return keys.map(key => {
      const value = obj[key];
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return spaces + key + ':\n' + jsonToYaml(value, indent + 1);
      }
      return spaces + key + ': ' + jsonToYaml(value, indent + 1);
    }).join('\n');
  }

  return String(obj);
}

function jsonToXml(obj, indent) {
  if (obj === null) return indent + '<null/>';
  if (typeof obj === 'boolean') return indent + '<boolean>' + obj + '</boolean>';
  if (typeof obj === 'number') return indent + '<number>' + obj + '</number>';
  if (typeof obj === 'string') {
    return indent + '<string>' + obj.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</string>';
  }

  if (Array.isArray(obj)) {
    return obj.map((item, i) => {
      return indent + '<item>\n' + jsonToXml(item, indent + '  ') + '\n' + indent + '</item>';
    }).join('\n');
  }

  if (typeof obj === 'object') {
    return Object.entries(obj).map(([key, value]) => {
      const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
      if (typeof value === 'object' && value !== null) {
        return indent + '<' + safeKey + '>\n' + jsonToXml(value, indent + '  ') + '\n' + indent + '</' + safeKey + '>';
      }
      return indent + '<' + safeKey + '>' + (value === null ? '' : jsonToXml(value, '').trim()) + '</' + safeKey + '>';
    }).join('\n');
  }

  return indent + String(obj);
}

function jsonToToml(obj, prefix = '') {
  let toml = '';

  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return obj.toString();
  if (typeof obj === 'number') return obj.toString();
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes('"') || obj.includes('#')) {
      return '"' + obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
    }
    return '"' + obj + '"';
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      if (typeof item === 'object' && item !== null) {
        toml += jsonToToml(item, prefix + (prefix ? '.' : '') + (i + 1));
      } else {
        toml += prefix + (prefix ? '.' : '') + (i + 1) + ' = ' + jsonToToml(item) + '\n';
      }
    });
    return toml;
  }

  if (typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        toml += '[' + (prefix ? prefix + '.' : '') + safeKey + ']\n';
        toml += jsonToToml(value, (prefix ? prefix + '.' : '') + safeKey);
      } else {
        toml += (prefix ? prefix + '.' : '') + safeKey + ' = ' + jsonToToml(value) + '\n';
      }
    });
    return toml;
  }

  return String(obj);
}

// Message handler
self.onmessage = function(e) {
  const { type, content, operation, convertFormat, fileId } = e.data;

  try {
    let result;

    switch (operation) {
      case 'format':
        result = JSONUtils.format(content, 2);
        break;
      case 'minify':
        result = JSONUtils.minify(content);
        break;
      case 'fix':
        result = JSONUtils.fix(content);
        break;
      case 'validate':
        result = JSONUtils.validate(content);
        if (result.valid) {
          result.result = 'Valid JSON';
          result.success = true;
        }
        break;
      case 'convert':
        switch (convertFormat) {
          case 'yaml':
            result = JSONUtils.toYAML(content);
            break;
          case 'xml':
            result = JSONUtils.toXML(content);
            break;
          case 'csv':
            result = JSONUtils.toCSV(content);
            break;
          case 'toml':
            result = JSONUtils.toTOML(content);
            break;
          case 'base64':
            result = JSONUtils.encodeBase64(content);
            break;
          case 'url':
            result = JSONUtils.urlEncode(content);
            break;
          default:
            result = { success: false, error: 'Unknown convert format' };
        }
        break;
      default:
        result = { success: false, error: 'Unknown operation' };
    }

    self.postMessage({
      fileId: fileId,
      success: result.success || result.valid,
      result: result.result,
      error: result.error,
      changes: result.changes
    });

  } catch (error) {
    self.postMessage({
      fileId: fileId,
      success: false,
      result: null,
      error: error.message
    });
  }
};
