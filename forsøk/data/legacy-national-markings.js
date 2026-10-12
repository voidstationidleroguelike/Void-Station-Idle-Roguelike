(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  const categoryLabels = {
    explosion: { no: "Eksplosjonssikker", en: "Explosion protection" },
    increased: { no: "Tennsikker", en: "Increased / ignition-safe" },
    intrinsic: { no: "Egensikker", en: "Intrinsic safety" },
    oil: { no: "Oljefylt", en: "Oil filled" },
    sand: { no: "Sandfylt", en: "Sand / powder filled" },
    pressure: { no: "Overtrykk", en: "Pressurization" },
    special: { no: "Spesialutførelse", en: "Special construction" },
  };

  /*
   * Source: historical comparison table supplied by the user.
   *
   * Important:
   * - This is a recognition/reference table for older or national marking.
   * - It is NOT used to silently rewrite manual input.
   * - One marking may match more than one country/system. All matches are kept.
   * - Group/temperature fields are stored for reference, but are not used by
   *   the matcher as primary evidence because those codes overlap heavily
   *   with modern IEC/ATEX marking.
   */
  const systems = [
    {
      id: "cenelec",
      country: { no: "CENELEC", en: "CENELEC" },
      symbol: "EEx",
      symbolAliases: ["EEx"],
      entries: [
        entry("d", "explosion"),
        entry("e", "increased"),
        entry("i", "intrinsic"),
        entry("o", "oil"),
        entry("q", "sand"),
        entry("p", "pressure"),
        entry("s", "special"),
      ],
      groups: ["I", "IIA", "IIB", "IIC"],
      temperatureClass: "T1 - T6",
    },
    {
      id: "germany",
      country: { no: "Tyskland", en: "Germany" },
      symbol: "Ex",
      symbolAliases: ["Ex"],
      entries: [
        entry("d", "explosion"),
        entry("e", "increased"),
        entry("i", "intrinsic"),
        entry("o", "oil"),
        entry("(s)", "sand", ["s", "(s)"]),
        entry("f/p", "pressure", ["f", "p", "f/p"]),
        entry("s", "special"),
      ],
      groups: ["1", "2", "3n"],
      temperatureClass: "G1 - G5",
    },
    {
      id: "france",
      country: { no: "Frankrike", en: "France" },
      symbol: "(ADF)",
      symbolAliases: ["ADF", "(ADF)"],
      entries: [
        entry("ADF", "explosion"),
        entry("SA", "increased"),
        entry("SI", "intrinsic"),
        entry("RD", "sand"),
        entry("SP", "pressure"),
        entry("ATEX", "special"),
      ],
      groups: ["AI", "AII", "AIII", "AIV"],
      temperatureClass: "(200°C max.)",
    },
    {
      id: "italy-ad",
      country: { no: "Italia", en: "Italy" },
      systemVariant: "AD",
      symbol: "AD",
      symbolAliases: ["AD"],
      entries: [
        entry("PE", "explosion"),
        entry("FE", "increased"),
        entry("I", "intrinsic"),
        entry("s", "oil"),
        entry("S", "sand"),
        entry("SI", "pressure"),
        entry("S", "special"),
      ],
      groups: ["IIA", "IIB", "IIC"],
      temperatureClass: "T1 - T6",
    },
    {
      id: "italy-ex",
      country: { no: "Italia", en: "Italy" },
      systemVariant: "Ex",
      symbol: "Ex",
      symbolAliases: ["Ex"],
      entries: [
        entry("d", "explosion"),
        entry("e", "increased"),
        entry("i", "intrinsic"),
        entry("o", "oil"),
        entry("q", "sand"),
        entry("p", "pressure"),
      ],
      groups: ["IIA", "IIB", "IIC"],
      temperatureClass: "T1 - T6",
    },
    {
      id: "belgium",
      country: { no: "Belgia", en: "Belgium" },
      symbol: "Ex",
      symbolAliases: ["Ex"],
      entries: [
        entry("ADF", "explosion"),
        entry("E", "increased"),
        entry("(SA)", "increased", ["SA", "(SA)"]),
        entry("(I)", "intrinsic", ["I", "(I)"]),
        entry("(SI)", "pressure", ["SI", "(SI)"]),
      ],
      groups: ["I", "IIa", "IIb", "IIc"],
      temperatureClass: "G1 - G5",
    },
    {
      id: "netherlands",
      country: { no: "Holland", en: "Netherlands" },
      symbol: "Ex",
      symbolAliases: ["Ex"],
      entries: [
        entry("F", "explosion"),
        entry("E", "increased"),
        entry("I", "intrinsic"),
        entry("O", "oil"),
        entry("Q", "sand"),
        entry("P", "pressure"),
        entry("H", "special"),
      ],
      groups: ["IIA", "IIB", "IIC"],
      temperatureClass: "T1 - T6",
    },
    {
      id: "england",
      country: { no: "England", en: "England" },
      symbol: "Ex-symbol",
      symbolAliases: ["Ex"],
      entries: [
        entry("FLP", "explosion"),
        entry("e", "increased"),
        entry("IS", "intrinsic"),
        entry("p", "pressure"),
      ],
      groups: ["Gr I", "Gr II", "Gr III", "Gr IV"],
      temperatureClass: "(200°C max.)",
    },
    {
      id: "usa-nec500",
      country: { no: "U.S.A. (NEC 500)", en: "U.S.A. (NEC 500)" },
      symbol: "",
      symbolAliases: [],
      entries: [
        entry("Explosion proof", "explosion", ["Explosion proof"], true),
        entry("IS", "intrinsic"),
        entry("P", "pressure"),
      ],
      groups: ["CL2 / Gr F,E", "CL1 / Gr D", "CL1 / Gr C", "CL1 / Gr AB"],
      temperatureClass: "T1 - T6",
    },
    {
      id: "usa-nec505",
      country: { no: "USA (NEC 505)", en: "USA (NEC 505)" },
      symbol: "AEx",
      symbolAliases: ["AEx"],
      entries: [
        entry("d", "explosion"),
        entry("e", "increased"),
        entry("i", "intrinsic"),
        entry("o", "oil"),
        entry("q", "sand"),
        entry("p", "pressure"),
        entry("s", "special"),
      ],
      groups: ["I", "IIA", "IIB", "IIC"],
      temperatureClass: "T1 - T6",
    },
    {
      id: "canada",
      country: { no: "Canada", en: "Canada" },
      symbol: "",
      symbolAliases: [],
      entries: [
        entry("Explosion proof", "explosion", ["Explosion proof"], true),
        entry("IS", "intrinsic"),
      ],
      groups: ["CL2 / Gr F", "CL1 / Gr D", "CL1 / Gr C", "CL1 / Gr AB"],
      temperatureClass: "T1 - T6",
    },
  ];

  function entry(code, category, aliases = null, anchor = false) {
    return {
      code,
      aliases: aliases || [code],
      category,
      anchor,
    };
  }

  function normalize(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function containsAlias(text, alias) {
    const source = normalize(text);
    const target = normalize(alias);

    if (!target) return false;

    // Parenthesized aliases are treated literally.
    if (/^[([]/.test(target)) {
      return source.toLowerCase().includes(target.toLowerCase());
    }

    // Multi-word phrases, slash codes and ordinary tokens.
    const pattern = new RegExp(
      `(^|[^A-Za-z0-9])${escapeRegex(target)}(?=$|[^A-Za-z0-9])`,
      "i"
    );

    return pattern.test(source);
  }

  function hasAny(text, aliases) {
    return aliases.some((alias) => containsAlias(text, alias));
  }

  function match(rawText, language = "no") {
    const text = normalize(rawText);
    if (!text) return [];

    const matches = [];

    systems.forEach((system) => {
      const symbolMatched =
        system.symbolAliases.length > 0 &&
        hasAny(text, system.symbolAliases);

      const anchorMatched = system.entries.some(
        (item) => item.anchor && hasAny(text, item.aliases)
      );

      const matchedEntries = [];

      system.entries.forEach((item) => {
        const matchedAliases = item.aliases
          .map(normalize)
          .filter((alias) => containsAlias(text, alias));

        if (!matchedAliases.length) {
          return;
        }

        const longestMatchedAlias = matchedAliases.reduce(
          (longest, current) =>
            current.length > longest.length ? current : longest,
          ""
        );

        /*
         * Very short national codes (single letters) overlap heavily.
         * Require the historical system symbol to be present before using
         * them as evidence. Longer distinctive codes may match on their own.
         */
        const needsSymbol = longestMatchedAlias.length <= 1;

        if (needsSymbol && !symbolMatched) {
          return;
        }

        matchedEntries.push({
          code: item.code,
          category: item.category,
          categoryLabel:
            categoryLabels[item.category]?.[language] ||
            categoryLabels[item.category]?.no ||
            item.category,
        });
      });

      if (!matchedEntries.length && !anchorMatched) {
        return;
      }

      /*
       * Generic "Ex" is shared by several historical systems. Do not create
       * a country hit from "Ex" alone; at least one table code must match.
       */
      if (
        system.symbolAliases.some((item) => item.toLowerCase() === "ex") &&
        matchedEntries.length === 0
      ) {
        return;
      }

      matches.push({
        id: system.id,
        country:
          system.country?.[language] ||
          system.country?.no ||
          system.id,
        systemVariant: system.systemVariant || "",
        symbol: system.symbol,
        matchedEntries,
        groups: system.groups,
        temperatureClass: system.temperatureClass,
      });
    });

    return matches;
  }

  window.EX_APP.legacyNationalMarkings = {
    systems,
    match,
  };
})();
