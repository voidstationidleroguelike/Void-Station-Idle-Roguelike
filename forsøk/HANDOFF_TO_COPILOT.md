# Handoff to Copilot – EX Pocket Guide

**Status:** prototype / technical-content build  
**Updated:** 2026-10-05  
**Primary target:** mobile-first web/PWA, later reusable for Android/iOS wrapping

## 1. Goal

Continue building a compact EX pocket-guide app for field use. The same HTML/CSS/JavaScript codebase should run in a mobile browser/PWA and remain suitable for later wrapping for Android and iOS.

The project must remain deterministic for EX interpretation. Do **not** use generative AI to decide what an EX marking means. Image text recognition is only an input step; extraction, normalization, classification, interpretation and generated summary text are rule-based.

## 2. Non-negotiable project rules

- Mobile-first UI.
- Norwegian and English UI/content.
- Main navigation is exactly:
  1. Pocket Guide
  2. EX-merking
  3. Plakat
  4. EX-kurs
- ATEX and IECEx may both exist on the same nameplate and must be shown separately.
- A nameplate may contain several EX lines, for example one gas line and one dust line.
- Never stop interpretation after the first valid line.
- `Gas / Dust` and `Electrical / Mechanical` are separate dimensions; do not collapse them into one selector.
- Unknown codes remain visibly unknown. Do not guess.
- Technical content is draft/reviewable content and must be SME-reviewed before production use.
- **Do not replace or delete the user's real assets.** Code-only update ZIPs/patches must contain no `assets/` directory unless explicitly requested.

## 3. Current project structure

```text
index.html
manifest.webmanifest
sw.js
README.md

css/
  tokens.css
  base.css
  components.css
  views.css

data/
  app-config.js
  translations.js
  courses.js
  marking-systems.js
  ex-marking-rules.js
  ex-code-library.js
  ex-demo-rules.js
  content-meta.js
  general-text-templates.js
  ex-test-cases.json

js/
  app.js

  core/
    i18n.js
    router.js
    pan-zoom.js
    ex-marking-parser.js
    ex-code-extractor.js
    ex-marking-interpreter.js
    general-text-generator.js

  features/
    guide.js
    marking.js
    poster.js
    courses.js

  services/
    ocr-service.js
    pwa-service.js

assets/
  branding/
  home/
  marking-systems/
  pocket-guide/
  poster/
  pwa/

docs/
  ASSETS.md
  PLATFORM.md
  DEPLOYMENT.md
  EX_MARKING_PARSER.md
  OCR_FILTERING.md
  INTERACTIVE_MARKING_FLOW.md
  MARKING_SYSTEMS.md
  EX_CODE_LIBRARY_SCHEMA.md
  TEST_CASES.md
  HANDOFF_TO_COPILOT.md
```

No build step/npm is currently required. Static hosting is sufficient.

## 4. Branding / visual direction

Current design direction:

- technical blue/green working UI
- Trainor orange as brand accent
- Trainor / Groupe Apave logo at top
- round EX image on home screen
- official-style yellow ATEX hex symbol in ATEX UI/results

Current token direction includes:

```text
--ex-blue: #27465c
--ex-blue-dark: #1e3546
--ex-blue-soft: #355c74
--ex-green: #36b44a
--trainor-orange: #f45a24
```

Stable asset names used by code:

```text
assets/branding/trainor-apave-logo.svg
assets/home/ex-home-symbol.png
assets/marking-systems/atex-official-symbol.png
assets/marking-systems/iecex-symbol.svg
assets/marking-systems/other-marking-symbol.svg
```

Some stable-name SVGs may still contain temporary artwork in the prototype. The user may overwrite those files with approved assets without code changes.

## 5. Pocket Guide

The Pocket Guide is 20 pages in both Norwegian and English.

**Production asset paths are case-sensitive and must remain:**

```text
assets/pocket-guide/NO/page-01.webp ... page-20.webp
assets/pocket-guide/EN/page-01.webp ... page-20.webp
```

