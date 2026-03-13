import Cocoa

class JSONEditorViewController: NSViewController {

    private var splitView: NSSplitView!
    private var inputScrollView: NSScrollView!
    private var outputScrollView: NSScrollView!
    private var inputTextView: NSTextView!
    private var outputTextView: NSTextView!
    private var toolbar: NSView!
    private var statusLabel: NSTextField!

    private let jsonFormatter = JSONFormatter()

    override func loadView() {
        view = NSView(frame: NSRect(x: 0, y: 0, width: 800, height: 600))
        view.wantsLayer = true
        view.layer?.backgroundColor = NSColor(red: 0.06, green: 0.09, blue: 0.16, alpha: 1.0).cgColor

        setupUI()
    }

    private func setupUI() {
        setupToolbar()
        setupSplitView()
        setupStatusBar()
    }

    private func setupToolbar() {
        toolbar = NSView()
        toolbar.translatesAutoresizingMaskIntoConstraints = false
        toolbar.wantsLayer = true
        toolbar.layer?.backgroundColor = NSColor(red: 0.12, green: 0.16, blue: 0.24, alpha: 1.0).cgColor
        view.addSubview(toolbar)

        // Buttons
        let buttons: [(String, String, Selector)] = [
            ("Format", "line.3.horizontal", #selector(formatAction)),
            ("Minify", "arrow.left.arrow.right", #selector(minifyAction)),
            ("Fix", "wrench.and.screwdriver", #selector(fixAction)),
            ("Validate", "checkmark.circle", #selector(validateAction))
        ]

        let stackView = NSStackView()
        stackView.orientation = .horizontal
        stackView.spacing = 8
        stackView.translatesAutoresizingMaskIntoConstraints = false

        for (title, symbol, action) in buttons {
            let button = createToolbarButton(title: title, symbolName: symbol, action: action)
            stackView.addArrangedSubview(button)
        }

        toolbar.addSubview(stackView)

        NSLayoutConstraint.activate([
            toolbar.topAnchor.constraint(equalTo: view.topAnchor),
            toolbar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            toolbar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            toolbar.heightAnchor.constraint(equalToConstant: 48),

            stackView.centerYAnchor.constraint(equalTo: toolbar.centerYAnchor),
            stackView.leadingAnchor.constraint(equalTo: toolbar.leadingAnchor, constant: 12)
        ])
    }

    private func createToolbarButton(title: String, symbolName: String, action: Selector) -> NSButton {
        let button = NSButton()
        button.title = title
        button.image = NSImage(systemSymbolName: symbolName, accessibilityDescription: title)
        button.imagePosition = .imageLeading
        button.bezelStyle = .rounded
        button.target = self
        button.action = action
        button.translatesAutoresizingMaskIntoConstraints = false

        return button
    }

    private func setupSplitView() {
        splitView = NSSplitView()
        splitView.isVertical = true
        splitView.dividerStyle = .thin
        splitView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(splitView)

        // Input section
        let inputContainer = NSView()
        inputContainer.wantsLayer = true

        let inputLabel = NSTextField(labelWithString: "Input")
        inputLabel.textColor = NSColor.secondaryLabelColor
        inputLabel.font = NSFont.systemFont(ofSize: 11, weight: .semibold)
        inputLabel.translatesAutoresizingMaskIntoConstraints = false
        inputContainer.addSubview(inputLabel)

        inputScrollView = NSScrollView()
        inputScrollView.hasVerticalScroller = true
        inputScrollView.hasHorizontalScroller = true
        inputScrollView.autohidesScrollers = true
        inputScrollView.borderType = .noBorder
        inputScrollView.translatesAutoresizingMaskIntoConstraints = false

        inputTextView = NSTextView()
        inputTextView.isEditable = true
        inputTextView.isSelectable = true
        inputTextView.allowsUndo = true
        inputTextView.font = NSFont.monospacedSystemFont(ofSize: 12, weight: .regular)
        inputTextView.backgroundColor = NSColor(red: 0.06, green: 0.09, blue: 0.16, alpha: 1.0)
        inputTextView.textColor = NSColor.white
        inputTextView.insertionPointColor = NSColor.white
        inputTextView.autoresizingMask = [.width, .height]
        inputTextView.isVerticallyResizable = true
        inputTextView.isHorizontallyResizable = true
        inputTextView.textContainer?.widthTracksTextView = false
        inputTextView.textContainer?.containerSize = NSSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)

        inputScrollView.documentView = inputTextView
        inputContainer.addSubview(inputScrollView)

        // Output section
        let outputContainer = NSView()
        outputContainer.wantsLayer = true

        let outputLabel = NSTextField(labelWithString: "Output")
        outputLabel.textColor = NSColor.secondaryLabelColor
        outputLabel.font = NSFont.systemFont(ofSize: 11, weight: .semibold)
        outputLabel.translatesAutoresizingMaskIntoConstraints = false
        outputContainer.addSubview(outputLabel)

        outputScrollView = NSScrollView()
        outputScrollView.hasVerticalScroller = true
        outputScrollView.hasHorizontalScroller = true
        outputScrollView.autohidesScrollers = true
        outputScrollView.borderType = .noBorder
        outputScrollView.translatesAutoresizingMaskIntoConstraints = false

        outputTextView = NSTextView()
        outputTextView.isEditable = false
        outputTextView.isSelectable = true
        outputTextView.font = NSFont.monospacedSystemFont(ofSize: 12, weight: .regular)
        outputTextView.backgroundColor = NSColor(red: 0.06, green: 0.09, blue: 0.16, alpha: 1.0)
        outputTextView.textColor = NSColor.white
        outputTextView.autoresizingMask = [.width, .height]
        outputTextView.isVerticallyResizable = true
        outputTextView.isHorizontallyResizable = true
        outputTextView.textContainer?.widthTracksTextView = false
        outputTextView.textContainer?.containerSize = NSSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)

        outputScrollView.documentView = outputTextView
        outputContainer.addSubview(outputScrollView)

        splitView.addArrangedSubview(inputContainer)
        splitView.addArrangedSubview(outputContainer)

        NSLayoutConstraint.activate([
            splitView.topAnchor.constraint(equalTo: toolbar.bottomAnchor),
            splitView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            splitView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            splitView.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -32),

            inputLabel.topAnchor.constraint(equalTo: inputContainer.topAnchor, constant: 8),
            inputLabel.leadingAnchor.constraint(equalTo: inputContainer.leadingAnchor, constant: 12),

            inputScrollView.topAnchor.constraint(equalTo: inputLabel.bottomAnchor, constant: 4),
            inputScrollView.leadingAnchor.constraint(equalTo: inputContainer.leadingAnchor),
            inputScrollView.trailingAnchor.constraint(equalTo: inputContainer.trailingAnchor),
            inputScrollView.bottomAnchor.constraint(equalTo: inputContainer.bottomAnchor),

            outputLabel.topAnchor.constraint(equalTo: outputContainer.topAnchor, constant: 8),
            outputLabel.leadingAnchor.constraint(equalTo: outputContainer.leadingAnchor, constant: 12),

            outputScrollView.topAnchor.constraint(equalTo: outputLabel.bottomAnchor, constant: 4),
            outputScrollView.leadingAnchor.constraint(equalTo: outputContainer.leadingAnchor),
            outputScrollView.trailingAnchor.constraint(equalTo: outputContainer.trailingAnchor),
            outputScrollView.bottomAnchor.constraint(equalTo: outputContainer.bottomAnchor)
        ])
    }

    private func setupStatusBar() {
        let statusBar = NSView()
        statusBar.wantsLayer = true
        statusBar.layer?.backgroundColor = NSColor(red: 0.12, green: 0.16, blue: 0.24, alpha: 1.0).cgColor
        statusBar.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(statusBar)

        statusLabel = NSTextField(labelWithString: "Ready")
        statusLabel.textColor = NSColor.secondaryLabelColor
        statusLabel.font = NSFont.systemFont(ofSize: 11)
        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        statusBar.addSubview(statusLabel)

        let charCountLabel = NSTextField(labelWithString: "0 chars")
        charCountLabel.textColor = NSColor.secondaryLabelColor
        charCountLabel.font = NSFont.systemFont(ofSize: 11)
        charCountLabel.translatesAutoresizingMaskIntoConstraints = false
        statusBar.addSubview(charCountLabel)

        // Update char count on text change
        NotificationCenter.default.addObserver(forName: NSText.didChangeNotification, object: inputTextView, queue: .main) { _ in
            let count = self.inputTextView.string.count
            charCountLabel.stringValue = "\(count.formatted()) chars"
        }

        NSLayoutConstraint.activate([
            statusBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            statusBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            statusBar.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            statusBar.heightAnchor.constraint(equalToConstant: 32),

            statusLabel.centerYAnchor.constraint(equalTo: statusBar.centerYAnchor),
            statusLabel.leadingAnchor.constraint(equalTo: statusBar.leadingAnchor, constant: 12),

            charCountLabel.centerYAnchor.constraint(equalTo: statusBar.centerYAnchor),
            charCountLabel.trailingAnchor.constraint(equalTo: statusBar.trailingAnchor, constant: -12)
        ])
    }

    // MARK: - Actions

    @objc private func formatAction() {
        formatJSON()
    }

    @objc private func minifyAction() {
        minifyJSON()
    }

    @objc private func fixAction() {
        fixJSON()
    }

    @objc private func validateAction() {
        validateJSON()
    }

    func formatJSON() {
        let input = inputTextView.string
        guard !input.isEmpty else {
            setStatus("Please enter JSON", type: .warning)
            return
        }

        let result = jsonFormatter.format(input)
        if result.success {
            outputTextView.string = result.output ?? ""
            applySyntaxHighlighting(to: outputTextView)
            setStatus("Formatted successfully", type: .success)
        } else {
            outputTextView.string = "Error: \(result.error ?? "Unknown error")"
            setStatus("Invalid JSON", type: .error)
        }
    }

    func minifyJSON() {
        let input = inputTextView.string
        guard !input.isEmpty else {
            setStatus("Please enter JSON", type: .warning)
            return
        }

        let result = jsonFormatter.minify(input)
        if result.success {
            outputTextView.string = result.output ?? ""
            setStatus("Minified successfully", type: .success)
        } else {
            outputTextView.string = "Error: \(result.error ?? "Unknown error")"
            setStatus("Invalid JSON", type: .error)
        }
    }

    func fixJSON() {
        let input = inputTextView.string
        guard !input.isEmpty else {
            setStatus("Please enter JSON", type: .warning)
            return
        }

        let result = jsonFormatter.fix(input)
        if result.success {
            outputTextView.string = result.output ?? ""
            applySyntaxHighlighting(to: outputTextView)
            let changes = result.changes?.count ?? 0
            if changes > 0 {
                setStatus("Fixed \(changes) issue(s)", type: .success)
            } else {
                setStatus("JSON was already valid", type: .success)
            }
        } else {
            outputTextView.string = "Error: \(result.error ?? "Could not fix JSON")"
            setStatus("Could not fix JSON", type: .error)
        }
    }

    func validateJSON() {
        let input = inputTextView.string
        guard !input.isEmpty else {
            setStatus("Please enter JSON", type: .warning)
            return
        }

        let result = jsonFormatter.validate(input)
        if result.isValid {
            outputTextView.string = "Valid JSON"
            setStatus("Valid JSON", type: .success)
        } else {
            outputTextView.string = "Invalid JSON\n\nError: \(result.error ?? "Unknown error")"
            setStatus("Invalid JSON", type: .error)
        }
    }

    private func setStatus(_ message: String, type: StatusType) {
        statusLabel.stringValue = message
        switch type {
        case .success:
            statusLabel.textColor = NSColor(red: 0.06, green: 0.73, blue: 0.51, alpha: 1.0)
        case .error:
            statusLabel.textColor = NSColor(red: 0.94, green: 0.27, blue: 0.27, alpha: 1.0)
        case .warning:
            statusLabel.textColor = NSColor(red: 0.96, green: 0.62, blue: 0.04, alpha: 1.0)
        }
    }

    private enum StatusType {
        case success, error, warning
    }

    private func applySyntaxHighlighting(to textView: NSTextView) {
        let text = textView.string
        let attributedString = NSMutableAttributedString(string: text)

        // Define colors
        let keyColor = NSColor(red: 0.49, green: 0.83, blue: 0.99, alpha: 1.0)    // Sky blue
        let stringColor = NSColor(red: 0.53, green: 0.94, blue: 0.67, alpha: 1.0) // Green
        let numberColor = NSColor(red: 0.99, green: 0.83, blue: 0.30, alpha: 1.0)  // Amber
        let boolColor = NSColor(red: 0.77, green: 0.71, blue: 0.99, alpha: 1.0)   // Violet
        let nullColor = NSColor(red: 0.58, green: 0.64, blue: 0.72, alpha: 1.0)   // Gray

        let defaultColor = NSColor.white

        // Apply default color
        let fullRange = NSRange(location: 0, length: text.count)
        attributedString.addAttribute(.foregroundColor, value: defaultColor, range: fullRange)

        // Highlight keys (strings followed by colon)
        if let keyRegex = try? NSRegularExpression(pattern: "\"[^\"]+\"\\s*:", options: []) {
            let matches = keyRegex.matches(in: text, options: [], range: fullRange)
            for match in matches {
                attributedString.addAttribute(.foregroundColor, value: keyColor, range: match.range)
            }
        }

        // Highlight string values
        if let stringRegex = try? NSRegularExpression(pattern: ":\\s*\"[^\"]*\"", options: []) {
            let matches = stringRegex.matches(in: text, options: [], range: fullRange)
            for match in matches {
                attributedString.addAttribute(.foregroundColor, value: stringColor, range: match.range)
            }
        }

        // Highlight numbers
        if let numberRegex = try? NSRegularExpression(pattern: ":\\s*-?\\d+\\.?\\d*([eE][+-]?\\d+)?", options: []) {
            let matches = numberRegex.matches(in: text, options: [], range: fullRange)
            for match in matches {
                attributedString.addAttribute(.foregroundColor, value: numberColor, range: match.range)
            }
        }

        // Highlight booleans
        if let boolRegex = try? NSRegularExpression(pattern: ":\\s*(true|false)", options: []) {
            let matches = boolRegex.matches(in: text, options: [], range: fullRange)
            for match in matches {
                attributedString.addAttribute(.foregroundColor, value: boolColor, range: match.range)
            }
        }

        // Highlight null
        if let nullRegex = try? NSRegularExpression(pattern: ":\\s*null", options: []) {
            let matches = nullRegex.matches(in: text, options: [], range: fullRange)
            for match in matches {
                attributedString.addAttribute(.foregroundColor, value: nullColor, range: match.range)
            }
        }

        textView.textStorage?.setAttributedString(attributedString)
    }
}
