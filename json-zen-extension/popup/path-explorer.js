// JSON Zen - Path Explorer Module
// Interactive JSON navigation with breadcrumbs, search, and tree view

class PathExplorer {
  constructor() {
    this.currentJson = null;
    this.currentPath = '$';
    this.searchResults = [];
    this.expandedNodes = new Set();
    this.highlightedNode = null;
    this.treeViewEnabled = false;

    // DOM elements
    this.elements = {
      pathExplorerBar: null,
      breadcrumbs: null,
      copyPathBtn: null,
      toggleTreeBtn: null,
      clearPathBtn: null,
      pathSearchBar: null,
      pathSearchInput: null,
      searchResults: null,
      miniTreePanel: null,
      miniTreeContent: null,
      closeTreeBtn: null,
      output: null
    };

    this.init();
  }

  init() {
    // Cache DOM elements
    this.elements.pathExplorerBar = document.getElementById('pathExplorerBar');
    this.elements.breadcrumbs = document.getElementById('breadcrumbs');
    this.elements.copyPathBtn = document.getElementById('copyPathBtn');
    this.elements.toggleTreeBtn = document.getElementById('toggleTreeBtn');
    this.elements.clearPathBtn = document.getElementById('clearPathBtn');
    this.elements.pathSearchBar = document.getElementById('pathSearchBar');
    this.elements.pathSearchInput = document.getElementById('pathSearchInput');
    this.elements.searchResults = document.getElementById('searchResults');
    this.elements.miniTreePanel = document.getElementById('miniTreePanel');
    this.elements.miniTreeContent = document.getElementById('miniTreeContent');
    this.elements.closeTreeBtn = document.getElementById('closeTreeBtn');
    this.elements.output = document.getElementById('output');

    // Bind event listeners
    this.bindEvents();
  }

  bindEvents() {
    if (this.elements.copyPathBtn) {
      this.elements.copyPathBtn.addEventListener('click', () => this.copyPath());
    }

    if (this.elements.toggleTreeBtn) {
      this.elements.toggleTreeBtn.addEventListener('click', () => this.toggleTreeView());
    }

    if (this.elements.clearPathBtn) {
      this.elements.clearPathBtn.addEventListener('click', () => this.clearPath());
    }

    if (this.elements.closeTreeBtn) {
      this.elements.closeTreeBtn.addEventListener('click', () => this.hideTreeView());
    }

    if (this.elements.pathSearchInput) {
      this.elements.pathSearchInput.addEventListener('input', (e) => {
        this.debounceSearch(e.target.value);
      });
    }

    // Click on output to navigate
    if (this.elements.output) {
      this.elements.output.addEventListener('click', (e) => {
        this.handleOutputClick(e);
      });

      // Hover for value preview
      this.elements.output.addEventListener('mouseover', (e) => {
        this.handleOutputHover(e);
      });

      this.elements.output.addEventListener('mouseout', (e) => {
        this.hideValuePreview();
      });
    }
  }

