// JSON Zen - Core JSON Utilities

const JSONUtils = {
  /**
   * Format/prettify JSON with configurable indentation
   */
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

  /**
   * Minify JSON by removing all whitespace
   */
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

  /**
   * Validate JSON and return detailed error info
   */
  validate: function(jsonString) {
    try {
      JSON.parse(jsonString);
      return {
        valid: true,
        error: null,
        errorPosition: null
      };
    } catch (e) {
      const match = e.message.match(/position (\d+)/);
      const position = match ? parseInt(match[1], 10) : null;
      return {
        valid: false,
        error: e.message,
        errorPosition: position
      };
    }
  },

  /**
   * Fix common JSON issues
   */
  fix: function(jsonString) {
    let fixed = jsonString;

    // Track changes for reporting
    const changes = [];

    // 1. Remove single-line comments (// ...)
    if (fixed.includes('//')) {
      fixed = fixed.replace(/\/\/[^\n]*/g, '');
      changes.push('Removed single-line comments');
    }

    // 2. Remove multi-line comments (/* ... */)
    if (fixed.includes('/*')) {
      fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
      changes.push('Removed multi-line comments');
    }

    // 3. Replace single quotes with double quotes
    // Only for strings that are not already double-quoted
    if (fixed.includes("'")) {
      const original = fixed;
      // Match single-quoted strings that are not escaped
      fixed = fixed.replace(/'([^'\\]|\\.)*'/g, (match) => {
        return '"' + match.slice(1, -1).replace(/\\'/g, "'").replace(/"/g, '\\"') + '"';
      });
      if (original !== fixed) {
        changes.push('Replaced single quotes with double quotes');
      }
    }

    // 4. Add quotes to unquoted keys
    const unquotedKeyRegex = /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g;
    if (fixed.match(unquotedKeyRegex)) {
      const original = fixed;
      fixed = fixed.replace(unquotedKeyRegex, '$1"$2"$3');
      if (original !== fixed) {
        changes.push('Added quotes to unquoted keys');
      }
    }

    // 5. Remove trailing commas
    if (fixed.includes(',')) {
      const original = fixed;
      fixed = fixed.replace(/,\s*([\]}])/g, '$1');
      if (original !== fixed) {
        changes.push('Removed trailing commas');
      }
    }

    // 6. Fix common typos
    const typos = {
      'falue': 'false',
      'ture': 'true',
      'undefiend': 'null',
      'nul': 'null'
    };
    for (const [typo, correct] of Object.entries(typos)) {
      if (fixed.includes(typo)) {
        const regex = new RegExp(`\\b${typo}\\b`, 'g');
        const original = fixed;
        fixed = fixed.replace(regex, correct);
        if (original !== fixed) {
          changes.push(`Fixed typo: ${typo} → ${correct}`);
        }
      }
    }

    // 7. Try to parse and validate the result
    try {
      const parsed = JSON.parse(fixed);
      return {
        success: true,
        result: JSON.stringify(parsed, null, 2),
        changes: changes,
        error: null
      };
    } catch (e) {
      // Try more aggressive fixes for missing brackets
      let attempt = fixed;

      // Count brackets
      const openBraces = (attempt.match(/{/g) || []).length;
      const closeBraces = (attempt.match(/}/g) || []).length;
      const openBrackets = (attempt.match(/\[/g) || []).length;
      const closeBrackets = (attempt.match(/\]/g) || []).length;

      // Add missing closing brackets
      while (closeBraces < openBraces) {
        attempt += '}';
        changes.push('Added missing closing brace');
      }
      while (closeBrackets < openBrackets) {
        attempt += ']';
        changes.push('Added missing closing bracket');
      }

      // Try to parse again
      try {
        const parsed = JSON.parse(attempt);
        return {
          success: true,
          result: JSON.stringify(parsed, null, 2),
          changes: changes,
          error: null
        };
      } catch (e2) {
        return {
          success: false,
          result: null,
          changes: changes,
          error: e2.message
        };
      }
    }
  },

  /**
   * Apply syntax highlighting to JSON string
   */
  highlight: function(jsonString) {
    if (!jsonString) return '';

    // Escape HTML first
    let highlighted = jsonString
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Apply syntax highlighting
    // Keys (before colon)
    highlighted = highlighted.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:))/g,
      '<span class="json-key">$1</span>'
    );

    // Strings
    highlighted = highlighted.replace(
      /:("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")/g,
      ':<span class="json-string">$1</span>'
    );

    // Numbers
    highlighted = highlighted.replace(
      /:\s*(-?\d+\.?\d*([eE][+-]?\d+)?)/g,
      ':<span class="json-number">$1</span>'
    );

    // Booleans
    highlighted = highlighted.replace(
      /:\s*(true|false)/g,
      ':<span class="json-boolean">$1</span>'
    );

    // Null
    highlighted = highlighted.replace(
      /:\s*(null)/g,
      ':<span class="json-null">$1</span>'
    );

    return highlighted;
  },

  /**
   * Sort object keys alphabetically
   */
  sortKeys: function(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;

      const sortObject = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(item => sortObject(item));
        }
        if (obj !== null && typeof obj === 'object') {
          const sorted = {};
          Object.keys(obj).sort().forEach(key => {
            sorted[key] = sortObject(obj[key]);
          });
          return sorted;
        }
        return obj;
      };

      const sorted = sortObject(parsed);
      return {
        success: true,
        result: JSON.stringify(sorted, null, 2),
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

  /**
   * Remove null values from JSON
   */
  removeNulls: function(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;

      const removeNulls = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(item => removeNulls(item)).filter(item => item !== null);
        }
        if (obj !== null && typeof obj === 'object') {
          const result = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value !== null) {
              result[key] = removeNulls(value);
            }
          }
          return result;
        }
        return obj;
      };

      const cleaned = removeNulls(parsed);
      return {
        success: true,
        result: JSON.stringify(cleaned, null, 2),
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

  /**
   * Encode JSON to Base64
   */
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

  /**
   * Decode JSON from Base64
   */
  decodeBase64: function(base64String) {
    try {
      const str = decodeURIComponent(escape(atob(base64String)));
      const parsed = JSON.parse(str);
      return {
        success: true,
        result: JSON.stringify(parsed, null, 2),
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

  /**
   * URL-safe JSON encoding
   */
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
  },

  /**
   * Get character count
   */
  getCharCount: function(jsonString) {
    return jsonString ? jsonString.length : 0;
  },

  /**
   * Get line count
   */
  getLineCount: function(jsonString) {
    return jsonString ? jsonString.split('\n').length : 0;
  },

  // ==================== CONVERSIONS ====================

  /**
   * Convert JSON to YAML
   */
  toYAML: function(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const yaml = this._jsonToYaml(parsed, 0);
      return { success: true, result: yaml, error: null };
    } catch (e) {
      return { success: false, result: null, error: e.message };
    }
  },

  _jsonToYaml: function(obj, indent) {
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
        const value = this._jsonToYaml(item, indent + 1);
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
          return spaces + key + ':\n' + this._jsonToYaml(value, indent + 1);
        }
        return spaces + key + ': ' + this._jsonToYaml(value, indent + 1);
      }).join('\n');
    }

    return String(obj);
  },

  /**
   * Convert JSON to XML
   */
  toXML: function(jsonString, rootName = 'root') {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<' + rootName + '>\n' +
        this._jsonToXml(parsed, '  ') +
        '\n</' + rootName + '>';
      return { success: true, result: xml, error: null };
    } catch (e) {
      return { success: false, result: null, error: e.message };
    }
  },

  _jsonToXml: function(obj, indent) {
    if (obj === null) return indent + '<null/>';
    if (typeof obj === 'boolean') return indent + '<boolean>' + obj + '</boolean>';
    if (typeof obj === 'number') return indent + '<number>' + obj + '</number>';
    if (typeof obj === 'string') {
      return indent + '<string>' + obj.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</string>';
    }

    if (Array.isArray(obj)) {
      return obj.map((item, i) => {
        return indent + '<item>\n' + this._jsonToXml(item, indent + '  ') + '\n' + indent + '</item>';
      }).join('\n');
    }

    if (typeof obj === 'object') {
      return Object.entries(obj).map(([key, value]) => {
        const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
        if (typeof value === 'object' && value !== null) {
          return indent + '<' + safeKey + '>\n' + this._jsonToXml(value, indent + '  ') + '\n' + indent + '</' + safeKey + '>';
        }
        return indent + '<' + safeKey + '>' + (value === null ? '' : this._jsonToXml(value, '').trim()) + '</' + safeKey + '>';
      }).join('\n');
    }

    return indent + String(obj);
  },

  /**
   * Convert JSON to CSV (for flat JSON arrays)
   */
  toCSV: function(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;

      if (!Array.isArray(parsed) || parsed.length === 0) {
        return { success: false, result: null, error: 'JSON must be an array of objects' };
      }

      // Get all unique keys
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

  /**
   * Convert JSON to TOML
   */
  toTOML: function(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const toml = this._jsonToToml(parsed, '');
      return { success: true, result: toml, error: null };
    } catch (e) {
      return { success: false, result: null, error: e.message };
    }
  },

  _jsonToToml: function(obj, prefix = '') {
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
          toml += this._jsonToToml(item, prefix + (prefix ? '.' : '') + (i + 1));
        } else {
          toml += prefix + (prefix ? '.' : '') + (i + 1) + ' = ' + this._jsonToToml(item) + '\n';
        }
      });
      return toml;
    }

    if (typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          toml += '[' + (prefix ? prefix + '.' : '') + safeKey + ']\n';
          toml += this._jsonToToml(value, (prefix ? prefix + '.' : '') + safeKey);
        } else {
          toml += (prefix ? prefix + '.' : '') + safeKey + ' = ' + this._jsonToToml(value) + '\n';
        }
      });
      return toml;
    }

    return String(obj);
  },

  /**
   * Parse YAML to JSON
   */
  fromYAML: function(yamlString) {
    // Simple YAML parser (basic support)
    try {
      const lines = yamlString.split('\n');
      const result = this._parseYamlLines(lines, 0);
      return { success: true, result: JSON.stringify(result, null, 2), error: null };
    } catch (e) {
      return { success: false, result: null, error: e.message };
    }
  },

  _parseYamlLines: function(lines, startIndex) {
    const obj = {};
    let i = startIndex;

    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim() || line.trim().startsWith('#')) {
        i++;
        continue;
      }

      const match = line.match(/^(\s*)([^:]+):\s*(.*)$/);
      if (!match) {
        // Array item
        const arrMatch = line.match(/^(\s*)-\s*(.*)$/);
        if (arrMatch) {
          const value = arrMatch[2].trim();
          if (!Array.isArray(obj._array)) obj._array = [];
          obj._array.push(value || {});
        }
        i++;
        continue;
      }

      const indent = match[1].length;
      const key = match[2].trim();
      const value = match[3].trim();

      if (value === '' || value === 'null') {
        obj[key] = null;
      } else if (value === 'true') {
        obj[key] = true;
      } else if (value === 'false') {
        obj[key] = false;
      } else if (!isNaN(value)) {
        obj[key] = Number(value);
      } else if (value.startsWith('"') && value.endsWith('"')) {
        obj[key] = value.slice(1, -1);
      } else {
        obj[key] = value;
      }
      i++;
    }

    if (obj._array) {
      return obj._array;
    }
    return obj;
  },

  // ==================== JSON PATH ====================

  /**
   * Query JSON using JSONPath-like syntax
   */
  query: function(jsonString, path) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const result = this._queryPath(parsed, path);

      if (result === undefined) {
        return { success: false, result: null, error: 'Path not found' };
      }

      return {
        success: true,
        result: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result),
        error: null
      };
    } catch (e) {
      return { success: false, result: null, error: e.message };
    }
  },

  _queryPath: function(obj, path) {
    // Support: $.key, $.key.subkey, $[0], $.array[0], $.key.*, $["key"], $[0].name
    // Handle edge cases like $[0], $.arr[], and paths starting with bracket
    let normalizedPath = path.replace(/^\$/, '').replace(/^\./, '');

    // Handle bracket notation: $["key"] or $['key'] or $[0]
    // Convert to dot notation for easier parsing
    // Match both single and double quoted keys and numeric indices
    normalizedPath = normalizedPath.replace(/\[['"]?([^'"]+)['"]?\]/g, '.$1');
    normalizedPath = normalizedPath.replace(/\[(\d+)\]/g, '.$1'); // Convert [0] to .0

    const parts = normalizedPath.split(/\./).filter(p => p !== '');

    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;

      // Check if part contains array index like part[0]
      const indexMatch = part.match(/^(.+)\[(\d+)\]$/);
      if (indexMatch) {
        const key = indexMatch[1];
        const index = parseInt(indexMatch[2], 10);
        if (key) {
          // Access key then index: e.g., items[0]
          if (current[key] === null || current[key] === undefined) return undefined;
          current = current[key][index];
        } else {
          // Just an index like [0] at start of path
          current = current[index];
        }
        continue;
      }

      if (part === '*') {
        // Return all values
        if (Array.isArray(current)) return current;
        return Object.values(current);
      }

      // Check if part is a pure numeric index like "0"
      if (/^\d+$/.test(part)) {
        current = current[parseInt(part, 10)];
      } else {
        // Object key
        current = current[part];
      }
    }

    return current;
  },

  // ==================== ANALYTICS ====================

  /**
   * Get JSON statistics
   */
  stats: function(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const stats = this._analyzeJson(parsed);

      return {
        success: true,
        result: JSON.stringify(stats, null, 2),
        error: null
      };
    } catch (e) {
      return { success: false, result: null, error: e.message };
    }
  },

  _analyzeJson: function(obj, depth = 0) {
    const stats = {
      type: Array.isArray(obj) ? 'array' : (obj === null ? 'null' : typeof obj),
      depth: depth,
      keys: 0,
      arrayItems: 0,
      strings: 0,
      numbers: 0,
      booleans: 0,
      nulls: 0,
      size: JSON.stringify(obj).length
    };

    if (Array.isArray(obj)) {
      stats.arrayItems = obj.length;
      obj.forEach(item => {
        const childStats = this._analyzeJson(item, depth + 1);
        stats.strings += childStats.strings;
        stats.numbers += childStats.numbers;
        stats.booleans += childStats.booleans;
        stats.nulls += childStats.nulls;
        stats.depth = Math.max(stats.depth, childStats.depth);
      });
    } else if (typeof obj === 'object' && obj !== null) {
      stats.keys = Object.keys(obj).length;
      Object.values(obj).forEach(value => {
        const childStats = this._analyzeJson(value, depth + 1);
        stats.strings += childStats.strings;
        stats.numbers += childStats.numbers;
        stats.booleans += childStats.booleans;
        stats.nulls += childStats.nulls;
        stats.depth = Math.max(stats.depth, childStats.depth);
      });
    } else if (typeof obj === 'string') {
      stats.strings = 1;
    } else if (typeof obj === 'number') {
      stats.numbers = 1;
    } else if (typeof obj === 'boolean') {
      stats.booleans = 1;
    } else if (obj === null) {
      stats.nulls = 1;
    }

    return stats;
  },

  // ==================== PII REDACTION ====================

  /**
   * Redact PII (emails, phones, etc.)
   */
  redactPII: function(jsonString) {
    // If it's already an object, process directly
    if (typeof jsonString === 'object' && jsonString !== null) {
      const redacted = this._redactPII(jsonString);
      return {
        success: true,
        result: JSON.stringify(redacted, null, 2),
        error: null
      };
    }

    // If it's a string that looks like JSON, try to parse
    if (typeof jsonString === 'string') {
      // Check if it starts with { or [ (likely JSON)
      const trimmed = jsonString.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(jsonString);
          const redacted = this._redactPII(parsed);
          return {
            success: true,
            result: JSON.stringify(redacted, null, 2),
            error: null
          };
        } catch (e) {
          // Not valid JSON, treat as plain string
        }
      }

      // Handle plain string - look for PII patterns
      const result = this._redactPII(jsonString);
      return {
        success: true,
        result: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        error: null
      };
    }

    return { success: false, result: null, error: 'Invalid input' };
  },

  _redactPII: function(obj) {
    if (typeof obj === 'string') {
      // Email
      if (/\S+@\S+\.\S+/.test(obj)) {
        return '[EMAIL_REDACTED]';
      }
      // Phone (various formats)
      if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(obj)) {
        return '[PHONE_REDACTED]';
      }
      // SSN
      if (/\b\d{3}-\d{2}-\d{4}\b/.test(obj)) {
        return '[SSN_REDACTED]';
      }
      // Credit card
      if (/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(obj)) {
        return '[CC_REDACTED]';
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this._redactPII(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const redacted = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase().replace('_', '');
        // Check for sensitive keys (handle both snake_case and camelCase)
        if (lowerKey.includes('password') || lowerKey.includes('secret') ||
            lowerKey.includes('token') || lowerKey.includes('apikey') || lowerKey.includes('apikey')) {
          redacted[key] = '[REDACTED]';
        } else {
          redacted[key] = this._redactPII(value);
        }
      }
      return redacted;
    }

    return obj;
  },

  // ==================== ESCAPE/UNESCAPE ====================

  /**
   * Escape JSON string for use in code
   */
  escape: function(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const escaped = JSON.stringify(JSON.stringify(parsed));
      return { success: true, result: escaped, error: null };
    } catch (e) {
      // If not JSON, just escape the string
      return { success: true, result: JSON.stringify(jsonString), error: null };
    }
  },

  /**
   * Unescape JSON string from code
   */
  unescape: function(escapedString) {
    try {
      const unescaped = JSON.parse(escapedString);
      return { success: true, result: JSON.stringify(unescaped, null, 2), error: null };
    } catch (e) {
      return { success: false, result: null, error: e.message };
    }
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JSONUtils;
}
