/* =============================================================================
   HIROSHI · linee.js — lo stato del collage

   Otto linee: quattro frasi di gocce e quattro tessuti tenuti. Ciascuna gira
   col proprio periodo, e i periodi sono COPRIMI A DUE A DUE — non solo dentro
   la classe ma anche fra le due classi, altrimenti le due classi tornerebbero
   insieme più spesso di quanto non facciano le quattro frasi fra loro.

       frasi    7 · 11 · 13 · 17     (primi)
       tessuti  9 · 16 · 25 · 31     (3², 2⁴, 5², 31)

   Il vincolo da verificare è il MASSIMO COMUN DIVISORE, non la primalità: 9,
   16 e 25 sono composti e vanno benissimo, perché non condividono nulla né fra
   loro né con 7·11·13·17. Chiunque tocchi queste serie calcoli i gcd prima di
   toccarle, e non dopo. Questi otto sono i periodi D'ESORDIO, quelli con cui
   l'app si apre: un mood li riscrive tutti e quattro insieme al timbro e ai
   parametri, e le tabelle in `mood.js` hanno le loro serie, verificate una per
   una dalla prova.

   Questo file non conosce né l'audio né il disegno. Le dipendenze scorrono in
   una direzione sola:  deriva ← linee ← motore ← tavola.
============================================================================= */

const PERIODO_MIN = 3,  PERIODO_MAX = 30;    // frasi, secondi
const TENUTA_MIN  = 7,  TENUTA_MAX  = 60;    // tessuti

/* --------------------------------------------------------- la finestra unica
   LOOKAHEAD e bookedUntil stanno QUI e non nel motore, benché sia il motore a
   scriverli. È voluto: chi ricostruisce un piano e chi prenota le note devono
   guardare esattamente altrettanto avanti. Se lo scheduler prenotasse a tre
   secondi e la ricostruzione ne considerasse pianificati solo 0,15, una mossa
   dell'addensamento riposizionerebbe gocce già prenotate e le sentiresti due
   volte. Una sola autorità, o il difetto torna. */
let LOOKAHEAD = 0.15;
let bookedUntil = 0;
function orizzonteSicuro(now) { return Math.max(now + LOOKAHEAD, bookedUntil); }

/* ------------------------------------------------------------- i parametri
   G  è dove sta il cursore, effG è quello che sta davvero suonando: fra i due
   c'è la deriva. Dove differiscono, la tavola mostra due numeri. */
const G  = {
  /* gocce */
  registro: 45, calore: 70, spazio: 72, densita: 5, addensamento: 30,
  /* tessuti */
  tRegistro: 55, tIntreccio: 45, tApertura: 3.0, tChiusura: 4.3,
  tPasso: 38, tLivello: 32, tSpazio: 55,
  /* paesaggio */
  pInizio: 0, pFine: 100, pRallenta: 8, pVelo: 700, pSparpaglio: 35,
  pAccordatura: 55, pFuoco: 18, pCoda: 12, pTono: 2000, pRiverbero: 70,
  // La lettura del paesaggio è un indice fra cinque, non una corsa: i nomi
  // stanno in `LETTURA`, dentro `paesaggio.js`. La sosta è quella del random,
  // in 0÷100; i secondi li fa `sostaDi()`.
  pLettura: 0, pSosta: 50,
  /* le tre manopole dell'inserto, una terna per classe. Stanno in 0÷100 e
     basta: che cosa vogliano dire lo decide l'effetto scelto, e la conversione
     nell'unità vera sta in `effetti.js`. Chi le mettesse in unità reali
     dovrebbe riscriverle a ogni cambio di effetto — cioè spostare le manopole
     sotto le dita di chi ha appena girato la tendina. */
  gE1: 40, gE2: 30, gE3: 30,
  tE1: 40, tE2: 30, tE3: 30,
};
const GT = { ...G };
const effG  = { registro: 45, calore: 70, spazio: 72, densita: 5, addensamento: 30, colore: 2500 };
const effGT = { registro: 55, intreccio: 45, apertura: 3.0, chiusura: 4.3, passo: 38, livello: 32, spazio: 55 };
const effGP = { inizio: 0, fine: 100, rallenta: 8, velo: 700, sparpaglio: 35,
                accordatura: 55, fuoco: 18, coda: 12, tono: 2000, riverbero: 70 };

