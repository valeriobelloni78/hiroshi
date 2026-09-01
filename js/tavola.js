/* =============================================================================
   HIROSHI · tavola.js — il disegno

   La tavola è PURO DISPLAY: legge il modello e non tocca niente. Non c'è un
   solo ascoltatore in questo file, e non deve arrivarcene mai uno — i comandi
   sono elementi HTML nativi e stanno in `comandi.js`, dove funzionano col
   puntatore, col dito, col tasto Tab e con un lettore di schermo. Un cursore
   disegnato sarebbe un cursore che nessuno può usare senza vederlo.

   DUE LETTURE DEL SEGNO, UNA VOLTA CIASCUNA. Il COLORE è l'ALTEZZA — grave al
   blu, acuto al rosso mattone — e la LUNGHEZZA è la DURATA. Vale sui due
   quadranti come sulla fascia: una goccia è un arco corto che si spegne, una
   tenuta è un arco lungo che si apre e si chiude, e la lunghezza dell'uno e
   dell'altro è il tempo che stanno in aria. Nient'altro in questa tavola dice
   l'altezza o la durata, e nessun altro segno le dice al posto loro: chi
   aggiunge una terza codifica della stessa grandezza toglie a queste due la
   sola cosa che le rende leggibili.

   Da qui viene anche il resto del vocabolario: LO STATO È INCHIOSTRO. Acceso,
   spento, muto, dove sta la mano, dove sta la testa — tutto grigio o nero,
   perché il colore è già impegnato. È la stessa regola che i pulsanti hanno
   nel CSS, e vale per lo stesso motivo.

   LA PALETTE SI LEGGE DAL CSS. Non c'è un solo colore scritto qui dentro: le
   variabili di `css/style.css` sono l'unica fonte, e il canvas le prende da
   lì al caricamento. Cambiare la carta o lo spettro dell'altezza è un lavoro
   che si fa in un file solo.

   QUELLO CHE SI VEDE È QUELLO CHE SUONERÀ. Il colore di un evento esce da
   `altezza()`, la lunghezza di una tenuta da `durataTenuta()`, la sua
   opacità da `finestra()` — le stesse funzioni che scrivono l'audio, non una
   loro imitazione. Una tavola che ridisegnasse a modo suo quello che il motore
   fa a modo proprio comincerebbe a mentire al primo ritocco, e mentirebbe
   piano.
============================================================================= */

/* ------------------------------------------------------------------ la palette
   Si legge una volta al caricamento. Un colore diventa tre numeri perché il
   disegno ha bisogno di scriverlo con un'opacità, e `rgba()` vuole i canali:
   una stringa esadecimale non li dà. */
const TINTE = {};
const NOMI_TINTE = ["carta", "inchiostro", "inchiostro-2", "grigio",
                    "filo", "filo-2", "spento", "grave", "medio", "acuto"];
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

function mescola(a, b, u, alfa) {
  const c = [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * u));
  return alfa === undefined || alfa >= 1
    ? "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"
    : "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + alfa.toFixed(3) + ")";
}

/* ------------------------------------------------------- lo spettro dell'altezza
   Gli estremi sono FISSI e non presi dal campo corrente. Prendendoli da `SCALE`
   la rampa si sposterebbe a ogni passo di quinta: la stessa nota cambierebbe
   colore mentre suona la stessa cosa, e il colore smetterebbe di dire l'altezza
   per dire la tonalità.

   Non sono però gli estremi del campo — 65 e 1975 Hz — ma quelli del registro
   che si usa davvero. Il campo è largo cinque ottave e la selezione ne prende
   due o tre attorno al centro: tarando la rampa sul campo intero, tutto quello
   che si sente starebbe nel verde di mezzo e il colore non direbbe più niente.
   Chi esce dalla banda — il fondo di «bordone», il velo di «soglia» — finisce
   sul blu pieno o sul rosso pieno, che è la lettura giusta per un suono che sta
   davvero al fondo o davvero in cima. */
const HZ_FONDO = Math.log2(100);
const HZ_CIMA  = Math.log2(1500);

function coloreSpettro(u, alfa) {
  const v = clamp(u, 0, 1);
  return v < 0.5
    ? mescola(TINTE.grave, TINTE.medio, v * 2, alfa)
    : mescola(TINTE.medio, TINTE.acuto, (v - 0.5) * 2, alfa);
}

function coloreAltezza(hz, alfa) {
  return coloreSpettro((Math.log2(Math.max(20, hz)) - HZ_FONDO) / (HZ_CIMA - HZ_FONDO), alfa);
}

/* ------------------------------------------------------------------- la tela */
const tela = el("tavola");
const T = tela.getContext("2d");
let PIANTA = null;
let DPR = 1;

/* La pianta: dove sta ogni cosa, in unità logiche. L'ALTEZZA È UNA
   CONSEGUENZA della larghezza, non un numero fissato — il canvas non si
   deforma mai, cresce. Sotto i 430 px i due quadranti si impilano invece di
   rimpicciolirsi: un quadrante di sessanta pixel di raggio ha quattro anelli
   da quindici pixel l'uno, e su quattro anelli da quindici pixel non si legge
   niente. */
