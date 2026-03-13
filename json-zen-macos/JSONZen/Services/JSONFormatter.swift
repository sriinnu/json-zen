import Foundation

struct JSONResult {
    var success: Bool
    var output: String?
    var error: String?
    var changes: [String]?
    var isValid: Bool = false
}

class JSONFormatter {

    // MARK: - Format

    func format(_ jsonString: String, indent: Int = 2) -> JSONResult {
        guard !jsonString.isEmpty else {
            return JSONResult(success: false, error: "Empty input")
        }

        do {
            let data = jsonString.data(using: .utf8) ?? Data()
            let parsed = try JSONSerialization.jsonObject(with: data, options: .fragmentsAllowed)

            var options: JSONSerialization.WritingOptions = [.prettyPrinted, .sortedKeys]
            if indent == 0 {
                // Use tabs
                options.insert(.prettyPrinted)
            }

            let outputData = try JSONSerialization.data(withJSONObject: parsed, options: options)
            let output = String(data: outputData, encoding: .utf8) ?? ""

            return JSONResult(success: true, output: output, isValid: true)
        } catch let e as NSError {
            return JSONResult(success: false, error: e.localizedDescription, isValid: false)
        }
    }

    // MARK: - Minify

    func minify(_ jsonString: String) -> JSONResult {
        guard !jsonString.isEmpty else {
            return JSONResult(success: false, error: "Empty input")
        }

        do {
            let data = jsonString.data(using: .utf8) ?? Data()
            let parsed = try JSONSerialization.jsonObject(with: data, options: .fragmentsAllowed)

            let outputData = try JSONSerialization.data(withJSONObject: parsed, options: [])
            let output = String(data: outputData, encoding: .utf8) ?? ""

            return JSONResult(success: true, output: output, isValid: true)
        } catch let e as NSError {
            return JSONResult(success: false, error: e.localizedDescription, isValid: false)
        }
    }

    // MARK: - Validate

    func validate(_ jsonString: String) -> JSONResult {
        guard !jsonString.isEmpty else {
            return JSONResult(success: false, error: "Empty input", isValid: false)
        }

        do {
            let data = jsonString.data(using: .utf8) ?? Data()
            _ = try JSONSerialization.jsonObject(with: data, options: .fragmentsAllowed)

            return JSONResult(success: true, isValid: true)
        } catch let e as NSError {
            return JSONResult(success: false, error: e.localizedDescription, isValid: false)
        }
    }

    // MARK: - Fix

    func fix(_ jsonString: String) -> JSONResult {
        guard !jsonString.isEmpty else {
            return JSONResult(success: false, error: "Empty input")
        }

        var fixed = jsonString
        var changes: [String] = []

        // 1. Remove single-line comments (// ...)
        if fixed.contains("//") {
            fixed = fixed.replacingOccurrences(of: "//[^\n]*", with: "", options: .regularExpression)
            changes.append("Removed single-line comments")
        }

        // 2. Remove multi-line comments (/* ... */)
        if fixed.contains("/*") {
            fixed = fixed.replacingOccurrences(of: "/\\*[\\s\\S]*?\\*/", with: "", options: .regularExpression)
            changes.append("Removed multi-line comments")
        }

        // 3. Replace single quotes with double quotes (simple heuristic)
        if fixed.contains("'") {
            let original = fixed
            // Match single-quoted strings
            fixed = fixed.replacingOccurrences(of: "'([^'\\\\]|\\\\.)*'", with: "\"$1\"", options: .regularExpression)
            if original != fixed {
                changes.append("Replaced single quotes with double quotes")
            }
        }

        // 4. Add quotes to unquoted keys
        let unquotedKeyPattern = "([{,]\\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\\s*:)"
        if fixed.range(of: "([{,]\\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\\s*:)", options: .regularExpression) != nil {
            let original = fixed
            fixed = fixed.replacingOccurrences(of: unquotedKeyPattern, with: "$1\"$2\"$3", options: .regularExpression)
            if original != fixed {
                changes.append("Added quotes to unquoted keys")
            }
        }

        // 5. Remove trailing commas
        if fixed.contains(",") {
            let original = fixed
            fixed = fixed.replacingOccurrences(of: ",\\s*([\\]\\}])", with: "$1", options: .regularExpression)
            if original != fixed {
                changes.append("Removed trailing commas")
            }
        }

        // 6. Fix common typos
        let typos = ["falue": "false", "ture": "true", "undefiend": "undefined", "nul": "null"]
        for (typo, correct) in typos {
            if fixed.contains(typo) {
                let original = fixed
                fixed = fixed.replacingOccurrences(of: "\\b\(typo)\\b", with: correct, options: .regularExpression)
                if original != fixed {
                    changes.append("Fixed typo: \(typo) → \(correct)")
                }
            }
        }

        // Try to parse the result
        do {
            let data = fixed.data(using: .utf8) ?? Data()
            let parsed = try JSONSerialization.jsonObject(with: data, options: .fragmentsAllowed)

            let outputData = try JSONSerialization.data(withJSONObject: parsed, options: [.prettyPrinted, .sortedKeys])
            let output = String(data: outputData, encoding: .utf8) ?? ""

            return JSONResult(success: true, output: output, changes: changes, isValid: true)
        } catch {
            // Try more aggressive fixes
            var attempt = fixed

            // Count brackets
            let openBraces = attempt.filter { $0 == "{" }.count
            let closeBraces = attempt.filter { $0 == "}" }.count
            let openBrackets = attempt.filter { $0 == "[" }.count
            let closeBrackets = attempt.filter { $0 == "]" }.count

            // Add missing closing brackets
            while closeBraces < openBraces {
                attempt += "}"
                changes.append("Added missing closing brace")
            }
            while closeBrackets < openBrackets {
                attempt += "]"
                changes.append("Added missing closing bracket")
            }

            // Try parsing again
            do {
                let data = attempt.data(using: .utf8) ?? Data()
                let parsed = try JSONSerialization.jsonObject(with: data, options: .fragmentsAllowed)

                let outputData = try JSONSerialization.data(withJSONObject: parsed, options: [.prettyPrinted, .sortedKeys])
                let output = String(data: outputData, encoding: .utf8) ?? ""

                return JSONResult(success: true, output: output, changes: changes, isValid: true)
            } catch let e as NSError {
                return JSONResult(success: false, error: e.localizedDescription, changes: changes)
            }
        }
    }

