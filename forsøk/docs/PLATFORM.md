# Platform strategy

This project is intentionally built as one HTML/CSS/JavaScript application.

The same web application should be wrapped for:

- Android
- iOS

The feature code must not contain Android-specific or iOS-specific branches.

## Camera and image selection

The prototype uses standard HTML file inputs:

```html
<input type="file" accept="image/*" capture="environment">
<input type="file" accept="image/*">
```

This gives the app two user flows:

1. Take a photo
2. Choose/upload an existing image

Both flows end in the same JavaScript OCR service.

## OCR

OCR is isolated in:

```text
js/services/ocr-service.js
```

The rest of the application calls only:

```js
EX_APP.ocrService.recognizeImage(dataUrl)
```

The final implementation can connect that service to a cross-platform
Capacitor-compatible OCR solution without changing the EX-marking UI.

## Packaging

A full-stack/mobile developer can later place the web project in a Capacitor
shell and generate the Android and iOS projects from the same source.

The HTML project remains the source of truth.
