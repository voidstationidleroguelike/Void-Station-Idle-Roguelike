# Regression checklist

Before release, verify at minimum:

- `ex p` and `Ex p` both recognize `Ex` and `p`.
- `Ex dem IIC T4` renders tokens `Ex / d / e / m / IIC / T4`.
- `Ex de IIC T4` renders `Ex / d / e / IIC / T4`.
- `Ex ia IIC T4`, `Ex db IIC T4`, `Ex pxb IIC T4` do not split their atomic protection codes.
- `II 2 G Ex db IIC T4 Gb` detects ATEX automatically.
- Plain `Ex db IIC T4 Gb` is called EX marking, not IECEx unless IECEx evidence is present.
- `(I)` typed manually stays `(I)`.
- `[op is]` remains one bracketed associated section.
- Legacy results start collapsed and can be expanded.
- Camera, upload and raw OCR panel still function.
- Pocket Guide and Poster zoom on desktop/mobile.
