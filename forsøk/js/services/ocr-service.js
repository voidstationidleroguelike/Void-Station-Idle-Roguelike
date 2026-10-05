(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  /*
   * Cross-platform OCR service boundary.
   *
   * IMPORTANT:
   * The UI and feature code are plain HTML/CSS/JavaScript and do not care
   * whether the finished app runs on Android or iOS.
   *
   * The first production target is mobile web/PWA. OCR can later be connected
   * here using a browser-capable local OCR implementation. If the same web
   * project is wrapped with Capacitor later, this service remains the single
   * integration point for Android and iOS as well.
   *
   * Until then, this service deliberately returns null so the prototype can
   * demonstrate the complete UI flow without pretending OCR is implemented.
   */

  async function recognizeImage(dataUrl) {
    if (!dataUrl) {
      return null;
    }

    // Production OCR implementation belongs here.
    // Keep feature code in marking.js unchanged.
    return null;
  }

  window.EX_APP.ocrService = {
    recognizeImage,
  };
})();
