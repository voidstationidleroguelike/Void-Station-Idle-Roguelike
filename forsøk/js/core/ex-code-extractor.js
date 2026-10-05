(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  /*
   * OCR will always "see" more than the marking itself.
   * This module extracts complete marking candidates and keeps metadata apart.
   *
   * It does NOT silently invent missing codes.
   */

  function extract(rawText, language = "no") {
    const normalized = normalizeOcr(rawText);
    const lines = normalized.split("\n").map(cleanLine).filter(Boolean);
    const flat = lines.join(" ");

    const markingLines = [];
    const metadata = [];

    // First prefer intact OCR lines.
    lines.forEach((line) => {
      const ex = extractIecexFromLine(line);
      if (ex) markingLines.push(ex);

      const atex = extractAtexFromLine(line);
      if (atex) markingLines.push(atex);

      const meta = extractMetadata(line, language);
      if (meta) metadata.push(...meta);
    });

    // OCR often breaks one physical line into several fragments.
    // Fall back to the flattened OCR result.
    if (!markingLines.some((line) => /^Ex\b/i.test(line))) {
      const ex = extractIecexFromLine(flat);
      if (ex) markingLines.push(ex);
    }

    if (!markingLines.some((line) => isAtexCategory(line))) {
      const atex = extractAtexFromLine(flat);
      if (atex) markingLines.push(atex);
    }

    const uniqueLines = unique(markingLines)
      .filter((line) => line && line.length >= 3);

    const cleanMetadata = dedupeMetadata(metadata);
    const systems = detectSystems(uniqueLines, cleanMetadata);
    const warnings = buildWarnings(uniqueLines, cleanMetadata, language);

    return {
      markingText: uniqueLines.join("\n"),
      markingLines: uniqueLines,
      systems,
      metadata: cleanMetadata,
      warnings,
      rawText: normalized,
    };
  }

  function extractIecexFromLine(input) {
    let line = String(input || "");

    // Common OCR joining: "Exdb" -> "Ex db"
    line = line.replace(/\bEx(?=(?:db|da|dc|eb|ec|ia|ib|ic|ma|mb|mc|h)\b)/gi, "Ex ");

    const exStart = line.search(/\bEx\s+(?:d|db|da|dc|e|eb|ec|i|ia|ib|ic|m|ma|mb|mc|p|q|op|t|h)\b/i);

    if (exStart < 0) {
      return null;
    }

    let candidate = line.slice(exStart);

    // Stop before certificate/CE/manufacturer-like content.
    candidate = candidate.split(/\b(?:IECEx|ATEX|CE\s*\d{2,4}|Prod\.?|P\s*nr\.?)\b/i)[0];

    // Keep IP when it follows the EX marking.
    candidate = candidate
      .replace(/\bIP\s+(\d{2}[A-Z]?)\b/gi, "IP$1")
      .replace(/\s*[—–-]\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    /*
     * Keep the entire extracted marking line.
     * Do not stop at the first valid terminal-looking code because bracketed
     * associated-apparatus marking can contain its own group/EPL before the
     * main marking continues, e.g.:
     *   Ex db [ia IIC Ga] IIB T4 Gb IP55
     */
    candidate = candidate
      .replace(/\s*[—–-]+\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    candidate = normalizeBracketSpacing(candidate);

    return candidate;
  }

  function extractAtexFromLine(input) {
    const line = String(input || "");

    /*
     * The graphical ATEX Ex symbol is not text and is therefore NOT part of
     * OCR matching. We only isolate the textual ATEX category line here.
     *
     * Preserve the characters OCR actually returned. We deliberately accept
     * I/l/1 inside the parenthesised part as a candidate, but we do not change
     * one into another. The user must verify/correct the extracted line.
     */
    const match = line.match(
      /\b(?:II|I)\s+(?:M[12]|[123])(?:\s*\(\s*[123Iil]\s*\))?\s*(?:G|D|GD)\b/i
    );

    if (!match) {
      return null;
    }

    return match[0]
      .replace(/\s+/g, " ")
      .replace(/\(\s*/g, "(")
      .replace(/\s*\)/g, ")")
      .trim();
  }

  function extractMetadata(line, language) {
    const items = [];

    const iecex = line.match(/\bIECEx\s+[A-Z0-9.-]+(?:\s+[A-Z0-9.-]+)+/i);
    if (iecex) {
      items.push({
        key: "iecexCertificate",
        label: language === "en" ? "IECEx certificate" : "IECEx-sertifikat",
        value: iecex[0].trim(),
      });
    }

    const atex = line.match(/\b[A-Z0-9.-]+(?:\s+[A-Z0-9.-]+)*\s+ATEX\s+[A-Z0-9.-]+(?:\s+[A-Z])?/i);
    if (atex) {
      items.push({
        key: "atexCertificate",
        label: language === "en" ? "ATEX certificate" : "ATEX-sertifikat",
        value: atex[0].trim(),
      });
    }

    const ce = line.match(/\bCE(?:\s*\d{2,4})?\b/i);
    if (ce) {
      items.push({
        key: "ce",
        label: language === "en" ? "CE marking" : "CE-merking",
        value: ce[0].replace(/\s+/g, " ").trim(),
      });
    }

    const ambient = line.match(/-?\d+\s*°?\s*C\s*[≤<].*?[≤<]\s*\+?\d+\s*°?\s*C/i);
    if (ambient) {
      items.push({
        key: "ambient",
        label: language === "en" ? "Ambient temperature" : "Omgivelsestemperatur",
        value: ambient[0].replace(/\s+/g, " ").trim(),
      });
    }

    return items;
  }

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
    return /\b(?:II|I)\s+(?:M[12]|[123])(?:\s*\(\s*[123Iil]\s*\))?\s*(?:G|D|GD)\b/i.test(line);
  }

  function buildWarnings(markingLines, metadata, language) {
    const warnings = [];
    const hasAtexEvidence = metadata.some(
      (item) => item.key === "atexCertificate"
    );
    const hasAtexCategory = markingLines.some(isAtexCategory);

    if (hasAtexEvidence && !hasAtexCategory) {
      warnings.push({
        key: "atexCategoryNotRead",
        text:
          language === "en"
            ? "ATEX evidence was found, but the ATEX category line was not read reliably. The graphical Ex symbol is not OCR text. Check the plate and enter the ATEX category line manually."
            : "ATEX ble funnet på skiltet, men ATEX-kategorilinjen ble ikke lest sikkert. Det grafiske Ex-symbolet er ikke OCR-tekst. Kontroller skiltet og skriv inn ATEX-kategorilinjen manuelt."
      });
    }

    return warnings;
  }

  function normalizeOcr(text) {
    return String(text || "")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function cleanLine(line) {
    return String(line || "")
      .replace(/[|¦]/g, " ")
      .replace(/^[^A-Za-z0-9\[]+/, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeBracketSpacing(value) {
    return String(value)
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
      const key = `${item.key}|${item.value}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  window.EX_APP.exCodeExtractor = {
    extract,
  };
})();
