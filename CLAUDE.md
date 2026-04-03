# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Chrome extension (Manifest V3) that saves and restores web form data. Users can capture form field values, store multiple named sets per domain, and replay them via the popup UI or keyboard shortcuts.

## Development

No build process — source files load directly as an unpacked Chrome extension.

**To test changes:**
1. Open `chrome://extensions`
2. Enable Developer Mode
3. Load unpacked → select this directory
4. Click the refresh icon after any JS/HTML changes

Uses npm for dev tooling (ESLint, Vitest). No build process.

## Architecture

**Message-passing model:** The popup and content script communicate via `chrome.tabs.sendMessage`.

| File | Role |
|------|------|
| `popup.js` | UI controller — renders saved sets, handles import/export/hotkey config |
| `content_script.js` | Injected into pages — serializes forms on save, populates fields on restore |
| `deserialize.js` | jQuery plugin — fills form fields from stored key/value pairs |
| `background.js` | Service worker — retrieves hotkey bindings and matching sets on request |
| `utils.js` | URL filtering — matches stored sets to current page by domain/path/full URL |

**Storage schema:** All data lives in `chrome.storage.local`.
- Form sets: keyed as `set_[timestamp]`, value is `{ name, url, hotkey, data: { fieldName: value } }`
- Filter mode: key `filter`, values `"domain"` | `"path"` | `"full"`

**Save flow:** popup → `'store'` message → content script serializes inputs → stored in local storage

**Restore flow:** popup or hotkey → `'fill'` message with dataset → `deserialize.js` populates fields → optional auto-submit

**Parameter substitution:** Field values support tokens like `{randomNumber:8:12}` and `{randomAlpha:5:10}` expanded at fill time in `content_script.js`.

**URL matching:** `utils.js` compares stored set URLs against the active tab URL. Default is domain-level (all pages on a domain share sets).

## Testing

- **Framework:** Vitest with happy-dom
- **Run:** `npm test` (single run) or `npm run test:watch` (watch mode)
- **Test files:** `tests/` directory (5 test files, ~59 tests)
- **Chrome API mocking:** `tests/helpers/chrome-mock.js` — use `createChromeMock(storageData)` to pre-populate storage
- **How exports work:** Each source file appends `if (typeof module !== 'undefined') module.exports = {...}` — this is inert in the browser (no `module` global) but allows Vitest to import functions via `createRequire`. `javascripts/package.json` declares `"type": "commonjs"` so Node treats those files as CJS.

## Permissions

`activeTab` and `storage` only — intentionally minimal. Do not add broad host permissions.
