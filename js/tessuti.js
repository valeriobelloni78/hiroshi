/* =============================================================================
   HIROSHI · tessuti.js — gli otto tenuti

   IL RIBALTAMENTO. In cima a `timbri.js` sta la regola che ha guidato le
   gocce: chi vuole cambiare uno strumento guardi prima i primi trenta
   millisecondi. A distinguere un suono percosso è quasi tutto l'attacco e la
   lunghezza della coda, non lo spettro stazionario.

   Per un tenuto quella regola si rovescia. Un tessuto non ha primi trenta
   millisecondi degni di nota — si apre in secondi — e non ha coda: sfuma.
   Quello che resta da sentire è CHE COSA ACCADE MENTRE NON ACCADE NIENTE.

   E qui c'è il fatto che decide tutto il file: un tenuto perfettamente fermo
   sparisce. Dopo pochi secondi l'orecchio smette di trattarlo come un evento e
   comincia a trattarlo come una proprietà della stanza — come il frigorifero,
   che si sente solo quando si spegne. Un bordone immobile non è un suono
   lungo: è un suono corto che diventa architettura.

   Quindi questi otto non sono otto materie, come lo sono le gocce. Sono OTTO
   MODI DI ESSERE INSTABILI, e ciascuno è definito da due cose sole:

       DOVE STA            e     CHE COSA SI MUOVE

     1 Bordone   il fondo     battimento fra tre copie scordate
     2 Marea     il fondo     l'intonazione stessa, che deriva
     3 Attrito   il corpo     una grana velocissima dentro l'altezza
     4 Frangia   il corpo     interferenza pura, senza nessuna grana
     5 Corrente  l'aria       il centro di una banda di rumore che vaga
     6 Cavo      l'aria       l'altezza ferma e le formanti che camminano
     7 Brina     il velo      molti battimenti insieme, nessuno leggibile
     8 Soglia    il velo      solo la luminosità, appena sopra il silenzio

   I quattro TERRITORI non sono decorazione: i tessuti non sono radi come le
   gocce, ne suonano quattro insieme di continuo, e due voci che occupassero lo
   stesso posto diventerebbero fango — che nessuna quantità di equalizzatore
   disfa a valle. Due tenuti per territorio, con movimenti opposti: Attrito e
   Frangia sono l'uno il negativo dell'altro, tutto grana contro tutto polso.

   IL MODELLO DICE QUALE NOTA, IL TIMBRO DICE IN CHE REGISTRO VIVE.
   `TERRITORIO` ripiega la nota scelta dal campo dentro la banda del tenuto,
   per ottave: la classe d'altezza non cambia, quindi l'accordo con le gocce
   regge, ma il bordone sta nel fondo qualunque cosa faccia il cursore del
   registro.

   LA FORMA DEL SUONO È UN'ALTRA. Le gocce hanno attacco · coda · inarm ·
   brill · corpo. Qui due di quei nomi non vogliono dire niente — non c'è un
   attacco da misurare in millesimi e non c'è una coda, c'è una dissolvenza:

       apertura   quanto ci mette ad arrivare, in secondi
       movimento  quanta instabilità: profondità del battimento, pressione
                  dell'attrito, ampiezza della deriva. Un cursore solo che ogni
                  tenuto interpreta a modo suo, come fa `inarm` fra le gocce
       passo      quanto va veloce quel movimento
       brill      dove sta l'energia
       corpo      quanto pesa la fondamentale

   DOVE SERVE UN MOVIMENTO LENTO CHE NON TORNI, si sommano due oscillatori in
   rapporto irrazionale — è la ricetta della deriva, un piano più sotto: due
   sinusoidi con frequenze razionalmente indipendenti non ripassano mai per la
   stessa combinazione, e l'orecchio non sente andare e tornare. Una sinusoide
   sola, per quanto lenta, si sente respirare a tempo.

   REGOLA DI FERRO, la stessa delle gocce e qui ancora più cara: ogni nodo
   creato per una tenuta va scollegato a mano. Un tessuto vive fino a un minuto
   e ne suonano otto insieme: affidarsi alla raccolta della memoria — che è
   attività del thread principale, proprio quello che a schermo bloccato viene
   strozzato — vuol dire un grafo che cresce più in fretta di quanto venga
   ripulito.
============================================================================= */

const TESSUTI = ["bordone", "marea", "attrito", "frangia", "corrente", "cavo", "brina", "soglia"];

