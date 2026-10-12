window.EX_APP = window.EX_APP || {};

/*
 * EX code library
 * ---------------
 * Reviewable bilingual content for clickable marking elements.
 *
 * The wording below is expanded from the reference material supplied for the
 * prototype. It remains draft content until technical review is complete.
 */
window.EX_APP.exCodeLibrary = {
  common: {
    "Ex": {
      title: { no: "Ex", en: "Ex" },
      short: {
        no: "Angir eksplosjonsbeskyttet utstyr / Ex-merking.",
        en: "Indicates explosion-protected equipment / Ex marking."
      },
      detailed: {
        no: "Ex viser at merkingen gjelder eksplosjonsbeskyttelse. Kodene som følger beskriver blant annet vernemetode, gass- eller støvgruppe, temperatur og beskyttelsesnivå.",
        en: "Ex shows that the marking concerns explosion protection. The following codes describe items such as protection method, gas or dust group, temperature and protection level."
      }
    },

    "[": {
      title: { no: "[  Tilknyttet del", en: "[  Associated part" },
      short: {
        no: "Start på en tilknyttet / associated del av merkingen.",
        en: "Start of an associated part of the marking."
      },
      detailed: {
        no: "Klammeparentesen markerer starten på en del som skal leses separat fra hovedutstyrets merking. Den brukes blant annet rundt merkingen for tilknyttede egensikre kretser. Gass eller støv bestemmes av kodene inne i parentesen – ikke av klammeparentesen i seg selv.",
        en: "The bracket marks the start of a section that must be read separately from the main equipment marking. It is used, among other things, around marking for associated intrinsically safe circuits. Gas or dust is determined by the codes inside the brackets, not by the bracket itself."
      }
    },

    "]": {
      title: { no: "]  Slutt på tilknyttet del", en: "]  End of associated part" },
      short: {
        no: "Avslutter den tilknyttede delen av merkingen.",
        en: "Ends the associated part of the marking."
      },
      detailed: {
        no: "Alt mellom [ og ] hører sammen som en avgrenset del og bør tolkes separat fra hovedmerkingen utenfor parentesene.",
        en: "Everything between [ and ] belongs together as a delimited section and should be interpreted separately from the main marking outside the brackets."
      }
    },

    "[...]": {
      title: { no: "[ ... ] – tilknyttet del", en: "[ ... ] – associated part" },
      short: {
        no: "Klammet del som skal leses separat fra hovedmerkingen.",
        en: "Bracketed part that must be read separately from the main marking."
      },
      detailed: {
        no: "Klammeparentesen markerer starten på en del som skal leses separat fra hovedutstyrets merking. Den brukes blant annet rundt merkingen for tilknyttede egensikre kretser. Alt mellom [ og ] hører sammen som en avgrenset del og bør tolkes separat fra hovedmerkingen utenfor parentesene. Gass eller støv bestemmes av kodene inne i parentesen – ikke av klammeparentesen i seg selv.",
        en: "The brackets mark a part that must be read separately from the main equipment marking. They are used, among other things, around markings for associated intrinsically safe circuits. Everything between [ and ] belongs together as one delimited part and should be interpreted separately from the main marking outside the brackets. Gas or dust is determined by the codes inside the brackets, not by the brackets themselves."
      }
    },

    "X": {
      title: { no: "X – spesielle betingelser", en: "X – special conditions" },
      short: {
        no: "Sertifikatet har spesielle betingelser for sikker bruk.",
        en: "The certificate contains special conditions for safe use."
      },
      detailed: {
        no: "X etter et sertifikatnummer betyr at det finnes spesielle bruksbetingelser som må leses i sertifikatet og følges ved installasjon og bruk.",
        en: "X after a certificate number means that special conditions for use are documented in the certificate and must be followed during installation and use."
      }
    },

    "U": {
      title: { no: "U – komponentsertifikat", en: "U – component certificate" },
      short: {
        no: "Angir komponentsertifikat.",
        en: "Indicates a component certificate."
      },
      detailed: {
        no: "U brukes for en Ex-komponent og betyr at sertifikatet gjelder en komponent, ikke et komplett frittstående utstyr.",
        en: "U is used for an Ex component and means that the certificate applies to a component rather than complete stand-alone equipment."
      }
    },

    "Ta": {
      title: { no: "Ta – omgivelsestemperatur", en: "Ta – ambient temperature" },
      short: {
        no: "Angir omgivelsestemperatur eller temperaturområde.",
        en: "Indicates ambient temperature or ambient temperature range."
      },
      detailed: {
        no: "Ta brukes for å angi hvilket omgivelsestemperaturområde merkingen gjelder for. Kontroller hele temperaturintervallet på skiltet.",
        en: "Ta is used to state the ambient temperature range for which the marking applies. Check the complete temperature range on the plate."
      }
    },

    "Tamb": {
      title: { no: "Tamb – omgivelsestemperatur", en: "Tamb – ambient temperature" },
      short: {
        no: "Angir omgivelsestemperatur eller temperaturområde.",
        en: "Indicates ambient temperature or ambient temperature range."
      },
      detailed: {
        no: "Tamb brukes på samme måte som Ta for å angi hvilket omgivelsestemperaturområde utstyret eller merkingen gjelder for.",
        en: "Tamb is used in the same way as Ta to state the ambient temperature range for which the equipment or marking applies."
      }
    }
  },

  iecex: {
    "I": {
      title: { no: "Utstyrsgruppe I", en: "Equipment group I" },
      short: {
        no: "IEC/Ex-gruppe for gruver med gruvegass.",
        en: "IEC/Ex group for mines susceptible to firedamp."
      },
      detailed: {
        no: "Utstyrsgruppe I brukes for utstyr beregnet for gruver der gruvegass kan forekomme. Den komplette merkingen må leses sammen med resten av Ex-koden.",
        en: "Equipment group I is used for equipment intended for mines where firedamp may occur. The complete marking must be read together with the rest of the Ex code."
      }
    },

    "II": {
      title: { no: "Utstyrsgruppe II", en: "Equipment group II" },
      short: {
        no: "IEC/Ex-gruppe for eksplosiv gassatmosfære utenfor gruver.",
        en: "IEC/Ex group for explosive gas atmospheres outside mines."
      },
      detailed: {
        no: "I IEC/Ex-merking angir utstyrsgruppe II utstyr for eksplosive gassatmosfærer utenfor gruver. Undergruppen angis normalt videre som IIA, IIB eller IIC.",
        en: "In IEC/Ex marking, equipment group II identifies equipment for explosive gas atmospheres outside mines. The subgroup is normally stated further as IIA, IIB or IIC."
      }
    },

    "III": {
      title: { no: "Utstyrsgruppe III", en: "Equipment group III" },
      short: {
        no: "IEC/Ex-gruppe for eksplosiv støvatmosfære.",
        en: "IEC/Ex group for explosive dust atmospheres."
      },
      detailed: {
        no: "Utstyrsgruppe III brukes for utstyr beregnet for eksplosive støvatmosfærer. Undergruppen angis normalt videre som IIIA, IIIB eller IIIC.",
        en: "Equipment group III is used for equipment intended for explosive dust atmospheres. The subgroup is normally stated further as IIIA, IIIB or IIIC."
      }
    },

    /*
     * v32: generic/base protection concepts.
     * These entries are deliberately separate from OCR handling. They are
     * ordinary EX-code definitions used by manual interpretation as well.
     *
     * The instructor workbook remains the working content guide. Wording is
     * reviewable and can be replaced without changing parser behaviour.
     */
    "Ex da": protection(
      "Ex da", "Flammesikker kapsling – nivå a", "Flameproof enclosure – level a",
      "Flammesikker kapsling med beskyttelsesnivå a. Leses sammen med resten av merkingen og sertifikatet.",
      "Flameproof enclosure with protection level a. Read together with the rest of the marking and certificate."
    ),
    "da": protectionAlias("da", "Flammesikker kapsling – nivå a", "Flameproof enclosure – level a"),

    "Ex i": simpleProtection(
      "Ex i", "Egensikkerhet", "Intrinsic safety",
      "Generell betegnelse for egensikkerhet. Nivået angis normalt videre med ia, ib eller ic.",
      "General designation for intrinsic safety. The level is normally stated further as ia, ib or ic."
    ),
    "i": simpleProtection(
      "i", "Egensikkerhet", "Intrinsic safety",
      "Generell betegnelse for egensikkerhet. Se eventuell nivåbokstav ia, ib eller ic.",
      "General intrinsic-safety designation. See any following level suffix ia, ib or ic."
    ),

    "Ex m": simpleProtection(
      "Ex m", "Innkapsling", "Encapsulation",
      "Generell betegnelse for innkapsling. Nivået angis normalt videre med ma, mb eller mc.",
      "General designation for encapsulation. The level is normally stated further as ma, mb or mc."
    ),
    "m": simpleProtection(
      "m", "Innkapsling", "Encapsulation",
      "Generell betegnelse for innkapsling. Se eventuell nivåbokstav ma, mb eller mc.",
      "General encapsulation designation. See any following level suffix ma, mb or mc."
    ),

    "Ex p": simpleProtection(
      "Ex p", "Overtrykksbeskyttelse", "Pressurization",
      "Generell / eldre betegnelse for overtrykksbeskyttelse. Nyere merking kan ha mer spesifikke varianter som pxb, pyb eller pzc.",
      "General / legacy designation for pressurization. Newer markings may use more specific variants such as pxb, pyb or pzc."
    ),
    "p": simpleProtection(
      "p", "Overtrykksbeskyttelse", "Pressurization",
      "Generell / eldre betegnelse for overtrykksbeskyttelse. Les eventuell underkode og resten av merkingen.",
      "General / legacy designation for pressurization. Read any subtype and the rest of the marking."
    ),

    "Ex pxb": simpleProtection(
      "Ex pxb", "Overtrykksbeskyttelse pxb", "Pressurization pxb",
      "Overtrykksbeskyttelse med betegnelsen pxb. Leses sammen med EPL og sertifikat.",
      "Pressurization protection designated pxb. Read together with the EPL and certificate."
    ),
    "pxb": simpleProtection(
      "pxb", "Overtrykksbeskyttelse pxb", "Pressurization pxb",
      "Overtrykksbeskyttelse pxb.", "Pressurization protection pxb."
    ),
    "Ex pyb": simpleProtection(
      "Ex pyb", "Overtrykksbeskyttelse pyb", "Pressurization pyb",
      "Overtrykksbeskyttelse med betegnelsen pyb. Leses sammen med EPL og sertifikat.",
      "Pressurization protection designated pyb. Read together with the EPL and certificate."
    ),
    "pyb": simpleProtection(
      "pyb", "Overtrykksbeskyttelse pyb", "Pressurization pyb",
      "Overtrykksbeskyttelse pyb.", "Pressurization protection pyb."
    ),
    "Ex pzc": simpleProtection(
      "Ex pzc", "Overtrykksbeskyttelse pzc", "Pressurization pzc",
      "Overtrykksbeskyttelse med betegnelsen pzc. Leses sammen med EPL og sertifikat.",
      "Pressurization protection designated pzc. Read together with the EPL and certificate."
    ),
    "pzc": simpleProtection(
      "pzc", "Overtrykksbeskyttelse pzc", "Pressurization pzc",
      "Overtrykksbeskyttelse pzc.", "Pressurization protection pzc."
    ),
    "pb": simpleProtection(
      "pb", "Overtrykksbeskyttelse – nivå b", "Pressurization – level b",
      "Betegnelse innen overtrykksbeskyttelse. Kontroller anvendt standard og sertifikat for den konkrete merkingen.",
      "Designation within pressurization protection. Check the applied standard and certificate for the specific marking."
    ),
    "pc": simpleProtection(
      "pc", "Overtrykksbeskyttelse – nivå c", "Pressurization – level c",
      "Betegnelse innen overtrykksbeskyttelse. Kontroller anvendt standard og sertifikat for den konkrete merkingen.",
      "Designation within pressurization protection. Check the applied standard and certificate for the specific marking."
    ),

    "Ex ob": simpleProtection(
      "Ex ob", "Væskeinnkapsling – nivå b", "Liquid immersion – level b",
      "Væskeinnkapsling med nivå b. Leses sammen med resten av merkingen.",
      "Liquid immersion with level b. Read together with the rest of the marking."
    ),
    "ob": simpleProtection(
      "ob", "Væskeinnkapsling – nivå b", "Liquid immersion – level b",
      "Væskeinnkapsling, nivå b.", "Liquid immersion, level b."
    ),
    "Ex oc": simpleProtection(
      "Ex oc", "Væskeinnkapsling – nivå c", "Liquid immersion – level c",
      "Væskeinnkapsling med nivå c. Leses sammen med resten av merkingen.",
      "Liquid immersion with level c. Read together with the rest of the marking."
    ),
    "oc": simpleProtection(
      "oc", "Væskeinnkapsling – nivå c", "Liquid immersion – level c",
      "Væskeinnkapsling, nivå c.", "Liquid immersion, level c."
    ),

    "Ex qb": simpleProtection(
      "Ex qb", "Pulverfylling – nivå b", "Powder filling – level b",
      "Pulverfylling med nivå b. Leses sammen med resten av merkingen.",
      "Powder filling with level b. Read together with the rest of the marking."
    ),
    "qb": simpleProtection(
      "qb", "Pulverfylling – nivå b", "Powder filling – level b",
      "Pulverfylling, nivå b.", "Powder filling, level b."
    ),

    "Ex n": simpleProtection(
      "Ex n", "Type n – eldre/generell betegnelse", "Type n – legacy/general designation",
      "Eldre samlebetegnelse for flere beskyttelsesmetoder. Underkoder som nA, nC og nR beskriver den konkrete utførelsen.",
      "Legacy umbrella designation for several protection methods. Sub-codes such as nA, nC and nR describe the specific construction."
    ),
    "n": simpleProtection(
      "n", "Type n – eldre/generell betegnelse", "Type n – legacy/general designation",
      "Eldre samlebetegnelse. Se eventuell underkode som nA, nC eller nR.",
      "Legacy umbrella designation. See any subtype such as nA, nC or nR."
    ),

    "Ex op": simpleProtection(
      "Ex op", "Optisk stråling", "Optical radiation",
      "Samlebetegnelse for beskyttelse knyttet til optisk stråling. Underkoder kan blant annet være op is, op pr og op sh.",
      "Umbrella designation for protection related to optical radiation. Sub-codes may include op is, op pr and op sh."
    ),
    "op": simpleProtection(
      "op", "Optisk stråling", "Optical radiation",
      "Samlebetegnelse for optisk beskyttelse. Se eventuell underkode op is, op pr eller op sh.",
      "Umbrella designation for optical protection. See any subtype op is, op pr or op sh."
    ),

    "Ex t": simpleProtection(
      "Ex t", "Beskyttelse ved kapsling for støv", "Protection by enclosure for dust",
      "Generell betegnelse for støvbeskyttelse ved kapsling. Nivået angis normalt videre med ta, tb eller tc.",
      "General designation for dust protection by enclosure. The level is normally stated further as ta, tb or tc."
    ),
    "t": simpleProtection(
      "t", "Beskyttelse ved kapsling for støv", "Protection by enclosure for dust",
      "Generell støvbetegnelse. Se eventuell nivåbokstav ta, tb eller tc.",
      "General dust designation. See any following level suffix ta, tb or tc."
    ),

    "Ex s": simpleProtection(
      "Ex s", "Spesiell beskyttelse", "Special protection",
      "Generell betegnelse for spesiell beskyttelse. Detaljene må kontrolleres i sertifikatet.",
      "General designation for special protection. Details must be checked in the certificate."
    ),
    "s": simpleProtection(
      "s", "Spesiell beskyttelse", "Special protection",
      "Generell betegnelse for spesiell beskyttelse. Kontroller sertifikatet.",
      "General designation for special protection. Check the certificate."
    ),
    "sa": simpleProtection(
      "sa", "Spesiell beskyttelse – nivå a", "Special protection – level a",
      "Spesiell beskyttelse, nivå a. Detaljene må kontrolleres i sertifikatet.",
      "Special protection, level a. Details must be checked in the certificate."
    ),
    "sb": simpleProtection(
      "sb", "Spesiell beskyttelse – nivå b", "Special protection – level b",
      "Spesiell beskyttelse, nivå b. Detaljene må kontrolleres i sertifikatet.",
      "Special protection, level b. Details must be checked in the certificate."
    ),
    "sc": simpleProtection(
      "sc", "Spesiell beskyttelse – nivå c", "Special protection – level c",
      "Spesiell beskyttelse, nivå c. Detaljene må kontrolleres i sertifikatet.",
      "Special protection, level c. Details must be checked in the certificate."
    ),

    "Ex h": simpleProtection(
      "Ex h", "Ikke-elektrisk Ex-utstyr", "Non-electrical Ex equipment",
      "Moderne samlemerking for ikke-elektrisk Ex-utstyr. Den komplette merkingen og sertifikatet beskriver beskyttelsen nærmere.",
      "Modern umbrella marking for non-electrical Ex equipment. The complete marking and certificate describe the protection in more detail."
    ),
    "h": simpleProtection(
      "h", "Ikke-elektrisk Ex-utstyr", "Non-electrical Ex equipment",
      "Moderne betegnelse for ikke-elektrisk Ex-utstyr. Leses sammen med resten av merkingen og sertifikatet.",
      "Modern designation for non-electrical Ex equipment. Read together with the rest of the marking and certificate."
    ),

    "Ex d": protection(
      "Ex d", "Flammesikker kapsling", "Flameproof enclosure",
      "En vernemetode der en eksplosjon inne i kapslingen ikke skal antenne den eksplosive atmosfæren utenfor.",
      "A protection method in which an explosion inside the enclosure is not intended to ignite the explosive atmosphere outside."
    ),
    "d": protectionAlias("d", "Flammesikker kapsling", "Flameproof enclosure"),

    "Ex db": protection(
      "Ex db", "Flammesikker kapsling – nivå b", "Flameproof enclosure – level b",
      "Flammesikker kapsling med beskyttelsesnivå b. I det oppgitte referansematerialet knyttes nivå b til utstyr for sone 1 når resten av merkingen også er korrekt.",
      "Flameproof enclosure with protection level b. In the supplied reference material, level b is associated with equipment for Zone 1 when the rest of the marking is also correct."
    ),
    "db": protectionAlias("db", "Flammesikker kapsling – nivå b", "Flameproof enclosure – level b"),

    "Ex dc": protection(
      "Ex dc", "Flammesikker kapsling – nivå c", "Flameproof enclosure – level c",
      "Flammesikker kapsling med nivå c. Referansematerialet beskriver denne som beregnet for sone 2.",
      "Flameproof enclosure with level c. The supplied reference describes this as intended for Zone 2."
    ),
    "dc": protectionAlias("dc", "Flammesikker kapsling – nivå c", "Flameproof enclosure – level c"),

    "Ex e": protection(
      "Ex e", "Økt sikkerhet", "Increased safety",
      "Vernemetode basert på økt sikkerhet for å redusere risikoen for tennkilder i normal bruk.",
      "Protection method based on increased safety to reduce the risk of ignition sources during normal use."
    ),
    "e": protectionAlias("e", "Økt sikkerhet", "Increased safety"),

    "Ex eb": protection(
      "Ex eb", "Økt sikkerhet – nivå b", "Increased safety – level b",
      "Økt sikkerhet med nivå b. Referansematerialet knytter dette nivået til sone 1.",
      "Increased safety with level b. The supplied reference associates this level with Zone 1."
    ),
    "eb": protectionAlias("eb", "Økt sikkerhet – nivå b", "Increased safety – level b"),

    "Ex ec": protection(
      "Ex ec", "Økt sikkerhet – nivå c", "Increased safety – level c",
      "Økt sikkerhet med nivå c. Referansematerialet beskriver dette som beregnet for sone 2.",
      "Increased safety with level c. The supplied reference describes this as intended for Zone 2."
    ),
    "ec": protectionAlias("ec", "Økt sikkerhet – nivå c", "Increased safety – level c"),

    "Ex ia": intrinsic("Ex ia", "ia", "Svært høyt beskyttelsesnivå; referansematerialet knytter Ex ia til sone 0.", "Very high protection level; the supplied reference associates Ex ia with Zone 0."),
    "ia": intrinsic("ia", "ia", "Når ia står inne i [ ], gjelder den den tilknyttede egensikre delen som parentesen avgrenser.", "When ia appears inside [ ], it applies to the associated intrinsically safe section delimited by the brackets."),

    "Ex ib": intrinsic("Ex ib", "ib", "Høyt beskyttelsesnivå; referansematerialet knytter Ex ib til sone 1.", "High protection level; the supplied reference associates Ex ib with Zone 1."),
    "ib": intrinsic("ib", "ib", "Egensikkerhet nivå ib. Står den i [ ], gjelder den den tilknyttede delen.", "Intrinsic safety level ib. When inside [ ], it applies to the associated section."),

    "Ex ic": intrinsic("Ex ic", "ic", "Referansematerialet knytter Ex ic til sone 2.", "The supplied reference associates Ex ic with Zone 2."),
    "ic": intrinsic("ic", "ic", "Egensikkerhet nivå ic.", "Intrinsic safety level ic."),

    "Ex ma": encapsulation("Ex ma", "a", "Referansematerialet knytter nivå a til sone 0.", "The supplied reference associates level a with Zone 0."),
    "ma": encapsulation("ma", "a", "Innkapsling, nivå a.", "Encapsulation, level a."),
    "Ex mb": encapsulation("Ex mb", "b", "Referansematerialet knytter nivå b til sone 1.", "The supplied reference associates level b with Zone 1."),
    "mb": encapsulation("mb", "b", "Innkapsling, nivå b.", "Encapsulation, level b."),
    "Ex mc": encapsulation("Ex mc", "c", "Referansematerialet knytter nivå c til sone 2.", "The supplied reference associates level c with Zone 2."),
    "mc": encapsulation("mc", "c", "Innkapsling, nivå c.", "Encapsulation, level c."),

    "Ex px": simpleProtection("Ex px", "Overtrykk px", "Pressurization px", "Overtrykkbeskyttelse. Referansematerialet beskriver px som reduksjon fra sone 1 til ikke-farlig område inne i kapslingen.", "Pressurization protection. The supplied reference describes px as reducing Zone 1 to a non-hazardous condition inside the enclosure."),
    "px": simpleProtection("px", "Overtrykk px", "Pressurization px", "Overtrykkbeskyttelse, nivå px.", "Pressurization protection, level px."),
    "Ex py": simpleProtection("Ex py", "Overtrykk py", "Pressurization py", "Overtrykkbeskyttelse. Referansematerialet beskriver py som reduksjon fra sone 1 til sone 2.", "Pressurization protection. The supplied reference describes py as reducing Zone 1 to Zone 2."),
    "py": simpleProtection("py", "Overtrykk py", "Pressurization py", "Overtrykkbeskyttelse, nivå py.", "Pressurization protection, level py."),
    "Ex pz": simpleProtection("Ex pz", "Overtrykk pz", "Pressurization pz", "Overtrykkbeskyttelse. Referansematerialet beskriver pz som reduksjon fra sone 2 til ikke-farlig område inne i kapslingen.", "Pressurization protection. The supplied reference describes pz as reducing Zone 2 to a non-hazardous condition inside the enclosure."),
    "pz": simpleProtection("pz", "Overtrykk pz", "Pressurization pz", "Overtrykkbeskyttelse, nivå pz.", "Pressurization protection, level pz."),

    "Ex nA": simpleProtection("Ex nA", "Ikke-gnistdannende", "Non-sparking", "Eldre / alternativ sone 2-merking for ikke-gnistdannende utførelse i det oppgitte referansematerialet.", "Older / alternative Zone 2 marking for non-sparking construction in the supplied reference material."),
    "nA": simpleProtection("nA", "Ikke-gnistdannende", "Non-sparking", "Ikke-gnistdannende vernemetode.", "Non-sparking protection method."),
    "Ex nC": simpleProtection("Ex nC", "Lukkede eller forseglede kontakter", "Enclosed or sealed contacts", "Sone 2-vernemetode for blant annet lukkede eller forseglede kontakter i det oppgitte referansematerialet.", "Zone 2 protection method for items such as enclosed or sealed contacts in the supplied reference material."),
    "nC": simpleProtection("nC", "Lukkede eller forseglede kontakter", "Enclosed or sealed contacts", "Vernemetode nC.", "Protection method nC."),
    "Ex nR": simpleProtection("Ex nR", "Begrenset innånding", "Restricted breathing", "Sone 2-vernemetode basert på begrenset inntrengning / innånding i kapslingen i det oppgitte referansematerialet.", "Zone 2 protection method based on restricted breathing / ingress into the enclosure in the supplied reference material."),
    "nR": simpleProtection("nR", "Begrenset innånding", "Restricted breathing", "Vernemetode nR.", "Protection method nR."),

    "Ex ta": dustEnclosure("Ex ta", "a", "Referansematerialet knytter Ex ta til sone 20.", "The supplied reference associates Ex ta with Zone 20."),
    "ta": dustEnclosure("ta", "a", "Støvinnkapsling, nivå a.", "Protection by enclosure for dust, level a."),
    "Ex tb": dustEnclosure("Ex tb", "b", "Referansematerialet knytter Ex tb til sone 21.", "The supplied reference associates Ex tb with Zone 21."),
    "tb": dustEnclosure("tb", "b", "Støvinnkapsling, nivå b.", "Protection by enclosure for dust, level b."),
    "Ex tc": dustEnclosure("Ex tc", "c", "Referansematerialet knytter Ex tc til sone 22.", "The supplied reference associates Ex tc with Zone 22."),
    "tc": dustEnclosure("tc", "c", "Støvinnkapsling, nivå c.", "Protection by enclosure for dust, level c."),

    "Ex o": simpleProtection("Ex o", "Oljenedsenking", "Oil immersion", "Vernemetode der aktuelle deler er beskyttet ved oljenedsenking. Referansematerialet knytter denne til sone 1.", "Protection method in which relevant parts are protected by oil immersion. The supplied reference associates it with Zone 1."),
    "o": simpleProtection("o", "Oljenedsenking", "Oil immersion", "Vernemetode med oljenedsenking.", "Oil-immersion protection method."),
    "Ex q": simpleProtection("Ex q", "Pulverfylling", "Powder filling", "Vernemetode med pulverfylling. Referansematerialet knytter denne til sone 1.", "Protection method using powder filling. The supplied reference associates it with Zone 1."),
    "q": simpleProtection("q", "Pulverfylling", "Powder filling", "Vernemetode med pulverfylling.", "Powder-filling protection method."),

    "op is": simpleProtection("op is", "Egensikker optisk stråling", "Inherently safe optical radiation", "Optisk energi begrenses slik at den ikke skal kunne bli en tennkilde under forholdene vernemetoden dekker.", "Optical energy is limited so that it is not intended to become an ignition source under the conditions covered by the protection concept."),
    "op pr": simpleProtection("op pr", "Beskyttet optisk stråling", "Protected optical radiation", "Optisk stråling holdes inne eller beskyttes ved konstruktive tiltak slik at den ikke skal kunne antenne den eksplosive atmosfæren under angitte forhold.", "Optical radiation is contained or protected by design measures so that it is not intended to ignite the explosive atmosphere under specified conditions."),
    "op sh": simpleProtection("op sh", "Optisk stråling med interlock", "Optical radiation with interlock", "En sikkerhetsfunksjon eller interlock brukes for å kontrollere eller bryte den optiske strålingen dersom den beskyttende tilstanden ikke lenger er oppfylt.", "A safety function or interlock is used to control or interrupt the optical radiation if the protective condition is no longer met."),

    "Ex tD": {
      title: { no: "Ex tD – eldre støvmerking", en: "Ex tD – legacy dust marking" },
      short: {
        no: "Eldre form for støvbeskyttelsesmerking.",
        en: "Older form of dust-protection marking."
      },
      detailed: {
        no: "Ex tD er en eldre støvmerking som kan forekomme på eksisterende utstyr. Appen bør beholde koden slik den står og ikke automatisk omskrive den til en nyere merking.",
        en: "Ex tD is an older dust marking that may appear on existing equipment. The app should preserve the code as written and not automatically convert it to a newer marking."
      }
    },
    "tD": {
      title: { no: "tD – eldre støvmerking", en: "tD – legacy dust marking" },
      short: { no: "Eldre støvbeskyttelsesmerking.", en: "Older dust-protection marking." },
      detailed: { no: "Beholdes som legacy-kode og må tolkes mot riktig eldre regelverk / dokumentasjon.", en: "Preserved as a legacy code and must be interpreted against the applicable older rules / documentation." }
    },
    "A21": {
      title: { no: "A21 – eldre støvmerking", en: "A21 – legacy dust marking" },
      short: { no: "Del av eldre støvmerking.", en: "Part of older dust marking." },
      detailed: { no: "A21 kan forekomme sammen med eldre Ex tD-merking. Den bør beholdes uendret og vurderes mot dokumentasjonen som gjelder for den eldre merkingen.", en: "A21 may appear with older Ex tD marking. It should be preserved unchanged and checked against the documentation applicable to the older marking." }
    },

    "IIA": gasGroup("IIA", "Gassgruppe IIA", "Gas group IIA", "Referansematerialet bruker propan som eksempel på denne gruppen.", "The supplied reference uses propane as an example for this group."),
    "IIB": gasGroup("IIB", "Gassgruppe IIB", "Gas group IIB", "Referansematerialet bruker etylen som eksempel. IIB dekker ikke IIC.", "The supplied reference uses ethylene as an example. IIB does not cover IIC."),
    "IIC": gasGroup("IIC", "Gassgruppe IIC", "Gas group IIC", "Referansematerialet bruker hydrogen som eksempel. IIC er den strengeste av IIA/IIB/IIC i den viste inndelingen.", "The supplied reference uses hydrogen as an example. IIC is the most demanding of IIA/IIB/IIC in the shown grouping."),

    "IIIA": dustGroup("IIIA"),
    "IIIB": dustGroup("IIIB"),
    "IIIC": dustGroup("IIIC"),

    "Ga": epl("Ga", "gass", "gas", "svært høyt", "very high", "0"),
    "Gb": epl("Gb", "gass", "gas", "høyt", "high", "1"),
    "Gc": epl("Gc", "gass", "gas", "normalt", "normal", "2"),
    "Da": epl("Da", "støv", "dust", "svært høyt", "very high", "20"),
    "Db": epl("Db", "støv", "dust", "høyt", "high", "21"),
    "Dc": epl("Dc", "støv", "dust", "normalt", "normal", "22"),

    "T1": tempClass("T1", 450),
    "T2": tempClass("T2", 300),
    "T3": tempClass("T3", 200),
    "T4": tempClass("T4", 135),
    "T5": tempClass("T5", 100),
    "T6": tempClass("T6", 85),

    "IP": {
      title: { no: "IP-grad", en: "IP rating" },
      short: {
        no: "Angir kapslingsgrad.",
        en: "Indicates ingress protection rating."
      },
      detailed: {
        no: "IP-koden beskriver kapslingens beskyttelse mot inntrengning. Hele koden, for eksempel IP65 eller IP68, må leses samlet.",
        en: "The IP code describes the enclosure's protection against ingress. The complete code, for example IP65 or IP68, must be read as a whole."
      }
    }
  },

  atex: {
    "Ex": {
      title: { no: "ATEX Ex-symbol", en: "ATEX Ex symbol" },
      short: {
        no: "Det grafiske Ex-symbolet som inngår i ATEX-merkingen.",
        en: "The graphical Ex symbol used as part of ATEX marking."
      },
      detailed: {
        no: "ATEX Ex-symbolet står på merkeplaten sammen med blant annet utstyrsgruppe og kategori. Symbolet er grafisk og trenger derfor ikke å komme fra tekstlesingen – appen kan vise det som et eget asset når ATEX-delen er funnet.",
        en: "The ATEX Ex symbol appears on the nameplate together with items such as equipment group and category. It is graphical and therefore does not need to come from text recognition; the app can render it as its own asset when an ATEX section has been found."
      }
    },

    "I": {
      title: { no: "Utstyrsgruppe I", en: "Equipment group I" },
      short: { no: "ATEX-gruppe for gruver.", en: "ATEX group for mines." },
      detailed: { no: "Utstyrsgruppe I brukes for utstyr beregnet for gruver / gruvegassmiljøer.", en: "Equipment group I is used for equipment intended for mines / firedamp environments." }
    },

    "II": {
      title: { no: "Utstyrsgruppe II", en: "Equipment group II" },
      short: { no: "ATEX-gruppe for eksplosive miljøer utenfor gruver.", en: "ATEX group for explosive atmospheres outside mines." },
      detailed: { no: "Utstyrsgruppe II angir at produktet er beregnet for eksplosive miljøer utenfor gruver. G eller D senere i merkingen viser om kategorien gjelder gass eller støv.", en: "Equipment group II indicates equipment intended for explosive atmospheres outside mines. G or D later in the marking identifies whether the category concerns gas or dust." }
    },

    "1": atexCategory("1", "svært høyt", "very high", "0 eller 20", "0 or 20"),
    "2": atexCategory("2", "høyt", "high", "1 eller 21", "1 or 21"),
    "3": atexCategory("3", "normalt", "normal", "2 eller 22", "2 or 22"),

    "(1)": parenthesizedCategory("1"),
    "(2)": parenthesizedCategory("2"),
    "(3)": parenthesizedCategory("3"),

    "G": {
      title: { no: "G – gassatmosfære", en: "G – gas atmosphere" },
      short: { no: "Kategoriangivelsen gjelder gass.", en: "The category designation applies to gas." },
      detailed: { no: "G betyr at ATEX-kategorien gjelder eksplosiv atmosfære med gass, damp eller tåke. Leses sammen med gruppen og kategoritallet foran.", en: "G means that the ATEX category applies to an explosive atmosphere involving gas, vapour or mist. Read it together with the equipment group and category number before it." }
    },

    "D": {
      title: { no: "D – støvatmosfære", en: "D – dust atmosphere" },
      short: { no: "Kategoriangivelsen gjelder støv.", en: "The category designation applies to dust." },
      detailed: { no: "D betyr at ATEX-kategorien gjelder eksplosiv støvatmosfære. Leses sammen med gruppen og kategoritallet foran.", en: "D means that the ATEX category applies to an explosive dust atmosphere. Read it together with the equipment group and category number before it." }
    },

    "GD": {
      title: { no: "GD – gass og støv", en: "GD – gas and dust" },
      short: { no: "Merkingen omfatter både gass og støv.", en: "The marking covers both gas and dust." },
      detailed: { no: "GD brukes når kategorimerkingen omfatter både gass- og støvatmosfære. Kontroller resten av merkingen for separate krav til de to atmosfærene.", en: "GD is used when the category marking covers both gas and dust atmospheres. Check the rest of the marking for separate requirements for the two atmospheres." }
    }
  }
};

