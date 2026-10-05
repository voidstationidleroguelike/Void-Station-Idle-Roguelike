(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  function generate(interpreted, language = "no") {
    const templates =
      window.EX_APP.generalTextTemplates?.[language] ||
      window.EX_APP.generalTextTemplates?.no;

    if (!templates) return "";

    // `systems` contains only successfully parsed sections, not UI toggles.
    const systems = interpreted?.systems || [];
    const sections = interpreted?.sections || [];
    const sentences = [];

    const hasAtex = systems.includes("atex");
    const hasIecex = systems.includes("iecex");

    if (hasAtex && hasIecex) {
      sentences.push(templates.bothSystems);
    } else if (hasAtex) {
      sentences.push(templates.atexOnly);
    } else if (hasIecex) {
      sentences.push(templates.iecexOnly);
    }

    const iecexSections = sections.filter(
      (section) => section.system === "iecex"
    );

    iecexSections.forEach((iecex, index) => {
      const grouped = groupIecexTokens(iecex.tokens || []);

      if (grouped.main.length) {
        sentences.push(
          fill(templates.mainEquipment, {
            main: grouped.main.join(" "),
          })
        );
      }

      if (grouped.associated.length) {
        sentences.push(
          fill(templates.associatedPart, {
            associated: `[${grouped.associated.join(" ")}]`,
          })
        );
      }

      const ip = grouped.other.find(
        (value) => /^IP\d{2}[A-Z]?$/i.test(value)
      );

      if (ip) {
        sentences.push(fill(templates.ip, { ip }));
      }

      if (grouped.unknown.length) {
        sentences.push(templates.unknown);
      }
    });

    const ceItems = (interpreted?.metadata || []).filter(
      (item) => item.key === "ce"
    );

    ceItems.forEach((item) => {
      if (templates.ce) {
        sentences.push(fill(templates.ce, { ce: item.value }));
      }
    });

    sentences.push(templates.verify);

    return sentences.filter(Boolean).join(" ");
  }

  function groupIecexTokens(tokens) {
    const main = [];
    const associated = [];
    const other = [];
    const unknown = [];

    let insideBracket = false;

    tokens.forEach((token) => {
      const value = token.value;

      if (value === "[") {
        insideBracket = true;
        return;
      }

      if (value === "]") {
        insideBracket = false;
        return;
      }

      if (!token.known) {
        unknown.push(value);
      }

      if (insideBracket) {
        associated.push(value);
        return;
      }

      if (/^IP\d{2}[A-Z]?$/i.test(value)) {
        other.push(value);
        return;
      }

      main.push(value);
    });

    return { main, associated, other, unknown };
  }

  function fill(template, values) {
    return Object.entries(values).reduce(
      (text, [key, value]) =>
        text.replaceAll(`{${key}}`, String(value)),
      template
    );
  }

  window.EX_APP.generalTextGenerator = {
    generate,
  };
})();
