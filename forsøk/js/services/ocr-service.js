(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  /*
   * Browser-first OCR service.
   *
   * Tesseract.js runs recognition in the user's browser.
   * The selected image is processed client-side and is not uploaded by this
   * application code.
   *
   * For the EX marking use case we start with English OCR data because the
   * important content is mainly Latin letters, digits and technical codes.
   * The OCR result is returned as raw text so the user can verify/edit it
   * before relying on any interpretation.
   *
   * This file remains the one OCR boundary if the same HTML project is later
   * wrapped for Android/iOS.
   */

  async function recognizeImage(dataUrl, onProgress) {
    if (!dataUrl) {
      return null;
    }

    if (!window.Tesseract?.recognize) {
      throw new Error(
        "OCR-biblioteket kunne ikke lastes. Kontroller internettilkoblingen og prøv igjen."
      );
    }

    const result = await window.Tesseract.recognize(
      dataUrl,
      "eng",
      {
        logger(message) {
          if (typeof onProgress === "function") {
            onProgress({
              status: message.status || "",
              progress:
                typeof message.progress === "number"
                  ? message.progress
                  : null,
            });
          }
        },
      }
    );

    const text = result?.data?.text || "";

    return cleanOcrText(text);
  }

  function cleanOcrText(text) {
    /*
     * Only harmless whitespace cleanup here.
     * Do NOT silently "correct" I/1, O/0 etc. in EX markings.
     */
    return String(text)
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  window.EX_APP.ocrService = {
    recognizeImage,
  };
})();
