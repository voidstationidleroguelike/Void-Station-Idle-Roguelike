# EX Pocket Guide

Static mobile-first PWA for EX reference, marking interpretation, Pocket Guide, poster and Trainor course links. No build step is required.

## Current architecture

- `data/ex-code-library.js` — technical code definitions shown to the user.
- `data/legacy-national-markings.js` — older/national markings; secondary reference only.
- `js/core/ex-code-extractor.js` — extracts candidate EX/ATEX/certificate data from OCR text.
- `js/core/ex-marking-interpreter.js` — deterministic manual/OCR interpretation and tokenization.
- `js/core/general-text-generator.js` — summary text from deterministic results.
- `js/services/ocr-service.js` — browser OCR only; it does not decide the technical meaning.
- `js/features/marking.js` — camera/upload/manual UI and result rendering.
- Guide, poster and courses are isolated in their own feature modules.

## Important parser rules

1. Manual input and OCR input are separate pipelines. OCR correction must never rewrite manual input.
2. ATEX / IEC-based EX marking is prioritized. Legacy/national marking is collapsed and secondary.
3. A plain `Ex ...` line is EX marking; it is not called IECEx unless explicit IECEx evidence is present.
4. Longest valid atomic code wins before any decomposition. `ia`, `db`, `pxb`, `op is` remain atomic.
5. Older concatenated protection codes are supported. Example: `Ex dem IIC T4` is interpreted as `Ex d e m IIC T4` while the original line is preserved.
6. Unknown tokens remain unknown; the parser must not invent a correction.

See `docs/ARCHITECTURE.md` and `docs/EX_MARKING_FLOW.md`.
