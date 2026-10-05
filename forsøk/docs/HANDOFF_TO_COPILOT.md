# Handoff to Copilot – EX Pocket Guide

## Goal

Build a mobile-first HTML/CSS/JavaScript EX pocket-guide web app that can:

- run directly in a mobile browser / PWA
- later be wrapped for Android and iOS from the same codebase
- keep proprietary assets local/replacable
- avoid generative AI for EX interpretation
- use deterministic OCR filtering + rule-based interpretation

## Main navigation

1. Pocket Guide
2. EX-merking
3. Plakat
4. EX-kurs

## Visual direction

- Mobile-first
- Trainor / Groupe Apave branding placeholder at top
- EX guide uses blue + green as main working colors
- Trainor orange remains brand accent
- Home EX symbol uses the supplied round EX symbol
- ATEX system selector uses the supplied hexagonal Ex symbol

## Pocket Guide

- 20 landscape pages
- Norwegian + English asset folders
- swipe left/right
- previous/next buttons
- pinch zoom
- pan while zoomed
- remembers last page
- intended to use maximum phone screen area

Assets:

```text
assets/pocket-guide/no/page-01.png ... page-20.png
assets/pocket-guide/en/page-01.png ... page-20.png
```

Norwegian page 1 is already present in the prototype.

## Poster

Separate language assets:

```text
assets/poster/poster-no.svg
assets/poster/poster-en.svg
```

Replace with final poster files locally.

Poster viewer supports zoom and pan.

## EX marking – desired UX

### Manual

User can toggle one or more systems:

- ATEX
- IECEx
- Other

ATEX and IECEx can both be selected at the same time.

User types/pastes marking and presses:

```text
Tolk merking
```

After first interpretation the button becomes:

```text
Tolk på nytt
```

### Camera / image upload

User can:

- take a photo
- upload/select an existing image

Browser OCR currently uses Tesseract.js.

OCR reads the image, but **the UI must not dump all OCR text into the marking field**.

The flow is intended to be:

```text
Image
  ↓
OCR
  ↓
extract complete known EX marking line(s)
  ↓
"Fant følgende merking"
  ↓
editable textarea
  ↓
user checks/corrects OCR
  ↓
Tolk merking
```

Manufacturer names, addresses, telephone numbers etc. should not be forwarded
to the marking field.

Useful metadata such as certificate numbers / CE / ambient temperature may be
shown separately.

## Example target

Example plate should ideally produce:

```text
Ex db [ia IIC Ga] IIB T4 Gb IP55
II 2 (1) G
```

Then interpretation should show a short general explanation followed by
separate IECEx and ATEX sections.

### IECEx section

Full line:

```text
Ex db [ia IIC Ga] IIB T4 Gb IP55
```

Clickable elements:

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

Important: `[ ... ]` is not a gas/dust marker by itself.

It denotes an associated / delimited part of the marking. The content inside
must be interpreted separately from the main equipment marking.

For this example the intended conceptual split is:

```text
Main equipment:
Ex db
IIB
T4
Gb

Associated part:
[
ia
IIC
Ga
]

Other:
IP55
```

### ATEX section

Full line:

```text
II 2 (1) G
```

Clickable elements:

```text
official Ex symbol
II
2
(1)
G
```

## General generated explanation

The final app should generate a deterministic summary from approved rules and
text templates, not generative AI.

Example direction:

```text
Skiltet inneholder både ATEX- og IECEx-merking for gassatmosfære.
Hovedutstyret har beskyttelsesart Ex db, gassgruppe IIB,
temperaturklasse T4 og EPL Gb.

Delen [ia IIC Ga] beskriver en tilknyttet / associated egensikker del.
Denne delen har ia, gassgruppe IIC og EPL Ga.

Utstyret er også merket IP55.

ATEX-merkingen er II 2 (1) G.
```

Exact wording and technical rules must be reviewed by an EX subject-matter
owner before production use.

## Code architecture

```text
index.html

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

js/
  app.js

  core/
    i18n.js
    router.js
    pan-zoom.js
    ex-marking-parser.js
    ex-code-extractor.js
    ex-marking-interpreter.js

  features/
    guide.js
    marking.js
    poster.js
    courses.js

  services/
    ocr-service.js
    pwa-service.js
```

## Separation of responsibilities

### `ex-code-extractor.js`

Input:
raw OCR text

Output:
- complete candidate EX marking lines
- detected systems
- useful metadata

