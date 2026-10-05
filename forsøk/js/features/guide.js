(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  const config = window.EX_APP.config;

  let page = loadSavedPage();
  let panZoom = null;

  function loadSavedPage() {
    const saved = Number(
      localStorage.getItem(config.storageKeys.guidePage)
    );

    if (
      Number.isInteger(saved) &&
      saved >= 1 &&
      saved <= config.guide.pageCount
    ) {
      return saved;
    }

    return config.guide.startPage;
  }

  function init() {
    const viewport = document.getElementById("guideViewport");
    const image = document.getElementById("guideImage");

    panZoom = window.EX_APP.panZoom.create({
      viewport,
      image,
      minScale: 1,
      maxScale: 5,
      allowSwipeAtMinScale: true,
      onSwipeLeft: next,
      onSwipeRight: previous,
      rotation: config.guide.rotationDegrees || 0,
    });

    document
      .getElementById("guidePrevious")
      ?.addEventListener("click", previous);

    document
      .getElementById("guideNext")
      ?.addEventListener("click", next);

    document
      .getElementById("guideResetZoom")
      ?.addEventListener("click", () => panZoom?.fit());

    window.addEventListener("exapp:languagechange", render);
    window.addEventListener("exapp:routechange", (event) => {
      if (event.detail.route === "guide") {
        render();
      }
    });

    renderDots();
    render();
  }

  function previous() {
    setPage(page - 1);
  }

  function next() {
    setPage(page + 1);
  }

  function setPage(nextPage) {
    const clamped = Math.max(
      1,
      Math.min(config.guide.pageCount, nextPage)
    );

    if (clamped === page) {
      return;
    }

    page = clamped;

    localStorage.setItem(
      config.storageKeys.guidePage,
      String(page)
    );

    render();
  }

  function render() {
    const language = window.EX_APP.i18n.getLanguage();
    const image = document.getElementById("guideImage");
    const errorPanel = document.getElementById("guideLoadError");

    if (!image) {
      return;
    }

    const number = String(page).padStart(2, "0");
    const extension = config.guide.preferredExtension || "webp";

    const configuredFolder =
      config.guide.languageFolders?.[language] ||
      language.toUpperCase();

    /*
     * Exact production path comes first:
     *   assets/pocket-guide/NO/page-01.webp
     *   assets/pocket-guide/EN/page-01.webp
     *
     * Lower-case fallback is kept temporarily so an older deployment does
     * not show a blank guide while assets are being moved.
     */
    const folders = Array.from(
      new Set([
        configuredFolder,
        String(configuredFolder).toLowerCase(),
      ])
    );

    const candidates = folders.flatMap((folder) => {
      const base =
        `${config.guide.basePath}/${folder}/page-${number}`;

      return [
        `${base}.${extension}`,
        `${base}.png`,
        `${base}.svg`,
      ];
    });

    let candidateIndex = 0;

    errorPanel?.classList.add("is-hidden");
    image.classList.remove("is-hidden");

    image.onload = () => {
      errorPanel?.classList.add("is-hidden");
      image.classList.remove("is-hidden");
      panZoom?.fit();
    };

    image.onerror = () => {
      candidateIndex += 1;

      if (candidateIndex < candidates.length) {
        image.src = candidates[candidateIndex];
        return;
      }

      image.onerror = null;
      image.classList.add("is-hidden");

      if (errorPanel) {
        errorPanel.classList.remove("is-hidden");

        const attempted = errorPanel.querySelector(
          "[data-guide-attempted-path]"
        );

        if (attempted) {
          attempted.textContent = candidates[0];
        }
      }
    };

    image.src = candidates[candidateIndex];

    document.getElementById("guidePageIndicator").textContent =
      `${page} / ${config.guide.pageCount}`;

    updateDots();
  }

  function renderDots() {
    const container = document.getElementById("guideDots");
    if (!container) return;

    container.innerHTML = "";

    for (let i = 1; i <= config.guide.pageCount; i += 1) {
      const dot = document.createElement("span");
      dot.className = "page-dot";
      dot.dataset.page = String(i);
      container.appendChild(dot);
    }

    updateDots();
  }

  function updateDots() {
    document.querySelectorAll(".page-dot").forEach((dot) => {
      dot.classList.toggle(
        "page-dot--active",
        Number(dot.dataset.page) === page
      );
    });
  }

  window.EX_APP.guide = {
    init,
    render,
    next,
    previous,
  };
})();
