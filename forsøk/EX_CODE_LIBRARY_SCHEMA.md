# EX code library schema

All user-facing technical content must support both Norwegian and English.

Recommended entry shape:

```js
{
  code: "IIC",
  systems: ["iecex"],
  type: "gasGroup",
  atmosphere: ["gas"],
  current: true,
  legacy: false,

  title: {
    no: "Gassgruppe IIC",
    en: "Gas group IIC"
  },

  short: {
    no: "Kort norsk forklaring.",
    en: "Short English explanation."
  },

  detailed: {
    no: "Lengre norsk forklaring.",
    en: "Longer English explanation."
  },

  source: {
    reference: null,
    edition: null,
    reviewed: false
  }
}
```

## Required principles

- Every user-facing technical string must have `no` and `en`.
- Do not silently fall back from missing technical English to Norwegian in production.
- Unknown / unreviewed codes must remain visibly unknown.
- OCR must never auto-correct ambiguous technical characters such as:
  - `I / 1 / l`
  - `O / 0`
  - `B / 8`
- Associated sections such as `[ ... ]` must be represented structurally, not as plain punctuation only.
- Main equipment and associated-part interpretation must remain separate.
- Legacy / country-specific marking belongs under `other` / `legacy`, not mixed into current rules without an explicit mapping.
