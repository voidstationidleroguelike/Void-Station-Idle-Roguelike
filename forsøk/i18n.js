(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  const config = window.EX_APP.config;
  const translations = window.EX_APP.translations;

  let language = loadInitialLanguage();

  function loadInitialLanguage() {
    const saved = localStorage.getItem(config.storageKeys.language);

    if (config.supportedLanguages.includes(saved)) {
      return saved;
    }

    return config.defaultLanguage;
  }

  function getLanguage() {
    return language;
  }

  function setLanguage(nextLanguage) {
    if (!config.supportedLanguages.includes(nextLanguage)) {
      return;
    }

    language = nextLanguage;
    localStorage.setItem(config.storageKeys.language, language);
    document.documentElement.lang = language;

    translateDocument();

    window.dispatchEvent(
      new CustomEvent("exapp:languagechange", {
        detail: { language },
      })
    );
  }

  function toggleLanguage() {
    const index = config.supportedLanguages.indexOf(language);
    const nextIndex = (index + 1) % config.supportedLanguages.length;
    setLanguage(config.supportedLanguages[nextIndex]);
  }

  function t(key) {
    return (
      translations[language]?.[key] ??
      translations[config.defaultLanguage]?.[key] ??
      key
    );
  }

  function translateDocument() {
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      element.textContent = t(key);
    });

    const languageButton = document.getElementById("languageButton");
    if (languageButton) {
      languageButton.textContent = language.toUpperCase();
    }
  }

  window.EX_APP.i18n = {
    getLanguage,
    setLanguage,
    toggleLanguage,
    t,
    translateDocument,
  };
})();
