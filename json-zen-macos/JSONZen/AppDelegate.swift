import Cocoa

@main
class AppDelegate: NSObject, NSApplicationDelegate {

    private var menuBarController: MenuBarController?

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Initialize menu bar controller
        menuBarController = MenuBarController()

        // Setup main menu
        setupMainMenu()
    }

    func applicationWillTerminate(_ notification: Notification) {
        // Cleanup
    }

    func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool {
        return true
    }

    private func setupMainMenu() {
        let mainMenu = NSMenu()

        // App menu
        let appMenuItem = NSMenuItem()
        mainMenu.addItem(appMenuItem)
        let appMenu = NSMenu()
        appMenuItem.submenu = appMenu

        appMenu.addItem(NSMenuItem(title: "About JSON Zen", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: ""))
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(NSMenuItem(title: "Preferences...", action: #selector(showPreferences), keyEquivalent: ","))
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(NSMenuItem(title: "Quit JSON Zen", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))

        // Edit menu
        let editMenuItem = NSMenuItem()
        mainMenu.addItem(editMenuItem)
        let editMenu = NSMenu(title: "Edit")
        editMenuItem.submenu = editMenu

        editMenu.addItem(NSMenuItem(title: "Undo", action: Selector(("undo:")), keyEquivalent: "z"))
        editMenu.addItem(NSMenuItem(title: "Redo", action: Selector(("redo:")), keyEquivalent: "Z"))
        editMenu.addItem(NSMenuItem.separator())
        editMenu.addItem(NSMenuItem(title: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x"))
        editMenu.addItem(NSMenuItem(title: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c"))
        editMenu.addItem(NSMenuItem(title: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v"))
        editMenu.addItem(NSMenuItem(title: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a"))

        // JSON menu
        let jsonMenuItem = NSMenuItem()
        mainMenu.addItem(jsonMenuItem)
        let jsonMenu = NSMenu(title: "JSON")
        jsonMenuItem.submenu = jsonMenu

        let formatItem = NSMenuItem(title: "Format", action: #selector(MenuBarController.formatJSON), keyEquivalent: "f")
        formatItem.keyEquivalentModifierMask = [.command, .shift]
        jsonMenu.addItem(formatItem)

        let minifyItem = NSMenuItem(title: "Minify", action: #selector(MenuBarController.minifyJSON), keyEquivalent: "m")
        minifyItem.keyEquivalentModifierMask = [.command, .shift]
        jsonMenu.addItem(minifyItem)

        let fixItem = NSMenuItem(title: "Fix", action: #selector(MenuBarController.fixJSON), keyEquivalent: "x")
        fixItem.keyEquivalentModifierMask = [.command, .shift]
        jsonMenu.addItem(fixItem)

        let validateItem = NSMenuItem(title: "Validate", action: #selector(MenuBarController.validateJSON), keyEquivalent: "v")
        validateItem.keyEquivalentModifierMask = [.command, .shift]
        jsonMenu.addItem(validateItem)

        // Window menu
        let windowMenuItem = NSMenuItem()
        mainMenu.addItem(windowMenuItem)
        let windowMenu = NSMenu(title: "Window")
        windowMenuItem.submenu = windowMenu

        windowMenu.addItem(NSMenuItem(title: "Minimize", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m"))
        windowMenu.addItem(NSMenuItem(title: "Zoom", action: #selector(NSWindow.performZoom(_:)), keyEquivalent: ""))
        windowMenu.addItem(NSMenuItem.separator())
        windowMenu.addItem(NSMenuItem(title: "Bring All to Front", action: #selector(NSApplication.arrangeInFront(_:)), keyEquivalent: ""))

        NSApplication.shared.mainMenu = mainMenu
    }

    @objc private func showPreferences() {
        menuBarController?.showWindow(nil)
    }
}
