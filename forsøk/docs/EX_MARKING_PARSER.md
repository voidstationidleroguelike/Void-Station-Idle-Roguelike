# EX marking parser – structure

The OCR/parser must preserve line breaks.

A nameplate may contain multiple EX-related lines that refer to different
atmospheres, protection concepts, certification schemes or equipment parts.

## Important distinction

These are separate dimensions:

### Atmosphere
- Gas / vapour / mist
- Dust

### Equipment / protection family
- Electrical protection concepts
- Non-electrical / mechanical equipment (`Ex h` in current ISO 80079-36 style)

Do not use "gas" as the opposite of "electrical" or "mechanical".

## Example structure

A plate may contain:

```text
Ex db [ia IIC Ga] IIB T4 Gb    IP55
IECEx ABC 06.0012
II 2 (1) G
ABC 00 ATEX 4012
```

The parser should keep those lines separate and classify:

- gas EX marking
- IP rating
- IECEx certificate
- ATEX group/category
- ATEX certificate

Another plate may contain both gas and dust lines:

```text
II 2 (2) G Ex d e mb ib [ib] [op is] IIC T4
II 2 D Ex tD A21 IP65 T90°C
```

The first line is gas-related.
The second line is dust-related and uses an older dust marking form.

## Current mechanical / non-electrical marker

Current ISO 80079-36-style non-electrical marking commonly contains:

```text
Ex h
```

Examples may then continue with gas or dust grouping, temperature information,
and an EPL.

## Safety boundary

This parser currently identifies structure and extracts visible fields.

It must NOT decide:
- whether equipment is suitable for a specific hazardous area
- whether an installation is compliant
- whether an older marking maps to a current marking without an approved rule
- whether OCR-corrected characters are safe to assume

Those functions require approved technical rules and subject-matter review.
