# Asset replacement guide

The prototype uses placeholders so proprietary/internal assets do not need to
be shared during development.

## Branding

Replace:

```text
assets/branding/trainor-apave-logo.svg
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

## Production image format

Large content imagery should use WebP:

```text
assets/pocket-guide/no/page-01.webp ... page-20.webp
assets/pocket-guide/en/page-01.webp ... page-20.webp

assets/poster/poster-no.webp
assets/poster/poster-en.webp
```

Do **not** convert every project asset to WebP.

Keep logos, UI icons and vector placeholders as SVG where appropriate.
Keep supplied symbol artwork as PNG when that is the approved/original asset.

The app is WebP-first for Pocket Guide and Poster, with prototype fallback to
PNG/SVG while final files are being prepared.


## Final asset filenames

Temporary artwork is deliberately stored under the same filenames that final
approved artwork should use. This makes replacement a simple overwrite.

Replace these files without changing code:

```text
assets/branding/trainor-apave-logo.svg
assets/marking-systems/atex-official-symbol.png
assets/marking-systems/iecex-symbol.svg
assets/marking-systems/other-marking-symbol.svg
```

Final large content files:

```text
assets/poster/poster-no.webp
assets/poster/poster-en.webp

assets/pocket-guide/no/page-01.webp ... page-20.webp
assets/pocket-guide/en/page-01.webp ... page-20.webp
```

There are no poster placeholder files anymore.
