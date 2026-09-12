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
const NOMI_TINTE = ["carta", "vetro", "inchiostro", "inchiostro-2", "grigio", "muto",
                    "filo", "filo-2", "spento", "ambra"];
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

/* ------------------------------------------------------------------ un accento
   Non c'è nessuna rampa. Sulla tavola il colore non dice l'altezza: dice
   ADESSO, e lo dice in un colore solo — l'ambra di Rada Deriva. Tutto il resto
   è inchiostro su carta.

   Prima l'altezza era un colore su cinque fermate, dal blu al rosso mattone.
   Su due quadranti pieni di tacche erano cinque cose che chiedevano attenzione
   insieme, e nessuna la otteneva; e per leggere un colore bisogna conoscere la
   chiave, mentre per vedere che cosa si è appena acceso non serve saper
   niente. L'altezza sui quadranti la dice adesso la LUNGHEZZA RADIALE di una
   goccia: corta grave, lunga acuta — il profilo melodico di un'idea si legge
   senza spendere un colore.

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
  leggiPiani();
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

/* ------------------------------------------------------------------- i piani
   IL VETRO È IL PIANO RIALZATO SU CUI APPOGGIANO GLI STRUMENTI: due
   piani per classe — il cerchio con le sue due manopole, l'effetto — il banco, la deriva. Lo disegna il canvas e
   non il foglio di stile perché il canvas sta SOTTO i comandi: un fondo messo
   su un elemento coprirebbe il quadrante che il canvas gli disegna dietro. Si
   disegna per primo, prima di ogni altra cosa del fotogramma.

   Le misure non sono qui. Quanto il piano sporge dal riquadro dell'elemento
   marcato `[data-piano]` lo dice il CSS, e si rilegge solo quando
   l'impaginazione cambia, cioè in `ridimensiona()`: un `getComputedStyle` per
   fotogramma costerebbe più del piano.

   IL PAESAGGIO RESTA SULLA CARTA, e non per dimenticanza: fuori dal segmento
   ci si posa sopra un velo che è fatto di carta, e sul vetro quel velo
   diventerebbe una toppa. Restano sulla carta anche le colonne dei comandi,
   la testata e il piede: il vetro sta sotto lo strumento, non sotto la lista
   delle sue manopole.

   IN MERIGGIO OGNI PIANO HA IL COLORE DELLA SUA SEZIONE, e il disegno non lo
   sa: legge `--piano-tinta` dall'elemento marcato, che negli altri due temi vale
   vetro. Si rilegge a ogni cambio di tema, insieme alle tinte. */
const PIANI = [];
let SMUSSO_PIANO = 0;

function leggiPiani() {
  PIANI.length = 0;
  const px = (s, k) => parseFloat(s.getPropertyValue(k)) || 0;
  for (const e of document.querySelectorAll("[data-piano]")) {
    const s = getComputedStyle(e);
    PIANI.push({ e, sopra: px(s, "--piano-sopra"), lato: px(s, "--piano-lato"),
                 sotto: px(s, "--piano-sotto"),
                 tinta: s.getPropertyValue("--piano-tinta").trim() || null,
                 x: 0, y: 0, w: 0, h: 0 });
  }
  SMUSSO_PIANO = px(getComputedStyle(document.documentElement), "--piano-smusso");
}

/* Gli smussi sono due, in alto a sinistra e in basso a destra: gli stessi del
   mockup, e gli stessi dei pulsanti scelti. */
function piani() {
  for (const p of PIANI) {
    T.fillStyle = p.tinta || tinta("vetro");
    const r = p.e.getBoundingClientRect();
    p.x = Math.round(r.left - originaFoglio.left - p.lato);
    p.y = Math.round(r.top - originaFoglio.top - p.sopra);
    p.w = Math.round(r.width + p.lato * 2);
    p.h = Math.round(r.height + p.sopra + p.sotto);
    const s = Math.min(SMUSSO_PIANO, p.w / 2, p.h / 2);
    T.beginPath();
    T.moveTo(p.x + s, p.y);
    T.lineTo(p.x + p.w, p.y);
    T.lineTo(p.x + p.w, p.y + p.h - s);
    T.lineTo(p.x + p.w - s, p.y + p.h);
    T.lineTo(p.x, p.y + p.h);
    T.lineTo(p.x, p.y + s);
    T.closePath();
    T.fill();
  }
}

// Il piano che sta sotto un punto, o nessuno. Gli angoli smussati non contano:
// nessuno strappo cade in un angolo di un piano.
function pianoSotto(x, y) {
  for (const p of PIANI) {
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return p;
  }
  return null;
}

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
   rimette la carta con la sua grana e non una toppa di colore.

   SU UN PIANO LO STRAPPO SI RIEMPIE DEL COLORE DEL PIANO. Il piano sta sullo stesso canvas,
   quindi cancellare lo bucherebbe fino alla carta: si ridipinge invece il
   piano, a opacità piena come faceva `clearRect` — che l'opacità la ignora —
   anche dentro una manopola spenta, e poi l'opacità torna dov'era. */