function disponi(larghezza) {
  const P = 16, aria = 16, capo = 15;
  const largo = larghezza - P * 2;
  const stretta = larghezza < 430;
  const lato = stretta ? largo : (largo - aria) / 2;
  const q = [];
  let y = P;
  q.push({ x: P, y, lato, capo });
  if (stretta) {
    y += capo + lato + aria;
    q.push({ x: P, y, lato, capo });
  } else {
    q.push({ x: P + lato + aria, y, lato, capo });
  }
  y += capo + lato + aria;
  const fascia = { x: P, y, w: largo, h: 80, capo }; y += fascia.h + capo + aria + 6;
  const corsia = { x: P, y, w: largo, h: 100, capo }; y += corsia.h + capo + aria;
  const misure = { x: P, y, w: largo, h: 38, capo }; y += misure.h + capo;
  return { W: larghezza, H: y + P, P, largo, q, fascia, corsia, misure };
}

function ridimensiona() {
  const spazio = tela.parentElement ? tela.parentElement.clientWidth : 560;
  PIANTA = disponi(Math.max(300, Math.floor(spazio)));
  // Oltre due volte e mezza non si guadagna niente che un occhio veda, e su un
  // telefono a DPR 3 il canvas costerebbe il doppio dei pixel per nulla.
  DPR = Math.min(window.devicePixelRatio || 1, 2.5);
  tela.width  = Math.round(PIANTA.W * DPR);
  tela.height = Math.round(PIANTA.H * DPR);
  tela.style.width  = PIANTA.W + "px";
  tela.style.height = PIANTA.H + "px";
}

/* ------------------------------------------------------------- le primitive
   Gli angoli si contano in GIRI e partono dalle dodici, in senso orario: è
   così che si legge un quadrante, ed è anche l'unità in cui il modello tiene
   le fasi — `ph` è già un giro. Convertire una volta sola, qui, vuol dire non
   sbagliare il verso da nessun'altra parte. */
const RADIANTI = Math.PI * 2;
function ang(giro) { return -Math.PI / 2 + giro * RADIANTI; }

function arco(cx, cy, r, da, quanto, spessore, colore) {
  if (quanto <= 0 || r <= 0) return;
  T.beginPath();
  T.arc(cx, cy, r, ang(da), ang(da + quanto));
  T.lineWidth = spessore;
  T.strokeStyle = colore;
  T.stroke();
}

function cerchio(cx, cy, r, spessore, colore, tratteggio) {
  T.save();
  if (tratteggio) T.setLineDash(tratteggio);
  T.beginPath();
  T.arc(cx, cy, r, 0, RADIANTI);
  T.lineWidth = spessore;
  T.strokeStyle = colore;
  T.stroke();
  T.restore();
}

/* Una tacca radiale: il segno che dice «qui», e l'unico modo di indicare un
   punto su un anello senza rubare spessore all'anello. */
function tacca(cx, cy, giro, r0, r1, spessore, colore) {
  const a = ang(giro);
  T.beginPath();
  T.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
  T.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
  T.lineWidth = spessore;
  T.strokeStyle = colore;
  T.stroke();
}

/* Il quadratino d'inchiostro, ruotato con la tangente: è lo stesso segno che
   il CSS mette sui cursori. L'unica forma tonda ammessa in tutta l'app è il
   punto che pulsa nell'intestazione, che è un segno e non un comando. */
function quadretto(cx, cy, r, giro, lato, colore) {
  const a = ang(giro);
  T.save();
  T.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  T.rotate(a);
  T.fillStyle = colore;
  T.fillRect(-lato / 2, -lato / 2, lato, lato);
  T.restore();
}

function riga(x0, y0, x1, y1, spessore, colore, tratteggio) {
  T.save();
  if (tratteggio) T.setLineDash(tratteggio);
  T.beginPath();
  T.moveTo(x0, y0); T.lineTo(x1, y1);
  T.lineWidth = spessore;
  T.strokeStyle = colore;
  T.stroke();
  T.restore();
}

function scritta(s, x, y, opz) {
  const o = opz || {};
  const dim = o.dim || 9;
  T.font = dim + "px " + (o.sans ? CARATTERE_SANS : CARATTERE_MONO);
  if ("letterSpacing" in T) T.letterSpacing = (o.sp || 0) + "px";
  T.fillStyle = o.pieno || tinta(o.col || "inchiostro", o.alfa);
  T.textAlign = o.all || "left";
  T.textBaseline = o.base || "alphabetic";
  T.fillText(s, x, y);
  if ("letterSpacing" in T) T.letterSpacing = "0px";
}

/* La riga di titolo di una sezione: il numero e il nome a sinistra, lo stato a
   destra. Gli stessi due pezzi che il CSS mette sopra ogni gruppo di comandi,
   perché la tavola e la colonna sono lo stesso oggetto visto da due parti. */
function intestazione(x, y, w, sinistra, destra) {
  scritta(sinistra.toUpperCase(), x, y, { dim: 8.5, sp: 1.9, col: "inchiostro" });
  if (destra) scritta(destra.toUpperCase(), x + w, y, { dim: 8.5, sp: 1.4, col: "grigio", all: "right" });
  riga(x, y + 5.5, x + w, y + 5.5, 1, tinta("filo"));
}