/* ------------------------------------------------- le due influenze esterne
   Sono simmetriche e non si toccano: **l'ora del giorno inclina le gocce, la
   stagione inclina i tessuti**. Nessuna delle due si sovrappone alla deriva —
   ciascun parametro pende da una cosa sola, altrimenti non si saprebbe più chi
   lo sta muovendo.

   Non sono un effetto: sono la presa che il pezzo ha sul mondo fuori dalla
   finestra. Chi apre l'app alle sei del mattino non sente la stessa cosa di
   chi la apre a mezzanotte, e non c'è nessun comando che glielo dica. */
let ORA = null, MESE = null;              // se restano null si legge l'orologio

function oraCorrente() { return ORA !== null ? ORA : new Date().getHours(); }
function meseCorrente() { return MESE !== null ? MESE : new Date().getMonth(); }

/* L'ora sposta il CALORE del timbro, lo SPAZIO, e il colore d'insieme. Il
   colore non ha un cursore: dipende solo dall'ora, come in Rada. */
function tavolozzaOraria(h) {
  if (h >= 5  && h < 8)  return { nome: "alba",       tono:   6, calore:   6, spazio:   6 };
  if (h >= 8  && h < 12) return { nome: "mattino",    tono:  14, calore:  -6, spazio:  -6 };
  if (h >= 12 && h < 17) return { nome: "pomeriggio", tono:  18, calore: -10, spazio: -10 };
  if (h >= 17 && h < 20) return { nome: "tramonto",   tono:   4, calore:   8, spazio:   6 };
  if (h >= 20 && h < 23) return { nome: "sera",       tono: -10, calore:  12, spazio:  10 };
  return                        { nome: "notturna",   tono: -20, calore:  18, spazio:  14 };
}

/* La stagione sposta il REGISTRO dei tessuti e il loro RESPIRO. Apertura e
   chiusura si moltiplicano invece di sommarsi perché vivono su scale diverse —
   0,3÷12 s e 0,3÷15 s — e una somma di dodici punti su una scala di secondi
   non vuol dire niente. */
function tavolozzaStagionale(m) {
  if (m <= 1 || m === 11) return { nome: "inverno",   registro: -12, respiro: 1.25, passo:  -12 };
  if (m <= 4)             return { nome: "primavera", registro:  10, respiro: 0.85, passo:   10 };
  if (m <= 7)             return { nome: "estate",    registro:  16, respiro: 0.75, passo:   20 };
  return                         { nome: "autunno",   registro:  -4, respiro: 1.15, passo:   -5 };
}

function effettiviFrasi() {
  const ora = tavolozzaOraria(oraCorrente());
  effG.registro     = clamp(G.registro     + deriva.spread * 20, 0, 100);
  effG.densita      = clamp(G.densita      + deriva.dens   * 3.2, 1, 20);
  effG.addensamento = clamp(G.addensamento + deriva.head   * 12,  5, 100);
  effG.calore       = clamp(G.calore + ora.calore, 0, 100);
  effG.spazio       = clamp(G.spazio + ora.spazio, 0, 100);
  // Il taglio è esponenziale perché l'orecchio sente le frequenze così: fra
  // 600 e 9600 Hz ci sono quattro ottave, e la scala lineare le
  // schiaccerebbe tutte nell'ultimo quarto della corsa.
  effG.colore = 600 * Math.pow(16, clamp(45 + ora.tono, 0, 100) / 100);
}

/* I tessuti pescano da un canale della deriva che le gocce non usano — il
   `corpo` muove il loro LIVELLO, cioè quanto lo sfondo sta sotto al primo
   piano. Tutto il resto glielo muove la stagione. */
/* IL PAESAGGIO NON PENDE DA NIENTE. Non ha un'ora, non ha una stagione e non ha
   la deriva, e non è una dimenticanza: le altre tre sorgenti sono strumenti che
   suonano un pezzo, e il pezzo cambia luce col passare del tempo. Questo è un
   LUOGO — una registrazione tenuta ferma sotto una lente — e un luogo non
   deriva: si sposta solo se qualcuno ci cammina dentro. Il movimento ce l'ha
   già, ed è la testa che percorre il segmento.

   I due estremi si mettono in ordine qui e non nei comandi: le due maniglie
   sono indipendenti, e trascinandone una oltre l'altra il segmento si rovescia
   invece di sparire. */
