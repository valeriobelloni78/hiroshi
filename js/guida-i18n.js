/* =============================================================================
   HIROSHI · guida-i18n.js — i testi del manuale, nelle quattro lingue

   Si carica DOPO `i18n.js` e solo dentro `guida.html`: lo strumento non ne ha
   bisogno, e quaranta kilobyte di prosa non devono stare sulla pagina che deve
   aprire un contesto audio in meno di un secondo. Le due tabelle usano lo
   stesso `dice()` e lo stesso `applicaTesti()`, quindi il selettore di lingua
   in testa alla guida è lo stesso codice di quello dello strumento.

   IL TONO È QUELLO DI UN MANUALE, e non è una preferenza di stile: è la
   funzione del documento. Qui non si racconta che cosa si prova ad ascoltare —
   quello lo fa lo strumento — si dice che cosa fa un comando, in che corsa si
   muove, in quale unità, e che cosa cambia nel segnale. Una frase evocativa in
   una tabella di parametri è una riga che chi cerca un numero deve saltare.

   I NOMI DEI COMANDI NON SI RIPETONO QUI. Le etichette vengono da `i18n.js` —
   `fl.attacco`, `par.ritorni`, `timbri.vetro` — perché sono le STESSE parole
   che stanno sui cursori: due copie divergerebbero, e il manuale che chiama
   un comando con un nome che sul pannello non c'è è peggio di nessun manuale.
   Qui stanno solo le descrizioni e le corse.
============================================================================= */