/* ------------------------------------------------------------------ la scia
   Un evento è un arco che si spegne, e si spegne come si spegne il suono: la
   forma dell'opacità viene passata da chi lo disegna, e chi lo disegna la
   prende dal motore. Segmenti, non un gradiente: un gradiente lungo un arco
   non esiste in canvas, e un arco solo di opacità costante direbbe che una
   goccia dura quanto una tenuta.

   I segmenti si sovrappongono di un filo, altrimenti fra l'uno e l'altro
   resta una cucitura chiara che a schermo si legge come una graduazione. */
function scia(cx, cy, r, da, quanto, spessore, colore, forma) {
  const n = clamp(Math.round(quanto * 110), 3, 56);
  const passo = quanto / n;
  // L'opacità si MOLTIPLICA per quella che c'è già e si rimette dov'era. Un
  // `globalAlpha = 1` alla fine sembrerebbe la stessa cosa e non lo è: cancella
  // l'opacità con cui una classe spenta è stata avvolta, e una classe spenta
  // tornerebbe a disegnarsi piena. È successo, e si vede solo togliendo la
  // spunta a una classe mentre suona.
  const base = T.globalAlpha;
  for (let k = 0; k < n; k++) {
    const a = forma((k + 0.5) / n);
    if (a <= 0.012) continue;
    T.globalAlpha = base * a;
    arco(cx, cy, r, da + k * passo, passo * 1.35, spessore, colore);
  }
  T.globalAlpha = base;
}

/* ---------------------------------------------------------------- la corona
   Quello che la mano ha scelto e quello che sta suonando, sullo stesso arco.
   L'arco pieno è il CURSORE, la tacca è l'EFFICACE: fra i due c'è la deriva,
   l'ora e la stagione, e vederli separati è tutto il punto — un numero solo
   racconterebbe una cosa che non è vera. È la stessa doppia lettura che la
   colonna scrive come «45 → 61», detta in modo che si veda muovere.

   Le corone non hanno etichette ferme. Ne compare una, per due secondi e
   mezzo, sul settore che la mano ha appena mosso: una tavola con dodici
   parole scritte attorno a due cerchi è una tavola che si legge una volta
   sola, e poi si smette. Il nome per esteso sta nella colonna, dove serve
   quando si cerca; qui serve solo quando si tocca. */
const CORONA_GOCCE = [
  { et: "registro",     chiave: "registro",     min: 0, max: 100, cur: () => G.registro,     eff: () => effG.registro },
  { et: "calore",       chiave: "calore",       min: 0, max: 100, cur: () => G.calore,       eff: () => effG.calore },
  { et: "densità",      chiave: "densita",      min: 1, max: 20,  cur: () => G.densita,      eff: () => effG.densita },
  { et: "addensamento", chiave: "addensamento", min: 5, max: 100, cur: () => G.addensamento, eff: () => effG.addensamento },
  { et: "spazio",       chiave: "spazio",       min: 0, max: 100, cur: () => G.spazio,       eff: () => effG.spazio },
];

const CORONA_TESSUTI = [
  { et: "registro",  chiave: "tRegistro",  min: 0,   max: 100, cur: () => G.tRegistro,  eff: () => effGT.registro },
  { et: "intreccio", chiave: "tIntreccio", min: 0,   max: 100, cur: () => G.tIntreccio, eff: () => effGT.intreccio },
  { et: "apertura",  chiave: "tApertura",  min: 0.3, max: 12,  cur: () => G.tApertura,  eff: () => effGT.apertura },
  { et: "chiusura",  chiave: "tChiusura",  min: 0.3, max: 15,  cur: () => G.tChiusura,  eff: () => effGT.chiusura },
  { et: "passo",     chiave: "tPasso",     min: 0,   max: 100, cur: () => G.tPasso,     eff: () => effGT.passo },
  { et: "livello",   chiave: "tLivello",   min: 8,   max: 60,  cur: () => G.tLivello,   eff: () => effGT.livello },
  { et: "spazio",    chiave: "tSpazio",    min: 0,   max: 100, cur: () => G.tSpazio,    eff: () => effGT.spazio },
];

/* Quale filetto è stato mosso per ultimo. La tavola NON ascolta i cursori: si
   accorge da sé che un bersaglio è cambiato, guardando `GT` a ogni fotogramma.
   È la differenza fra guardare e farsi chiamare, ed è la ragione per cui
   questo file resta puro display anche mentre reagisce.

   Un mood scrive quindici bersagli in un colpo: quando i cambiati sono più
   d'uno non è una mano su un filetto, è uno scatto, e l'etichetta tace. */
const MEMORIA_GT = {};
const TOCCATO = { chiave: null, quando: -99 };
const DURATA_ETICHETTA = 2.5;

function sorveglia(orologio) {
  let quale = null, quanti = 0;
  for (const k in GT) {
    if (MEMORIA_GT[k] === undefined) { MEMORIA_GT[k] = GT[k]; continue; }
    if (Math.abs(GT[k] - MEMORIA_GT[k]) > 1e-9) { MEMORIA_GT[k] = GT[k]; quale = k; quanti++; }
  }
  if (quanti === 1) { TOCCATO.chiave = quale; TOCCATO.quando = orologio; }
}