function effettiviPaesaggio() {
  effGP.inizio     = clamp(Math.min(G.pInizio, G.pFine), 0, 100);
  effGP.fine       = clamp(Math.max(G.pInizio, G.pFine), 0, 100);
  effGP.rallenta   = clamp(G.pRallenta, 1, 64);
  effGP.velo       = clamp(G.pVelo, 80, 2000);
  effGP.sparpaglio = clamp(G.pSparpaglio, 0, 100);
  effGP.accordatura = clamp(G.pAccordatura, 0, 100);
  effGP.fuoco      = clamp(G.pFuoco, 8, 80);
  effGP.coda       = clamp(G.pCoda, 0.5, 40);
  effGP.tono       = clamp(G.pTono, 300, 12000);
  effGP.riverbero  = clamp(G.pRiverbero, 0, 100);
  effGP.sosta      = clamp(G.pSosta, 0, 100);
}

function effettiviTessuti() {
  const st = tavolozzaStagionale(meseCorrente());
  effGT.registro  = clamp(G.tRegistro + st.registro, 0, 100);
  effGT.intreccio = clamp(G.tIntreccio, 0, 100);
  effGT.apertura  = clamp(G.tApertura * st.respiro, 0.3, 12);
  effGT.chiusura  = clamp(G.tChiusura * st.respiro, 0.3, 15);
  effGT.passo     = clamp(G.tPasso + st.passo, 0, 100);
  effGT.livello   = clamp(G.tLivello + deriva.corpo * 9, 8, 60);
  effGT.spazio    = clamp(G.tSpazio, 0, 100);
}

/* ------------------------------------------------------------------ le linee */
function nuovaLinea(i, periodo, pan) {
  return {
    i, period: periodo, target: periodo,
    cycleStart: 0, idx: 0,
    cycles: [],            // i giri realmente in ascolto: {start, period}
    idea: [],              // il materiale, in posizione relativa al giro
    plan: [],              // il materiale collocato sul giro, ordinato per fase
    planHead: 0.34,        // con quale addensamento è stato costruito
    offset: Math.random(), // dove comincia la zona attiva sulla circonferenza
    muted: false,
    prossimoRicambio: 0,
    pan,
  };
}

const frasi = [7, 11, 13, 17].map((p, i) => nuovaLinea(i, p, ((i - 1.5) / 1.5) * 0.65));
const tessuti = [9, 16, 25, 31].map((p, i) => nuovaLinea(i, p, ((1.5 - i) / 1.5) * 0.5));

/* Quale timbro suona ciascuna classe. Sono STRINGHE e stanno qui, nel modello,
   perché un mood le sceglie insieme ai periodi e ai parametri: il timbro è uno
   stato dello strumento, non un pezzo della macchina del suono. Chi lo
   trasforma in nodi sta più a valle e non è affar suo. */
let timbroFrasi = "vetro";
let timbroTessuti = "corrente";

/* ------------------------------------------------------- il modo del materiale
   **deriva** — il materiale si rinnova da sé: una goccia per volta ai tempi
   incommensurabili, e tutte e quattro le linee al passo di quinta.
   **ancora** — le idee restano quelle che il mood ha scelto.

   In «ancora» non si ferma il pezzo: baricentro, armonia, fasi e valori
   efficaci continuano a muoversi. Si ferma solo il RICAMBIO, cioè il rinnovo
   del materiale. È la differenza fra un pezzo che cambia idea e uno che cambia
   luce sulla stessa idea. */
const MODI = { gocce: "deriva", tessuti: "deriva" };

/* L'effetto inserito su ciascuna classe. È una scelta discreta come il timbro
   e come il modo, quindi non passa da `GT`: non c'è niente da lisciare fra
   «eco» e «coro». La dissolvenza che evita il clic la fa il banco, dove stanno
   i nodi. */
const EFFETTO = { gocce: "niente", tessuti: "niente" };

/* ------------------------------------------------------------- il materiale */
function nuovaGoccia() {
  return {
    t: Math.pow(Math.random(), 1.25),   // 0..1 dentro la zona attiva, verso l'inizio
    rel: Math.random() * 2 - 1,         // −1..1, il registro
    vel: 0.7 + Math.random() * 0.3,
    flash: -99,
  };
}

function nuovaIdea() {
  const n = 1 + Math.floor(Math.random() * Math.max(1, Math.round(effG.densita)));
  const v = [];
  for (let k = 0; k < n; k++) v.push(nuovaGoccia());
  return v.sort((a, b) => a.t - b.t);
}

/* Quante gocce vuole una frase. Segue la MEDIA di nuovaIdea (poco più di metà
   della densità) e non il suo massimo: se seguisse il massimo, ogni
   rigenerazione disferebbe quello che il ricambio ha costruito. */
function goccieVolute() { return clamp(Math.round((1 + effG.densita) / 2), 1, 20); }