/* La forma dei tenuti. Valori d'esordio: un'apertura di tre secondi buoni, un
   movimento di poco sopra la metà, un passo lento. */
const FORMA_T = { apertura: 3.2, movimento: 0.55, passo: 0.38, brill: 0.50, corpo: 0.50 };

/* Il territorio di ciascuno, in hertz. Non è una trasposizione musicale: la
   nota che il campo ha scelto resta quella — si sposta solo di ottave, quindi
   la classe d'altezza è intatta e l'accordo con le gocce regge.

   È scritto come una BANDA e non come uno scarto fisso di ottave perché uno
   scarto fisso non garantisce niente: col cursore del registro tutto in alto
   il campo arriva a scendere fino a 65 Hz, e un bordone due ottave sotto
   finirebbe a 16 Hz — cioè fuori dall'udibile, a mangiare margine senza farsi
   sentire. La banda, invece, è una promessa: il bordone sta nel fondo, punto.

   Ogni banda è larga più di un'ottava, altrimenti il ripiegamento non
   terminerebbe. */
const TERRITORIO = {
  bordone:  [38, 130],     // il fondo
  marea:    [40, 150],
  attrito:  [110, 520],    // il corpo
  frangia:  [130, 620],
  corrente: [300, 1400],   // l'aria
  cavo:     [90, 330],     //   (la fondamentale sta sotto: a cantare sono le formanti)
  brina:    [420, 1500],   // il velo
  soglia:   [500, 2000],
};

function nelTerritorio(f, banda) {
  const [basso, alto] = banda;
  while (f < basso) f *= 2;
  while (f > alto) f /= 2;
  return f;
}

/* ------------------------------------------------------------- la finestra
   Un tenuto si apre e si chiude con un coseno rialzato: nessuno spigolo né in
   cima né in fondo, e una dissolvenza più lunga dell'apertura, perché un
   tessuto se ne va sempre più piano di come è arrivato.

   Questa funzione ha DUE lettori, e devono leggere lo stesso numero. Uno è
   l'audio, che ne scrive l'automazione; l'altro è la normalizzazione del bus
   in `motore.js`, che ha bisogno di sapere ANALITICAMENTE quanto vale la somma
   degli inviluppi in un dato istante. È l'unico modo di compensare la somma
   senza misurarla: misurarla vorrebbe dire inseguirla, e inseguire vuol dire
   arrivare dopo. */
function inviluppoDi(when, dur, F) {
  let ap = clamp(F.apertura, 0.35, 9);
  let di = ap * 1.7;
  const spazio = dur * 0.95;
  if (ap + di > spazio) { const k = spazio / (ap + di); ap *= k; di *= k; }
  return { t0: when, t1: when + dur, ap, di };
}

function finestra(t, e) {
  if (t <= e.t0 || t >= e.t1) return 0;
  const su = t - e.t0;
  if (su < e.ap) return 0.5 - 0.5 * Math.cos(Math.PI * su / e.ap);
  const giu = e.t1 - t;
  if (giu < e.di) return 0.5 - 0.5 * Math.cos(Math.PI * giu / e.di);
  return 1;
}

/* La stessa curva, scritta sull'automazione come spezzata: dodici segmenti per
   fianco. Il coseno rialzato non ha una primitiva fra i metodi degli
   AudioParam, e `setValueCurveAtTime` non si può concatenare senza rischiare
   sovrapposizioni — una spezzata a dodici passi sta sotto il mezzo per cento
   dalla curva vera, che è molto meno di quanto si senta. */
const PASSI_FINESTRA = 12;
function apriChiudi(g, picco, e) {
  g.gain.setValueAtTime(0, e.t0);
  for (let k = 1; k <= PASSI_FINESTRA; k++) {
    const t = e.t0 + e.ap * (k / PASSI_FINESTRA);
    g.gain.linearRampToValueAtTime(picco * finestra(t, e), t);
  }
  const giu = e.t1 - e.di;
  g.gain.linearRampToValueAtTime(picco, giu);
  for (let k = 1; k <= PASSI_FINESTRA; k++) {
    const t = giu + e.di * (k / PASSI_FINESTRA);
    g.gain.linearRampToValueAtTime(picco * finestra(t, e), t);
  }
}

/* Due lentissimi in rapporto irrazionale, sommati: il movimento che non torna.
   Restituisce il nodo da cui prendere il segnale (in −1..1 circa) e la lista
   dei nodi da liberare. */
