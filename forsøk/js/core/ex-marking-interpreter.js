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
        "g"
      ),
      (match, prefix, roman, suffix) =>
        `${prefix}III${suffix}`
    );

    text = text.replace(
      new RegExp(
        `(^|[^A-Za-z0-9])(${iLike}{2})([ABC])\\b`,
        "g"
      ),
      (match, prefix, roman, suffix) =>
        `${prefix}II${suffix}`
    );

    return text;
  }

  function normalizeAtexEquipmentGroup(value) {
    return String(value || "").replace(
      /(?:^|[^A-Za-z0-9])([Iil1|!]{2})\s*([123])(?:\s*\(\s*([123Iil|!])\s*\))?\s*(GD|G|D)\b/g,
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
          atmosphere,
        ]
          .filter(Boolean)
          .join(" ");
      }
    );
  }

  function normalizeKnownExConfusions(value) {
    return normalizeAtexEquipmentGroup(
      normalizeKnownRomanGroups(value)
    );
  }

  function tokenizeIecex(line) {
    let source = normalizeKnownExConfusions(line)
      .replace(
        /\bIP\s+(\d{2}[A-Z]?)\b/gi,
        "IP$1"
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

    if (/^IP\d{2}[A-Z]?$/i.test(value)) {
      return library.iecex?.IP || null;
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
