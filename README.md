<div align="center">

# JSON Zen

### The Ultimate JSON Toolkit — formatter, HTTP client, diff engine, bulk processor

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/sriinnu/json-zen)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](https://github.com/sriinnu/json-zen)
[![Browser](https://img.shields.io/badge/browser-Chrome%20%7C%20Firefox%20%7C%20Edge%20%7C%20Safari-orange.svg)](https://github.com/sriinnu/json-zen)
[![Manifest](https://img.shields.io/badge/manifest-v3-blueviolet.svg)](https://developer.chrome.com/docs/extensions/mv3/)

**Format, validate, fix, convert, transform, diff, and test JSON APIs — with a glassmorphism UI and 10 beautiful themes.**

[Features](#-features) • [Installation](#-installation) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## ✨ Features

JSON Zen is a comprehensive JSON toolkit built as a Manifest V3 browser extension. It started as a formatter and grew into a full workspace: HTTP client, diff engine, bulk file processor, schema validation, path explorer — all behind one toolbar icon.

### 🎯 Core Operations

| Feature | Description |
|---------|-------------|
| **Format/Prettify** | Transform minified JSON into beautifully formatted output with customizable indentation (2, 4, or 8 spaces, or tabs) |
| **Minify** | Compress JSON to its smallest possible size by removing all whitespace |
| **Validate** | Parse JSON syntax and provide detailed error reporting with exact positions |
| **Auto-Fix** | Intelligently repair common JSON formatting issues and syntax errors |
| **Sort Keys** | Alphabetically sort all object keys for consistent ordering |
| **Stats** | Analyze JSON structure: type counts, depth, byte size, key count |

### 🌐 HTTP Client

A built-in API testing tool — Postman-lite, never leaves your browser:

- **Request builder** — `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`
- **Tabs** for params, headers, body (JSON / Raw / Form), auth, and trace
- **Auth** — Bearer token, Basic auth, API key, plus a saved-token vault
- **Browser context** — auto-detect cookies and CSRF tokens from the active tab
- **Request history** — last 50 requests with full replay; save named requests
- **Packet trace** — request/response timing waterfall with size + status

### 🔀 Diff & Compare

Side-by-side JSON comparison with semantic coloring:

- **Visual diff** — additions in green, removals in red, modifications in yellow
- **Load from editor** — push current input/output into either side with one click
- **Statistics** — `N added, M removed, K modified` counters
- **Independent copy** — copy left, right, or merged result

### 📦 Bulk Processing

Process multiple JSON files at once through a dedicated tab:

- **Drag-and-drop** file selection (`.json` and `.txt` files)
- **Operations** — Format, Minify, Fix, Validate in batch
- **Progress tracking** — real-time progress bar with success/error counts
- **Download results** — export individually or as a single ZIP

### 📐 Schema Validation

Full JSON Schema Draft 7 support with a dedicated modal:

- **Template library** — pre-built schemas for User Profile, Configuration, API Response, Product, Address
- **Auto-generate** — generate a schema from any JSON data with one click
- **Detailed error reporting** — path-level validation errors with line numbers

### 🔄 Format Conversions

| Conversion | Direction |
|------------|-----------|
| **YAML** | JSON ↔ YAML |
| **XML** | JSON → XML |
| **CSV** | JSON → CSV (for arrays of objects) |
| **TOML** | JSON → TOML |
| **Base64** | Encode and Decode |
| **URL Encode** | JSON → URL-safe string |
| **Escape/Unescape** | String escaping for embedding JSON in strings |

### 🔧 Transform Operations

- **Remove Nulls** — strip all null values from JSON objects
- **Redact PII** — automatically detect and redact emails, phones, passwords, tokens
- **Flatten Keys** — convert nested objects into flat dot-notation keys

### 🔍 JSON Query

JSONPath-like query syntax to extract specific values from your data. Type paths like `.data.users[0].name` in the query bar and get instant results.

### 🗺️ Path Explorer

Interactive JSON navigation built into the output panel:

- **Breadcrumb navigation** — click through the structure level by level
- **Path search** — search keys/values, or type paths like `$.key.subkey`
- **Mini tree view** — collapsible structure overview for large documents
- **Copy path** — one-click copy of the current JSONPath

### 📜 History

- **History sidebar** — browse up to 50 past operations with full input/output
- **Search history** — filter by operation type or content
- **Star/favorite** to pin items at the top
- **Recent items dropdown** — quick access to the last 5 operations from the header

### 🖱️ Context Menus

Right-click any selected text on any page to **Format**, **Minify**, **Fix**, or **Validate** it in place. Results appear as toast notifications via the content script.

### 🎨 Themes

10 distinct themes plus a System mode that follows your OS preference:

| Theme | Vibe |
|-------|------|
| **Dark** | Default — neutral grays + brand blues |
| **Light** | Clean light mode |
| **Ocean** | Calming blue/teal |
| **Sunset** | Warm orange/pink |
| **Cyberpunk** | Neon cyan/magenta, high contrast |
| **Synthwave** | '80s purple gradients + Orbitron type |
| **Aurora** | Aurora-borealis blue/green/purple glows |
| **Nebula** | Deep purples, cosmic dust |
| **Crystal** | Glacial blues + prismatic shimmer |
| **Retro** | Old-school CRT terminal in VT323 pixel font |
| **System** | Follows OS light/dark preference |

Themes control colors, gradients, and effects. The **code font** is a separate setting (System Default, Fira Code, JetBrains Mono, Cascadia Code, Source Code Pro, Consolas, Courier New) — pick one in Settings and it applies across input, output, and diff editors regardless of theme.

Smart syntax highlighting with semantic key coloring (IDs → cyan, names → green, descriptions → amber, URLs → indigo, emails/phones → orange, status → purple, dates → red, counts → green).

### ⌨️ Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Format JSON | `Ctrl+Shift+F` | `Cmd+Shift+F` |
| Minify JSON | `Ctrl+Shift+M` | `Cmd+Shift+M` |
| Fix JSON | `Ctrl+Shift+X` | `Cmd+Shift+X` |
| Validate JSON | `Ctrl+Shift+V` | `Cmd+Shift+V` |

Shortcuts work both inside the popup and against selected JSON in any editable field on any page (via the content script).

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

Open the popup, click the **Settings** tab in the header. All settings sync across devices via `chrome.storage.sync`.

| Setting | Options |
|---------|---------|
| **Theme** | 10 themes + System |
| **Font size** | 80–150% slider |
| **Code font** | 7 monospaced font choices |
| **Indentation** | 2 spaces, 4 spaces, or Tabs |
| **Panel gap** | 4–20px slider |
| **Button size** | Compact, Normal, Large |
| **Line height** | 1.2–2.0 slider |
| **Compact mode** | Tightens overall density |
| **Auto-format on paste** | Format JSON automatically when pasting into the input |
| **Auto-copy output** | Copy results to the clipboard after every operation |

A legacy `options/options.html` page also exists for backwards compatibility, but the in-popup Settings tab is the primary surface going forward.

---

## 📖 Documentation

### Project Structure

```
json-zen/
├── README.md
├── LICENSE
├── package.json
├── json-zen-extension/
│   ├── manifest.json
│   ├── package.json
│   ├── background/
│   │   └── background.js          # Service worker: shortcuts + context menus
│   ├── content/
│   │   └── content-script.js      # In-page JSON ops + toast notifications
│   ├── popup/
│   │   ├── popup.html             # Main UI shell (Editor / HTTP / Diff / Bulk / Settings)
│   │   ├── popup.js               # App orchestration + caching + resize logic
│   │   ├── path-explorer.js       # JSON tree navigation (output panel)
│   │   └── modules/
│   │       ├── toast-manager.js   # Notification system
│   │       ├── theme-manager.js   # Theme + settings + sync persistence
│   │       ├── http-client.js     # API testing tab
│   │       ├── diff-engine.js     # JSON comparison
│   │       └── bulk-processor.js  # Multi-file batch ops
│   ├── options/
│   │   ├── options.html           # Legacy settings page (kept for compatibility)
│   │   ├── options.css
│   │   └── options.js
│   ├── utils/
│   │   └── json-utils.js          # Core JSON parse/format/fix/transform logic
│   ├── styles/
│   │   ├── main.css               # Entry point: imports tokens/base/layout/anim/effects
│   │   ├── tokens.css             # Design tokens (colors, spacing, type, shadows)
│   │   ├── base.css               # Resets + html/body sizing
│   │   ├── layout.css             # App shell composition
│   │   ├── animations.css         # Transitions + keyframes
│   │   ├── magic-effects.css      # Particles, aurora, shimmer, confetti
│   │   ├── components/            # Buttons, inputs, panels (scoped CSS)
│   │   └── themes/                # 10 theme files (one per theme)
│   └── icons/
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       └── icon128.png
└── json-zen-macos/
    ├── project.yml
    ├── JSONZen/
    └── JSONForgeTests/
```

### Architecture Notes

- **Modular CSS** — token-driven, theme-able, no monolithic stylesheet. Add a new theme by dropping a single CSS file into `styles/themes/`.
- **No bundler** — vanilla JS, no transpilation, no framework. Edit + reload.
- **MV3 service worker** — background script is minimal: only keyboard shortcut routing and context-menu wiring.
- **Settings sync** — every preference (theme, font, layout knobs, behavior toggles) persists via `chrome.storage.sync` and follows the user across devices signed into the same browser profile.

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
cd json-zen-extension && zip -r ../json-zen-v2.0.0.zip . -x '*.DS_Store'
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
3. **Make your changes** — follow the existing code style
4. **Test across browsers** — verify on Chrome, Firefox, and Edge
5. **Submit a Pull Request** with a clear description of your changes

### Development Guidelines

- **No external dependencies** — the extension runs without npm packages
- **Vanilla JS** — no frameworks, no transpilation
- **Manifest V3** — follow Chrome Extension Manifest V3 conventions
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
