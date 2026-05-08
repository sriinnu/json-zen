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

  toBase64: function(jsonString) {
    return this.encodeBase64(jsonString);
  },

  fromBase64: function(base64String) {
    return this.decodeBase64(base64String);
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

  queryPath: function(jsonString, path) {
    const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    return this._queryPath(parsed, path);
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

  /**
   * Search JSON for keys and values matching a query
   */
  search: function(jsonString, query) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const results = [];
      const lowerQuery = query.toLowerCase();

      const searchObject = (obj, path = '$') => {
        if (obj === null || obj === undefined) return;

        if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            const itemPath = path + '[' + index + ']';
            searchObject(item, itemPath);
          });
        } else if (typeof obj === 'object') {
          Object.entries(obj).forEach(([key, value]) => {
            const keyPath = path === '$' ? '$.' + key : path + '.' + key;

            // Check if key matches
            if (key.toLowerCase().includes(lowerQuery)) {
              results.push({
                path: keyPath,
                key: key,
                value: value,
                type: Array.isArray(value) ? 'array' : (typeof value === 'object' ? 'object' : typeof value)
              });
            }

            // Check if value matches (for primitive values)
            if (typeof value === 'string' && value.toLowerCase().includes(lowerQuery)) {
              results.push({
                path: keyPath,
                key: key,
                value: value,
                type: 'string'
              });
            } else if (typeof value === 'number' && value.toString().includes(query)) {
              results.push({
                path: keyPath,
                key: key,
                value: value,
                type: 'number'
              });
            } else if (typeof value === 'boolean' && value.toString().includes(query)) {
              results.push({
                path: keyPath,
                key: key,
                value: value,
                type: 'boolean'
              });
            }

            // Recursively search nested objects and arrays
            if (typeof value === 'object' && value !== null) {
              searchObject(value, keyPath);
            }
          });
        }
      };

      searchObject(parsed);

      return {
        success: true,
        result: results,
        count: results.length,
        error: null
      };
    } catch (e) {
      return { success: false, result: [], count: 0, error: e.message };
    }
  },

  /**
   * Get the tree structure of JSON for navigation
   */
  getTreeStructure: function(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const tree = [];

      const buildTree = (obj, path = '$', depth = 0) => {
        if (obj === null || obj === undefined) {
          tree.push({ path, key: path.split('.').pop(), type: 'null', depth });
          return;
        }

        if (Array.isArray(obj)) {
          tree.push({ path, key: path.split('.').pop() || 'root', type: 'array', size: obj.length, depth });
          obj.forEach((item, index) => {
            buildTree(item, path + '[' + index + ']', depth + 1);
          });
        } else if (typeof obj === 'object') {
          const keys = Object.keys(obj);
          tree.push({ path, key: path.split('.').pop() || 'root', type: 'object', size: keys.length, depth });
          keys.forEach(key => {
            buildTree(obj[key], path === '$' ? '$.' + key : path + '.' + key, depth + 1);
          });
        } else {
          const type = typeof obj;
          const value = type === 'string' ? '"' + obj.substring(0, 20) + (obj.length > 20 ? '...' : '') + '"' : String(obj);
          tree.push({ path, key: path.split('.').pop(), type, value, depth });
        }
      };

      buildTree(parsed);

      return {
        success: true,
        result: tree,
        error: null
      };
    } catch (e) {
      return { success: false, result: [], error: e.message };
    }
  },

  /**
   * Format path for display (e.g., $.data.users[0].name)
   */
  formatPath: function(path) {
    return path;
  },

  /**
   * Get parent path
   */
  getParentPath: function(path) {
    // Remove last segment
    const lastDot = path.lastIndexOf('.');
    const lastBracket = path.lastIndexOf('[');

    if (lastBracket > lastDot) {
      // Path ends with array index
      const beforeBracket = path.substring(0, lastBracket);
      const dotBefore = beforeBracket.lastIndexOf('.');
      return dotBefore >= 0 ? beforeBracket.substring(0, dotBefore) : '$';
    } else if (lastDot > 0) {
      return path.substring(0, lastDot);
    }
    return '$';
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

  analyze: function(jsonString) {
    const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    const stats = this._analyzeJson(parsed);

    return {
      totalKeys: stats.keys,
      arrayItems: stats.arrayItems,
      strings: stats.strings,
      numbers: stats.numbers,
      booleans: stats.booleans,
      nulls: stats.nulls,
      maxDepth: stats.depth,
      sizeBytes: stats.size
    };
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
        stats.keys += childStats.keys;
        stats.arrayItems += childStats.arrayItems;
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
        stats.keys += childStats.keys;
        stats.arrayItems += childStats.arrayItems;
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

  flatten: function(jsonString, separator = '.') {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const flattened = {};

      const visit = (value, path = '') => {
        if (Array.isArray(value)) {
          if (value.length === 0) {
            flattened[path] = [];
            return;
          }
          value.forEach((item, index) => {
            const nextPath = path ? `${path}${separator}${index}` : String(index);
            visit(item, nextPath);
          });
          return;
        }

        if (value !== null && typeof value === 'object') {
          const entries = Object.entries(value);
          if (entries.length === 0) {
            flattened[path] = {};
            return;
          }
          entries.forEach(([key, nested]) => {
            const nextPath = path ? `${path}${separator}${key}` : key;
            visit(nested, nextPath);
          });
          return;
        }

        flattened[path] = value;
      };

      visit(parsed);

      return {
        success: true,
        result: JSON.stringify(flattened, null, 2),
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
  },

  // ==================== JSON SCHEMA VALIDATION (Draft 7) ====================

  /**
   * Validate JSON against a JSON Schema (Draft 7)
   */
  validateSchema: function(jsonString, schemaString) {
    try {
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const schema = typeof schemaString === 'string' ? JSON.parse(schemaString) : schemaString;

      const errors = this._validateAgainstSchema(data, schema, '', []);

      return {
        valid: errors.length === 0,
        errors: errors,
        error: null
      };
    } catch (e) {
      return {
        valid: false,
        errors: [{ path: 'root', message: e.message, line: 1 }],
        error: e.message
      };
    }
  },

  validateAgainstSchema: function(jsonString, schemaString) {
    return this.validateSchema(jsonString, schemaString);
  },

  /**
   * Internal schema validation implementation
   */
  _validateAgainstSchema: function(data, schema, path, errors) {
    // Check if schema has $ref
    if (schema.$ref) {
      // For simplicity, we don't resolve refs in this implementation
      return errors;
    }

    // Check type
    if (schema.type) {
      const typeError = this._validateType(data, schema.type, path);
      if (typeError) {
        errors.push(typeError);
        return errors; // Type mismatch, no need to continue
      }
    }

    // Check enum
    if (schema.enum) {
      if (!schema.enum.includes(data)) {
        errors.push({
          path: path,
          message: `Value must be one of: ${schema.enum.join(', ')}`,
          line: this._estimateLine(path)
        });
      }
    }

    // Check const
    if (schema.const !== undefined && data !== schema.const) {
      errors.push({
        path: path,
        message: `Value must be constant: ${JSON.stringify(schema.const)}`,
        line: this._estimateLine(path)
      });
    }

    // Type-specific validations
    const dataType = Array.isArray(data) ? 'array' : (data === null ? 'null' : typeof data);

    switch (dataType) {
      case 'string':
        this._validateString(data, schema, path, errors);
        break;
      case 'number':
        this._validateNumber(data, schema, path, errors);
        break;
      case 'object':
        if (!Array.isArray(data) && data !== null) {
          this._validateObject(data, schema, path, errors);
        }
        break;
      case 'array':
        this._validateArray(data, schema, path, errors);
        break;
    }

    return errors;
  },

  /**
   * Validate data type
   */
  _validateType: function(data, type, path) {
    const dataType = Array.isArray(data) ? 'array' : (data === null ? 'null' : typeof data);

    if (Array.isArray(type)) {
      if (!type.includes(dataType)) {
        return {
          path: path,
          message: `Type mismatch: expected one of [${type.join(', ')}], got ${dataType}`,
          line: this._estimateLine(path)
        };
      }
    } else if (dataType !== type) {
      return {
        path: path,
        message: `Type mismatch: expected ${type}, got ${dataType}`,
        line: this._estimateLine(path)
      };
    }

    return null;
  },

  /**
   * Validate string-specific constraints
   */
  _validateString: function(data, schema, path, errors) {
    // minLength
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push({
        path: path,
        message: `String length ${data.length} is less than minimum ${schema.minLength}`,
        line: this._estimateLine(path)
      });
    }

    // maxLength
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push({
        path: path,
        message: `String length ${data.length} exceeds maximum ${schema.maxLength}`,
        line: this._estimateLine(path)
      });
    }

    // pattern
    if (schema.pattern) {
      try {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(data)) {
          errors.push({
            path: path,
            message: `String does not match pattern: ${schema.pattern}`,
            line: this._estimateLine(path)
          });
        }
      } catch (e) {
        // Invalid regex, ignore
      }
    }

    // format
    if (schema.format) {
      const formatError = this._validateFormat(data, schema.format, path);
      if (formatError) {
        errors.push(formatError);
      }
    }
  },

  /**
   * Validate string format
   */
  _validateFormat: function(data, format, path) {
    const formats = {
      'email': /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'uri': /^https?:\/\/.+/i,
      'date-time': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,
      'date': /^\d{4}-\d{2}-\d{2}$/,
      'time': /^\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,
      'ipv4': /^(\d{1,3}\.){3}\d{1,3}$/,
      'ipv6': /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    };

    const regex = formats[format];
    if (regex && !regex.test(data)) {
      return {
        path: path,
        message: `String does not match format: ${format}`,
        line: this._estimateLine(path)
      };
    }

    return null;
  },

  /**
   * Validate number-specific constraints
   */
  _validateNumber: function(data, schema, path, errors) {
    // minimum
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push({
        path: path,
        message: `Value ${data} is less than minimum ${schema.minimum}`,
        line: this._estimateLine(path)
      });
    }

    // maximum
    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push({
        path: path,
        message: `Value ${data} exceeds maximum ${schema.maximum}`,
        line: this._estimateLine(path)
      });
    }

    // exclusiveMinimum
    if (schema.exclusiveMinimum !== undefined && data <= schema.exclusiveMinimum) {
      errors.push({
        path: path,
        message: `Value ${data} must be greater than ${schema.exclusiveMinimum}`,
        line: this._estimateLine(path)
      });
    }

    // exclusiveMaximum
    if (schema.exclusiveMaximum !== undefined && data >= schema.exclusiveMaximum) {
      errors.push({
        path: path,
        message: `Value ${data} must be less than ${schema.exclusiveMaximum}`,
        line: this._estimateLine(path)
      });
    }

    // multipleOf
    if (schema.multipleOf !== undefined) {
      if (data % schema.multipleOf !== 0) {
        errors.push({
          path: path,
          message: `Value ${data} is not a multiple of ${schema.multipleOf}`,
          line: this._estimateLine(path)
        });
      }
    }
  },

  /**
   * Validate object-specific constraints
   */
  _validateObject: function(data, schema, path, errors) {
    // required properties
    if (schema.required) {
      for (const prop of schema.required) {
        if (!(prop in data)) {
          errors.push({
            path: path ? `${path}.${prop}` : prop,
            message: `Required property "${prop}" is missing`,
            line: this._estimateLine(path)
          });
        }
      }
    }

    // properties validation
    if (schema.properties) {
      for (const [prop, propSchema] of Object.entries(schema.properties)) {
        if (prop in data) {
          const propPath = path ? `${path}.${prop}` : prop;
          this._validateAgainstSchema(data[prop], propSchema, propPath, errors);
        }
      }
    }

    // additionalProperties
    if (schema.additionalProperties === false && schema.properties) {
      for (const prop of Object.keys(data)) {
        if (!schema.properties.hasOwnProperty(prop)) {
          errors.push({
            path: path ? `${path}.${prop}` : prop,
            message: `Additional property "${prop}" not allowed`,
            line: this._estimateLine(path)
          });
        }
      }
    } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      for (const [prop, value] of Object.entries(data)) {
        if (!schema.properties || !schema.properties.hasOwnProperty(prop)) {
          const propPath = path ? `${path}.${prop}` : prop;
          this._validateAgainstSchema(value, schema.additionalProperties, propPath, errors);
        }
      }
    }

    // minProperties
    if (schema.minProperties !== undefined && Object.keys(data).length < schema.minProperties) {
      errors.push({
        path: path,
        message: `Object must have at least ${schema.minProperties} properties`,
        line: this._estimateLine(path)
      });
    }

    // maxProperties
    if (schema.maxProperties !== undefined && Object.keys(data).length > schema.maxProperties) {
      errors.push({
        path: path,
        message: `Object must have at most ${schema.maxProperties} properties`,
        line: this._estimateLine(path)
      });
    }

    // patternProperties
    if (schema.patternProperties) {
      for (const [pattern, patternSchema] of Object.entries(schema.patternProperties)) {
        try {
          const regex = new RegExp(pattern);
          for (const [prop, value] of Object.entries(data)) {
            if (regex.test(prop)) {
              const propPath = path ? `${path}.${prop}` : prop;
              this._validateAgainstSchema(value, patternSchema, propPath, errors);
            }
          }
        } catch (e) {
          // Invalid regex, ignore
        }
      }
    }
  },

  /**
   * Validate array-specific constraints
   */
  _validateArray: function(data, schema, path, errors) {
    // minItems
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push({
        path: path,
        message: `Array must have at least ${schema.minItems} items`,
        line: this._estimateLine(path)
      });
    }

    // maxItems
    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors.push({
        path: path,
        message: `Array must have at most ${schema.maxItems} items`,
        line: this._estimateLine(path)
      });
    }

    // uniqueItems
    if (schema.uniqueItems) {
      const seen = new Set();
      for (const item of data) {
        const itemStr = JSON.stringify(item);
        if (seen.has(itemStr)) {
          errors.push({
            path: path,
            message: `Array items must be unique, duplicate found`,
            line: this._estimateLine(path)
          });
          break;
        }
        seen.add(itemStr);
      }
    }

    // items validation
    if (schema.items) {
      if (Array.isArray(schema.items)) {
        // tuple validation
        for (let i = 0; i < schema.items.length; i++) {
          if (i < data.length) {
            const itemPath = `${path}[${i}]`;
            this._validateAgainstSchema(data[i], schema.items[i], itemPath, errors);
          }
        }
      } else {
        // list validation - all items must match schema
        for (let i = 0; i < data.length; i++) {
          const itemPath = `${path}[${i}]`;
          this._validateAgainstSchema(data[i], schema.items, itemPath, errors);
        }
      }
    }

    // contains
    if (schema.contains) {
      let valid = false;
      for (const item of data) {
        const itemErrors = [];
        this._validateAgainstSchema(item, schema.contains, `${path}[*]`, itemErrors);
        if (itemErrors.length === 0) {
          valid = true;
          break;
        }
      }
      if (!valid) {
        errors.push({
          path: path,
          message: `Array must contain at least one item matching the contains schema`,
          line: this._estimateLine(path)
        });
      }
    }
  },

  /**
   * Estimate line number from JSON path (rough approximation)
   */
  _estimateLine: function(path) {
    // This is a rough estimate - in a real implementation, you'd track line numbers
    // during parsing. For now, we'll return a heuristic based on path depth
    const depth = (path.match(/\./g) || []).length + (path.match(/\[/g) || []).length + 1;
    return Math.min(depth + 1, 999);
  },

  /**
   * Generate JSON Schema from sample JSON data
   */
  generateSchema: function(jsonString, options = {}) {
    try {
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const schema = this._generateSchemaFromData(data, options);

      return {
        success: true,
        result: JSON.stringify(schema, null, 2),
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
   * Internal schema generation from data
   */
  _generateSchemaFromData: function(data, options, depth = 0) {
    const { title = 'Generated Schema', description = 'Auto-generated from sample data' } = options;

    if (depth === 0) {
      const schema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: title,
        description: description,
        ...this._inferType(data)
      };

      return schema;
    }

    return this._inferType(data);
  },

  /**
   * Infer JSON Schema type from data
   */
  _inferType: function(data) {
    if (data === null) {
      return { type: 'null' };
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return { type: 'array' };
      }

      // Infer common schema for all items
      const itemSchemas = data.map(item => this._inferType(item));

      // Try to find common patterns
      const hasStrings = itemSchemas.some(s => s.type === 'string');
      const hasNumbers = itemSchemas.some(s => s.type === 'number');
      const hasBooleans = itemSchemas.some(s => s.type === 'boolean');
      const hasObjects = itemSchemas.some(s => s.type === 'object');
      const hasArrays = itemSchemas.some(s => s.type === 'array');

      if (hasStrings && !hasNumbers && !hasBooleans && !hasObjects && !hasArrays) {
        return {
          type: 'array',
          items: this._mergeStringFormats(data)
        };
      }

      if (itemSchemas.every(s => s.type === 'object')) {
        // Merge all object schemas
        const mergedProperties = {};
        const required = [];

        data.forEach(item => {
          if (item && typeof item === 'object') {
            Object.entries(item).forEach(([key, value]) => {
              if (!mergedProperties[key]) {
                mergedProperties[key] = this._inferType(value);
                // Check if property exists in all items
                if (data.every(i => i && typeof i === 'object' && key in i)) {
                  required.push(key);
                }
              }
            });
          }
        });

        return {
          type: 'array',
          items: {
            type: 'object',
            properties: mergedProperties,
            required: required.length > 0 ? required : undefined
          }
        };
      }

      return { type: 'array' };
    }

    if (typeof data === 'object') {
      const properties = {};
      const required = [];

      Object.entries(data).forEach(([key, value]) => {
        properties[key] = this._inferType(value);
      });

      return {
        type: 'object',
        properties: properties,
        required: Object.keys(properties)
      };
    }

    if (typeof data === 'string') {
      const schema = { type: 'string' };

      // Detect format
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
        schema.format = 'email';
      } else if (/^https?:\/\/.+/i.test(data)) {
        schema.format = 'uri';
      } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data)) {
        schema.format = 'date-time';
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        schema.format = 'date';
      }

      // Add length constraints from sample
      schema.minLength = data.length;
      schema.maxLength = data.length;

      return schema;
    }

    if (typeof data === 'number') {
      const schema = { type: 'number' };

      // Add range constraints from sample
      schema.minimum = data;
      schema.maximum = data;

      return schema;
    }

    if (typeof data === 'boolean') {
      return { type: 'boolean' };
    }

    return {};
  },

  /**
   * Merge string formats for array items
   */
  _mergeStringFormats: function(items) {
    const formats = new Set();
    const lengths = [];

    items.forEach(item => {
      if (typeof item === 'string') {
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item)) formats.add('email');
        else if (/^https?:\/\/.+/i.test(item)) formats.add('uri');
        lengths.push(item.length);
      }
    });

    const schema = { type: 'string' };

    if (formats.size === 1) {
      schema.format = Array.from(formats)[0];
    }

    if (lengths.length > 0) {
      schema.minLength = Math.min(...lengths);
      schema.maxLength = Math.max(...lengths);
    }

    return schema;
  },

  /**
   * Get predefined schema templates
   */
  getSchemaTemplate: function(templateName) {
    const templates = {
      user: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'User Profile',
        description: 'Schema for user profile data',
        type: 'object',
        required: ['id', 'name', 'email'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique user identifier',
            format: 'uuid'
          },
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          age: {
            type: 'number',
            minimum: 0,
            maximum: 150
          },
          isActive: {
            type: 'boolean',
            default: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              country: { type: 'string' },
              postalCode: { type: 'string' }
            }
          }
        }
      },

      config: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'Configuration',
        description: 'Application configuration schema',
        type: 'object',
        required: ['appName', 'version'],
        properties: {
          appName: {
            type: 'string',
            minLength: 1,
            maxLength: 50
          },
          version: {
            type: 'string',
            pattern: '^\\d+\\.\\d+\\.\\d+$'
          },
          debug: {
            type: 'boolean',
            default: false
          },
          port: {
            type: 'number',
            minimum: 1,
            maximum: 65535
          },
          features: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      },

      'api-response': {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'API Response',
        description: 'Standard API response schema',
        type: 'object',
        required: ['status', 'data'],
        properties: {
          status: {
            type: 'number',
            enum: [200, 201, 400, 401, 404, 500]
          },
          message: {
            type: 'string'
          },
          data: {
            type: 'object'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                field: { type: 'string' }
              }
            }
          }
        }
      },

      product: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'Product',
        description: 'E-commerce product schema',
        type: 'object',
        required: ['id', 'name', 'price'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 200
          },
          description: {
            type: 'string'
          },
          price: {
            type: 'number',
            minimum: 0
          },
          currency: {
            type: 'string',
            enum: ['USD', 'EUR', 'GBP', 'JPY']
          },
          inStock: {
            type: 'boolean'
          },
          tags: {
            type: 'array',
            items: {
              type: 'string'
            },
            uniqueItems: true
          }
        }
      },

      address: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'Address',
        description: 'Postal address schema',
        type: 'object',
        required: ['street', 'city', 'postalCode'],
        properties: {
          street: {
            type: 'string',
            minLength: 1
          },
          city: {
            type: 'string',
            minLength: 1
          },
          state: {
            type: 'string'
          },
          country: {
            type: 'string',
            minLength: 2,
            maxLength: 2
          },
          postalCode: {
            type: 'string',
            pattern: '^\\d{5}(-\\d{4})?$'
          }
        }
      }
    };

    return templates[templateName] || null;
  },

  // ==================== DIFF/COMPARE ====================

  /**
   * Compare two JSON strings and return differences
   */
  diff: function(jsonString1, jsonString2, mode = 'formatted') {
    try {
      const json1 = typeof jsonString1 === 'string' ? JSON.parse(jsonString1) : jsonString1;
      const json2 = typeof jsonString2 === 'string' ? JSON.parse(jsonString2) : jsonString2;

      // Format both JSONs based on mode
      const formatted1 = mode === 'formatted' ? JSON.stringify(json1, null, 2) : JSON.stringify(json1);
      const formatted2 = mode === 'formatted' ? JSON.stringify(json2, null, 2) : JSON.stringify(json2);

      // Split into lines
      const lines1 = formatted1.split('\n');
      const lines2 = formatted2.split('\n');

      // Compute diff using a simple algorithm
      const diffResult = this._computeDiff(lines1, lines2);

      return {
        success: true,
        result: diffResult,
        error: null,
        stats: diffResult.stats
      };
    } catch (e) {
      return {
        success: false,
        result: null,
        error: e.message,
        stats: null
      };
    }
  },

  /**
   * Compute diff between two line arrays
   */
  _computeDiff: function(lines1, lines2) {
    const maxLines = Math.max(lines1.length, lines2.length);
    const diffLines = [];
    const stats = {
      added: 0,
      removed: 0,
      modified: 0,
      unchanged: 0
    };

    // Create a map for faster lookups
    const map2 = new Map();
    lines2.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!map2.has(trimmed)) {
        map2.set(trimmed, []);
      }
      map2.get(trimmed).push(idx);
    });

    let i = 0, j = 0;
    const usedLines2 = new Set();

    while (i < lines1.length || j < lines2.length) {
      if (i < lines1.length && j < lines2.length) {
        const line1 = lines1[i];
        const line2 = lines2[j];
        const trimmed1 = line1.trim();
        const trimmed2 = line2.trim();

        if (trimmed1 === trimmed2) {
          // Lines are the same
          diffLines.push({
            type: 'unchanged',
            lineNumber: i + 1,
            content: line1
          });
          stats.unchanged++;
          i++;
          j++;
          usedLines2.add(j);
        } else {
          // Check if line1 exists later in lines2
          const indices = map2.get(trimmed1);
          const foundLater = indices && indices.some(idx => idx > j && !usedLines2.has(idx));

          if (foundLater) {
            // Line was removed
            diffLines.push({
              type: 'removed',
              lineNumber: i + 1,
              content: line1
            });
            stats.removed++;
            i++;
          } else {
            // Check if line2 existed in lines1
            const indices1 = this._findLineIndices(lines1, trimmed2, i);
            const foundEarlier = indices1.some(idx => idx <= i);

            if (foundEarlier) {
              // Line was removed
              diffLines.push({
                type: 'removed',
                lineNumber: i + 1,
                content: line1
              });
              stats.removed++;
              i++;
            } else {
              // Line is modified or added
              if (this._areLinesSimilar(line1, line2)) {
                diffLines.push({
                  type: 'modified',
                  lineNumber: i + 1,
                  content: line1,
                  newContent: line2
                });
                stats.modified++;
              } else {
                // Line added
                diffLines.push({
                  type: 'added',
                  lineNumber: j + 1,
                  content: line2
                });
                stats.added++;
              }
              i++;
              j++;
              usedLines2.add(j);
            }
          }
        }
      } else if (i < lines1.length) {
        // Remaining lines in first file are removed
        diffLines.push({
          type: 'removed',
          lineNumber: i + 1,
          content: lines1[i]
        });
        stats.removed++;
        i++;
      } else if (j < lines2.length) {
        // Remaining lines in second file are added
        diffLines.push({
          type: 'added',
          lineNumber: j + 1,
          content: lines2[j]
        });
        stats.added++;
        j++;
      }
    }

    return {
      lines: diffLines,
      stats: stats
    };
  },

  /**
   * Find all indices of a line in an array starting from a given position
   */
  _findLineIndices: function(lines, trimmedLine, startPos) {
    const indices = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === trimmedLine) {
        indices.push(i);
      }
    }
    return indices;
  },

  /**
   * Check if two lines are similar (for modified detection)
   */
  _areLinesSimilar: function(line1, line2) {
    // Remove all whitespace for comparison
    const clean1 = line1.replace(/\s+/g, '');
    const clean2 = line2.replace(/\s+/g, '');

    // If completely different, not similar
    if (clean1 === clean2) return true;

    // Check if they share a common structure (same keys)
    const keys1 = this._extractKeys(line1);
    const keys2 = this._extractKeys(line2);

    if (keys1.length > 0 && keys2.length > 0) {
      const intersection = keys1.filter(k => keys2.includes(k));
      return intersection.length > Math.min(keys1.length, keys2.length) / 2;
    }

    return false;
  },

  /**
   * Extract keys from a JSON line
   */
  _extractKeys: function(line) {
    const keyRegex = /"([^"]+)":/g;
    const keys = [];
    let match;
    while ((match = keyRegex.exec(line)) !== null) {
      keys.push(match[1]);
    }
    return keys;
  },

  /**
   * Get only the changed lines from a diff result
   */
  getChangesOnly: function(diffResult) {
    if (!diffResult || !diffResult.lines) {
      return {
        success: false,
        result: null,
        error: 'Invalid diff result'
      };
    }

    const changes = diffResult.lines.filter(line => line.type !== 'unchanged');
    const changesText = changes.map(line => {
      let prefix = '';
      if (line.type === 'added') prefix = '+ ';
      else if (line.type === 'removed') prefix = '- ';
      else if (line.type === 'modified') prefix = '~ ';

      return prefix + (line.newContent || line.content);
    }).join('\n');

    return {
      success: true,
      result: changesText,
      error: null
    };
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JSONUtils;
}
