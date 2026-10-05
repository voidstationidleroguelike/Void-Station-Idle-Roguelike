(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  let selectedFile = null;
  let selectedDataUrl = null;
  let selectedSystems = new Set();
  let hasInterpreted = false;
  let lastExtractedMetadata = [];

  function init() {
    renderSystemSelector();

    const cameraInput = document.getElementById("cameraInput");
    const uploadInput = document.getElementById("imageUploadInput");

    document
      .getElementById("interpretButton")
      ?.addEventListener("click", () => interpretFromTextInput());

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

    document
      .getElementById("closeTokenDetail")
      ?.addEventListener("click", hideTokenDetail);

    cameraInput?.addEventListener("change", onFileSelected);
    uploadInput?.addEventListener("change", onFileSelected);

    window.addEventListener("exapp:languagechange", () => {
      renderSystemSelector();

      if (hasInterpreted) {
        interpretFromTextInput({ silent: true });
      }
    });
  }

  // -------------------------------------------------------------------
  // Marking-system toggles
  // -------------------------------------------------------------------

  function renderSystemSelector() {
    const grid = document.getElementById("markingSystemGrid");
    const help = document.getElementById("markingSystemHelp");

    if (!grid) {
      return;
    }

    const language = currentLanguage();
    grid.innerHTML = "";

    window.EX_APP.markingSystems.forEach((system) => {
      const selected = selectedSystems.has(system.id);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "marking-system-card";
      button.dataset.system = system.id;
      button.setAttribute("aria-pressed", selected ? "true" : "false");

      const image = document.createElement("img");
      image.src = system.asset;
      image.alt = system.title[language] || system.title.no || system.id;

      const copy = document.createElement("span");
      copy.className = "marking-system-card__copy";

      const title = document.createElement("strong");
      title.textContent =
        system.title[language] ||
        system.title.no ||
        system.id;

      const description = document.createElement("small");
      description.textContent =
        system.description[language] ||
        system.description.no ||
        "";

      copy.append(title, description);
      button.append(image, copy);

      button.addEventListener("click", () => {
        if (selectedSystems.has(system.id)) {
          selectedSystems.delete(system.id);
        } else {
          selectedSystems.add(system.id);
        }

        renderSystemSelector();
      });

      grid.appendChild(button);
    });

    if (help) {
      help.textContent =
        language === "en"
          ? "You can select more than one system. One plate may contain both ATEX and IECEx marking."
          : "Du kan velge flere systemer samtidig. Ett skilt kan inneholde både ATEX- og IECEx-merking.";
    }
  }

  function addDetectedSystems(systems) {
    systems.forEach((system) => selectedSystems.add(system));
    renderSystemSelector();
  }

  // -------------------------------------------------------------------
  // Image selection
  // -------------------------------------------------------------------

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

    hideOcrStatus();
    lastExtractedMetadata = [];
    renderOcrMetadata([]);
    renderOcrWarnings([]);
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

    document
      .getElementById("ocrCandidateBanner")
      ?.classList.add("is-hidden");

    hideOcrStatus();
    lastExtractedMetadata = [];
    renderOcrMetadata([]);
    renderOcrWarnings([]);
  }

  // -------------------------------------------------------------------
  // OCR -> established marking candidate(s)
  // -------------------------------------------------------------------

  async function runOcr() {
    if (!selectedDataUrl) {
      return;
    }

    try {
      setOcrBusy(true);

      showOcrStatus(
        currentLanguage() === "en"
          ? "Preparing OCR…"
          : "Klargjør tekstlesing…"
      );

      const rawText = await window.EX_APP.ocrService.recognizeImage(
        selectedDataUrl,
        updateOcrProgress
      );

      if (!rawText) {
        showOcrStatus(
          currentLanguage() === "en"
            ? "No readable text was found. Try a closer, sharper photo."
            : "Fant ingen lesbar tekst. Prøv et nærmere og skarpere bilde.",
          true
        );
        return;
      }

      const extracted = window.EX_APP.exCodeExtractor.extract(
        rawText,
        currentLanguage()
      );

      lastExtractedMetadata = extracted.metadata || [];
      renderOcrMetadata(lastExtractedMetadata);
      renderOcrWarnings(extracted.warnings || []);

      if (!extracted.markingLines.length) {
        showOcrStatus(
          currentLanguage() === "en"
            ? "Text was found, but no established EX marking line could be isolated."
            : "Fant tekst, men klarte ikke å skille ut en etablert EX-merkelinje.",
          true
        );
        return;
      }

      const input = document.getElementById("markingInput");

      if (input) {
        input.value = extracted.markingText;
        input.focus();
      }

      addDetectedSystems(extracted.systems);

      document
        .getElementById("ocrCandidateBanner")
        ?.classList.remove("is-hidden");

      hasInterpreted = false;
      updateInterpretButton();

      showOcrStatus(
        currentLanguage() === "en"
          ? "Marking extracted. Check the line(s), correct any OCR errors, then interpret."
          : "Merking skilt ut. Kontroller linjen(e), rett eventuelle OCR-feil og trykk Tolk merking."
      );
    } catch (error) {
      console.error("OCR failed:", error);

      showOcrStatus(
        error?.message ||
          (currentLanguage() === "en"
            ? "OCR failed."
            : "Tekstlesingen feilet."),
        true
      );
    } finally {
      setOcrBusy(false);
    }
  }

  function renderOcrMetadata(items) {
    const panel = document.getElementById("ocrMetadataPanel");
    const list = document.getElementById("ocrMetadataList");

    if (!panel || !list) {
      return;
    }

    list.innerHTML = "";

    if (!items?.length) {
      panel.classList.add("is-hidden");
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "ocr-metadata__row";

      const label = document.createElement("span");
      label.className = "ocr-metadata__label";
      label.textContent = item.label;

      const value = document.createElement("code");
      value.className = "ocr-metadata__value";
      value.textContent = item.value;

      row.append(label, value);
      list.appendChild(row);
    });

    panel.classList.remove("is-hidden");
  }


  function renderOcrWarnings(items) {
    const panel = document.getElementById("ocrWarningPanel");
    const list = document.getElementById("ocrWarningList");

    if (!panel || !list) {
      return;
    }

    list.innerHTML = "";

    if (!items?.length) {
      panel.classList.add("is-hidden");
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("p");
      row.className = "ocr-warning__item";
      row.textContent = item.text;
      list.appendChild(row);
    });

    panel.classList.remove("is-hidden");
  }

  // -------------------------------------------------------------------
  // Interpretation
  // -------------------------------------------------------------------

  function interpretFromTextInput({ silent = false } = {}) {
    const text = document.getElementById("markingInput")?.value || "";

    if (!text.trim()) {
      return;
    }

    const language = currentLanguage();

    if (!selectedSystems.size) {
      if (!silent) {
        window.alert(
          language === "en"
            ? "Select ATEX, IECEx and/or Other before interpreting."
            : "Velg ATEX, IECEx og/eller Annet før du tolker."
        );
      }
      return;
    }

    const result = window.EX_APP.exMarkingInterpreter.interpret(
      text,
      {
        language,
        systems: [...selectedSystems],
        metadata: lastExtractedMetadata,
      }
    );

    renderInterpretation(result);

    hasInterpreted = true;
    updateInterpretButton();
  }

  function renderInterpretation(result) {
    const general = document.getElementById("markingGeneralText");
    const sections = document.getElementById("markingSections");
    const panel = document.getElementById("markingResultPanel");

    if (!general || !sections || !panel) {
      return;
    }

    hideTokenDetail();

    general.textContent =
      window.EX_APP.generalTextGenerator?.generate(
        result,
        currentLanguage()
      ) || result.generalText;
    sections.innerHTML = "";

    result.sections.forEach((section) => {
      sections.appendChild(renderSection(section));
    });

    renderResultMetadata(result.metadata || [], sections);

    panel.classList.remove("is-hidden");
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }


  function renderResultMetadata(items, container) {
    if (!items?.length || !container) {
      return;
    }

    const relevant = items.filter((item) =>
      ["ce", "atexCertificate", "iecexCertificate", "ambient"].includes(item.key)
    );

    if (!relevant.length) {
      return;
    }

    const card = document.createElement("article");
    card.className = "interpretation-section interpretation-section--plate-info";

    const heading = document.createElement("div");
    heading.className = "interpretation-section__heading";

    const title = document.createElement("strong");
    title.textContent =
      currentLanguage() === "en"
        ? "Other relevant plate information"
        : "Annen relevant skiltinfo";

    heading.appendChild(title);
    card.appendChild(heading);

    relevant.forEach((item) => {
      const row = document.createElement("div");
      row.className = "plate-info-row";

      const label = document.createElement("span");
      label.className = "plate-info-row__label";
      label.textContent = item.label;

      const value = document.createElement("code");
      value.className = "plate-info-row__value";
      value.textContent = item.value;

      row.append(label, value);
      card.appendChild(row);
    });

    container.appendChild(card);
  }

  function renderSection(section) {
    const card = document.createElement("article");
    card.className = `interpretation-section interpretation-section--${section.system}`;

    const heading = document.createElement("div");
    heading.className = "interpretation-section__heading";

    const title = document.createElement("strong");
    title.textContent = section.title;

    const fullLine = document.createElement("code");
    fullLine.className = "interpretation-section__line";
    fullLine.textContent = section.fullLine;

    heading.append(title, fullLine);

    const tokenGrid = document.createElement("div");
    tokenGrid.className = "marking-token-grid";

    section.tokens.forEach((token) => {
      tokenGrid.appendChild(renderToken(token));
    });

    card.append(heading, tokenGrid);
    return card;
  }

  function renderToken(token) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "marking-token";
    button.classList.toggle("marking-token--unknown", !token.known);

    if (token.officialSymbol && token.system === "atex") {
      const image = document.createElement("img");
      image.src = "assets/marking-systems/atex-official-symbol.png";
      image.alt = "Ex";
      button.appendChild(image);
      button.classList.add("marking-token--symbol");
    } else {
      button.textContent = token.value;
    }

    button.addEventListener("click", () => showTokenDetail(token));

    return button;
  }

  function showTokenDetail(token) {
    const panel = document.getElementById("tokenDetailPanel");
    const title = document.getElementById("tokenDetailTitle");
    const text = document.getElementById("tokenDetailText");

    if (!panel || !title || !text) {
      return;
    }

    const definition = window.EX_APP.exMarkingInterpreter.getDefinition(
      token.system,
      token.value,
      currentLanguage()
    );

    title.textContent = definition.title;
    text.textContent = definition.text;

    panel.classList.remove("is-hidden");
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideTokenDetail() {
    document
      .getElementById("tokenDetailPanel")
      ?.classList.add("is-hidden");
  }

  function updateInterpretButton() {
    const button = document.getElementById("interpretButton");

    if (!button) {
      return;
    }

    button.textContent = hasInterpreted
      ? window.EX_APP.i18n.t("marking.reinterpret")
      : window.EX_APP.i18n.t("marking.interpret");
  }

  // -------------------------------------------------------------------
  // OCR progress/status
  // -------------------------------------------------------------------

  function updateOcrProgress({ status, progress }) {
    const label = translateTesseractStatus(status);
    const percent =
      typeof progress === "number"
        ? ` ${Math.round(progress * 100)} %`
        : "";

    showOcrStatus(`${label}${percent}`);
  }

  function translateTesseractStatus(status) {
    const en = currentLanguage() === "en";

    const labels = {
      "loading tesseract core": en ? "Loading OCR engine…" : "Laster OCR-motor…",
      "initializing tesseract": en ? "Starting OCR…" : "Starter OCR…",
      "loading language traineddata": en ? "Loading text model…" : "Laster tekstmodell…",
      "initializing api": en ? "Preparing recognition…" : "Klargjør gjenkjenning…",
      "recognizing text": en ? "Reading text…" : "Leser tekst…",
    };

    return labels[status] || (en ? "Reading image…" : "Leser bildet…");
  }

  function setOcrBusy(isBusy) {
    const button = document.getElementById("runOcrButton");

    if (!button) {
      return;
    }

    button.disabled = isBusy;
    button.classList.toggle("is-loading", isBusy);
  }

  function showOcrStatus(message, isError = false) {
    const status = document.getElementById("ocrStatus");
    const text = document.getElementById("ocrStatusText");

    if (!status || !text) {
      return;
    }

    text.textContent = message;
    status.classList.remove("is-hidden");
    status.classList.toggle("ocr-status--error", isError);
  }

  function hideOcrStatus() {
    document
      .getElementById("ocrStatus")
      ?.classList.add("is-hidden");
  }

  function currentLanguage() {
    return window.EX_APP.i18n.getLanguage();
  }

  window.EX_APP.marking = {
    init,
  };
})();
