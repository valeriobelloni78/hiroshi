/* =============================================================================
   HIROSHI · linee.js — lo stato del collage

   Otto linee: quattro frasi di gocce e quattro tessuti tenuti. Ciascuna gira
   col proprio periodo, e i periodi sono COPRIMI A DUE A DUE — non solo dentro
   la classe ma anche fra le due classi, altrimenti le due classi tornerebbero
   insieme più spesso di quanto non facciano le quattro frasi fra loro.

       frasi    7 · 11 · 13 · 17     (primi)
       tessuti  8 · 9 · 19 · 25      (2³, 3², 19, 5²)

   Il vincolo da verificare è il MASSIMO COMUN DIVISORE, non la primalità: 8, 9
   e 25 sono composti e vanno benissimo, perché non condividono nulla né fra
   loro né con 7·11·13·17. Chiunque tocchi queste serie calcoli i gcd prima di
   toccarle, e non dopo.

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
const G  = { registro: 45, calore: 70, spazio: 60, densita: 5, addensamento: 34 };
const GT = { ...G };
const effG = { registro: 45, densita: 5, addensamento: 34 };

function effettiviFrasi() {
  effG.registro     = clamp(G.registro     + deriva.spread * 20, 0, 100);
  effG.densita      = clamp(G.densita      + deriva.dens   * 3.2, 1, 20);
  effG.addensamento = clamp(G.addensamento + deriva.head   * 12,  5, 100);
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
const tessuti = [8, 9, 19, 25].map((p, i) => nuovaLinea(i, p, ((1.5 - i) / 1.5) * 0.5));

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

function ricambia(L, now) {
  costruisciPiano(L);                       // il piano va aggiornato PRIMA di toccarlo
  const orizzonte = orizzonteSicuro(now);
  const lib = raccogliLibere(L, orizzonte, now);
  const voluto = goccieVolute();

  if (L.idea.length < voluto) {
    L.idea.push(nuovaGoccia());
  } else if (L.idea.length > voluto) {
    if (!lib.length) return false;
    L.idea.splice(L.idea.indexOf(lib[Math.floor(Math.random() * lib.length)]), 1);
  } else {
    if (!lib.length) return false;
    // I campi si COPIANO dentro l'evento esistente invece di sostituire
    // l'oggetto: il piano e le code del disegno ne tengono il riferimento.
    const ev = lib[Math.floor(Math.random() * lib.length)], n = nuovaGoccia();
    for (const k in n) ev[k] = n[k];
  }

  L.idea.sort((a, b) => a.t - b.t);
  costruisciPiano(L);
  riposizionaIdx(L, orizzonte);
  return true;
}

/* I tempi del ricambio stanno in rapporti irrazionali fra loro, come la
   deriva: quattro linee che si rinnovassero a tempi commensurabili
   tornerebbero a rinnovarsi insieme. */
const TEMPI_RICAMBIO = [1, Math.SQRT2, Math.sqrt(3), Math.sqrt(5)].map((r) => 26 * r);

/* Il tempo prima che le quattro frasi tornino nella stessa combinazione. */
function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function riallineamento(lista) {
  return lista.reduce((m, L) => {
    const p = Math.max(1, Math.round(L.target));
    return (m * p) / gcd(m, p);
  }, 1);
}

/* Il modello si popola da sé. Senza questa riga le frasi nascono vuote e
   l'app è muta all'apertura: è già successo, dividendo il file in moduli. */
frasi.forEach(rigenera);
