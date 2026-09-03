/* =============================================================================
   HIROSHI · tavola.js — il disegno

   UN CANVAS SOLO, steso sotto tutto il foglio e senza eventi. Non legge una
   misura sua: legge i RIQUADRI degli elementi che il CSS ha già impaginato —
   `[data-quadro]` e `[data-manopola]` — e ci disegna dentro. L'impaginazione
   sta tutta nel foglio di stile, quindi il disegno segue le colonne quando si
   riordinano su uno schermo stretto senza sapere niente di media query.

   LA TAVOLA È PURO DISPLAY: non c'è un `addEventListener` in questo file e non
   deve arrivarcene mai uno. Quello che sembra una manopola da girare è un
   `input[type=range]` trasparente steso sopra il disegno: il canvas la disegna,
   il browser la comanda. Un quadrante che ascoltasse il canvas sarebbe un
   comando che nessuno può usare senza vederlo.

   DUE LETTURE DEL SEGNO, UNA VOLTA CIASCUNA. Il COLORE è l'ALTEZZA — cinque
   fermate dal blu al rosso mattone — e la LUNGHEZZA è la DURATA: una goccia è
   una tacca radiale lunga quanto la sua coda, una tenuta è un arco lungo quanto
   sta in aria, un grano è una tessera. Nient'altro dice l'altezza o la durata.
   Da qui il resto del vocabolario: LO STATO È INCHIOSTRO — acceso, spento,
   muto, dove sta la mano, dove sta la testa.

   LA PALETTE SI LEGGE DAL CSS. Non c'è un solo colore scritto qui dentro.

   QUELLO CHE SI VEDE È QUELLO CHE SUONERÀ: il colore di un evento esce da
   `altezza()`, la lunghezza di una tenuta da `durataTenuta()`, la sua opacità
   da `finestra()`, la coda di una goccia da `formaGocce()`, la curva
   dell'equalizzatore dai filtri veri con `getFrequencyResponse`. Una tavola che
   ridisegnasse a modo suo comincerebbe a mentire al primo ritocco.
============================================================================= */

/* ------------------------------------------------------------------ la palette */
const TINTE = {};
const NOMI_TINTE = ["carta", "inchiostro", "inchiostro-2", "grigio", "muto",
                    "filo", "filo-2", "spento", "grave", "ciano", "medio", "oro", "acuto"];
let CARATTERE_MONO = "monospace";
let CARATTERE_SANS = "sans-serif";

function canaliDi(v) {
  if (v.startsWith("#")) {
    const h = v.length === 4 ? v[1] + v[1] + v[2] + v[2] + v[3] + v[3] : v.slice(1);
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = v.match(/[\d.]+/g);
  return m ? [+m[0], +m[1], +m[2]] : [0, 0, 0];
}

function leggiTinte() {
  const s = getComputedStyle(document.documentElement);
  for (const k of NOMI_TINTE) TINTE[k] = canaliDi(s.getPropertyValue("--" + k).trim() || "#000");
  CARATTERE_MONO = s.getPropertyValue("--mono").trim() || "monospace";
  CARATTERE_SANS = s.getPropertyValue("--sans").trim() || "sans-serif";
}

function tinta(k, a) {
  const c = TINTE[k] || [0, 0, 0];
  return a === undefined || a >= 1
    ? "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"
    : "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a.toFixed(3) + ")";
}

/* ------------------------------------------------------- lo spettro dell'altezza
   Cinque fermate, le stesse cinque variabili che il CSS usa per la legenda
   sotto la fascia dei grani. Gli estremi sono FISSI e non presi dal campo
   corrente: prendendoli da `SCALE` la rampa si sposterebbe a ogni passo di
   quinta, e il colore direbbe la tonalità invece dell'altezza.

   Non sono nemmeno gli estremi del campo — 65 e 1975 Hz — ma quelli del
   registro che si usa davvero: la selezione ne prende due o tre ottave attorno
   al centro, e tarando la rampa sull'intero campo tutto quello che si sente
   starebbe nel verde di mezzo. Chi esce dalla banda — il fondo di «bordone», il
   velo di «soglia» — si appoggia sul blu pieno o sul rosso pieno, che per un
   suono davvero al fondo o davvero in cima è la lettura giusta. */
const RAMPA = ["grave", "ciano", "medio", "oro", "acuto"];
const HZ_FONDO = Math.log2(100);
const HZ_CIMA  = Math.log2(1500);

function coloreSpettro(u, alfa) {
  const v = clamp(u, 0, 1) * (RAMPA.length - 1);
  const i = Math.min(RAMPA.length - 2, Math.floor(v));
  const f = v - i;
  const a = TINTE[RAMPA[i]], b = TINTE[RAMPA[i + 1]];
  const c = [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * f));
  return alfa === undefined || alfa >= 1
    ? "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"
    : "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + alfa.toFixed(3) + ")";
}

function coloreAltezza(hz, alfa) {
  return coloreSpettro((Math.log2(Math.max(20, hz)) - HZ_FONDO) / (HZ_CIMA - HZ_FONDO), alfa);
}

/* ------------------------------------------------------------------- la tela */
const tela = el("tavola");
const T = tela.getContext("2d");
const foglio = document.querySelector(".foglio");
let DPR = 1, LARGO = 0, ALTO = 0;