const SPESSORE_CORONA = 6;

function corona(cx, cy, R, voci, orologio) {
  const r1 = R, r0 = R - SPESSORE_CORONA, rm = (r0 + r1) / 2;
  const fetta = 1 / voci.length;
  const stacco = Math.min(0.016, fetta * 0.12);
  cerchio(cx, cy, r0, 1, tinta("filo-2"));
  cerchio(cx, cy, r1, 1, tinta("filo-2"));

  voci.forEach((v, i) => {
    const da = i * fetta + stacco, quanto = fetta - stacco * 2;
    const u = (x) => clamp((x - v.min) / (v.max - v.min), 0, 1);
    arco(cx, cy, rm, da, quanto, SPESSORE_CORONA - 2, tinta("filo-2", 0.9));
    arco(cx, cy, rm, da, quanto * u(v.cur()), SPESSORE_CORONA - 2, tinta("inchiostro-2", 0.30));
    tacca(cx, cy, da + quanto * u(v.eff()), r0 - 1.5, r1 + 1.5, 1.3, tinta("inchiostro"));

    if (TOCCATO.chiave === v.chiave) {
      const eta = orologio - TOCCATO.quando;
      if (eta < DURATA_ETICHETTA) {
        const a = ang(da + quanto / 2);
        const dx = Math.cos(a), dy = Math.sin(a);
        scritta(v.et, cx + dx * (R + 8), cy + dy * (R + 8), {
          dim: 8, sp: 0.6, col: "inchiostro", base: "middle",
          all: dx < -0.25 ? "right" : dx > 0.25 ? "left" : "center",
          alfa: clamp((DURATA_ETICHETTA - eta) * 2, 0, 1),
        });
      }
    }
  });
}

/* ------------------------------------------------------------------- gli anelli
   Un anello è una linea: il giro intero è la circonferenza, e la fase corrente
   è la tacca d'inchiostro che ci scorre sopra. Quattro anelli concentrici sono
   le quattro linee di una classe, dalla più interna alla più esterna nell'ordine
   in cui il modello le tiene — non nell'ordine dei periodi, che cambiano coi
   mood: un anello che si spostasse di posto a ogni cambio di carattere non
   sarebbe più «la seconda linea», sarebbe un'altra linea ogni volta.

   LA ZONA ATTIVA, quella che il cursore «addensamento» apre e chiude, si vede
   solo sulle gocce: è la testa del giro, e tutto il resto del giro è silenzio.
   I tessuti occupano il giro intero e la loro zona attiva è l'anello stesso —
   disegnarla sarebbe disegnare due volte la stessa cosa. È la differenza
   strutturale fra le due classi, e sulla tavola si legge senza spiegazioni. */
function anello(cx, cy, r, L, ora, opz) {
  const muta = L.muted;
  const alfa = muta ? 0.3 : 1;

  if (opz.testa) {
    arco(cx, cy, r, L.offset, L.planHead, 5, tinta("spento", muta ? 0.4 : 0.9));
  }
  cerchio(cx, cy, r, 1, tinta(muta ? "filo-2" : "filo"), muta ? [2, 3] : null);

  for (const p of L.plan) {
    const ev = p.ev;
    const hz = opz.frequenza(ev);
    const dur = opz.durata(ev, L);
    const quanto = Math.min(dur / L.period, 0.985);
    const col = coloreAltezza(hz);
    const forma = opz.forma(dur, quanto * L.period);
    const base = T.globalAlpha;
    T.globalAlpha = base * alfa;
    scia(cx, cy, r, p.ph, quanto, opz.spessore, col, forma);
    T.globalAlpha = base;
    quadretto(cx, cy, r, p.ph, opz.spessore + 1.6, coloreAltezza(hz, alfa));

    /* IL LAMPO. Un evento che ha appena suonato si allarga e si spegne in un
       secondo. È l'unico posto della tavola in cui il tempo del disegno e
       quello dell'audio si toccano, e si toccano su `flash`, che è il campo
       che il motore scrive quando prenota. Non è una simulazione del suono:
       è il suono che dice quando è uscito. */
    const eta = ora - ev.flash;
    if (!muta && eta >= -0.05 && eta < 1) {
      const k = clamp(eta, 0, 1);
      T.save();
      T.globalAlpha *= (1 - k) * 0.85;
      const a = ang(p.ph);
      T.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      T.rotate(a);
      T.strokeStyle = col;
      T.lineWidth = 1;
      const l = 4 + k * 9;
      T.strokeRect(-l / 2, -l / 2, l, l);
      T.restore();
    }
  }

  /* IL NUMERO DELLA LINEA, sul raggio di sinistra. Le otto righe di comandi
     dicono «3 · 13,0 s · silenzia», e senza un numero sull'anello non ci sarebbe
     modo di sapere quale dei quattro cerchi si sta silenziando.

     Il filo si INTERROMPE dove sta la cifra invece di passarci sotto: è la
     convenzione del disegno tecnico, e qui costa niente — il canvas è
     trasparente, quindi cancellare rimette la carta con la sua grana, non una
     toppa di colore. */
  const an = ang(0.75);
  const nx = cx + Math.cos(an) * r, ny = cy + Math.sin(an) * r;
  T.clearRect(nx - 5, ny - 5.5, 10, 11);
  scritta(String(L.i + 1), nx, ny, {
    dim: 8, col: muta ? "grigio" : "inchiostro-2", all: "center", base: "middle",
  });

  // Dove siamo dentro il giro. Il periodo è quello IN CORSO (`period`), non
  // quello scelto (`target`): la durata nuova entra al giro dopo, e una tacca
  // che corresse già col periodo nuovo direbbe una fase che non esiste.
  const fase = ((ora - L.cycleStart) / L.period) % 1;
  tacca(cx, cy, (fase + 1) % 1, r - 4.5, r + 4.5, 1.4, tinta(muta ? "grigio" : "inchiostro"));
}

