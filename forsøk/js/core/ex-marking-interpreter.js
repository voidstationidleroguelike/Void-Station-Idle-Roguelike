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
    const systems = unique([...selectedSystems, ...detected]);
    const sections = [];

    if (systems.includes("iecex")) {
      const exLine = findIecexLine(lines);

      if (exLine) {
        sections.push({
          system: "iecex",
          title: "IECEx",
          fullLine: exLine,
          tokens: tokenizeIecex(exLine),
        });
      }
    }

    if (systems.includes("atex")) {
      const atexLine = findAtexLine(lines);

      if (atexLine) {
        sections.push({
          system: "atex",
          title: "ATEX",
          fullLine: atexLine,
          tokens: tokenizeAtex(atexLine),
        });
      }
    }

    if (systems.includes("other")) {
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

    return {
      systems,
      sections,
      generalText: buildGeneralText(systems, language),
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

  function findIecexLine(lines) {
    return lines.find((line) => /^Ex\b/i.test(line)) || null;
  }

  function findAtexLine(lines) {
    return lines.find(isAtexCategory) || null;
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
    if (/^\(\s*[Iil]\s*\)$/.test(value)) {
      return "(1)";
    }

    return value;
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