function ridimensiona() {
  const r = foglio.getBoundingClientRect();
  LARGO = Math.max(1, Math.round(r.width));
  ALTO = Math.max(1, Math.round(foglio.scrollHeight));
  // Oltre due volte e mezza non si guadagna niente che un occhio veda, e su un
  // telefono a DPR 3 il canvas costerebbe il doppio dei pixel per nulla.
  DPR = Math.min(window.devicePixelRatio || 1, 2.5);
  tela.width = Math.round(LARGO * DPR);
  tela.height = Math.round(ALTO * DPR);
  tela.style.height = ALTO + "px";
}

/* Il riquadro di un elemento, in coordinate del foglio. È l'unico ponte fra
   l'impaginazione e il disegno, e va in una direzione sola: il CSS decide, il
   canvas ubbidisce. */
let originaFoglio = { left: 0, top: 0 };
function riquadro(e) {
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { x: r.left - originaFoglio.left, y: r.top - originaFoglio.top, w: r.width, h: r.height,
           cx: r.left - originaFoglio.left + r.width / 2, cy: r.top - originaFoglio.top + r.height / 2 };
}
const quadro = (nome) => riquadro(document.querySelector('[data-quadro="' + nome + '"]'));
const manopolaDi = (nome) => riquadro(document.querySelector('[data-manopola="' + nome + '"]'));

/* ------------------------------------------------------------- le primitive
   Gli angoli si contano in GIRI e partono dalle dodici, in senso orario: è così
   che si legge un quadrante, ed è anche l'unità in cui il modello tiene le fasi
   — `ph` è già un giro. Convertire una volta sola, qui, vuol dire non sbagliare
   il verso da nessun'altra parte. */
const RADIANTI = Math.PI * 2;
function ang(giro) { return -Math.PI / 2 + giro * RADIANTI; }

function arco(cx, cy, r, da, quanto, spessore, colore) {
  if (quanto <= 0 || r <= 0) return;
  T.beginPath();
  T.arc(cx, cy, r, ang(da), ang(da + quanto));
  T.lineWidth = spessore; T.strokeStyle = colore; T.stroke();
}

function cerchio(cx, cy, r, spessore, colore, tratteggio) {
  T.save();
  if (tratteggio) T.setLineDash(tratteggio);
  T.beginPath();
  T.arc(cx, cy, r, 0, RADIANTI);
  T.lineWidth = spessore; T.strokeStyle = colore; T.stroke();
  T.restore();
}

/* Una tacca radiale: il segno che dice «qui», e l'unico modo di indicare un
   punto su un anello senza rubare spessore all'anello. */
function tacca(cx, cy, giro, r0, r1, spessore, colore) {
  const a = ang(giro), co = Math.cos(a), si = Math.sin(a);
  T.beginPath();
  T.moveTo(cx + co * r0, cy + si * r0);
  T.lineTo(cx + co * r1, cy + si * r1);
  T.lineWidth = spessore; T.strokeStyle = colore; T.stroke();
}

function riga(x0, y0, x1, y1, spessore, colore, tratteggio) {
  T.save();
  if (tratteggio) T.setLineDash(tratteggio);
  T.beginPath();
  T.moveTo(x0, y0); T.lineTo(x1, y1);
  T.lineWidth = spessore; T.strokeStyle = colore; T.stroke();
  T.restore();
}

/* Il quadratino d'inchiostro col suo strappo: sotto ci sta un quadrato di
   carta che cancella il filo dov'è appoggiato. È la convenzione del disegno
   tecnico, e qui costa niente — il canvas è trasparente, quindi cancellare
   rimette la carta con la sua grana e non una toppa di colore. */
function quadretto(x, y, lato, colore, strappo) {
  if (strappo) T.clearRect(x - lato / 2 - strappo, y - lato / 2 - strappo,
                           lato + strappo * 2, lato + strappo * 2);
  T.fillStyle = colore;
  T.fillRect(Math.round(x - lato / 2), Math.round(y - lato / 2), lato, lato);
}

function quadrettoSuGiro(cx, cy, r, giro, lato, colore, strappo) {
  const a = ang(giro);
  quadretto(cx + Math.cos(a) * r, cy + Math.sin(a) * r, lato, colore, strappo);
}

function scritta(s, x, y, opz) {
  const o = opz || {};
  const dim = o.dim || 8;
  T.font = dim + "px " + (o.sans ? CARATTERE_SANS : CARATTERE_MONO);
  if ("letterSpacing" in T) T.letterSpacing = (o.sp === undefined ? 1 : o.sp) + "px";
  T.fillStyle = o.pieno || tinta(o.col || "grigio", o.alfa);
  T.textAlign = o.all || "left";
  T.textBaseline = o.base || "alphabetic";
  T.fillText(s, x, y);
  if ("letterSpacing" in T) T.letterSpacing = "0px";
}

/* ---------------------------------------------------------------- la corona
   Tre tracce concentriche di graduazioni, aperte in basso di sessanta gradi:
   il quadrante si legge come si legge uno strumento, e la bocca in basso dice
   dove comincia e dove finisce la corsa.

   La traccia mostra L'EFFICACE, cioè quello che sta suonando; il filetto in
   colonna mostra dove sta la mano. Fra i due c'è la deriva, l'ora e la
   stagione — che è tutto il punto — e vederli separati è l'unico modo di sapere
   chi sta muovendo un parametro. */