/* ---------------------------------------------------------------- il quadrante */
function quadrante(cella, dati, ora, orologio) {
  const R = cella.lato / 2 - 10;
  const cx = cella.x + cella.lato / 2;
  const cy = cella.y + cella.capo + cella.lato / 2;

  intestazione(cella.x, cella.y + 8, cella.lato, dati.titolo, dati.attiva ? null : "tace");

  T.save();
  if (!dati.attiva) T.globalAlpha = 0.38;

  corona(cx, cy, R, dati.corona, orologio);
  dati.linee.forEach((L, i) => {
    anello(cx, cy, R * (0.36 + i * 0.15), L, ora, dati.anello);
  });

  scritta(dati.timbro, cx, cy - 2, { dim: 13, sans: true, all: "center", base: "middle", sp: 0.8 });
  scritta(dati.sotto, cx, cy + 12, { dim: 8, sp: 1.2, col: "grigio", all: "center", base: "middle" });
  T.restore();
}

/* ------------------------------------------------------- la fascia dei grani
   Il materiale disteso per il lungo, la testa di lettura che ci corre sopra e
   la nube che le sta attorno. È l'unica sezione in cui il tempo non è un giro
   ma una riga, perché il materiale non è periodico: ha un principio e una fine,
   e la testa ci si avvolge.

   L'onda si calcola una volta per materiale e per larghezza, e si tiene
   attaccata al materiale stesso. Un file di novanta secondi sono quattro
   milioni di campioni: rifarli a ogni fotogramma sarebbe l'unica cosa in tutta
   la tavola capace di far saltare il suono. */
function picchiDi(m, n) {
  if (m._picchi && m._picchi.length === n) return m._picchi;
  const d = m.buffer.getChannelData(0);
  const v = new Float32Array(n);
  const passo = d.length / n;
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i * passo), b = Math.min(d.length, Math.floor((i + 1) * passo));
    let max = 0;
    // Su buffer lunghi non serve guardarli tutti: un campione ogni tre dà lo
    // stesso profilo a occhio e costa un terzo.
    for (let k = a; k < b; k += 3) { const x = Math.abs(d[k]); if (x > max) max = x; }
    v[i] = max;
  }
  m._picchi = v;
  return v;
}

