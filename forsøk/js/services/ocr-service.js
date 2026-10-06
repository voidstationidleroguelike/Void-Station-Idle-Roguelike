(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  /*
   * Browser-first image text reading.
   *
   * The selected image stays on the device in this application code. Before
   * Tesseract reads it, the image is rendered to a canvas, upscaled when
   * useful, converted to grayscale and given moderate contrast. This helps
   * small engraved/printed EX lines without changing the original preview.
   *
   * The canvas is exported as PNG before recognition. This also gives the
   * recognizer a predictable input format when the browser itself can decode
   * formats such as AVIF/WebP.
   */

  async function recognizeImage(dataUrl, onProgress) {
    if (!dataUrl) {
      return null;
    }

    if (!window.Tesseract?.recognize) {
      throw new Error(
        "Tekstlesingsbiblioteket kunne ikke lastes. Kontroller internettilkoblingen og prøv igjen."
      );
    }

    const prepared = await prepareImageForRecognition(dataUrl);

    const result = await window.Tesseract.recognize(
      prepared,
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
    return cleanReadText(text);
  }

  async function prepareImageForRecognition(dataUrl) {
    const image = await loadImage(dataUrl);

    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    if (!sourceWidth || !sourceHeight) {
      throw new Error("Bildet kunne ikke klargjøres for tekstlesing.");
    }

    /*
     * Small nameplate text benefits from upscaling. Keep the canvas bounded so
     * mobile devices do not allocate an excessive amount of memory.
     */
    const longestEdge = Math.max(sourceWidth, sourceHeight);
    const desiredLongestEdge = 2600;
    const maxScale = 3;
    const maxPixels = 12_000_000;

    let scale = Math.max(
      1,
      Math.min(maxScale, desiredLongestEdge / longestEdge)
    );

    const scaledPixels =
      sourceWidth * sourceHeight * scale * scale;

    if (scaledPixels > maxPixels) {
      scale = Math.sqrt(
        maxPixels / (sourceWidth * sourceHeight)
      );
    }

    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!context) {
      return dataUrl;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, width, height);

    enhanceForSmallTechnicalText(context, width, height);

    return canvas.toDataURL("image/png");
  }

  function enhanceForSmallTechnicalText(context, width, height) {
    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    /*
     * Moderate grayscale + contrast is intentionally used instead of a hard
     * black/white threshold. Nameplates vary greatly in background, printing
     * colour and lighting, and thresholding can erase thin I/l/1/| glyphs.
     */
    const contrast = 1.55;

    for (let index = 0; index < pixels.length; index += 4) {
      const gray =
        pixels[index] * 0.299 +
        pixels[index + 1] * 0.587 +
        pixels[index + 2] * 0.114;

      const adjusted = Math.max(
        0,
        Math.min(255, (gray - 128) * contrast + 128)
      );

      pixels[index] = adjusted;
      pixels[index + 1] = adjusted;
      pixels[index + 2] = adjusted;
    }

    context.putImageData(imageData, 0, 0);
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () => reject(
        new Error(
          "Bildet kunne ikke dekodes. Prøv PNG, JPEG eller WebP hvis formatet ikke støttes av nettleseren."
        )
      );

      image.src = dataUrl;
    });
  }

  function cleanReadText(text) {
    /*
     * Only harmless whitespace cleanup here. Context-aware corrections of
     * technical glyphs happen later in the EX parser, not globally here.
     */
    return String(text || "")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  window.EX_APP.ocrService = {
    recognizeImage,
    prepareImageForRecognition,
  };
})();
