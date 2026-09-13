/* =============================================================================
   HIROSHI · i18n.js — le quattro lingue

   Sta in cima e non dipende da niente, come in Rada: contiene solo parole, e va
   caricato per primo. La catena diventa
   `i18n ← deriva ← cattura ← linee ← …`.

   L'ITALIANO È LA LINGUA PRINCIPALE, e non solo perché è la prima nell'elenco:
   è quella in cui i nomi sono stati inventati. «Frangia», «Soglia», «Bordone»
   dicono una cosa precisa a chi li ha scelti, e le altre tre lingue sono
   traduzioni di quelli — non il contrario. Dove una traduzione deve scegliere,
   sceglie di stare vicino alla cosa che il suono fa, non alla parola italiana:
   «Cavo» è un tenuto che pronuncia una vocale lentissima, quindi in inglese è
   «Hollow» e non «Cable».

   LE FRASI STANNO INTERE NEL DIZIONARIO, non si compongono concatenando pezzi.
   La riga di stato dell'italiano — «in ascolto · tonalità do · gocce Vetro» —
   in giapponese mette il genitivo dopo il nome e cambia l'ordine: nessuna
   concatenazione può prevederlo, e infatti `piede.stato` è una frase sola con
   dentro i buchi.

   I NUMERI PASSANO DA `Intl`, e i formattatori si costruiscono UNA VOLTA per
   lingua. Prima `numero()` scriveva la virgola a mano — `toFixed().replace(".",
   ",")` — che in inglese e in giapponese è un errore di ortografia. Crearne uno
   dentro il ciclo del disegno costerebbe più del disegno.

   LE UNITÀ SI TRADUCONO, LA NOTAZIONE NO, E LA FRASE STA INTERA. «ott» diventa
   «oct» e «オクターブ» perché è una parola abbreviata — e il numero sta DENTRO la
   frase, non incollato davanti: in giapponese fra la cifra e l'unità non c'è
   spazio, e una concatenazione con lo spazio dentro non saprebbe toglierlo.
   Invece `dB`, `Hz`, `ms`, `×`, `°`, `′`, `″` e i
   numerali romani degli anelli restano come sono in tutte e quattro, perché
   sono segni e non parole — un giapponese che legge una tavola tecnica si
   aspetta `dB`, non «デシベル».
============================================================================= */

const LINGUE = ["it", "fr", "en", "ja"];
const SIGLE = { it: "IT", fr: "FR", en: "EN", ja: "日本語" };

/* Lo spazio unificatore stretto che il francese vuole prima dei due punti e
   davanti al punto interrogativo: scritto in codice, così non lo si scambia per
   uno spazio normale e non lo si cancella per sbaglio. */
const NNBSP = " ";