function fasciaGrani(zona, ora) {
  const m = materiaCorrente();
  const y0 = zona.y + zona.capo, alt = zona.h, mezzo = y0 + alt / 2;

  intestazione(zona.x, zona.y + 8, zona.w,
    "03 · grani",
    m ? m.nome + " · " + numero(m.durata, 1) + " s" : (graniOn ? "nessuna materia" : "tace"));

  if (!m) {
    scritta("carica un file o registra: la materia è il campo di chi ascolta",
      zona.x + zona.w / 2, mezzo, { dim: 9, col: "grigio", all: "center", base: "middle", sp: 0.4 });
    riga(zona.x, mezzo + 16, zona.x + zona.w, mezzo + 16, 1, tinta("filo-2"));
    return;
  }

  T.save();
  if (!graniOn) T.globalAlpha = 0.38;

  const n = Math.max(60, Math.floor(zona.w));
  const pk = picchiDi(m, n);
  const perSec = zona.w / m.durata;

  // La nube prima dell'onda: è il fondo su cui si legge, non un velo sopra.
  const centro = centroNube();
  const largo = (effGR.nube / 100) * 2.5;
  const nx0 = Math.max(zona.x, zona.x + (centro - largo) * perSec);
  const nx1 = Math.min(zona.x + zona.w, zona.x + (centro + largo) * perSec);
  T.fillStyle = tinta("filo-2", 0.75);
  T.fillRect(nx0, y0, Math.max(1.5, nx1 - nx0), alt);

  /* L'onda è un CONTORNO, non un pettine di stanghette. Un pettine, su un
     materiale forte, si riempie e diventa una macchia nera: si vede che c'è del
     suono e non si vede più dove — che è l'unica cosa per cui questa sezione
     esiste, perché la testa di lettura va portata su un punto preciso. Il
     profilo chiuso, tenue dentro e sottile fuori, tiene il segno leggero e
     lascia vedere i grani che ci stanno sopra. */
  T.beginPath();
  for (let i = 0; i < n; i++) {
    const x = zona.x + (i * zona.w) / n;
    const h = Math.max(0.4, pk[i] * (alt / 2 - 2));
    if (i === 0) T.moveTo(x, mezzo - h); else T.lineTo(x, mezzo - h);
  }
  for (let i = n - 1; i >= 0; i--) {
    const x = zona.x + (i * zona.w) / n;
    T.lineTo(x, mezzo + Math.max(0.4, pk[i] * (alt / 2 - 2)));
  }
  T.closePath();
  T.fillStyle = tinta("inchiostro", 0.1);
  T.fill();
  T.strokeStyle = tinta("inchiostro-2", 0.7);
  T.lineWidth = 1;
  T.stroke();

  /* I grani. La posizione dice DOVE sono stati pescati, l'altezza sullo schermo
     dice DOVE STANNO nel campo stereo, il colore dice di quanto sono stati
     trasposti — che su una materia registrata è tutto quello che si può dire
     dell'altezza: il materiale ha un'intonazione sua che nessuno conosce, e un
     temporale non ne ha affatto. Lo zero della rampa sta in mezzo, sul medio,
     e da lì si scende al grave e si sale all'acuto. */
  for (const g of storiaGrani) {
    const eta = ora - g.t;
    if (eta > FASCIA_GRANI) continue;
    const a = clamp(1 - eta / FASCIA_GRANI, 0, 1);
    const x = zona.x + g.dentro * perSec;
    const y = mezzo + g.pan * (alt / 2 - 4);
    const l = 2 + Math.min(3, g.dur * 12);
    T.fillStyle = coloreSpettro(0.5 + g.semi / 48, a * 0.9);
    T.fillRect(x - l / 2, y - l / 2, l, l);
  }

  // La testa: dove si sta leggendo. Il quadratino sopra è lo stesso segno del
  // cursore, e sta fuori dall'onda perché la linea da sola, dentro l'onda, si
  // confonderebbe con un transiente.
  const tx = zona.x + centro * perSec;
  riga(tx, y0 - 3, tx, y0 + alt + 3, 1.2, tinta("inchiostro"));
  T.fillStyle = tinta("inchiostro");
  T.fillRect(tx - 2.5, y0 - 7, 5, 5);

  riga(zona.x, y0 + alt + 6, zona.x + zona.w, y0 + alt + 6, 1, tinta("filo-2"));
  scritta(numero(centroNube(), 2) + " s · " + numero(sovrapposizioneGrani(), 1) + " insieme"
          + (graniIntonati ? " · intonato" : ""),
    zona.x + zona.w, y0 + alt + 16, { dim: 8, sp: 0.9, col: "grigio", all: "right" });
  T.restore();
}

/* --------------------------------------------------------- la corsia della deriva
   Il tempo lungo, dieci minuti: cinque passati e cinque che devono ancora
   arrivare. Il futuro si può disegnare perché la deriva è una funzione del
   tempo e non un accumulo — `misto()` risponde per qualunque t, e il cammino
   delle quinte si percorre nei due versi. È la sola sezione della tavola che
   mostra qualcosa che non è ancora successo, ed è anche la sola cosa del pezzo
   di cui si possa dire in anticipo che succederà.

   IL PASSATO È INCHIOSTRO, IL FUTURO È FILO. Non è decorazione: una curva sola
   direbbe che le due metà hanno lo stesso statuto, e invece una è successa e
   l'altra è una promessa che la mano può ancora rompere — basta cambiare un
   mood e la corsia del baricentro resta, ma tutto quello che ci sta sotto no. */
const FINESTRA_DERIVA = 300;