function lento(ctx, e, hz, radice) {
  const l1 = ctx.createOscillator(); l1.frequency.value = hz;
  const l2 = ctx.createOscillator(); l2.frequency.value = hz * radice;
  const somma = ctx.createGain(); somma.gain.value = 1;
  const g1 = ctx.createGain(); g1.gain.value = 0.62;
  const g2 = ctx.createGain(); g2.gain.value = 0.38;
  l1.connect(g1); g1.connect(somma);
  l2.connect(g2); g2.connect(somma);
  l1.start(e.t0); l2.start(e.t0);
  l1.stop(e.t1 + 0.05); l2.stop(e.t1 + 0.05);
  return { uscita: somma, nodi: [l1, l2, g1, g2, somma] };
}

/* --------------------------------------------------------------------------
   Ogni costruttore riceve { ctx, e, freq, vel, dest, F } e collega la propria
   catena a `dest`. La finestra è comune; tutto il resto è suo.
-------------------------------------------------------------------------- */

/* BORDONE — il fondo, per battimento. Tre copie della stessa nota scordate di
   pochi centesimi: la loro differenza si sente come un'ondulazione lenta
   dell'ampiezza. `passo` scorda di più (l'ondulazione accelera), `movimento`
   alza le due copie laterali rispetto alla centrale (l'ondulazione si scava).
   Gli scarti sono asimmetrici — 0, +1, −1,7 — perché due battimenti uguali si
   sommerebbero in uno solo. */
function xBordone({ ctx, e, freq, vel, dest, F }) {
  const env = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = clamp(freq * (4 + F.brill * 12), 60, 6000);
  lp.Q.value = 0.6;
  const nodi = [env, lp];
  const oscs = [];
  const scarto = 0.5 + F.passo * 26;                 // centesimi
  [0, 1, -1.7].forEach((s, k) => {
    const o = ctx.createOscillator();
    o.type = k === 0 ? "sawtooth" : "triangle";
    o.frequency.value = freq;
    o.detune.value = s * scarto;
    const g = ctx.createGain();
    g.gain.value = k === 0 ? (0.22 + F.corpo * 0.26) : (0.10 + F.movimento * 0.34);
    o.connect(g); g.connect(lp);
    o.start(e.t0); o.stop(e.t1 + 0.05);
    nodi.push(o, g); oscs.push(o);
  });
  lp.connect(env); env.connect(dest);
  apriChiudi(env, 0.5 * vel, e);
  libera(oscs[0], nodi);
}

/* MAREA — il fondo, per deriva. Qui non ondeggia l'ampiezza ma L'INTONAZIONE:
   il lentissimo entra nel `detune`, che è in centesimi, quindi i tre parziali
   scivolano INSIEME e l'accordo interno resta intatto — scivola l'intero
   suono, come un nastro che rallenta. È qualcosa di enorme che si muove così
   piano che ci si accorge solo che si è mosso. */
function xMarea({ ctx, e, freq, vel, dest, F }) {
  const env = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = clamp(freq * (5 + F.brill * 14), 80, 7000);
  lp.Q.value = 0.5;
  const L = lento(ctx, e, 0.012 + F.passo * 0.09, Math.SQRT2);
  const prof = ctx.createGain();
  prof.gain.value = 4 + F.movimento * 46;            // centesimi di escursione
  L.uscita.connect(prof);
  const nodi = [env, lp, prof, ...L.nodi];
  const oscs = [];
  [[1, 0.50], [2, 0.20], [3, 0.09]].forEach(([r, a], k) => {
    const o = ctx.createOscillator();
    o.frequency.value = freq * r;
    prof.connect(o.detune);
    const g = ctx.createGain();
    g.gain.value = k === 0 ? a * (0.7 + F.corpo * 0.6) : a * (0.5 + F.brill);
    o.connect(g); g.connect(lp);
    o.start(e.t0); o.stop(e.t1 + 0.05);
    nodi.push(o, g); oscs.push(o);
  });
  lp.connect(env); env.connect(dest);
  apriChiudi(env, 0.55 * vel, e);
  libera(oscs[0], nodi);
}

