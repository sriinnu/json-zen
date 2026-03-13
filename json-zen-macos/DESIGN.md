# JSON Zen - macOS App Design

## Native Apple Design Language + Glassmorphism

### Visual Design
```
┌─────────────────────────────────────────────────────────────┐
│  🔍 JSON Zen                              ⚙️  🌙  □         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Input JSON                    [Paste] [Clear]     │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ {                                                   │    │
│  │   "name": "JSON Zen",                               │    │
│  │   "version": "1.0.0"                                │    │
│  │ }                                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Output                       1,234 chars  [Copy]   │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ {                                                   │    │
│  │   "name": "JSON Zen",                               │    │
│  │   "version": "1.0.0"                                │    │
│  │ }                                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  [Format] [Minify] [Fix] [Validate] [Sort]                  │
│                                                              │
│  Ready                                      ⌘⇧F ⌘⇧M ⌘⇧X   │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. Glassmorphism Panel (NSVisualEffectView)
```swift
class GlassPanel: NSVisualEffectView {
    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        self.material = .hudWindow
        self.blendingMode = .behindWindow
        self.state = .active
        self.wantsLayer = true
        self.layer?.cornerRadius = 12
    }
}
```

#### 2. Styled Buttons with Glow
```swift
class StyledButton: NSButton {
    var glowColor: NSColor = .controlAccentColor {
        didSet { updateGlow() }
    }

    private func updateGlow() {
        let shadow = NSShadow()
        shadow.shadowColor = glowColor.withAlphaComponent(0.5)
        shadow.shadowOffset = .zero
        shadow.shadowBlurRadius = 8
        self.shadow = shadow
    }
}
```

#### 3. Syntax Highlighting (NSTextView)
```swift
extension NSTextView {
    func applySyntaxHighlighting(to json: String) {
        let attrString = NSMutableAttributedString(string: json)
        // Apply colors for keys, strings, numbers, booleans
        attrString.addAttribute(.foregroundColor, value: NSColor.systemBlue,
                              range: keyRange)
        // ... more highlighting
        self.textStorage?.setAttributedString(attrString)
    }
}
```

### Menu Bar Integration

#### Menu Bar Icon
```swift
// Use SF Symbols for menu bar
let statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
statusItem.button?.image = NSImage(systemSymbolName: "curlybraces",
                                   accessibilityDescription: "JSON Zen")