const CORONA_DA = 210 / 360, CORONA_QUANTO = 300 / 360, CORONA_TACCHE = 85;
const CORONA_DENTRO = 0.89;

function corona(cx, cy, R, voci) {
  // Le tracce si spartiscono la fascia esterna, quante che siano — oggi tre per
  // classe, e la più esterna è lo spazio da tutt'e due le parti: lo stesso
  // parametro allo stesso raggio sui due quadranti.
  const passoR = voci.length > 1 ? (1 - CORONA_DENTRO) / (voci.length - 1) : 0;
  voci.forEach((v, i) => {
    const r = R * (CORONA_DENTRO + i * passoR);
    const u = clamp((v.eff() - v.min) / (v.max - v.min), 0, 1);
    const fino = Math.round(u * (CORONA_TACCHE - 1));
    for (let k = 0; k < CORONA_TACCHE; k++) {
      const g = CORONA_DA + (k / (CORONA_TACCHE - 1)) * CORONA_QUANTO;
      const dentro = k <= fino;
      tacca(cx, cy, g, r - (dentro ? R * 0.028 : R * 0.015), r,
            1, tinta(dentro ? "inchiostro-2" : "spento"));
    }
    quadrettoSuGiro(cx, cy, r - R * 0.014, CORONA_DA + u * CORONA_QUANTO,
                    R * 0.036, tinta("inchiostro"), 1.6);
  });
}

/* ------------------------------------------------------------------- gli anelli
   Un anello è una linea: il giro intero è la circonferenza e la fase corrente è
   il quadratino che ci scorre sopra. Quattro anelli concentrici sono le quattro
   linee di una classe, nell'ordine in cui il modello le tiene — non in quello
   dei periodi, che cambiano coi mood: un anello che si spostasse di posto a
   ogni cambio di carattere non sarebbe più «la seconda linea».

   LA ZONA ATTIVA non si disegna. Quella che «addensamento» apre e chiude è la
   testa del giro, e la si vede da dove cadono le tacche: disegnarla come una
   fascia sull'anello vorrebbe dire coprire di grigio proprio le tacche che
   sono la cosa da guardare, e dire due volte un numero che la corona ha già.
   Nei tessuti non esiste affatto — la trama occupa il giro intero — ed è la
   differenza strutturale fra le due classi. */
const RAGGI_ANELLI = [0.41, 0.54, 0.67, 0.80];

function anello(cx, cy, R, r, L, ora, opz) {
  const muta = L.muted;
  const alfa = muta ? 0.32 : 1;

  cerchio(cx, cy, r, 1, tinta(muta ? "filo-2" : "filo"), muta ? [2, 3] : null);

  const base = T.globalAlpha;
  for (const p of L.plan) {
    const ev = p.ev;
    const col = coloreAltezza(opz.frequenza(ev), alfa);
    T.globalAlpha = base * alfa;
    opz.segno(cx, cy, r, R, p.ph, ev, L, col);
    T.globalAlpha = base;

    /* IL LAMPO. Un evento che ha appena suonato si allarga e si spegne in un
       secondo. È l'unico posto in cui il tempo del disegno e quello dell'audio
       si toccano, e si toccano su `flash`, che è il campo che il motore scrive
       quando prenota: non è una simulazione del suono, è il suono che dice
       quando è uscito. */
    const eta = ora - ev.flash;
    if (!muta && eta >= -0.05 && eta < 1) {
      const k = clamp(eta, 0, 1), a = ang(p.ph), l = 4 + k * 9;
      T.save();
      T.globalAlpha *= (1 - k) * 0.8;
      T.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      T.rotate(a);
      T.strokeStyle = col; T.lineWidth = 1;
      T.strokeRect(-l / 2, -l / 2, l, l);
      T.restore();
    }
  }

  // Dove siamo dentro il giro. Il periodo è quello IN CORSO (`period`), non
  // quello scelto (`target`): la durata nuova entra al giro dopo, e un
  // quadratino che corresse già col periodo nuovo direbbe una fase che non c'è.
  const fase = (((ora - L.cycleStart) / L.period) % 1 + 1) % 1;
  quadrettoSuGiro(cx, cy, r, fase, 5.6, tinta(muta ? "grigio" : "inchiostro"), 1.6);

  // Il numero della linea, sul raggio di sinistra, col filo che si interrompe
  // dov'è la cifra. Le quattro righe di comandi dicono «3 · 13,0″ · muta», e
  // senza un numero sull'anello non ci sarebbe modo di sapere quale dei quattro
  // cerchi si sta silenziando.
  const a = ang(0.75);
  const nx = cx + Math.cos(a) * r, ny = cy + Math.sin(a) * r;
  T.clearRect(nx - 5, ny - 5.5, 10, 11);
  scritta(String(L.i + 1), nx, ny, { dim: 7.5, sp: 0, col: muta ? "muto" : "grigio",
                                     all: "center", base: "middle" });
}