/* ------------------------------------------------------------ il materiale
                                                                  dei tessuti
   Una tenuta ha due campi che una goccia non ha. `lungo` è il moltiplicatore
   della sua durata, perché quattro tenute tutte della stessa lunghezza si
   sentono come un accordo che respira insieme. `fino` è l'istante in cui
   finisce, e serve al ricambio: una tenuta che sta suonando NON si può
   sostituire — la si sentirebbe cambiare a metà — e `raccogliLibere` la
   riconosce proprio da quel campo. Le gocce non ce l'hanno affatto, e il
   confronto con `undefined` è falso, che è la risposta giusta per loro. */
function nuovaTenuta() {
  return {
    t: Math.random(),                 // 0..1 su TUTTO il giro, non nella testa
    rel: Math.random() * 2 - 1,
    vel: 0.6 + Math.random() * 0.4,
    lungo: 0.55 + Math.random() * 0.9,
    flash: -99,
    fino: -99,
  };
}

/* Quante tenute per giro. Al massimo due: con quattro linee fanno otto voci
   tenute contemporanee, e ciascuna è una decina di nodi. Tre sarebbero dodici
   voci, cioè centoventi nodi che si aprono e si chiudono di continuo. */
function tenuteVolute() { return clamp(Math.round(1 + effGT.intreccio / 70), 1, 2); }

function nuovaTrama() {
  const n = tenuteVolute();
  const v = [];
  for (let k = 0; k < n; k++) v.push(nuovaTenuta());
  return v.sort((a, b) => a.t - b.t);
}

/* Quanto dura una tenuta, in secondi. L'intreccio è letteralmente questo: a
   zero le tenute stanno dentro il loro giro e fra l'una e l'altra c'è aria; a
   cento durano più del giro e si accavallano con quelle che seguono. */
function durataTenuta(L, ev) {
  return clamp(L.period * (0.30 + effGT.intreccio / 100 * 0.95) * ev.lungo, 3, TENUTA_MAX);
}

/* ------------------------------------------------------------------ i piani
   Le gocce si concentrano nella TESTA del giro; tutto il resto è silenzio, e
   quel silenzio non è un riempitivo, è il meccanismo. La fase può scavalcare
   la fine del giro — c'è un offset casuale — quindi va riordinata. */
function costruisciPiano(L) {
  const testa = effG.addensamento / 100;
  L.planHead = testa;
  L.plan = L.idea
    .map((ev) => ({ ph: (L.offset + ev.t * testa) % 1, ev }))
    .sort((a, b) => a.ph - b.ph);
}

function rigenera(L) {
  L.idea = nuovaIdea();
  L.offset = Math.random();
  costruisciPiano(L);
  L.idx = 0;
}

/* La trama di un tessuto occupa TUTTO il giro, non la sua testa. È la
   differenza strutturale fra le due classi, e non è una taratura: le gocce
   sono eventi radi separati da silenzio — e quel silenzio è il meccanismo —
   mentre i tessuti sono uno stato che dura. Addensare le tenute nella testa
   del giro le farebbe entrare tutte insieme, cioè trasformerebbe uno sfondo
   continuo in quattro accordi al minuto. */
function costruisciTrama(L) {
  L.planHead = 1;
  L.plan = L.idea
    .map((ev) => ({ ph: (L.offset + ev.t) % 1, ev }))
    .sort((a, b) => a.ph - b.ph);
}

function rigeneraTrama(L) {
  L.idea = nuovaTrama();
  L.offset = Math.random();
  costruisciTrama(L);
  L.idx = 0;
}

/* Il confronto avviene su TEMPI ASSOLUTI, mai su fasi: cycleStart può essere
   nel futuro, e avvolgere la fase fa saltare gocce o interi giri. */
function riposizionaIdx(L, orizzonte) {
  const k = L.plan.findIndex((p) => L.cycleStart + p.ph * L.period >= orizzonte);
  L.idx = k < 0 ? L.plan.length : k;
}

function ricostruisciPiani(now) {
  frasi.forEach((L) => {
    costruisciPiano(L);
    if (now === null) { L.idx = 0; return; }
    riposizionaIdx(L, orizzonteSicuro(now));
  });
}

function ricostruisciTrame(now) {
  tessuti.forEach((L) => {
    costruisciTrama(L);
    if (now === null) { L.idx = 0; return; }
    riposizionaIdx(L, orizzonteSicuro(now));
  });
}

/* --------------------------------------------------------------- il ricambio
   Una goccia per volta, così non c'è mai un istante che si possa indicare. È
   anche l'unica strada per cui la densità che deriva arriva all'orecchio:
   nuovaIdea legge effG.densita una volta sola, alla nascita. */
