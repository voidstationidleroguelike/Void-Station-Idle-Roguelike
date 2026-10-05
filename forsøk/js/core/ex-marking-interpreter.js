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
      .map((line) => line.trim())
      .filter(Boolean);

    const detected = detectSystems(lines);
    const requestedSystems = unique([...selectedSystems, ...detected]);
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
      const usedLines = new Set(sections.map((section) => section.fullLine));
      const leftovers = lines.filter((line) => !usedLines.has(line));

      leftovers.forEach((line) => {
        sections.push({
          system: "other",
          title: language === "en" ? "Other" : "Annet",
          fullLine: line,
          tokens: tokenizeGeneric(line),
        });
      });
    }

    /*
     * Critical: result.systems represents systems that were actually parsed,
     * not merely toggles the user selected. This prevents the summary from
     * claiming ATEX was found when no ATEX category line exists.
     */
    const parsedSystems = unique(
      sections.map((section) => section.system)
    );

    const metadata = mergeMetadata(
      Array.isArray(options.metadata) ? options.metadata : [],
      extractInlineMetadata(lines, language)
    );

    return {
      requestedSystems,
      detectedSystems: detected,
      systems: parsedSystems,
      sections,
      metadata,
      generalText: buildGeneralText(parsedSystems, language),
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
    return /\b(?:II|I)\s+(?:M[12]|[123])(?:\s*\(\s*[123Iil]\s*\))?\s*(?:G|D|GD)\b/i.test(line);
  }

  function tokenizeIecex(line) {
    let source = line
      .replace(/\bIP\s+(\d{2}[A-Z]?)\b/gi, "IP$1")
      .replace(/\[/g, " [ ")
      .replace(/\]/g, " ] ")
      .replace(/\s+/g, " ")
      .trim();

    const raw = source.split(" ").filter(Boolean);
    const tokens = [];

    for (let i = 0; i < raw.length; i += 1) {
      const current = raw[i];

      // User requested "Ex db" as one element.
      if (
        /^Ex$/i.test(current) &&
        /^(?:d|db|da|dc|e|eb|ec|i|ia|ib|ic|m|ma|mb|mc|p|q|h)$/i.test(raw[i + 1] || "")
      ) {
        tokens.push(makeToken(`Ex ${raw[i + 1]}`, "iecex"));
        i += 1;
        continue;
      }

      // Keep "op is", "op pr", "op sh" together.
      if (
        /^op$/i.test(current) &&
        /^(?:is|pr|sh)$/i.test(raw[i + 1] || "")
      ) {
        tokens.push(makeToken(`op ${raw[i + 1]}`, "iecex"));
        i += 1;
        continue;
      }

      tokens.push(makeToken(current, "iecex"));
    }

    return tokens;
  }

  function tokenizeAtex(line) {
    // The official Ex symbol is represented as a separate UI element even if
    // it isn't OCR text on the category line.
    const tokens = [makeToken("Ex", "atex", { officialSymbol: true })];

    String(line)
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .forEach((value) => tokens.push(makeToken(value, "atex")));

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
      .map((value) => makeToken(value, "other"));
  }

  function makeToken(value, system, extras = {}) {
    return {
      value,
      system,
      known: Boolean(resolveDefinition(system, value)),
      ...extras,
    };
  }

  function getDefinition(system, value, language = "no") {
    const definition = resolveDefinition(system, value);

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
        definition.short?.[language] ||
        definition.short?.no ||
        "",
      known: true,
    };
  }

  function resolveDefinition(system, value) {
    const library = window.EX_APP.exCodeLibrary || {};
    const lookup = normalizeLookup(value);

    if (/^IP\d{2}[A-Z]?$/i.test(value)) {
      return library.iecex?.IP || null;
    }

    return (
      library[system]?.[lookup] ||
      library.common?.[lookup] ||
      null
    );
  }

  function normalizeLookup(value) {
    /*
     * Do not silently normalize ambiguous OCR characters such as I/l/1.
     * The raw token stays visible until the user corrects it.
     */
    return value;
  }


  function extractInlineMetadata(lines, language) {
    const metadata = [];

    lines.forEach((line) => {
      const ce = line.match(/\bCE(?:\s*\d{2,4})?\b/i);

      if (ce) {
        metadata.push({
          key: "ce",
          label: language === "en" ? "CE marking" : "CE-merking",
          value: ce[0].replace(/\s+/g, " ").trim(),
        });
      }
    });

    return metadata;
  }

  function mergeMetadata(...groups) {
    const seen = new Set();
    const merged = [];

    groups.flat().forEach((item) => {
      if (!item?.key || !item?.value) return;

      const key = `${item.key}|${item.value}`.toLowerCase();

      if (seen.has(key)) return;

      seen.add(key);
      merged.push(item);
    });

    return merged;
  }

  function buildGeneralText(systems, language) {
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