function quadretto(x, y, lato, colore, strappo) {
  if (strappo) {
    const x0 = x - lato / 2 - strappo, y0 = y - lato / 2 - strappo, l = lato + strappo * 2;
    const piano = pianoSotto(x, y);
    if (piano) {
      const a = T.globalAlpha;
      T.globalAlpha = 1;
      T.fillStyle = piano.tinta || tinta("vetro");
      T.fillRect(x0, y0, l, l);
      T.globalAlpha = a;
    } else {
      T.clearRect(x0, y0, l, l);
    }
  }
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
   Tre archi di misura attorno al quadrante, ed è il segno di RADA 2 preso di
   peso: sotto, un filo sottile per tutta la corsa possibile — la parte non
   raggiunta, che resta visibile perché una traccia a zero deve leggersi «a
   zero» e non «non c'è»; sopra, una barra spessa fino all'efficace.

   OGNI ARCO CRESCE SIMMETRICO ATTORNO A UNA DIAGONALE, e cresce nei due versi
   insieme: si apre come una forbice invece di scorrere da un capo, e a metà
   corsa sta a metà del suo quadrante invece che a un quarto. È la ragione per
   cui tre valori si leggono insieme senza contarli — un arco corto è un arco
   corto da qualunque parte lo si guardi, mentre tre archi che partissero tutti
   dallo stesso punto si leggerebbero solo confrontando dove finiscono.

   UN QUADRANTE PER ARCO, e il quarto resta vuoto. A fondo scala l'arco copre
   esattamente il proprio quadrante meno due gradi per estremo: quel piede
   tiene i tre archi staccati fra loro e lascia in fondo, dove le due manopole
   stanno sotto al cerchio, una fenditura di quattro gradi — quello che resta
   della bocca di prima, che con la crescita simmetrica non aveva più niente da
   dire. Il quadrante libero è quello ALTO ESTERNO: a nord-ovest sulle gocce, a
   nord-est sui tessuti.

   LE DUE CLASSI SONO SPECCHIATE, non copiate: la stessa traccia sta sull'asse
   ribaltato rispetto alla verticale — `1 − giro` e nient'altro, perché i due
   cerchi si guardano. È lo stesso motivo per cui i numerali delle gocce stanno
   a ovest e quelli dei tessuti a est.

   LO SPESSORE È QUELLO DI RADA 2 — sedici millesimi del raggio, mai sotto due
   pixel — e la barra è più grassa della zona attiva e della tenuta che suona,
   che stanno a `SPESSORE_ARCO`. Non è una svista: gli eventi sono istanti e si
   vedono perché si MUOVONO, i parametri stanno fermi per minuti interi e
   devono leggersi da lontano senza lampeggiare. Ma quello è il tetto.

   La traccia mostra L'EFFICACE, cioè quello che sta suonando; il filetto in
   colonna mostra dove sta la mano. Fra i due c'è la deriva, l'ora e la
   stagione — che è tutto il punto — e vederli separati è l'unico modo di
   sapere chi sta muovendo un parametro. */
const CORONA_DENTRO = 0.89;
// Le tre diagonali delle gocce, dall'arco più interno al più esterno: nord-est,
// sud-est, sud-ovest. I tessuti le prendono ribaltate.
const CORONA_ASSI = [45 / 360, 135 / 360, 225 / 360];
const CORONA_PIEDE = 2 / 360;                     // lo stacco a ciascun estremo
const CORONA_MEZZA = 45 / 360 - CORONA_PIEDE;     // semi-apertura a fondo scala
/* LA TRACCIA PIÙ INTERNA È GRADUATA, le altre due sono piene, e la differenza
   non è decorativa: è la traccia che sta appoggiata agli anelli, e una fila di
   barrette radiali è lo stesso segno delle tacche delle gocce — appartiene al
   disegno che ha sotto invece di galleggiarci sopra. Le due esterne misurano
   quanto, e una barra piena è il modo di dirlo da lontano.

   Le barrette CI SONO TUTTE, sempre: si accendono dal centro verso i due capi
   come farebbe la barra, e quelle spente sono la guida. Sono dispari perché una
   deve stare esattamente sulla diagonale — a valore zero resta accesa solo
   quella, che è il modo di dire «a zero» invece di sparire. Il passo è quello
   di prima, un grado e mezzo scarso fra una barretta e l'altra: una fila più
   rada diventerebbe una scala da leggere a una a una. */
const CORONA_GRADUATA = 0;
const CORONA_TACCHE = 25;

function corona(cx, cy, R, voci, specchio) {
  // Le tracce si spartiscono la fascia esterna, quante che siano — oggi tre per
  // classe, e la più esterna è lo spazio da tutt'e due le parti: lo stesso
  // parametro allo stesso raggio sui due quadranti, sull'asse specchiato.
  const passoR = voci.length > 1 ? (1 - CORONA_DENTRO) / (voci.length - 1) : 0;
  const spessore = Math.max(2, R * 0.016);
  voci.forEach((v, i) => {
    const r = R * (CORONA_DENTRO + i * passoR);
    const asse = specchio ? 1 - CORONA_ASSI[i] : CORONA_ASSI[i];
    const u = clamp((v.eff() - v.min) / (v.max - v.min), 0, 1);
    const mezza = CORONA_MEZZA * u;
    if (i === CORONA_GRADUATA) {
      for (let k = 0; k < CORONA_TACCHE; k++) {
        const scarto = (k / (CORONA_TACCHE - 1) - 0.5) * CORONA_MEZZA * 2;
        const dentro = Math.abs(scarto) <= mezza + 1e-9;
        tacca(cx, cy, asse + scarto, r - (dentro ? R * 0.028 : R * 0.015), r,
              1, tinta(dentro ? "inchiostro-2" : "spento"));
      }
      return;
    }
    arco(cx, cy, r, asse - CORONA_MEZZA, CORONA_MEZZA * 2, 1, tinta("spento"));
    // Sotto il mezzo per cento la barra sarebbe un punto e non una lunghezza:
    // resta la guida, che è la lettura giusta di un parametro al minimo.
    if (u > 0.005) arco(cx, cy, r, asse - mezza, mezza * 2, spessore, tinta("inchiostro-2"));
  });
}

/* ------------------------------------------------------------------- gli anelli
   Questi sono i quadranti di RADA DERIVA, ricopiati: la stessa lingua di segni,
   la stessa aritmetica, un accento solo. Là gli otto anelli stanno su un
   cerchio unico e le due classi le separa un vuoto; qui i cerchi sono due,
   affacciati, e la separazione la fa il foglio. Il resto è lo stesso.

   COSA DICE COSA, e ognuna una volta sola:

     · la LUNGHEZZA RADIALE di una tacca è il REGISTRO della goccia — corta
       grave, lunga acuta. È così che il profilo melodico di un'idea si legge
       senza spendere un colore;
     · la LUNGHEZZA D'ARCO di una tenuta è la sua DURATA;
     · l'AMBRA è ADESSO: una goccia che ha appena suonato, la tenuta entrata
       per ultima, il punto che corre sul giro. Niente altro è colorato.

   Le due lunghezze non si contraddicono perché stanno su due assi diversi —
   una radiale e una angolare — e su due cerchi diversi. */
const RAGGI_ANELLI = [0.30, 0.47, 0.64, 0.81];

/* Lo spessore del tratto pieno, e sui due quadranti è LO STESSO NUMERO: la
   zona attiva delle gocce — l'arco dentro cui le tacche cadono — e la tenuta
   che sta suonando. I due cerchi sono separati e uno accanto all'altro, quindi
   un arco più grasso da una parte si legge come «qui c'è più roba» invece che
   come una classe diversa. Scritto due volte, prima o poi divergerebbe. */
const SPESSORE_ARCO = 1.6;

/* Quanto dura un lampo, in secondi. UN SOLO NUMERO per tutti gli attacchi,
   perché sono lo stesso segno detto in posti diversi e tre valori diversi li
   farebbero sembrare tre fenomeni. */
const LAMPO = 0.45;

const lerp = (a, b, t) => a + (b - a) * t;

/* I numerali delle linee sono ROMANI come in Rada Deriva, e non arabi: sulla
   tavola le cifre arabe dicono già quantità dappertutto — secondi, decibel,
   hertz — e un «3» accanto a un anello si leggerebbe come una misura invece
   che come un nome. */
const NUMERI_ANELLO = ["I", "II", "III", "IV"];

/* Il raggio del mirino, dove le quattro linee si incontrano. */
const R_MIRINO = 0.045;
/* Quanto resta il filo che lega una tenuta appena entrata al mirino. NON è
   LAMPO, e la differenza è voluta: il lampo segna un istante e basta che si
   veda, questo è un percorso che l'occhio deve seguire dal bordo al centro per
   capire QUALE dei quattro anelli ha appena parlato. Mezzo secondo non basta a
   farlo, e i due segni non sono la stessa cosa detta in due posti. */
const FILO_TENUTA = 1;
/* Quanto resta il filo che lega una goccia al mirino: MENO di quello di una
   tenuta, e la differenza è la differenza fra le due classi. Una tenuta entra e
   resta, e il suo filo deve durare abbastanza da farsi seguire fino all'anello
   che ha parlato; una goccia è già finita mentre la si guarda, e un filo che le
   sopravvivesse racconterebbe un suono che non c'è più. */
const FILO_GOCCIA = 0.7;
/* Due gocce sono «insieme» se non distano più di questo. Non è zero: due linee
   con periodi coprimi non cadono mai sullo stesso istante esatto, e un accordo
   lo si sente accordo anche a un sesto di secondo di distanza. Ma è poco: oltre,
   il foglio si riempirebbe di fili fra cose che non hanno niente da spartire. */
const FINESTRA_LEGAME = 0.18;

/* LE GOCCE CALDE DEL FOTOGRAMMA, raccolte mentre si disegnano gli anelli e
   consumate subito dopo, prima del mirino. È una scorta fissa e non un array
   nuovo per fotogramma: a sessanta fotogrammi al secondo, allocare per buttare
   via è l'unica cosa che il disegno può fare per disturbare l'audio.
   Il modello non le sa: sono posizioni sullo schermo, e vivono un fotogramma. */
const CALDE = Array.from({ length: 48 }, () => ({ x: 0, y: 0, t: 0, linea: 0 }));
let quanteCalde = 0;

/* Il numerale della linea, FUORI dal proprio anello e dal lato della sua
   colonna di comandi — le gocce a ovest, i tessuti a est. È il legame visivo
   fra la riga che si tocca e l'anello che si guarda.

   Fuori e non sopra: centrata sulla circonferenza, ogni cifra avrebbe un filo
   che le passa in mezzo, e a corpo sette pixel un filo che attraversa una
   cifra la cancella. Prima qui si strappava il filo con un `clearRect`; questa
   è la soluzione di Rada Deriva, e non ha bisogno di bucare niente. */
function etichettaAnello(testo, cx, cy, r, R, lato) {
  const stacco = Math.max(3, R * 0.014);
  scritta(testo, cx + lato * (r + stacco), cy - 7, {
    dim: Math.max(7, r * 0.05), sp: 0, col: "grigio",
    all: lato < 0 ? "right" : "left", sans: true,
  });
}

/* L'indicatore di fase: un punto che percorre l'anello. Legge dalla coda dei
   cicli UDIBILI, mai da `cycleStart` — lo scheduler corre avanti di un
   orizzonte, e un punto che seguisse lui arriverebbe prima del suono.

   Rada Deriva accorciava la coda da dentro il disegno; qui no. La tavola non
   tocca il modello, nemmeno per potarlo: si scorre la coda e si prende
   l'ultimo giro già cominciato. Il motore la tiene corta per conto suo. */
function puntoDiFase(cx, cy, r, R, L, ora) {
  let c = null;
  for (const k of L.cycles) if (k.start <= ora) c = k;
  if (!c || ora >= c.start + c.period) return;
  const a = ang(clamp((ora - c.start) / c.period, 0, 1));
  T.fillStyle = tinta("ambra");
  T.beginPath();
  T.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.max(2, R * 0.011), 0, RADIANTI);
  T.fill();
}