function corsiaDeriva(zona, ora) {
  const y0 = zona.y + zona.capo;
  const altA = 50, altB = 26;
  const mezzoA = y0 + altA / 2;
  const mx = zona.x + zona.w / 2;

  intestazione(zona.x, zona.y + 8, zona.w, "deriva",
    tavolozzaOraria(oraCorrente()).nome + " · " + tavolozzaStagionale(meseCorrente()).nome);

  riga(zona.x, mezzoA, zona.x + zona.w, mezzoA, 1, tinta("filo-2"), [2, 4]);

  // Il baricentro: il canale che fa salire e scendere tutto il pezzo — gocce,
  // tessuti e nube insieme. Gli altri quattro canali non stanno qui: ciascuno
  // muove un parametro solo, e quel parametro lo racconta già la tacca della
  // sua corona. Disegnarli tutti e cinque vorrebbe dire cinque curve lente
  // sovrapposte, che è il modo più sicuro di non leggerne nessuna.
  const passi = Math.max(60, Math.floor(zona.w));
  for (const futuro of [false, true]) {
    T.beginPath();
    for (let i = 0; i <= passi; i++) {
      const u = i / passi;
      if (futuro ? u < 0.5 : u > 0.5) continue;
      const t = ora + (u - 0.5) * 2 * FINESTRA_DERIVA;
      const x = zona.x + u * zona.w;
      const y = mezzoA - misto(t, 0, 3, 5) * (altA / 2 - 2);
      if ((futuro && u === 0.5) || (!futuro && i === 0)) T.moveTo(x, y); else T.lineTo(x, y);
    }
    T.lineWidth = futuro ? 1 : 1.3;
    T.strokeStyle = tinta(futuro ? "filo" : "inchiostro");
    T.stroke();
  }
  T.fillStyle = tinta("inchiostro");
  T.fillRect(mx - 2.5, mezzoA - deriva.centro * (altA / 2 - 2) - 2.5, 5, 5);

  scritta("baricentro", zona.x, y0 + 8, { dim: 8, sp: 0.9, col: "grigio" });

  /* Le quinte: dove sta la collezione e dove andrà. Il passo è regolare —
     centocinquanta secondi esatti, perché chi accompagna deve poter contare
     quanto manca — e la meta no: il cammino sturmiano su φ sale nel 61,8% dei
     casi, quindi il giro circola invece di marciare. Qui si leggono tutti e
     due i fatti in una riga sola. */
  const yB = y0 + altA + 10;
  riga(zona.x, yB + altB - 8, zona.x + zona.w, yB + altB - 8, 1, tinta("filo-2"));
  for (let k = -3; k <= 4; k++) {
    const t0 = prossimaQuinta + (k - 1) * PASSO_QUINTA;
    const t1 = t0 + PASSO_QUINTA;
    const u0 = (t0 - ora) / (2 * FINESTRA_DERIVA) + 0.5;
    const u1 = (t1 - ora) / (2 * FINESTRA_DERIVA) + 0.5;
    if (u1 < 0 || u0 > 1) continue;
    const qui = k === 0;
    const x0 = zona.x + clamp(u0, 0, 1) * zona.w;
    const x1 = zona.x + clamp(u1, 0, 1) * zona.w;
    if (u0 >= 0 && u0 <= 1) riga(x0, yB, x0, yB + altB - 8, 1, tinta(qui ? "inchiostro" : "filo"));
    /* Il nome sta all'INIZIO del tratto e non in mezzo. In mezzo capiterebbe
       ogni tanto sotto la verticale dell'ora, che è l'unica linea piena della
       tavola: una nota tagliata in due da una riga nera è una nota che si legge
       due volte prima di leggerla. All'inizio, invece, il nome appartiene alla
       tacca che lo precede, che è anche quello che vuol dire. */
    /* La collezione di ADESSO si scrive dopo la verticale dell'ora, non prima:
       subito dopo un passo di quinta la tacca e l'ora distano pochi pixel, e il
       nome finirebbe tagliato in due dall'unica linea piena della tavola. Dopo
       l'ora si legge anche meglio di quanto sia stato costretto a fare — «da
       qui in avanti, questa» — che è esattamente quello che dice. */
    const lx = qui ? Math.max(x0 + 5, mx + 5) : x0 + 5;
    if (x1 - lx > 20) {
      scritta(NOMI_NOTE[tonalitaFra(k)], lx, yB + altB - 12,
        { dim: qui ? 11 : 9, sans: true, col: qui ? "inchiostro" : "grigio" });
    }
  }
  scritta("collezione", zona.x, yB - 2, { dim: 8, sp: 0.9, col: "grigio" });

  // L'ora, che attraversa tutte e due le corsie: è l'unica verticale piena
  // della tavola, e non ce ne devono essere altre.
  riga(mx, y0, mx, yB + altB - 8, 1, tinta("inchiostro-2"));
  scritta("−5′", zona.x, yB + altB + 4, { dim: 7.5, sp: 0.8, col: "grigio", base: "top" });
  scritta("ora", mx, yB + altB + 4, { dim: 7.5, sp: 0.8, col: "grigio", all: "center", base: "top" });
  scritta("+5′", zona.x + zona.w, yB + altB + 4, { dim: 7.5, sp: 0.8, col: "grigio", all: "right", base: "top" });
}

/* ------------------------------------------------------------- i misuratori
   Due picchi e il limitatore. La riduzione cresce DALLA CIMA VERSO SINISTRA,
   cioè spinge indietro il segnale invece di crescere accanto: è quello che il
   limitatore fa davvero, e una barra che crescesse da sinistra come le altre
   due direbbe che è una terza sorgente.

   Il tenuta-picco scende di venti decibel al secondo. Un picco che sparisse
   nell'istante in cui è passato non si farebbe mai vedere: a sessanta
   fotogrammi al secondo, una goccia sta in un fotogramma solo. */
const FONDO_DB = -60;
const tenutaPicco = [-99, -99];
let ultimoPicco = 0;

