/**
 * JSON Zen - Diff Engine Module
 * Compare two JSON objects and show differences
 */

const DiffEngine = {
  initialized: false,
  // Compare two JSON strings
  compare(left, right) {
    try {
      const leftObj = JSON.parse(left);
      const rightObj = JSON.parse(right);
      
      const diff = this.computeDiff(leftObj, rightObj);
      return {
        success: true,
        diff,
        stats: this.calculateStats(diff)
      };
    } catch (e) {
      return {
        success: false,
        error: e.message
      };
    }
  },

  // Compute structural diff
  computeDiff(left, right, path = '') {
    const changes = [];

    // Handle different types
    if (typeof left !== typeof right) {
      changes.push({
        type: 'modified',
        path,
        oldValue: left,
        newValue: right
      });
      return changes;
    }

    // Handle primitives
    if (typeof left !== 'object' || left === null || right === null) {
      if (left !== right) {
        changes.push({
          type: 'modified',
          path,
          oldValue: left,
          newValue: right
        });
      }
      return changes;
    }

    // Handle arrays
    if (Array.isArray(left) && Array.isArray(right)) {
      const maxLen = Math.max(left.length, right.length);
      for (let i = 0; i < maxLen; i++) {
        const itemPath = path ? `${path}[${i}]` : `[${i}]`;
        
        if (i >= left.length) {
          changes.push({
            type: 'added',
            path: itemPath,
            newValue: right[i]
          });
        } else if (i >= right.length) {
          changes.push({
            type: 'removed',
            path: itemPath,
            oldValue: left[i]
          });
        } else {
          const itemChanges = this.computeDiff(left[i], right[i], itemPath);
          changes.push(...itemChanges);
        }
      }
      return changes;
    }

    // Handle objects
    const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
    
    for (const key of allKeys) {
      const keyPath = path ? `${path}.${key}` : key;
      
      if (!(key in left)) {
        changes.push({
          type: 'added',
          path: keyPath,
          newValue: right[key]
        });
      } else if (!(key in right)) {
        changes.push({
          type: 'removed',
          path: keyPath,
          oldValue: left[key]
        });
      } else {
        const nestedChanges = this.computeDiff(left[key], right[key], keyPath);
        changes.push(...nestedChanges);
      }
    }

    return changes;
  },

  // Calculate diff statistics
  calculateStats(changes) {
    return {
      added: changes.filter(c => c.type === 'added').length,
      removed: changes.filter(c => c.type === 'removed').length,
      modified: changes.filter(c => c.type === 'modified').length,
      total: changes.length
    };
  },

  // Format diff for display
  formatDiff(left, right, changes) {
    const lines = [];
    const leftLines = JSON.stringify(left, null, 2).split('\n');
    const rightLines = JSON.stringify(right, null, 2).split('\n');
    
    // Simple line-by-line diff for display
    let leftIdx = 0;
    let rightIdx = 0;
    
    while (leftIdx < leftLines.length || rightIdx < rightLines.length) {
      const leftLine = leftLines[leftIdx] || '';
      const rightLine = rightLines[rightIdx] || '';
      
      if (leftLine === rightLine) {
        lines.push({
          type: 'unchanged',
          left: leftLine,
          right: rightLine,
          leftNum: leftIdx + 1,
          rightNum: rightIdx + 1
        });
        leftIdx++;
        rightIdx++;
      } else {
        // Check if line exists only on left
        const foundInRight = rightLines.slice(rightIdx).indexOf(leftLine);
        const foundInLeft = leftLines.slice(leftIdx).indexOf(rightLine);
        
        if (foundInRight === -1 && leftLine) {
          lines.push({
            type: 'removed',
            left: leftLine,
            right: '',
            leftNum: leftIdx + 1,
            rightNum: null
          });
          leftIdx++;
        } else if (foundInLeft === -1 && rightLine) {
          lines.push({
            type: 'added',
            left: '',
            right: rightLine,
            leftNum: null,
            rightNum: rightIdx + 1
          });
          rightIdx++;
        } else {
          lines.push({
            type: 'modified',
            left: leftLine,
            right: rightLine,
            leftNum: leftIdx + 1,
            rightNum: rightIdx + 1
          });
          leftIdx++;
          rightIdx++;
        }
      }
    }
    
    return lines;
  },

  // Render diff HTML
  renderDiffHtml(lines) {
    return lines.map(line => {
      const leftNum = line.leftNum !== null ? `<span style="color:var(--text-muted);width:30px;display:inline-block;text-align:right;margin-right:12px;">${line.leftNum}</span>` : '<span style="width:42px;display:inline-block;"></span>';
      const rightNum = line.rightNum !== null ? `<span style="color:var(--text-muted);width:30px;display:inline-block;text-align:right;margin-right:12px;">${line.rightNum}</span>` : '<span style="width:42px;display:inline-block;"></span>';
      
      let bg = '';
      let prefix = ' ';
      
      switch (line.type) {
        case 'added':
          bg = 'background:rgba(34,197,94,0.1);';
          prefix = '+';
          break;
        case 'removed':
          bg = 'background:rgba(239,68,68,0.1);';
          prefix = '-';
          break;
        case 'modified':
          bg = 'background:rgba(245,158,11,0.1);';
          prefix = '~';
          break;
      }

      const content = line.right || line.left || '';
      const escaped = this.escapeHtml(content);
      
      return `<div style="${bg}display:flex;align-items:center;padding:1px 8px;font-family:var(--font-mono);font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-all;">
        <span style="color:${line.type === 'added' ? '#22c55e' : line.type === 'removed' ? '#ef4444' : line.type === 'modified' ? '#f59e0b' : 'var(--text-muted)'};width:16px;font-weight:bold;">${prefix}</span>
        ${leftNum}
        ${rightNum}
        <span style="color:var(--text-primary);flex:1;">${escaped}</span>
      </div>`;
    }).join('');
  },

  // Escape HTML
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  // Initialize diff functionality
  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.setupEventListeners();
  },

  // Setup event listeners
  setupEventListeners() {
    // Compare button
    document.getElementById('diffCompareBtn')?.addEventListener('click', () => this.performDiff());

    // Load from JSON editor buttons
    document.getElementById('diffLeftBtn')?.addEventListener('click', () => {
      const input = document.getElementById('input')?.value || '';
      document.getElementById('diffLeftInput').value = input;
      ToastManager.show('Loaded JSON from editor', 'success');
    });

    document.getElementById('diffRightBtn')?.addEventListener('click', () => {
      const output = document.getElementById('output')?.textContent || '';
      document.getElementById('diffRightInput').value = output;
      ToastManager.show('Loaded JSON from editor', 'success');
    });

    // Copy buttons
    document.getElementById('diffCopyLeft')?.addEventListener('click', () => {
      const text = document.getElementById('diffLeftInput').value;
      navigator.clipboard.writeText(text).then(() => {
        ToastManager.show('Left side copied', 'success');
      });
    });

    document.getElementById('diffCopyRight')?.addEventListener('click', () => {
      const text = document.getElementById('diffRightInput').value;
      navigator.clipboard.writeText(text).then(() => {
        ToastManager.show('Right side copied', 'success');
      });
    });

    // Close result
    document.getElementById('diffCloseResult')?.addEventListener('click', () => {
      document.getElementById('diffResult').style.display = 'none';
    });
  },

  // Perform diff
  performDiff() {
    const left = document.getElementById('diffLeftInput').value.trim();
    const right = document.getElementById('diffRightInput').value.trim();

    if (!left || !right) {
      ToastManager.show('Please paste JSON in both fields', 'error');
      return;
    }

    const result = this.compare(left, right);

    if (!result.success) {
      ToastManager.show('Invalid JSON: ' + result.error, 'error');
      return;
    }

    // Update stats
    const stats = result.stats;
    document.getElementById('diffStats').textContent = 
      `${stats.added} added, ${stats.removed} removed, ${stats.modified} modified`;

    // Show result panel
    const resultPanel = document.getElementById('diffResult');
    const resultContent = document.getElementById('diffResultContent');
    resultPanel.style.display = 'flex';

    // Parse and format
    try {
      const leftObj = JSON.parse(left);
      const rightObj = JSON.parse(right);
      const lines = this.formatDiff(leftObj, rightObj, result.diff);
      resultContent.innerHTML = this.renderDiffHtml(lines);
    } catch (e) {
      resultContent.textContent = 'Error rendering diff: ' + e.message;
    }

    // Scroll to result
    resultPanel.scrollIntoView({ behavior: 'smooth' });

    ToastManager.show('Diff complete', 'success');
  }
};
