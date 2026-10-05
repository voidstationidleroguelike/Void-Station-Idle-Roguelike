(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  let selectedFile = null;
  let selectedDataUrl = null;
  let selectedSystem = null;

  function init() {
    renderSystemSelector();
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

    hideOcrStatus();
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

    hideOcrStatus();
  }

  async function runOcr() {
    if (!selectedDataUrl) {
      return;
    }

    const button = document.getElementById("runOcrButton");

    try {
      setOcrBusy(true);
      showOcrStatus(
        currentLanguage() === "en"
          ? "Preparing OCR…"
          : "Klargjør tekstlesing…"
      );

      const text = await window.EX_APP.ocrService.recognizeImage(
        selectedDataUrl,
        updateOcrProgress
      );

      if (!text) {
        showOcrStatus(
          currentLanguage() === "en"
            ? "No readable text was found. Try a closer, sharper photo."
            : "Fant ingen lesbar tekst. Prøv et nærmere og skarpere bilde.",
          true
        );
        return;
      }

      const input = document.getElementById("markingInput");

      if (input) {
        input.value = text;
        input.focus();
      }

      showOcrStatus(
        currentLanguage() === "en"
          ? "Text found. Check it before interpreting."
          : "Tekst funnet. Kontroller teksten før du tolker merkingen."
      );

      /*
       * Do not auto-interpret immediately.
       * OCR can confuse visually similar characters in technical markings.
       * The user gets a verification/edit step first.
       */
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
      "loading tesseract core": en
        ? "Loading OCR engine…"
        : "Laster OCR-motor…",
      "initializing tesseract": en
        ? "Starting OCR…"
        : "Starter OCR…",
      "loading language traineddata": en
        ? "Loading text model…"
        : "Laster tekstmodell…",
      "initializing api": en
        ? "Preparing recognition…"
        : "Klargjør gjenkjenning…",
      "recognizing text": en
        ? "Reading text…"
        : "Leser tekst…",
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



  function renderSystemSelector() {
    const grid = document.getElementById("markingSystemGrid");
    const help = document.getElementById("markingSystemHelp");

    if (!grid) {
      return;
    }

    const language = currentLanguage();
    grid.innerHTML = "";

    window.EX_APP.markingSystems.forEach((system) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "marking-system-card";
      button.dataset.system = system.id;
      button.setAttribute("aria-pressed", selectedSystem === system.id ? "true" : "false");

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
        selectedSystem = system.id;
        renderSystemSelector();
      });

      grid.appendChild(button);
    });

    if (help) {
      help.textContent =
        window.EX_APP.i18n.t("marking.autoSystemHint");
    }
  }

  function interpretFromTextInput() {
    const text = document.getElementById("markingInput")?.value || "";

    if (!text.trim()) {
      return;
    }

    const language = currentLanguage();

    if (!selectedSystem) {
      window.alert(
        language === "en"
          ? "Choose ATEX, IECEx or Other before manual interpretation."
          : "Velg ATEX, IECEx eller Annet før manuell tolkning."
      );
      return;
    }

    const result = window.EX_APP.exMarkingParser.parse(
      text,
      language,
      { preferredSystem: selectedSystem }
    );

    renderStructuredResult(result, language);
  }

  function renderStructuredResult(result, language) {
    const summaryContainer = document.getElementById("markingSummary");
    const linesContainer = document.getElementById("markingLines");
    const panel = document.getElementById("markingResultPanel");

    if (!summaryContainer || !linesContainer || !panel) {
      return;
    }

    summaryContainer.innerHTML = "";
    linesContainer.innerHTML = "";

    const summaryItems = [
      ...result.summary.atmospheres,
      ...result.summary.families,
      ...result.summary.schemes,
    ];

    if (summaryItems.length) {
      const label = document.createElement("div");
      label.className = "marking-summary__label";
      label.textContent =
        language === "en"
          ? "Detected on the plate"
          : "Oppdaget på skiltet";

      const chips = document.createElement("div");
      chips.className = "marking-summary__chips";

      summaryItems.forEach((item) => {
        const chip = document.createElement("span");
        chip.className = "classification-chip";
        chip.textContent = item;
        chips.appendChild(chip);
      });

      summaryContainer.append(label, chips);
    }

    result.lines.forEach((line) => {
      const card = document.createElement("article");
      card.className = `marking-line marking-line--${line.kind}`;

      const heading = document.createElement("div");
      heading.className = "marking-line__heading";

      const lineNumber = document.createElement("span");
      lineNumber.className = "marking-line__number";
      lineNumber.textContent = `${line.index + 1}`;

      const raw = document.createElement("code");
      raw.className = "marking-line__raw";
      raw.textContent = line.text;

      heading.append(lineNumber, raw);
      card.appendChild(heading);

      if (line.tags.length) {
        const tags = document.createElement("div");
        tags.className = "marking-line__tags";

        line.tags.forEach((tag) => {
          const chip = document.createElement("span");
          chip.className = "classification-chip classification-chip--small";
          chip.textContent = tag;
          tags.appendChild(chip);
        });

        card.appendChild(tags);
      }

      if (line.exString) {
        card.appendChild(
          detailRow(
            language === "en" ? "EX marking" : "EX-merking",
            line.exString
          )
        );
      }

      line.metadata.forEach((item) => {
        const value =
          item.values?.length
            ? item.values.join(" · ")
            : line.text;

        card.appendChild(detailRow(item.label, value));
      });

      if (
        line.kind === "other" &&
        !line.tags.length &&
        !line.metadata.length
      ) {
        const note = document.createElement("p");
        note.className = "marking-line__note";
        note.textContent =
          language === "en"
            ? "Other plate information – kept for manual review."
            : "Annen skiltinformasjon – beholdes for manuell kontroll.";
        card.appendChild(note);
      }

      linesContainer.appendChild(card);
    });

    const warning = document.createElement("p");
    warning.className = "help-text marking-result-warning";
    warning.textContent = result.summary.note;
    linesContainer.appendChild(warning);

    panel.classList.remove("is-hidden");
  }

  function detailRow(label, value) {
    const row = document.createElement("div");
    row.className = "marking-detail";

    const key = document.createElement("span");
    key.className = "marking-detail__label";
    key.textContent = label;

    const content = document.createElement("span");
    content.className = "marking-detail__value";
    content.textContent = value;

    row.append(key, content);
    return row;
  }

  window.EX_APP.marking = {
    init,
  };
})();
