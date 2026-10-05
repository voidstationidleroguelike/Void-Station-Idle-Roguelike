# EX Pocket Guide – mobile web / PWA prototype

Mobile-first HTML/CSS/JavaScript prototype intended to be demonstrated in a
phone browser first, while keeping the same codebase suitable for later
Android and iOS packaging.

## Product structure

1. **Pocket Guide**
   - 20 landscape pages
   - swipe left/right
   - previous/next controls
   - pinch zoom
   - pan while zoomed
   - last page remembered
   - Norwegian / English asset sets

2. **EX-merking**
   - manual text input
   - take photo
   - upload/select an existing image
   - one shared OCR service boundary
   - one shared parser/result view

3. **Plakat**
   - one large overview asset per language
   - pinch zoom
   - pan

4. **EX-kurs**
   - selected direct course links
   - link to the full Trainor course catalogue

## Web/PWA

The prototype includes:

- `manifest.webmanifest`
- service worker
- offline app shell
- install prompt support where the browser exposes it
- home-screen icons
- iOS web-app meta tags
- safe-area handling
- mobile-first layout

No build step is required.

## Source structure

```text
ex-pocket-guide-web-mobile/
├── index.html
├── manifest.webmanifest
├── sw.js
├── css/
│   ├── tokens.css
│   ├── base.css
│   ├── components.css
│   └── views.css
├── data/
│   ├── app-config.js
│   ├── translations.js
│   ├── courses.js
│   └── ex-demo-rules.js
├── js/
│   ├── app.js
│   ├── core/
│   │   ├── i18n.js
│   │   ├── router.js
│   │   └── pan-zoom.js
│   ├── features/
│   │   ├── guide.js
│   │   ├── marking.js
│   │   ├── poster.js
│   │   └── courses.js
│   └── services/
│       ├── ocr-service.js
│       └── pwa-service.js
├── assets/
│   ├── branding/
│   ├── pocket-guide/
│   ├── poster/
│   └── pwa/
└── docs/
    ├── ASSETS.md
    ├── PLATFORM.md
    └── DEPLOYMENT.md
```

## Important architecture rule

Feature code must remain platform-neutral.

The web project is the source of truth. If Android/iOS packaging is added
later, platform-specific integration belongs at the boundary, not inside the
Pocket Guide, EX marking, poster or course features.

## OCR

`js/services/ocr-service.js` is the only OCR entry point.

The current prototype handles camera/gallery image acquisition and preview, but
does not pretend production OCR is already implemented.

## Technical EX rules

`data/ex-demo-rules.js` is only a small UI/demo dictionary.

Production EX interpretation must be built from approved technical material and
reviewed by the appropriate subject-matter owner before release.

## Deployment / private repository

See:

```text
docs/DEPLOYMENT.md
```

A private Git repository is a good place for source control, but remember that
repository privacy and deployed website access are separate settings.


## Browser OCR

The current web prototype now performs OCR in the browser with Tesseract.js.

- works in desktop browsers and mobile browsers
- the selected image is processed client-side by the application code
- first OCR use downloads the OCR engine/language data from the configured CDN
- OCR text is placed into the editable marking field before interpretation
- the app deliberately does not auto-correct ambiguous technical characters

For a production/offline build, the OCR library and language data can be
vendored with the project instead of loaded from a CDN.


## Line-aware EX marking parser

The project now preserves OCR line breaks and structurally classifies each
nameplate line. See:

```text
data/ex-marking-rules.js
js/core/ex-marking-parser.js
docs/EX_MARKING_PARSER.md
```

Gas/dust and electrical/mechanical are handled as separate dimensions.


## EX marking system selection

Manual interpretation now starts with:

```text
ATEX / IECEx / Other
```

Image scanning remains automatic and may detect more than one scheme on the
same plate.

Official artwork can replace the replaceable assets in:

```text
assets/marking-systems/
```


## EX symbols

The current prototype now uses:
- a round EX symbol on the home screen (`assets/home/ex-home-symbol.png`)
- the supplied official Ex / ATEX-style symbol in the marking-system selector

These can still be replaced locally with final approved artwork while keeping the same layout.


## Copilot handoff

For continuation in another coding assistant, start with:

```text
docs/HANDOFF_TO_COPILOT.md
```


## Technical content governance

The current handoff now includes:

```text
data/content-meta.js
data/general-text-templates.js
data/ex-test-cases.json
docs/EX_CODE_LIBRARY_SCHEMA.md
docs/TEST_CASES.md
```

All technical user-facing content is intended to be bilingual: Norwegian and
English.