/* Una goccia è una TACCA RADIALE lunga quanto la sua coda: un punto nel tempo
   che risuona, e il tempo che risuona si misura verso fuori. Una tenuta è un
   ARCO lungo quanto sta in aria, con l'opacità dell'inviluppo vero — la stessa
   `finestra()` che scrive l'automazione dell'audio. Due segni diversi per due
   cose diverse, e la stessa grandezza letta nello stesso modo. */
function segnoGoccia(cx, cy, r, R, ph, ev, L, col) {
  const l = clamp(codaGocce * ev.vel * (R * 0.055), 3, R * 0.13);
  tacca(cx, cy, ph, r - l / 2, r + l / 2, 2, col);
}

function segnoTenuta(cx, cy, r, R, ph, ev, L, col) {
  const dur = durataTenuta(L, ev);
  const quanto = Math.min(dur / L.period, 0.985);
  const inv = inviluppoDi(0, dur, { apertura: effGT.apertura, chiusura: effGT.chiusura });
  const n = clamp(Math.round(quanto * 110), 3, 56), passo = quanto / n;
  const base = T.globalAlpha;
  for (let k = 0; k < n; k++) {
    const a = 0.14 + 0.72 * finestra(((k + 0.5) / n) * quanto * L.period, inv);
    T.globalAlpha = base * a;
    arco(cx, cy, r, ph + k * passo, passo * 1.35, 3, col);
  }
  T.globalAlpha = base;
}

/* ---------------------------------------------------------------- il quadrante */
function quadrante(box, dati, ora) {
  if (!box) return;
  const R = Math.min(box.w, box.h) / 2 - 2;
  const cx = box.cx, cy = box.cy;
  T.save();
  if (!dati.attiva) T.globalAlpha = 0.34;
  corona(cx, cy, R, dati.corona);
  dati.linee.forEach((L, i) => anello(cx, cy, R, R * RAGGI_ANELLI[i], L, ora, dati.anello));
  T.restore();
}

/* ------------------------------------------------------------------ la manopola
   Un arco graduato aperto in basso e un quadrato che ci corre sopra. Sotto —
   cioè sopra, nell'ordine dei livelli — c'è il cursore nativo trasparente: il
   canvas la disegna, il browser la comanda.

   DUE VALORI SU UNA FIGURA SOLA, come sulla corona: le GRADUAZIONI si riempiono
   fino all'EFFICACE, il QUADRATO sta dove sta la MANO. Quando la deriva o l'ora
   spingono il parametro, il quadrato resta dove l'hai lasciato e le tacche gli
   scappano avanti o indietro: quella distanza è tutto quello che c'è da sapere
   su chi sta muovendo il registro. Il quadrato deve seguire il dito — è un
   comando — e le tacche devono dire il vero: qui non si può scegliere una cosa
   sola. */
const MANOPOLA_DA = 235 / 360, MANOPOLA_QUANTO = 250 / 360, MANOPOLA_TACCHE = 27;

function manopola(box, u, efficace) {
  if (!box) return;
  const R = Math.min(box.w, box.h) / 2 * 0.79;
  const cx = box.cx, cy = box.cy;
  // Le lunghezze sono FRAZIONI del raggio e non pixel: la manopola può crescere
  // senza che le graduazioni diventino unghie. Le proporzioni sono quelle del
  // disegno, misurate su un arco di trentatré pixel.
  const fino = Math.round(clamp(efficace === undefined ? u : efficace, 0, 1) * (MANOPOLA_TACCHE - 1));
  for (let k = 0; k < MANOPOLA_TACCHE; k++) {
    const g = MANOPOLA_DA + (k / (MANOPOLA_TACCHE - 1)) * MANOPOLA_QUANTO;
    const dentro = k <= fino;
    tacca(cx, cy, g, R - R * (dentro ? 0.197 : 0.121), R, 1,
          tinta(dentro ? "inchiostro-2" : "spento"));
  }
  quadrettoSuGiro(cx, cy, R * 0.903, MANOPOLA_DA + clamp(u, 0, 1) * MANOPOLA_QUANTO,
                  R * 0.2, tinta("inchiostro"), 1.7);
}

/* ------------------------------------------------------------- i misuratori
   Due file di tessere, una per lato. La tenuta di picco scende di venti decibel
   al secondo: un picco che sparisse nell'istante in cui è passato non si farebbe
   mai vedere, perché a sessanta fotogrammi al secondo una goccia sta in un
   fotogramma solo. */
const FONDO_DB = -54;
const tenutaPicco = [-99, -99];
let ultimoPicco = 0;

function misuratoreLR(box, orologio) {
  if (!box) return;
  const dt = clamp(orologio - ultimoPicco, 0, 0.5);
  ultimoPicco = orologio;
  const p = banco ? banco.picchi() : [-Infinity, -Infinity];
  const n = Math.max(8, Math.floor(box.w / 7));
  const largo = box.w / n - 2;
  for (let lato = 0; lato < 2; lato++) {
    const y = box.y + lato * 9;
    tenutaPicco[lato] = Math.max(p[lato], tenutaPicco[lato] - 20 * dt);
    const u = clamp((p[lato] - FONDO_DB) / -FONDO_DB, 0, 1);
    const tenuta = clamp((tenutaPicco[lato] - FONDO_DB) / -FONDO_DB, 0, 1);
    const acceso = Math.round(u * n), tenuto = Math.round(tenuta * n) - 1;
    for (let k = 0; k < n; k++) {
      T.fillStyle = tinta(k < acceso ? "inchiostro" : (k === tenuto ? "grigio" : "spento"));
      T.fillRect(box.x + k * (box.w / n), y, largo, 6);
    }
    scritta(lato ? "R" : "L", box.x - 8, y + 5.5, { dim: 7.5, sp: 0, all: "right" });
  }
}

