(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  let panZoom = null;

  function init() {
    const viewport = document.getElementById("posterViewport");
    const image = document.getElementById("posterImage");

    panZoom = window.EX_APP.panZoom.create({
      viewport,
      image,
      minScale: 1,
      maxScale: 6,
    });

    document
      .getElementById("posterReset")
      ?.addEventListener("click", () => panZoom?.fit());

    window.addEventListener("exapp:languagechange", render);
    window.addEventListener("exapp:routechange", (event) => {
      if (event.detail.route === "poster") {
        render();
      }
    });

    render();
  }

  function render() {
    const language = window.EX_APP.i18n.getLanguage();
    const image = document.getElementById("posterImage");
    const path = window.EX_APP.config.poster[language];

    if (image && path) {
      image.onerror = null;
      image.src = path;
    }

    panZoom?.fit();
  }

  window.EX_APP.poster = {
    init,
    render,
  };
})();