/* ------------------------------------------------------------ l'anello di una
                                                                 frase
   La guida tenue, la zona attiva, le tacche, il punto.

   LA ZONA ATTIVA si prende dal PIANO e non dal cursore: `planHead` è
   l'addensamento con cui il piano è stato costruito, e quel che si vede
   coincide con quel che suona.

   DUE CAMPITURE E NON UNA PER TACCA. Un tracciato per goccia sono una
   cinquantina di disegni per fotogramma, e ogni tracciato separato costa una
   tassellatura e una chiamata di disegno. Le tacche hanno due soli stili —
   accesa e spenta — quindi due passate sulla lista e due campiture. */
function anelloFrase(cx, cy, R, r, L, ora, attiva) {
  const base = T.globalAlpha;
  T.globalAlpha = base * ((L.muted || !attiva) ? 0.3 : 1);

  cerchio(cx, cy, r, 0.75, tinta("filo"));
  arco(cx, cy, r, L.offset, L.planHead, SPESSORE_ARCO, tinta("inchiostro"));

  T.lineCap = "round";
  for (let acceso = 0; acceso < 2; acceso++) {
    T.strokeStyle = acceso ? tinta("ambra") : tinta("inchiostro");
    T.lineWidth = acceso ? 2.4 : 1.5;
    T.beginPath();
    for (const p of L.plan) {
      const dt = ora - p.ev.flash;
      const caldo = dt >= 0 && dt < LAMPO;
      if (caldo !== !!acceso) continue;
      const a = ang(p.ph);
      const mezza = lerp(0.014, 0.042, (p.ev.rel + 1) / 2) * R * (caldo ? 1.35 : 1);
      const ux = Math.cos(a), uy = Math.sin(a);
      T.moveTo(cx + ux * (r - mezza), cy + uy * (r - mezza));
      T.lineTo(cx + ux * (r + mezza), cy + uy * (r + mezza));
    }
    T.stroke();
  }
  T.lineCap = "butt";

  /* Il filo di ogni goccia recente, dal mirino alla sua tacca, e la tacca nella
     scorta perché i legami la trovino. Si scorre il piano una seconda volta, e
     non insieme alle campiture: là si accumulava UN tracciato per tutte le
     tacche accese, qui ogni filo ha la sua opacità e quindi il suo tracciato —
     mescolarli vorrebbe dire dare a tutti l'opacità dell'ultimo. */
  if (attiva && !L.muted) {
    for (const p of L.plan) {
      const dt = ora - p.ev.flash;
      if (dt < 0 || dt >= FILO_GOCCIA) continue;
      const a = ang(p.ph);
      const ux = Math.cos(a), uy = Math.sin(a);
      const x = cx + ux * r, y = cy + uy * r;
      filoAlMirino(cx, cy, R, x, y, dt / FILO_GOCCIA);
      if (quanteCalde < CALDE.length) {
        const o = CALDE[quanteCalde++];
        o.x = x; o.y = y; o.t = p.ev.flash; o.linea = L.i;
      }
    }
  }

  if (running && attiva && !L.muted) puntoDiFase(cx, cy, r, R, L, ora);
  etichettaAnello(NUMERI_ANELLO[L.i], cx, cy, r, R, -1);
  T.globalAlpha = base;
}