function protection(code, noTitle, enTitle, noDetail, enDetail) {
  return {
    title: { no: noTitle, en: enTitle },
    short: { no: `${code}: ${noTitle}.`, en: `${code}: ${enTitle}.` },
    detailed: { no: noDetail, en: enDetail }
  };
}

function protectionAlias(code, noTitle, enTitle) {
  return {
    title: { no: `${code} – ${noTitle}`, en: `${code} – ${enTitle}` },
    short: { no: `${noTitle}.`, en: `${enTitle}.` },
    detailed: {
      no: `Denne koden er en del av en kombinert Ex-merking og angir ${noTitle.toLowerCase()}. Les den sammen med Ex-prefikset og de øvrige vernemetodene på samme linje.`,
      en: `This code forms part of a combined Ex marking and indicates ${enTitle.toLowerCase()}. Read it together with the Ex prefix and the other protection methods on the same line.`
    }
  };
}

function intrinsic(code, level, noDetail, enDetail) {
  return {
    title: { no: `${code} – egensikkerhet`, en: `${code} – intrinsic safety` },
    short: { no: `Egensikkerhet, nivå ${level}.`, en: `Intrinsic safety, level ${level}.` },
    detailed: { no: noDetail, en: enDetail }
  };
}

function encapsulation(code, level, noDetail, enDetail) {
  return {
    title: { no: `${code} – innkapsling`, en: `${code} – encapsulation` },
    short: { no: `Innkapsling, nivå ${level}.`, en: `Encapsulation, level ${level}.` },
    detailed: { no: noDetail, en: enDetail }
  };
}

