window.EX_APP = window.EX_APP || {};

/*
 * EX code library
 * ---------------
 * This file is the reviewable content source for clickable marking elements.
 *
 * Keep technical wording here, not in the UI code.
 * Expand/adjust this library after technical review.
 */
window.EX_APP.exCodeLibrary = {
  common: {
    "Ex": {
      title: { no: "Ex", en: "Ex" },
      short: {
        no: "Eksplosjonsbeskyttet utstyr / Ex-merking.",
        en: "Explosion-protected equipment / Ex marking."
      }
    },

    "[": {
      title: { no: "[", en: "[" },
      short: {
        no: "Start på en avgrenset del av merkingen. Beholdes som eget element fordi innholdet i parentesen hører sammen.",
        en: "Start of a delimited part of the marking. Kept as a separate element because the content inside belongs together."
      }
    },

    "]": {
      title: { no: "]", en: "]" },
      short: {
        no: "Slutt på en avgrenset del av merkingen.",
        en: "End of a delimited part of the marking."
      }
    }
  },

  iecex: {
    "Ex db": {
      title: { no: "Ex db", en: "Ex db" },
      short: {
        no: "Flammesikker kapsling, beskyttelsesnivå «db».",
        en: "Flameproof enclosure, protection level “db”."
      }
    },

    "ia": {
      title: { no: "ia", en: "ia" },
      short: {
        no: "Egensikker beskyttelse, nivå «ia».",
        en: "Intrinsic safety, level “ia”."
      }
    },

    "ib": {
      title: { no: "ib", en: "ib" },
      short: {
        no: "Egensikker beskyttelse, nivå «ib».",
        en: "Intrinsic safety, level “ib”."
      }
    },

    "ic": {
      title: { no: "ic", en: "ic" },
      short: {
        no: "Egensikker beskyttelse, nivå «ic».",
        en: "Intrinsic safety, level “ic”."
      }
    },

    "IIC": {
      title: { no: "IIC", en: "IIC" },
      short: {
        no: "Gassgruppe IIC.",
        en: "Gas group IIC."
      }
    },

    "IIB": {
      title: { no: "IIB", en: "IIB" },
      short: {
        no: "Gassgruppe IIB.",
        en: "Gas group IIB."
      }
    },

    "IIA": {
      title: { no: "IIA", en: "IIA" },
      short: {
        no: "Gassgruppe IIA.",
        en: "Gas group IIA."
      }
    },

    "Ga": {
      title: { no: "Ga", en: "Ga" },
      short: {
        no: "EPL for gassatmosfære, nivå Ga.",
        en: "EPL for gas atmosphere, level Ga."
      }
    },

    "Gb": {
      title: { no: "Gb", en: "Gb" },
      short: {
        no: "EPL for gassatmosfære, nivå Gb.",
        en: "EPL for gas atmosphere, level Gb."
      }
    },

    "Gc": {
      title: { no: "Gc", en: "Gc" },
      short: {
        no: "EPL for gassatmosfære, nivå Gc.",
        en: "EPL for gas atmosphere, level Gc."
      }
    },

    "Da": {
      title: { no: "Da", en: "Da" },
      short: {
        no: "EPL for støvatmosfære, nivå Da.",
        en: "EPL for dust atmosphere, level Da."
      }
    },

    "Db": {
      title: { no: "Db", en: "Db" },
      short: {
        no: "EPL for støvatmosfære, nivå Db.",
        en: "EPL for dust atmosphere, level Db."
      }
    },

    "Dc": {
      title: { no: "Dc", en: "Dc" },
      short: {
        no: "EPL for støvatmosfære, nivå Dc.",
        en: "EPL for dust atmosphere, level Dc."
      }
    },

    "T1": { title: { no: "T1", en: "T1" }, short: { no: "Temperaturklasse T1.", en: "Temperature class T1." } },
    "T2": { title: { no: "T2", en: "T2" }, short: { no: "Temperaturklasse T2.", en: "Temperature class T2." } },
    "T3": { title: { no: "T3", en: "T3" }, short: { no: "Temperaturklasse T3.", en: "Temperature class T3." } },
    "T4": { title: { no: "T4", en: "T4" }, short: { no: "Temperaturklasse T4.", en: "Temperature class T4." } },
    "T5": { title: { no: "T5", en: "T5" }, short: { no: "Temperaturklasse T5.", en: "Temperature class T5." } },
    "T6": { title: { no: "T6", en: "T6" }, short: { no: "Temperaturklasse T6.", en: "Temperature class T6." } },

    "IP": {
      title: { no: "IP-grad", en: "IP rating" },
      short: {
        no: "Kapslingsgrad. Hele IP-koden vises som ett element.",
        en: "Ingress protection rating. The full IP code is shown as one element."
      }
    }
  },

  atex: {
    "Ex": {
      title: { no: "Ex-symbol", en: "Ex symbol" },
      short: {
        no: "ATEX Ex-symbol / eksplosjonsvernmerking.",
        en: "ATEX Ex symbol / explosion-protection marking."
      }
    },

    "II": {
      title: { no: "Utstyrsgruppe II", en: "Equipment group II" },
      short: {
        no: "ATEX utstyrsgruppe II.",
        en: "ATEX equipment group II."
      }
    },

    "1": {
      title: { no: "Kategori 1", en: "Category 1" },
      short: { no: "ATEX utstyrskategori 1.", en: "ATEX equipment category 1." }
    },

    "2": {
      title: { no: "Kategori 2", en: "Category 2" },
      short: { no: "ATEX utstyrskategori 2.", en: "ATEX equipment category 2." }
    },

    "3": {
      title: { no: "Kategori 3", en: "Category 3" },
      short: { no: "ATEX utstyrskategori 3.", en: "ATEX equipment category 3." }
    },

    "(1)": {
      title: { no: "(1)", en: "(1)" },
      short: {
        no: "Kategoriangivelse i parentes. Beholdes som egen del av ATEX-merkingen.",
        en: "Parenthesised category designation. Kept as a separate part of the ATEX marking."
      }
    },

    "(2)": {
      title: { no: "(2)", en: "(2)" },
      short: {
        no: "Kategoriangivelse i parentes. Beholdes som egen del av ATEX-merkingen.",
        en: "Parenthesised category designation. Kept as a separate part of the ATEX marking."
      }
    },

    "G": {
      title: { no: "G – gass", en: "G – gas" },
      short: {
        no: "ATEX-angivelse for gassatmosfære.",
        en: "ATEX designation for gas atmosphere."
      }
    },

    "D": {
      title: { no: "D – støv", en: "D – dust" },
      short: {
        no: "ATEX-angivelse for støvatmosfære.",
        en: "ATEX designation for dust atmosphere."
      }
    }
  }
};
