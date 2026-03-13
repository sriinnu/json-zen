# JSON Zen - Skill Specification

## Overview
- **Skill Name**: JSON Zen
- **Type**: Cross-platform JSON utility (Browser Extension + macOS Menu Bar App)
- **Core Functionality**: Format, prettify, minify, validate, and fix JSON data
- **Target Users**: Developers, API testers, data analysts, anyone working with JSON

## Platform Targets
1. **Browser Extension**: Chrome, Firefox, Edge, Safari support
2. **macOS Menu Bar App**: Native app with menu bar presence

## Core Features

### 1. JSON Formatting (Prettify)
- Convert minified JSON to human-readable format
- Configurable indentation (2 spaces, 4 spaces, tabs)
- Syntax highlighting with customizable themes
- Line numbers display

### 2. JSON Minification
- Remove all whitespace and formatting
- Produce smallest possible JSON output
- One-click copy to clipboard

### 3. JSON Validation & Fixing
- Validate JSON syntax
- Auto-fix common issues:
  - Trailing commas
  - Missing quotes on keys
  - Single quotes to double quotes
  - Unquoted string values
  - Comments removal (// and /* */)
  - Missing closing brackets/braces
- Display error locations with line/column info

### 4. Additional Features
- JSON path explorer (query JSON with JMESPath-like syntax)
- JSON tree view with expand/collapse
- Compare two JSON objects (diff view)
- Sort keys alphabetically
- Remove null values
- Base64 encode/decode JSON
- URL-safe JSON encoding

## Architecture

### Browser Extension Structure
```
json-zen-extension/
├── manifest.json          # Extension manifest (MV3)
├── popup/
│   ├── popup.html        # Main popup UI
│   ├── popup.css         # Styles
│   └── popup.js          # Logic
├── background/
│   └── background.js     # Service worker
├── options/
│   ├── options.html      # Settings page
│   ├── options.css
│   └── options.js
├── icons/
│   ├── icon16.svg
│   ├── icon32.svg
│   ├── icon48.svg
│   └── icon128.svg
└── utils/
    └── json-utils.js     # Core JSON functions
```

### macOS App Structure
```
json-zen-macos/
├── JSONZen/
│   ├── AppDelegate.swift
│   ├── MainWindow.swift
│   ├── MenuBarController.swift
│   ├── Views/
│   │   ├── JSONEditorView.swift
│   │   ├── JSONTreeView.swift
│   │   └── ToolbarView.swift
│   ├── Models/
│   │   ├── JSONDocument.swift
│   │   └── JSONNode.swift
│   ├── Services/
│   │   ├── JSONFormatter.swift
│   │   ├── JSONValidator.swift
│   │   └── JSONFixer.swift
│   ├── Resources/
│   │   └── Assets.xcassets
│   └── JSONZen.entitlements
└── JSONZenTests/
```

## UI/UX Specification

### Color Palette
- **Primary**: #2563EB (Blue 600)
- **Secondary**: #1E293B (Slate 800)
- **Accent**: #10B981 (Emerald 500)
- **Error**: #EF4444 (Red 500)
- **Warning**: #F59E0B (Amber 500)
- **Background**: #0F172A (Slate 900)
- **Surface**: #1E293B (Slate 800)
- **Text Primary**: #F8FAFC (Slate 50)
- **Text Secondary**: #94A3B8 (Slate 400)

### Syntax Highlighting Themes

#### Dark Theme (Default)
- Keys: #7DD3FC (Sky 300)
- Strings: #86EFAC (Green 300)
- Numbers: #FCD34D (Amber 300)
- Booleans: #C4B5FD (Violet 300)
- Null: #94A3B8 (Slate 400)
- Brackets: #F8FAFC (Slate 50)

#### Light Theme
- Keys: #0369A1 (Sky 700)
- Strings: #15803D (Green 700)
- Numbers: #B45309 (Amber 700)
- Booleans: #7C3AED (Violet 700)
- Null: #64748B (Slate 500)
- Brackets: #0F172A (Slate 900)

## Keyboard Shortcuts
- **Ctrl/Cmd + Shift + F**: Format JSON
- **Ctrl/Cmd + Shift + M**: Minify JSON
- **Ctrl/Cmd + Shift + V**: Validate JSON
- **Ctrl/Cmd + Shift + X**: Fix JSON
- **Ctrl/Cmd + C**: Copy output
- **Ctrl/Cmd + V**: Paste input

## JSON Fixing Rules
1. Remove single-line comments (// ...)
2. Remove multi-line comments (/* ... */)
3. Add missing quotes to unquoted keys
4. Replace single quotes with double quotes
5. Remove trailing commas
6. Add missing closing brackets/braces
7. Remove trailing null values in arrays
8. Fix common typos (falue → false, ture → true)

## Acceptance Criteria
- [ ] Browser extension installs on Chrome, Firefox, Edge
- [ ] macOS app builds and runs on macOS 12+
- [ ] Format function produces valid, readable JSON
- [ ] Minify function produces smallest valid JSON
- [ ] Fix function handles at least 10 common JSON errors
- [ ] All operations complete in < 100ms for 1MB JSON
- [ ] Syntax highlighting renders correctly
- [ ] Copy to clipboard works across all platforms
- [ ] Error messages are clear and helpful
