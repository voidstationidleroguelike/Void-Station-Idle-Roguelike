# Architecture

The application intentionally uses plain HTML/CSS/JavaScript with no build tool. Modules expose a small API through `window.EX_APP`.

## Runtime dependency order

1. Configuration and translations
2. Course / EX definition data
3. Core utilities (`i18n`, router, pan/zoom)
4. EX extractor + interpreter + summary generator
5. OCR service
6. Feature modules
7. PWA service and app bootstrap

## EX feature boundaries

### `ex-code-extractor.js`
Used only for image/OCR input. Finds candidate EX lines, ATEX category data and relevant metadata. Context-aware OCR cleanup belongs here or in OCR-mode interpreter normalization.

### `ex-marking-interpreter.js`
Deterministic interpreter for both manual and OCR candidates. It owns system detection, normalization, tokenization, dictionary lookup, bracket/IP handling and legacy lookup. Manual mode never applies OCR character substitutions.

### `ex-code-library.js`
Content dictionary only. Instructor-reviewed wording can be updated here without changing UI logic.

### `legacy-national-markings.js`
Historical/national fallback reference. Legacy results are always collapsed by default in the UI.

### `marking.js`
DOM/UI layer only: file selection, OCR invocation, manual input, rendering and token-detail dialog. It should not contain technical EX definitions.

## Removed prototype code

The old manual marking-system selector, prototype rule dictionary and prototype parser have been removed from the runtime.
