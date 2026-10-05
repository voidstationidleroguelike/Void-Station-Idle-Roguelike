(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  let selectedFile = null;
  let selectedDataUrl = null;

  function init() {
    const cameraInput = document.getElementById("cameraInput");
    const uploadInput = document.getElementById("imageUploadInput");

    document
      .getElementById("interpretButton")
      ?.addEventListener("click", interpretFromTextInput);

    document
      .getElementById("takePhotoButton")
      ?.addEventListener("click", () => cameraInput?.click());

    document
      .getElementById("uploadImageButton")
      ?.addEventListener("click", () => uploadInput?.click());

    document
      .getElementById("runOcrButton")
      ?.addEventListener("click", runOcr);

    document
      .getElementById("removeSelectedImage")
      ?.addEventListener("click", clearSelectedImage);

    cameraInput?.addEventListener("change", onFileSelected);
    uploadInput?.addEventListener("change", onFileSelected);

    window.addEventListener("exapp:languagechange", () => {
      const resultPanel = document.getElementById("markingResultPanel");

      if (!resultPanel?.classList.contains("is-hidden")) {
        interpretFromTextInput();
      }
    });
  }

  function onFileSelected(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    selectedFile = file;

    const reader = new FileReader();

    reader.onload = () => {
      selectedDataUrl = String(reader.result || "");
      showSelectedImage();
    };

    reader.readAsDataURL(file);

    // Enables choosing the same file again later.
    event.target.value = "";
  }

  function showSelectedImage() {
    const panel = document.getElementById("selectedImagePanel");
    const preview = document.getElementById("selectedImagePreview");
    const filename = document.getElementById("selectedImageName");

    if (!panel || !preview || !filename || !selectedDataUrl) {
      return;
    }

    preview.src = selectedDataUrl;
    filename.textContent = selectedFile?.name || "";
    panel.classList.remove("is-hidden");
  }

  function clearSelectedImage() {
    selectedFile = null;
    selectedDataUrl = null;

    document
      .getElementById("selectedImagePanel")
      ?.classList.add("is-hidden");

    const preview = document.getElementById("selectedImagePreview");
    if (preview) {
      preview.removeAttribute("src");
    }
  }

  async function runOcr() {
    if (!selectedDataUrl) {
      return;
    }

    try {
      const text = await window.EX_APP.ocrService.recognizeImage(
        selectedDataUrl
      );

      if (text) {
        setInputAndInterpret(text);
        return;
      }

      window.alert(
        "OCR er ikke koblet til i prototypen ennå. " +
        "Bildevalg fungerer, og OCR kobles inn sentralt i ocr-service.js."
      );
    } catch (error) {
      console.error("OCR failed:", error);
    }
  }

  function setInputAndInterpret(text) {
    const input = document.getElementById("markingInput");

    if (input) {
      input.value = text;
    }

    interpret(text);
  }

  function interpretFromTextInput() {
    const text = document.getElementById("markingInput")?.value || "";
    interpret(text);
  }

  function interpret(text) {
    const tokens = tokenize(text);
    const language = window.EX_APP.i18n.getLanguage();
    const dictionary = window.EX_APP.exDemoRules;

    const container = document.getElementById("markingTokens");
    const panel = document.getElementById("markingResultPanel");

    if (!container || !panel) {
      return;
    }

    container.innerHTML = "";

    tokens.forEach((token) => {
      const row = document.createElement("div");
      row.className = "token-row";

      const tokenElement = document.createElement("div");
      tokenElement.className = "token-row__token";
      tokenElement.textContent = token;

      const label = document.createElement("div");
      label.className = "token-row__label";
      label.textContent =
        dictionary[token]?.[language] ||
        (language === "no"
          ? "Ikke definert i demo-parser"
          : "Not defined in demo parser");

      row.append(tokenElement, label);
      container.appendChild(row);
    });

    panel.classList.remove("is-hidden");
  }

  function tokenize(text) {
    return String(text)
      .replace(/[\n\r\t]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  window.EX_APP.marking = {
    init,
  };
})();