  // Debounce search input
  debounceSearch(query) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchJSON(query);
    }, 300);
  }

  // Set current JSON data
  setJson(jsonString) {
    try {
      this.currentJson = JSON.parse(jsonString);
      this.showPathExplorer();
      this.showPathSearch();
      this.updateBreadcrumbs();
      this.renderTreeView();
    } catch (e) {
      this.hidePathExplorer();
      this.hidePathSearch();
    }
  }

  // Show/hide UI elements
  showPathExplorer() {
    if (this.elements.pathExplorerBar) {
      this.elements.pathExplorerBar.style.display = 'flex';
    }
  }

  hidePathExplorer() {
    if (this.elements.pathExplorerBar) {
      this.elements.pathExplorerBar.style.display = 'none';
    }
  }

  showPathSearch() {
    if (this.elements.pathSearchBar) {
      this.elements.pathSearchBar.style.display = 'flex';
    }
  }

  hidePathSearch() {
    if (this.elements.pathSearchBar) {
      this.elements.pathSearchBar.style.display = 'none';
    }
  }

  // Update breadcrumb navigation
  updateBreadcrumbs() {
    if (!this.elements.breadcrumbs) return;

    this.elements.breadcrumbs.innerHTML = '';

    // Parse current path into segments
    const segments = this.parsePathSegments(this.currentPath);

    // Build breadcrumb trail
    let buildPath = '$';
    segments.forEach((segment, index) => {
      const isLast = index === segments.length - 1;

      if (index > 0) {
        buildPath += typeof segment === 'number' ? `[${segment}]` : `.${segment}`;
      }

      const crumb = document.createElement('span');
      crumb.className = 'breadcrumb-item' + (isLast ? ' active' : '');
      if (index === 0) crumb.classList.add('root');
      crumb.dataset.path = buildPath;
      crumb.textContent = this.formatBreadcrumbLabel(segment, index);
      crumb.addEventListener('click', () => this.navigateToPath(buildPath));

      this.elements.breadcrumbs.appendChild(crumb);

      // Add separator
      if (!isLast) {
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = '→';
        this.elements.breadcrumbs.appendChild(separator);
      }
    });
  }

  // Parse path into segments
  parsePathSegments(path) {
    const segments = [];

    // Remove $ prefix
    let cleanPath = path.replace(/^\$/, '');

    // Split by dots and brackets
    const parts = cleanPath.split(/\.|\[|\]/).filter(p => p !== '');

    // Convert numeric parts to numbers
    return parts.map(p => /^\d+$/.test(p) ? parseInt(p, 10) : p);
  }

  // Format breadcrumb label
  formatBreadcrumbLabel(segment, index) {
    if (index === 0) return 'root';
    if (typeof segment === 'number') return `[${segment}]`;
    return segment;
  }

  // Navigate to a specific path
  navigateToPath(path) {
    this.currentPath = path;
    this.updateBreadcrumbs();

    // Get value at path
    const value = JSONUtils._queryPath(this.currentJson, path);

    // Update output to show only this branch
    if (value !== undefined) {
      const highlighted = JSON.stringify(value, null, 2);
      this.elements.output.innerHTML = this.highlightWithInteractivity(highlighted, path);
      this.highlightNode(path);
    }
  }

  // Clear path filter and show full JSON
  clearPath() {
    this.currentPath = '$';
    this.updateBreadcrumbs();

    if (this.currentJson) {
      const formatted = JSON.stringify(this.currentJson, null, 2);
      this.elements.output.innerHTML = this.highlightWithInteractivity(formatted, '$');
    }

    this.clearHighlight();
  }

  // Copy current path to clipboard
  async copyPath() {
    try {
      await navigator.clipboard.writeText(this.currentPath);
      this.showCopyFeedback('Path copied!');
    } catch (e) {
      console.error('Failed to copy path:', e);
    }
  }

  // Search JSON for keys and values
  searchJSON(query) {
    if (!query || !this.currentJson) {
      if (this.elements.searchResults) {
        this.elements.searchResults.textContent = '';
      }
      return;
    }

    const result = JSONUtils.search(this.currentJson, query);

    if (result.success) {
      this.searchResults = result.result;
      if (this.elements.searchResults) {
        this.elements.searchResults.textContent = `${result.count} result${result.count !== 1 ? 's' : ''}`;
      }

      // Highlight first result
      if (result.result.length > 0) {
        const firstMatch = result.result[0];
        this.navigateToPath(firstMatch.path);
      }
    }
  }

  // Toggle mini tree view
  toggleTreeView() {
    if (this.elements.miniTreePanel) {
      const isVisible = this.elements.miniTreePanel.style.display !== 'none';
      if (isVisible) {
        this.hideTreeView();
      } else {
        this.showTreeView();
      }
    }
  }

  showTreeView() {
    if (this.elements.miniTreePanel) {
      this.elements.miniTreePanel.style.display = 'flex';
      this.renderTreeView();
    }
  }

  hideTreeView() {
    if (this.elements.miniTreePanel) {
      this.elements.miniTreePanel.style.display = 'none';
    }
  }

  // Render mini tree structure
  renderTreeView() {
    if (!this.elements.miniTreeContent || !this.currentJson) return;

    const result = JSONUtils.getTreeStructure(this.currentJson);

    if (!result.success) return;

    this.elements.miniTreeContent.innerHTML = '';

    // Render only top-level items for brevity
    const topLevel = result.result.filter(node => node.depth <= 1);

    topLevel.forEach(node => {
      const treeNode = document.createElement('div');
      treeNode.className = 'mini-tree-node';
      if (node.path === this.currentPath) {
        treeNode.classList.add('active');
      }

      const keySpan = document.createElement('span');
      keySpan.className = 'node-key';
      keySpan.textContent = node.key;

      const typeSpan = document.createElement('span');
      typeSpan.className = 'node-type';
      typeSpan.textContent = node.type + (node.size ? ` (${node.size})` : '');

      treeNode.appendChild(keySpan);
      treeNode.appendChild(typeSpan);

      treeNode.addEventListener('click', () => {
        this.navigateToPath(node.path);
        this.renderTreeView(); // Re-render to update active state
      });

      this.elements.miniTreeContent.appendChild(treeNode);
    });
  }

  // Handle clicks on JSON output
  handleOutputClick(e) {
    const target = e.target;

    // Check if clicked on a key or value
    if (target.classList.contains('json-node')) {
      const path = target.dataset.path;
      if (path) {
        this.navigateToPath(path);
      }
    }

    // Check if clicked on a toggle
    if (target.classList.contains('json-toggle')) {
      const contentId = target.dataset.contentId;
      const content = document.getElementById(contentId);
      if (content) {
        const isCollapsed = target.classList.contains('collapsed');
        if (isCollapsed) {
          target.classList.remove('collapsed');
          target.classList.add('expanded');
          content.style.display = 'inline';
        } else {
          target.classList.remove('expanded');
          target.classList.add('collapsed');
          content.style.display = 'none';
        }
      }
    }
  }

  // Handle hover for value preview
  handleOutputHover(e) {
    const target = e.target;

    if (target.classList.contains('json-node') && target.dataset.value) {
      const value = target.dataset.value;
      const type = target.dataset.type || 'value';
      this.showValuePreview(e.clientX, e.clientY, value, type);
    }
  }

  showValuePreview(x, y, value, type) {
    // Remove existing preview
    this.hideValuePreview();

    const preview = document.createElement('div');
    preview.className = 'value-preview';
    preview.id = 'valuePreviewTooltip';

    const label = document.createElement('div');
    label.className = 'preview-label';
    label.textContent = type;

    const valueEl = document.createElement('div');
    valueEl.className = 'preview-value';
    valueEl.textContent = typeof value === 'string' ? value : JSON.stringify(value);

    preview.appendChild(label);
    preview.appendChild(valueEl);

    // Position near cursor
    preview.style.left = (x + 15) + 'px';
    preview.style.top = (y + 15) + 'px';

    document.body.appendChild(preview);
  }

  hideValuePreview() {
    const existing = document.getElementById('valuePreviewTooltip');
    if (existing) {
      existing.remove();
    }
  }

  // Highlight node at path
  highlightNode(path) {
    this.clearHighlight();
    this.highlightedNode = path;

    // Find and highlight the node
    const nodes = this.elements.output.querySelectorAll('.json-node');
    nodes.forEach(node => {
      if (node.dataset.path === path) {
        node.classList.add('highlighted');
      }
    });
  }

  clearHighlight() {
    if (this.highlightedNode) {
      const nodes = this.elements.output.querySelectorAll('.json-node.highlighted');
      nodes.forEach(node => node.classList.remove('highlighted'));
      this.highlightedNode = null;
    }
  }

  // Add interactivity to highlighted JSON
  highlightWithInteractivity(jsonString, basePath = '$') {
    // This is a simplified version - in production you'd want proper parsing
    return jsonString
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"([^"]+)":/g, (match, key) => {
        const path = basePath === '$' ? `$.${key}` : `${basePath}.${key}`;
        return `<span class="json-node" data-path="${path}" data-key="${key}">"${key}"</span>:`;
      })
      .replace(/:(\s*)"([^"]*)"/g, (match, space, value) => {
        return `:${space}<span class="json-node string" data-value="${value}">"${value}"</span>`;
      })
      .replace(/:(\s*)(\d+\.?\d*)/g, (match, space, num) => {
        return `:${space}<span class="json-node number" data-value="${num}">${num}</span>`;
      })
      .replace(/:(\s*)(true|false)/g, (match, space, bool) => {
        return `:${space}<span class="json-node boolean" data-value="${bool}">${bool}</span>`;
      })
      .replace(/:(\s*)(null)/g, (match, space, n) => {
        return `:${space}<span class="json-node null" data-value="null">${n}</span>`;
      });
  }

  // Show copy feedback
  showCopyFeedback(message) {
    const feedback = document.createElement('div');
    feedback.className = 'copy-feedback';
    feedback.textContent = message;
    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.remove();
    }, 1500);
  }
}

// Export for use in popup-script.js
window.PathExplorer = PathExplorer;