UI language keys remain lower-case `no` / `en`; `data/app-config.js` maps those to uppercase asset folders `NO` / `EN`.

Current viewer behavior:

- swipe left/right
- previous/next buttons
- page indicator
- pinch zoom
- pan while zoomed
- remembers last page
- image load failure shows the attempted path instead of a blank screen
- guide pages are displayed with a **90° rotation** because of source-page orientation
- PWA requests `portrait-primary`

Important: do not physically overwrite/rotate the user's WebP files unless specifically requested. The viewer currently handles the 90° display rotation.

## 6. Poster

Poster assets are language-specific and filenames are **lower-case**:

```text
assets/poster/poster-no.webp
assets/poster/poster-en.webp
```

Do not change these to uppercase names.

Poster behavior:

- one large image per language
- pinch zoom
- pan/drag
- no placeholder poster asset should be reintroduced

## 7. EX-merking UX

### Manual entry

Top-level systems are:

```text
ATEX
IECEx
Annet / Other
```

They are multi-select. ATEX and IECEx can be selected at the same time.

User enters one or more lines into an editable text area, then presses:

```text
Tolk merking
```

After interpretation the button becomes:

```text
Tolk på nytt
```

### Image input

User can:

- take a photo
- upload/select an image

The current browser prototype uses Tesseract.js in the client browser.

**User-facing UI should not use the term “OCR”.** Prefer wording such as:

```text
Fant følgende merking
Kontroller at merkingen stemmer med skiltet før du tolker.
```

Internal file/function names may still use `ocr`.

## 8. Full-plate reading strategy

Read the image **once over the full nameplate**. Then parse the returned text in three deterministic passes:

```text
1. IECEx / IEC-based Ex marking
2. ATEX category marking
3. Other relevant plate information
```

Do not stop because pass 1 found a valid `Ex ...` line. The same plate may still contain ATEX categories, CE, certificates, temperature range and a second gas/dust line.

Current intended output categories:

### Pass 1 – IECEx / IEC-based Ex lines

Examples:

```text
Ex db [ia IIC Ga] IIB T4 Gb IP55
Ex d e mb ib [ib] [op is] IIC T4
Ex tD A21 IP65 T90°C
```

### Pass 2 – ATEX category lines

Examples:

```text
II 2 (1) G
II 2 (2) G
II 2 D
II 2G
II 2D
```

The graphical ATEX hexagonal Ex symbol is **not text** and must not be expected from image text recognition. If an ATEX category line is found, render the supplied asset:

```text
assets/marking-systems/atex-official-symbol.png
```

### Pass 3 – other relevant plate information

Examples:

```text
CE 0158
IECEx ABC 06.0012
TÜV 05 ATEX 7176 X
-40°C <= Ta <= +60°C
```

Manufacturer, telephone numbers, addresses and unrelated product text should not be copied into the EX marking input.

## 9. Context-aware character-confusion handling

Image text recognition commonly confuses uppercase Roman `I` with:

```text
I
i
l
1
|
!
```

These characters may be treated as equivalent **only where known EX grammar makes the intended code clear**.

Examples that may normalize:

```text
11B       -> IIB
||C       -> IIC
!!B       -> IIB
111C      -> IIIC
11 2 D    -> II 2 D
|I 2 (2) G -> II 2 (2) G
|| 2 (|) G -> II 2 (1) G
```

Do **not** globally replace `1`, `l`, `|`, `!` or `i`. They may be valid characters elsewhere in certificate numbers, dates, product numbers, addresses etc.

ATEX requires special context checking because equipment group `II` is not always immediately followed by `A/B/C`; it may be followed by category syntax such as `2G`, `2 D`, `2 (1) G`, etc.

## 10. Multiple lines and gas/dust

The interpreter must support all relevant lines, not only the first one.

Example:

```text
II 2G Ex db IIC T4 Gb
II 2D Ex tb IIIC T125°C Db
```

Both lines must survive extraction and interpretation. The first is gas-related; the second is dust-related.

Do not flatten them into one synthetic marking.

## 11. Brackets / associated marking