function dustEnclosure(code, level, noDetail, enDetail) {
  return {
    title: { no: `${code} – støvinnkapsling`, en: `${code} – dust protection by enclosure` },
    short: { no: `Støvinnkapsling, nivå ${level}.`, en: `Dust protection by enclosure, level ${level}.` },
    detailed: { no: noDetail, en: enDetail }
  };
}

function simpleProtection(code, noTitle, enTitle, noDetail, enDetail) {
  return {
    title: { no: `${code} – ${noTitle}`, en: `${code} – ${enTitle}` },
    short: { no: noTitle, en: enTitle },
    detailed: { no: noDetail, en: enDetail }
  };
}

function gasGroup(code, noTitle, enTitle, noExtra, enExtra) {
  return {
    title: { no: noTitle, en: enTitle },
    short: { no: `${code} er en gassgruppe.`, en: `${code} is a gas group.` },
    detailed: {
      no: `${code} angir hvilken gassgruppe utstyret er vurdert for. ${noExtra}`,
      en: `${code} states the gas group for which the equipment is assessed. ${enExtra}`
    }
  };
}

function dustGroup(code) {
  return {
    title: { no: `${code} – støvgruppe`, en: `${code} – dust group` },
    short: { no: `${code} er en støvgruppe.`, en: `${code} is a dust group.` },
    detailed: {
      no: `${code} er en støvgruppe i Ex-merkingen. Den må leses sammen med støvvernemetode, temperaturangivelse og EPL på samme linje.`,
      en: `${code} is a dust group in the Ex marking. It must be read together with the dust protection method, temperature marking and EPL on the same line.`
    }
  };
}