/* --------------------------------------------------------------- lo spettro
   La curva vera dell'equalizzatore, chiesta ai filtri con
   `getFrequencyResponse`: non un disegno che assomiglia alle otto aste, ma la
   risposta della catena che sta suonando. Punteggiata, perché una campitura
   piena su questa carta peserebbe più del suono che descrive. */
const PUNTI_SPETTRO = 220;
const HZ_SPETTRO = new Float32Array(PUNTI_SPETTRO);
const MAG_SPETTRO = new Float32Array(PUNTI_SPETTRO);
const FASE_SPETTRO = new Float32Array(PUNTI_SPETTRO);
const SOMMA_SPETTRO = new Float32Array(PUNTI_SPETTRO);
for (let i = 0; i < PUNTI_SPETTRO; i++) {
  HZ_SPETTRO[i] = 20 * Math.pow(1000, i / (PUNTI_SPETTRO - 1));   // 20 Hz … 20 kHz
}

function spettro(box) {
  if (!box) return;
  const mezzo = box.cy;
  riga(box.x, mezzo, box.x + box.w, mezzo, 1, tinta("filo-2"));
  SOMMA_SPETTRO.fill(0);
  if (banco) {
    for (const f of banco.eq.filtri) {
      f.getFrequencyResponse(HZ_SPETTRO, MAG_SPETTRO, FASE_SPETTRO);
      for (let i = 0; i < PUNTI_SPETTRO; i++) {
        SOMMA_SPETTRO[i] += 20 * Math.log10(Math.max(1e-6, MAG_SPETTRO[i]));
      }
    }
  }
  const scala = (box.h / 2 - 3) / (EQ_CORSA * 1.6);
  for (let i = 0; i < PUNTI_SPETTRO; i++) {
    const x = box.x + (i / (PUNTI_SPETTRO - 1)) * box.w;
    const h = SOMMA_SPETTRO[i] * scala;
    if (Math.abs(h) < 0.6) continue;
    const passi = Math.max(1, Math.round(Math.abs(h) / 3));
    for (let k = 0; k <= passi; k++) {
      const y = mezzo - (h * k) / passi;
      T.fillStyle = tinta("inchiostro-2", 0.55);
      T.fillRect(Math.round(x), Math.round(y), 1.4, 1.4);
    }
  }
  // Le otto frequenze, sul filo di mezzo: le aste stanno sotto, e senza queste
  // non si saprebbe quale asta muove quale gobba.
  BANDE.forEach((b) => {
    const u = Math.log(b.hz / 20) / Math.log(1000);
    riga(box.x + u * box.w, mezzo - 3, box.x + u * box.w, mezzo + 3, 1, tinta("filo"));
  });
}

/* Lo zero delle otto aste, con i due estremi della corsa. Senza questa riga le
   aste sarebbero otto quadratini sospesi: è il filo dello zero a dire che
   quello è un equalizzatore e non otto cursori qualunque. */
function zeroAste(box) {
  if (!box) return;
  riga(box.x, box.cy, box.x + box.w, box.cy, 1, tinta("filo-2"));
  for (const lato of [-1, 1]) {
    const x = lato < 0 ? box.x - 10 : box.x + box.w + 10;
    const all = lato < 0 ? "left" : "right";
    scritta("+", x, box.y + 8, { dim: 8, sp: 0, all, col: "muto" });
    scritta("0", x, box.cy + 3, { dim: 8, sp: 0, all, col: "grigio" });
    scritta("−", x, box.y + box.h - 2, { dim: 8, sp: 0, all, col: "muto" });
  }
}

/* ------------------------------------------------------- la fascia dei grani
   LA MATERIA INTERA, distesa per il lungo: da sinistra a destra c'è tutto il
   file, dal primo campione all'ultimo. Non è più una finestra che scorre — è
   l'oggetto che si sta macinando, fermo, e sopra ci si vede passare la testa di
   lettura. Chi granula ha bisogno di sapere DOVE sta dentro il suono, e per
   saperlo deve vedere il suono per intero.

   L'onda è un ISTOGRAMMA DI QUADRATINI IN SCALA DI GRIGI, e i due fatti contano
   tutti e due. Quadratini perché è il segno di tutta la tavola — il quadrato
   d'inchiostro dei cursori, delle fasi, delle punte del baricentro — e una
   campitura piena qui peserebbe più del suono che descrive. In scala di grigi
   perché IL COLORE È GIÀ IMPEGNATO: dice l'altezza, e sopra questa onda ci
   cadono i grani, che sono colorati. Un'onda colorata e dei grani colorati
   sarebbero due cose che si assomigliano e non vogliono dire lo stesso.

   I grani si disegnano DOVE VENGONO PRESI: la x è il punto del materiale da cui
   il grano è stato ritagliato, la y è dove finisce nel campo stereo, il colore è
   di quanto è stato trasposto. Così i due cursori che aprono la nube si vedono
   per quello che fanno — «dispersione» la allarga per il lungo, «sparpaglio»
   per l'alto — e la nube resta attaccata alla testa invece di essere un grafico
   a parte. */
