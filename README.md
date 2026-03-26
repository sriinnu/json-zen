<div align="center">

# JSON Zen

### A Beautiful Cross-Platform JSON Toolkit

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/sriinnu/json-zen)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](https://github.com/sriinnu/json-zen)
[![Browser](https://img.shields.io/badge/browser-Chrome%20%7C%20Firefox%20%7C%20Edge%20%7C%20Safari-orange.svg)](https://github.com/sriinnu/json-zen)
[![Manifest](https://img.shields.io/badge/manifest-v3-blueviolet.svg)](https://developer.chrome.com/docs/extensions/mv3/)

**Format, validate, fix, convert, and transform JSON data with a glassmorphism UI and 6 beautiful themes**

[Features](#-features) • [Installation](#-installation) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## ✨ Features

JSON Zen is a comprehensive JSON toolkit built as a browser extension with a glassmorphism UI. It covers everything from basic formatting to schema validation, format conversions, bulk processing, and interactive path exploration.

### 🎯 Core Operations

| Feature | Description |
|---------|-------------|
| **Format/Prettify** | Transform minified JSON into beautifully formatted output with customizable indentation (2, 4, or 8 spaces, or tabs) |
| **Minify** | Compress JSON to its smallest possible size by removing all whitespace |
| **Validate** | Parse JSON syntax and provide detailed error reporting with exact positions |
| **Auto-Fix** | Intelligently repair common JSON formatting issues and syntax errors |
| **Sort Keys** | Alphabetically sort all object keys for consistent ordering |
| **Stats** | Analyze JSON structure: type counts, depth, byte size, key count |

### 📐 Schema Validation

Full JSON Schema Draft 7 support with a dedicated modal interface:

- **Template library** - Pre-built schemas for User Profile, Configuration, API Response, Product, and Address
- **Auto-generate** - Generate a schema from any JSON data with one click
- **Detailed error reporting** - Path-level validation errors with line numbers

### 🔄 Format Conversions

| Conversion | Direction |
|------------|-----------|
| **YAML** | JSON → YAML and YAML → JSON |
| **XML** | JSON → XML |
| **CSV** | JSON → CSV (for arrays of objects) |
| **TOML** | JSON → TOML |
| **Base64** | Encode and Decode |
| **URL Encode** | JSON → URL-safe string |
| **Escape/Unescape** | String escaping for embedding JSON in strings |

### 🔧 Transform Operations

- **Remove Nulls** - Strip all null values from JSON objects
- **Redact PII** - Automatically detect and redact emails, phones, passwords, tokens, and other sensitive fields
- **Flatten Keys** - Convert nested objects into flat dot-notation keys

### 🔍 JSON Query

JSONPath-like query syntax to extract specific values from your data. Type paths like `.data.users[0].name` in the query bar and get instant results.

### 🗺️ Path Explorer

Interactive JSON navigation built into the output panel:

- **Breadcrumb navigation** - Click through the JSON structure level by level
- **Path search** - Search keys and values, or type paths like `$.key.subkey`
- **Mini tree view** - Collapsible structure overview for large documents
- **Copy path** - One-click copy of the current JSONPath

### 📦 Bulk Processing

Process multiple JSON files at once through a dedicated modal:

- **Drag-and-drop** file selection (`.json` and `.txt` files)
- **Operations** - Format, Minify, Fix, Validate, or Convert in batch
- **Progress tracking** - Real-time progress bar with success/error counts
- **Download results** - Export all processed files as a ZIP

### 📜 History

- **History sidebar** - Browse up to 50 past operations with full input/output
- **Search history** - Filter by operation type or content
- **Star/favorite** items to pin them at the top
- **Recent items dropdown** - Quick access to your last 5 operations from the header

### 🖱️ Context Menus

Right-click any selected text on any page to:

- **Format JSON** - Prettify selected JSON in-place
- **Minify JSON** - Compress selected JSON
- **Fix JSON** - Auto-repair selected JSON
- **Validate JSON** - Check if selected text is valid JSON

Results appear as toast notifications via the content script.

### 🎨 Themes & Syntax Highlighting

Six beautiful themes with unique fonts:

| Theme | Description | Font |
|-------|-------------|------|
| **Dark** | Deep dark with blue accents | Operator Mono* / SF Mono |
| **Light** | Clean light mode | IBM Plex Mono |
| **Ocean** | Calming blue/teal tones | Monaspace Radon |
| **Sunset** | Warm orange/pink vibes | Victor Mono |
| **Retro** | Old-school CRT terminal | VT323 (pixel font) |
| **System** | Follows OS preference | System default |

*\*Operator Mono requires local installation or bundling WOFF files in the extension*

Smart syntax highlighting with semantic key coloring:
- IDs and references → Cyan
- Names and titles → Green
- Descriptions and content → Amber
- URLs and links → Indigo
- Email and phone → Orange
- Status and type → Purple
- Dates and timestamps → Red
- Counts and sizes → Green

### ⌨️ Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Format JSON | `Ctrl+Shift+F` | `Cmd+Shift+F` |
| Minify JSON | `Ctrl+Shift+M` | `Cmd+Shift+M` |
| Fix JSON | `Ctrl+Shift+X` | `Cmd+Shift+X` |
| Validate JSON | `Ctrl+Shift+V` | `Cmd+Shift+V` |

---

## 🚀 Installation

### 🌐 Browser Extension

**Supported Browsers:** Chrome, Firefox, Edge, Safari

#### Install from Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/sriinnu/json-zen.git
   cd json-zen
   ```

2. **Load the extension in your browser**

   **Chrome/Edge:**
   - Navigate to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `json-zen-extension` directory

   **Firefox:**
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select `json-zen-extension/manifest.json`

   **Safari:**
   - Enable Developer menu in Safari → Preferences → Advanced
   - Develop → Allow Unsigned Extensions
   - File → Open in `json-zen-extension` directory

That's it. No build step, no npm install. Pure browser extension.

### 🍎 macOS Menu Bar App

A separate native macOS application lives in `json-zen-macos/`. It provides the same core JSON operations with menu bar integration, global hotkeys, and launch-at-login support.

#### Prerequisites
- macOS 11.0 (Big Sur) or later
- Xcode 14.0 or later (for building from source)

#### Build from Source

```bash
cd json-zen-macos
open JSONZen.xcodeproj
# Press Cmd+R to build and run
```

---

## 🔧 JSON Fixing Capabilities

The intelligent JSON fixer automatically repairs common issues:

| Issue Type | Examples | Auto-Fix |
|------------|----------|----------|
| **Trailing Commas** | `{"key": "value",}` | ✅ Removes trailing commas |
| **Missing Quotes** | `{key: "value"}` | ✅ Adds quotes to keys |
| **Single Quotes** | `{'key': 'value'}` | ✅ Converts to double quotes |
| **JavaScript Comments** | `// comment` or `/* comment */` | ✅ Removes comments |
| **Missing Brackets** | `{"key": "value"` | ✅ Adds closing brackets/braces |
| **Unquoted Strings** | `{key: value}` | ✅ Quotes string values |
| **Common Typos** | `falue`, `ture`, `undefiend` | ✅ Corrects to `false`, `true`, `undefined` |

---

## ⚙️ Configuration

Access settings via the extension options page (`Right-click extension icon → Options`):

| Setting | Options |
|---------|---------|
| **Indentation Size** | 2 spaces, 4 spaces, 8 spaces, or Tabs |
| **Theme** | Dark, Light, or System |
| **Auto-Copy** | Automatically copy output to clipboard after operations |
| **Auto-Format on Paste** | Automatically format JSON when pasting into the input |

---

## 📖 Documentation

### Project Structure

```
json-zen/
├── README.md
├── LICENSE
├── json-zen-extension/
│   ├── manifest.json
│   ├── package.json
│   ├── background/
│   │   └── background.js
│   ├── content/
│   │   └── content-script.js
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   ├── popup-script.js
│   │   ├── path-explorer.js
│   │   └── bulk-processor.js
│   ├── options/
│   │   ├── options.html
│   │   ├── options.css
│   │   └── options.js
│   ├── utils/
│   │   └── json-utils.js
│   └── icons/
│       ├── icon16.svg
│       ├── icon32.svg
│       ├── icon48.svg
│       └── icon128.svg
└── json-zen-macos/
    ├── project.yml
    ├── JSONZen/
    └── JSONForgeTests/
```

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/sriinnu/json-zen.git
   cd json-zen
   ```

2. **Load as unpacked extension** in your browser (see [Installation](#-installation))

3. **Make changes** and reload the extension (`Ctrl+R` on the extensions page)

No build tools, no bundler, no dependencies. Edit the source files directly and reload.

### Building for Distribution

```bash
# Create a distributable ZIP
npm run zip
# Or manually:
cd json-zen-extension && zip -r ../json-zen-v1.2.0.zip . -x '*.DS_Store'
```

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Issues

- Use the [GitHub Issues](https://github.com/sriinnu/json-zen/issues) page
- Include steps to reproduce the issue
- Provide screenshots if applicable
- Mention your OS/browser version

### Submitting Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** - follow the existing code style
4. **Test across browsers** - verify on Chrome, Firefox, and Edge
5. **Submit a Pull Request** with a clear description of your changes

### Development Guidelines

- **No external dependencies** - the extension runs without npm packages
- **Vanilla JS** - no frameworks, no transpilation
- **Manifest V3** - follow Chrome Extension Manifest V3 conventions
- **Test keyboard shortcuts** and theme switching after changes

---

## 📝 Copyright

(c) 2020-2026 Srinivas Pendela. Licensed under the [MIT License](LICENSE).

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/sriinnu/json-zen/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sriinnu/json-zen/discussions)

---

<div align="center">

**Made with love by Srinivas Pendela**

[Back to Top](#json-zen)

</div>