const TESTI = {

  /* ------------------------------------------------------------- italiano */
  it: {
    "meta.descrizione": "Uno studio per fare musica d'ambiente nel browser: otto linee sfasate, un campo che deriva, un paesaggio tenuto fermo sotto una lente.",

    "testata.lingua":    "Lingua",
    "testata.tema":      "Tema",
    "tema.chiaro":       "CHIARO",
    "tema.scuro":        "SCURO",
    "tema.meriggio":     "MERIGGIO",
    "tema.crepuscolo":   "CREPUSCOLO",
    "tema.alba":         "ALBA",
    "tema.primavera":    "PRIMAVERA",
    "tema.autunno":      "AUTUNNO",
    "tema.inverno":      "INVERNO",
    "tema.mietitura":    "MIETITURA",
    "tema.estate":       "ESTATE",
    "tema.novembre":     "NOVEMBRE",
    "governo.ascolta":   "Ascolta",
    "g.guida":           "Guida",
    "governo.pausa":     "Pausa",

    "sez.gocce":      "Gocce",
    "sez.tessuti":    "Tessuti",
    "sez.banco":      "Banco",
    "sez.paesaggio":  "Paesaggio",
    "sez.deriva":     "Deriva",
    "sez.influenze":  "Influenze",
    "dida.banco":     "registrazione, equalizzatore, mixer",
    "dida.deriva":    "il tempo lungo · una quinta ogni {t}",
    "dida.influenze": "chi muove i parametri oltre alla mano",

    "et.mood":          "MOOD",
    "et.timbro":        "TIMBRO",
    "et.forma":         "Forma del suono",
    "et.insieme":       "Insieme",
    "et.materiale":     "MATERIALE",
    "et.effetto":       "Effetto",
    "et.profilo":       "PROFILO",
    "et.registrazione": "REGISTRAZIONE",
    "et.esporta":       "ESPORTA",
    "et.mixer":         "MIXER",
    "mix.on":           "ON",
    "a11y.accensione":  "Accensione di {canale}",
    "et.sorgente":      "SORGENTE",
    "et.tonalita":      "TONALITÀ",
    "et.circolo":       "CIRCOLO DELLE QUINTE",
    "et.collezione":    "COLLEZIONE",
    "et.baricentro":    "BARICENTRO · 15 MIN",
    "et.lettura":       "LETTURA",
    "et.orastagione":   "ORA E STAGIONE",
    "et.inf.ora":       "ORA → GOCCE",
    "et.inf.stagione":  "STAGIONE → TESSUTI",
    "et.inf.deriva":    "DERIVA → GOCCE · TESSUTI",
    "fl.colore":        "Colore d'insieme",

    "fl.attacco":       "Attacco",
    "fl.coda":          "Coda",
    "fl.inarmonicita":  "Inarmonicità",
    "fl.brillantezza":  "Brillantezza",
    "fl.corpo":         "Corpo",
    "fl.addensamento":  "Addensamento",
    "fl.densita":       "Densità",
    "fl.spazio":        "Spazio",
    "fl.registro":      "Registro",
    "fl.calore":        "Calore",
    "fl.apertura":      "Apertura",
    "fl.chiusura":      "Chiusura",
    "fl.movimento":     "Movimento",
    "fl.intreccio":     "Intreccio",
    "fl.livello":       "Livello",
    "fl.passo":         "Passo",
    "fl.picco":         "Picco",
    "fl.limitatore":    "Limitatore",
    "fl.segmento":      "Segmento",
    "fl.rallentamento": "Rallentamento",
    "fl.velo":          "Velo",
    "fl.sparpaglio":    "Sparpaglio",
    "fl.sosta":         "Sosta",
    "fl.accordatura":   "Accordatura",
    "fl.fuoco":         "Fuoco",
    "fl.tono":          "Tono",
    "fl.riverbero":     "Riverbero",
    "fl.sessione":      "Sessione",
    "fl.quinte":        "Quinte",
    "fl.prossima":      "Prossima",
    "fl.riallinea":     "Riallinea",

    "card.frasi":   "Le quattro frasi",
    "card.tenute":  "Le quattro tenute",
    "linea.muta":   "muta",

    "banco.registra":     "Registra",
    "banco.fermaSalva":   "Ferma e salva",
    "banco.formato":      "48 kHz · 24 bit",
    "banco.presaNegata":  "non riesco ad aprire la presa",
    "banco.tracciaWav":   "Traccia wav",
    "banco.durataReso":   "Durata del reso",
    "banco.tavolaPng":    "Tavola png",
    "banco.scena":        "Scena",
    "banco.serveSeme":    "serve un seme",
    "banco.minuti":       "{n} minuti",
    "banco.rendo":        "rendo…",
    "banco.nonFatta":     "non ce l'ho fatta",
    "banco.piatto":       "piatto",
    "banco.profiloN":     "profilo {n}",

    "mix.frasi":     "Frasi",
    "mix.tessuti":   "Tessuti",
    "mix.paesaggio": "Paesaggio",
    "mix.uscita":    "Uscita",

    "pae.nienteAncora":   "niente ancora",
    "pae.carica":         "Carica un suono",
    "pae.microfono":      "Microfono",
    "pae.ferma":          "Ferma",
    "pae.leggo":          "leggo…",
    "pae.nonLeggo":       "non riesco a leggerlo",
    "pae.nienteArrivato": "non è arrivato niente",
    "pae.negato":         "microfono negato",
    "pae.nessunaMateria": "nessuna materia: carica un suono, o apri il microfono",

    "piede.inAscolto": "in ascolto",
    "piede.fermo":     "fermo",
    "piede.stato":     "{stato} · tonalità {nota} · gocce {timbro} · tessuti {tenuto} · {ora} · {stagione}",
    "piede.aMano":     "a mano: {elenco}",
    "piede.legenda":   "la lunghezza è il registro, l'arco la durata; in ambra i numeri e quello che suona adesso",
    "foot.credits":    "questo è un progetto open source ideato da Valerio Belloni",

    "a11y.durataGiro":  "Durata del giro, linea {n}",
    "a11y.silenzia":    "Silenzia la linea {n}",
    "a11y.riattiva":    "Riattiva la linea {n}",
    "a11y.nuovaIdea":   "Nuova idea, linea {n}",
    "a11y.banda":       "Banda {hz} hertz",
    "a11y.livello":     "Livello {canale}",
    "a11y.registro":    "Registro delle gocce",
    "a11y.tregistro":   "Registro dei tessuti",
    "a11y.calore":      "Calore del timbro",
    "a11y.passo":       "Passo del movimento",
    "a11y.inizio":      "Inizio del segmento",
    "a11y.lettura":     "Lettura del paesaggio",
    "a11y.sosta":       "Sosta della lettura random",
    "a11y.fine":        "Fine del segmento",
    "a11y.effetto":     "Effetto dei {classe}, parametro {n}",

    "unita.ott":   "{n} ott",
    "unita.giro":  "{n} / giro",
    "unita.ore":   "{n} ore",
    "unita.giorni": "{n} giorni",
    "unita.anni":  "{n} anni",

    note:    ["do", "do♯", "re", "mi♭", "mi", "fa", "fa♯", "sol", "la♭", "la", "si♭", "si"],
    timbri:  { vetro: "Vetro", legno: "Legno", onda: "Onda", soffio: "Soffio",
               corda: "Corda", metallo: "Metallo", canna: "Canna", sabbia: "Sabbia" },
    tenuti:  { bordone: "Bordone", marea: "Marea", attrito: "Attrito", frangia: "Frangia",
               corrente: "Corrente", cavo: "Cavo", brina: "Brina", soglia: "Soglia" },
    mood:    { sereno: "Sereno", pioggia: "Pioggia", vespro: "Vespro", carillon: "Carillon",
               arcipelago: "Arcipelago", collina: "Collina", finestra: "Finestra", nuvola: "Nuvola",
               velo: "Velo", fondale: "Fondale", lino: "Lino", respiro: "Respiro",
               bruma: "Bruma", tenda: "Tenda", seta: "Seta", vela: "Vela" },
    modo:    { ancora: "ancora", deriva: "deriva" },
    ora:     { alba: "alba", mattino: "mattino", pomeriggio: "pomeriggio",
               tramonto: "tramonto", sera: "sera", notturna: "notturna" },
    stagione: { primavera: "primavera", estate: "estate", autunno: "autunno", inverno: "inverno" },
    lettura: { avanti: "Avanti", indietro: "Indietro", pendolo: "Pendolo", fermo: "Fermo", random: "Random" },
    effetto: { niente: "niente", eco: "eco", tremolo: "tremolo", coro: "coro", filtro: "filtro" },
    par:     { tempo: "Tempo", ritorni: "Ritorni", quantita: "Quantità",
               velocita: "Velocità", profondita: "Profondità", larghezza: "Larghezza",
               taglio: "Taglio", risonanza: "Risonanza", movimento: "Movimento" },
  },

  /* -------------------------------------------------------------- francese */
  fr: {
    "meta.descrizione": "Un studio pour faire de la musique d'ambiance dans le navigateur : huit lignes déphasées, un champ qui dérive, un paysage tenu immobile sous une loupe.",

    "testata.lingua":    "Langue",
    "testata.tema":      "Thème",
    "tema.chiaro":       "CLAIR",
    "tema.scuro":        "SOMBRE",
    "tema.meriggio":     "MÉRIDIENNE",
    "tema.crepuscolo":   "CRÉPUSCULE",
    "tema.alba":         "AUBE",
    "tema.primavera":    "PRINTEMPS",
    "tema.autunno":      "AUTOMNE",
    "tema.inverno":      "HIVER",
    "tema.mietitura":    "MOISSON",
    "tema.estate":       "ÉTÉ",
    "tema.novembre":     "NOVEMBRE",
    "governo.ascolta":   "Écouter",
    "g.guida":           "Guide",
    "governo.pausa":     "Pause",

    "sez.gocce":      "Gouttes",
    "sez.tessuti":    "Tissus",
    "sez.banco":      "Console",
    "sez.paesaggio":  "Paysage",
    "sez.deriva":     "Dérive",
    "sez.influenze":  "Influences",
    "dida.banco":     "enregistrement, égaliseur, mixage",
    "dida.deriva":    "le temps long · une quinte toutes les {t}",
    "dida.influenze": "ce qui déplace les paramètres en plus de la main",

    "et.mood":          "HUMEUR",
    "et.timbro":        "TIMBRE",
    "et.forma":         "Forme du son",
    "et.insieme":       "Ensemble",
    "et.materiale":     "MATIÈRE",
    "et.effetto":       "Effet",
    "et.profilo":       "PROFIL",
    "et.registrazione": "ENREGISTREMENT",
    "et.esporta":       "EXPORTER",
    "et.mixer":         "MIXAGE",
    "mix.on":           "ON",
    "a11y.accensione":  "Allumage de {canale}",
    "et.sorgente":      "SOURCE",
    "et.tonalita":      "TONALITÉ",
    "et.circolo":       "CYCLE DES QUINTES",
    "et.collezione":    "COLLECTION",
    "et.baricentro":    "BARYCENTRE · 15 MIN",
    "et.lettura":       "LECTURE",
    "et.orastagione":   "HEURE ET SAISON",
    "et.inf.ora":       "HEURE → GOUTTES",
    "et.inf.stagione":  "SAISON → TISSUS",
    "et.inf.deriva":    "DÉRIVE → GOUTTES · TISSUS",
    "fl.colore":        "Couleur d'ensemble",

    "fl.attacco":       "Attaque",
    "fl.coda":          "Traîne",
    "fl.inarmonicita":  "Inharmonicité",
    "fl.brillantezza":  "Brillance",
    "fl.corpo":         "Corps",
    "fl.addensamento":  "Concentration",
    "fl.densita":       "Densité",
    "fl.spazio":        "Espace",
    "fl.registro":      "Registre",
    "fl.calore":        "Chaleur",
    "fl.apertura":      "Émergence",
    "fl.chiusura":      "Fondu",
    "fl.movimento":     "Mouvement",
    "fl.intreccio":     "Entrelacs",
    "fl.livello":       "Niveau",
    "fl.passo":         "Allure",
    "fl.picco":         "Crête",
    "fl.limitatore":    "Limiteur",
    "fl.segmento":      "Segment",
    "fl.rallentamento": "Ralenti",
    "fl.velo":          "Voile",
    "fl.sparpaglio":    "Dispersion",
    "fl.sosta":         "Halte",
    "fl.accordatura":   "Accord",
    "fl.fuoco":         "Foyer",
    "fl.tono":          "Ton",
    "fl.riverbero":     "Réverbération",
    "fl.sessione":      "Séance",
    "fl.quinte":        "Quintes",
    "fl.prossima":      "Prochaine",
    "fl.riallinea":     "Réalignement",

    "card.frasi":   "Les quatre phrases",
    "card.tenute":  "Les quatre tenues",
    "linea.muta":   "muet",

    "banco.registra":     "Enregistrer",
    "banco.fermaSalva":   "Arrêter et garder",
    "banco.formato":      "48 kHz · 24 bit",
    "banco.presaNegata":  `impossible d'ouvrir la prise`,
    "banco.tracciaWav":   "Piste wav",
    "banco.durataReso":   "Durée du rendu",
    "banco.tavolaPng":    "Planche png",
    "banco.scena":        "Scène",
    "banco.serveSeme":    "il faut une graine",
    "banco.minuti":       "{n} minutes",
    "banco.rendo":        "je rends…",
    "banco.nonFatta":     `je n'y suis pas arrivé`,
    "banco.piatto":       "plat",
    "banco.profiloN":     "profil {n}",

    "mix.frasi":     "Phrases",
    "mix.tessuti":   "Tissus",
    "mix.paesaggio": "Paysage",
    "mix.uscita":    "Sortie",

    "pae.nienteAncora":   "rien encore",
    "pae.carica":         "Charger un son",
    "pae.microfono":      "Microphone",
    "pae.ferma":          "Arrêter",
    "pae.leggo":          "je lis…",
    "pae.nonLeggo":       "je ne sais pas le lire",
    "pae.nienteArrivato": "rien n'est arrivé",
    "pae.negato":         "microphone refusé",
    "pae.nessunaMateria": "aucune matière : chargez un son, ou ouvrez le microphone",

    "piede.inAscolto": `à l'écoute`,
    "piede.fermo":     `à l'arrêt`,
    "piede.stato":     "{stato} · tonalité {nota} · gouttes {timbro} · tissus {tenuto} · {ora} · {stagione}",
    "piede.aMano":     `à la main${NNBSP}: {elenco}`,
    "piede.legenda":   `la longueur est le registre, l'arc la durée${NNBSP}; en ambre les nombres et ce qui sonne maintenant`,
    "foot.credits":    "ce projet libre est une idée de Valerio Belloni",

    "a11y.durataGiro":  "Durée du tour, ligne {n}",
    "a11y.silenzia":    "Mettre en silence la ligne {n}",
    "a11y.riattiva":    "Réveiller la ligne {n}",
    "a11y.nuovaIdea":   "Nouvelle idée, ligne {n}",
    "a11y.banda":       "Bande {hz} hertz",
    "a11y.livello":     "Niveau {canale}",
    "a11y.registro":    "Registre des gouttes",
    "a11y.tregistro":   "Registre des tissus",
    "a11y.calore":      "Chaleur du timbre",
    "a11y.passo":       "Allure du mouvement",
    "a11y.inizio":      "Début du segment",
    "a11y.lettura":     "Lecture du paysage",
    "a11y.sosta":       "Halte de la lecture aléatoire",
    "a11y.fine":        "Fin du segment",
    "a11y.effetto":     "Effet des {classe}, paramètre {n}",

    "unita.ott":    "{n} oct.",
    "unita.giro":   "{n} / tour",
    "unita.ore":    "{n} heures",
    "unita.giorni": "{n} jours",
    "unita.anni":   "{n} ans",

    note:    ["do", "do♯", "ré", "mi♭", "mi", "fa", "fa♯", "sol", "la♭", "la", "si♭", "si"],
    timbri:  { vetro: "Verre", legno: "Bois", onda: "Onde", soffio: "Souffle",
               corda: "Corde", metallo: "Métal", canna: "Roseau", sabbia: "Sable" },
    tenuti:  { bordone: "Bourdon", marea: "Marée", attrito: "Frottement", frangia: "Frange",
               corrente: "Courant", cavo: "Creux", brina: "Givre", soglia: "Seuil" },
    mood:    { sereno: "Serein", pioggia: "Pluie", vespro: "Vêpres", carillon: "Carillon",
               arcipelago: "Archipel", collina: "Colline", finestra: "Fenêtre", nuvola: "Nuage",
               velo: "Voile", fondale: "Fond", lino: "Lin", respiro: "Souffle",
               bruma: "Brume", tenda: "Rideau", seta: "Soie", vela: "Voilure" },
    modo:    { ancora: "ancre", deriva: "dérive" },
    ora:     { alba: "aube", mattino: "matin", pomeriggio: "après-midi",
               tramonto: "crépuscule", sera: "soir", notturna: "nuit" },
    stagione: { primavera: "printemps", estate: "été", autunno: "automne", inverno: "hiver" },
    lettura: { avanti: "Avant", indietro: "Arrière", pendolo: "Pendule", fermo: "Arrêt", random: "Aléatoire" },
    effetto: { niente: "aucun", eco: "écho", tremolo: "trémolo", coro: "chœur", filtro: "filtre" },
    par:     { tempo: "Temps", ritorni: "Retours", quantita: "Quantité",
               velocita: "Vitesse", profondita: "Profondeur", larghezza: "Largeur",
               taglio: "Coupure", risonanza: "Résonance", movimento: "Mouvement" },
  },

  /* --------------------------------------------------------------- inglese */
  en: {
    "meta.descrizione": "A studio for making ambient music in the browser: eight phase-shifted lines, a drifting field, a landscape held still under a lens.",

    "testata.lingua":    "Language",
    "testata.tema":      "Theme",
    "tema.chiaro":       "LIGHT",
    "tema.scuro":        "DARK",
    "tema.meriggio":     "MIDDAY",
    "tema.crepuscolo":   "DUSK",
    "tema.alba":         "DAWN",
    "tema.primavera":    "SPRING",
    "tema.autunno":      "AUTUMN",
    "tema.inverno":      "WINTER",
    "tema.mietitura":    "HARVEST",
    "tema.estate":       "SUMMER",
    "tema.novembre":     "NOVEMBER",
    "governo.ascolta":   "Listen",
    "g.guida":           "Guide",
    "governo.pausa":     "Pause",

    "sez.gocce":      "Drops",
    "sez.tessuti":    "Weaves",
    "sez.banco":      "Desk",
    "sez.paesaggio":  "Landscape",
    "sez.deriva":     "Drift",
    "sez.influenze":  "Influences",
    "dida.banco":     "recording, equaliser, mixer",
    "dida.deriva":    "the long time · one fifth every {t}",
    "dida.influenze": "what moves the parameters besides the hand",

    "et.mood":          "MOOD",
    "et.timbro":        "TIMBRE",
    "et.forma":         "Shape of the sound",
    "et.insieme":       "Together",
    "et.materiale":     "MATERIAL",
    "et.effetto":       "Effect",
    "et.profilo":       "PROFILE",
    "et.registrazione": "RECORDING",
    "et.esporta":       "EXPORT",
    "et.mixer":         "MIXER",
    "mix.on":           "ON",
    "a11y.accensione":  "{canale} on",
    "et.sorgente":      "SOURCE",
    "et.tonalita":      "KEY",
    "et.circolo":       "CIRCLE OF FIFTHS",
    "et.collezione":    "COLLECTION",
    "et.baricentro":    "CENTROID · 15 MIN",
    "et.lettura":       "READING",
    "et.orastagione":   "HOUR AND SEASON",
    "et.inf.ora":       "HOUR → DROPS",
    "et.inf.stagione":  "SEASON → WEAVES",
    "et.inf.deriva":    "DRIFT → DROPS · WEAVES",
    "fl.colore":        "Ensemble colour",

    "fl.attacco":       "Attack",
    "fl.coda":          "Decay",
    "fl.inarmonicita":  "Inharmonicity",
    "fl.brillantezza":  "Brightness",
    "fl.corpo":         "Body",
    "fl.addensamento":  "Concentration",
    "fl.densita":       "Density",
    "fl.spazio":        "Space",
    "fl.registro":      "Register",
    "fl.calore":        "Warmth",
    "fl.apertura":      "Surfacing",
    "fl.chiusura":      "Fading",
    "fl.movimento":     "Motion",
    "fl.intreccio":     "Interlacing",
    "fl.livello":       "Level",
    "fl.passo":         "Pace",
    "fl.picco":         "Peak",
    "fl.limitatore":    "Limiter",
    "fl.segmento":      "Segment",
    "fl.rallentamento": "Slowdown",
    "fl.velo":          "Veil",
    "fl.sparpaglio":    "Scatter",
    "fl.sosta":         "Dwell",
    "fl.accordatura":   "Tuning",
    "fl.fuoco":         "Focus",
    "fl.tono":          "Tone",
    "fl.riverbero":     "Reverb",
    "fl.sessione":      "Session",
    "fl.quinte":        "Fifths",
    "fl.prossima":      "Next",
    "fl.riallinea":     "Realign",

    "card.frasi":   "The four phrases",
    "card.tenute":  "The four sustains",
    "linea.muta":   "mute",

    "banco.registra":     "Record",
    "banco.fermaSalva":   "Stop and keep",
    "banco.formato":      "48 kHz · 24 bit",
    "banco.presaNegata":  "cannot open the input",
    "banco.tracciaWav":   "Wav track",
    "banco.durataReso":   "Render length",
    "banco.tavolaPng":    "Board png",
    "banco.scena":        "Scene",
    "banco.serveSeme":    "needs a seed",
    "banco.minuti":       "{n} minutes",
    "banco.rendo":        "rendering…",
    "banco.nonFatta":     "it did not work",
    "banco.piatto":       "flat",
    "banco.profiloN":     "profile {n}",

    "mix.frasi":     "Phrases",
    "mix.tessuti":   "Weaves",
    "mix.paesaggio": "Landscape",
    "mix.uscita":    "Output",

    "pae.nienteAncora":   "nothing yet",
    "pae.carica":         "Load a sound",
    "pae.microfono":      "Microphone",
    "pae.ferma":          "Stop",
    "pae.leggo":          "reading…",
    "pae.nonLeggo":       "I cannot read it",
    "pae.nienteArrivato": "nothing came in",
    "pae.negato":         "microphone refused",
    "pae.nessunaMateria": "no material: load a sound, or open the microphone",

    "piede.inAscolto": "playing",
    "piede.fermo":     "stopped",
    "piede.stato":     "{stato} · key {nota} · drops {timbro} · weaves {tenuto} · {ora} · {stagione}",
    "piede.aMano":     "by hand: {elenco}",
    "piede.legenda":   "length is the register, the arc is the duration; in amber the numbers and what is sounding now",
    "foot.credits":    "this is an open source project by Valerio Belloni",

    "a11y.durataGiro":  "Cycle length, line {n}",
    "a11y.silenzia":    "Mute line {n}",
    "a11y.riattiva":    "Unmute line {n}",
    "a11y.nuovaIdea":   "New idea, line {n}",
    "a11y.banda":       "Band {hz} hertz",
    "a11y.livello":     "Level {canale}",
    "a11y.registro":    "Register of the drops",
    "a11y.tregistro":   "Register of the weaves",
    "a11y.calore":      "Warmth of the timbre",
    "a11y.passo":       "Pace of the motion",
    "a11y.inizio":      "Start of the segment",
    "a11y.lettura":     "Landscape reading",
    "a11y.sosta":       "Random reading dwell",
    "a11y.fine":        "End of the segment",
    "a11y.effetto":     "Effect of the {classe}, parameter {n}",

    "unita.ott":    "{n} oct",
    "unita.giro":   "{n} / cycle",
    "unita.ore":    "{n} hours",
    "unita.giorni": "{n} days",
    "unita.anni":   "{n} years",

    note:    ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"],
    timbri:  { vetro: "Glass", legno: "Wood", onda: "Wave", soffio: "Breath",
               corda: "String", metallo: "Metal", canna: "Reed", sabbia: "Sand" },
    tenuti:  { bordone: "Drone", marea: "Tide", attrito: "Friction", frangia: "Fringe",
               corrente: "Current", cavo: "Hollow", brina: "Frost", soglia: "Threshold" },
    mood:    { sereno: "Clear", pioggia: "Rain", vespro: "Vespers", carillon: "Carillon",
               arcipelago: "Archipelago", collina: "Hillside", finestra: "Window", nuvola: "Cloud",
               velo: "Veil", fondale: "Backdrop", lino: "Linen", respiro: "Breath",
               bruma: "Haze", tenda: "Curtain", seta: "Silk", vela: "Sail" },
    modo:    { ancora: "anchor", deriva: "drift" },
    ora:     { alba: "dawn", mattino: "morning", pomeriggio: "afternoon",
               tramonto: "sunset", sera: "evening", notturna: "night" },
    stagione: { primavera: "spring", estate: "summer", autunno: "autumn", inverno: "winter" },
    lettura: { avanti: "Forward", indietro: "Reverse", pendolo: "Pendulum", fermo: "Hold", random: "Random" },
    effetto: { niente: "none", eco: "echo", tremolo: "tremolo", coro: "chorus", filtro: "filter" },
    par:     { tempo: "Time", ritorni: "Feedback", quantita: "Amount",
               velocita: "Speed", profondita: "Depth", larghezza: "Width",
               taglio: "Cutoff", risonanza: "Resonance", movimento: "Motion" },
  },

  /* ------------------------------------------------------------- giapponese */
  ja: {
    "meta.descrizione": "ブラウザで環境音楽をつくる工房。位相のずれた八つの線、漂う音場、レンズの下に留めた風景。",

    "testata.lingua":    "言語",
    "testata.tema":      "配色",
    "tema.chiaro":       "明",
    "tema.scuro":        "暗",
    "tema.meriggio":     "昼",
    "tema.crepuscolo":   "夕",
    "tema.alba":         "暁",
    "tema.primavera":    "春",
    "tema.autunno":      "秋",
    "tema.inverno":      "冬",
    "tema.mietitura":    "麦秋",
    "tema.estate":       "夏",
    "tema.novembre":     "霜月",
    "governo.ascolta":   "再生",
    "g.guida":           "手引き",
    "governo.pausa":     "一時停止",

    "sez.gocce":      "しずく",
    "sez.tessuti":    "織り",
    "sez.banco":      "卓",
    "sez.paesaggio":  "風景",
    "sez.deriva":     "漂流",
    "sez.influenze":  "影響",
    "dida.banco":     "録音、等化器、混合",
    "dida.deriva":    "長い時間 · {t}ごとに五度",
    "dida.influenze": "手のほかに値を動かすもの",

    "et.mood":          "気分",
    "et.timbro":        "音色",
    "et.forma":         "音のかたち",
    "et.insieme":       "全体",
    "et.materiale":     "素材",
    "et.effetto":       "効果",
    "et.profilo":       "設定",
    "et.registrazione": "録音",
    "et.esporta":       "書き出し",
    "et.mixer":         "混合",
    "mix.on":           "ON",
    "a11y.accensione":  "{canale}の入切",
    "et.sorgente":      "音源",
    "et.tonalita":      "調",
    "et.circolo":       "五度圏",
    "et.collezione":    "音組",
    "et.baricentro":    "重心 · 15分",
    "et.lettura":       "読み方",
    "et.orastagione":   "時刻と季節",
    "et.inf.ora":       "時刻 → しずく",
    "et.inf.stagione":  "季節 → 織り",
    "et.inf.deriva":    "漂流 → しずく・織り",
    "fl.colore":        "全体の色",

    "fl.attacco":       "立ち上がり",
    "fl.coda":          "余韻",
    "fl.inarmonicita":  "非調和",
    "fl.brillantezza":  "明るさ",
    "fl.corpo":         "厚み",
    "fl.addensamento":  "集中度",
    "fl.densita":       "密度",
    "fl.spazio":        "空間",
    "fl.registro":      "音域",
    "fl.calore":        "温かみ",
    "fl.apertura":      "立ち上がり",
    "fl.chiusura":      "消えぎわ",
    "fl.movimento":     "動き",
    "fl.intreccio":     "重なり",
    "fl.livello":       "音量",
    "fl.passo":         "速さ",
    "fl.picco":         "尖頭",
    "fl.limitatore":    "制限",
    "fl.segmento":      "区間",
    "fl.rallentamento": "減速",
    "fl.velo":          "薄衣",
    "fl.sparpaglio":    "散らし",
    "fl.sosta":         "滞留",
    "fl.accordatura":   "調律",
    "fl.fuoco":         "絞り",
    "fl.tono":          "音調",
    "fl.riverbero":     "残響",
    "fl.sessione":      "経過",
    "fl.quinte":        "転調",
    "fl.prossima":      "次まで",
    "fl.riallinea":     "一巡",

    "card.frasi":   "四つのフレーズ",
    "card.tenute":  "四つの持続",
    "linea.muta":   "消音",

    "banco.registra":     "録音",
    "banco.fermaSalva":   "止めて保存",
    "banco.formato":      "48 kHz · 24 bit",
    "banco.presaNegata":  "入力を開けません",
    "banco.tracciaWav":   "wavで書き出し",
    "banco.durataReso":   "書き出しの長さ",
    "banco.tavolaPng":    "画面をpngで",
    "banco.scena":        "情景",
    "banco.serveSeme":    "種が要ります",
    "banco.minuti":       "{n}分",
    "banco.rendo":        "書き出し中…",
    "banco.nonFatta":     "うまくいきませんでした",
    "banco.piatto":       "平坦",
    "banco.profiloN":     "設定{n}",

    "mix.frasi":     "フレーズ",
    "mix.tessuti":   "織り",
    "mix.paesaggio": "風景",
    "mix.uscita":    "出力",

    "pae.nienteAncora":   "まだ何もありません",
    "pae.carica":         "音を読み込む",
    "pae.microfono":      "マイク",
    "pae.ferma":          "止める",
    "pae.leggo":          "読み込み中…",
    "pae.nonLeggo":       "読み込めません",
    "pae.nienteArrivato": "何も入りませんでした",
    "pae.negato":         "マイクが拒まれました",
    "pae.nessunaMateria": "素材がありません。音を読み込むか、マイクを開いてください",

    "piede.inAscolto": "再生中",
    "piede.fermo":     "停止中",
    "piede.stato":     "{stato} · {nota}調 · しずく{timbro} · 織り{tenuto} · {ora} · {stagione}",
    "piede.aMano":     "手で動かした：{elenco}",
    "piede.legenda":   "長さは音域、弧は持続。琥珀色は数値と、いま鳴っているもの",
    "foot.credits":    "Valerio Belloniによる、オープンソースの企画です。",

    "a11y.durataGiro":  "線{n}の一周の長さ",
    "a11y.silenzia":    "線{n}を消音する",
    "a11y.riattiva":    "線{n}をふたたび鳴らす",
    "a11y.nuovaIdea":   "線{n}に新しい楽想",
    "a11y.banda":       "{hz}ヘルツの帯域",
    "a11y.livello":     "{canale}の音量",
    "a11y.registro":    "しずくの音域",
    "a11y.tregistro":   "織りの音域",
    "a11y.calore":      "音色の温かみ",
    "a11y.passo":       "動きの速さ",
    "a11y.inizio":      "区間の始まり",
    "a11y.lettura":     "風景の読み方",
    "a11y.sosta":       "無作為読みの滞留時間",
    "a11y.fine":        "区間の終わり",
    "a11y.effetto":     "{classe}の効果、変数{n}",

    "unita.ott":    "{n}オクターブ",
    "unita.giro":   "{n}/周",
    "unita.ore":    "{n}時間",
    "unita.giorni": "{n}日",
    "unita.anni":   "{n}年",

    note:    ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"],
    timbri:  { vetro: "硝子", legno: "木", onda: "波", soffio: "息吹",
               corda: "弦", metallo: "金", canna: "葦", sabbia: "砂" },
    tenuti:  { bordone: "持続", marea: "潮", attrito: "摩擦", frangia: "干渉",
               corrente: "流れ", cavo: "空洞", brina: "霜", soglia: "閾" },
    mood:    { sereno: "凪", pioggia: "雨", vespro: "晩鐘", carillon: "風鈴",
               arcipelago: "島々", collina: "稜線", finestra: "窓辺", nuvola: "霞",
               velo: "薄衣", fondale: "底", lino: "亜麻", respiro: "息",
               bruma: "靄", tenda: "帳", seta: "絹", vela: "帆" },
    modo:    { ancora: "錨", deriva: "漂流" },
    ora:     { alba: "暁", mattino: "朝", pomeriggio: "昼下がり",
               tramonto: "夕暮れ", sera: "宵", notturna: "夜半" },
    stagione: { primavera: "春", estate: "夏", autunno: "秋", inverno: "冬" },
    lettura: { avanti: "順", indietro: "逆", pendolo: "往復", fermo: "停止", random: "無作為" },
    effetto: { niente: "なし", eco: "反響", tremolo: "トレモロ", coro: "コーラス", filtro: "濾波" },
    par:     { tempo: "時間", ritorni: "返り", quantita: "量",
               velocita: "速さ", profondita: "深さ", larghezza: "広がり",
               taglio: "遮断", risonanza: "共振", movimento: "動き" },
  },
};