const ALTEZZE_ONDA = 7;          // quanti quadratini per mezza altezza
const PASSO_ONDA = 5.4;          // il passo delle colonne, come sul baricentro
const LATO_ONDA = 3;
const LATO_GRANO = 5;

/* L'onda si calcola una volta per materiale e per riquadro, e si tiene disegnata
   su una tela sua. Un file di novanta secondi sono quattro milioni di campioni e
   duecentocinquanta colonne di quadratini: rifarli sessanta volte al secondo
   sarebbe l'unica cosa in tutta la tavola capace di far saltare il suono. */
let ondaTela = null, ondaChiave = "";

function disegnaOnda(m, largo, alto) {
  const chiave = m.nome + "|" + m.durata + "|" + Math.round(largo) + "|" + Math.round(alto);
  if (ondaChiave === chiave && ondaTela) return ondaTela;

  const n = Math.max(8, Math.floor(largo / PASSO_ONDA));
  const d = m.buffer.getChannelData(0);
  const picchi = new Float32Array(n);
  const passo = d.length / n;
  let massimo = 0;
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i * passo), b = Math.min(d.length, Math.floor((i + 1) * passo));
    let max = 0;
    // Su buffer lunghi non serve guardarli tutti: un campione ogni tre dà lo
    // stesso profilo a occhio e costa un terzo.
    for (let k = a; k < b; k += 3) { const x = Math.abs(d[k]); if (x > max) max = x; }
    picchi[i] = max;
    if (max > massimo) massimo = max;
  }
  // Si normalizza sul picco del materiale: una registrazione presa piano
  // altrimenti sarebbe una riga piatta, e non si potrebbe mirare niente.
  const scala = massimo > 1e-4 ? 1 / massimo : 0;

  ondaTela = ondaTela || document.createElement("canvas");
  ondaTela.width = Math.round(largo * DPR);
  ondaTela.height = Math.round(alto * DPR);
  const O = ondaTela.getContext("2d");
  O.setTransform(DPR, 0, 0, DPR, 0, 0);
  O.clearRect(0, 0, largo, alto);

  const mezzo = alto / 2;
  const salto = (alto / 2 - 2) / ALTEZZE_ONDA;
  const largoCol = largo / n;
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * largoCol - LATO_ONDA / 2;
    const quanti = Math.round(clamp(picchi[i] * scala, 0, 1) * ALTEZZE_ONDA);
    if (!quanti) {
      // La colonna muta non sparisce: resta un segno chiarissimo sulla riga di
      // mezzo. Una colonna vuota si leggerebbe come un buco nel file.
      O.fillStyle = tinta("filo-2");
      O.fillRect(x + 0.5, mezzo - 1, 2, 2);
      continue;
    }
    for (let k = 1; k <= quanti; k++) {
      // La scala di grigi: pieno vicino alla riga, sempre più tenue verso la
      // punta. È il modo di dare un peso alla colonna senza annerirla tutta.
      const u = (k - 1) / Math.max(1, ALTEZZE_ONDA - 1);
      O.fillStyle = tinta(u < 0.45 ? "inchiostro-2" : u < 0.75 ? "grigio" : "spento",
                          u < 0.45 ? 0.9 : 1);
      O.fillRect(x, mezzo - k * salto - LATO_ONDA / 2, LATO_ONDA, LATO_ONDA);
      O.fillRect(x, mezzo + k * salto - LATO_ONDA / 2, LATO_ONDA, LATO_ONDA);
    }
  }
  ondaChiave = chiave;
  return ondaTela;
}

function fasciaGrani(box, ora) {
  if (!box) return;
  const m = materiaCorrente();

  if (!m) {
    ondaChiave = "";
    riga(box.x, box.cy, box.x + box.w, box.cy, 1, tinta("filo-2"), [2, 5]);
    scritta("nessuna materia: carica un suono, o apri il microfono",
      box.cx, box.cy - 8, { dim: 9, sp: .4, all: "center", base: "middle" });
    return;
  }

  T.save();
  if (!graniOn) T.globalAlpha = 0.4;

  const perSec = box.w / m.durata;
  const centro = centroNube();
  const largoNube = (effGR.nube / 100) * 2.5;

  // La nube prima dell'onda: è il fondo su cui si legge, non un velo sopra.
  const nx0 = Math.max(box.x, box.x + (centro - largoNube) * perSec);
  const nx1 = Math.min(box.x + box.w, box.x + (centro + largoNube) * perSec);
  T.fillStyle = tinta("filo-2", 0.55);
  T.fillRect(nx0, box.y, Math.max(1.5, nx1 - nx0), box.h);

  T.drawImage(disegnaOnda(m, box.w, box.h), box.x, box.y, box.w, box.h);

  /* I grani, dove sono stati presi. Sono gli ultimi due secondi e basta: la
     nube è una cosa che succede adesso, e una scia lunga direbbe che i grani
     restano dove sono caduti. */
  for (const g of storiaGrani) {
    const eta = ora - g.t;
    if (eta > FASCIA_GRANI) continue;
    const a = clamp(1 - eta / FASCIA_GRANI, 0, 1);
    const x = box.x + g.dentro * perSec;
    const y = box.cy + g.pan * (box.h / 2 - LATO_GRANO);
    // Lo strappo: il grano cancella un filo di onda attorno a sé prima di
    // posarsi. Senza, un quadratino colorato dentro un banco di quadratini
    // grigi della stessa misura si perde — e la nube è la cosa da guardare.
    T.save();
    T.globalAlpha = 1;
    quadretto(x, y, LATO_GRANO, coloreSpettro(0.5 + g.semi / 48, 0.35 + a * 0.65), 1.2);
    T.restore();
  }

  // La testa: dove si sta leggendo. Il quadratino sta fuori dall'onda, perché
  // dentro si confonderebbe con un transiente.
  const tx = box.x + centro * perSec;
  riga(tx, box.y - 3, tx, box.y + box.h + 3, 1, tinta("inchiostro"));
  quadretto(tx, box.y - 6, 5, tinta("inchiostro"), 0);

  scritta("0″", box.x, box.y + box.h + 9, { dim: 7.5, sp: .6, base: "top" });
  scritta(minsec(m.durata), box.x + box.w, box.y + box.h + 9,
          { dim: 7.5, sp: .6, all: "right", base: "top" });
  T.restore();
}