const libere = [];
function raccogliLibere(L, orizzonte, now) {
  libere.length = 0;
  for (const p of L.plan) {
    // Scritto in negativo perché le gocce non hanno affatto `fino`: il
    // confronto con undefined è falso, e le segna libere — che è giusto.
    if (L.cycleStart + p.ph * L.period >= orizzonte && !(p.ev.fino > now)) libere.push(p.ev);
  }
  return libere;
}

/* Il ricambio è uno solo per le due classi. Differiscono per che cosa nasce e
   per come si colloca sul giro, non per come si rinnova — e due copie di
   questa funzione divergerebbero al primo ritocco, esattamente come farebbero
   due copie dello scheduler. */
function ricambiaLinea(L, now, costruisci, quante, nuovo) {
  costruisci(L);                            // il piano va aggiornato PRIMA di toccarlo
  const orizzonte = orizzonteSicuro(now);
  const lib = raccogliLibere(L, orizzonte, now);
  const voluto = quante();

  if (L.idea.length < voluto) {
    L.idea.push(nuovo());
  } else if (L.idea.length > voluto) {
    if (!lib.length) return false;
    L.idea.splice(L.idea.indexOf(lib[Math.floor(Math.random() * lib.length)]), 1);
  } else {
    if (!lib.length) return false;
    // I campi si COPIANO dentro l'evento esistente invece di sostituire
    // l'oggetto: il piano e le code del disegno ne tengono il riferimento.
    const ev = lib[Math.floor(Math.random() * lib.length)], n = nuovo();
    for (const k in n) ev[k] = n[k];
  }

  L.idea.sort((a, b) => a.t - b.t);
  costruisci(L);
  riposizionaIdx(L, orizzonte);
  return true;
}

function ricambia(L, now) {
  return ricambiaLinea(L, now, costruisciPiano, goccieVolute, nuovaGoccia);
}
function ricambiaTessuto(L, now) {
  return ricambiaLinea(L, now, costruisciTrama, tenuteVolute, nuovaTenuta);
}

/* I tempi del ricambio stanno in rapporti irrazionali fra loro, come la
   deriva: quattro linee che si rinnovassero a tempi commensurabili
   tornerebbero a rinnovarsi insieme.

   Le due serie usano radicali DIVERSI, e non lo stesso quartetto moltiplicato
   per un altro numero: 26·√2 e 41·√2 stanno in rapporto 41/26, che è
   razionale, e le due linee tornerebbero a rinnovarsi insieme ogni ventisei
   minuti. Con radicali distinti il rapporto resta irrazionale e non tornano
   mai. I tessuti si rinnovano più di rado perché durano di più: rinnovarne uno
   ogni ventisei secondi vorrebbe dire non lasciarne finire nessuno. */
const TEMPI_RICAMBIO   = [1, Math.SQRT2, Math.sqrt(3), Math.sqrt(5)].map((r) => 26 * r);
const TEMPI_RICAMBIO_T = [Math.sqrt(7), Math.sqrt(11), Math.sqrt(13), Math.sqrt(19)].map((r) => 17 * r);

/* Il tempo prima che le quattro frasi tornino nella stessa combinazione. */
function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function riallineamento(lista) {
  return lista.reduce((m, L) => {
    const p = Math.max(1, Math.round(L.target));
    return (m * p) / gcd(m, p);
  }, 1);
}

/* --------------------------------------------------------- il passo di quinta
   Quando la deriva cambia collezione — una nota su cinque, ogni 150 secondi —
   il materiale della classe in modo «deriva» si rinnova per intero. È la scala
   grossa del ricambio: quella fine sostituisce una goccia per volta e non si
   nota mai, questa arriva col cambio di luce e ci si nasconde dentro.

   Il rilevatore sta qui e non nella deriva, perché `deriva.js` è trapiantato
   intatto da Rada Deriva e non deve sapere che qualcuno lo sta guardando. */
let ultimaQuinta = -1;
function quintaScattata() {
  if (ultimaQuinta < 0) { ultimaQuinta = passiQuinta; return false; }
  if (passiQuinta === ultimaQuinta) return false;
  ultimaQuinta = passiQuinta;
  return true;
}

/* Il modello si popola da sé. Senza queste righe le linee nascono vuote e
   l'app è muta all'apertura: è già successo, dividendo il file in moduli. */
frasi.forEach(rigenera);
tessuti.forEach(rigeneraTrama);