/* --------------------------------------------------------------- la scelta
   Tre gradini, come in Rada: `?lang=` per chi manda un collegamento in una
   lingua precisa, poi quello che si era scelto l'altra volta, poi quello che
   dice il browser. In fondo l'inglese, che è il resto del mondo.

   QUI SI SCRIVE SUL DISCO DI CHI ASCOLTA, e altrove no. Il tema non lo fa —
   vedi `comandi.js` — e la differenza non è una svista: aprire lo strumento e
   trovarlo nella lingua sbagliata lo rende inutilizzabile finché non si ritrova
   il selettore, mentre trovarlo chiaro invece che scuro è un fastidio di un
   secondo. Il peso della cosa dimenticata non è lo stesso, quindi non è la
   stessa decisione. */
const CHIAVE_LINGUA = "hiroshi.lingua";

function lingueDelBrowser() {
  return navigator.languages && navigator.languages.length
    ? navigator.languages : [navigator.language || ""];
}

function scegliLingua() {
  let q = null;
  try { q = new URLSearchParams(location.search).get("lang"); } catch (e) {}
  if (LINGUE.includes(q)) return q;

  let salvata = null;
  try { salvata = localStorage.getItem(CHIAVE_LINGUA); } catch (e) {}
  if (LINGUE.includes(salvata)) return salvata;

  for (const tag of lingueDelBrowser()) {
    const primaria = String(tag).toLowerCase().split("-")[0];
    if (primaria === "it" || primaria === "fr" || primaria === "ja") return primaria;
  }
  return "en";
}