/* ------------------------------------------------------ il circolo delle quinte
   Dodici tacche nell'ordine del circolo, non in quello della scala: fra una
   pentatonica e la sua quinta cambia UNA nota su cinque, ed è il passo più
   piccolo che ci sia fra due collezioni consonanti. Il cammino è deterministico
   nei due versi, quindi accanto a dove siamo si può scrivere dove si andrà. */
function fasciaQuinte(box) {
  if (!box) return;
  const y = box.y + box.h - 14;
  riga(box.x, y, box.x + box.w, y, 1, tinta("filo"));
  const passo = box.w / 12;
  const qui = CIRCOLO.indexOf(tonalita());
  const poi = CIRCOLO.indexOf(tonalitaFra(1));
  for (let k = 0; k < 12; k++) {
    const x = box.x + (k + 0.5) * passo;
    const suona = k === qui, dopo = k === poi;
    riga(x, y, x, y + (suona ? 7 : 4), 1, tinta(suona ? "inchiostro" : "filo"));
    scritta(NOMI_NOTE[CIRCOLO[k]], x, y - 7, {
      dim: suona ? 11 : 9, sans: true, sp: 0.2, all: "center",
      col: suona ? "inchiostro" : dopo ? "grigio" : "muto",
    });
    if (suona) quadretto(x, y - 22, 6, tinta("inchiostro"), 0);
    if (dopo) quadretto(x, y - 22, 4, tinta("muto"), 0);
  }
}

/* ------------------------------------------------------------- il baricentro
   Quindici minuti di passato, e nessun futuro: la corsia dice DOVE SIAMO
   ARRIVATI, che è una cosa che si guarda di sfuggita mentre si ascolta.

   È un ISTOGRAMMA A PUNTI e non una curva, ed è la scelta del disegno: una
   linea continua su una fascia alta quaranta pixel diventa un filo che
   ondeggia e non si legge più di quanto sia salito; una colonna di punti si
   conta. Il baricentro poi non è un segnale continuo che valga la pena
   interpolare — è la finestra che guarda il campo, e si muove a gradi.

   Non serve nessuna memoria per disegnarlo: la deriva è una funzione del
   tempo, quindi `misto()` risponde per qualunque istante passato e la corsia
   si ricostruisce a ogni fotogramma. Una sessione ripresa dopo una pausa non
   ha buchi, e non c'è un secondo posto dove lo stato possa divergere.

   QUANDO IL VALORE È NULLO LA COLONNA NON SPARISCE: resta un puntino più
   piccolo e più chiaro sulla linea dello zero. Una colonna vuota si
   leggerebbe come un buco nei dati, e invece è un momento in cui la finestra
   stava esattamente in mezzo al campo. */
const FINESTRA_BARICENTRO = 15 * 60;
const PASSO_COLONNA = 5.43;      // dal disegno: 46 colonne su 250
const PASSO_PUNTO = 5.6;
const PUNTI_MAX = 3;

