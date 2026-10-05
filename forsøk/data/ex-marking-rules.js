window.EX_APP = window.EX_APP || {};

/*
 * EX marking line-classification rules.
 *
 * IMPORTANT:
 * These rules classify the structure of a marking plate.
 * They are NOT a complete compliance/selection engine.
 *
 * Two independent dimensions are kept separate:
 *
 * 1. Atmosphere:
 *    - Gas / vapour / mist
 *    - Dust
 *
 * 2. Equipment / protection family:
 *    - Electrical Ex protection concepts
 *    - Non-electrical / mechanical ("Ex h" in current ISO 80079-36 marking)
 *
 * A plate can contain multiple lines and multiple dimensions at once.
 */
window.EX_APP.exMarkingRules = {
  atmosphere: {
    gas: {
      label: { no: "Gass", en: "Gas" },
      patterns: [
        /\b[123]\s*G\b/i,
        /\bG[abc]\b/,
        /\bII[ABC]\b/,
        /\bT[1-6]\b/i
      ]
    },
    dust: {
      label: { no: "Støv", en: "Dust" },
      patterns: [
        /\b[123]\s*D\b/i,
        /\bD[abc]\b/,
        /\bIII[ABC]\b/,
        /\bT\s*\d{2,3}\s*°?\s*C\b/i,
        /\bEx\s+tD\b/i,
        /\bEx\s+t[abc]?\b/i
      ]
    }
  },

  equipmentFamily: {
    mechanical: {
      label: {
        no: "Ikke-elektrisk / mekanisk",
        en: "Non-electrical / mechanical"
      },
      patterns: [
        /\bEx\s+h\b/i
      ]
    },

    electrical: {
      label: { no: "Elektrisk", en: "Electrical" },

      /*
       * Current and commonly encountered legacy electrical protection symbols.
       * The line parser only uses these to classify the line; detailed
       * interpretation belongs in an approved technical data set.
       */
      patterns: [
        /\bEx\s+(?:d|db|da|dc)\b/i,
        /\bEx\s+(?:e|eb|ec)\b/i,
        /\bEx\s+(?:ia|ib|ic|i)\b/i,
        /\bEx\s+(?:ma|mb|mc|m)\b/i,
        /\bEx\s+(?:pxb|pyb|pzc|p)\b/i,
        /\bEx\s+q\b/i,
        /\bEx\s+(?:op\s+is|op\s+pr|op\s+sh)\b/i,
        /\bEx\s+(?:ta|tb|tc|tD|t)\b/i,
        /\bEx\s+n[ACLR]?\b/i,

        // Multiple protection concepts can occur after one "Ex".
        /\bEx\b.*\b(?:db|eb|ia|ib|ic|mb|ma|mc|op\s+is|op\s+pr|op\s+sh|tb|tD)\b/i
      ]
    }
  },

  metadata: {
    atexCertificate: {
      label: { no: "ATEX-sertifikat", en: "ATEX certificate" },
      patterns: [/\bATEX\b/i]
    },

    iecexCertificate: {
      label: { no: "IECEx-sertifikat", en: "IECEx certificate" },
      patterns: [/\bIECEx\b/i]
    },

    ambientTemperature: {
      label: { no: "Omgivelsestemperatur", en: "Ambient temperature" },
      patterns: [
        /\bT(?:a|amb)\b/i,
        /-?\s*\d+\s*°?\s*C\s*[≤<].*[≤<]\s*\+?\s*\d+\s*°?\s*C/i
      ]
    },

    ingressProtection: {
      label: { no: "IP-grad", en: "IP rating" },
      patterns: [/\bIP\s*\d{2}[A-Z]?\b/i]
    },

    ceMarking: {
      label: { no: "CE / kontrollorgan", en: "CE / notified body" },
      patterns: [/\bCE\s*\d{0,4}\b/i]
    },

    productionYear: {
      label: { no: "Produksjonsår", en: "Production year" },
      patterns: [/\b(?:Prod\.?|Year)\s*[:.]?\s*20\d{2}\b/i]
    }
  }
};
