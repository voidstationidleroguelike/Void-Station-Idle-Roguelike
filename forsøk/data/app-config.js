window.EX_APP = window.EX_APP || {};

window.EX_APP.config = {
  appName: "EX Pocket Guide",

  supportedLanguages: ["no", "en"],
  defaultLanguage: "no",

  guide: {
    pageCount: 20,
    startPage: 1,

    /*
     * Files can be PNG, JPG, WEBP or SVG.
     * The loader tries .png first, then .svg as a placeholder fallback.
     */
    basePath: "assets/pocket-guide",
  },

  poster: {
    no: "assets/poster/poster-placeholder.svg",
    en: "assets/poster/poster-placeholder.svg",
  },

  branding: {
    logo: "assets/branding/trainor-apave-placeholder.svg",
  },

  externalLinks: {
    allCourses: "https://www.trainor.no/courses/",
  },

  storageKeys: {
    language: "exPocketGuide.language",
    guidePage: "exPocketGuide.guidePage",
  },
};
