# EX Pocket Guide v27 — consolidated code-only build

Base: v20 complete project.

This code-only package consolidates the later parser/content work and the new
image-reading/IP improvements. It deliberately contains **no `assets/` folder**,
so existing Pocket Guide, poster, branding and marking assets are not replaced.

## Main changes

- Full image is read once, then parsed in three passes:
  1. IECEx / Ex
  2. ATEX
  3. Other plate information
- Extracts multiple Ex/ATEX markings even if image reading collapses the plate
  into one long text line.
- Browser-decodable images are converted to enhanced PNG before text reading:
  moderate upscaling, grayscale and contrast.
- Raw recognized text is available in a collapsible debug panel.
- Context-aware I-like glyph handling:
  `I`, `i`, `l`, `1`, `|`, `!`
- The same handling applies to `ia`, `ib`, `ic`, `IIA/IIB/IIC`,
  `IIIA/IIIB/IIIC` and ATEX group II only where grammar makes it safe.
- Dynamic IP interpretation for all supported composed codes:
  first character = solid/contact protection,
  second character = water protection.
  Supports `X` and suffixes including `IP69K`.
- Rich v24 clickable EX-code explanations retained.
- Service-worker cache bumped to v27.

## Asset rule

Do not add or replace assets when applying this package. Existing files under
`assets/` remain the source of truth.
