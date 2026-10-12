# Top-level marking systems

Manual EX interpretation starts by selecting one of three systems:

## ATEX
European ATEX marking / certification.

## IECEx
International IECEx marking / certification.

## Other
Older or country-specific marking systems.

This is intentionally a UI/route choice first.
The detailed technical rules for each system belong in separate reviewed data.

## Image scanning

Camera/gallery scanning does not require the user to choose first.

The OCR/line parser should detect whether the plate contains:
- ATEX information
- IECEx information
- both
- neither / unknown

This is important because one physical plate can contain both ATEX and IECEx
certification information.