const GUIDA = {

  /* ------------------------------------------------------------- italiano */
  it: {
    "g.titolo":    "Hiroshi · Guida",
    "g.torna":     "Torna allo strumento",
    "g.occhiello": "Manuale d'uso",
    "g.intro":     "Hiroshi è un generatore di musica d'ambiente che gira nel browser. Produce due classi di eventi — impulsi brevi e suoni tenuti — su otto linee cicliche indipendenti, li intona su un campo armonico che si sposta lentamente, e li somma in un banco d'uscita con equalizzatore, limitatore e registratore. Una quarta sorgente riproduce materiale registrato rallentato senza trasposizione. Questo documento descrive ogni comando: corsa, unità e effetto sul segnale.",

    "g.col.par":   "Parametro",
    "g.col.corsa": "Corsa",
    "g.col.fun":   "Funzione",
    "g.col.nome":  "Nome",
    "g.col.desc":  "Sintesi",
    "g.col.valore": "Valore",
    "g.col.periodi": "Periodi",
    "g.corsa.ott":    "0 – 3,2 ott",
    "g.corsa.ottmov": "0 – 2 ott",
    "g.corsa.min":    "1 – 20 min",
    "g.spec.krete":  "Rete",
    "g.spec.kmem":   "Memoria",

    /* 0 · panoramica */
    "g.pan.t": "Catena del segnale",
    "g.pan.catena": "sorgente → normalizzatore → inserto → livello → somma → colore → equalizzatore → limitatore → uscita\nlivello → mandata → riverbero → somma",
    "g.pan.1": "Le tre sorgenti sono indipendenti e si possono spegnere una per una col tasto ON sotto il loro canale del mixer. Ogni sorgente ha un canale nel banco: normalizzatore, inserto d'effetto, cursore di livello e mandata al riverbero comune. La somma passa per un filtro di colore d'insieme, l'equalizzatore a otto bande e un limitatore a due stadi.",
    "g.pan.2": "Spegnere una sorgente non mette in pausa il modello: i cicli e il ricambio delle idee proseguono, e riaccendendola si sente il punto in cui il pezzo è arrivato, non quello in cui era stato lasciato.",
    "g.pan.3": "Il riverbero della sorgente Paesaggio è interno e non usa la mandata comune: la sua coda è parte del suono, non l'ambiente in cui si trova.",

    /* 1 · struttura temporale */
    "g.tempo.t": "Struttura temporale",
    "g.tempo.1": "Otto linee cicliche, quattro per classe. Ogni linea ha un periodo proprio, regolabile fra 3 e 30 s per le gocce e fra 7 e 60 s per i tessuti, e mantiene una fase indipendente. Il generatore riempie un giro alla volta e prenota gli eventi con un anticipo di 0,15 s.",
    "g.tempo.2": "I quattro periodi di una classe sono coprimi a due a due. La combinazione delle otto fasi si ripete solo dopo il minimo comune multiplo dei periodi: con i valori d'esordio il riallineamento cade oltre le sessanta ore. La lettura RIALLINEA in testa alla sezione 05 riporta quel tempo per i periodi correnti.",
    "g.tempo.3": "Ogni riga di linea espone la durata del giro, un interruttore di silenziamento e un comando di rigenerazione, che sostituisce l'idea di quella linea senza toccare le altre.",

    /* 2 · gocce */
    "g.gocce.t": "Gocce",
    "g.gocce.1": "Impulsi brevi con inviluppo percussivo. Ogni linea tiene un'idea — una sequenza di posizioni nel campo armonico — e la ripete a ogni giro finché non viene sostituita. La posizione è relativa: la frequenza si calcola al momento della prenotazione, quindi un'idea ferma segue i cambi del campo senza essere riscritta.",
    "g.gocce.forma": "Forma del suono",
    "g.gocce.insieme": "Insieme",
    "g.gocce.man": "Manopole",
    "g.gocce.timbri": "Gli otto timbri",

    "g.p.attacco":  "Tempo di salita dell'inviluppo.",
    "g.p.coda":     "Tempo di discesa. Determina la lunghezza della tacca radiale sul quadrante.",
    "g.p.inarm":    "Scostamento dei parziali dai multipli interi della fondamentale.",
    "g.p.brill":    "Frequenza di taglio del passa-basso di voce, in scala esponenziale.",
    "g.p.corpo":    "Peso relativo della fondamentale rispetto ai parziali.",
    "g.p.addens":   "Frazione del giro entro cui cadono gli eventi di un'idea. A valori bassi si raccolgono all'inizio del giro; a 100 sono distribuiti su tutto il giro.",
    "g.p.densita":  "Numero massimo di eventi per giro. Il valore effettivo per ciascuna idea viene sorteggiato entro questo limite alla nascita dell'idea.",
    "g.p.spazio":   "Mandata al riverbero comune del canale.",
    "g.p.registro": "Ampiezza della finestra sul campo armonico. A cursore pieno la finestra copre poco più di tre ottave.",
    "g.p.calore":   "Parametro unico del timbro: ciascuno degli otto lo interpreta a modo suo, e la corona ne mostra il valore effettivo dopo l'influenza dell'ora del giorno.",

    "g.tim.vetro":   "Sinusoide con due parziali inarmonici e coda lunga.",
    "g.tim.legno":   "Impulso filtrato con risonanza media e decadimento rapido.",
    "g.tim.onda":    "Triangolare filtrata, attacco morbido, nessun parziale inarmonico.",
    "g.tim.soffio":  "Rumore filtrato a banda stretta accordato sull'altezza.",
    "g.tim.corda":   "Dente di sega con passa-basso che scende durante la coda. Non è una Karplus-Strong: un anello su un nodo di ritardo non scende sotto i 128 campioni, che fisserebbero l'altezza massima a 375 Hz.",
    "g.tim.metallo": "Sei parziali in rapporti inarmonici fissi, decadimento differenziato.",
    "g.tim.canna":   "Quadra filtrata con formante fissa, attacco con rumore.",
    "g.tim.sabbia":  "Rumore a banda larga con inviluppo brevissimo: grana, non altezza.",

    /* 3 · tessuti */
    "g.tess.t": "Tessuti",
    "g.tess.1": "Suoni tenuti con inviluppo a due tempi, da pochi secondi a un minuto. A differenza delle gocce non sono materie diverse ma modi diversi di essere instabili: ciascuno degli otto muove un parametro interno, perché un tenuto perfettamente fermo dopo pochi secondi smette di essere percepito come suono.",
    "g.tess.2": "La somma del bus si normalizza sugli inviluppi e non sul numero di voci aperte: la compensazione legge la stessa funzione che scrive l'automazione, quindi non c'è un salto di livello nell'istante in cui una voce comincia ad aprirsi.",
    "g.tess.timbri": "Gli otto tenuti",

    "g.p.apertura":  "Tempo di salita dell'inviluppo.",
    "g.p.chiusura":  "Tempo di discesa.",
    "g.p.movimento": "Ampiezza del movimento interno. Che cosa si muova dipende dal tenuto scelto.",
    "g.p.tbrill":    "Frequenza di taglio del passa-basso di voce.",
    "g.p.tcorpo":    "Peso della fondamentale rispetto alle bande superiori.",
    "g.p.intreccio": "Durata di una tenuta come frazione del periodo della sua linea, e con essa quante ne restano aperte insieme.",
    "g.p.livello":   "Livello della classe rispetto al primo piano, in decibel. È un parametro del modello, distinto dall'asta del mixer: la deriva lo muove di ±9 e un mood lo riscrive.",
    "g.p.tspazio":   "Mandata al riverbero comune del canale.",
    "g.p.tregistro": "Ampiezza della finestra sul campo armonico, con ripiegamento per ottave che conserva la classe d'altezza.",
    "g.p.passo":     "Velocità del movimento interno. L'unità dipende dal tenuto: centesimi di semitono, hertz di battimento, larghezza di banda.",

    "g.ten.bordone":  "Fondamentale con quinta e ottava, deriva di intonazione lentissima.",
    "g.ten.marea":    "Due bande di rumore filtrato che si scambiano energia.",
    "g.ten.attrito":  "Dente di sega dentro un passa-basso la cui frequenza oscilla: grana dentro l'altezza.",
    "g.ten.frangia":  "Due sinusoidi separate di pochi hertz. Il battimento è la loro differenza, e il passo la scrive in hertz.",
    "g.ten.corrente": "Rumore filtrato con banda che si sposta in continuo.",
    "g.ten.cavo":     "Tre formanti che si spostano fra la posizione della «a» e quella della «u». Altezza ferma, spettro in movimento.",
    "g.ten.brina":    "Parziali alti con ampiezze che si accendono e si spengono in modo indipendente.",
    "g.ten.soglia":   "Rumore ad alta frequenza di cui varia solo il livello. Nessuna altezza, nessun battimento.",

    /* 4 · inserti */
    "g.ins.t": "Inserti",
    "g.ins.1": "Ogni classe ha un inserto sul proprio canale, fra il normalizzatore e la coppia livello/mandata. L'effetto si sceglie dalla tendina sotto il quadrante; le tre manopole cambiano funzione con l'effetto ma mantengono la posizione, come le manopole di un pannello che sta fuori dall'effetto.",
    "g.ins.2": "Il riverbero non è fra gli effetti: la mandata alla stanza comune è già il comando Spazio della corona di ciascuna classe.",
    "g.ins.3": "Il cambio di effetto dal vivo passa per una dissolvenza di 30 ms in entrata e in uscita.",

    "g.eff.niente":  "Inserto vuoto. Le tre manopole sono disattivate.",
    "g.eff.eco":     "Linea di ritardo con retroazione e passa-basso nell'anello a 2,8 kHz. Miscelazione a potenza costante fra secco e ripetizioni.",
    "g.eff.tremolo": "Modulazione d'ampiezza sui due canali, con sfasamento regolabile fra destra e sinistra.",
    "g.eff.coro":    "Due copie ritardate di 11 e 17 ms, modulate in controfase. La larghezza nasce dalla differenza fra i due lati.",
    "g.eff.filtro":  "Passa-basso risonante con oscillatore lento sul taglio. In serie, non miscelato.",

    "g.pe.tempo":      "Tempo di ritardo.",
    "g.pe.ritorni":    "Guadagno d'anello. Il massimo è 0,8: sopra, la coda cresce invece di scendere.",
    "g.pe.quantita":   "Miscelazione fra segnale diretto ed effetto, a potenza costante.",
    "g.pe.velocita":   "Frequenza dell'oscillatore di modulazione.",
    "g.pe.profondita": "Ampiezza della modulazione.",
    "g.pe.larghezza":  "Sfasamento della modulazione fra i due canali. A 0° il suono pulsa al centro, a 180° si sposta da un lato all'altro.",
    "g.pe.taglio":     "Frequenza di taglio, in scala esponenziale.",
    "g.pe.risonanza":  "Fattore di merito del filtro.",
    "g.pe.movimento":  "Escursione dell'oscillatore lento sul taglio, in ottave attorno alla frequenza impostata.",

    /* 5 · paesaggio */
    "g.pae.t": "Paesaggio",
    "g.pae.1": "Riproduce materiale registrato — un file caricato o una presa dal microfono — rallentato di un fattore fra 1 e 64 senza trasporlo. Il materiale non si conserva: vive finché la pagina resta aperta.",
    "g.pae.2": "Il rallentamento non si ottiene leggendo il buffer più piano, che abbasserebbe anche l'altezza. La materia si legge a velocità naturale in finestre sovrapposte, e a camminare piano è il punto da cui le finestre vengono prese. Le finestre sono quattro per istante, con campane sfasate: con meno si sente il confine fra una e l'altra.",
    "g.pae.3": "L'intonazione non trasporta il materiale ma gli mette dietro un banco di passa-banda accordati sui gradi della collezione corrente, fra 110 e 1500 Hz. Il banco tiene gli indici del campo, non le frequenze: al passo di quinta i filtri si spostano con una costante lunga, e quattro filtri su cinque riscrivono lo stesso valore.",
    "g.pae.4": "Il segmento si sceglie con le due maniglie sopra l'onda. Rovesciandole il segmento si specchia invece di annullarsi. La banda chiara che cammina dentro il segmento è la finestra di lettura corrente.",
    "g.pae.5": "La testa di lettura ha cinque modi. AVANTI la fa camminare verso la fine del segmento e la riporta al capo; INDIETRO la fa camminare verso l'inizio. PENDOLO la fa rimbalzare fra i due estremi. FERMO la tiene nel punto in cui si trova. RANDOM la fa saltare in un punto casuale del segmento, legge da lì in avanti per la durata della sosta e poi salta di nuovo; il punto d'arrivo del salto successivo è segnato sull'onda con un tratteggio. In tutti i modi le finestre suonano in avanti a velocità naturale: a cambiare verso è la testa, non il materiale.",

    "g.p.segmento":  "Estremi del segmento percorso, in centesimi della durata del materiale.",
    "g.p.lettura":   "Modo in cui la testa percorre il segmento: avanti, indietro, pendolo, fermo, random.",
    "g.p.sosta":     "Durata di lettura di ciascuna area nel modo RANDOM, in scala esponenziale. Negli altri modi è disattivata.",
    "g.p.rallenta":  "Fattore di rallentamento della testa di lettura.",
    "g.p.velo":      "Durata di una finestra di lettura.",
    "g.p.sparpaglio": "Scarto casuale sul punto di partenza di ogni finestra. A zero le finestre partono tutte dallo stesso punto e la somma diventa un filtro a pettine.",
    "g.p.accordatura": "Miscelazione fra materiale crudo e materiale passato per il banco risonante.",
    "g.p.fuoco":     "Fattore di merito dei filtri del banco. Sotto 8 i filtri non distinguono più un grado dal semitono accanto; il guadagno del banco cresce col fuoco in modo da non spostare il livello.",
    "g.p.pcoda":     "Tempo di riverberazione della rete interna del paesaggio.",
    "g.p.ptono":     "Frequenza di smorzamento nell'anello del riverbero.",
    "g.p.priverbero": "Miscelazione fra segnale diretto e coda.",

    /* 6 · deriva */
    "g.der.t": "Deriva",
    "g.der.1": "Il campo armonico è una pentatonica anemitonica — gradi 0, 2, 4, 7, 9 — replicata su cinque ottave, per venticinque altezze. Le due classi leggono lo stesso campo e lo stesso baricentro; cambia solo l'ampiezza della finestra.",
    "g.der.2": "Ogni 2′ 30″ esatti la collezione si sposta di una quinta. Fra una pentatonica e la sua quinta cambia una nota su cinque: quattro gradi su cinque restano validi in entrambe. Una tenuta destinata ad attraversare il passo viene intonata su un grado che sopravvive, così non resta fuori collezione mentre suona.",
    "g.der.3": "Il baricentro è il movimento continuo: le altezze restano ferme e a scorrere è il punto attorno a cui vengono scelte. Lo governano sei canali a rapporti irrazionali, quindi il pezzo non ripassa mai esattamente dove è già stato. La corsia in fondo alla sezione ne mostra quindici minuti; le colonne in ambra segnano i punti di inversione.",
    "g.der.4": "Il comando MATERIALE decide che cosa succede alle idee al passo di quinta.",

    "g.p.ancora": "Le idee restano quelle fissate dal mood: cambiano di altezza seguendo il campo, ma la sequenza resta la stessa.",
    "g.p.deriva": "Le idee si rigenerano a ogni passo di quinta.",

    /* 7 · banco */
    "g.banco.t": "Banco",
    "g.banco.1": "Uscita dello studio. Ogni canale ha un normalizzatore scritto dalla sorgente — che compensa quante voci sono aperte — un cursore di livello e una mandata al riverbero comune, in quest'ordine: il riverbero riceve il segnale già compensato.",
    "g.banco.2": "L'equalizzatore ha otto bande a frequenza fissa, corsa ±8 dB. La curva disegnata sopra le aste è la risposta vera dei filtri, chiesta al grafo audio, non un'interpolazione delle posizioni.",
    "g.banco.3": "Due uscite diverse. La registrazione dal vivo cattura la seduta con dentro i movimenti dei cursori. L'esportazione rende il pezzo fuori tempo reale, molto più in fretta del tempo reale, senza nessuna mano dentro: percorre lo stesso modello e le stesse tarature, quindi il file suona come quello che si sta ascoltando.",

    "g.p.eq":         "Otto bande: 20 Hz shelf, 50 · 100 · 500 · 1k · 5k · 10k campana, 18 kHz shelf.",
    "g.p.mixer":      "Livello dei tre canali e dell'uscita. Sul canale dei tessuti si somma in decibel al parametro Livello del modello.",
    "g.p.limitatore": "Due stadi in cascata sull'uscita. La lettura indica la riduzione di guadagno istantanea.",
    "g.p.picco":      "Picco del segnale d'uscita, con tenuta di 20 dB al secondo.",
    "g.p.registra":   "Presa dal vivo dall'uscita del banco. Il file esce in wav 24 bit stereo.",
    "g.p.esporta":    "Rendering fuori tempo reale della durata scelta, in wav 24 bit stereo.",

    /* 8 · mood */
    "g.mood.t": "Mood",
    "g.mood.1": "Sedici configurazioni complete, otto per classe. Un mood scrive insieme i parametri, i quattro periodi delle linee e il nome del timbro, perché la configurazione temporale è parte del carattere quanto il suono. La scrittura è immediata e non lisciata: un mood è uno scatto, non un gesto.",
    "g.mood.2": "Ogni timbro compare una volta sola per tabella: girando gli otto si attraversano tutti e otto i suoni.",

    /* 9 · influenze */
    "g.infl.t": "Influenze esterne",
    "g.infl.1": "Due grandezze prese dall'orologio di sistema modificano i valori efficaci senza toccare la posizione dei cursori. L'ora del giorno muove calore, spazio e colore d'insieme delle gocce; la stagione muove registro, apertura, chiusura e passo dei tessuti. La differenza fra la posizione del cursore e il valore efficace si legge confrontando il filetto in colonna con la corona attorno al quadrante.",

    /* 10 · tavola */
    "g.tav.t": "Lettura della tavola",
    "g.tav.1": "Ogni classe ha un quadrante con quattro anelli concentrici, uno per linea, numerati in cifre romane. Un punto percorre ogni anello e indica la fase udibile, non quella dello scheduler.",
    "g.tav.2": "Una goccia è una tacca radiale che attraversa l'anello: la sua lunghezza è il registro della nota. Una tenuta è un arco lungo quanto la nota resta in aria; è tenue quando è passata, a inchiostro pieno mentre suona.",
    "g.tav.3": "L'ambra segna quattro cose e non di più: quello che sta suonando adesso, ogni valore numerico, il punto in cui il baricentro ha invertito, e l'inizio di una sezione. Quando una goccia suona un filo la unisce al centro del quadrante; se due gocce di linee diverse cadono a meno di 0,18 s l'una dall'altra, un secondo filo unisce anche loro.",
    "g.tav.4": "La corona attorno al quadrante mostra i valori efficaci dei tre comandi dell'Insieme; i filetti nella colonna mostrano dove sta la mano. Fra i due c'è la deriva, l'ora e la stagione.",

    /* 11 · specifiche */
    "g.spec.t": "Specifiche",
    "g.spec.1": "L'applicazione non fa richieste di rete: si apre da file locale e funziona senza connessione. I file audio dell'utente sono decodificati nel browser e non lasciano la macchina.",
    "g.spec.motore":   "Web Audio API, nessuna libreria",
    "g.spec.uscita":   "wav 24 bit stereo, 48 kHz",
    "g.spec.buffer":   "1024 campioni (latencyHint playback)",
    "g.spec.rete":     "nessuna richiesta di rete",
    "g.spec.memoria":  "i materiali del paesaggio non si conservano fra due aperture",
    "g.spec.lingua":   "la lingua scelta viene ricordata; il tema no, e si chiede al sistema",
  },

  /* -------------------------------------------------------------- francese
     Lo spazio unificatore stretto davanti ai due punti si scrive `${NNBSP}` e
     non a mano: è invisibile in un editor, e la costante lo rende leggibile. */
  fr: {
    "g.titolo":    "Hiroshi · Guide",
    "g.torna":     "Retour à l'instrument",
    "g.occhiello": "Mode d'emploi",
    "g.intro":     "Hiroshi est un générateur de musique d'ambiance qui fonctionne dans le navigateur. Il produit deux classes d'événements — impulsions brèves et sons tenus — sur huit lignes cycliques indépendantes, les accorde sur un champ harmonique qui se déplace lentement, et les somme dans une console de sortie avec égaliseur, limiteur et enregistreur. Une quatrième source lit un matériau enregistré ralenti sans transposition. Ce document décrit chaque commande : course, unité et effet sur le signal.",

    "g.col.par":    "Paramètre",
    "g.col.corsa":  "Course",
    "g.col.fun":    "Fonction",
    "g.col.nome":   "Nom",
    "g.col.desc":   "Synthèse",
    "g.col.valore": "Valeur",
    "g.col.periodi": "Périodes",
    "g.corsa.ott":    "0 – 3,2 oct.",
    "g.corsa.ottmov": "0 – 2 oct.",
    "g.corsa.min":    "1 – 20 min",
    "g.spec.krete":  "Réseau",
    "g.spec.kmem":   "Mémoire",

    "g.pan.t": "Chaîne du signal",
    "g.pan.catena": "source → normalisateur → insert → niveau → somme → couleur → égaliseur → limiteur → sortie\nniveau → départ → réverbération → somme",
    "g.pan.1": "Les trois sources sont indépendantes et se coupent une par une avec la touche ON sous leur voie de la console. Chaque source a une voie dans la console : normalisateur, insert d'effet, curseur de niveau et départ vers la réverbération commune. La somme passe par un filtre de couleur d'ensemble, l'égaliseur à huit bandes et un limiteur à deux étages.",
    "g.pan.2": "Couper une source ne met pas le modèle en pause : les cycles et le renouvellement des idées continuent, et en la rallumant on entend où la pièce est arrivée, non où on l'avait laissée.",
    "g.pan.3": "La réverbération de la source Paysage est interne et n'utilise pas le départ commun : sa traîne fait partie du son, elle n'est pas le lieu où il se trouve.",

    "g.tempo.t": "Structure temporelle",
    "g.tempo.1": "Huit lignes cycliques, quatre par classe. Chaque ligne a sa propre période, réglable entre 3 et 30 s pour les gouttes et entre 7 et 60 s pour les tissus, et garde une phase indépendante. Le générateur remplit un tour à la fois et réserve les événements avec 0,15 s d'avance.",
    "g.tempo.2": "Les quatre périodes d'une classe sont premières entre elles deux à deux. La combinaison des huit phases ne se répète qu'après le plus petit commun multiple des périodes : avec les valeurs de départ le réalignement dépasse soixante heures. La lecture RÉALIGNEMENT en tête de la section 05 donne ce temps pour les périodes courantes.",
    "g.tempo.3": "Chaque ligne expose la durée du tour, un interrupteur de silence et une commande de régénération, qui remplace l'idée de cette ligne sans toucher aux autres.",

    "g.gocce.t": "Gouttes",
    "g.gocce.1": "Impulsions brèves à enveloppe percussive. Chaque ligne tient une idée — une suite de positions dans le champ harmonique — et la répète à chaque tour jusqu'à son remplacement. La position est relative : la fréquence se calcule au moment de la réservation, donc une idée figée suit les changements du champ sans être réécrite.",
    "g.gocce.forma": "Forme du son",
    "g.gocce.insieme": "Ensemble",
    "g.gocce.man": "Boutons",
    "g.gocce.timbri": "Les huit timbres",

    "g.p.attacco":  "Temps de montée de l'enveloppe.",
    "g.p.coda":     "Temps de descente. Détermine la longueur du trait radial sur le cadran.",
    "g.p.inarm":    "Écart des partiels par rapport aux multiples entiers de la fondamentale.",
    "g.p.brill":    "Fréquence de coupure du passe-bas de voix, en échelle exponentielle.",
    "g.p.corpo":    "Poids relatif de la fondamentale par rapport aux partiels.",
    "g.p.addens":   "Fraction du tour dans laquelle tombent les événements d'une idée. Aux valeurs basses ils se rassemblent au début du tour ; à 100 ils occupent tout le tour.",
    "g.p.densita":  "Nombre maximal d'événements par tour. La valeur effective de chaque idée est tirée au sort sous cette limite à la naissance de l'idée.",
    "g.p.spazio":   "Départ vers la réverbération commune de la voie.",
    "g.p.registro": "Largeur de la fenêtre sur le champ harmonique. Curseur au maximum, la fenêtre couvre un peu plus de trois octaves.",
    "g.p.calore":   "Paramètre unique du timbre : chacun des huit l'interprète à sa manière, et la couronne en montre la valeur effective après l'influence de l'heure du jour.",

    "g.tim.vetro":   "Sinusoïde avec deux partiels inharmoniques et longue traîne.",
    "g.tim.legno":   "Impulsion filtrée, résonance médium, décroissance rapide.",
    "g.tim.onda":    "Triangulaire filtrée, attaque douce, aucun partiel inharmonique.",
    "g.tim.soffio":  "Bruit filtré à bande étroite accordé sur la hauteur.",
    "g.tim.corda":   "Dent de scie avec passe-bas descendant pendant la traîne. Ce n'est pas une Karplus-Strong : une boucle sur un nœud de retard ne descend pas sous 128 échantillons, ce qui fixerait la hauteur maximale à 375 Hz.",
    "g.tim.metallo": "Six partiels en rapports inharmoniques fixes, décroissances différenciées.",
    "g.tim.canna":   "Carrée filtrée avec formant fixe, attaque bruitée.",
    "g.tim.sabbia":  "Bruit large bande à enveloppe très brève : du grain, pas une hauteur.",

    "g.tess.t": "Tissus",
    "g.tess.1": "Sons tenus à enveloppe en deux temps, de quelques secondes à une minute. Contrairement aux gouttes, ce ne sont pas des matières différentes mais des manières différentes d'être instable : chacun des huit fait bouger un paramètre interne, car un tenu parfaitement immobile cesse au bout de quelques secondes d'être perçu comme un son.",
    "g.tess.2": "La somme du bus se normalise sur les enveloppes et non sur le nombre de voix ouvertes : la compensation lit la fonction même qui écrit l'automation, donc il n'y a pas de saut de niveau à l'instant où une voix commence à s'ouvrir.",
    "g.tess.timbri": "Les huit tenues",

    "g.p.apertura":  "Temps de montée de l'enveloppe.",
    "g.p.chiusura":  "Temps de descente.",
    "g.p.movimento": "Amplitude du mouvement interne. Ce qui bouge dépend de la tenue choisie.",
    "g.p.tbrill":    "Fréquence de coupure du passe-bas de voix.",
    "g.p.tcorpo":    "Poids de la fondamentale par rapport aux bandes supérieures.",
    "g.p.intreccio": "Durée d'une tenue en fraction de la période de sa ligne, et par là combien restent ouvertes ensemble.",
    "g.p.livello":   "Niveau de la classe par rapport au premier plan, en décibels. C'est un paramètre du modèle, distinct de la tirette de mixage : la dérive le déplace de ±9 et une humeur le réécrit.",
    "g.p.tspazio":   "Départ vers la réverbération commune de la voie.",
    "g.p.tregistro": "Largeur de la fenêtre sur le champ harmonique, avec repliement par octaves qui conserve la classe de hauteur.",
    "g.p.passo":     "Vitesse du mouvement interne. L'unité dépend de la tenue : centièmes de demi-ton, hertz de battement, largeur de bande.",

    "g.ten.bordone":  "Fondamentale avec quinte et octave, dérive d'accord très lente.",
    "g.ten.marea":    "Deux bandes de bruit filtré qui échangent leur énergie.",
    "g.ten.attrito":  "Dent de scie dans un passe-bas dont la fréquence oscille : du grain dans la hauteur.",
    "g.ten.frangia":  "Deux sinusoïdes séparées de quelques hertz. Le battement est leur différence, et l'allure l'écrit en hertz.",
    "g.ten.corrente": "Bruit filtré dont la bande se déplace en continu.",
    "g.ten.cavo":     "Trois formants qui se déplacent entre la position du « a » et celle du « ou ». Hauteur fixe, spectre en mouvement.",
    "g.ten.brina":    "Partiels aigus dont les amplitudes s'allument et s'éteignent indépendamment.",
    "g.ten.soglia":   "Bruit haute fréquence dont seul le niveau varie. Aucune hauteur, aucun battement.",

    "g.ins.t": "Inserts",
    "g.ins.1": "Chaque classe a un insert sur sa voie, entre le normalisateur et le couple niveau/départ. L'effet se choisit dans le menu sous le cadran ; les trois boutons changent de fonction avec l'effet mais gardent leur position, comme les boutons d'un panneau qui est extérieur à l'effet.",
    "g.ins.2": "La réverbération n'est pas parmi les effets : le départ vers la salle commune est déjà la commande Espace de la couronne de chaque classe.",
    "g.ins.3": "Le changement d'effet en cours de lecture passe par un fondu de 30 ms à la descente et à la remontée.",

    "g.eff.niente":  "Insert vide. Les trois boutons sont désactivés.",
    "g.eff.eco":     "Ligne de retard avec réinjection et passe-bas dans la boucle à 2,8 kHz. Mélange à puissance constante entre le direct et les répétitions.",
    "g.eff.tremolo": "Modulation d'amplitude sur les deux canaux, avec déphasage réglable entre la droite et la gauche.",
    "g.eff.coro":    "Deux copies retardées de 11 et 17 ms, modulées en opposition de phase. La largeur naît de la différence entre les deux côtés.",
    "g.eff.filtro":  "Passe-bas résonant avec oscillateur lent sur la coupure. En série, non mélangé.",

    "g.pe.tempo":      "Temps de retard.",
    "g.pe.ritorni":    "Gain de boucle. Le maximum est 0,8 : au-delà, la traîne croît au lieu de descendre.",
    "g.pe.quantita":   "Mélange entre signal direct et effet, à puissance constante.",
    "g.pe.velocita":   "Fréquence de l'oscillateur de modulation.",
    "g.pe.profondita": "Amplitude de la modulation.",
    "g.pe.larghezza":  "Déphasage de la modulation entre les deux canaux. À 0° le son pulse au centre, à 180° il passe d'un côté à l'autre.",
    "g.pe.taglio":     "Fréquence de coupure, en échelle exponentielle.",
    "g.pe.risonanza":  "Facteur de qualité du filtre.",
    "g.pe.movimento":  "Excursion de l'oscillateur lent sur la coupure, en octaves autour de la fréquence réglée.",

    "g.pae.t": "Paysage",
    "g.pae.1": "Lit un matériau enregistré — un fichier chargé ou une prise au microphone — ralenti d'un facteur de 1 à 64 sans le transposer. Le matériau n'est pas conservé : il vit tant que la page reste ouverte.",
    "g.pae.2": "Le ralenti ne s'obtient pas en lisant le tampon plus lentement, ce qui baisserait aussi la hauteur. La matière se lit à vitesse naturelle dans des fenêtres qui se recouvrent, et ce qui avance lentement est le point d'où les fenêtres sont prises. Il y a quatre fenêtres à chaque instant, en cloches décalées : avec moins, on entend la limite de l'une à l'autre.",
    "g.pae.3": "L'accord ne transpose pas le matériau : il place derrière lui un banc de passe-bandes accordés sur les degrés de la collection courante, entre 110 et 1500 Hz. Le banc tient les indices du champ, non les fréquences : au pas de quinte les filtres se déplacent avec une constante longue, et quatre filtres sur cinq réécrivent la même valeur.",
    "g.pae.4": "Le segment se choisit avec les deux poignées au-dessus de l'onde. En les inversant le segment se reflète au lieu de s'annuler. La bande claire qui avance dans le segment est la fenêtre de lecture courante.",
    "g.pae.5": "La tête de lecture a cinq modes. AVANT la fait avancer vers la fin du segment et la ramène au début ; ARRIÈRE la fait reculer vers le début. PENDULE la fait rebondir entre les deux bornes. ARRÊT la maintient au point où elle se trouve. ALÉATOIRE la fait sauter à un point au hasard du segment, lit vers l'avant pendant la durée de la halte, puis saute de nouveau ; le point d'arrivée du saut suivant est marqué en pointillé sur l'onde. Dans tous les modes les fenêtres sonnent vers l'avant à vitesse naturelle : c'est la tête qui change de sens, pas le matériau.",

    "g.p.segmento":  "Bornes du segment parcouru, en centièmes de la durée du matériau.",
    "g.p.lettura":   "Façon dont la tête parcourt le segment : avant, arrière, pendule, arrêt, aléatoire.",
    "g.p.sosta":     "Durée de lecture de chaque zone en mode ALÉATOIRE, en échelle exponentielle. Désactivée dans les autres modes.",
    "g.p.rallenta":  "Facteur de ralentissement de la tête de lecture.",
    "g.p.velo":      "Durée d'une fenêtre de lecture.",
    "g.p.sparpaglio": "Écart aléatoire sur le point de départ de chaque fenêtre. À zéro elles partent toutes du même point et la somme devient un filtre en peigne.",
    "g.p.accordatura": "Mélange entre matériau brut et matériau passé par le banc résonant.",
    "g.p.fuoco":     "Facteur de qualité des filtres du banc. Sous 8 les filtres ne distinguent plus un degré du demi-ton voisin ; le gain du banc croît avec le foyer de façon à ne pas déplacer le niveau.",
    "g.p.pcoda":     "Temps de réverbération du réseau interne du paysage.",
    "g.p.ptono":     "Fréquence d'amortissement dans la boucle de réverbération.",
    "g.p.priverbero": "Mélange entre signal direct et traîne.",

    "g.der.t": "Dérive",
    "g.der.1": "Le champ harmonique est une pentatonique anhémitonique — degrés 0, 2, 4, 7, 9 — répliquée sur cinq octaves, soit vingt-cinq hauteurs. Les deux classes lisent le même champ et le même barycentre ; seule la largeur de la fenêtre change.",
    "g.der.2": "Toutes les 2′ 30″ exactement la collection se déplace d'une quinte. Entre une pentatonique et sa quinte une note sur cinq change : quatre degrés sur cinq restent valides des deux côtés. Une tenue destinée à traverser le pas est accordée sur un degré qui survit, pour ne pas rester hors collection pendant qu'elle sonne.",
    "g.der.3": "Le barycentre est le mouvement continu : les hauteurs restent en place et ce qui glisse est le point autour duquel elles sont choisies. Six canaux en rapports irrationnels le gouvernent, donc la pièce ne repasse jamais exactement où elle est déjà passée. La piste en bas de section en montre quinze minutes ; les colonnes en ambre marquent les points d'inversion.",
    "g.der.4": "La commande MATIÈRE décide de ce qui arrive aux idées au pas de quinte.",

    "g.p.ancora": "Les idées restent celles qu'a fixées l'humeur : elles changent de hauteur en suivant le champ, mais la suite reste la même.",
    "g.p.deriva": "Les idées se régénèrent à chaque pas de quinte.",

    "g.banco.t": "Console",
    "g.banco.1": "Sortie du studio. Chaque voie a un normalisateur écrit par la source — qui compense le nombre de voix ouvertes — un curseur de niveau et un départ vers la réverbération commune, dans cet ordre : la réverbération reçoit le signal déjà compensé.",
    "g.banco.2": "L'égaliseur a huit bandes à fréquence fixe, course ±8 dB. La courbe tracée au-dessus des tirettes est la réponse réelle des filtres, demandée au graphe audio, non une interpolation des positions.",
    "g.banco.3": "Deux sorties différentes. L'enregistrement en direct capte la séance avec les mouvements des curseurs dedans. L'export rend la pièce hors temps réel, bien plus vite que le temps réel, sans aucune main dedans : il parcourt le même modèle et les mêmes réglages, donc le fichier sonne comme ce que l'on écoute.",

    "g.p.eq":         "Huit bandes : 20 Hz shelf, 50 · 100 · 500 · 1k · 5k · 10k cloche, 18 kHz shelf.",
    "g.p.mixer":      "Niveau des trois voies et de la sortie. Sur la voie des tissus il s'ajoute en décibels au paramètre Niveau du modèle.",
    "g.p.limitatore": "Deux étages en cascade sur la sortie. La lecture indique la réduction de gain instantanée.",
    "g.p.picco":      "Crête du signal de sortie, avec maintien de 20 dB par seconde.",
    "g.p.registra":   "Prise en direct sur la sortie de la console. Le fichier sort en wav 24 bits stéréo.",
    "g.p.esporta":    "Rendu hors temps réel de la durée choisie, en wav 24 bits stéréo.",

    "g.mood.t": "Humeurs",
    "g.mood.1": "Seize configurations complètes, huit par classe. Une humeur écrit d'un coup les paramètres, les quatre périodes des lignes et le nom du timbre, car la configuration temporelle fait partie du caractère autant que le son. L'écriture est immédiate et non lissée : une humeur est un plan de coupe, pas un geste.",
    "g.mood.2": "Chaque timbre n'apparaît qu'une fois par tableau : en parcourant les huit on traverse bien les huit sons.",

    "g.infl.t": "Influences extérieures",
    "g.infl.1": "Deux grandeurs prises à l'horloge du système modifient les valeurs effectives sans toucher à la position des curseurs. L'heure du jour déplace chaleur, espace et couleur d'ensemble des gouttes ; la saison déplace registre, émergence, fondu et allure des tissus. L'écart entre la position du curseur et la valeur effective se lit en comparant le curseur en colonne avec la couronne autour du cadran.",

    "g.tav.t": "Lecture de la planche",
    "g.tav.1": "Chaque classe a un cadran avec quatre anneaux concentriques, un par ligne, numérotés en chiffres romains. Un point parcourt chaque anneau et indique la phase audible, non celle de l'ordonnanceur.",
    "g.tav.2": "Une goutte est un trait radial qui traverse l'anneau : sa longueur est le registre de la note. Une tenue est un arc aussi long que la note reste en l'air ; il est ténu quand elle est passée, à l'encre pleine pendant qu'elle sonne.",
    "g.tav.3": "L'ambre marque quatre choses et pas davantage : ce qui sonne maintenant, chaque valeur numérique, le point où le barycentre s'est inversé, et le début d'une section. Quand une goutte sonne, un fil la relie au centre du cadran ; si deux gouttes de lignes différentes tombent à moins de 0,18 s l'une de l'autre, un second fil les relie entre elles.",
    "g.tav.4": "La couronne autour du cadran montre les valeurs effectives des trois commandes de l'Ensemble ; les curseurs en colonne montrent où est la main. Entre les deux il y a la dérive, l'heure et la saison.",

    "g.spec.t": "Spécifications",
    "g.spec.1": "L'application ne fait aucune requête réseau : elle s'ouvre depuis un fichier local et fonctionne hors connexion. Les fichiers audio de l'utilisateur sont décodés dans le navigateur et ne quittent pas la machine.",
    "g.spec.motore":   "Web Audio API, aucune bibliothèque",
    "g.spec.uscita":   "wav 24 bits stéréo, 48 kHz",
    "g.spec.buffer":   "1024 échantillons (latencyHint playback)",
    "g.spec.rete":     "aucune requête réseau",
    "g.spec.memoria":  "les matériaux du paysage ne sont pas conservés d'une ouverture à l'autre",
    "g.spec.lingua":   "la langue choisie est mémorisée ; le thème non, il est demandé au système",
  },

  /* --------------------------------------------------------------- inglese */
  en: {
    "g.titolo":    "Hiroshi · Guide",
    "g.torna":     "Back to the instrument",
    "g.occhiello": "Operating manual",
    "g.intro":     "Hiroshi is an ambient music generator that runs in the browser. It produces two classes of event — short impulses and sustained tones — on eight independent cyclic lines, tunes them to a slowly shifting harmonic field, and sums them in an output desk with equaliser, limiter and recorder. A fourth source plays recorded material slowed down without transposition. This document describes every control: range, unit and effect on the signal.",

    "g.col.par":    "Parameter",
    "g.col.corsa":  "Range",
    "g.col.fun":    "Function",
    "g.col.nome":   "Name",
    "g.col.desc":   "Synthesis",
    "g.col.valore": "Value",
    "g.col.periodi": "Periods",
    "g.corsa.ott":    "0 – 3.2 oct",
    "g.corsa.ottmov": "0 – 2 oct",
    "g.corsa.min":    "1 – 20 min",
    "g.spec.krete":  "Network",
    "g.spec.kmem":   "Memory",

    "g.pan.t": "Signal chain",
    "g.pan.catena": "source → normaliser → insert → level → sum → colour → equaliser → limiter → output\nlevel → send → reverb → sum",
    "g.pan.1": "The three sources are independent and can be switched off one at a time with the ON button under their mixer channel. Each source has a channel in the desk: normaliser, effect insert, level fader and send to the shared reverb. The sum passes through an ensemble colour filter, the eight-band equaliser and a two-stage limiter.",
    "g.pan.2": "Switching a source off does not pause the model: cycles and idea renewal carry on, and switching it back on you hear where the piece has got to, not where you left it.",
    "g.pan.3": "The Landscape source has its own internal reverb and does not use the shared send: its tail is part of the sound, not the room the sound is in.",

    "g.tempo.t": "Time structure",
    "g.tempo.1": "Eight cyclic lines, four per class. Each line has its own period, adjustable between 3 and 30 s for drops and between 7 and 60 s for weaves, and keeps an independent phase. The generator fills one cycle at a time and books events 0.15 s ahead.",
    "g.tempo.2": "The four periods within a class are pairwise coprime. The combination of the eight phases repeats only after the least common multiple of the periods: with the opening values realignment falls beyond sixty hours. The REALIGN readout at the head of section 05 gives that time for the current periods.",
    "g.tempo.3": "Each line row exposes the cycle length, a mute switch and a regenerate control, which replaces that line's idea without touching the others.",

    "g.gocce.t": "Drops",
    "g.gocce.1": "Short impulses with a percussive envelope. Each line holds an idea — a sequence of positions in the harmonic field — and repeats it every cycle until it is replaced. The position is relative: frequency is computed at booking time, so a frozen idea follows changes in the field without being rewritten.",
    "g.gocce.forma": "Shape of the sound",
    "g.gocce.insieme": "Together",
    "g.gocce.man": "Knobs",
    "g.gocce.timbri": "The eight timbres",

    "g.p.attacco":  "Envelope rise time.",
    "g.p.coda":     "Envelope fall time. Sets the length of the radial tick on the dial.",
    "g.p.inarm":    "Departure of the partials from integer multiples of the fundamental.",
    "g.p.brill":    "Cutoff frequency of the voice low-pass, on an exponential scale.",
    "g.p.corpo":    "Weight of the fundamental relative to the partials.",
    "g.p.addens":   "Fraction of the cycle within which an idea's events fall. At low values they gather at the start of the cycle; at 100 they spread over the whole cycle.",
    "g.p.densita":  "Maximum number of events per cycle. The actual figure for each idea is drawn under this limit when the idea is born.",
    "g.p.spazio":   "Send to the channel's shared reverb.",
    "g.p.registro": "Width of the window onto the harmonic field. At full travel the window covers a little over three octaves.",
    "g.p.calore":   "The timbre's single parameter: each of the eight reads it its own way, and the crown shows the effective value after the influence of the hour of day.",

    "g.tim.vetro":   "Sine with two inharmonic partials and a long tail.",
    "g.tim.legno":   "Filtered impulse, mid resonance, fast decay.",
    "g.tim.onda":    "Filtered triangle, soft attack, no inharmonic partials.",
    "g.tim.soffio":  "Narrow-band filtered noise tuned to the pitch.",
    "g.tim.corda":   "Sawtooth with a low-pass falling through the tail. Not a Karplus-Strong: a loop on a delay node cannot go below 128 samples, which would cap the pitch at 375 Hz.",
    "g.tim.metallo": "Six partials at fixed inharmonic ratios, with differentiated decay.",
    "g.tim.canna":   "Filtered square with a fixed formant, noisy attack.",
    "g.tim.sabbia":  "Wide-band noise with a very short envelope: grain, not pitch.",

    "g.tess.t": "Weaves",
    "g.tess.1": "Sustained tones with a two-stage envelope, from a few seconds to a minute. Unlike the drops these are not different materials but different ways of being unstable: each of the eight moves one internal parameter, because a perfectly still sustain stops being heard as a sound after a few seconds.",
    "g.tess.2": "The bus sum is normalised on the envelopes, not on the count of open voices: the compensation reads the same function that writes the automation, so there is no level step at the instant a voice begins to open.",
    "g.tess.timbri": "The eight sustains",

    "g.p.apertura":  "Envelope rise time.",
    "g.p.chiusura":  "Envelope fall time.",
    "g.p.movimento": "Depth of the internal motion. What moves depends on the sustain selected.",
    "g.p.tbrill":    "Cutoff frequency of the voice low-pass.",
    "g.p.tcorpo":    "Weight of the fundamental relative to the upper bands.",
    "g.p.intreccio": "Length of a sustain as a fraction of its line's period, and with it how many stay open at once.",
    "g.p.livello":   "Level of the class relative to the foreground, in decibels. This is a model parameter, distinct from the mixer fader: the drift moves it by ±9 and a mood rewrites it.",
    "g.p.tspazio":   "Send to the channel's shared reverb.",
    "g.p.tregistro": "Width of the window onto the harmonic field, with octave folding that preserves pitch class.",
    "g.p.passo":     "Rate of the internal motion. The unit depends on the sustain: cents, beat frequency in hertz, bandwidth.",

    "g.ten.bordone":  "Fundamental with fifth and octave, very slow tuning drift.",
    "g.ten.marea":    "Two bands of filtered noise trading energy.",
    "g.ten.attrito":  "Sawtooth inside a low-pass whose frequency oscillates: grain inside the pitch.",
    "g.ten.frangia":  "Two sines a few hertz apart. The beat is their difference, and Pace writes it in hertz.",
    "g.ten.corrente": "Filtered noise with a continuously moving band.",
    "g.ten.cavo":     "Three formants moving between the position of an «a» and that of a «u». Fixed pitch, moving spectrum.",
    "g.ten.brina":    "High partials whose amplitudes switch on and off independently.",
    "g.ten.soglia":   "High-frequency noise with only its level varying. No pitch, no beating.",

    "g.ins.t": "Inserts",
    "g.ins.1": "Each class has an insert on its own channel, between the normaliser and the level/send pair. The effect is chosen from the menu under the dial; the three knobs change function with the effect but keep their position, like knobs on a panel that sits outside the effect.",
    "g.ins.2": "Reverb is not among the effects: the send to the shared room is already the Space control on each class's crown.",
    "g.ins.3": "Changing effect while playing goes through a 30 ms fade down and back up.",

    "g.eff.niente":  "Empty insert. The three knobs are disabled.",
    "g.eff.eco":     "Delay line with feedback and a low-pass in the loop at 2.8 kHz. Constant-power mix between dry and repeats.",
    "g.eff.tremolo": "Amplitude modulation on both channels, with adjustable phase offset between right and left.",
    "g.eff.coro":    "Two copies delayed by 11 and 17 ms, modulated in antiphase. Width comes from the difference between the two sides.",
    "g.eff.filtro":  "Resonant low-pass with a slow oscillator on the cutoff. In series, not mixed.",

    "g.pe.tempo":      "Delay time.",
    "g.pe.ritorni":    "Loop gain. Maximum is 0.8: above that the tail grows instead of falling.",
    "g.pe.quantita":   "Mix between direct signal and effect, at constant power.",
    "g.pe.velocita":   "Frequency of the modulation oscillator.",
    "g.pe.profondita": "Depth of the modulation.",
    "g.pe.larghezza":  "Phase offset of the modulation between the two channels. At 0° the sound pulses in the centre, at 180° it moves from side to side.",
    "g.pe.taglio":     "Cutoff frequency, on an exponential scale.",
    "g.pe.risonanza":  "Filter Q.",
    "g.pe.movimento":  "Excursion of the slow oscillator on the cutoff, in octaves around the set frequency.",

    "g.pae.t": "Landscape",
    "g.pae.1": "Plays recorded material — a loaded file or a microphone take — slowed by a factor between 1 and 64 without transposing it. The material is not kept: it lives as long as the page stays open.",
    "g.pae.2": "The slowdown is not obtained by reading the buffer more slowly, which would lower the pitch as well. The material is read at natural speed in overlapping windows, and what walks slowly is the point the windows are taken from. There are four windows at any instant, in offset bells: with fewer, the edge from one to the next becomes audible.",
    "g.pae.3": "Tuning does not transpose the material: it places behind it a bank of band-pass filters tuned to the degrees of the current collection, between 110 and 1500 Hz. The bank holds the indices of the field, not the frequencies: at a fifth step the filters move with a long time constant, and four filters out of five rewrite the same value.",
    "g.pae.4": "The segment is set with the two handles above the waveform. Reversing them mirrors the segment instead of collapsing it. The pale band travelling inside the segment is the current read window.",
    "g.pae.5": "The read head has five modes. FORWARD moves it towards the end of the segment and wraps it back to the start; REVERSE moves it towards the start. PENDULUM bounces it between the two bounds. HOLD keeps it where it is. RANDOM jumps it to a random point in the segment, reads forwards from there for the dwell time, then jumps again; the landing point of the next jump is dashed on the waveform. In every mode the windows play forwards at natural speed: the head changes direction, the material does not.",

    "g.p.segmento":  "Bounds of the segment traversed, in hundredths of the material's length.",
    "g.p.lettura":   "How the head travels through the segment: forward, reverse, pendulum, hold, random.",
    "g.p.sosta":     "Reading time of each area in RANDOM mode, on an exponential scale. Disabled in the other modes.",
    "g.p.rallenta":  "Slowdown factor of the read head.",
    "g.p.velo":      "Length of one read window.",
    "g.p.sparpaglio": "Random offset on each window's starting point. At zero every window starts from the same point and the sum becomes a comb filter.",
    "g.p.accordatura": "Mix between raw material and material passed through the resonant bank.",
    "g.p.fuoco":     "Q of the bank's filters. Below 8 the filters no longer tell a degree from the neighbouring semitone; the bank's gain rises with focus so that the level does not move.",
    "g.p.pcoda":     "Reverberation time of the landscape's internal network.",
    "g.p.ptono":     "Damping frequency inside the reverb loop.",
    "g.p.priverbero": "Mix between direct signal and tail.",

    "g.der.t": "Drift",
    "g.der.1": "The harmonic field is an anhemitonic pentatonic — degrees 0, 2, 4, 7, 9 — replicated over five octaves, for twenty-five pitches. Both classes read the same field and the same centroid; only the width of the window differs.",
    "g.der.2": "Every 2′ 30″ exactly the collection moves by a fifth. Between a pentatonic and its fifth one note in five changes: four degrees out of five remain valid in both. A sustain due to cross the step is tuned to a degree that survives, so it does not sit outside the collection while sounding.",
    "g.der.3": "The centroid is the continuous motion: the pitches stay put and what glides is the point they are drawn around. Six channels at irrational ratios govern it, so the piece never passes exactly where it has already been. The lane at the foot of the section shows fifteen minutes of it; the amber columns mark the turning points.",
    "g.der.4": "The MATERIAL control decides what happens to the ideas at a fifth step.",

    "g.p.ancora": "The ideas stay as the mood set them: they change pitch following the field, but the sequence stays the same.",
    "g.p.deriva": "The ideas are regenerated at every fifth step.",

    "g.banco.t": "Desk",
    "g.banco.1": "Studio output. Each channel has a normaliser written by the source — compensating for how many voices are open — a level fader and a send to the shared reverb, in that order: the reverb receives the already compensated signal.",
    "g.banco.2": "The equaliser has eight fixed-frequency bands, ±8 dB range. The curve drawn above the faders is the real response of the filters, asked of the audio graph, not an interpolation of the fader positions.",
    "g.banco.3": "Two different outputs. Live recording captures the session with the fader moves in it. Export renders the piece offline, far faster than real time, with no hand in it: it walks the same model and the same settings, so the file sounds like what you are hearing.",

    "g.p.eq":         "Eight bands: 20 Hz shelf, 50 · 100 · 500 · 1k · 5k · 10k bell, 18 kHz shelf.",
    "g.p.mixer":      "Level of the three channels and of the output. On the weaves channel it adds in decibels to the model's Level parameter.",
    "g.p.limitatore": "Two cascaded stages on the output. The readout gives instantaneous gain reduction.",
    "g.p.picco":      "Peak of the output signal, with a 20 dB per second hold.",
    "g.p.registra":   "Live capture from the desk output. The file comes out as 24-bit stereo wav.",
    "g.p.esporta":    "Offline render of the chosen length, as 24-bit stereo wav.",

    "g.mood.t": "Moods",
    "g.mood.1": "Sixteen complete configurations, eight per class. A mood writes the parameters, the four line periods and the timbre name in one go, because the time configuration is as much part of the character as the sound. The write is immediate and not smoothed: a mood is a cut, not a gesture.",
    "g.mood.2": "Each timbre appears once per table: going through the eight takes you through all eight sounds.",

    "g.infl.t": "External influences",
    "g.infl.1": "Two quantities taken from the system clock modify the effective values without moving the faders. The hour of day moves warmth, space and ensemble colour of the drops; the season moves register, surfacing, fading and pace of the weaves. The gap between fader position and effective value is read by comparing the fader in the column with the crown around the dial.",

    "g.tav.t": "Reading the board",
    "g.tav.1": "Each class has a dial with four concentric rings, one per line, numbered in Roman numerals. A dot travels each ring and shows the audible phase, not the scheduler's.",
    "g.tav.2": "A drop is a radial tick crossing the ring: its length is the register of the note. A sustain is an arc as long as the note stays up; faint once it has passed, full ink while it sounds.",
    "g.tav.3": "Amber marks four things and no more: what is sounding now, every numeric value, the point where the centroid turned, and the start of a section. When a drop sounds a thread joins it to the centre of the dial; if two drops on different lines fall less than 0.18 s apart, a second thread joins them to each other.",
    "g.tav.4": "The crown around the dial shows the effective values of the three Together controls; the faders in the column show where the hand is. Between the two sit the drift, the hour and the season.",

    "g.spec.t": "Specifications",
    "g.spec.1": "The application makes no network requests: it opens from a local file and works offline. The user's audio files are decoded in the browser and never leave the machine.",
    "g.spec.motore":   "Web Audio API, no libraries",
    "g.spec.uscita":   "24-bit stereo wav, 48 kHz",
    "g.spec.buffer":   "1024 samples (latencyHint playback)",
    "g.spec.rete":     "no network requests",
    "g.spec.memoria":  "landscape material is not kept between sessions",
    "g.spec.lingua":   "the chosen language is remembered; the theme is not, and is asked of the system",
  },

  /* ------------------------------------------------------------- giapponese */
  ja: {
    "g.titolo":    "Hiroshi · 手引き",
    "g.torna":     "楽器に戻る",
    "g.occhiello": "取扱説明",
    "g.intro":     "Hiroshiはブラウザで動く環境音楽の生成器です。二種類の音——短い打点と持続音——を、位相の独立した八本の循環線の上に生成し、ゆっくり移動する音高の場に合わせ、等化器・制限器・録音を備えた出力卓でまとめます。第四の音源は、録音した素材を音高を変えずに減速して鳴らします。本書は各操作子の可動範囲、単位、信号への作用を記します。",

    "g.col.par":    "操作子",
    "g.col.corsa":  "範囲",
    "g.col.fun":    "機能",
    "g.col.nome":   "名称",
    "g.col.desc":   "合成方式",
    "g.col.valore": "値",
    "g.col.periodi": "周期",
    "g.corsa.ott":    "0 – 3.2オクターブ",
    "g.corsa.ottmov": "0 – 2オクターブ",
    "g.corsa.min":    "1 – 20分",
    "g.spec.krete":  "通信",
    "g.spec.kmem":   "記憶",

    "g.pan.t": "信号経路",
    "g.pan.catena": "音源 → 正規化器 → 挿入効果 → 音量 → 合計 → 色 → 等化器 → 制限器 → 出力\n音量 → 送り → 残響 → 合計",
    "g.pan.1": "三つの音源は独立しており、卓の各系統の下にあるONで個別に切れます。各音源は卓に一系統ずつ持ち、正規化器、効果の挿入、音量、共通残響への送りの順に通ります。合計は全体の色を決める濾波器、八帯域の等化器、二段の制限器を経て出力されます。",
    "g.pan.2": "音源を切っても模型は止まりません。周期も楽想の入れ替わりも進み続けるので、入れ直すと止めた地点ではなく、いま到達している地点が聞こえます。",
    "g.pan.3": "風景の残響は音源の内部にあり、共通の送りは使いません。その余韻は音の置かれた場所ではなく、音そのものの一部だからです。",

    "g.tempo.t": "時間の構造",
    "g.tempo.1": "循環する八本の線、各種類に四本。線ごとに周期を持ち、しずくは3〜30秒、織りは7〜60秒で調整でき、位相は互いに独立です。生成器は一周ずつ埋め、0.15秒先まで予約します。",
    "g.tempo.2": "同じ種類の四つの周期は二つずつ互いに素です。八つの位相の組み合わせは周期の最小公倍数を経てはじめて繰り返します。初期値では一巡までに六十時間以上かかります。05節の冒頭にある「一巡」の表示が、現在の周期での値です。",
    "g.tempo.3": "各線の行には一周の長さ、消音の切り替え、楽想を作り直す操作子があります。作り直しはその線だけに効きます。",

    "g.gocce.t": "しずく",
    "g.gocce.1": "打楽器的な包絡を持つ短い打点です。各線は楽想——音高の場における位置の並び——を保ち、差し替えられるまで毎周繰り返します。位置は相対値で、周波数は予約の時点で計算されるため、固定した楽想も書き換えずに場の変化へ追従します。",
    "g.gocce.forma": "音のかたち",
    "g.gocce.insieme": "全体",
    "g.gocce.man": "つまみ",
    "g.gocce.timbri": "八つの音色",

    "g.p.attacco":  "包絡の立ち上がり時間。",
    "g.p.coda":     "包絡の減衰時間。円盤上の放射状の目盛りの長さを決めます。",
    "g.p.inarm":    "部分音を基音の整数倍からずらす量。",
    "g.p.brill":    "声部の低域通過濾波器の遮断周波数。指数目盛。",
    "g.p.corpo":    "部分音に対する基音の重み。",
    "g.p.addens":   "楽想の各音が収まる一周内の割合。低い値では周の頭に集まり、100では一周に散ります。",
    "g.p.densita":  "一周あたりの音数の上限。楽想ごとの実数はこの上限内で、楽想が生まれる時に決まります。",
    "g.p.spazio":   "その系統から共通残響への送り。",
    "g.p.registro": "音高の場に開く窓の幅。最大で三オクターブ強を覆います。",
    "g.p.calore":   "音色ごとの唯一の変数で、八つがそれぞれ独自に解釈します。円環には時刻の影響を受けたあとの実効値が出ます。",

    "g.tim.vetro":   "正弦波に二つの非調和部分音、長い余韻。",
    "g.tim.legno":   "濾波した打点、中域の共振、速い減衰。",
    "g.tim.onda":    "濾波した三角波、柔らかい立ち上がり、非調和部分音なし。",
    "g.tim.soffio":  "音高に合わせた狭帯域の濾波雑音。",
    "g.tim.corda":   "余韻の途中で遮断周波数が下がる鋸歯状波。カープラス・ストロングではありません。遅延節点の帰還は128標本を下回れず、最高音が375 Hzに制限されるためです。",
    "g.tim.metallo": "固定した非調和比の六つの部分音、減衰は各々異なります。",
    "g.tim.canna":   "固定共振域を持つ濾波矩形波、立ち上がりに雑音。",
    "g.tim.sabbia":  "きわめて短い包絡の広帯域雑音。音高ではなく粒です。",

    "g.tess.t": "織り",
    "g.tess.1": "二段の包絡を持つ持続音で、数秒から一分まで。しずくと違い、これらは異なる素材ではなく、異なる不安定さの型です。八つそれぞれが内部の変数をひとつ動かします。完全に静止した持続音は数秒で音として知覚されなくなるからです。",
    "g.tess.2": "母線の合計は、開いている声の数ではなく包絡で正規化します。補正は自動化を書くのと同じ関数を読むので、声が開き始めた瞬間に音量が段になることがありません。",
    "g.tess.timbri": "八つの持続音",

    "g.p.apertura":  "包絡の立ち上がり時間。",
    "g.p.chiusura":  "包絡の減衰時間。",
    "g.p.movimento": "内部の動きの幅。何が動くかは選んだ持続音によります。",
    "g.p.tbrill":    "声部の低域通過濾波器の遮断周波数。",
    "g.p.tcorpo":    "上の帯域に対する基音の重み。",
    "g.p.intreccio": "一つの持続音の長さを、その線の周期に対する割合で決めます。同時に開く数もこれで決まります。",
    "g.p.livello":   "前景に対するこの種類の音量、単位はデシベル。混合卓の推子とは別の、模型側の変数です。漂流が±9動かし、気分が書き換えます。",
    "g.p.tspazio":   "その系統から共通残響への送り。",
    "g.p.tregistro": "音高の場に開く窓の幅。オクターブの折り返しがあり、音名は保たれます。",
    "g.p.passo":     "内部の動きの速さ。単位は持続音により、セント、うなりのヘルツ、帯域幅と変わります。",

    "g.ten.bordone":  "基音に五度と八度、きわめて遅い音程の漂い。",
    "g.ten.marea":    "濾波雑音の二帯域がエネルギーを受け渡します。",
    "g.ten.attrito":  "遮断周波数が揺れる低域通過濾波器の中の鋸歯状波。音高の中の粒です。",
    "g.ten.frangia":  "数ヘルツ離れた二つの正弦波。うなりはその差であり、「速さ」がそれをヘルツで直接書きます。",
    "g.ten.corrente": "帯域が絶えず移動する濾波雑音。",
    "g.ten.cavo":     "「あ」の位置と「う」の位置のあいだを移動する三つの共振域。音高は動かず、スペクトルが動きます。",
    "g.ten.brina":    "高い部分音が、それぞれ独立に点いたり消えたりします。",
    "g.ten.soglia":   "音量だけが変化する高域の雑音。音高もうなりもありません。",

    "g.ins.t": "挿入効果",
    "g.ins.1": "各種類は自分の系統に効果を一つ挿入できます。位置は正規化器と音量・送りの組のあいだです。効果は円盤の下の一覧から選び、三つのつまみは効果に応じて役割が変わりますが位置は変わりません。効果の外にある操作盤のつまみと同じ扱いです。",
    "g.ins.2": "残響は効果の一覧にありません。共通の残響への送りは、すでに各種類の円環にある「空間」だからです。",
    "g.ins.3": "再生中に効果を切り替えると、30ミリ秒で下げ、差し替え、30ミリ秒で戻します。",

    "g.eff.niente":  "効果なし。三つのつまみは無効になります。",
    "g.eff.eco":     "帰還のある遅延線で、帰還路に2.8 kHzの低域通過濾波器を持ちます。原音と反復は定電力で混ぜます。",
    "g.eff.tremolo": "左右両チャンネルの振幅変調。左右の位相差を調整できます。",
    "g.eff.coro":    "11ミリ秒と17ミリ秒だけ遅らせた二つの複製を逆位相で変調します。広がりは両側の差から生まれます。",
    "g.eff.filtro":  "遮断周波数を低速の発振器で動かす共振型低域通過濾波器。直列で、混ぜません。",

    "g.pe.tempo":      "遅延時間。",
    "g.pe.ritorni":    "帰還量。最大は0.8で、これを超えると余韻は減らずに増えます。",
    "g.pe.quantita":   "原音と効果音の混合比。定電力。",
    "g.pe.velocita":   "変調発振器の周波数。",
    "g.pe.profondita": "変調の深さ。",
    "g.pe.larghezza":  "左右チャンネル間の変調の位相差。0°では中央で脈打ち、180°では左右に移動します。",
    "g.pe.taglio":     "遮断周波数。指数目盛。",
    "g.pe.risonanza":  "濾波器のQ値。",
    "g.pe.movimento":  "遮断周波数に加わる低速発振の振れ幅。設定周波数を中心としたオクターブ数で表します。",

    "g.pae.t": "風景",
    "g.pae.1": "録音した素材——読み込んだファイル、またはマイクからの収録——を1〜64倍の範囲で減速し、音高を変えずに鳴らします。素材は保存されません。頁を開いているあいだだけ存在します。",
    "g.pae.2": "減速は緩衝記憶をゆっくり読むのではありません。それでは音高も下がります。素材は自然な速さのまま、重なり合う窓で読み、ゆっくり進むのは窓を取り出す位置のほうです。各瞬間に四枚の窓がずれた釣鐘状で重なります。これより少ないと窓の継ぎ目が聞こえます。",
    "g.pae.3": "調律は素材を移調しません。現在の音組の各音に合わせた帯域通過濾波器の列を、110〜1500 Hzの範囲で背後に置きます。列は周波数ではなく場の指標を保持するので、五度が進むと濾波器は長い時定数で移動し、五つのうち四つは同じ値を書き直します。",
    "g.pae.4": "区間は波形の上の二つの取っ手で決めます。前後を入れ替えると区間は消えず鏡像になります。区間の中を進む明るい帯が、いま読んでいる窓です。",
    "g.pae.5": "読み取りヘッドには五つの読み方があります。順は区間の終わりへ進み、始めに戻ります。逆は始めへ向かって進みます。往復は両端の間を行き来します。停止はいまの位置に留まります。無作為は区間内の無作為な点へ跳び、そこから滞留時間のあいだ前へ読み、また跳びます。次の着地点は波形の上に破線で示されます。どの読み方でも窓は自然な速度で前向きに鳴ります。向きを変えるのはヘッドで、素材ではありません。",

    "g.p.segmento":  "読み取る区間の両端。素材の長さに対する百分率。",
    "g.p.lettura":   "区間の中でのヘッドの進み方。順、逆、往復、停止、無作為。",
    "g.p.sosta":     "無作為の読み方で各区域を読む時間。指数目盛。ほかの読み方では無効です。",
    "g.p.rallenta":  "読み取り位置の減速率。",
    "g.p.velo":      "窓一枚の長さ。",
    "g.p.sparpaglio": "各窓の開始位置に加える無作為のずれ。零では全ての窓が同じ点から始まり、合計は櫛形濾波器になります。",
    "g.p.accordatura": "素のままの素材と、共振列を通した素材の混合比。",
    "g.p.fuoco":     "列の濾波器のQ値。8を下回ると隣の半音と区別がつかなくなります。音量が動かないよう、列の利得は絞りとともに上がります。",
    "g.p.pcoda":     "風景の内部残響の残響時間。",
    "g.p.ptono":     "残響の帰還路における減衰周波数。",
    "g.p.priverbero": "原音と余韻の混合比。",

    "g.der.t": "漂流",
    "g.der.1": "音高の場は半音を含まない五音音階——度数0, 2, 4, 7, 9——を五オクターブに複製した二十五音です。二つの種類は同じ場と同じ重心を読み、違うのは窓の幅だけです。",
    "g.der.2": "正確に2′ 30″ごとに音組が五度動きます。ある五音音階とその五度上の音階では五音のうち一音だけが変わり、四つは両方に残ります。この切り替えをまたぐ持続音は、残るほうの度数に合わせて鳴らすので、鳴っている最中に音組から外れることがありません。",
    "g.der.3": "重心は連続的な動きです。音高そのものは動かず、音を選ぶ中心の位置が滑ります。無理数比の六系統がこれを支配するため、同じ場所を正確に二度通ることはありません。節の下端の帯が過去十五分を示し、琥珀色の列が折り返しの点です。",
    "g.der.4": "「素材」の操作子は、五度が進むときに楽想をどう扱うかを決めます。",

    "g.p.ancora": "楽想は気分が定めたまま残ります。場に従って音高は変わりますが、並びは変わりません。",
    "g.p.deriva": "五度が進むたびに楽想を作り直します。",

    "g.banco.t": "卓",
    "g.banco.1": "工房の出口です。各系統は、音源が書き込む正規化器——開いている声の数を補正します——音量、共通残響への送りをこの順に持ちます。残響は補正後の信号を受け取ります。",
    "g.banco.2": "等化器は固定周波数の八帯域、可動範囲は±8 dBです。推子の上に描かれる曲線は推子の位置を補間したものではなく、音声グラフに問い合わせた濾波器の実際の応答です。",
    "g.banco.3": "出口は二つあります。実時間の録音は、推子を動かした痕跡ごと演奏を捉えます。書き出しは実時間よりはるかに速く、手を加えずに曲を生成します。同じ模型と同じ設定をたどるので、聞いていたとおりの音がファイルに残ります。",

    "g.p.eq":         "八帯域：20 Hzシェルビング、50・100・500・1k・5k・10 kピーキング、18 kHzシェルビング。",
    "g.p.mixer":      "三系統と出力の音量。織りの系統では、模型側の「音量」にデシベルで加算されます。",
    "g.p.limitatore": "出力段の二段直列。表示は瞬時の利得減衰量です。",
    "g.p.picco":      "出力信号の尖頭値。毎秒20 dBで保持が下がります。",
    "g.p.registra":   "卓の出力からの実時間収録。24ビット・ステレオのwavで書き出します。",
    "g.p.esporta":    "指定した長さの非実時間生成。24ビット・ステレオのwav。",

    "g.mood.t": "気分",
    "g.mood.1": "完成した設定が十六。各種類に八つずつ。気分は変数、四本の線の周期、音色の名前を一度に書き込みます。時間の設定も音と同じくらい性格の一部だからです。書き込みは滑らかにせず即時に行います。気分は身振りではなく場面の切り替えです。",
    "g.mood.2": "同じ音色は表に一度しか出ません。八つを順に回れば八つの音すべてを通ります。",

    "g.infl.t": "外からの影響",
    "g.infl.1": "系統時計から取った二つの量が、操作子の位置を動かさずに実効値を変えます。時刻はしずくの温かみ・空間・全体の色を、季節は織りの音域・立ち上がり・消えぎわ・速さを動かします。操作子の位置と実効値の差は、列の中の操作子と円盤を囲む円環を見比べれば読めます。",

    "g.tav.t": "画面の読み方",
    "g.tav.1": "各種類に円盤が一つあり、線ごとに同心の輪が四つ、ローマ数字で番号が振られます。各輪を点が回り、予定ではなく実際に聞こえている位相を示します。",
    "g.tav.2": "しずくは輪を横切る放射状の目盛りで、その長さが音の高さです。持続音は鳴っているあいだの長さの弧で、過ぎたものは淡く、鳴っているあいだは濃く描かれます。",
    "g.tav.3": "琥珀色が示すのは四つだけです。いま鳴っているもの、あらゆる数値、重心が折り返した点、そして節の始まり。しずくが鳴ると円盤の中心へ糸が伸び、異なる線のしずくが0.18秒以内に重なると、その二つを結ぶ二本目の糸が出ます。",
    "g.tav.4": "円盤を囲む円環は「全体」の三つの実効値を、列の中の操作子は手の位置を示します。その差が漂流と時刻と季節です。",

    "g.spec.t": "仕様",
    "g.spec.1": "本体は通信を一切行いません。ローカルのファイルから開き、接続がなくても動きます。利用者の音声ファイルはブラウザ内で復号され、機械の外に出ることはありません。",
    "g.spec.motore":   "Web Audio API、外部ライブラリなし",
    "g.spec.uscita":   "24ビット・ステレオwav、48 kHz",
    "g.spec.buffer":   "1024標本（latencyHint playback）",
    "g.spec.rete":     "通信なし",
    "g.spec.memoria":  "風景の素材は次に開いたときには残りません",
    "g.spec.lingua":   "選んだ言語は記憶されます。配色は記憶せず、システムに尋ねます",
  },
};

/* --------------------------------------------------- l'innesto nel dizionario
   I testi della guida entrano in `TESTI`, così `dice()` e `applicaTesti()`
   funzionano identici sulle due pagine: nessuna seconda funzione di lettura,
   nessun secondo attributo nell'HTML. Le chiavi cominciano tutte per `g.` e non
   possono scontrarsi con quelle dello strumento. */
for (const l of LINGUE) Object.assign(TESTI[l], GUIDA[l]);

/* --------------------------------------------------------------- l'avvio
   La guida è un documento e non uno strumento: non ha un modello da rifare al
   cambio di lingua, perché tutto quello che mostra sta nell'HTML con
   `data-i18n`. Per questo `alCambioDiLingua` qui non esiste: `applicaTesti()`
   da sola basta, e `i18n.js` la chiama già. */
document.addEventListener("DOMContentLoaded", () => {
  costruisciSelettoreLingua(document.getElementById("lingue"));
  applicaTesti();
  avviaTema("tema");
});