Square brackets have technical meaning and are not decoration.

Example:

```text
Ex db [ia IIC Ga] IIB T4 Gb
```

Conceptually:

```text
Main equipment:
Ex db
IIB
T4
Gb

Associated / delimited part:
[ ia IIC Ga ]
```

The bracketed part must remain structurally separate. It must not be interpreted as “gas/dust brackets”.

Preserve similar bracketed structures such as:

```text
[ib]
[op is]
[ia IIC Ga]
```

## 12. Legacy vs modern notation

Do not silently rewrite legacy marking into a modern equivalent.

Examples that should be preserved when present:

```text
Ex tD
A21
Ex nA
Ex nC
Ex nR
```

The explanation library may state that a form is legacy, but the displayed source marking should remain what the user/nameplate supplied unless a very narrow recognition correction is justified by known grammar.

## 13. Interpretation output

For every parsed system/line show:

- full source/normalized line
- clickable marking elements
- per-element explanation
- relevant metadata separately
- deterministic general summary

Example IEC-based line:

```text
Ex db [ia IIC Ga] IIB T4 Gb IP55
```

Useful clickable grouping:

```text
Ex db
[
ia
IIC
Ga
]
IIB
T4
Gb
IP55
```

Example ATEX line:

```text
II 2 (1) G
```

Useful clickable grouping:

```text
official ATEX Ex symbol
II
2
(1)
G
```

## 14. Technical code library

`data/ex-code-library.js` is the central deterministic explanation library.

Content is bilingual (NO/EN) and should support both:

```text
short
```

and

```text
detailed
```

The detail panel should prefer `detailed` when available.

Current draft coverage includes, among other items:

- ATEX group/category/G/D structure
- Ex protection methods
- gas groups IIA/IIB/IIC
- dust groups IIIA/IIIB/IIIC
- EPL Ga/Gb/Gc and Da/Db/Dc
- T1–T6 maximum surface-temperature meanings
- direct dust temperature markings such as `T125°C`
- IP code handling
- square-bracket / associated marking explanation
- certificate suffix `X`
- component suffix `U`
- legacy `Ex tD` / `A21` handling

Do not invent definitions for missing codes. Add missing entries explicitly to the library and mark review status in content metadata as appropriate.

## 15. Deterministic general text

General text must be generated from structured parsed results and approved templates, not from a language model.

Relevant files:

```text
data/general-text-templates.js
js/core/general-text-generator.js
```

The summary must describe only systems/sections actually parsed. A selected UI toggle alone must not cause the summary to claim that ATEX or IECEx was found.

Example direction:

```text
Skiltet inneholder både ATEX- og IECEx-/IEC-basert Ex-merking.
Hovedutstyrets merking er Ex db IIB T4 Gb.
Delen [ia IIC Ga] beskriver en tilknyttet / associated del.
Utstyret er også merket IP55.
```

Exact wording remains subject to technical review.

## 16. Safety/disclaimer text

At the bottom of EX interpretation, keep the current guidance/disclaimer:

```text
Innholdet i guiden er ment som en veiledning. Vær oppmerksom på at innhold i standarder kan oppdateres, og bør sjekkes hvis det skal brukes som beslutningsgrunnlag. Trainor Elsikkerhet AS fraskriver seg alt ansvar for hendelser som kan oppstå som følge av feiltolkning av innholdet i guiden.
```

The Pocket Guide and poster have their own disclaimer/guidance content; do not add a redundant global modal unless requested.

## 17. EX courses

Current selected direct links:

```text
Ex grunnleggende
https://www.trainor.no/app/product/classroom/sjgh9w/ex-grunnleggende

Exi grunnleggende
https://www.trainor.no/app/product/classroom/pVcMwm/exi-grunnleggende

Ex installasjon – praktisk kurs
https://www.trainor.no/app/product/classroom/z4iFmV/ex-installasjon---praktisk-kurs

Ex vedlikehold
https://www.trainor.no/app/product/classroom/dGsi4v/ex-vedlikehold

IECEx- og ATEX-merking av elektrisk utstyr
https://www.trainor.no/app/product/elearning/6QrPSd/iecex--og-atex-merking-av-elektrisk-utstyr

Flammespalter
https://www.trainor.no/app/product/classroom/zvVYZx/flammespalter
```