/* ATTRITO — il corpo, per grana. Un dente di sega dentro un passa-basso la cui
   frequenza di taglio è SCOSSA dal rumore. Non è il modello dell'arco: è la
   sua impronta. Lo stick-slip vero è un treno velocissimo di micro-eventi, e
   quello che se ne sente è esattamente questo — un'altezza ferma con dentro
   una ruvidezza che non sta ferma. `passo` decide quanto è larga la banda
   della scossa (quanto è ruvida), `movimento` quanto è profonda. */
function xAttrito({ ctx, e, freq, vel, dest, F }) {
  const env = ctx.createGain();
  const o = ctx.createOscillator();
  o.type = "sawtooth"; o.frequency.value = freq;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  const taglio = clamp(freq * (2.5 + F.brill * 7), 120, 11000);
  lp.frequency.value = taglio;
  lp.Q.value = 1 + F.corpo * 3;
  const gr = ctx.createBufferSource();
  gr.buffer = rumore(ctx); gr.loop = true;
  gr.playbackRate.value = 0.02 + F.passo * 0.5;
  const amp = ctx.createGain();
  amp.gain.value = taglio * (0.05 + F.movimento * 0.40);
  gr.connect(amp); amp.connect(lp.frequency);
  o.connect(lp); lp.connect(env); env.connect(dest);
  o.start(e.t0); o.stop(e.t1 + 0.05);
  gr.start(e.t0); gr.stop(e.t1 + 0.05);
  apriChiudi(env, 0.30 * vel, e);
  libera(o, [o, lp, gr, amp, env]);
}

/* FRANGIA — il corpo, per interferenza. Il negativo esatto dell'Attrito: non
   c'è nessuna grana, c'è solo il polso. Due sinusoidi separate di pochi hertz
   si annullano e si sommano a turno, e la frequenza della frangia È la loro
   differenza — quindi `passo` la scrive in hertz, senza intermediari.
   `movimento` decide quanto a fondo si annullano: sotto sta una terza voce
   ferma sulla stessa nota che riempie i vuoti, e a movimento pieno sparisce. */
function xFrangia({ ctx, e, freq, vel, dest, F }) {
  const env = ctx.createGain();
  const battuta = 0.08 + F.passo * 2.6;              // hertz
  const nodi = [env];
  const oscs = [];
  const voce = (f, a) => {
    const o = ctx.createOscillator(); o.frequency.value = f;
    const g = ctx.createGain(); g.gain.value = a;
    o.connect(g); g.connect(env);
    o.start(e.t0); o.stop(e.t1 + 0.05);
    nodi.push(o, g); oscs.push(o);
  };
  const peso = 0.20 + F.corpo * 0.16;
  voce(freq, peso);
  voce(freq + battuta, peso);
  voce(freq, (1 - F.movimento) * 0.34);              // il riempimento dei vuoti
  voce(freq * 3, F.brill * 0.07);                    // un parziale, per non essere nudi
  env.connect(dest);
  apriChiudi(env, 0.55 * vel, e);
  libera(oscs[0], nodi);
}

/* CORRENTE — l'aria, per vagare. Rumore stretto in una banda il cui centro
   cammina per conto suo. Sotto, una sinusoide quasi inudibile tiene
   l'intonazione: senza, la corrente avrebbe un'altezza vaga e non si
   accorderebbe con il resto — è la stessa toppa che sotto «Soffio», fra le
   gocce, fa la differenza fra un fiato e un fruscio. */
function xCorrente({ ctx, e, freq, vel, dest, F }) {
  const env = ctx.createGain();
  const src = ctx.createBufferSource();
  src.buffer = rumore(ctx); src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  const centro = clamp(freq * (2 + F.brill * 5), 250, 8000);
  bp.frequency.value = centro;
  bp.Q.value = 1.2 + F.corpo * 5;
  const L = lento(ctx, e, 0.018 + F.passo * 0.10, Math.sqrt(5));
  const amp = ctx.createGain();
  amp.gain.value = centro * (0.10 + F.movimento * 0.65);
  L.uscita.connect(amp); amp.connect(bp.frequency);
  const gn = ctx.createGain(); gn.gain.value = 0.85;
  const o = ctx.createOscillator(); o.frequency.value = freq;
  const go = ctx.createGain(); go.gain.value = 0.03 + F.corpo * 0.09;
  src.connect(bp); bp.connect(gn); gn.connect(env);
  o.connect(go); go.connect(env);
  env.connect(dest);
  src.start(e.t0); src.stop(e.t1 + 0.05);
  o.start(e.t0); o.stop(e.t1 + 0.05);
  apriChiudi(env, 0.30 * vel, e);
  libera(src, [src, bp, gn, o, go, amp, env, ...L.nodi]);
}

