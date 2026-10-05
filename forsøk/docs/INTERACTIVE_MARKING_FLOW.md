# Interactive EX marking flow

## Intended user flow

1. User may manually select more than one system:
   - ATEX
   - IECEx
   - Other

2. For image input:
   - OCR reads the plate.
   - The extractor isolates complete established marking lines.
   - The UI shows:
     **Fant følgende merking / Found the following marking**
   - The user checks/corrects OCR text in the normal textarea.

3. User presses:
   **Tolk merking / Interpret marking**

4. Result starts with a short general explanation.

5. Each system is shown separately.

### Example IECEx

Full line:

```text
Ex db [ia IIC Ga] IIB T4 Gb IP55
```

Clickable elements:

```text
Ex db
[
ia
IIC
Ga
]
IIB
T4
Gb
IP55
```

### Example ATEX

Full line:

```text
II 2 (I) G
```

Clickable elements:

```text
official Ex symbol
II
2
(I)
G
```

6. Clicking an element opens its explanation.

7. The textarea remains editable. After editing, the same button becomes:
   **Tolk på nytt / Interpret again**

## Architecture

Technical text for tokens belongs in:

```text
data/ex-code-library.js
```

Parsing/tokenization belongs in:

```text
js/core/ex-marking-interpreter.js
```

OCR line extraction belongs in:

```text
js/core/ex-code-extractor.js
```

UI interaction belongs in:

```text
js/features/marking.js
```

This separation is deliberate so a full-stack/mobile developer and an EX
subject-matter reviewer can review different concerns independently.
