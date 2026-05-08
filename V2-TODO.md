# JSON Zen v2.0 — Continuation TODO

State of play after the WSL session. Pick up here on Mac.

---

## Current state

**Shipped this session:**
- Side panel as default container (`chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true})`) + pop-out window (1280x820) via toolbar message + keyboard shortcuts
- Caveat font bundled offline (latin + latin-ext woff2)
- 8 visual presets in Settings (Midnight Glass, Pastel Dream, Mission Control, Cyber Console, Cosmic, Light Prism, Forest Terminal, Obsidian Ritual) — `[data-preset]` orthogonal to `[data-theme]`, persisted in `chrome.storage.sync`
- First-install splash (`options/splash.html`) with lotus + Caveat welcome
- Brand assets generated: `assets/banner-readme.png` (1280x640), `webstore-hero.png` (440x280), `webstore-promo.png` (1400x560), `splash-lotus.png` (1024x512)
- App shell rebuilt to mockup fidelity: vertical left icon-rail (replaces top tab strip), right context rail (Quick Tools / History / Snippets / Schema Preview), floating bottom command bar
- JSON tab rebuilt to bento layout: file-tabs strip + Input/Output as two big glass cards inside the new shell
- HTTP / Diff / Bulk panes restyled (generic v2.0 polish from earlier agents) but **NOT yet rebuilt to mockup fidelity** — they still live inside the new shell, but their inner content is the previous-pass treatment

**Current pending decision:** user said the JSON PoC "looks decent" — direction confirmed. Roll the same shell pattern + bento treatment to HTTP, Diff, Bulk.

---

## Next up — pane rebuilds (do these on Mac)

Use the same agent prompt template that worked for JSON. Each pane gets its own agent, sequential (not parallel — they all touch popup.html).

### Mockup references per pane

- **HTTP Client** → `mockups/mockup-ideas (11).png` (HTTP Predator, response theatre at bottom). Also reference #3 (cosmic purple Postman-replacement) and #1 (HTTP mini at bottom-right).
- **Diff** → `mockups/mockup-ideas (4).png` (Summary stats left rail + side-by-side diff with red/green/yellow line gutters + bottom stats bar) and `mockup-ideas (12).png` (Diff Split Studio, change summary + sliding view controls).
- **Bulk** → no canonical mockup; closest is `mockup-ideas (13).png` Mission Control feel for the manifest grid. Adapt the bento card aesthetic from JSON pane.

### Agent prompt template

Re-use the structure from this session's successful JSON-rebuild agent prompt. Key elements:
1. **STEP 1 — STUDY MOCKUPS** (require the agent to Read the actual PNGs)
2. **STEP 2 — UNDERSTAND CURRENT STATE** (popup.html, popup.js, panes/<x>.css, app-shell.css)
3. **STEP 3 — REBUILD** (specific layout target, what cards go where, which mockup elements to faithfully reproduce)
4. **STEP 4 — DO NOT BREAK THESE** (full ID list + element types + data-attrs)
5. **STEP 5 — DELIVERABLES** (which files to edit, which to create, no main.css edits — you add @import after)
6. **STEP 6 — REPORT** (what changed, what was adapted, what was skipped)

The IDs/handlers list per pane is in this session's task descriptions (#11 HTTP, #12 Diff, #13 Bulk). Re-derive by greping `popup/popup.js` and `popup/modules/*.js` for `getElementById` and `querySelector` calls before briefing each agent.

### Order
1. HTTP Client (highest-impact pane after JSON)
2. Diff
3. Bulk
4. Settings tab — currently has the preset picker grid but could use the bento card treatment for visual cohesion (deferred decision)

After each agent: review with the regression-review agent (template: walk every getElementById in popup.js, confirm each ID exists in HTML, confirm element types preserved, confirm dynamic insertion targets work).

---

## Test plan (Mac, before push)

Load `json-zen-extension/` unpacked in `chrome://extensions`.

### Architecture
1. Toolbar icon click -> side panel slides in
2. Pop-out button (header) -> 1280x820 window opens; pop-out button hidden inside that window
3. Resize side panel narrow <-> wide -> nav rail collapses to icon-only at <520px, context rail hides at <760px and slides in via toggle button

### Shell + JSON pane (mockup fidelity)
4. Vertical left rail with 5 icon+label tabs, brand-tinted active state with left brand-bar
5. Right context rail with Quick Tools 2x2 grid + Recent History stub + Snippets stub + Schema Preview stub
6. JSON tab: file-tabs strip with "Untitled.json" + close + dashed "+"; toolbar inside Input card head; Input/Output as two large bento cards
7. Floating bottom command bar (Format / Validate / Diff / Help) spans only the center column

### Presets + font
8. Settings tab -> 8 preset swatches; click each -> entire app reskins live
9. Cosmic / Pastel Dream / Light Prism -> headings render in Caveat
10. Reload extension -> preset persists

### Shortcuts + context menus
11. `Ctrl/Cmd+Shift+F` on any page -> side panel opens AND formats input. Same for `+M` `+X` `+V`
12. Right-click selected JSON -> context menu shows Format / Minify / Fix / Validate

### Splash (first-install only)
13. Remove + re-add unpacked -> `splash.html` opens with lotus + Caveat welcome