/* CAVO — l'aria, per formanti. L'altezza sta ferma e lo spettro cammina: tre
   bande risonanti si spostano fra la posizione della «a» e quella della «u»,
   così il suono sembra pronunciare una vocale lentissima. È il più strano dei
   quattro centrali ed è voluto: nessun altro tenuto muove il TIMBRO lasciando
   ferma l'altezza, e senza di lui la serie avrebbe due movimenti d'ampiezza,
   due di frequenza e nessuno di spettro. */
const VOCALE_A = [700, 1150, 2600];
const VOCALE_U = [320, 800, 2300];
const PESI_FORMANTI = [0.9, 0.55, 0.3];
function xCavo({ ctx, e, freq, vel, dest, F }) {
  const env = ctx.createGain();
  const o = ctx.createOscillator();
  o.type = "sawtooth"; o.frequency.value = freq;
  const pre = ctx.createGain(); pre.gain.value = 0.30 + F.corpo * 0.35;
  o.connect(pre);
  const L = lento(ctx, e, 0.02 + F.passo * 0.15, Math.sqrt(3));
  const nodi = [env, o, pre, ...L.nodi];
  const oscs = [o];
  VOCALE_A.forEach((fa, k) => {
    const fu = VOCALE_U[k];
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = (fa + fu) / 2;
    f.Q.value = 3 + F.brill * 5;
    const d = ctx.createGain();
    d.gain.value = ((fa - fu) / 2) * (0.15 + F.movimento * 0.85);
    L.uscita.connect(d); d.connect(f.frequency);
    const g = ctx.createGain(); g.gain.value = PESI_FORMANTI[k];
    pre.connect(f); f.connect(g); g.connect(env);
    nodi.push(f, d, g);
  });
  env.connect(dest);
  o.start(e.t0); o.stop(e.t1 + 0.05);
  apriChiudi(env, 0.42 * vel, e);
  libera(oscs[0], nodi);
}

/* BRINA — il velo, per molti battimenti insieme. Un grappolo inarmonico acuto
   in cui OGNI parziale è una coppia scordata: quattro coppie danno quattro
   velocità di battimento diverse, e quattro velocità che non stanno in rapporti
   semplici non si leggono più come un polso — si leggono come uno scintillio.
   È esattamente ciò che distingue la Brina dalla Frangia, che di battimento ne
   ha uno solo e leggibilissimo. */
const GRAPPOLO = [4.2, 5.4, 6.9, 8.3];
function xBrina({ ctx, e, freq, vel, dest, F }) {
  const env = ctx.createGain();
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = clamp(freq * 2.4, 400, 6000);
  hp.Q.value = 0.7;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = 13000; lp.Q.value = 0.5;
  const nodi = [env, hp, lp];
  const oscs = [];
  const scarto = 1.5 + F.movimento * 30;
  GRAPPOLO.forEach((r, k) => {
    const f = freq * r;
    if (f > 14000) return;
    for (const s of [-1, 1]) {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      // ogni coppia ha il suo scarto: quattro battimenti a quattro velocità
      o.detune.value = s * scarto * (0.55 + k * 0.35);
      const g = ctx.createGain();
      g.gain.value = (0.26 / (k + 1.6)) * (0.4 + F.brill * 1.2);
      o.connect(g); g.connect(hp);
      o.start(e.t0); o.stop(e.t1 + 0.05);
      nodi.push(o, g); oscs.push(o);
    }
  });
  const f0 = ctx.createOscillator(); f0.frequency.value = freq;
  const g0 = ctx.createGain(); g0.gain.value = F.corpo * 0.05;
  f0.connect(g0); g0.connect(lp);
  f0.start(e.t0); f0.stop(e.t1 + 0.05);
  nodi.push(f0, g0);
  hp.connect(lp); lp.connect(env); env.connect(dest);
  apriChiudi(env, 0.40 * vel, e);
  libera(oscs.length ? oscs[0] : f0, nodi);
}

/* SOGLIA — il velo, per sola luminosità. Rumore altissimo il cui LIVELLO
   respira, e nient'altro: nessuna altezza, nessun battimento, nessuna banda
   che si sposta. È il corrispettivo di «Sabbia» fra le gocce — non è una nota,
   è la grana che fa sedere le altre in un posto — e vive appena sopra il
   silenzio, che è il motivo del nome.

   Il guadagno medio è pari alla profondità più un filo, così il respiro non
   attraversa mai lo zero: sotto zero il rumore non tace, si rovescia di fase,
   e quello che si sentirebbe è un raschio invece di una chiusura. */