/* ----------------------------------------------------------- l'anello di un
                                                                tessuto
   Nessuna zona attiva: le tenute si distribuiscono su tutto il giro, ed è la
   differenza strutturale fra le due classi.

   TRE STATI, quindi tre campiture. Una tenuta che suona sta a inchiostro pieno
   per tutto il tempo in cui suona, ma l'AMBRA la prende solo LA PIÙ RECENTE: le
   altre ancora aperte restano inchiostro pieno. È la misura fra due esigenze —
   tenere acceso tutto ciò che suona riempirebbe di accento i quattro anelli,
   e un lampo di mezzo secondo non direbbe nulla su che cosa stia suonando
   adesso. Una sola dice quante linee sono attive e quale suono è entrato per
   ultimo, e costa quattro archi. */
function anelloTenuta(cx, cy, R, r, L, ora, attiva, recente) {
  const base = T.globalAlpha;
  const spento = L.muted || !attiva;
  T.globalAlpha = base * (spento ? 0.3 : 1);

  cerchio(cx, cy, r, 0.75, tinta("filo"));

  for (let stile = 0; stile < 3; stile++) {
    T.strokeStyle = stile === 2 ? tinta("ambra")
                  : stile === 1 ? tinta("inchiostro") : tinta("inchiostro-2");
    T.lineWidth = stile ? SPESSORE_ARCO : 1;
    T.globalAlpha = base * (spento ? 0.3 : 1) * (stile ? 1 : 0.5);
    T.beginPath();
    let qualcosa = false;
    for (const p of L.plan) {
      const ev = p.ev;
      const suo = ev === recente ? 2 : (ora >= ev.flash && ora < ev.fino) ? 1 : 0;
      if (suo !== stile) continue;
      const quanto = clamp(durataTenuta(L, ev) / L.period, 0.02, 1);
      // `moveTo` prima di ogni arco, o il tracciato li lega con una corda.
      const a0 = ang(p.ph);
      T.moveTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r);
      T.arc(cx, cy, r, a0, ang(p.ph + quanto));
      qualcosa = true;
    }
    if (qualcosa) T.stroke();
  }
  T.globalAlpha = base * (spento ? 0.3 : 1);

  if (running && attiva && !L.muted) puntoDiFase(cx, cy, r, R, L, ora);
  etichettaAnello(NUMERI_ANELLO[L.i], cx, cy, r, R, +1);
  T.globalAlpha = base;
}

/* IL MIRINO: il punto in cui le quattro linee si incontrano. In Rada Deriva
   sono due segni concentrici nello stesso posto, perché là le due classi
   condividono il cerchio — il punto al centro si accende con qualunque goccia,
   l'anello che lo circonda quando un tessuto si apre. Qui i cerchi sono due e
   ognuno tiene il segno della propria classe: il punto sulle gocce, l'anello
   sui tessuti.

   L'anello lampeggia e non resta acceso: la tenuta accesa è già raccontata dal
   suo arco, e qui interessa l'ISTANTE in cui entra — che altrimenti non
   avrebbe nessun segno, perché un tessuto si apre troppo lentamente perché
   l'orecchio ne colga il momento. */
function mirino(cx, cy, R, acceso) {
  T.strokeStyle = tinta(acceso === "anello" ? "ambra" : "filo");
  T.lineWidth = acceso === "anello" ? 2 : 1;
  T.beginPath();
  T.arc(cx, cy, R_MIRINO * R, 0, RADIANTI);
  T.stroke();
  T.fillStyle = tinta(acceso === "punto" ? "ambra" : "filo");
  T.beginPath();
  T.arc(cx, cy, acceso === "punto" ? R * 0.020 : R * 0.012, 0, RADIANTI);
  T.fill();
}

/* Le quattro diagonali, dal mirino quasi fino al bordo: non toccano né l'uno né
   l'altro, così restano una guida e non una gabbia. */
