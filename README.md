<div align="center">

# JSON Zen

### A Beautiful Cross-Platform JSON Toolkit

[![Version](https://img.shields.io/badge/version-1.0.3-blue.svg)](https://github.com/yourusername/json-zen)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](https://github.com/yourusername/json-zen)
[![Browser](https://img.shields.io/badge/browser-Chrome%20%7C%20Firefox%20%7C%20Edge%20%7C%20Safari-orange.svg)](https://github.com/yourusername/json-zen)

**Format, prettify, minify, validate, and fix JSON data with ease**

[Features](#-features) • [Installation](#-installation) • [Screenshots](#-screenshots) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## ✨ Features

JSON Zen provides a comprehensive suite of JSON manipulation tools designed for developers, data analysts, and anyone working with JSON data.

### 🎯 Core Operations

| Feature | Description |
|---------|-------------|
| **Format/Prettify** | Transform minified JSON into beautifully formatted, human-readable output with customizable indentation (2, 4, or 8 spaces/tabs) |
| **Minify** | Compress JSON to its smallest possible size by removing unnecessary whitespace and line breaks |
| **Validate** | Parse JSON syntax and provide detailed error reporting with exact line and column positions |
| **Auto-Fix** | Intelligently repair common JSON formatting issues and syntax errors |

### 🛠️ Advanced Tools

- **🌳 JSON Tree View** - Interactive, collapsible tree structure for navigating complex JSON objects
- **🔍 JSON Path Explorer** - Navigate and query specific paths within your JSON data
- **🔤 Sort Keys** - Alphabetically sort object keys for consistent ordering
- **🧹 Remove Null Values** - Clean up JSON by removing null entries
- **🔐 Base64 Encoding** - Encode/decode JSON data in Base64 format
- **🔗 URL-Safe Encoding** - Convert JSON for safe URL transmission

### 🎨 Theme Support

Beautiful syntax highlighting in both dark and light themes:

**Dark Theme (Default)**
- 🔵 Keys → Sky blue
- 🟢 Strings → Green
- 🟡 Numbers → Amber
- 🟣 Booleans → Violet
- ⚪ Null → Slate gray

**Light Theme**
- Optimized color variants for excellent contrast in bright environments

### ⌨️ Global Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Format JSON | `Ctrl+Shift+F` | `Cmd+Shift+F` |
| Minify JSON | `Ctrl+Shift+M` | `Cmd+Shift+M` |
| Validate JSON | `Ctrl+Shift+V` | `Cmd+Shift+V` |
| Fix JSON | `Ctrl+Shift+X` | `Cmd+Shift+X` |
| Copy Output | `Ctrl+C` | `Cmd+C` |
| Paste Input | `Ctrl+V` | `Cmd+V` |

---

## 🚀 Installation

Choose your preferred platform below. JSON Zen is available as both a browser extension and a native desktop application.

### 🌐 Browser Extension

**Supported Browsers:** Chrome, Firefox, Edge, Safari

#### Option 1: Install from Source (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/json-zen.git
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

#### Option 2: Install from Chrome Web Store (Coming Soon)

```markdown
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Download-green.svg)](https://chrome.google.com/webstore/detail/json-zen/xxxxx)
```

### 🍎 macOS Menu Bar App

A native macOS application with seamless menu bar integration.

#### Prerequisites
- macOS 11.0 (Big Sur) or later
- Xcode 14.0 or later (for building from source)

#### Installation from Source

1. **Clone and navigate to the macOS project**
   ```bash
   git clone https://github.com/yourusername/json-zen.git
   cd json-zen/json-zen-macos
   ```

2. **Open in Xcode**
   ```bash
   open JSONZen.xcodeproj
   ```

3. **Build and Run**
   - Select your target device (My Mac)
   - Press `Cmd + R` to build and run
   - Or press `Cmd + B` to build only

4. **Install to Applications** (Optional)
   - In Xcode, select "Product" → "Archive"
   - Right-click the archive → "Show in Finder"
   - Right-click → "Show Package Contents"
   - Copy the app to `/Applications`

#### Usage
- Click the JSON Zen icon in your menu bar
- Paste your JSON data using keyboard shortcuts or the paste button
- Use toolbar buttons or keyboard shortcuts to process your JSON
- Results are automatically copied to your clipboard

---

## 📸 Screenshots

### Browser Extension

<!--
![Browser Extension - Main Interface](screenshots/browser-extension-main.png)
*Main interface with formatted JSON*

![Browser Extension - Tree View](screenshots/browser-extension-tree.png)
*Interactive tree view navigation*

![Browser Extension - Dark Theme](screenshots/browser-extension-dark.png)
*Dark theme with syntax highlighting*
-->

#### Key Features
- **Clean, intuitive interface** - Paste, process, and copy in seconds
- **Real-time validation** - Instant feedback on JSON syntax
- **Multiple output formats** - Choose between formatted, minified, or tree view
- **Customizable settings** - Configure indentation, theme, and auto-copy behavior

### macOS Menu Bar App

<!--
![macOS App - Menu Bar Icon](screenshots/macos-menubar.png)
*Quick access from the menu bar*

![macOS App - Main Window](screenshots/macos-main.png)
*Main editor window with syntax highlighting*

![macOS App - Preferences](screenshots/macos-preferences.png)
*Configuration and preferences*
-->

#### Key Features
- **Menu bar integration** - Access JSON Zen from anywhere
- **Global keyboard shortcuts** - Process JSON without leaving your current app
- **Launch at login** - Always available when you need it
- **Native macOS experience** - Designed for macOS with native controls and gestures

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

### Browser Extension Settings

Access settings via the extension options page:

- **Indentation Style**: Choose between spaces or tabs
- **Indentation Size**: Select 2, 4, or 8 spaces
- **Theme**: Dark or light theme
- **Auto-Copy**: Automatically copy output to clipboard after operations
- **Line Numbers**: Show/hide line numbers in formatted output

### macOS App Preferences

Access preferences from the app menu (`JSON Zen → Preferences`):

- **All browser extension options** plus:
- **Launch at Login**: Start JSON Zen automatically when you log in
- **Global Hotkeys**: Enable/disable global keyboard shortcuts
- **Show in Menu Bar**: Toggle menu bar icon visibility
- **Notification Sounds**: Audio feedback for operations

---

## 📖 Documentation

### Project Structure

```
json-zen/
├── README.md                    # This file
├── LICENSE                      # MIT License
├── json-zen-extension/          # Browser extension
│   ├── manifest.json            # Extension manifest
│   ├── popup/                   # Popup interface
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── options/                 # Options page
│   │   ├── options.html
│   │   ├── options.css
│   │   └── options.js
│   ├── background/              # Background scripts
│   │   └── background.js
│   ├── utils/                   # Utility functions
│   │   ├── json-formatter.js
│   │   ├── json-minifier.js
│   │   ├── json-validator.js
│   │   └── json-fixer.js
│   ├── icons/                   # Extension icons
│   └── lib/                     # Third-party libraries
└── json-zen-macos/              # macOS application
    ├── JSONZen/
    │   ├── AppDelegate.swift
    │   ├── ViewController.swift
    │   ├── JSONProcessor.swift
    │   └── Resources/
    │       ├── Assets.xcassets
    │       └── Main.storyboard
    └── JSONZen.xcodeproj/       # Xcode project
```

### Development Setup

#### Browser Extension Development

1. **Navigate to extension directory**
   ```bash
   cd json-zen-extension
   ```

2. **Install dependencies** (if any)
   ```bash
   npm install
   ```

3. **Load as unpacked extension** in your browser

4. **Make changes** and reload the extension

#### macOS App Development

1. **Open Xcode project**
   ```bash
   cd json-zen-macos
   open JSONZen.xcodeproj
   ```

2. **Configure development team** in project settings

3. **Build and run** using Xcode

### Building for Distribution

#### Browser Extension
1. Update version in `manifest.json`
2. Test thoroughly across supported browsers
3. Zip the `json-zen-extension` directory
4. Submit to Chrome Web Store / Firefox Add-ons / Edge Add-ons

#### macOS App
1. Update version in Xcode project settings
2. Select "Any macOS Device (arm64, x86_64)" as destination
3. Product → Archive
4. Distribute via App Store or direct download

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Issues

- Use the [GitHub Issues](https://github.com/yourusername/json-zen/issues) page
- Include steps to reproduce the issue
- Provide screenshots if applicable
- Mention your OS/browser version

### Submitting Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/json-zen.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   - Test on multiple platforms/browsers
   - Ensure keyboard shortcuts work
   - Verify theme switching

5. **Commit and push**
   ```bash
   git add .
   git commit -m "Add your commit message"
   git push origin feature/your-feature-name
   ```

6. **Submit a Pull Request**
   - Describe your changes clearly
   - Reference related issues
   - Include screenshots for UI changes

### Development Guidelines

- **Code Style**: Follow the existing code style and formatting
- **Commits**: Write clear, concise commit messages
- **Testing**: Test across different platforms and browsers
- **Documentation**: Update README and inline documentation
- **Backwards Compatibility**: Maintain compatibility with existing features

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 JSON Zen Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🌟 Acknowledgments

- JSON parsing and validation powered by native browser APIs
- Syntax highlighting inspired by popular JSON editors
- Built with ❤️ for developers who work with JSON daily

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/json-zen/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/json-zen/discussions)
- **Email**: support@jsonzen.dev

---

<div align="center">

**Made with ❤️ by the JSON Zen Team**

[⬆ Back to Top](#json-zen)

</div>