let lingua = scegliLingua();

/* ---------------------------------------------------------- i formattatori
   Costruiti UNA VOLTA per lingua. La tavola disegna sessanta volte al secondo e
   i comandi riscrivono una targa a ogni movimento del dito: creare un
   `Intl.NumberFormat` lì dentro costerebbe più del lavoro vero. */
let f0, f1, f2;

function costruisciFormattatori() {
  f0 = new Intl.NumberFormat(lingua, { maximumFractionDigits: 0 });
  f1 = new Intl.NumberFormat(lingua, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  f2 = new Intl.NumberFormat(lingua, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* Il separatore decimale è quello della lingua: la virgola in italiano e in
   francese, il punto in inglese e in giapponese. Prima stava scritto a mano —
   `toFixed().replace(".", ",")` — che in due lingue su quattro è un errore. */
function numero(v, d = 0) {
  return (d === 0 ? f0 : d === 1 ? f1 : f2).format(v);
}

/* ----------------------------------------------------------- la lettura
   Se una chiave manca nella lingua scelta si ripiega sull'inglese, e se manca
   anche lì si mostra la chiave: un buco si vede, e un buco che si vede si
   ripara.

   UNA CHIAVE COL PUNTO PUÒ ESSERE ANCHE UN PERCORSO. Le chiavi piatte —
   `fl.attacco` — si cercano per prime; se non ci sono, il punto si legge come
   una discesa dentro le mappe raggruppate, e `timbri.vetro` trova «Vetro»
   dentro `timbri`. Serve alla guida, che nelle sue tabelle nomina i timbri, i
   mood e i parametri degli effetti con le STESSE parole che stanno sui
   comandi: senza questo avrebbe dovuto tenerne una seconda copia, e due copie
   divergono. */
function percorso(dizionario, chiave) {
  let v = dizionario;
  for (const passo of chiave.split(".")) {
    if (v === null || typeof v !== "object") return undefined;
    v = v[passo];
  }
  return typeof v === "string" ? v : undefined;
}

function dice(chiave, valori) {
  let s = TESTI[lingua][chiave];
  if (s === undefined) s = percorso(TESTI[lingua], chiave);
  if (s === undefined) s = TESTI.en[chiave];
  if (s === undefined) s = percorso(TESTI.en, chiave);
  if (s === undefined) return chiave;
  if (valori) for (const k in valori) s = s.split("{" + k + "}").join(valori[k]);
  return s;
}

const nomeTimbro  = (id) => (TESTI[lingua].timbri || {})[id] || id;
const nomeTenuto  = (id) => (TESTI[lingua].tenuti || {})[id] || id;
const nomeMood    = (id) => (TESTI[lingua].mood || {})[id] || id;
const nomeModo    = (id) => (TESTI[lingua].modo || {})[id] || id;
const nomeOra     = (id) => (TESTI[lingua].ora || {})[id] || id;
const nomeStagione = (id) => (TESTI[lingua].stagione || {})[id] || id;
const nomeEffetto = (id) => (TESTI[lingua].effetto || {})[id] || id;
const nomeParam   = (id) => (TESTI[lingua].par || {})[id] || id;
/* Il nome della tonalità: il modello espone un indice da 0 a 11, le parole
   stanno qui — «sol», «G» e «sol» francese sono la stessa cosa in tre lingue,
   e in giapponese si usa la notazione anglosassone. */
const nomeNota    = (i) => (TESTI[lingua].note || [])[i] || "";

/* ------------------------------------------------------ il selettore in alto
   Costruito qui e non nell'HTML, perché le sigle e il comportamento devono
   essere una cosa sola: quattro pulsanti veri, che si prendono col tasto Tab e
   che un lettore di schermo annuncia come premuti. */
let cassettaLingue = null;

function costruisciSelettoreLingua(el) {
  if (!el) return;
  cassettaLingue = el;
  el.innerHTML = "";
  for (const l of LINGUE) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lingua";
    b.dataset.lingua = l;
    b.textContent = SIGLE[l];
    // Così le sintesi vocali leggono «にほんご» e non «ni-hon-go» all'inglese.
    if (l === "ja") b.lang = "ja";
    b.addEventListener("click", () => cambiaLingua(l));
    el.appendChild(b);
  }
  segnaLingua();
}

function segnaLingua() {
  if (!cassettaLingue) return;
  cassettaLingue.querySelectorAll(".lingua").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.lingua === lingua));
  });
  cassettaLingue.setAttribute("aria-label", dice("testata.lingua"));
}