function crociera(cx, cy, R) {
  T.strokeStyle = tinta("filo");
  T.lineWidth = 0.75;
  T.beginPath();
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    T.moveTo(cx + Math.cos(a) * R * 0.10, cy + Math.sin(a) * R * 0.10);
    T.lineTo(cx + Math.cos(a) * R * 0.94, cy + Math.sin(a) * R * 0.94);
  }
  T.stroke();
}

/* La tenuta entrata per ultima fra tutte e quattro le linee. Si cerca una volta
   per fotogramma e non una per anello: la scansione è la stessa, e farne
   quattro per la stessa domanda sarebbe lavoro moltiplicato per niente. */
function tenutaPiuRecente(ora) {
  const q = { ev: null, angolo: 0, raggio: 0, appena: false };
  if (!tessutiOn) return q;
  tessuti.forEach((L, i) => {
    if (L.muted) return;
    for (const p of L.plan) {
      const ev = p.ev;
      if (!(ora >= ev.flash && ora < ev.fino)) continue;
      if (ora - ev.flash < LAMPO) q.appena = true;
      if (!q.ev || ev.flash > q.ev.flash) {
        q.ev = ev;
        // La metà esatta dell'arco, con la stessa formula che lo disegna:
        // scritta due volte in due modi, il filo prima o poi punterebbe altrove.
        const quanto = clamp(durataTenuta(L, ev) / L.period, 0.02, 1);
        q.angolo = ang(p.ph + quanto / 2);
        q.raggio = RAGGI_ANELLI[i];
      }
    }
  });
  return q;
}

/* Vero nei LAMPO secondi che seguono una goccia qualunque: lo legge il punto
   del mirino. Non riscorre il modello — la scorta delle gocce calde l'ha già
   attraversato in questo stesso fotogramma — e filtra su LAMPO invece che su
   FILO_GOCCIA perché il punto al centro è il segno dell'ISTANTE, mentre i fili
   sono il percorso che l'occhio ci mette a seguire. */
function gocciaAppena(ora) {
  for (let i = 0; i < quanteCalde; i++)
    if (ora - CALDE[i].t < LAMPO) return true;
  return false;
}

/* IL FILO AL MIRINO: dal bordo del mirino fino al punto che ha appena suonato.
   Non è un accento in più — è LO STESSO segno, prolungato fino al centro — e
   serve a dire QUALE dei quattro anelli ha parlato, che un lampo sull'anello
   da solo non dice.

   `t` va da zero a uno lungo la vita del filo, e la dissolvenza è quadratica e
   non lineare: un filo che attraversa mezzo quadrante resta visibile a lungo
   anche molto tenue, e con la dissolvenza lineare l'ultimo terzo si
   trascinerebbe.

   Un solo disegno per le due classi. Le vite sono diverse — FILO_TENUTA e
   FILO_GOCCIA — ma il segno è lo stesso, e due copie divergerebbero al primo
   ritocco. */
function filoAlMirino(cx, cy, R, x, y, t) {
  if (t < 0 || t >= 1) return;
  const dx = x - cx, dy = y - cy;
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) return;
  const base = T.globalAlpha;
  T.globalAlpha = base * (1 - t) * (1 - t);
  T.strokeStyle = tinta("ambra");
  T.lineWidth = 1;
  T.beginPath();
  T.moveTo(cx + (dx / d) * R_MIRINO * R, cy + (dy / d) * R_MIRINO * R);
  T.lineTo(x, y);
  T.stroke();
  T.globalAlpha = base;
}

/* I LEGAMI: quando due gocce di LINEE DIVERSE cadono quasi insieme, un filo le
   unisce e sfuma con loro. È il collage colto sul fatto — quattro cicli
   irrazionali che per un attimo si sono trovati d'accordo — e senza un segno
   quel momento passerebbe senza che nessuno lo veda.

   Di linee diverse e non della stessa: due gocce della stessa frase sono la
   frase che scorre, non un incontro. La coppia sfuma con lo SCARTO oltre che
   col tempo, così un accordo stretto si vede pieno e uno lasco appena. */
function legami(ora) {
  if (quanteCalde < 2) return;
  const base = T.globalAlpha;
  T.strokeStyle = tinta("ambra");
  T.lineWidth = 1;
  for (let i = 0; i < quanteCalde; i++) {
    for (let j = i + 1; j < quanteCalde; j++) {
      const a = CALDE[i], b = CALDE[j];
      if (a.linea === b.linea) continue;
      const scarto = Math.abs(a.t - b.t);
      if (scarto > FINESTRA_LEGAME) continue;
      const eta = ora - Math.max(a.t, b.t);
      const forza = clamp(1 - eta / FILO_GOCCIA, 0, 1) * clamp(1 - scarto / FINESTRA_LEGAME, 0, 1);
      if (forza <= 0) continue;
      T.globalAlpha = base * forza * 0.5;
      T.beginPath();
      T.moveTo(a.x, a.y);
      T.lineTo(b.x, b.y);
      T.stroke();
    }
  }
  T.globalAlpha = base;
}

/* ---------------------------------------------------------------- il quadrante
   La corona attorno e quattro anelli dentro. La corona è nostra e non di Rada
   Deriva — là fuori dagli anelli ci stanno le dodici tacche delle quinte e
   l'arco della tonica, che qui hanno una fascia tutta loro in fondo al foglio.

   La classe spenta non spegne il quadrante intero: si spengono gli anelli, a
   tre decimi, e la corona resta accesa. I parametri continuano a valere anche
   quando la classe tace, e mostrarli spenti direbbe che non valgono più. */
