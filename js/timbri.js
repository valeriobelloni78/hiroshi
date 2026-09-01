/* =============================================================================
   HIROSHI · timbri.js — gli otto suoni delle gocce

   In Rada la goccia era una sola: FM dolce, portante e modulante, un parziale
   a 2,01 volte per il battimento. Suona bene ed è rimasta — è «Vetro». Ma uno
   studio ha bisogno di più materie, e la tendina della colonna ne dichiara
   otto. Sono otto nomi di materia, non otto forme d'onda: a distinguerle è
   quasi tutto l'ATTACCO e la lunghezza della coda, non lo spettro stazionario.
   È la stessa scoperta che è già scritta nel README di Nuvole, e vale la pena
   ripeterla qui perché guida ogni ritocco: chi vuole cambiare uno strumento
   guardi prima i primi trenta millisecondi.

   Ogni timbro riceve la stessa FORMA — i cinque cursori della colonna — e la
   interpreta a modo suo:

     attacco   quanto ci mette ad aprirsi
     coda      quanto resta dopo
     inarm     quanto i parziali si scostano dai multipli interi
     brill     quanta energia c'è in alto
     corpo     quanto pesa la fondamentale rispetto ai parziali

   REGOLA DI FERRO, ereditata e pagata cara: ogni nodo creato per una nota va
   scollegato a mano quando la nota finisce. Il rilascio automatico dipende
   dalla raccolta della memoria, che è attività del thread PRINCIPALE — proprio
   quello che a schermo bloccato viene strozzato. Il thread audio intanto
   continua ad accumulare: il grafo cresce più in fretta di quanto venga
   ripulito, la CPU audio sale, i buffer prima frusciano e poi saltano.
============================================================================= */

const TIMBRI = ["vetro", "legno", "onda", "soffio", "corda", "metallo", "canna", "sabbia"];

/* La forma del suono: i cinque filetti sotto la tendina. Valori d'esordio
   uguali a quelli scritti sulla tavola. Questa è la BASE; quella che arriva
   ai costruttori è la base inclinata dal calore, qui sotto. */
const FORMA = { attacco: 0.004, coda: 1.8, inarm: 0.22, brill: 0.58, corpo: 0.41 };

/* ------------------------------------------------------------------ il calore
   In Rada il timbro delle gocce aveva un comando solo, `warmth`, e quel numero
   governava insieme il rapporto di modulazione, l'indice, il parziale campana
   e la lunghezza della coda. Qui i timbri sono otto e la forma ne ha cinque,
   ma il calore resta — perché è il comando che l'ora del giorno inclina, ed è
   l'unico modo per cui «notturna» suona davvero più calda di «pomeriggio»
   senza che nessuno tocchi niente.

   Il calore muove QUATTRO dei cinque filetti nello stesso verso: caldo vuol
   dire coda lunga, pochi parziali fuori posto, poca energia in alto e molta
   fondamentale. L'attacco no: quello dice CHE STRUMENTO È, e un calore che lo
   spostasse cambierebbe il timbro invece di scaldarlo — è la regola scritta in
   cima a questo file, letta al contrario. */
function formaGocce(calore) {
  const c = clamp(calore, 0, 100) / 100;
  return {
    attacco: FORMA.attacco,
    coda:    FORMA.coda * (0.5 + c * 1.1),
    inarm:   clamp(FORMA.inarm + (0.5 - c) * 0.40, 0, 1),
    brill:   clamp(FORMA.brill + (0.5 - c) * 0.60, 0, 1),
    corpo:   clamp(FORMA.corpo + (c - 0.5) * 0.50, 0, 1),
  };
}

/* Un solo buffer di rumore per contesto, riusato da tutti i timbri che ne
   hanno bisogno: crearne uno per nota costerebbe un'allocazione e una
   scrittura di 96.000 campioni a ogni goccia. */
let _rumore = null;
function rumore(ctx) {
  if (_rumore && _rumore.sampleRate === ctx.sampleRate) return _rumore;
  const n = Math.floor(ctx.sampleRate * 2);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  _rumore = buf;
  return buf;
}