### Functional regression
14. Format / Minify / Fix / Validate buttons in toolbar
15. Convert dropdown (YAML / XML / CSV / TOML / Base64 / URL / Escape)
16. Transform dropdown (Sort Keys / Remove Nulls / Redact PII / Flatten)
17. Stats modal opens
18. Schema modal opens, generate + validate
19. Path explorer breadcrumbs (click on output, navigate)
20. Tree view toggle (this was bugfixed this session — `treeToggleBtn` -> `toggleTreeBtn` to match path-explorer.js)
21. Query bar (slash command palette overlay)
22. Quick Tools rail buttons fire same actions as toolbar (data-action delegation in popup.js)
23. HTTP send + history + auth detection still works
24. Diff compare + result panel still works
25. Bulk file drop + processing + ZIP download still works
26. Right context rail toggle button (in header, narrow mode only)

If anything regresses: most likely culprits are the shell's CSS grid overriding old flex from `layout.css`, or a tab-content `display:flex` getting clobbered. The agent intentionally removed `!important` from `#tab-json.tab-content { display: flex }` and let JS own that. Check `selectTab()` in popup.js if any tab fails to show.

---

## File map (what changed this session)

### New files
- `json-zen-extension/styles/shell/app-shell.css` — vertical nav rail, context rail, command bar, narrow-mode media queries
- `json-zen-extension/styles/panes/json.css` — bento JSON pane (replaced)
- `json-zen-extension/styles/panes/http.css` — HTTP pane v2.0 polish (NOT yet mockup-fidelity rebuild)
- `json-zen-extension/styles/panes/diff.css` — Diff pane v2.0 polish (NOT yet rebuild)
- `json-zen-extension/styles/panes/bulk.css` — Bulk pane v2.0 polish (NOT yet rebuild)
- `json-zen-extension/styles/presets.css` — 8 visual presets
- `json-zen-extension/options/splash.html` — first-install welcome page
- `json-zen-extension/options/splash-lotus.png`
- `json-zen-extension/fonts/caveat-latin.woff2`, `caveat-latin-ext.woff2`
- `assets/banner-readme.png`, `webstore-hero.png`, `webstore-promo.png`

### Modified
- `json-zen-extension/manifest.json` — sidePanel + windows + commands; v2.0.0
- `json-zen-extension/background/background.js` — sidePanel default + pop-out window + splash-on-install + context menus + keyboard commands
- `json-zen-extension/popup/popup.html` — full app shell rebuild + bento JSON tab + preset picker in Settings
- `json-zen-extension/popup/popup.js` — popout button, command-from-URL/runtime, runCommand mapping, killed setupResize, data-action delegation, contextRailToggle
- `json-zen-extension/popup/modules/theme-manager.js` — preset list + applyPreset + storage
- `json-zen-extension/styles/base.css` — fluid sizing (100vw/vh) + Caveat @font-face
- `json-zen-extension/styles/main.css` — @imports for presets + 4 panes + shell
- `json-zen-extension/styles/layout.css` — kill resize handles
- `json-zen-extension/styles/components/panels.css` — preset grid, swatch, section subhead
- `README.md` + `package.json` + `json-zen-extension/package.json` — v2.0.0
- Working-tree-only edits unrelated to v2.0 (line endings): `.github/workflows/release-publish.yml`, `json-zen-extension/content/content-script.js`, `json-zen-extension/utils/json-utils.js`, `json-zen-extension/popup/bulk-processor.js`

### Untracked utility files (not for commit)
- `.codex` — local
- `.secret-allowlist` — local
- `V2-TRANSFORMATION.md` — local notes
- `VISUAL-EVOLUTION.md` — local notes
- `mockups/` — design references, gitignore'd already? confirm before commit

---

## Bugs squashed in review

1. **Tree toggle dead-letter**: HTML had `id="treeToggleBtn"`, path-explorer.js expected `toggleTreeBtn`. Renamed HTML id.
2. **Seeded Content-Type header dead-X**: static row in HTML had no listener; removed static row, `addDefaultHeaders()` now seeds both Content-Type + Accept dynamically with working remove buttons.
3. **Keyboard shortcuts dead-letter**: bg.js dispatched `jsonzen:command` but no listener existed. Added `chrome.runtime.onMessage` listener + URL `?cmd=` reader + `runCommand(cmd)` in popup.js.
4. **syncPopupFrame stomping fluid layout**: old drag-resize wrote inline width/height on every load. Killed `setupResize()` with early return.

---

## Open questions / deferred

- **Path explorer left-side tree** (mockup #2): currently we kept the inline path-trail breadcrumb. Mockup shows a permanent left-rail JSON Structure tree. Defer until after the four panes are rebuilt; might need its own tab or live as a collapsible left-of-editor panel.
- **HTTP Client mini-card at bottom** (mockup #1): not added. Could live as a collapsible drawer below the JSON editor when on JSON tab.
- **Mission Control landing dashboard** (mockup #13): big "ZEN MISSION CONTROL" header + tile grid of features. Could be a new "/" home view shown on first open. Defer to v2.1.
- **Zen Mode toggle** (mockup #1 bottom-left): rail bottom has a "Zen" pill — currently decorative. Wire to a class that hides chrome.
- **Right rail History / Snippets / Schema Preview**: currently empty stubs. Wire to actual data after the four panes are done.
- **Settings tab bento treatment**: currently has the preset picker but the rest is utilitarian. Match the bento card aesthetic.
- **Aria-checked on `.bulk-op-btn`**: stays stale (only `.active` class toggles). A11y nit, easy fix in `bulk-processor.js`.

---

## Commands reference (Mac)

```bash
cd /path/to/Json-ZEN
git status
git log --oneline -10
# Load json-zen-extension/ unpacked in chrome://extensions
# Edit + reload extension to test
```

To resume: read this file, then look at the latest commits to see chunking pattern, then start the HTTP rebuild agent.
