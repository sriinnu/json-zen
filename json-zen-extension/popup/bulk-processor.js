// JSON Zen - Bulk Processing Module
// Handles bulk file operations with Web Workers

class BulkProcessor {
  constructor() {
    this.selectedFiles = [];
    this.processedResults = [];
    this.currentOperation = 'format';
    this.convertFormat = 'yaml';
    this.isProcessing = false;
    this.worker = null;
    this.initWorker();
    this.initEventListeners();
  }

  initWorker() {
    // Create Web Worker for async processing
    const workerBlob = new Blob([`(${workerCode.toString()})()`], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(workerBlob));

    this.worker.onmessage = (e) => {
      this.handleWorkerMessage(e.data);
    };

    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
      this.showError('Processing error occurred');
    };
  }

  initEventListeners() {
    // Modal controls
    const bulkBtn = document.getElementById('bulkProcess');
    const bulkModal = document.getElementById('bulkModal');
    const closeBulkModal = document.getElementById('closeBulkModal');
    const cancelBulk = document.getElementById('cancelBulk');
    const startBulkProcess = document.getElementById('startBulkProcess');
    const bulkNewProcess = document.getElementById('bulkNewProcess');
    const bulkDownloadAll = document.getElementById('bulkDownloadAll');

    if (bulkBtn) {
      bulkBtn.addEventListener('click', () => this.openModal());
    }

    if (closeBulkModal) {
      closeBulkModal.addEventListener('click', () => this.closeModal());
    }

    if (cancelBulk) {
      cancelBulk.addEventListener('click', () => this.closeModal());
    }

    if (startBulkProcess) {
      startBulkProcess.addEventListener('click', () => this.startProcessing());
    }

    if (bulkNewProcess) {
      bulkNewProcess.addEventListener('click', () => this.resetProcess());
    }

    if (bulkDownloadAll) {
      bulkDownloadAll.addEventListener('click', () => this.downloadAllAsZip());
    }

    // File selection
    const bulkDropzone = document.getElementById('bulkDropzone');
    const bulkFileInput = document.getElementById('bulkFileInput');
    const bulkClearFiles = document.getElementById('bulkClearFiles');

    if (bulkDropzone) {
      bulkDropzone.addEventListener('click', () => {
        if (bulkFileInput) bulkFileInput.click();
      });

      // Drag and drop
      bulkDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        bulkDropzone.classList.add('drag-over');
      });

      bulkDropzone.addEventListener('dragleave', () => {
        bulkDropzone.classList.remove('drag-over');
      });

      bulkDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        bulkDropzone.classList.remove('drag-over');
        this.handleFilesDrop(e.dataTransfer.files);
      });
    }

    if (bulkFileInput) {
      bulkFileInput.addEventListener('change', (e) => {
        this.handleFilesSelect(e.target.files);
      });
    }

    if (bulkClearFiles) {
      bulkClearFiles.addEventListener('click', () => this.clearFiles());
    }

    // Operation selection
    const bulkOpButtons = document.querySelectorAll('.bulk-op-btn');
    bulkOpButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        bulkOpButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentOperation = btn.dataset.op;
        this.toggleConvertFormat();
      });
    });

    // Convert format selection
    const bulkConvertSelect = document.getElementById('bulkConvertSelect');
    if (bulkConvertSelect) {
      bulkConvertSelect.addEventListener('change', (e) => {
        this.convertFormat = e.target.value;
      });
    }

    // Close modal on overlay click
    if (bulkModal) {
      bulkModal.addEventListener('click', (e) => {
        if (e.target === bulkModal) {
          this.closeModal();
        }
      });
    }
  }

  openModal() {
    const bulkModal = document.getElementById('bulkModal');
    if (bulkModal) {
      bulkModal.classList.add('active');
    }
  }

  closeModal() {
    if (this.isProcessing) return;
    const bulkModal = document.getElementById('bulkModal');
    if (bulkModal) {
      bulkModal.classList.remove('active');
    }
    this.resetProcess();
  }

  handleFilesSelect(files) {
    this.addFiles(Array.from(files));
  }

  handleFilesDrop(files) {
    this.addFiles(Array.from(files));
  }

  async addFiles(files) {
    for (const file of files) {
      if (file.name.endsWith('.json') || file.name.endsWith('.txt')) {
        // Check if file already exists
        if (!this.selectedFiles.find(f => f.name === file.name)) {
          const content = await this.readFileContent(file);
          this.selectedFiles.push({
            id: Date.now() + Math.random(),
            file: file,
            content: content,
            name: file.name,
            size: file.size
          });
        }
      } else if (file.isDirectory) {
        // Handle directory (webkitRelativePath)
        await this.handleDirectory(file);
      }
    }
    this.updateFilesList();
  }

  async handleDirectory(directoryEntry) {
    const reader = directoryEntry.createReader();
    const entries = await new Promise((resolve) => {
      reader.readEntries(resolve);
    });

    for (const entry of entries) {
      if (entry.isFile) {
        const file = await new Promise((resolve) => entry.file(resolve));
        if (file.name.endsWith('.json') || file.name.endsWith('.txt')) {
          const content = await this.readFileContent(file);
          this.selectedFiles.push({
            id: Date.now() + Math.random(),
            file: file,
            content: content,
            name: file.name,
            size: file.size
          });
        }
      } else if (entry.isDirectory) {
        await this.handleDirectory(entry);
      }
    }
  }

  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  updateFilesList() {
    const bulkDropzone = document.getElementById('bulkDropzone');
    const bulkFilesList = document.getElementById('bulkFilesList');
    const bulkFilesItems = document.getElementById('bulkFilesItems');
    const bulkFilesCount = document.querySelector('.bulk-files-count');

    if (this.selectedFiles.length > 0) {
      bulkDropzone.style.display = 'none';
      bulkFilesList.style.display = 'block';
      bulkFilesCount.textContent = `${this.selectedFiles.length} file${this.selectedFiles.length !== 1 ? 's' : ''} selected`;

      bulkFilesItems.innerHTML = this.selectedFiles.map(file => `
        <div class="bulk-file-item" data-file-id="${file.id}">
          <div class="bulk-file-info">
            <div class="bulk-file-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
              </svg>
            </div>
            <div class="bulk-file-details">
              <div class="bulk-file-name">${file.name}</div>
              <div class="bulk-file-size">${this.formatFileSize(file.size)}</div>
            </div>
          </div>
          <button class="bulk-file-remove" data-file-id="${file.id}" title="Remove file">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      `).join('');

      // Add remove button listeners
      bulkFilesItems.querySelectorAll('.bulk-file-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const fileId = parseFloat(e.currentTarget.dataset.fileId);
          this.removeFile(fileId);
        });
      });
    } else {
      bulkDropzone.style.display = 'block';
      bulkFilesList.style.display = 'none';
    }
  }

  removeFile(fileId) {
    this.selectedFiles = this.selectedFiles.filter(f => f.id !== fileId);
    this.updateFilesList();
  }

  clearFiles() {
    this.selectedFiles = [];
    this.updateFilesList();
  }

  toggleConvertFormat() {
    const bulkConvertFormat = document.getElementById('bulkConvertFormat');
    if (bulkConvertFormat) {
      bulkConvertFormat.style.display = this.currentOperation === 'convert' ? 'block' : 'none';
    }
  }

  async startProcessing() {
    if (this.selectedFiles.length === 0) {
      this.showError('Please select at least one file');
      return;
    }

    if (this.isProcessing) return;

    this.isProcessing = true;
    this.processedResults = [];
    this.updateProgressUI();
    this.showProgressSection();

    // Process files one by one
    for (let i = 0; i < this.selectedFiles.length; i++) {
      const file = this.selectedFiles[i];
      this.updateProgressFile(file.name, i + 1, this.selectedFiles.length);

      // Send to worker
      this.worker.postMessage({
        fileId: file.id,
        content: file.content,
        operation: this.currentOperation,
        convertFormat: this.convertFormat
      });

      // Wait for worker response
      await new Promise(resolve => {
        const checkResult = setInterval(() => {
          const result = this.processedResults.find(r => r.fileId === file.id);
          if (result) {
            clearInterval(checkResult);
            resolve();
          }
        }, 100);
      });

      // Small delay between files
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.isProcessing = false;
    this.showResultsSection();
  }

  handleWorkerMessage(data) {
    const { fileId, success, result, error } = data;
    const file = this.selectedFiles.find(f => f.id === fileId);

    if (file) {
      this.processedResults.push({
        fileId: fileId,
        fileName: file.name,
        success: success,
        result: result,
        error: error
      });

      this.updateProgressStats();
    }
  }

  updateProgressUI() {
    const startBtn = document.getElementById('startBulkProcess');
    const cancelBtn = document.getElementById('cancelBulk');
    const bulkClearFiles = document.getElementById('bulkClearFiles');

    if (startBtn) startBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = true;
    if (bulkClearFiles) bulkClearFiles.disabled = true;
  }

  showProgressSection() {
    const progressSection = document.getElementById('bulkProgressSection');
    const resultsSection = document.getElementById('bulkResultsSection');

    if (progressSection) progressSection.style.display = 'block';
    if (resultsSection) resultsSection.style.display = 'none';
  }

  updateProgressFile(fileName, current, total) {
    const progressFile = document.getElementById('bulkProgressFile');
    const progressCounter = document.getElementById('bulkProgressCounter');
    const progressFill = document.getElementById('bulkProgressFill');

    if (progressFile) progressFile.textContent = fileName;
    if (progressCounter) progressCounter.textContent = `${current} / ${total}`;
    if (progressFill) progressFill.style.width = `${(current / total) * 100}%`;
  }

  updateProgressStats() {
    const successCount = document.getElementById('bulkSuccessCount');
    const errorCount = document.getElementById('bulkErrorCount');

    const success = this.processedResults.filter(r => r.success).length;
    const errors = this.processedResults.filter(r => !r.success).length;

    if (successCount) successCount.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <path d="M9 12l2 2 4-4"/>
      </svg>
      ${success} Success
    `;

    if (errorCount) errorCount.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
      ${errors} Errors
    `;
  }

  showResultsSection() {
    const progressSection = document.getElementById('bulkProgressSection');
    const resultsSection = document.getElementById('bulkResultsSection');
    const resultsList = document.getElementById('bulkResultsList');

    if (progressSection) progressSection.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'block';

    if (resultsList) {
      resultsList.innerHTML = this.processedResults.map(result => `
        <div class="bulk-result-item ${result.success ? 'success' : 'error'}">
          <div class="bulk-result-info">
            <div class="bulk-result-status">
              ${result.success ?
                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 12l2 2 4-4"/></svg>' :
                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>'
              }
            </div>
            <div class="bulk-result-details">
              <div class="bulk-result-name">${result.fileName}</div>
              ${!result.success ? `<div class="bulk-result-error">${result.error}</div>` : ''}
            </div>
          </div>
          <div class="bulk-result-actions">
            <button class="bulk-result-download" data-file-name="${result.fileName}" ${result.success ? '' : 'disabled'}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Download
            </button>
          </div>
        </div>
      `).join('');

      // Add download button listeners
      resultsList.querySelectorAll('.bulk-result-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const fileName = e.currentTarget.dataset.fileName;
          this.downloadSingleFile(fileName);
        });
      });
    }
  }

  downloadSingleFile(fileName) {
    const result = this.processedResults.find(r => r.fileName === fileName);
    if (result && result.success && result.result) {
      const blob = new Blob([result.result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.getOutputFileName(fileName);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  async downloadAllAsZip() {
    // Simple ZIP implementation using JSZip would go here
    // For now, we'll download files individually
    const successResults = this.processedResults.filter(r => r.success);

    if (successResults.length === 0) {
      this.showError('No successful files to download');
      return;
    }

    // Download each file with a small delay
    for (const result of successResults) {
      this.downloadSingleFile(result.fileName);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  getOutputFileName(originalName) {
    const nameWithoutExt = originalName.replace(/\.(json|txt)$/i, '');
    const extension = this.getOutputExtension();
    return `${nameWithoutExt}_processed.${extension}`;
  }

  getOutputExtension() {
    switch (this.currentOperation) {
      case 'format':
      case 'minify':
      case 'fix':
        return 'json';
      case 'validate':
        return 'txt';
      case 'convert':
        switch (this.convertFormat) {
          case 'yaml': return 'yaml';
          case 'xml': return 'xml';
          case 'csv': return 'csv';
          case 'toml': return 'toml';
          case 'base64': return 'txt';
          case 'url': return 'txt';
          default: return 'json';
        }
      default:
        return 'json';
    }
  }

  resetProcess() {
    this.selectedFiles = [];
    this.processedResults = [];
    this.isProcessing = false;

    const startBtn = document.getElementById('startBulkProcess');
    const cancelBtn = document.getElementById('cancelBulk');
    const bulkClearFiles = document.getElementById('bulkClearFiles');
    const progressSection = document.getElementById('bulkProgressSection');
    const resultsSection = document.getElementById('bulkResultsSection');
    const bulkDropzone = document.getElementById('bulkDropzone');
    const bulkFilesList = document.getElementById('bulkFilesList');
    const progressFill = document.getElementById('bulkProgressFill');

    if (startBtn) startBtn.disabled = false;
    if (cancelBtn) cancelBtn.disabled = false;
    if (bulkClearFiles) bulkClearFiles.disabled = false;
    if (progressSection) progressSection.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'none';
    if (bulkDropzone) bulkDropzone.style.display = 'block';
    if (bulkFilesList) bulkFilesList.style.display = 'none';
    if (progressFill) progressFill.style.width = '0%';

    this.updateFilesList();
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  showError(message) {
    const status = document.getElementById('status');
    if (status) {
      status.textContent = message;
      status.className = 'status-pill error';
      setTimeout(() => {
        status.textContent = 'Ready';
        status.className = 'status-pill';
      }, 3000);
    }
  }
}

// Worker code as a function (to be converted to blob)
function workerCode() {
  // JSON Utilities (same as in worker.js)
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

      if (fixed.includes('//')) {
        fixed = fixed.replace(/\/\/[^\n]*/g, '');
        changes.push('Removed single-line comments');
      }

      if (fixed.includes('/*')) {
        fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
        changes.push('Removed multi-line comments');
      }

      if (fixed.includes("'")) {
        const original = fixed;
        fixed = fixed.replace(/'([^'\\]|\\.)*'/g, (match) => {
          return '"' + match.slice(1, -1).replace(/\\'/g, "'").replace(/"/g, '\\"') + '"';
        });
        if (original !== fixed) {
          changes.push('Replaced single quotes with double quotes');
        }
      }

      const unquotedKeyRegex = /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g;
      if (fixed.match(unquotedKeyRegex)) {
        const original = fixed;
        fixed = fixed.replace(unquotedKeyRegex, '$1"$2"$3');
        if (original !== fixed) {
          changes.push('Added quotes to unquoted keys');
        }
      }

      if (fixed.includes(',')) {
        const original = fixed;
        fixed = fixed.replace(/,\s*([\]}])/g, '$1');
        if (original !== fixed) {
          changes.push('Removed trailing commas');
        }
      }

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

  self.onmessage = function(e) {
    const { content, operation, convertFormat, fileId } = e.data;

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
}

// Initialize bulk processor when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.bulkProcessor = new BulkProcessor();
    });
  } else {
    window.bulkProcessor = new BulkProcessor();
  }
}