/* Chiude la nota: la coda esponenziale non arriva mai a zero, quindi si scende
   a un valore piccolo e poi si stacca. Lo 0,0008 è il valore di Rada. */
function spegni(env, when, dur) {
  env.gain.exponentialRampToValueAtTime(0.0008, when + dur);
}

/* Scollega tutto quando la sorgente principale finisce. Prende la lista dei
   nodi da liberare: non ci si affida alla raccolta della memoria. */
function libera(sorgente, nodi) {
  sorgente.onended = () => { for (const n of nodi) { try { n.disconnect(); } catch (e) {} } };
}

/* --------------------------------------------------------------------------
   Ogni costruttore riceve { ctx, when, freq, vel, dest, F } e restituisce la
   durata in secondi. Chi chiama non sa nulla di quello che succede dentro.
-------------------------------------------------------------------------- */

/* VETRO — glockenspiel in FM. La modulante sta poco sopra la portante e il
   suo indice decade in due decimi: il colpo entra brillante e si schiarisce
   in una sinusoide che continua a suonare. */
function tVetro({ ctx, when, freq, vel, dest, F }) {
  const dur = 0.9 + F.coda * 1.6;
  const car = ctx.createOscillator(); car.frequency.value = freq;
  const mod = ctx.createOscillator(); mod.frequency.value = freq * (3 + F.inarm * 2.4);
  const idx = ctx.createGain();
  const env = ctx.createGain();
  idx.gain.setValueAtTime(freq * (0.4 + F.brill * 2.2), when);
  idx.gain.exponentialRampToValueAtTime(freq * 0.02, when + 0.2);
  mod.connect(idx); idx.connect(car.frequency);
  const picco = 0.15 * vel;
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(picco, when + Math.max(0.002, F.attacco));
  spegni(env, when, dur);
  car.connect(env); env.connect(dest);
  car.start(when); mod.start(when);
  car.stop(when + dur + 0.05); mod.stop(when + dur + 0.05);
  libera(car, [car, mod, idx, env]);
  return dur;
}

/* LEGNO — battente su barra di marimba. Caldo e corto, col parziale a due
   ottave che se ne va per primo: è quella differenza di decadimento a fare
   il legno, non la forma d'onda. */
function tLegno({ ctx, when, freq, vel, dest, F }) {
  const dur = 0.35 + F.coda * 0.5;
  const f0 = ctx.createOscillator(); f0.frequency.value = freq;
  const p1 = ctx.createOscillator(); p1.frequency.value = freq * (4 + F.inarm * 0.6);
  const g0 = ctx.createGain(), g1 = ctx.createGain(), env = ctx.createGain();
  g0.gain.value = 0.55 + F.corpo * 0.45;
  g1.gain.setValueAtTime(0.30 * (0.3 + F.brill), when);
  g1.gain.exponentialRampToValueAtTime(0.001, when + dur * 0.28);   // il parziale muore prima
  const picco = 0.20 * vel;
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(picco, when + Math.max(0.002, F.attacco));
  spegni(env, when, dur);
  f0.connect(g0); g0.connect(env);
  p1.connect(g1); g1.connect(env);
  env.connect(dest);
  f0.start(when); p1.start(when);
  f0.stop(when + dur + 0.05); p1.stop(when + dur + 0.05);
  libera(f0, [f0, p1, g0, g1, env]);
  return dur;
}

/* ONDA — un suono semplice e tenuto, il fondo dell'insieme. Nessun parziale:
   quello che si sente è solo l'inviluppo. */
function tOnda({ ctx, when, freq, vel, dest, F }) {
  const dur = 1.6 + F.coda * 2.4;
  const o = ctx.createOscillator(); o.frequency.value = freq;
  const env = ctx.createGain();
  const picco = 0.16 * vel;
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(picco, when + Math.max(0.02, F.attacco * 12));
  spegni(env, when, dur);
  o.connect(env); env.connect(dest);
  o.start(when); o.stop(when + dur + 0.05);
  libera(o, [o, env]);
  return dur;
}