/* --------------------------------------------------- applicazione al foglio
   Tre attributi, non uno: `data-i18n` scrive il testo, `data-i18n-aria`
   l'etichetta che sente chi non vede, `data-i18n-titolo` il suggerimento del
   puntatore. Nessuno dei tre scrive HTML — in questa pagina non serve, e
   `innerHTML` con dentro una stringa tradotta è la porta da cui entrano i
   guai. */
function applicaTesti() {
  document.documentElement.lang = lingua;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = dice(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", dice(el.getAttribute("data-i18n-aria")));
  });
  document.querySelectorAll("[data-i18n-titolo]").forEach((el) => {
    el.setAttribute("title", dice(el.getAttribute("data-i18n-titolo")));
  });

  const d = document.querySelector('meta[name="description"]');
  if (d) d.setAttribute("content", dice("meta.descrizione"));
}

function cambiaLingua(l) {
  if (!LINGUE.includes(l) || l === lingua) return;
  lingua = l;
  try { localStorage.setItem(CHIAVE_LINGUA, l); } catch (e) {}
  costruisciFormattatori();
  applicaTesti();
  segnaLingua();
  // Tutto quello che non sta scritto nell'HTML — le tendine, le righe delle
  // linee, le targhe, il mixer — lo rifà chi l'ha costruito.
  if (typeof alCambioDiLingua === "function") alCambioDiLingua();
}

costruisciFormattatori();