function quadrante(box, voci, linee, anello, ora, centro, specchio) {
  if (!box) return;
  const R = Math.min(box.w, box.h) / 2 - 2;
  crociera(box.cx, box.cy, R);
  corona(box.cx, box.cy, R, voci, specchio);
  linee.forEach((L, i) => anello(box.cx, box.cy, R, R * RAGGI_ANELLI[i], L, ora));
  centro(box.cx, box.cy, R);
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

function manopola(box, u, efficace, spenta) {
  if (!box) return;
  const base = T.globalAlpha;
  // Una manopola che l'inserto non usa resta disegnata e si spegne: toglierla
  // farebbe saltare l'impaginazione a ogni cambio di effetto, ed è proprio
  // quello che le tre manopole fisse servono a evitare.
  if (spenta) T.globalAlpha = base * 0.28;
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
  T.globalAlpha = base;
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
      // I puntini della curva sono AMBRA: la curva dell'equalizzatore è la sola
      // cosa disegnata che sia un VALORE e non un evento — è dove stanno le otto
      // aste, tradotto in decibel — e i valori su questa tavola sono in accento
      // ovunque, nel testo come qui.
      T.fillStyle = tinta("ambra", 0.7);
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

/* --------------------------------------------------------- la fascia del paesaggio
   LA MATERIA INTERA, distesa per il lungo: da sinistra a destra c'è tutto il
   file, dal primo campione all'ultimo. Chi sceglie un segmento ha bisogno di
   vedere il suono per intero, e di vedere dove sta il pezzo che ha scelto.

   L'onda è un ISTOGRAMMA DI QUADRATINI IN SCALA DI GRIGI, e i quadratini
   PARTONO DALLA RIGA DI MEZZO: il primo ci sta sopra, non accanto. Una colonna
   che cominciasse un salto più in là lascerebbe una riga vuota in mezzo a tutta
   la fascia, e quella riga si legge come un taglio nel materiale invece che
   come il suo asse.

   Fuori dal segmento la carta si posa sopra: il materiale resta visibile — è
   quello che si sta scegliendo, e sceglierlo alla cieca non si può — ma
   arretra, e quello che si sente resta in primo piano. */
const ALTEZZE_ONDA = 7;          // quanti quadratini per mezza altezza
const PASSO_ONDA = 5.4;          // il passo delle colonne, come sul baricentro
const LATO_ONDA = 3;

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
  // altrimenti sarebbe una riga piatta, e non ci si potrebbe mirare niente.
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
  const grigio = (k) => {
    // La scala di grigi: pieno sulla riga, sempre più tenue verso la punta. È
    // il modo di dare un peso alla colonna senza annerirla tutta.
    const u = k / Math.max(1, ALTEZZE_ONDA - 1);
    return u < 0.45 ? tinta("inchiostro-2", 0.9) : u < 0.75 ? tinta("grigio") : tinta("spento");
  };
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
    // Il primo quadratino sta SULLA riga, gli altri salgono e scendono da lì.
    O.fillStyle = grigio(0);
    O.fillRect(x, mezzo - LATO_ONDA / 2, LATO_ONDA, LATO_ONDA);
    for (let k = 1; k < quanti; k++) {
      O.fillStyle = grigio(k);
      O.fillRect(x, mezzo - k * salto - LATO_ONDA / 2, LATO_ONDA, LATO_ONDA);
      O.fillRect(x, mezzo + k * salto - LATO_ONDA / 2, LATO_ONDA, LATO_ONDA);
    }
  }
  ondaChiave = chiave;
  return ondaTela;
}

/* La maniglia di un capo del segmento: un quadrato d'inchiostro fuori
   dall'onda, sul bordo dove sta il cursore che lo comanda, e la verticale che
   scende a dire dov'è il taglio. */
function maniglia(x, box, sopra) {
  riga(x, box.y - 4, x, box.y + box.h + 4, 1, tinta("inchiostro"));
  quadretto(x, sopra ? box.y - 7 : box.y + box.h + 7, 7, tinta("inchiostro"), 0);
}

function fasciaPaesaggio(box, ora) {
  if (!box) return;
  const m = materiaCorrente();

  if (!m) {
    riga(box.x, box.cy, box.x + box.w, box.cy, 1, tinta("filo-2"), [2, 5]);
    scritta(dice("pae.nessunaMateria"),
      box.cx, box.cy - 8, { dim: 9, sp: .4, all: "center", base: "middle" });
    return;
  }

  T.save();
  if (!paesaggioOn) T.globalAlpha = 0.4;

  const perSec = box.w / m.durata;
  const seg = segmento();
  T.drawImage(disegnaOnda(m, box.w, box.h), box.x, box.y, box.w, box.h);

  // La carta si posa su quello che sta fuori dal segmento.
  const x0 = box.x + seg.a * perSec, x1 = box.x + seg.b * perSec;
  T.fillStyle = tinta("carta", 0.66);
  T.fillRect(box.x, box.y, Math.max(0, x0 - box.x), box.h);
  T.fillRect(x1, box.y, Math.max(0, box.x + box.w - x1), box.h);

  // La finestra che si sta leggendo adesso, larga quanto il velo.
  const testa = testaPaesaggio();
  const tx = box.x + testa * perSec;
  T.fillStyle = tinta("filo-2", 0.75);
  T.fillRect(tx, box.y, Math.max(1.5, seg.velo * perSec), box.h);

  maniglia(x0, box, true);
  maniglia(x1, box, false);
  riga(tx, box.y, tx, box.y + box.h, 1, tinta("inchiostro"));
  // Nel random, dove atterrerà il prossimo salto: tratteggiato, perché è un punto
  // che non si sta ancora leggendo. Si vede prima di arrivarci, come la prossima
  // quinta sul circolo.
  if (G.pLettura === LETTURA.random) {
    const ax = box.x + (seg.a + prossimaArea * seg.corsa) * perSec;
    riga(ax, box.y, ax, box.y + box.h, 1, tinta("inchiostro-2"), [2, 3]);
  }

  scritta("0″", box.x, box.y + box.h + 9, { dim: 7.5, sp: .6, base: "top" });
  scritta(minsec(m.durata), box.x + box.w, box.y + box.h + 9,
          { dim: 7.5, sp: .6, all: "right", base: "top" });
  T.restore();
}

