(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  let selectedFile = null;
  let selectedDataUrl = null;
  let hasInterpreted = false;
  let lastExtractedMetadata = [];

  function init() {
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
      if (hasInterpreted) {
        interpretFromTextInput({ silent: true });
      }
    });
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
    renderReadText("");
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
    renderReadText("");
  }

  // -------------------------------------------------------------------
  // Image text -> established marking candidate(s)
  // -------------------------------------------------------------------

  async function runOcr() {
    if (!selectedDataUrl) {
      return;
    }

    try {
      setOcrBusy(true);

      showOcrStatus(
        currentLanguage() === "en"
          ? "Preparing image…"
          : "Klargjør bilde for tekstlesing…"
      );

      const rawText = await window.EX_APP.ocrService.recognizeImage(
        selectedDataUrl,
        updateOcrProgress
      );

      renderReadText(rawText || "");

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
        const rawPanel = document.getElementById("ocrRawPanel");
        if (rawPanel) rawPanel.open = true;

        showOcrStatus(
          currentLanguage() === "en"
            ? "Text was found, but no established EX marking line could be isolated. The raw text is shown below."
            : "Fant tekst, men klarte ikke å skille ut en etablert EX-merkelinje. Råteksten vises under.",
          true
        );
        return;
      }

      const input = document.getElementById("markingInput");

      if (input) {
        input.value = extracted.markingText;
        input.focus();
      }

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
            ? "Text reading failed."
            : "Tekstlesingen feilet."),
        true
      );
    } finally {
      setOcrBusy(false);
    }
  }

  function renderReadText(rawText) {
    const panel = document.getElementById("ocrRawPanel");
    const output = document.getElementById("ocrRawText");

    if (!panel || !output) {
      return;
    }

    output.textContent = rawText || "";
    panel.classList.toggle("is-hidden", !rawText);

    /*
     * Keep it collapsed by default after a successful read. It remains easy
     * to open when a plate is not parsed as expected.
     */
    if (rawText) {
      panel.open = false;
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

    const result = window.EX_APP.exMarkingInterpreter.interpret(
      text,
      {
        language,
        metadata: lastExtractedMetadata,
        // This button always interprets the editable text literally.
        // OCR corrections happen only in the image extractor BEFORE text
        // reaches this field. Never apply OCR substitutions here.
        inputMode: "manual",
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

    renderLegacyNationalMatches(
      result.legacyMatches || [],
      sections,
      result.sections.length > 0
    );

    renderResultMetadata(result.metadata || [], sections);

    panel.classList.remove("is-hidden");
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }


  function renderLegacyNationalMatches(items, container, collapse = false) {
    if (!items?.length || !container) {
      return;
    }

    const language = currentLanguage();

    const card = document.createElement("details");
    card.className =
      "interpretation-section interpretation-section--legacy legacy-marking";

    // When modern ATEX / Ex interpretation exists, legacy information is
    // deliberately secondary and collapsed by default.
    card.open = !collapse;

    const summary = document.createElement("summary");
    summary.className = "legacy-marking__summary";

    const title = document.createElement("strong");
    title.textContent =
      language === "en"
        ? "Possible older / national marking"
        : "Mulig eldre / nasjonal merking";

    const count = document.createElement("span");
    count.className = "legacy-marking__count";
    count.textContent = `(${items.length})`;

    summary.append(title, count);
    card.appendChild(summary);

    const note = document.createElement("p");
    note.className = "legacy-marking__note";
    note.textContent =
      language === "en"
        ? "Secondary reference only. Modern ATEX and IEC/IECEx-based marking is prioritized. The same old code may occur in several national systems."
        : "Kun sekundær referanse. Moderne ATEX og IEC/IECEx-basert merking prioriteres. Samme eldre kode kan forekomme i flere nasjonale systemer.";
    card.appendChild(note);

    items.forEach((item) => {
      const block = document.createElement("div");
      block.className = "legacy-marking__system";

      const country = document.createElement("strong");
      country.className = "legacy-marking__country";
      country.textContent =
        item.systemVariant
          ? `${item.country} · ${item.systemVariant}`
          : item.country;

      block.appendChild(country);

      if (item.symbol) {
        const symbol = document.createElement("span");
        symbol.className = "legacy-marking__symbol";
        symbol.textContent = `Symbol: ${item.symbol}`;
        block.appendChild(symbol);
      }

      const list = document.createElement("div");
      list.className = "legacy-marking__matches";

      item.matchedEntries.forEach((match) => {
        const row = document.createElement("div");
        row.className = "legacy-marking__match";

        const code = document.createElement("code");
        code.textContent = match.code;

        const meaning = document.createElement("span");
        meaning.textContent = match.categoryLabel;

        row.append(code, meaning);
        list.appendChild(row);
      });

      block.appendChild(list);
      card.appendChild(block);
    });

    container.appendChild(card);
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
      "loading tesseract core": en ? "Loading text engine…" : "Laster tekstmotor…",
      "initializing tesseract": en ? "Starting text reading…" : "Starter tekstlesing…",
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