```

#### Menu Bar Menu
```swift
let menu = NSMenu()
menu.addItem(NSMenuItem(title: "Format JSON", action: #selector(formatJSON), keyEquivalent: "f"))
menu.addItem(NSMenuItem(title: "Minify JSON", action: #selector(minifyJSON), keyEquivalent: "m"))
menu.addItem(NSMenuItem.separator())
menu.addItem(NSMenuItem(title: "Preferences...", action: #selector(openPrefs), keyEquivalent: ","))
menu.addItem(NSMenuItem.separator())
menu.addItem(NSMenuItem(title: "Quit JSON Zen", action: #selector(quit), keyEquivalent: "q"))
```

### Touch Bar Support

```swift
override func makeTouchBar() -> NSTouchBar? {
    let touchBar = NSTouchBar()
    touchBar.delegate = self

    touchBar.defaultItemIdentifiers = [
        .format, .minify, .fix, .validate, .flexibleSpace, .status
    ]

    return touchBar
}
```

### Keyboard Shortcuts

```swift
// Global hotkeys using Carbon or LMAShortcut
let shortcuts = [
    JSONShortcut(key: "f", modifiers: [.command, .shift], action: #selector(format)),
    JSONShortcut(key: "m", modifiers: [.command, .shift], action: #selector(minify)),
    JSONShortcut(key: "x", modifiers: [.command, .shift], action: #selector(fix)),
    JSONShortcut(key: "v", modifiers: [.command, .shift], action: #selector(validate))
]
```

### macOS-Specific Features

#### 1. Quick Actions (Finder Extension)
```swift
// Finder Sync Extension for context menu
class FinderSync: FIFinderSync {
    override var menu: NSMenu! {
        let menu = NSMenu()
        let formatItem = NSMenuItem(title: "Format JSON with JSON Zen",
                                    action: #selector(formatSelection), keyEquivalent: "")
        menu.addItem(formatItem)
        return menu
    }
}
```

#### 2. Widget (Notification Center)
```swift
// Simple widget for quick format
struct JSONZenWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "QuickFormat", provider: Provider()) { entry in
            WidgetView(entry: entry)
        }
        .configurationDisplayName("Quick Format")
        .description("Format JSON from clipboard")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

#### 3. Spotlight Importer
```swift
// Index JSON files for Spotlight
class SpotlightImporter {
    func importFile(at url: URL) -> Bool {
        // Parse and index JSON content
        // Make searchable via Spotlight
    }
}
```

### Native Color Themes

```swift
enum Theme: String, CaseIterable {
    case dark, light, midnight, cyberpunk, forest

    var colors: ThemeColors {
        switch self {
        case .dark:
            return ThemeColors(
                background: NSColor(rgb: 0x1C1C1E),
                surface: NSColor(rgb: 0x2C2C2E),
                accent: NSColor(rgb: 0x3B82F6)
            )
        case .midnight:
            return ThemeColors(
                background: NSColor(rgb: 0x0A0A0F),
                surface: NSColor(rgb: 0x14141A),
                accent: NSColor(rgb: 0x60A5FA)
            )
        // ... more themes
        }
    }
}
```

### Animations with Core Animation

```swift
// Success animation
func showSuccessAnimation() {
    let checkmark = CAShapeLayer()
    checkmark.path = checkmarkPath
    checkmark.strokeEnd = 0

    let animate = CABasicAnimation(keyPath: "strokeEnd")
    animate.fromValue = 0
    animate.toValue = 1
    animate.duration = 0.6
    animate.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)

    checkmark.add(animate, forKey: "draw")
    view.layer?.addSublayer(checkmark)
}

// Panel slide animation
func animatePanelIn(_ panel: NSView) {
    let animation = CABasicAnimation(keyPath: "position.y")
    animation.fromValue = panel.frame.origin.y + 50
    animation.toValue = panel.frame.origin.y
    animation.duration = 0.3
    animation.timingFunction = CAMediaTimingFunction(name: .easeOut)

    panel.layer?.add(animation, forKey: "slideIn")
}
```

### Haptic Feedback

```swift
// Provide haptic feedback on success
func triggerHaptic(_ pattern: NSHapticFeedbackManager.FeedbackPattern) {
    NSHapticFeedbackManager.defaultPerformer.perform(pattern,
                                                    performanceTime: .default)
}

// Usage
triggerHaptic(.generic)     // On button click
triggerHaptic(.success)     // On successful operation
triggerHaptic(.warning)     // On validation error
triggerHaptic(.alignment)   // On auto-format
```

### Native Accessibility

```swift
// Full VoiceOver support
formatButton.setAccessibilityTitle("Format JSON")
formatButton.setAccessibilityHelp("Formats the JSON input with proper indentation")
formatButton.setAccessibilityModifierFlags(.command, .shift)

// Dynamic type support
textView.font = NSFont.preferredFont(forTextStyle: .body)
// Adjusts based on user's system font size setting
```

### Window Style

```swift
class MainWindow: NSWindow {
    override init(contentRect: NSRect,
                  styleMask style: NSWindow.StyleMask,
                  backing backingStoreType: NSWindow.BackingStoreType,
                  defer flag: Bool) {
        super.init(contentRect: contentRect,
                  styleMask: [.titled, .closable, .miniaturizable, .resizable,
                              .fullSizeContentView],
                  backing: backingStoreType,
                  defer: flag)

        // Titlebar with transparent background
        self.titlebarAppearsTransparent = true
        self.titleVisibility = .hidden

        // Vibrant dark background
        self.isOpaque = false
        self.backgroundColor = .clear

        // Enable layer hosting for smooth animations
        self.contentView?.wantsLayer = true
    }
}
```

### File Drag & Drop

```swift
class DropAreaView: NSView {
    override func awakeFromNib() {
        super.awakeFromNib()
        registerForDraggedTypes([.fileURL])
    }

    override func draggingEntered(_ sender: NSDraggingInfo) -> NSDragOperation {
        // Show visual feedback
        layer?.backgroundColor = NSColor.controlAccentColor.withAlphaComponent(0.1).cgColor
        return .copy
    }

    override func performDragOperation(_ sender: NSDraggingInfo) -> Bool {
        guard let urls = sender.draggingPasteboard.readObjects(forClasses: [NSURL.self],
                                                             options: nil) as? [URL] else {
            return false
        }

        // Load and process JSON files
        urls.forEach { loadJSON(from: $0) }
        return true
    }
}
```

### Preferences Window

```swift
class PreferencesWindow: NSWindowController {
    enum Tab: String, CaseIterable {
        case general = "General"
        case appearance = "Appearance"
        case shortcuts = "Shortcuts"
        case advanced = "Advanced"
    }

    func showTab(_ tab: Tab) {
        let toolbar = NSToolbar()
        toolbar.delegate = self
        window?.toolbar = toolbar
        // ... switch tab content
    }
}
```

### Notifications

```swift
// Send notification when background operation completes
let notification = NSUserNotification()
notification.title = "JSON Zen"
notification.informativeText = "Successfully formatted JSON"
notification.soundName = NSUserNotificationDefaultSoundName
NSUserNotificationCenter.default.deliver(notification)
```

### CLI Tool

```bash
# Install CLI tool via symlink
ln -s /Applications/JSONZen.app/Contents/MacOS/jsonzen /usr/local/bin/jsonzen

# Usage
jsonzen format file.json          # Format and print
jsonzen format file.json -o out   # Format and save
jsonzen minify file.json          # Minify JSON
jsonzen validate file.json        # Validate JSON
jsonzen fix file.json             # Fix and save
```

---

## Design Philosophy for macOS

1. **Native Feel**: Use standard macOS controls and patterns
2. **Keyboard First**: Everything accessible via keyboard
3. **Visual Feedback**: Animations, haptics, sounds
4. **Integration**: Finder, Spotlight, Services, Touch Bar
5. **Performance**: Instant response, no lag
6. **Accessibility**: Full VoiceOver support
