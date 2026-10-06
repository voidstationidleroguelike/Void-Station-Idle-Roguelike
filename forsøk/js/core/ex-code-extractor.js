(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  /*
   * Read the image once, then parse the returned text in three passes:
   * 1) IECEx / Ex marking
   * 2) ATEX category marking
   * 3) Other relevant plate information
   *
   * We deliberately do not stop after the first recognized marking.
   */

  function extract(rawText, language = "no") {
    const normalized = normalizeImageText(rawText);

    const lines = normalized
      .split("\n")
      .map(cleanLine)
      .filter(Boolean);

    const flat = lines.join(" ");

    const iecexLines = extractIecexPass(lines, flat);
    const atexLines = extractAtexPass(lines, flat);
    const metadata = extractOtherPass(lines, language);

    const markingLines = unique([
      ...iecexLines,
      ...atexLines,
    ]).filter((line) => line && line.length >= 3);

    const systems = detectSystems(markingLines, metadata);
    const warnings = buildWarnings(markingLines, metadata, language);

    return {
      markingText: markingLines.join("\n"),
      markingLines,
      systems,
      metadata,
      warnings,
      passes: {
        iecex: iecexLines,
        atex: atexLines,
        other: metadata,
      },
      rawText: normalized,
    };
  }

  // ---------------------------------------------------------------
  // PASS 1 — IECEx / Ex marking
  // ---------------------------------------------------------------

  function extractIecexPass(lines, flat) {
    const found = [];

    /*
     * Image recognition may collapse several physical plate rows into ONE
     * long text line. Scan for ALL Ex-marking starts, not just the first.
     */
    lines.forEach((line) => {
      found.push(...extractAllIecexFromText(line));
    });

    /*
     * Also scan the flattened full-plate text. This recovers markings when
     * recognition inserts a line break in the middle of one physical line.
     * unique() removes duplicates.
     */
    found.push(...extractAllIecexFromText(flat));

    return unique(found);
  }

  function extractAllIecexFromText(input) {
    let text = normalizeKnownExConfusions(String(input || ""));

    // Common visual/text-reading variants: "E x", "E×", "EX" -> "Ex".
    text = text.replace(/\bE\s*[xX×](?=\s|$)/g, "Ex");

    // Common joined forms: Exdb -> Ex db, Extb -> Ex tb.
    text = text.replace(
      /\bEx(?=(?:db|da|dc|eb|ec|ia|ib|ic|ma|mb|mc|ta|tb|tc|h)\b)/gi,
      "Ex "
    );

    const exStartPattern =
      /\bEx\s+(?:d|db|da|dc|e|eb|ec|i|ia|ib|ic|m|ma|mb|mc|p|q|op|ta|tb|tc|tD|h)\b/gi;

    const exStarts = [...text.matchAll(exStartPattern)].map(
      (match) => match.index
    );

    if (!exStarts.length) {
      return [];
    }

    /*
     * One Ex marking ends when the next structural plate item starts:
     * another Ex line, another ATEX category, or metadata.
     */
    const stopAnchors = [
      ...findAtexAnchorPositions(text),
      ...findMetadataAnchorPositions(text),
      ...exStarts,
    ].sort((a, b) => a - b);

    const results = [];

    exStarts.forEach((start) => {
      const nextStop = stopAnchors.find(
        (position) => position > start
      );

      const end =
        typeof nextStop === "number"
          ? nextStop
          : text.length;

      let candidate = text.slice(start, end);

      candidate = candidate
        .replace(/\bIP\s*([0-6X])\s*([0-9X])([A-Z]{0,2})\b/gi, "IP$1$2$3")
        .replace(/\s*[—–-]+\s*$/g, "")
        .replace(/\s+/g, " ")
        .trim();

      candidate = normalizeBracketSpacing(candidate);

      if (candidate) {
        results.push(candidate);
      }
    });

    return unique(results);
  }

  function findAtexAnchorPositions(text) {
    const positions = [];

    const pattern =
      /(^|[^A-Za-z0-9])([Iil1|!]{2})\s*([123])(?:\s*\(\s*([123Iil|!])\s*\))?\s*(GD|G|D)\b/gi;

    for (const match of String(text || "").matchAll(pattern)) {
      positions.push(
        match.index + (match[1]?.length || 0)
      );
    }

    return positions;
  }

  function findMetadataAnchorPositions(text) {
    const positions = [];

    const pattern =
      /\b(?:IECEx|ATEX|CE(?:\s*\d{0,4})?|Prod\.?|P\s*nr\.?)\b/gi;

    for (const match of String(text || "").matchAll(pattern)) {
      positions.push(match.index);
    }

    return positions;
  }

  // ---------------------------------------------------------------
  // PASS 2 — ATEX category marking
  // ---------------------------------------------------------------

  function extractAtexPass(lines, flat) {
    const found = [];

    // Collect every ATEX category occurrence, not only the first.
    lines.forEach((line) => {
      found.push(...extractAllAtexFromText(line));
    });

    found.push(...extractAllAtexFromText(flat));

    return unique(found);
  }

  function extractAllAtexFromText(input) {
    const text = String(input || "");
    const results = [];

    const pattern =
      /(^|[^A-Za-z0-9])([Iil1|!]{2})\s*([123])(?:\s*\(\s*([123Iil|!])\s*\))?\s*(GD|G|D)\b/gi;

    for (const match of text.matchAll(pattern)) {
      const category = match[3];

      const associatedCategory = match[4]
        ? normalizeAtexCategoryDigit(match[4])
        : null;

      const atmosphere = match[5].toUpperCase();

      results.push(
        [
          "II",
          category,
          associatedCategory
            ? `(${associatedCategory})`
            : null,
          atmosphere,
        ]
          .filter(Boolean)
          .join(" ")
      );
    }

    return unique(results);
  }

  function normalizeAtexCategoryDigit(value) {
    const glyph = String(value || "");

    if (/^[Iil|!]$/.test(glyph)) {
      return "1";
    }

    return glyph;
  }

  // ---------------------------------------------------------------
  // PASS 3 — Other relevant plate information
  // ---------------------------------------------------------------

  function extractOtherPass(lines, language) {
    const metadata = [];

    lines.forEach((line) => {
      metadata.push(...extractMetadata(line, language));
    });

    return dedupeMetadata(metadata);
  }

  function extractMetadata(line, language) {
    const items = [];

    const iecex = line.match(
      /\bIECEx\s+[A-Z0-9.-]{2,12}\s+[0-9]{2}\.[0-9A-Z.-]+(?:[XU])?\b/i
    );

    if (iecex) {
      items.push({
        key: "iecexCertificate",
        label:
          language === "en"
            ? "IECEx certificate"
            : "IECEx-sertifikat",
        value: iecex[0].trim(),
      });
    }

    const atex = line.match(
      /\b[A-ZÄÖÜ0-9.-]{2,12}\s+[0-9A-Z.-]{1,12}\s+ATEX\s+[0-9A-Z.-]+(?:\s+[XU])?\b/i
    );

    if (atex) {
      items.push({
        key: "atexCertificate",
        label:
          language === "en"
            ? "ATEX certificate"
            : "ATEX-sertifikat",
        value: atex[0].trim(),
      });
    }

    const ce = line.match(/\bCE(?:\s*\d{2,4})?\b/i);

    if (ce) {
      items.push({
        key: "ce",
        label:
          language === "en"
            ? "CE marking"
            : "CE-merking",
        value: ce[0].replace(/\s+/g, " ").trim(),
      });
    }

    const ambient = line.match(
      /-?\d+\s*°?\s*C\s*[≤<].*?[≤<]\s*\+?\d+\s*°?\s*C/i
    );

    if (ambient) {
      items.push({
        key: "ambient",
        label:
          language === "en"
            ? "Ambient temperature"
            : "Omgivelsestemperatur",
        value: ambient[0].replace(/\s+/g, " ").trim(),
      });
    }

    return items;
  }

  // ---------------------------------------------------------------
  // Context-aware I / i / l / 1 / | / ! normalization
  // ---------------------------------------------------------------

  function normalizeKnownRomanGroups(value) {
    let text = String(value || "");
    const iLike = "[Iil1|!]";

    // Dust groups: IIIA / IIIB / IIIC.
    text = text.replace(
      new RegExp(
        `(^|[^A-Za-z0-9])(${iLike}{3})([ABC])\\b`,
        "gi"
      ),
      (match, prefix, roman, suffix) =>
        `${prefix}III${suffix.toUpperCase()}`
    );

    // Gas groups: IIA / IIB / IIC.
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

  function normalizeIntrinsicSafetyTokens(value) {
    let text = String(value || "");

    /*
     * The first letter in ia / ib / ic is especially easy to confuse with
     * I, l, 1, | or !. Only normalize these one-letter variants when the
     * same text already contains an Ex context or an associated [ ... ] part.
     * This avoids global replacements elsewhere on a nameplate.
     */
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
      normalizeKnownRomanGroups(value)
    );
  }

  // ---------------------------------------------------------------
  // Classification / warnings
  // ---------------------------------------------------------------

  function detectSystems(markingLines, metadata) {
    const systems = [];

    if (
      markingLines.some((line) => /^Ex\b/i.test(line)) ||
      metadata.some((item) => item.key === "iecexCertificate")
    ) {
      systems.push("iecex");
    }

    if (
      markingLines.some(isAtexCategory) ||
      metadata.some((item) => item.key === "atexCertificate")
    ) {
      systems.push("atex");
    }

    return systems;
  }

  function isAtexCategory(line) {
    return /^II\s+[123](?:\s*\([123]\))?\s*(?:GD|G|D)\b/.test(
      String(line || "")
    );
  }

  function buildWarnings(markingLines, metadata, language) {
    const warnings = [];

    const hasAtexEvidence = metadata.some(
      (item) => item.key === "atexCertificate"
    );

    const hasAtexCategory =
      markingLines.some(isAtexCategory);

    if (hasAtexEvidence && !hasAtexCategory) {
      warnings.push({
        key: "atexCategoryNotRead",
        text:
          language === "en"
            ? "ATEX was found on the plate, but the ATEX category line was not read reliably. Check the plate and enter the ATEX category line manually."
            : "ATEX ble funnet på skiltet, men ATEX-kategorilinjen ble ikke lest sikkert. Kontroller skiltet og skriv inn ATEX-kategorilinjen manuelt.",
      });
    }

    return warnings;
  }

  // ---------------------------------------------------------------
  // Generic helpers
  // ---------------------------------------------------------------

  function normalizeImageText(text) {
    return String(text || "")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function cleanLine(line) {
    return String(line || "")
      .replace(/¦/g, "|")
      .replace(/^[^A-Za-z0-9\[|!]+/, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeBracketSpacing(value) {
    return String(value || "")
      .replace(/\[\s*/g, "[")
      .replace(/\s*\]/g, "]")
      .replace(/([A-Za-z0-9])\[/g, "$1 [")
      .replace(/\]([A-Za-z0-9])/g, "] $1")
      .replace(/\s+/g, " ")
      .trim();
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function dedupeMetadata(items) {
    const seen = new Set();

    return items.filter((item) => {
      const key =
        `${item.key}|${item.value}`.toLowerCase();

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
  }

  window.EX_APP.exCodeExtractor = {
    extract,
  };
})();