function epl(code, noAtmosphere, enAtmosphere, noLevel, enLevel, zone) {
  return {
    title: { no: `${code} – EPL`, en: `${code} – EPL` },
    short: { no: `EPL ${code} for ${noAtmosphere}.`, en: `EPL ${code} for ${enAtmosphere}.` },
    detailed: {
      no: `${code} er Equipment Protection Level for ${noAtmosphere} og angir ${noLevel} beskyttelsesnivå. Referansematerialet knytter dette nivået til sone ${zone}.`,
      en: `${code} is the Equipment Protection Level for ${enAtmosphere} and indicates a ${enLevel} protection level. The supplied reference associates this level with Zone ${zone}.`
    }
  };
}

function tempClass(code, maxC) {
  return {
    title: { no: `${code} – temperaturklasse`, en: `${code} – temperature class` },
    short: { no: `Maksimal overflatetemperatur ${maxC} °C.`, en: `Maximum surface temperature ${maxC} °C.` },
    detailed: {
      no: `${code} er temperaturklassen for gassmerking. I referansematerialet tilsvarer ${code} en maksimal overflatetemperatur på ${maxC} °C.`,
      en: `${code} is the temperature class used for gas marking. In the supplied reference, ${code} corresponds to a maximum surface temperature of ${maxC} °C.`
    }
  };
}

