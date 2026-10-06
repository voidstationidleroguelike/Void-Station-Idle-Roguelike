(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  function interpret(rawText, options = {}) {
    const language = options.language || "no";
    const selectedSystems = Array.isArray(options.systems)
      ? options.systems
      : [];

    const lines = normalize(rawText)
      .split("\n")
      .map((line) =>
        normalizeKnownExConfusions(line.trim())
      )
      .filter(Boolean);

    const detected = detectSystems(lines);
    const requestedSystems = unique([
      ...selectedSystems,
      ...detected,
    ]);

    const sections = [];

    if (requestedSystems.includes("iecex")) {
      findIecexLines(lines).forEach((exLine, index) => {
        sections.push({
          system: "iecex",
          title: "IECEx",
          lineIndex: index,
          fullLine: exLine,
          tokens: tokenizeIecex(exLine),
        });
      });
    }

    if (requestedSystems.includes("atex")) {
      findAtexLines(lines).forEach((atexLine, index) => {
        sections.push({
          system: "atex",
          title: "ATEX",
          lineIndex: index,
          fullLine: atexLine,
          tokens: tokenizeAtex(atexLine),
        });
      });
    }

    if (requestedSystems.includes("other")) {
      const usedLines = new Set(
        sections.map((section) => section.fullLine)
      );

      const leftovers = lines.filter(
        (line) => !usedLines.has(line)
      );

      leftovers.forEach((line) => {
        sections.push({
          system: "other",
          title:
            language === "en"
              ? "Other"
              : "Annet",
          fullLine: line,
          tokens: tokenizeGeneric(line),
        });
      });
    }

    const parsedSystems = unique(
      sections.map((section) => section.system)
    );

    const metadata = mergeMetadata(
      Array.isArray(options.metadata)
        ? options.metadata
        : [],
      extractInlineMetadata(lines, language)
    );

    return {
      requestedSystems,
      detectedSystems: detected,
      systems: parsedSystems,
      sections,
      metadata,
      generalText:
        buildGeneralText(parsedSystems, language),
    };
  }

  function detectSystems(lines) {
    const systems = [];

    if (lines.some((line) => /^Ex\b/i.test(line))) {
      systems.push("iecex");
    }

    if (lines.some(isAtexCategory)) {
      systems.push("atex");
    }

    return systems;
  }

  function findIecexLines(lines) {
    return lines.filter((line) => /^Ex\b/i.test(line));
  }

  function findAtexLines(lines) {
    return lines.filter(isAtexCategory);
  }

  function isAtexCategory(line) {
    return /^II\s+[123](?:\s*\([123]\))?\s*(?:GD|G|D)\b/.test(
      String(line || "")
    );
  }

  // ---------------------------------------------------------------
  // Same context-aware normalization used for manual entry.
  // ---------------------------------------------------------------

  function normalizeKnownRomanGroups(value) {
    let text = String(value || "");
    const iLike = "[Iil1|!]";

    text = text.replace(
      new RegExp(
        `(^|[^A-Za-z0-9])(${iLike}{3})([ABC])\\b`,
        "gi"
      ),
      (match, prefix, roman, suffix) =>
        `${prefix}III${suffix.toUpperCase()}`
    );

    text = text.replace(
      new RegExp(
        `(^|[^A-Za-z0-9])(${iLike}{2})([ABC])\\b`,
        "gi"
      ),
      (match, prefix, roman, suffix) =>
        `${prefix}II${suffix.toUpperCase()}`
    );

    return text;
  }

  function normalizeAtexEquipmentGroup(value) {
    return String(value || "").replace(
      /(?:^|[^A-Za-z0-9])([Iil1|!]{2})\s*([123])(?:\s*\(\s*([123Iil|!])\s*\))?\s*(GD|G|D)\b/gi,
      (
        match,
        group,
        category,
        associated,
        atmosphere
      ) => {
        const associatedCategory = associated
          ? (/^[Iil|!]$/.test(associated)
              ? "1"
              : associated)
          : null;

        return [
          "II",
          category,
          associatedCategory
            ? `(${associatedCategory})`
            : null,
          String(atmosphere).toUpperCase(),
        ]
          .filter(Boolean)
          .join(" ");
      }
    );
  }

  function normalizeIntrinsicSafetyTokens(value) {
    let text = String(value || "");

    const hasExContext = /\bE\s*[xX×](?=\s|$)|\bEx\b/i.test(text);
    const hasAssociatedContext = /\[[^\]]*/.test(text);

    if (!hasExContext && !hasAssociatedContext) {
      return text;
    }

    text = text.replace(/\bE\s*[xX×](?=\s|$)/g, "Ex");

    return text.replace(
      /(^|[\s\[])([Iil1|!])([abc])(?=$|[\s\]])/gi,
      (match, prefix, iLike, level) =>
        `${prefix}i${level.toLowerCase()}`
    );
  }

  function normalizeKnownExConfusions(value) {
    return normalizeIntrinsicSafetyTokens(
      normalizeAtexEquipmentGroup(
        normalizeKnownRomanGroups(value)
      )
    );
  }

  function tokenizeIecex(line) {
    let source = normalizeKnownExConfusions(line)
      .replace(
        /\bIP\s*([0-6X])\s*([0-9X])([A-Z]{0,2})\b/gi,
        "IP$1$2$3"
      )
      .replace(/\[/g, " [ ")
      .replace(/\]/g, " ] ")
      .replace(/\s+/g, " ")
      .trim();

    const raw = source.split(" ").filter(Boolean);
    const tokens = [];

    for (let i = 0; i < raw.length; i += 1) {
      const current = raw[i];

      if (
        /^Ex$/i.test(current) &&
        /^(?:d|db|da|dc|e|eb|ec|i|ia|ib|ic|m|ma|mb|mc|p|q|h|ta|tb|tc|tD)$/i.test(
          raw[i + 1] || ""
        )
      ) {
        tokens.push(
          makeToken(
            `Ex ${raw[i + 1]}`,
            "iecex"
          )
        );
        i += 1;
        continue;
      }

      if (
        /^op$/i.test(current) &&
        /^(?:is|pr|sh)$/i.test(
          raw[i + 1] || ""
        )
      ) {
        tokens.push(
          makeToken(
            `op ${raw[i + 1]}`,
            "iecex"
          )
        );
        i += 1;
        continue;
      }

      tokens.push(
        makeToken(current, "iecex")
      );
    }

    return tokens;
  }

  function tokenizeAtex(line) {
    const tokens = [
      makeToken(
        "Ex",
        "atex",
        { officialSymbol: true }
      ),
    ];

    normalizeKnownExConfusions(line)
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .forEach((value) =>
        tokens.push(
          makeToken(value, "atex")
        )
      );

    return tokens;
  }

  function tokenizeGeneric(line) {
    return String(line)
      .replace(/\[/g, " [ ")
      .replace(/\]/g, " ] ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((value) =>
        makeToken(value, "other")
      );
  }

  function makeToken(value, system, extras = {}) {
    return {
      value,
      system,
      known:
        Boolean(
          resolveDefinition(system, value)
        ),
      ...extras,
    };
  }

  function getDefinition(
    system,
    value,
    language = "no"
  ) {
    const definition =
      resolveDefinition(system, value);

    if (!definition) {
      return {
        title: value,
        text:
          language === "en"
            ? "No approved explanation has been added for this element yet."
            : "Det er ikke lagt inn en godkjent forklaring for dette elementet ennå.",
        known: false,
      };
    }

    return {
      title:
        definition.title?.[language] ||
        definition.title?.no ||
        value,
      text:
        definition.detailed?.[language] ||
        definition.detailed?.no ||
        definition.short?.[language] ||
        definition.short?.no ||
        "",
      known: true,
    };
  }

  function resolveDefinition(system, value) {
    const library =
      window.EX_APP.exCodeLibrary || {};

    const lookup = normalizeLookup(value);

    const ipDefinition = resolveIpDefinition(value);

    if (ipDefinition) {
      return ipDefinition;
    }

    const dustTemperature = String(value).match(
      /^T\s*(\d{2,3})\s*°?C$/i
    );

    if (dustTemperature) {
      const degrees = dustTemperature[1];
      return {
        title: {
          no: `${value} – maksimal overflatetemperatur`,
          en: `${value} – maximum surface temperature`,
        },
        detailed: {
          no: `På støvmerking kan maksimal overflatetemperatur oppgis direkte i °C. ${value} angir her en maksimal overflatetemperatur på ${degrees} °C.`,
          en: `For dust marking, the maximum surface temperature may be stated directly in °C. ${value} here indicates a maximum surface temperature of ${degrees} °C.`,
        },
      };
    }

    const temperatureRange = String(value).match(
      /^(T[1-6])\.{2,3}(T[1-6])$/i
    );

    if (temperatureRange) {
      return {
        title: {
          no: `${value} – temperaturklasseområde`,
          en: `${value} – temperature-class range`,
        },
        detailed: {
          no: `Et område som ${value} betyr at temperaturklassen varierer med de angitte drifts- eller omgivelsesbetingelsene. Kontroller skiltets temperaturdata og sertifikatet for hvilken klasse som gjelder i den aktuelle situasjonen.`,
          en: `A range such as ${value} means that the temperature class varies with the stated operating or ambient conditions. Check the plate temperature data and certificate to determine which class applies in the actual situation.`,
        },
      };
    }

    return (
      library[system]?.[lookup] ||
      library.common?.[lookup] ||
      null
    );
  }

  function resolveIpDefinition(value) {
    const match = String(value || "")
      .toUpperCase()
      .match(/^IP([0-6X])([0-9X])([A-Z]{0,2})$/);

    if (!match) {
      return null;
    }

    const code = match[0];
    const solid = match[1];
    const water = match[2];
    const suffix = match[3] || "";

    const solidNo = {
      "0": "Ingen angitt beskyttelse mot berøring eller faste fremmedlegemer.",
      "1": "Beskyttet mot faste fremmedlegemer på 50 mm eller større og mot tilgang med håndbak.",
      "2": "Beskyttet mot faste fremmedlegemer på 12,5 mm eller større og mot tilgang med finger.",
      "3": "Beskyttet mot faste fremmedlegemer på 2,5 mm eller større og mot tilgang med verktøy.",
      "4": "Beskyttet mot faste fremmedlegemer på 1,0 mm eller større og mot tilgang med tråd.",
      "5": "Støvbeskyttet og beskyttet mot tilgang med tråd. Støv kan trenge inn i begrenset mengde, men ikke slik at normal drift eller sikkerhet påvirkes.",
      "6": "Støvtett og beskyttet mot tilgang med tråd. Ingen støvinntrengning under den angitte prøvingen.",
      "X": "Beskyttelse mot faste fremmedlegemer er ikke spesifisert med et tall i denne IP-koden.",
    };

    const solidEn = {
      "0": "No specified protection against access or solid foreign objects.",
      "1": "Protected against solid objects 50 mm or larger and access with the back of a hand.",
      "2": "Protected against solid objects 12.5 mm or larger and access with a finger.",
      "3": "Protected against solid objects 2.5 mm or larger and access with a tool.",
      "4": "Protected against solid objects 1.0 mm or larger and access with a wire.",
      "5": "Dust-protected and protected against access with a wire. Limited dust ingress is permitted, but not enough to interfere with normal operation or safety.",
      "6": "Dust-tight and protected against access with a wire. No dust ingress under the specified test.",
      "X": "Protection against solid foreign objects is not specified by a digit in this IP code.",
    };

    const waterNo = {
      "0": "Ingen angitt beskyttelse mot vann.",
      "1": "Beskyttet mot vertikalt dryppende vann.",
      "2": "Beskyttet mot dryppende vann når kapslingen er tiltet opptil 15°.",
      "3": "Beskyttet mot vannsprut fra vinkler opptil 60° fra vertikalen.",
      "4": "Beskyttet mot vannsprut fra alle retninger.",
      "5": "Beskyttet mot vannstråler fra alle retninger.",
      "6": "Beskyttet mot kraftige vannstråler.",
      "7": "Beskyttet ved midlertidig nedsenking i vann under de angitte prøvebetingelsene.",
      "8": "Beskyttet ved kontinuerlig nedsenking under betingelser angitt for produktet og strengere enn nivå 7.",
      "9": "Beskyttet mot høytrykks- og høytemperatur-vannstråler under den angitte prøvingen.",
      "X": "Vannbeskyttelse er ikke spesifisert med et tall i denne IP-koden.",
    };

    const waterEn = {
      "0": "No specified protection against water.",
      "1": "Protected against vertically falling water drops.",
      "2": "Protected against dripping water when the enclosure is tilted up to 15°.",
      "3": "Protected against spraying water up to 60° from vertical.",
      "4": "Protected against splashing water from all directions.",
      "5": "Protected against water jets from all directions.",
      "6": "Protected against powerful water jets.",
      "7": "Protected against temporary immersion in water under the specified test conditions.",
      "8": "Protected against continuous immersion under conditions specified for the product and more severe than level 7.",
      "9": "Protected against high-pressure, high-temperature water jets under the specified test.",
      "X": "Water protection is not specified by a digit in this IP code.",
    };

    const suffixNo = explainIpSuffix(suffix, "no");
    const suffixEn = explainIpSuffix(suffix, "en");

    return {
      title: {
        no: `${code} – kapslingsgrad`,
        en: `${code} – IP rating`,
      },
      detailed: {
        no:
          `Første tegn etter IP (${solid}): ${solidNo[solid]} ` +
          `Andre tegn (${water}): ${waterNo[water]}` +
          (suffixNo ? ` ${suffixNo}` : ""),
        en:
          `First character after IP (${solid}): ${solidEn[solid]} ` +
          `Second character (${water}): ${waterEn[water]}` +
          (suffixEn ? ` ${suffixEn}` : ""),
      },
    };
  }

  function explainIpSuffix(suffix, language) {
    if (!suffix) {
      return "";
    }

    const no = {
      A: "Tilleggsbokstav A angir beskyttelse mot tilgang med håndbak.",
      B: "Tilleggsbokstav B angir beskyttelse mot tilgang med finger.",
      C: "Tilleggsbokstav C angir beskyttelse mot tilgang med verktøy.",
      D: "Tilleggsbokstav D angir beskyttelse mot tilgang med tråd.",
      H: "Tilleggsbokstav H angir høyspenningsutstyr.",
      M: "Tilleggsbokstav M angir at bevegelige deler var i bevegelse under vannprøvingen.",
      S: "Tilleggsbokstav S angir at bevegelige deler stod stille under vannprøvingen.",
      W: "Tilleggsbokstav W angir særskilte værforhold / værbeskyttelse etter den anvendte standarden.",
      K: "K brukes blant annet i IP69K. Kontroller hvilken standard produktet er merket etter; K-varianten brukes for høytrykks-/høytemperaturspyling i relevante produktstandarder.",
    };

    const en = {
      A: "Additional letter A indicates protection against access with the back of a hand.",
      B: "Additional letter B indicates protection against access with a finger.",
      C: "Additional letter C indicates protection against access with a tool.",
      D: "Additional letter D indicates protection against access with a wire.",
      H: "Supplementary letter H indicates high-voltage apparatus.",
      M: "Supplementary letter M indicates that moving parts were moving during the water test.",
      S: "Supplementary letter S indicates that moving parts were stationary during the water test.",
      W: "Supplementary letter W indicates specified weather conditions / weather protection under the applicable standard.",
      K: "K is used, among other places, in IP69K. Check the standard stated for the product; the K variant is used for high-pressure/high-temperature wash-down tests in relevant product standards.",
    };

    const table = language === "en" ? en : no;

    return suffix
      .split("")
      .map((letter) => table[letter] || "")
      .filter(Boolean)
      .join(" ");
  }

  function normalizeLookup(value) {
    return value;
  }

  function extractInlineMetadata(
    lines,
    language
  ) {
    const metadata = [];

    lines.forEach((line) => {
      const ce = line.match(
        /\bCE(?:\s*\d{2,4})?\b/i
      );

      if (ce) {
        metadata.push({
          key: "ce",
          label:
            language === "en"
              ? "CE marking"
              : "CE-merking",
          value:
            ce[0]
              .replace(/\s+/g, " ")
              .trim(),
        });
      }
    });

    return metadata;
  }

  function mergeMetadata(...groups) {
    const seen = new Set();
    const merged = [];

    groups.flat().forEach((item) => {
      if (!item?.key || !item?.value) {
        return;
      }

      const key =
        `${item.key}|${item.value}`.toLowerCase();

      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      merged.push(item);
    });

    return merged;
  }

  function buildGeneralText(
    systems,
    language
  ) {
    const atex = systems.includes("atex");
    const iecex = systems.includes("iecex");

    if (atex && iecex) {
      return language === "en"
        ? "The plate contains both ATEX and IECEx marking. The two systems can appear on the same product and are shown separately below. Tap an individual element for an explanation."
        : "Skiltet inneholder både ATEX- og IECEx-merking. Begge systemene kan stå på samme produkt og vises separat under. Trykk på et enkeltelement for forklaring.";
    }

    if (atex) {
      return language === "en"
        ? "ATEX marking is shown below. Tap an individual element for an explanation."
        : "ATEX-merkingen vises under. Trykk på et enkeltelement for forklaring.";
    }

    if (iecex) {
      return language === "en"
        ? "IECEx / IEC-based Ex marking is shown below. Tap an individual element for an explanation."
        : "IECEx / IEC-basert Ex-merking vises under. Trykk på et enkeltelement for forklaring.";
    }

    return language === "en"
      ? "Choose one or more marking systems and check the entered marking before interpreting."
      : "Velg ett eller flere merkesystemer og kontroller merkingen før du tolker.";
  }

  function normalize(text) {
    return String(text || "")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  window.EX_APP.exMarkingInterpreter = {
    interpret,
    getDefinition,
  };
})();