function fasciaBaricentro(box, ora) {
  if (!box) return;
  riga(box.x, box.cy, box.x + box.w, box.cy, 1, tinta("filo-2"));

  const n = Math.max(12, Math.round(box.w / PASSO_COLONNA));
  const passoX = box.w / n;
  const alt = Math.min(PASSO_PUNTO, (box.h / 2 - 2) / PUNTI_MAX);

  /* I valori prima, le colonne poi: servono i vicini per riconoscere le punte.
     `misto()` è la stessa funzione che il motore chiama per muovere il campo —
     la corsia non ha una sua idea del baricentro, ha la sua. */
  const v = new Array(n), vivo = new Array(n);
  for (let i = 0; i < n; i++) {
    const t = ora - FINESTRA_BARICENTRO + ((i + 0.5) / n) * FINESTRA_BARICENTRO;
    // Prima dell'accensione non c'è niente da mostrare. `misto()` risponderebbe
    // lo stesso — è una funzione del tempo e il tempo negativo esiste — ma
    // sarebbe un baricentro che non ha mai spostato una nota: la corsia si
    // riempie da destra man mano che la seduta va avanti, e quel vuoto dice da
    // quanto si sta ascoltando.
    vivo[i] = t >= 0;
    v[i] = misto(t, 0, 3, 5);
  }

  for (let i = 0; i < n; i++) {
    if (!vivo[i]) continue;
    const x = box.x + (i + 0.5) * passoX;
    const quanti = Math.min(PUNTI_MAX, Math.round(Math.abs(v[i]) * (PUNTI_MAX + 0.4)));

    if (!quanti) {
      T.fillStyle = tinta("filo");
      T.beginPath(); T.arc(x, box.cy, 1.1, 0, RADIANTI); T.fill();
      continue;
    }

    /* LE PUNTE SI SCRIVONO A INCHIOSTRO PIENO: la colonna dove la curva ha
       girato, in su o in giù. Più colonne vicine arrotondano allo stesso numero
       di punti — tre punti sono tre punti — e senza questo segno non si saprebbe
       quale delle tre è il momento in cui il baricentro ha smesso di salire.
       È l'unica cosa che un istogramma perde rispetto a una curva, e costa un
       confronto con i due vicini. */
    const a = Math.abs(v[i]);
    const punta = a >= Math.abs(v[i - 1] === undefined ? -1 : v[i - 1]) &&
                  a >  Math.abs(v[i + 1] === undefined ? -1 : v[i + 1]);
    T.fillStyle = punta ? tinta("inchiostro") : tinta("inchiostro-2", 0.7);
    for (let k = 1; k <= quanti; k++) {
      T.beginPath();
      T.arc(x, box.cy - Math.sign(v[i]) * k * alt, 1.3, 0, RADIANTI);
      T.fill();
    }
  }
}

/* ------------------------------------------------------------- il fotogramma
   Il ciclo del disegno e SOLO il disegno. Niente di quello che il suono deve
   sapere si calcola qui: i valori efficaci stanno in `passo()`, dentro il
   motore, perché il rendering fuori tempo reale non ha nessuno schermo davanti
   e questo ciclo lì non gira. È una regola pagata.

   `requestAnimationFrame` si ferma da sé a pagina nascosta, che è esattamente
   quello che serve: a schermo bloccato il suono continua e il disegno no. */
const CORONA_GOCCE = [
  { min: 5, max: 100, eff: () => effG.addensamento },
  { min: 1, max: 20,  eff: () => effG.densita },
  { min: 0, max: 100, eff: () => effG.spazio },
];
const CORONA_TESSUTI = [
  { min: 0, max: 100, eff: () => effGT.intreccio },
  { min: 8, max: 60,  eff: () => effGT.livello },
  { min: 0, max: 100, eff: () => effGT.spazio },
];

let codaGocce = 1.8;

function disegna() {
  const ora = ctx ? ctx.currentTime : 0;
  const orologio = performance.now() / 1000;
  const f = foglio.getBoundingClientRect();
  originaFoglio = { left: f.left, top: f.top };
  if (Math.abs(f.width - LARGO) > 0.5 || Math.abs(foglio.scrollHeight - ALTO) > 0.5) ridimensiona();

  T.setTransform(DPR, 0, 0, DPR, 0, 0);
  T.clearRect(0, 0, LARGO, ALTO);
  T.lineCap = "butt";

  codaGocce = formaGocce(effG.calore).coda;
  quadrante(quadro("gocce"), {
    attiva: frasiOn, linee: frasi, corona: CORONA_GOCCE,
    anello: {
      frequenza: (ev) => altezza(ev.rel, effG.registro / 100),
      segno: segnoGoccia,
    },
  }, ora);

  const banda = TERRITORIO[timbroTessuti];
  quadrante(quadro("tessuti"), {
    attiva: tessutiOn, linee: tessuti, corona: CORONA_TESSUTI,
    anello: {
      // Il territorio conta: la stessa nota suonata da «bordone» sta due ottave
      // sotto quella di «brina», e sulla tavola dev'essere blu.
      frequenza: (ev) => nelTerritorio(altezza(ev.rel, effGT.registro / 100), banda),
      segno: segnoTenuta,
    },
  }, ora);

  manopola(manopolaDi("registro"),  G.registro / 100,  effG.registro / 100);
  manopola(manopolaDi("calore"),    G.calore / 100,    effG.calore / 100);
  manopola(manopolaDi("tregistro"), G.tRegistro / 100, effGT.registro / 100);
  manopola(manopolaDi("passo"),     G.tPasso / 100,    effGT.passo / 100);

  misuratoreLR(quadro("misuratore"), orologio);
  spettro(quadro("spettro"));
  zeroAste(quadro("aste"));
  fasciaGrani(quadro("grani"), ora);
  fasciaQuinte(quadro("quinte"));
  fasciaBaricentro(quadro("baricentro"), ora);
}

function fotogramma() {
  requestAnimationFrame(fotogramma);
  if (document.hidden) return;
  disegna();
}

leggiTinte();
ridimensiona();
if (window.ResizeObserver) new ResizeObserver(() => ridimensiona()).observe(foglio);
else window.addEventListener("resize", ridimensiona);
fotogramma();