    // MARK: - Sort Keys

    func sortKeys(_ jsonString: String) -> JSONResult {
        guard !jsonString.isEmpty else {
            return JSONResult(success: false, error: "Empty input")
        }

        do {
            let data = jsonString.data(using: .utf8) ?? Data()
            let parsed = try JSONSerialization.jsonObject(with: data, options: .fragmentsAllowed)

            let sorted = sortObjectKeys(parsed)

            let outputData = try JSONSerialization.data(withJSONObject: sorted, options: [.prettyPrinted, .sortedKeys])
            let output = String(data: outputData, encoding: .utf8) ?? ""

            return JSONResult(success: true, output: output, isValid: true)
        } catch let e as NSError {
            return JSONResult(success: false, error: e.localizedDescription, isValid: false)
        }
    }

    private func sortObjectKeys(_ object: Any) -> Any {
        if let array = object as? [Any] {
            return array.map { sortObjectKeys($0) }
        } else if let dict = object as? [String: Any] {
            var sorted: [String: Any] = [:]
            for key in dict.keys.sorted() {
                sorted[key] = sortObjectKeys(dict[key]!)
            }
            return sorted
        }
        return object
    }

    // MARK: - Remove Nulls

    func removeNulls(_ jsonString: String) -> JSONResult {
        guard !jsonString.isEmpty else {
            return JSONResult(success: false, error: "Empty input")
        }

        do {
            let data = jsonString.data(using: .utf8) ?? Data()
            let parsed = try JSONSerialization.jsonObject(with: data, options: .fragmentsAllowed)

            let cleaned = removeNullsFromObject(parsed)

            let outputData = try JSONSerialization.data(withJSONObject: cleaned, options: [.prettyPrinted, .sortedKeys])
            let output = String(data: outputData, encoding: .utf8) ?? ""

            return JSONResult(success: true, output: output, isValid: true)
        } catch let e as NSError {
            return JSONResult(success: false, error: e.localizedDescription, isValid: false)
        }
    }

    private func removeNullsFromObject(_ object: Any) -> Any {
        if let array = object as? [Any] {
            return array.map { removeNullsFromObject($0) }.filter { !($0 is NSNull) }
        } else if let dict = object as? [String: Any] {
            var cleaned: [String: Any] = [:]
            for (key, value) in dict {
                if !(value is NSNull) {
                    cleaned[key] = removeNullsFromObject(value)
                }
            }
            return cleaned
        }
        return object
    }

    // MARK: - Base64 Encode/Decode

    func encodeBase64(_ jsonString: String) -> JSONResult {
        guard !jsonString.isEmpty else {
            return JSONResult(success: false, error: "Empty input")
        }

        guard let data = jsonString.data(using: .utf8) else {
            return JSONResult(success: false, error: "Invalid UTF-8")
        }

        let base64 = data.base64EncodedString()
        return JSONResult(success: true, output: base64)
    }

    func decodeBase64(_ base64String: String) -> JSONResult {
        guard !base64String.isEmpty else {
            return JSONResult(success: false, error: "Empty input")
        }

        guard let data = Data(base64Encoded: base64String) else {
            return JSONResult(success: false, error: "Invalid Base64")
        }

        guard let jsonString = String(data: data, encoding: .utf8) else {
            return JSONResult(success: false, error: "Invalid UTF-8 in decoded data")
        }

        // Validate and format
        return format(jsonString)
    }
}
