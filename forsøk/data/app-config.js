window.EX_APP = window.EX_APP || {};

window.EX_APP.config = {
  appName: "EX Pocket Guide",

  supportedLanguages: ["no", "en"],
  defaultLanguage: "no",

  guide: {
    pageCount: 20,
    startPage: 1,

    /*
     * Production content assets are WebP.
     * Development fallback remains PNG/SVG so the prototype still opens
     * before the final exported pages are copied into the project.
     */
    basePath: "assets/pocket-guide",
    preferredExtension: "webp",
  },

  poster: {
    no: {
      primary: "assets/poster/poster-no.webp",
      fallback: "assets/poster/poster-no.svg",
    },
    en: {
      primary: "assets/poster/poster-en.webp",
      fallback: "assets/poster/poster-en.svg",
    },
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
