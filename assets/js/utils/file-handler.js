/**
 * File Handler
 * Handle file upload, download, and processing
 */

class FileHandler {
  constructor() {
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
  }

  /**
   * Read file as text
   * @param {File} file
   * @returns {Promise<string>}
   */
  async readAsText(file) {
    return new Promise((resolve, reject) => {
      if (file.size > this.maxFileSize) {
        reject(new Error(`File too large. Max size: ${this.maxFileSize / 1024 / 1024}MB`));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Read file as Data URL
   * @param {File} file
   * @returns {Promise<string>}
   */
  async readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      if (file.size > this.maxFileSize) {
        reject(new Error(`File too large. Max size: ${this.maxFileSize / 1024 / 1024}MB`));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Parse JSON file
   * @param {File} file
   * @returns {Promise<Object>}
   */
  async parseJSON(file) {
    const text = await this.readAsText(file);
    
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error('Invalid JSON file format');
    }
  }

  /**
   * Download text as file
   * @param {string} content - File content
   * @param {string} filename - File name
   * @param {string} mimeType - MIME type
   */
  downloadText(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    this.downloadBlob(blob, filename);
  }

  /**
   * Download JSON as file
   * @param {Object} data - JSON data
   * @param {string} filename - File name
   */
  downloadJSON(data, filename) {
    const content = JSON.stringify(data, null, 2);
    this.downloadText(content, filename, 'application/json');
  }

  /**
   * Download Blob as file
   * @param {Blob} blob - Blob data
   * @param {string} filename - File name
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    console.log(`📥 Downloaded: ${filename}`);
  }

  /**
   * Create ZIP file from files object
   * @param {Object} files - Object with filename: content pairs
   * @param {string} zipFilename - ZIP file name
   * @returns {Promise<void>}
   */
  async createZIP(files, zipFilename) {
    if (!window.JSZip) {
      throw new Error('JSZip library not loaded');
    }

    const zip = new JSZip();

    // Add files to ZIP
    for (const [filename, content] of Object.entries(files)) {
      if (typeof content === 'string') {
        zip.file(filename, content);
      } else if (content instanceof Blob) {
        zip.file(filename, content);
      } else {
        zip.file(filename, JSON.stringify(content, null, 2));
      }
    }

    // Generate ZIP
    const blob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Download
    this.downloadBlob(blob, zipFilename);
  }

  /**
   * Extract ZIP file
   * @param {File} file - ZIP file
   * @returns {Promise<Object>} Object with filename: content pairs
   */
  async extractZIP(file) {
    if (!window.JSZip) {
      throw new Error('JSZip library not loaded');
    }

    const zip = await JSZip.loadAsync(file);
    const files = {};

    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir) {
        const content = await zipEntry.async('text');
        files[filename] = content;
      }
    }

    console.log(`📦 Extracted ${Object.keys(files).length} files from ZIP`);
    return files;
  }

  /**
   * Validate file type
   * @param {File} file
   * @param {Array<string>} allowedTypes - Allowed MIME types or extensions
   * @returns {boolean}
   */
  validateFileType(file, allowedTypes) {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    return allowedTypes.some(type => {
      if (type.startsWith('.')) {
        // Extension check
        return fileName.endsWith(type.toLowerCase());
      } else {
        // MIME type check
        return fileType.includes(type.toLowerCase());
      }
    });
  }

  /**
   * Format file size
   * @param {number} bytes
   * @returns {string}
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file extension
   * @param {string} filename
   * @returns {string}
   */
  getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  /**
   * Generate safe filename
   * @param {string} name - Original name
   * @param {string} extension - File extension
   * @returns {string}
   */
  generateSafeFilename(name, extension = '') {
    // Remove special characters
    const safeName = name
      .replace(/[^a-z0-9_-]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
    
    // Add timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    // Add extension
    const ext = extension ? (extension.startsWith('.') ? extension : `.${extension}`) : '';
    
    return `${safeName}_${timestamp}${ext}`;
  }

  /**
   * Create file input and trigger selection
   * @param {Object} options - File input options
   * @returns {Promise<File>}
   */
  async selectFile(options = {}) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      
      if (options.accept) {
        input.accept = options.accept;
      }
      
      if (options.multiple) {
        input.multiple = true;
      }

      input.onchange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
          resolve(options.multiple ? Array.from(files) : files[0]);
        } else {
          reject(new Error('No file selected'));
        }
      };

      input.click();
    });
  }

  /**
   * Copy text to clipboard
   * @param {string} text
   * @returns {Promise<boolean>}
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      console.log('📋 Copied to clipboard');
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('📋 Copied to clipboard (fallback)');
        return true;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  }
}

// Create global instance
window.fileHandler = new FileHandler();

// Export for modules
export default FileHandler;
