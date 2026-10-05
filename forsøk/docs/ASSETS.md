# Asset replacement guide

The prototype uses placeholders so proprietary/internal assets do not need to
be shared during development.

## Branding

Replace:

```text
assets/branding/trainor-apave-placeholder.svg
```

or update `branding.logo` in:

```text
data/app-config.js
```

## Pocket Guide

Use exactly 20 page files per language:

```text
assets/pocket-guide/no/page-01.png
...
assets/pocket-guide/no/page-20.png

assets/pocket-guide/en/page-01.png
...
assets/pocket-guide/en/page-20.png
```

The viewer is landscape-friendly and supports:

- left/right swipe while zoom is at 1x
- previous/next buttons
- pinch zoom
- drag while zoomed
- remembered last page
- language switching

## Poster

Update:

```text
data/app-config.js
```

Example:

```js
poster: {
  no: "assets/poster/poster-no.png",
  en: "assets/poster/poster-en.png",
}
```

High-resolution PNG/WebP works. SVG is ideal if the source can be exported as
vector artwork.

## File security note

Files shipped in `app/src/main/assets/` are packaged in the application.
They should not be treated as secret merely because they are inside the APK.
