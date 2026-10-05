window.EX_APP = window.EX_APP || {};

window.EX_APP.generalTextTemplates = {
  no: {
    bothSystems:
      "Skiltet inneholder både ATEX- og IECEx-/IEC-basert Ex-merking.",
    atexOnly:
      "Skiltet inneholder ATEX-merking.",
    iecexOnly:
      "Skiltet inneholder IECEx-/IEC-basert Ex-merking.",
    associatedPart:
      "Delen {associated} beskriver en tilknyttet / associated del av merkingen og skal tolkes separat fra hovedutstyrets merking.",
    mainEquipment:
      "Hovedutstyrets merking er {main}.",
    ip:
      "Utstyret er også merket {ip}.",
    unknown:
      "Ett eller flere elementer er ikke definert i biblioteket og må kontrolleres manuelt.",
    verify:
      "Kontroller alltid OCR-teksten og faglig forklaring mot godkjent materiale før bruk."
  },

  en: {
    bothSystems:
      "The plate contains both ATEX and IECEx/IEC-based Ex marking.",
    atexOnly:
      "The plate contains ATEX marking.",
    iecexOnly:
      "The plate contains IECEx/IEC-based Ex marking.",
    associatedPart:
      "The section {associated} describes an associated part of the marking and must be interpreted separately from the main equipment marking.",
    mainEquipment:
      "The main equipment marking is {main}.",
    ip:
      "The equipment is also marked {ip}.",
    unknown:
      "One or more elements are not defined in the library and must be checked manually.",
    verify:
      "Always verify OCR text and technical explanations against approved material before use."
  }
};