function xSoglia({ ctx, e, freq, vel, dest, F }) {
  const env = ctx.createGain();
  const src = ctx.createBufferSource();
  src.buffer = rumore(ctx); src.loop = true;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = clamp(freq * (1.5 + F.brill * 3), 2500, 11000);
  hp.Q.value = 0.7;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = 15000; lp.Q.value = 0.5;
  const L = lento(ctx, e, 0.015 + F.passo * 0.09, Math.sqrt(7));
  const prof = 0.10 + F.movimento * 0.34;
  const d = ctx.createGain(); d.gain.value = prof;
  L.uscita.connect(d);
  const porta = ctx.createGain();
  porta.gain.value = prof + 0.06;
  d.connect(porta.gain);
  src.connect(hp); hp.connect(lp); lp.connect(porta);
  porta.connect(env); env.connect(dest);
  src.start(e.t0); src.stop(e.t1 + 0.05);
  apriChiudi(env, 0.55 * vel, e);
  libera(src, [src, hp, lp, d, porta, env, ...L.nodi]);
}

const COSTRUTTORI_T = {
  bordone: xBordone, marea: xMarea, attrito: xAttrito, frangia: xFrangia,
  corrente: xCorrente, cavo: xCavo, brina: xBrina, soglia: xSoglia,
};

/* --------------------------------------------------------------- il pareggio
   Come per le gocce: otto tenuti costruiti ciascuno per conto suo escono a
   livelli molto diversi, e cambiare tessuto non deve voler dire cambiare
   volume. Misurati a peso 1, su tre tenute che si accavallano, andavano da
   −8,7 dB (Soglia: rumore a banda larga, la forma d'onda più densa che ci sia)
   a −27,1 (Cavo, dove tre bande strette buttano via quasi tutto il dente di
   sega). Questi pesi vengono da quella misura, non dall'orecchio: obiettivo
   −18 dB di picco.

   Il bersaglio è un decibel sotto quello delle gocce, e non per simmetria: i
   tessuti si SOVRAPPONGONO. Otto tenute aperte insieme stanno sul bus tutte
   contemporaneamente, mentre le gocce sono eventi radi che quasi mai
   coincidono, e la compensazione su √N tiene la somma ferma ma non regala
   margine.

   Soglia resta di proposito quattro decibel sotto le altre, come Sabbia fra le
   gocce: non è una nota, è la grana che fa sedere il resto in un posto, e
   portarla al livello delle altre la farebbe suonare come uno strumento.

   Chi ne aggiunge uno rifaccia `node prova.mjs` e scriva qui il numero che ne
   esce — è il motivo per cui quella prova esiste. */
const PESO_T = {
  bordone: 0.47, marea: 0.53, attrito: 0.45, frangia: 0.51,
  corrente: 1.30, cavo: 2.54, brina: 0.59, soglia: 0.22,
};

/* L'unico nome che esce da qui. Restituisce l'INVILUPPO usato: chi chiama lo
   registra, perché la normalizzazione del bus ha bisogno di sapere quanti
   inviluppi sono aperti e quanto valgono — non quante voci ci sono. */
function suonaTessuto(nome, { ctx, when, dur, freq, vel, pan, dest, F }) {
  const fai = COSTRUTTORI_T[nome] || COSTRUTTORI_T.bordone;
  const forma = F || FORMA_T;
  const e = inviluppoDi(when, dur, forma);

  const p = ctx.createStereoPanner();
  p.pan.value = clamp(pan, -1, 1);
  const peso = ctx.createGain();
  peso.gain.value = PESO_T[nome] || 1;
  peso.connect(p);
  p.connect(dest);

  const f = nelTerritorio(freq, TERRITORIO[nome] || [40, 2000]);
  fai({ ctx, e, freq: f, vel, dest: peso, F: forma });

  const morte = (e.t1 + 0.4 - ctx.currentTime) * 1000;
  if (isFinite(morte) && morte > 0 && morte < 600000) {
    setTimeout(() => { try { p.disconnect(); peso.disconnect(); } catch (err) {} }, morte);
  }
  e.amp = vel;
  return e;
}