/* ------------------------------------------------------ il circolo delle quinte
   Dodici note nell'ordine del circolo, non in quello della scala, e in cerchio
   perché il circolo È un cerchio: sulla striscia di prima il fa e il do stavano
   ai due capi e sembravano lontanissimi, mentre sono a un passo.

   LE NOTE IN USO SONO UN ARCO. Una pentatonica anemitonica è cinque quinte di
   fila — tonica + 0, 2, 4, 7, 9 cade sul circolo a 0, +2, +4, +1, +3 — quindi la
   collezione è letteralmente cinque posizioni contigue, e si disegna con la barra
   della corona invece che con cinque segni. Un passo di quinta la sposta di una
   posizione: da un capo esce una nota, dall'altro ne entra una. Quella che
   entrerà è il tratteggio in fondo all'arco, dalla parte dove si andrà.

   Il verso non è sempre lo stesso — lo decide la parola sturmiana in
   `deriva.js` — e `tonalitaFra(1)` lo sa già: se si sale entra la nota dopo
   l'ultima, se si scende quella prima della tonica.

   IL PUNTO IN AMBRA È UN PUNTO DI FASE: cammina dalla tonica verso quella di
   dopo nei centocinquanta secondi del passo, come il punto che percorre un
   anello. È ADESSO, la prima delle quattro famiglie dell'ambra, e non una
   famiglia nuova. La tonica e la meta restano inchiostro, come sulla striscia:
   sono dove si è e dove si va, non un istante. */
function circoloQuinte(box, ora) {
  if (!box) return;
  const cx = box.cx, cy = box.cy;
  const R = Math.min(box.w, box.h) / 2 - 17;          // fuori, lo spazio dei nomi
  const qui = CIRCOLO.indexOf(tonalita());
  const poi = CIRCOLO.indexOf(tonalitaFra(1));
  const verso = ((poi - qui + 12) % 12) === 1 ? 1 : -1;
  const entra = ((verso > 0 ? qui + 5 : qui - 1) + 12) % 12;
  const giro = (k) => k / 12;

  cerchio(cx, cy, R, 1, tinta("filo"));

  // Le cinque in uso: la barra della corona, da poco prima della prima tacca a
  // poco dopo l'ultima, così si legge «queste cinque» e non «da qui a qui».
  const spessore = Math.max(2.5, R * 0.035);
  arco(cx, cy, R, giro(qui - 0.4), giro(4.8), spessore, tinta("inchiostro-2"));

  // Quella che entrerà al prossimo passo: la stessa barra, tratteggiata e muta.
  T.save();
  T.setLineDash([2, 2.5]);
  arco(cx, cy, R, giro(entra - 0.4), giro(0.8), spessore * 0.6, tinta("muto"));
  T.restore();

  for (let k = 0; k < 12; k++) {
    const inUso = ((k - qui + 12) % 12) <= 4;
    const tonica = k === qui, meta = k === poi;
    const a = ang(giro(k));
    tacca(cx, cy, giro(k), R - (tonica ? 9 : 4), R, 1, tinta(tonica ? "inchiostro" : "filo"));
    scritta(nomeNota(CIRCOLO[k]), cx + Math.cos(a) * (R + 11), cy + Math.sin(a) * (R + 11), {
      dim: tonica ? 10 : 8.5, sans: true, sp: 0.2, all: "center", base: "middle",
      col: tonica ? "inchiostro" : meta ? "inchiostro-2" : inUso ? "grigio" : "muto",
    });
  }
  quadrettoSuGiro(cx, cy, R - 14, giro(poi), 4, tinta("muto"), 0);

  // Il punto di fase, dalla tonica verso la meta al passo del passo di quinta.
  const fatto = clamp(1 - (prossimaQuinta - ora) / PASSO_QUINTA, 0, 1);
  const p = ang(giro(qui + verso * fatto));
  T.fillStyle = tinta("ambra");
  T.beginPath();
  T.arc(cx + Math.cos(p) * R, cy + Math.sin(p) * R, Math.max(2, R * 0.03), 0, RADIANTI);
  T.fill();
}
/* ------------------------------------------------------------ ora e stagione
   Il cerchio del tempo che non è musica: fuori le ventiquattro ore, dentro i
   dodici mesi. Mezzanotte e inverno in alto, mezzogiorno ed estate in basso,
   così il buio e il freddo stanno dalla stessa parte.

   Le fasce e le stagioni NON SONO SCRITTE QUI: si leggono chiedendo a
   `tavolozzaOraria()` e `tavolozzaStagionale()` ora per ora e mese per mese,
   le stesse funzioni che spostano i parametri. Dove il nome cambia c'è un
   confine; la fascia e la stagione di adesso sono la barra della corona.

   IL PUNTO IN AMBRA STA AL CENTRO DELL'ORA, non sul minuto: il motore legge
   l'ora intera, e un punto che scivolasse coi minuti racconterebbe una
   precisione che il suono non ha. */