/* SOFFIO — rumore filtrato stretto attorno alla nota, con una sinusoide sotto
   che le dà l'intonazione. Senza la sinusoide il soffio ha un'altezza vaga;
   con quella si accorda col resto. */
function tSoffio({ ctx, when, freq, vel, dest, F }) {
  const dur = 1.1 + F.coda * 1.8;
  const src = ctx.createBufferSource(); src.buffer = rumore(ctx); src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass"; bp.frequency.value = freq * (1 + F.brill * 0.6); bp.Q.value = 14 - F.inarm * 8;
  const gR = ctx.createGain(); gR.gain.value = 0.9;
  const o = ctx.createOscillator(); o.frequency.value = freq;
  const gO = ctx.createGain(); gO.gain.value = 0.10 + F.corpo * 0.30;
  const env = ctx.createGain();
  const picco = 0.13 * vel;
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(picco, when + Math.max(0.05, F.attacco * 20));
  spegni(env, when, dur);
  src.connect(bp); bp.connect(gR); gR.connect(env);
  o.connect(gO); gO.connect(env);
  env.connect(dest);
  src.start(when); o.start(when);
  src.stop(when + dur + 0.05); o.stop(when + dur + 0.05);
  libera(src, [src, bp, gR, o, gO, env]);
  return dur;
}

/* CORDA — pizzicato. Un dente di sega con il passa-basso che scende in fretta:
   è l'impressione della corda, non il modello.
   NOTA: una Karplus-Strong vera qui non si può fare con i nodi. Un anello di
   retroazione su un DelayNode non scende sotto un blocco di rendering — 128
   campioni, cioè 2,7 ms a 48 kHz — e quel minimo fissa l'altezza massima
   attorno ai 375 Hz. Sopra, la corda suonerebbe stonata. */
function tCorda({ ctx, when, freq, vel, dest, F }) {
  const dur = 0.7 + F.coda * 1.4;
  const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = freq;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 1 + F.inarm * 6;
  lp.frequency.setValueAtTime(Math.min(freq * (6 + F.brill * 18), 16000), when);
  lp.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.2, 120), when + dur * 0.45);
  const env = ctx.createGain();
  const picco = 0.11 * vel;
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(picco, when + Math.max(0.002, F.attacco));
  spegni(env, when, dur);
  o.connect(lp); lp.connect(env); env.connect(dest);
  o.start(when); o.stop(when + dur + 0.05);
  libera(o, [o, lp, env]);
  return dur;
}

/* METALLO — campana inarmonica. I rapporti sono quelli classici della campana
   tubolare; «inarm» li allontana ancora dagli interi, e a zero li riporta
   quasi in riga, che è il modo di rendere il metallo docile. */
const CAMPANA = [1, 2.76, 5.40, 8.93];
function tMetallo({ ctx, when, freq, vel, dest, F }) {
  const dur = 1.8 + F.coda * 3.2;
  const env = ctx.createGain();
  const picco = 0.09 * vel;
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(picco, when + Math.max(0.002, F.attacco));
  spegni(env, when, dur);
  env.connect(dest);
  const nodi = [env];
  const oscs = [];
  CAMPANA.forEach((r, k) => {
    const rr = 1 + (r - 1) * (0.25 + F.inarm * 1.5);
    const o = ctx.createOscillator(); o.frequency.value = freq * rr;
    const g = ctx.createGain();
    const peso = k === 0 ? (0.5 + F.corpo * 0.5) : (0.42 * F.brill) / (k + 1);
    g.gain.setValueAtTime(peso, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur * (1 - k * 0.18));  // gli acuti prima
    o.connect(g); g.connect(env);
    o.start(when); o.stop(when + dur + 0.05);
    nodi.push(o, g); oscs.push(o);
  });
  libera(oscs[0], nodi);
  return dur;
}

/* CANNA — ancia. Un'onda quadra stretta in una banda, con l'attacco che apre
   la banda invece di alzare il volume: è così che entra un fiato. */