function disegnaMisuratori(zona, orologio) {
  const dt = clamp(orologio - ultimoPicco, 0, 0.5);
  ultimoPicco = orologio;
  const y0 = zona.y + zona.capo;
  const xs = zona.x + 20, w = zona.w - 20;
  const u = (dB) => clamp((dB - FONDO_DB) / -FONDO_DB, 0, 1);

  intestazione(zona.x, zona.y + 8, zona.w, "04 · banco", running ? "in ascolto" : "fermo");

  const p = banco ? banco.picchi() : [-Infinity, -Infinity];
  ["L", "R"].forEach((nome, i) => {
    const y = y0 + 3 + i * 9;
    tenutaPicco[i] = Math.max(p[i], tenutaPicco[i] - 20 * dt);
    scritta(nome, zona.x, y + 3, { dim: 8, col: "grigio" });
    riga(xs, y, xs + w, y, 3, tinta("spento"));
    if (isFinite(p[i]) && p[i] > FONDO_DB) riga(xs, y, xs + u(p[i]) * w, y, 3, tinta("inchiostro"));
    if (isFinite(tenutaPicco[i]) && tenutaPicco[i] > FONDO_DB) {
      const x = xs + u(tenutaPicco[i]) * w;
      riga(x, y - 3, x, y + 3, 1, tinta("inchiostro-2"));
    }
  });

  // La scala sta SOTTO le due barre e non dietro: dietro, le graduazioni
  // attraverserebbero il segnale e ogni tacca si leggerebbe come un buco.
  for (const dB of [-48, -36, -24, -12, -6, 0]) {
    const x = xs + u(dB) * w;
    riga(x, y0 + 16, x, y0 + (dB === 0 ? 22 : 20), 1, tinta(dB === 0 ? "inchiostro" : "filo"));
  }
  // Il limitatore: lo zero è a destra, e la riduzione mangia all'indietro.
  const y = y0 + 27;
  const rid = banco ? banco.riduzione() : 0;
  scritta("lim", zona.x, y + 3, { dim: 8, col: "grigio" });
  riga(xs, y, xs + w, y, 3, tinta("spento", 0.5));
  if (rid < -0.05) {
    const q = clamp(-rid / 18, 0, 1) * w;
    riga(xs + w, y, xs + w - q, y, 3, tinta("inchiostro-2"));
  }
}

/* ------------------------------------------------------------- il fotogramma
   Il ciclo del disegno e SOLO il disegno. Niente di quello che il suono deve
   sapere si calcola qui: i valori efficaci stanno in `passo()`, dentro il
   motore, perché il rendering fuori tempo reale non ha nessuno schermo davanti
   e questo ciclo lì non gira. È una regola pagata: finché quel conto stava nel
   ciclo del disegno, un'esportazione usciva coi parametri congelati
   sull'ultimo fotogramma.

   `requestAnimationFrame` si ferma da sé a pagina nascosta, che è esattamente
   quello che serve: a schermo bloccato il suono continua e il disegno no. */
function disegna() {
  const ora = ctx ? ctx.currentTime : 0;
  const orologio = performance.now() / 1000;
  sorveglia(orologio);

  T.setTransform(DPR, 0, 0, DPR, 0, 0);
  T.clearRect(0, 0, PIANTA.W, PIANTA.H);
  T.lineCap = "butt";

  const codaGocce = formaGocce(effG.calore).coda;
  quadrante(PIANTA.q[0], {
    titolo: "01 · gocce",
    timbro: NOMI_TIMBRI[timbroFrasi] || timbroFrasi,
    sotto: MODI.gocce,
    attiva: frasiOn,
    corona: CORONA_GOCCE,
    linee: frasi,
    anello: {
      testa: true,
      spessore: 1.6,
      frequenza: (ev) => altezza(ev.rel, effG.registro / 100),
      // La goccia dura la sua coda: è il filetto che il calore muove, ed è
      // per questo che scaldando il timbro gli archi si allungano.
      durata: () => codaGocce,
      forma: (dur) => (u) => Math.pow(1 - u, 1.7) * 0.9,
    },
  }, ora, orologio);

  const banda = TERRITORIO[timbroTessuti];
  quadrante(PIANTA.q[1], {
    titolo: "02 · tessuti",
    timbro: NOMI_TESSUTI[timbroTessuti] || timbroTessuti,
    sotto: MODI.tessuti,
    attiva: tessutiOn,
    corona: CORONA_TESSUTI,
    linee: tessuti,
    anello: {
      testa: false,
      spessore: 2.8,
      // Il territorio conta: la stessa nota suonata da «bordone» sta due
      // ottave sotto quella di «brina», e sulla tavola dev'essere blu.
      frequenza: (ev) => nelTerritorio(altezza(ev.rel, effGT.registro / 100), banda),
      durata: (ev, L) => durataTenuta(L, ev),
      // L'opacità è l'inviluppo vero, preso dalla stessa funzione che scrive
      // l'automazione dell'audio: una tenuta si vede aprire e chiudere come si
      // sente aprire e chiudere.
      forma: (dur, disegnata) => {
        const inv = inviluppoDi(0, dur, { apertura: effGT.apertura, chiusura: effGT.chiusura });
        return (u) => 0.10 + 0.60 * finestra(u * disegnata, inv);
      },
    },
  }, ora, orologio);

  fasciaGrani(PIANTA.fascia, ora);
  corsiaDeriva(PIANTA.corsia, ora);
  disegnaMisuratori(PIANTA.misure, orologio);
}

function fotogramma() {
  requestAnimationFrame(fotogramma);
  if (document.hidden || !PIANTA) return;
  disegna();
}

leggiTinte();
ridimensiona();
if (window.ResizeObserver && tela.parentElement) {
  new ResizeObserver(() => { ridimensiona(); disegna(); }).observe(tela.parentElement);
} else {
  window.addEventListener("resize", () => { ridimensiona(); disegna(); });
}
fotogramma();
