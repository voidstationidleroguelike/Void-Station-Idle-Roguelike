# Web-first deployment

The project is a static site. No build step is currently required.

## Local preview

Run any static HTTP server from the project root. A service worker/PWA does not
work correctly when `index.html` is opened directly with `file://`.

Examples:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Repository

This folder is suitable for a private Git repository.

The project deliberately has:

- no CDN dependencies
- no server-side runtime requirement
- no package manager requirement for the current prototype
- relative URLs so it can be deployed below a path, not only at domain root

## Access control

Repository privacy and website access are separate concerns. Before exposing
internal/proprietary assets, choose a hosting setup that actually requires
authentication for the deployed site.

Do not assume that a private source repository automatically makes a published
static website private.

## Later mobile packaging

The same HTML/CSS/JS project can later be wrapped for Android/iOS.
Platform packaging should be treated as a delivery layer, not a rewrite.