function atexCategory(code, noLevel, enLevel, noZones, enZones) {
  return {
    title: { no: `Kategori ${code}`, en: `Category ${code}` },
    short: { no: `ATEX-kategori ${code}, ${noLevel} beskyttelsesnivå.`, en: `ATEX category ${code}, ${enLevel} protection level.` },
    detailed: {
      no: `Kategori ${code} angir ${noLevel} beskyttelsesnivå. I referansematerialet tilsvarer kategori ${code} sone ${noZones}, avhengig av om merkingen gjelder G (gass) eller D (støv).`,
      en: `Category ${code} indicates a ${enLevel} protection level. In the supplied reference, category ${code} corresponds to Zone ${enZones}, depending on whether the marking uses G (gas) or D (dust).`
    }
  };
}

function parenthesizedCategory(code) {
  return {
    title: { no: `(${code}) – kategori i parentes`, en: `(${code}) – parenthesized category` },
    short: { no: `Kategori ${code} for en tilknyttet del av merkingen.`, en: `Category ${code} for an associated part of the marking.` },
    detailed: {
      no: `Når kategorien står i parentes, skal den ikke uten videre leses som hovedutstyrets kategori. Den viser en tilknyttet del / krets og må tolkes sammen med resten av ATEX-linjen.`,
      en: `When the category appears in parentheses, it should not automatically be read as the main equipment category. It identifies an associated part / circuit and must be interpreted together with the rest of the ATEX line.`
    }
  };
}