function tCanna({ ctx, when, freq, vel, dest, F }) {
  const dur = 1.2 + F.coda * 2.0;
  const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = freq;
  const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 2 + F.inarm * 5;
  bp.frequency.setValueAtTime(freq * 1.1, when);
  bp.frequency.linearRampToValueAtTime(freq * (2 + F.brill * 5), when + 0.09);
  bp.frequency.exponentialRampToValueAtTime(freq * 1.3, when + dur * 0.7);
  const env = ctx.createGain();
  const picco = 0.10 * vel;
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(picco, when + Math.max(0.02, F.attacco * 10));
  spegni(env, when, dur);
  o.connect(bp); bp.connect(env); env.connect(dest);
  o.start(when); o.stop(when + dur + 0.05);
  libera(o, [o, bp, env]);
  return dur;
}

/* SABBIA — quasi solo attacco. Rumore risonante e cortissimo: serve a dare
   grana all'insieme, non altezza. Resta intonato quel tanto che basta a non
   litigare col resto. */
function tSabbia({ ctx, when, freq, vel, dest, F }) {
  const dur = 0.16 + F.coda * 0.30;
  const src = ctx.createBufferSource(); src.buffer = rumore(ctx);
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq * (2 + F.brill * 6);
  bp.Q.value = 3 + F.corpo * 9;
  const env = ctx.createGain();
  const picco = 0.14 * vel;
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(picco, when + 0.003);
  spegni(env, when, dur);
  src.connect(bp); bp.connect(env); env.connect(dest);
  src.start(when); src.stop(when + dur + 0.05);
  libera(src, [src, bp, env]);
  return dur;
}

const COSTRUTTORI = {
  vetro: tVetro, legno: tLegno, onda: tOnda, soffio: tSoffio,
  corda: tCorda, metallo: tMetallo, canna: tCanna, sabbia: tSabbia,
};

/* --------------------------------------------------------------- il pareggio
   Otto timbri costruiti ciascuno per conto suo escono a livelli molto diversi:
   misurati su sei note, andavano da −11 dB (Onda, una sinusoide tenuta, che è
   la forma d'onda più densa che esista) a −34 dB (Sabbia, un impulso di
   rumore, tutto attacco e niente corpo). Cambiare timbro sarebbe stato
   cambiare volume, e il cursore del livello non c'entra nulla.

   Questi pesi vengono da quella misura, non dall'orecchio: obiettivo −16 dB di
   picco sulla stessa prova. Chi aggiunge un timbro rifaccia `node prova.mjs` e
   scriva qui il numero che ne esce — è il motivo per cui quella prova esiste.
   Sabbia e Soffio restano di proposito un po' sotto: sono grana e fiato, non
   note, e portarli al livello degli altri li farebbe suonare come uno
   strumento invece che come una materia. */
const PESO = {
  vetro: 0.78, legno: 1.05, onda: 0.55, soffio: 2.60,
  corda: 1.00, metallo: 1.50, canna: 1.90, sabbia: 4.50,
};

/* L'unico nome che esce da qui. Il panorama sta fuori dai costruttori perché
   è dello STRUMENTO, non del timbro: cambiare timbro non deve spostare una
   linea da un lato all'altro. */
function suonaTimbro(nome, { ctx, when, freq, vel, pan, dest, F }) {
  const fai = COSTRUTTORI[nome] || COSTRUTTORI.vetro;
  const p = ctx.createStereoPanner();
  p.pan.value = clamp(pan, -1, 1);
  const peso = ctx.createGain();
  peso.gain.value = PESO[nome] || 1;
  peso.connect(p);
  p.connect(dest);
  const dur = fai({ ctx, when, freq, vel, dest: peso, F: F || FORMA });
  // Il panner vive quanto la nota più lunga che ci passa dentro; lo si stacca
  // con un timer sul clock audio, non con onended, perché non è una sorgente.
  const morte = (when + dur + 0.2 - ctx.currentTime) * 1000;
  if (isFinite(morte) && morte > 0 && morte < 600000) {
    setTimeout(() => { try { p.disconnect(); peso.disconnect(); } catch (e) {} }, morte);
  }
  return dur;
}
