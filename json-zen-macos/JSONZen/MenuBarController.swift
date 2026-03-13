import Cocoa

class MenuBarController: NSObject {

    private var window: NSWindow!
    private var statusItem: NSStatusItem!
    private var jsonEditorViewController: JSONEditorViewController!

    override init() {
        super.init()
        setupWindow()
        setupStatusItem()
    }

    private func setupWindow() {
        // Create the main window
        let windowRect = NSRect(x: 0, y: 0, width: 800, height: 600)
        window = NSWindow(
            contentRect: windowRect,
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )

        window.title = "JSON Zen"
        window.minSize = NSSize(width: 600, height: 400)
        window.center()

        // Set dark appearance
        window.appearance = NSAppearance(named: .darkAqua)

        // Create editor view controller
        jsonEditorViewController = JSONEditorViewController()
        window.contentViewController = jsonEditorViewController
    }

    private func setupStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)

        if let button = statusItem.button {
            button.image = NSImage(systemSymbolName: "curlybraces", accessibilityDescription: "JSON Zen")
            button.action = #selector(statusItemClicked)
            button.target = self
        }

        // Create menu
        let menu = NSMenu()
        menu.addItem(NSMenuItem(title: "Open JSON Zen", action: #selector(showWindow(_:)), keyEquivalent: ""))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "Format", action: #selector(formatJSON), keyEquivalent: ""))
        menu.addItem(NSMenuItem(title: "Minify", action: #selector(minifyJSON), keyEquivalent: ""))
        menu.addItem(NSMenuItem(title: "Fix", action: #selector(fixJSON), keyEquivalent: ""))
        menu.addItem(NSMenuItem(title: "Validate", action: #selector(validateJSON), keyEquivalent: ""))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "Quit", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))

        statusItem.menu = menu
    }

    @objc private func statusItemClicked() {
        showWindow(nil)
    }

    override func showWindow(_ sender: Any?) {
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    // MARK: - JSON Operations

    @objc func formatJSON() {
        showWindow(nil)
        jsonEditorViewController.formatJSON()
    }

    @objc func minifyJSON() {
        showWindow(nil)
        jsonEditorViewController.minifyJSON()
    }

    @objc func fixJSON() {
        showWindow(nil)
        jsonEditorViewController.fixJSON()
    }

    @objc func validateJSON() {
        showWindow(nil)
        jsonEditorViewController.validateJSON()
    }
}