function cerchioInfluenze(box) {
  if (!box) return;
  const cx = box.cx, cy = box.cy;
  const R = Math.min(box.w, box.h) / 2 - 15;          // fuori, lo spazio delle ore
  const r = R * 0.72;
  const h = oraCorrente(), m = meseCorrente();
  const spessore = Math.max(2.5, R * 0.035);

  cerchio(cx, cy, R, 1, tinta("filo"));
  cerchio(cx, cy, r, 1, tinta("filo"));

  // Quanto dura quello che c'è adesso, contando all'indietro e in avanti finché
  // il nome non cambia. Il giro di mezzanotte non è un caso a parte: si conta
  // in modulo.
  const durata = (n, quanti, nome) => {
    let prima = 0, dopo = 0;
    while (prima < quanti && nome((n - prima - 1 + quanti * 2) % quanti) === nome(n)) prima++;
    while (dopo < quanti && nome((n + dopo + 1) % quanti) === nome(n)) dopo++;
    return { da: n - prima, lungo: prima + dopo + 1 };
  };
  const fascia = durata(h, 24, (k) => tavolozzaOraria(k).nome);
  const stagione = durata(m, 12, (k) => tavolozzaStagionale(k).nome);
  arco(cx, cy, R, (fascia.da + 0.1) / 24, (fascia.lungo - 0.2) / 24, spessore, tinta("inchiostro-2"));
  arco(cx, cy, r, (stagione.da + 0.05) / 12, (stagione.lungo - 0.1) / 12, spessore, tinta("inchiostro-2"));

  for (let k = 0; k < 24; k++) {
    const confine = tavolozzaOraria(k).nome !== tavolozzaOraria((k + 23) % 24).nome;
    tacca(cx, cy, k / 24, R - (confine ? 7 : 3), R, 1, tinta(confine ? "inchiostro-2" : "filo"));
  }
  for (let k = 0; k < 12; k++) {
    const confine = tavolozzaStagionale(k).nome !== tavolozzaStagionale((k + 11) % 12).nome;
    tacca(cx, cy, k / 12, r - (confine ? 6 : 3), r, 1, tinta(confine ? "inchiostro-2" : "filo"));
  }
  // Le ore scritte sono quattro, ed è notazione: non si traducono.
  for (const k of [0, 6, 12, 18]) {
    const a = ang(k / 24);
    scritta(String(k), cx + Math.cos(a) * (R + 9), cy + Math.sin(a) * (R + 9),
            { dim: 7.5, sp: 0.4, all: "center", base: "middle", col: "grigio" });
  }

  // Il mese di adesso: un quadratino d'inchiostro FRA i due anelli. Dentro l'anello
  // dei mesi andava addosso ai nomi della fascia e della stagione, che stanno al
  // centro; qui ha il posto libero fra la barra della stagione e le tacche delle ore.
  quadrettoSuGiro(cx, cy, r + 9, (m + 0.5) / 12, 4, tinta("inchiostro"), 0);

  // L'ora di adesso, al centro della sua casella.
  const p = ang((h + 0.5) / 24);
  T.fillStyle = tinta("ambra");
  T.beginPath();
  T.arc(cx + Math.cos(p) * R, cy + Math.sin(p) * R, Math.max(2, R * 0.03), 0, RADIANTI);
  T.fill();
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
    // La punta in AMBRA: è il momento in cui il baricentro ha smesso di salire
    // o di scendere, cioè l'unico istante che questa corsia indica invece di
    // misurare. Il corpo della colonna resta inchiostro — sono quindici minuti
    // di passato, e se fossero tutti in accento non ci sarebbe più una punta.
    T.fillStyle = punta ? tinta("ambra") : tinta("inchiostro-2", 0.7);
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


/* Il tema, come tutto il resto che la tavola sa dei comandi: guardando, non
   facendosi chiamare. Un confronto di stringhe per fotogramma è il prezzo di
   non avere un `addEventListener` in tutto questo file.

   Con la palette cade anche l'ONDA IN CACHE, che è disegnata coi grigi del
   tema: senza azzerare la chiave resterebbe la scala di prima, chiara su
   fondo scuro o viceversa, finché non si cambia materiale. */
let temaVisto = null;
function seCambiaTema() {
  const t = document.documentElement.dataset.tema || "chiaro";
  if (t === temaVisto) return;
  temaVisto = t;
  leggiTinte();
  leggiPiani();
  ondaChiave = "";
}

function disegna() {
  seCambiaTema();
  const ora = ctx ? ctx.currentTime : 0;
  const orologio = performance.now() / 1000;
  const f = foglio.getBoundingClientRect();
  originaFoglio = { left: f.left, top: f.top };
  if (Math.abs(f.width - LARGO) > 0.5 || Math.abs(foglio.scrollHeight - ALTO) > 0.5) ridimensiona();

  T.setTransform(DPR, 0, 0, DPR, 0, 0);
  T.clearRect(0, 0, LARGO, ALTO);
  T.lineCap = "butt";
  piani();

  // La scorta si azzera PRIMA del quadrante e si legge DOPO: vive un
  // fotogramma, come tutto quello che il disegno sa.
  quanteCalde = 0;
  quadrante(quadro("gocce"), CORONA_GOCCE, frasi,
            (cx, cy, R, r, L, t) => anelloFrase(cx, cy, R, r, L, t, frasiOn), ora,
            (cx, cy, R) => {
              legami(ora);
              mirino(cx, cy, R, gocciaAppena(ora) ? "punto" : "");
            });

  const recente = tenutaPiuRecente(ora);
  quadrante(quadro("tessuti"), CORONA_TESSUTI, tessuti,
            (cx, cy, R, r, L, t) => anelloTenuta(cx, cy, R, r, L, t, tessutiOn, recente.ev), ora,
            (cx, cy, R) => {
              if (recente.ev) {
                const x = cx + Math.cos(recente.angolo) * recente.raggio * R;
                const y = cy + Math.sin(recente.angolo) * recente.raggio * R;
                filoAlMirino(cx, cy, R, x, y, (ora - recente.ev.flash) / FILO_TENUTA);
              }
              mirino(cx, cy, R, recente.appena ? "anello" : "");
            },
            // specchiato: i tre assi delle gocce ribaltati sulla verticale.
            true);

  manopola(manopolaDi("registro"),  G.registro / 100,  effG.registro / 100);
  manopola(manopolaDi("calore"),    G.calore / 100,    effG.calore / 100);
  manopola(manopolaDi("tregistro"), G.tRegistro / 100, effGT.registro / 100);
  manopola(manopolaDi("passo"),     G.tPasso / 100,    effGT.passo / 100);
  // La sosta del paesaggio non ha un efficace: fra la mano e il velo non c'è
  // nessuna deriva, quindi graduazioni e quadrato dicono lo stesso numero. Fuori
  // dal random si spegne, come la manopola che la comanda.
  manopola(manopolaDi("pSosta"), G.pSosta / 100, undefined, G.pLettura !== LETTURA.random);

  // Le tre dell'inserto hanno una lettura sola e non due: fra la mano e il
  // suono non c'è né la deriva né l'ora, quindi le graduazioni e il quadrato
  // dicono lo stesso numero e non c'è nessuna distanza da mostrare.
  for (const [classe, pre] of [["gocce", "gE"], ["tessuti", "tE"]]) {
    const quanti = EFFETTI[EFFETTO[classe]].param.length;
    for (let i = 1; i <= 3; i++) {
      manopola(manopolaDi(pre + i), G[pre + i] / 100, undefined, i > quanti);
    }
  }

  misuratoreLR(quadro("misuratore"), orologio);
  spettro(quadro("spettro"));
  zeroAste(quadro("aste"));
  fasciaPaesaggio(quadro("paesaggio"), ora);
  circoloQuinte(quadro("quinte"), ora);
  cerchioInfluenze(quadro("influenze"));
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
