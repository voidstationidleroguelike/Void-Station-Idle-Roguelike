# OCR filtering

OCR reads the whole image, but the EX marking field must not receive all text.

The flow is:

```text
image
  ↓
OCR reads full plate
  ↓
EX code extractor
  ├─ EX marking lines → editable marking field
  ├─ certificate / CE / Ta → separate relevant-info panel
  └─ manufacturer/address/phone/etc. → discarded
```

This is deliberately conservative.

The extractor should prefer missing an uncertain line over inventing or
silently correcting technical marking characters.

Examples intended to reach the marking field:

```text
II 2 (2) G Ex d e mb ib [ib] [op is] IIC T4
II 2 D Ex tD A21 IP65 T90°C
```

Examples intended to stay outside the marking field:

```text
R. STAHL HMI Systems GmbH
Im Gewerbegebiet Pesch 14
Tel.: ...
Fax.: ...
```

Useful but separate metadata may include:

```text
TÜV 05 ATEX 7176 X
CE 0158
Ta ranges
IECEx certificate numbers
```
