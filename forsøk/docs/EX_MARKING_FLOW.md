# EX marking flow

## Manual

`textarea -> exMarkingInterpreter.interpret(inputMode=manual) -> render`

- preserve user text
- no OCR substitutions
- automatic ATEX / IEC-EX detection
- show ambiguous short codes as possible meanings when appropriate
- legacy is secondary and collapsed

## Camera / upload

`image -> ocr-service -> ex-code-extractor -> editable candidate text -> exMarkingInterpreter(inputMode=ocr) -> render`

The user can verify/edit recognized text before interpretation. OCR is not an authority on EX meaning.

## Concatenated protection concepts

Older/common markings may omit spaces between protection concepts. The interpreter only decomposes an unknown lowercase alphabetic token when the whole token can be represented by known protection concepts. Existing atomic codes win first.

Examples:
- `dem` -> `d` + `e` + `m`
- `de` -> `d` + `e`
- `demb` -> `d` + `e` + `mb`
- `ia` -> stays `ia`
- `db` -> stays `db`
- `pxb` -> stays `pxb`

The displayed source line is never rewritten.
