window.EX_APP = window.EX_APP || {};

window.EX_APP.contentMeta = {
  contentVersion: "0.1.0-draft",
  status: "draft",
  supportedLanguages: ["no", "en"],

  review: {
    reviewedBy: null,
    reviewDate: null,
    note: {
      no: "Faglig innhold er foreløpig utkast og må kvalitetssikres før produksjonsbruk.",
      en: "Technical content is currently draft and must be quality-assured before production use."
    }
  },

  standards: [
    {
      id: "atex",
      label: "ATEX",
      editionOrDirective: null,
      sourceReference: null
    },
    {
      id: "iecex",
      label: "IECEx / IEC 60079",
      editionOrDirective: null,
      sourceReference: null
    },
    {
      id: "legacy",
      label: "Legacy / country-specific",
      editionOrDirective: null,
      sourceReference: null
    }
  ]
};
