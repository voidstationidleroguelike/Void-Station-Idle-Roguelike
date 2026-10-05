# Parser / OCR test cases

These are acceptance tests for structure and UI flow.

They are intentionally conservative and should remain stable while the parser
is expanded.

## 1. ATEX + IECEx with associated part

Input:

```text
Ex db [ia IIC Ga] IIB T4 Gb IP55
II 2 (1) G
```

Expected system selection:

```text
ATEX = on
IECEx = on
```

Expected IECEx line:

```text
Ex db [ia IIC Ga] IIB T4 Gb IP55
```

Expected clickable elements:

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

Expected associated section:

```text
[ ia IIC Ga ]
```

Expected main-equipment section:

```text
Ex db
IIB
T4
Gb
```

Expected other field:

```text
IP55
```

Expected ATEX line:

```text
II 2 (1) G
```

Expected clickable ATEX elements:

```text
official Ex symbol
II
2
(1)
G
```

The general text must exist in both Norwegian and English.

---

## 2. Legacy dust marking

Input:

```text
II 2 D Ex tD A21 IP65 T90°C
```

Expected:

- preserve the full line
- classify it under Other / legacy if the current approved rule set does not
  explicitly support it
- do not silently convert it to a newer equivalent

---

## 3. OCR noise around EX marking

OCR input:

```text
R. STAHL HMI Systems GmbH
Tel +49 12345
Ex db [ia IIC Ga] IIB T4 Gb IP55
II 2 (1) G
Fax +49 67890
```

Expected marking field:

```text
Ex db [ia IIC Ga] IIB T4 Gb IP55
II 2 (1) G
```

Manufacturer / phone / fax content must not enter the marking field.

---

## 4. Unknown token

Input:

```text
Ex db XYZ IIB T4 Gb
```

Expected:

- `XYZ` remains visible
- show it as unknown / not defined
- do not guess what it means
- do not auto-correct it

---

Machine-readable copy:

```text
data/ex-test-cases.json
```
