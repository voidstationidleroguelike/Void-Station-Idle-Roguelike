(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  function interpret(rawText, options = {}) {
    const language = options.language || "no";
    const selectedSystems = Array.isArray(options.systems)
      ? options.systems
      : [];

    /*
     * IMPORTANT:
     * Manual input and image/OCR input are intentionally different pipelines.
     *
     * manual:
     *   - preserve exactly what the user typed semantically
     *   - NEVER apply OCR character correction
     *   - (I) must remain (I), !b must remain !b, I1C must remain I1C
     *
     * ocr:
     *   - context-aware OCR cleanup may be used
     *   - only for text that actually came from image recognition
     */
    const inputMode =
      options.inputMode === "ocr" || options.manual === false
        ? "ocr"
        : "manual";

    const manual = inputMode === "manual";

    const lines = normalize(rawText)
      .split("\n")
      .map((line) =>
        manual
          ? normalizeManualSyntax(line)
          : normalizeKnownExConfusions(line.trim())
      )
      .filter(Boolean);

    const detected = detectSystems(lines);
    const requestedSystems = unique([
      ...selectedSystems,
      ...detected,
    ]);

    const sections = [];

    if (requestedSystems.includes("iecex")) {
      const iecexLines =
        manual && selectedSystems.includes("iecex")
          ? lines
          : findIecexLines(lines);

      iecexLines.forEach((exLine, index) => {
        sections.push({
          system: "iecex",
          title: "IECEx / Ex",
          lineIndex: index,
          fullLine: exLine,
          inputMode,
          tokens: tokenizeIecex(exLine, inputMode),
        });
      });
    }

    if (requestedSystems.includes("atex")) {
      const atexLines =
        manual && selectedSystems.includes("atex")
          ? lines
          : findAtexLines(lines);

      atexLines.forEach((atexLine, index) => {
        sections.push({
          system: "atex",
          title: "ATEX",
          lineIndex: index,
          fullLine: atexLine,
          inputMode,
          tokens: tokenizeAtex(atexLine, inputMode),
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
          inputMode,
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
      inputMode,
      requestedSystems,
      detectedSystems: detected,
      systems: parsedSystems,
      sections,
      metadata,
      generalText:
        manual && !sections.length
          ? (language === "en"
              ? "No known marking elements were found. Select the relevant marking system or enter more of the marking."
              : "Fant ingen kjente merkingselementer. Velg riktig merkesystem eller skriv inn mer av merkingen.")
          : buildGeneralText(parsedSystems, language),
    };
  }

  function normalizeManualSyntax(value) {
    /*
     * Safe formatting only. No OCR substitutions are allowed here.
     * Preserve I/1/l/|/! exactly as entered.
     */
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/\[\s*([^\]]*?)\s*\]/g, (match, inner) =>
        `[${String(inner).replace(/\s+/g, " ").trim()}]`
      )
      .replace(/\(\s*([^)]*?)\s*\)/g, (match, inner) =>
        `(${String(inner).replace(/\s+/g, " ").trim()})`
      )
      .replace(/\s+/g, " ")
      .trim();
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

  function normalizeKnownPlateSyntax(value) {
    let text = String(value || "")
      .replace(/¦/g, "|");

    text = normalizeCompactAtexPrefix(text);
    text = normalizeCompactExProtection(text);
    text = normalizeKnownRomanGroups(text);
    text = normalizeSingleGlyphGasGroup(text);
    text = normalizeIntrinsicSafetyTokens(text);

    return text
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeCompactAtexPrefix(value) {
    return String(value || "").replace(
      /(^|[^A-Za-z0-9])(?:(?:[Iil1|!]{2}|[WNHM])\s*)?([123])\s*(?:\(\s*([123Iil|!])\s*\))?\s*(GD|G|D)\s*E\s*[xX×]/gi,
      (match, prefix, category, associated, atmosphere) => {
        const associatedCategory = associated
          ? (/^[Iil|!]$/.test(associated) ? "1" : associated)
          : null;

        return (
          `${prefix}II ${category}` +
          (associatedCategory ? ` (${associatedCategory})` : "") +
          ` ${String(atmosphere).toUpperCase()} Ex`
        );
      }
    );
  }

  function normalizeCompactExProtection(value) {
    return String(value || "").replace(
      /\bEx([A-Za-z]{1,16})\b/g,
      (match, compact) => {
        const tokens = segmentProtectionSequence(compact);
        return tokens ? `Ex ${tokens.join(" ")}` : match;
      }
    );
  }

  function segmentProtectionSequence(value) {
    const source = String(value || "").toLowerCase();
    const parts = [
      ["opis", "op is"], ["oppr", "op pr"], ["opsh", "op sh"],
      ["db", "db"], ["da", "da"], ["dc", "dc"],
      ["eb", "eb"], ["ec", "ec"],
      ["ia", "ia"], ["ib", "ib"], ["ic", "ic"],
      ["ma", "ma"], ["mb", "mb"], ["mc", "mc"],
      ["px", "px"], ["py", "py"], ["pz", "pz"],
      ["na", "nA"], ["nc", "nC"], ["nr", "nR"],
      ["ta", "ta"], ["tb", "tb"], ["tc", "tc"], ["td", "tD"],
      ["d", "d"], ["e", "e"], ["i", "i"], ["m", "m"],
      ["p", "p"], ["q", "q"], ["o", "o"], ["h", "h"], ["s", "s"],
    ];

    const result = [];
    let rest = source;
    while (rest) {
      const hit = parts.find(([raw]) => rest.startsWith(raw));
      if (!hit) return null;
      result.push(...hit[1].split(" "));
      rest = rest.slice(hit[0].length);
    }
    return result.length ? result : null;
  }

  function normalizeSingleGlyphGasGroup(value) {
    const text = String(value || "");
    if (!/\bEx\b/i.test(text)) return text;

    return text.replace(
      /(^|[\s\]])([Iil1|!])\s*([ABC])(?=\s+(?:T[1-6]\b|[GD][abc]\b|IP\s*[0-9X]|T\d{2,3}\s*°?\s*C\b)|\s*$)/gi,
      (match, prefix, glyph, suffix) =>
        `${prefix}II${suffix.toUpperCase()}`
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
        `(^|[^A-Za-z0-9])${iLike}\\s*${iLike}\\s*${iLike}\\s*([ABC])\\b`,
        "gi"
      ),
      (match, prefix, suffix) =>
        `${prefix}III${suffix.toUpperCase()}`
    );

    text = text.replace(
      new RegExp(
        `(^|[^A-Za-z0-9])${iLike}\\s*${iLike}\\s*([ABC])\\b`,
        "gi"
      ),
      (match, prefix, suffix) =>
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
      /(^|[\s\[])([Iil1|!])\s*([abc])(?=$|[\s\]])/gi,
      (match, prefix, iLike, level) =>
        `${prefix}i${level.toLowerCase()}`
    );
  }

  function normalizeKnownExConfusions(value) {
    return normalizeAtexEquipmentGroup(
      normalizeKnownPlateSyntax(value)
    );
  }

  function prepareStructuredLine(line, inputMode) {
    return inputMode === "ocr"
      ? normalizeKnownExConfusions(line)
      : normalizeManualSyntax(line);
  }

  function tokenizeIecex(line, inputMode = "manual") {
    return tokenizeStructuredLine(
      prepareStructuredLine(line, inputMode),
      "iecex"
    );
  }

  function tokenizeAtex(line, inputMode = "manual") {
    const tokens = [
      makeToken(
        "Ex",
        "atex",
        { officialSymbol: true }
      ),
    ];

    tokenizeStructuredLine(
      prepareStructuredLine(line, inputMode),
      "atex"
    ).forEach((token) => tokens.push(token));

    return tokens;
  }

  function tokenizeStructuredLine(line, system) {
    let source = String(line || "")
      .replace(
        /\bIP\s*([0-6X])\s*([0-9X])([A-Z]{0,2})\b/gi,
        "IP$1$2$3"
      )
      // Keep square brackets as structure. Parentheses are NOT square brackets:
      // (2) is an ATEX associated-category token, while [ib] / [op is]
      // delimit an associated marking section.
      .replace(/\[\s*([^\]]*?)\s*\]/g, (match, inner) =>
        `[${String(inner).replace(/\s+/g, " ").trim()}]`
      )
      .replace(/\(\s*([123])\s*\)/g, "($1)")
      .replace(/\s+/g, " ")
      .trim();

    const raw =
      source.match(/\[[^\]]*\]|\([^)]*\)|[^\s]+/g) || [];

    const tokens = [];

    for (let i = 0; i < raw.length; i += 1) {
      const current = raw[i];

      // op is / op pr / op sh are multi-word Ex codes when they are not
      // already protected by square brackets.
      if (
        /^op$/i.test(current) &&
        /^(?:is|pr|sh)$/i.test(raw[i + 1] || "")
      ) {
        tokens.push(
          makeToken(
            `op ${String(raw[i + 1]).toLowerCase()}`,
            system
          )
        );
        i += 1;
        continue;
      }

      // In an ATEX section the textual "Ex" belongs to the common Ex core;
      // the separate officialSymbol token above represents the graphical
      // ATEX hexagon.
      const tokenSystem =
        system === "atex" && /^Ex$/i.test(current)
          ? "common"
          : system;

      tokens.push(makeToken(current, tokenSystem));
    }

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

    const bracketDefinition = resolveBracketDefinition(value);

    if (bracketDefinition) {
      return bracketDefinition;
    }

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
      // ATEX and IECEx share the IEC 60079 Ex-core codes.  When an ATEX
      // line contains d/e/mb/ib/IIC/T4/etc., use the same reviewed code
      // explanation instead of marking it unknown.
      (system === "atex"
        ? library.iecex?.[lookup]
        : null) ||
      library.common?.[lookup] ||
      null
    );
  }

  function resolveBracketDefinition(value) {
    const text = String(value || "").trim();

    if (!/^\[[^\]]*\]$/.test(text)) {
      return null;
    }

    const inner = text.slice(1, -1).trim();
    const innerParts = splitAssociatedInnerTokens(inner);

    const bracketNo =
      "Står i klammer: hele delen mellom [ og ] skal leses separat fra hovedutstyrets merking. Klammer brukes blant annet for tilknyttede / associated kretser. Gass eller støv bestemmes av kodene inne i klammen – ikke av klammen i seg selv.";

    const bracketEn =
      "Shown in brackets: the complete part between [ and ] must be read separately from the main equipment marking. Brackets are used, among other things, for associated circuits. Gas or dust is determined by the codes inside the brackets, not by the brackets themselves.";

    const explanationsNo = [];
    const explanationsEn = [];

    innerParts.forEach((part) => {
      const definition =
        resolveDefinition("iecex", part) ||
        resolveDefinition("common", part);

      if (!definition) {
        explanationsNo.push(`${part}: Ingen godkjent forklaring er lagt inn ennå.`);
        explanationsEn.push(`${part}: No approved explanation has been added yet.`);
        return;
      }

      const noText =
        definition.detailed?.no ||
        definition.short?.no ||
        "";
      const enText =
        definition.detailed?.en ||
        definition.short?.en ||
        definition.detailed?.no ||
        definition.short?.no ||
        "";

      explanationsNo.push(`${part}: ${noText}`);
      explanationsEn.push(`${part}: ${enText}`);
    });

    const singlePart = innerParts.length === 1;

    return {
      title: {
        no: singlePart
          ? `${text} – ${innerParts[0]} i klammer`
          : `${text} – tilknyttet del`,
        en: singlePart
          ? `${text} – ${innerParts[0]} in brackets`
          : `${text} – associated part`,
      },
      detailed: {
        no:
          (explanationsNo.length
            ? `${explanationsNo.join(" ")} `
            : "") +
          bracketNo,
        en:
          (explanationsEn.length
            ? `${explanationsEn.join(" ")} `
            : "") +
          bracketEn,
      },
    };
  }

  function splitAssociatedInnerTokens(value) {
    const raw = String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean);

    const result = [];

    for (let i = 0; i < raw.length; i += 1) {
      if (
        /^op$/i.test(raw[i]) &&
        /^(?:is|pr|sh)$/i.test(raw[i + 1] || "")
      ) {
        result.push(`op ${String(raw[i + 1]).toLowerCase()}`);
        i += 1;
        continue;
      }

      result.push(raw[i]);
    }

    return result;
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