Generic final link:

```text
Se flere EX- og andre Trainor-kurs her.
https://www.trainor.no/courses/
```

Do not show prices/durations unless explicitly requested.

## 18. PWA / web behavior

Current setup:

- static hosting
- service worker
- web app manifest
- portrait-primary request for installed PWA
- touch/safe-area support
- Tesseract.js currently loaded from CDN

For stronger offline production behavior, Tesseract.js can later be vendored locally instead of loaded from CDN.

When changing cached files, bump the service-worker cache version so users do not remain on stale JS/CSS.

A hard refresh/service-worker refresh may still be necessary during active development.

## 19. Asset policy for future patches

The user's real Pocket Guide and poster assets may exist in the GitHub repository but are intentionally not bundled into code-only patch ZIPs.

**Default for generated updates:**

```text
NO assets directory in patch ZIP
```

Only include changed source/docs files. Never create placeholder Pocket Guide or poster assets again unless explicitly asked.

## 20. Tests

Machine-readable regression cases live in:

```text
data/ex-test-cases.json
```

Human-readable notes live in:

```text
docs/TEST_CASES.md
```

Important regression areas:

- same plate contains ATEX + IEC-based marking
- gas + dust lines on the same plate
- square-bracket associated marking
- CE + ATEX/IECEx certificate metadata
- `II` read as `11`, `Il`, `|I`, `!!`, etc. in valid EX context
- unrelated `11`, `|`, `!`, `l` elsewhere must not be globally rewritten
- legacy notation remains legacy
- selected system toggle does not fabricate parsed systems
- all relevant nameplate lines are retained

## 21. Known cleanup / follow-up work

Items worth reviewing next:

- `data/ex-demo-rules.js` may now be legacy/dead prototype code; remove only after verifying no runtime dependency.
- Expand `ex-code-library.js` coverage as more real nameplates are tested.
- Improve image preprocessing if difficult plates still fail before the parsing stage.
- Consider locally hosted Tesseract assets for offline production.
- Continue adding real-nameplate regression cases.
- Technical SME review of every user-facing EX explanation before production.

## 22. Content references used for recent explanation expansion

Recent draft explanation work used user-provided ATEX/EX reference material covering the structure of ATEX marking, equipment groups/categories, protection methods, gas groups, temperature classes, EPL, combined markings, gas+dust examples, certificate suffixes and related nameplate information.

Treat that content as a drafting/reference source, not as a substitute for checking applicable standards and approved internal technical material before production release.

## 23. Immediate instruction to Copilot

When continuing this repo:

1. Inspect the existing files before changing architecture.
2. Preserve current stable asset paths exactly.
3. Do not delete/replace the user's real `assets/pocket-guide/NO`, `assets/pocket-guide/EN` or poster WebPs.
4. Keep EX interpretation deterministic.
5. Keep full-plate staged parsing: IECEx/Ex → ATEX → other metadata.
6. Keep context-aware `I/i/l/1/|/!` handling narrow and grammar-based.
7. Preserve all relevant marking lines, including separate gas/dust and bracketed associated sections.
8. Add/adjust regression tests with every parser change.
9. Keep Norwegian and English content in sync.
10. For patch delivery, default to **code/docs only, no assets**.

## Multiple markings inside one recognized text line

Do not assume that one returned text line equals one physical nameplate line.
Image recognition can collapse several physical rows into one long string.

The extractor must scan each returned line **and** the flattened whole-plate
text for every structural occurrence.

Example input returned as one line:

```text
|| 2 (|) G Ex d e mb ib [ib] [op is] ||C T4 !1 2 D Ex tD A21 IP65 T90°C CE 0158 TUV 05 ATEX 7176 X
```

It must yield four marking lines:

```text
Ex d e mb ib [ib] [op is] IIC T4
Ex tD A21 IP65 T90°C
II 2 (1) G
II 2 D
```

and keep `CE 0158` and `TUV 05 ATEX 7176 X` as metadata.

Never stop after the first `Ex` occurrence or the first ATEX category.

## v27 image-reading and IP rules

- Preprocess browser-decodable images to enhanced PNG before text recognition.
- Always expose the full raw recognized text in a collapsible debug panel.
- Treat `I`, `i`, `l`, `1`, `|`, `!` as I-like glyphs only in known EX grammar.
- This applies to `ia/ib/ic` as well as `IIA/IIB/IIC`, `IIIA/IIIB/IIIC` and
  ATEX equipment group II. Never perform global substitutions.
- IP tokens are interpreted dynamically as a composed code. The first
  character is solid/contact protection; the second is water protection.
  Support `X` and relevant suffix letters, including the common `IP69K` form.
- Code-only patches must not contain `/assets`.

## v28 real-nameplate OCR regression

The parser must handle the actual OCR output from the R. STAHL test plate, including compact/merged forms such as `W2(2)GExde`, `N2DExtD` and a dropped-I gas group such as `iC T4`. These repairs are context-only: W/N/H/M are accepted as a merged `II` only inside the exact ATEX `category + G/D + Ex` grammar, and `iC` becomes `IIC` only in the gas-group position before a temperature class/EPL/IP/end. Never apply these substitutions globally.

Expected reconstruction from the regression fixture:

```text
II 2 (2) G
Ex d e mb ib [ib] [op is] IIC T4
II 2 D
Ex tD A21 IP65 T90°C
```

## v29 manual interpretation and brackets

- Manual entry is incremental: if ATEX is selected, `II`, `II 2`, `II 2 (2) G`, etc. must already produce clickable interpreted elements. A complete marking line is not required.
- Manual interpretation no longer silently stops merely because the marking is incomplete.
- `()` and `[]` are different structures:
  - `(1)`, `(2)`, `(3)` are ATEX associated-category tokens.
  - `[ ... ]` delimits an associated marking section and must remain one structural token, e.g. `[ib]`, `[op is]`, `[ia IIC Ga]`.
- Never split `[op is]` into `[op` and `is]`.
- ATEX lines may contain the shared IEC 60079 Ex-core codes. `d`, `e`, `mb`, `ib`, `op is`, `IIC`, `T4`, etc. should use the same code-library definitions instead of being reported as unknown merely because the section is ATEX.
- The instructor Excel (`EX-betegnelser-instruktor-v2.xlsx`) is the temporary content guide until the reviewed library is imported.


## v30: Manual input and image reading are separate pipelines

This is a hard rule.

### Manual input
Manual text is authoritative user input. Do not run OCR cleanup or glyph
normalisation on it.

Examples that MUST remain unchanged in manual mode:

```text
(I)   -> (I), never (1)
!b    -> !b, never ib
I1C   -> I1C, never IIC
```

The manual interpreter may normalise harmless whitespace and bracket spacing,
but it must not replace characters.

Manual input may be partial. If ATEX is selected, `II` alone must be
interpretable. The user does not need to enter a complete marking line.

### Image/OCR input
OCR correction belongs only in the image extraction pipeline. Context-aware
I/1/l/|/! correction may be used there when EX grammar makes the correction
safe. After the extracted candidate has been placed in the editable text field,
the text field is again treated as manual/literal input.

### Parentheses vs square brackets
- `(1)`, `(2)`, `(3)` are ATEX associated-category syntax when actually written
  that way.
- `(I)` must never be changed to `(1)` in manual input.
- `[ ... ]` is an associated/bracketed marking section.
- The bracket is context, not a separate EX code card.
- `[ib]`, `[op is]`, `[ia IIC Ga]` stay visually whole.
- Their detail view explains the inner code(s) and then adds the common
  bracket/associated-context explanation.

### Image feature
Keep the image-reading feature isolated from the manual interpreter so it can
be disabled or removed later without changing manual interpretation.
