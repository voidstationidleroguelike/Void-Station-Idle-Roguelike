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
- home-screen icon placeholders
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
