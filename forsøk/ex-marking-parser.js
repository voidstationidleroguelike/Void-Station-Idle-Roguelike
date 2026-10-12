(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  function parse(rawText, language = "no", options = {}) {
    const rules = window.EX_APP.exMarkingRules;

    const normalized = normalizeText(rawText);
    const lines = normalized
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const parsedLines = lines.map((text, index) =>
      classifyLine(text, index, rules, language)
    );

    const summary = buildSummary(parsedLines, language);

    if (options.preferredSystem) {
      summary.preferredSystem = options.preferredSystem;
    }

    return {
      rawText,
      normalized,
      lines: parsedLines,
      summary,
    };
  }

  function normalizeText(text) {
    return String(text || "")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/[ ]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function classifyLine(text, index, rules, language) {
    const tags = [];
    const atmosphere = detectGroup(text, rules.atmosphere, language);
    const equipmentFamily = detectGroup(
      text,
      rules.equipmentFamily,
      language
    );

    const metadata = [];

    Object.entries(rules.metadata).forEach(([key, rule]) => {
      if (matchesAny(text, rule.patterns)) {
        metadata.push({
          key,
          label: localize(rule.label, language),
          values: extractMetadataValues(key, text),
        });
      }
    });

    if (atmosphere.length) {
      tags.push(...atmosphere.map((item) => item.label));
    }

    if (equipmentFamily.length) {
      tags.push(...equipmentFamily.map((item) => item.label));
    }

    // ATEX category / group can be on the same line as Ex marking.
    const atexCategory = extractAtexCategory(text);

    if (atexCategory) {
      tags.push(
        language === "en"
          ? `ATEX ${atexCategory}`
          : `ATEX ${atexCategory}`
      );
    }

    const exString = extractExString(text);

    return {
      index,
      text,
      atmosphere,
      equipmentFamily,
      metadata,
      atexCategory,
      exString,
      tags: unique(tags),
      kind: determineKind({
        text,
        atmosphere,
        equipmentFamily,
        metadata,
        exString,
      }),
    };
  }

  function detectGroup(text, group, language) {
    return Object.entries(group)
      .filter(([, rule]) => matchesAny(text, rule.patterns))
      .map(([key, rule]) => ({
        key,
        label: localize(rule.label, language),
      }));
  }

  function determineKind({
    atmosphere,
    equipmentFamily,
    metadata,
    exString,
  }) {
    if (exString || atmosphere.length || equipmentFamily.length) {
      return "ex-marking";
    }

    if (metadata.length) {
      return "metadata";
    }

    return "other";
  }

  function extractAtexCategory(text) {
    /*
     * Examples handled:
     * II 2 G
     * II 2G
     * II 2 (1) G
     * II 2 (2) G
     * II 2 D
     * II 2GD
     *
     * Keep the original category structure rather than flattening brackets.
     */
    const match = text.match(
      /\b(II|I)\s+(M[12]|[123])(?:\s*\((?:[123])\))?\s*(?:G|D|GD)\b/i
    );

    return match ? match[0].replace(/\s+/g, " ").trim() : null;
  }

  function extractExString(text) {
    const exIndex = text.search(/\bEx\b/i);

    if (exIndex < 0) {
      return null;
    }

    /*
     * Preserve everything after Ex for review.
     * Certificate/metadata extraction is separate.
     */
    return text.slice(exIndex).trim();
  }

  function extractMetadataValues(key, text) {
    switch (key) {
      case "ingressProtection":
        return findAll(text, /\bIP\s*\d{2}[A-Z]?\b/gi);

      case "ambientTemperature":
        return findAll(
          text,
          /-?\s*\d+\s*°?\s*C\s*[≤<].*?[≤<]\s*\+?\s*\d+\s*°?\s*C/gi
        );

      case "atexCertificate":
        return [text];

      case "iecexCertificate":
        return [text];

      case "ceMarking":
        return findAll(text, /\bCE\s*\d{0,4}\b/gi);

      case "productionYear":
        return findAll(
          text,
          /\b(?:Prod\.?|Year)\s*[:.]?\s*20\d{2}\b/gi
        );

      default:
        return [];
    }
  }

  function buildSummary(lines, language) {
    const atmospheres = unique(
      lines.flatMap((line) =>
        line.atmosphere.map((item) => item.label)
      )
    );

    const families = unique(
      lines.flatMap((line) =>
        line.equipmentFamily.map((item) => item.label)
      )
    );

    const hasAtex = lines.some(
      (line) =>
        Boolean(line.atexCategory) ||
        line.metadata.some((item) => item.key === "atexCertificate")
    );

    const hasIecex = lines.some((line) =>
      line.metadata.some((item) => item.key === "iecexCertificate")
    );

    return {
      atmospheres,
      families,
      schemes: [
        ...(hasAtex ? ["ATEX"] : []),
        ...(hasIecex ? ["IECEx"] : []),
      ],
      lineCount: lines.length,
      note:
        language === "en"
          ? "Classification is structural only. Verify the marking and certificate before use."
          : "Klassifiseringen er kun strukturell. Kontroller merkingen og sertifikatet før bruk.",
    };
  }

  function matchesAny(text, patterns) {
    return patterns.some((pattern) => {
      pattern.lastIndex = 0;
      return pattern.test(text);
    });
  }

  function findAll(text, regex) {
    regex.lastIndex = 0;
    return Array.from(text.matchAll(regex), (match) => match[0]);
  }

  function localize(value, language) {
    return value?.[language] || value?.no || value?.en || "";
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  window.EX_APP.exMarkingParser = {
    parse,
  };
})();
