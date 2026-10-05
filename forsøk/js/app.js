(function () {
  "use strict";

  const APP = window.EX_APP;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    APP.i18n.translateDocument();

    APP.pwaService?.init();

    bindGlobalNavigation();

    APP.guide.init();
    APP.marking.init();
    APP.poster.init();
    APP.courseFeature.init();

    APP.router.go("home");
  }

  function bindGlobalNavigation() {
    document
      .querySelectorAll("[data-route]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          APP.router.go(button.dataset.route);
        });
      });

    document
      .getElementById("backButton")
      ?.addEventListener("click", APP.router.back);

    document
      .getElementById("languageButton")
      ?.addEventListener("click", APP.i18n.toggleLanguage);

    window.addEventListener("exapp:languagechange", () => {
      APP.router.updateTopbar();
    });
  }
})();
