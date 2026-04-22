/**
 * JSON Zen - Bulk Processor Module
 * Process multiple JSON files with progress tracking
 */

const BulkProcessor = {
  initialized: false,
  files: [],
  results: [],
  isProcessing: false,

  // Initialize
  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.setupEventListeners();
  },

  // Setup event listeners
  setupEventListeners() {
    // Dropzone
    const dropzone = document.getElementById('bulkDropzone');
    if (dropzone) {
      dropzone.addEventListener('click', () => {
        document.getElementById('bulkFileInput').click();
      });

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        this.handleFiles(e.dataTransfer.files);
      });
    }

    // File input
    document.getElementById('bulkFileInput')?.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });

    // Clear files
    document.getElementById('bulkClearFiles')?.addEventListener('click', () => {
      this.clearFiles();
    });

    // Operation buttons
    document.querySelectorAll('.bulk-op-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.bulk-op-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Start processing
    document.getElementById('startBulkProcess')?.addEventListener('click', () => {
      this.startProcessing();
    });

    // Download results
    document.getElementById('bulkDownloadAll')?.addEventListener('click', () => {
      this.downloadResults();
    });
  },

  // Handle dropped/selected files
  handleFiles(fileList) {
    const newFiles = Array.from(fileList).filter(f => 
      f.name.endsWith('.json') || f.name.endsWith('.txt')
    );

    if (newFiles.length === 0) {
      ToastManager.error('Please select .json or .txt files');
      return;
    }

    this.files = [...this.files, ...newFiles];
    this.updateFileList();
    this.updateStartButton();
  },

  // Update file list UI
  updateFileList() {
    const list = document.getElementById('bulkFilesList');
    const items = document.getElementById('bulkFilesItems');
    const count = document.getElementById('bulkFilesCount');
    const dropzone = document.getElementById('bulkDropzone');

    if (this.files.length === 0) {
      list.style.display = 'none';
      dropzone.style.display = 'block';
      return;
    }

    list.style.display = 'block';
    dropzone.style.display = 'none';
    count.textContent = `${this.files.length} file${this.files.length !== 1 ? 's' : ''} selected`;

    items.innerHTML = this.files.map((file, index) => `
      <div class="history-item" style="padding:6px 12px;">
        <div class="history-item-icon" style="width:28px;height:28px;background:var(--glass-bg);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6"/>
          </svg>
        </div>
        <div class="history-item-content">
          <div class="history-item-title">${this.escapeHtml(file.name)}</div>
          <div class="history-item-meta">${this.formatBytes(file.size)}</div>
        </div>
        <button class="icon-btn btn-sm" data-remove="${index}" style="flex-shrink:0;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `).join('');

    // Remove buttons
    items.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.remove);
        this.files.splice(index, 1);
        this.updateFileList();
        this.updateStartButton();
      });
    });
  },

  // Clear all files
  clearFiles() {
    this.files = [];
    this.updateFileList();
    this.updateStartButton();
  },

  // Update start button state
  updateStartButton() {
    const btn = document.getElementById('startBulkProcess');
    if (btn) {
      btn.disabled = this.files.length === 0 || this.isProcessing;
    }
  },

  // Get selected operation
  getOperation() {
    const activeBtn = document.querySelector('.bulk-op-btn.active');
    return activeBtn?.dataset.op || 'format';
  },

  // Start processing
  async startProcessing() {
    if (this.files.length === 0 || this.isProcessing) return;

    this.isProcessing = true;
    this.results = [];
    this.updateStartButton();

    const operation = this.getOperation();
    const progressSection = document.getElementById('bulkProgressSection');
    const progressFill = document.getElementById('bulkProgressFill');
    const progressFile = document.getElementById('bulkProgressFile');
    const progressCounter = document.getElementById('bulkProgressCounter');
    const successCount = document.getElementById('bulkSuccessCount');
    const errorCount = document.getElementById('bulkErrorCount');

    progressSection.style.display = 'block';
    document.getElementById('bulkResultsSection').style.display = 'none';

    let success = 0;
    let errors = 0;

    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i];
      
      // Update progress
      const percent = ((i + 1) / this.files.length) * 100;
      progressFill.style.width = `${percent}%`;
      progressFile.textContent = `Processing ${file.name}...`;
      progressCounter.textContent = `${i + 1} / ${this.files.length}`;

      try {
        const content = await this.readFile(file);
        const result = await this.processContent(content, operation);
        
        this.results.push({
          file: file.name,
          success: true,
          result: result,
          original: content
        });
        success++;
      } catch (e) {
        this.results.push({
          file: file.name,
          success: false,
          error: e.message
        });
        errors++;
      }

      successCount.textContent = `${success} Success`;
      errorCount.textContent = `${errors} Errors`;

      // Small delay for visual feedback
      await new Promise(r => setTimeout(r, 50));
    }

    this.isProcessing = false;
    this.updateStartButton();
    this.showResults();

    ToastManager.success(`Processed ${this.files.length} files`);
  },

  // Read file content
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },

  // Process content based on operation
  processContent(content, operation) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          let result;
          
          switch (operation) {
            case 'format':
              result = JSONUtils.format(content, 2);
              if (!result.success) throw new Error(result.error);
              result = result.result;
              break;
            
            case 'minify':
              result = JSONUtils.minify(content);
              if (!result.success) throw new Error(result.error);
              result = result.result;
              break;
            
            case 'fix':
              result = JSONUtils.fix(content);
              if (!result.success) throw new Error(result.error);
              result = result.result;
              break;
            
            case 'validate':
              const validation = JSONUtils.validate(content);
              result = validation.valid ? 'Valid JSON' : `Invalid: ${validation.error}`;
              break;
            
            default:
              result = content;
          }
          
          resolve(result);
        } catch (e) {
          reject(e);
        }
      }, 10);
    });
  },

  // Show results
  showResults() {
    const resultsSection = document.getElementById('bulkResultsSection');
    const resultsList = document.getElementById('bulkResultsList');

    resultsSection.style.display = 'block';

    resultsList.innerHTML = this.results.map((res, index) => `
      <div class="history-item ${res.success ? '' : 'error'}" style="padding:6px 12px;">
        <div class="history-item-icon" style="width:28px;height:28px;background:${res.success ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'};color:${res.success ? '#22c55e' : '#ef4444'};">
          ${res.success 
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 12l2 2 4-4"/></svg>`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg>`
          }
        </div>
        <div class="history-item-content">
          <div class="history-item-title">${this.escapeHtml(res.file)}</div>
          <div class="history-item-meta">${res.success ? 'Success' : res.error}</div>
        </div>
        ${res.success ? `
          <button class="btn btn-ghost btn-sm" data-download="${index}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
          </button>
        ` : ''}
      </div>
    `).join('');

    // Download individual results
    resultsList.querySelectorAll('[data-download]').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.download);
        this.downloadResult(index);
      });
    });
  },

  // Download single result
  downloadResult(index) {
    const res = this.results[index];
    if (!res || !res.success) return;

    const blob = new Blob([res.result], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed_${res.file}`;
    a.click();
    URL.revokeObjectURL(url);

    ToastManager.success(`Downloaded ${res.file}`);
  },

  // Download all results as ZIP
  async downloadResults() {
    const successResults = this.results.filter(r => r.success);
    if (successResults.length === 0) {
      ToastManager.error('No successful results to download');
      return;
    }

    // Simple ZIP-like download (individual files if no JSZip)
    if (successResults.length === 1) {
      this.downloadResult(this.results.indexOf(successResults[0]));
      return;
    }

    // Download as separate files with a small delay
    ToastManager.info('Downloading files...');
    for (const res of successResults) {
      await new Promise(resolve => {
        this.downloadResult(this.results.indexOf(res));
        setTimeout(resolve, 100);
      });
    }
    ToastManager.success('All files downloaded');
  },

  // Format bytes
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  // Escape HTML
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};