It should be conservative and must not invent missing codes.

### `ex-marking-interpreter.js`

Input:
verified marking text + selected systems

Output:
- general interpretation structure
- system sections
- clickable tokens

### `ex-code-library.js`

Central technical content source for:

- token labels
- explanations
- future approved metadata

This should grow gradually and be technically reviewed.

### `marking.js`

UI only:

- system toggles
- image selection
- OCR flow
- editable marking text
- result rendering
- clickable token details

Avoid putting technical EX rules directly in this file.

## Marking systems

Top-level manual options:

```text
ATEX
IECEx
Other
```

"Other" is intended for older / country-specific marking systems.

## PWA / web

Included:

- manifest.webmanifest
- service worker
- install prompt support
- offline app shell
- mobile safe-area handling

The current web project is intended to be the source of truth.

## Hosting/testing

The project is static HTML/CSS/JS.

It can be hosted in a private/obscure test path or behind proper server-side
authentication.

A JavaScript-only password gate can be used as a soft demo lock, but it is not
real protection for proprietary assets.

A password gate has not been implemented in the current handoff.

## EX courses

Selected direct links currently included:

- Ex grunnleggende
- Exi grunnleggende
- Ex installasjon – praktisk kurs
- Ex vedlikehold
- IECEx- og ATEX-merking av elektrisk utstyr
- Flammespalter

Bottom link:

```text
Se flere EX- og andre Trainor-kurs her ↗
```

## Known limitations / next tasks

1. Complete and technically review `ex-code-library.js`.
2. Improve OCR extraction robustness on real plates.
3. Add deterministic general-text generation based on interpreted structure.
4. Improve bracket / associated-apparatus grouping in the UI.
5. Add more gas/dust/mechanical/legacy cases only after approved rules exist.
6. Add final official assets locally.
7. Optionally add a soft password gate for internal demo.
8. Test on:
   - mobile Chrome
   - mobile Safari
   - desktop browser
9. Later package the same project for Android/iOS if desired.

## Important safety/design principle

If OCR or parsing is uncertain:

- show the extracted text
- let the user edit it
- mark unknown elements as unknown
- never silently guess or auto-correct technical codes


## Bilingual requirement

All user-facing technical content must exist in both:

- Norwegian (`no`)
- English (`en`)

This includes:

- token explanations
- general generated interpretation text
- warnings
- legacy/unknown-code messages
- course/UI labels where applicable

See:

```text
data/general-text-templates.js
docs/EX_CODE_LIBRARY_SCHEMA.md
```

## Acceptance tests

Before changing parser behavior, run/verify the cases in:

```text
docs/TEST_CASES.md
data/ex-test-cases.json
```

The first acceptance case is the current primary reference:

```text
Ex db [ia IIC Ga] IIB T4 Gb IP55
II 2 (1) G
```


## ATEX graphical Ex symbol and OCR

The ATEX Ex symbol is graphical artwork and is **not expected to be read as
text by OCR**.

Correct flow:

```text
OCR finds textual ATEX category line, e.g. II 2 (I) G
            ↓
parser creates an ATEX result section
            ↓
UI prepends/renders the approved ATEX Ex-symbol asset
```

An ATEX certificate number can be used as evidence that ATEX information is
present on the plate, but it must **not** be used to invent a missing category
line. If the certificate is detected but the category line is not read
reliably, show a warning and require manual correction/entry.

The general generated text must be based on successfully parsed result
sections, never merely on selected system toggles.


## Multiple marking lines and CE

Image reading must process the entire plate.

Do not stop after the first EX line. A single plate may contain multiple
relevant marking lines, for example separate gas and dust lines.

The result model therefore supports multiple IECEx/Ex sections and multiple
ATEX category lines.

CE marking should also be retained as relevant plate information, e.g.:

```text
CE 0158
```

CE is shown separately from the EX code breakdown. Do not treat the CE marking
as an IECEx or ATEX code token.

## WebP content assets

Production Pocket Guide pages and Poster images use WebP.

Expected final paths:

```text
assets/pocket-guide/no/page-01.webp ... page-20.webp
assets/pocket-guide/en/page-01.webp ... page-20.webp
assets/poster/poster-no.webp
assets/poster/poster-en.webp
```

Do not mass-convert branding, UI icons, SVG vectors or approved symbol files
just for consistency. WebP is primarily for the large raster content.
