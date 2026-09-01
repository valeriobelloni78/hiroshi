/* =============================================================================
   HIROSHI · grani.js — la materia registrata, e la nube che la legge

   La quarta sorgente, e la prima che non viene da nessuna delle tre app: un
   granulare che macina registrazioni proprie. Non un banco di campioni — non
   c'è nessun suono in dotazione — ma un posto dove mettere ciò che si è
   raccolto fuori: un temporale, una stanza, un mercato, la propria voce.

   UNA DECISIONE DA NON DISFARE: IL MICROFONO NON SI GRANULA DAL VIVO. Si
   registra, e si granula la registrazione. Le ragioni sono tre e sono tutte
   strutturali:

     · L'ESPORTAZIONE. Il patto scritto in `motore.js` è che `passo(now)` sia
       una funzione del tempo che le viene passato, così lo stesso motore
       suona dal vivo e scrive il wav dentro un OfflineAudioContext molto più
       in fretta del tempo reale. Un flusso dal microfono non si può percorrere
       più in fretta del tempo reale: è il tempo reale. Una sorgente dal vivo
       renderebbe silenzio nell'esportazione — cioè romperebbe la promessa che
       il file suoni come quello che si è ascoltato.
     · LA TESTA DI LETTURA. Su un flusso si può solo guardare indietro di un
       ritardo fisso. Su una registrazione la testa si ferma, torna, va al
       contrario, e quel «fermarsi dentro un suono» è metà di quello che il
       granulare serve a fare.
     · IL RIENTRO. Microfono aperto e altoparlanti accesi sono un anello, e un
       anello con dentro un granulare non è un effetto: è un fischio.

   Il microfono quindi entra da una porta sola — «registra» — e da lì in poi è
   materia come un file.

   NIENTE `fetch`, come dappertutto qui. I file arrivano da un `<input
   type=file>` e passano per `decodeAudioData`: nessuna richiesta di rete,
   quindi funziona anche aprendo `index.html` col doppio clic. L'AudioWorklet
   della cattura è costruito come stringa e caricato da un blob, che è l'unica
   strada che regge su `file://` — `addModule` di un percorso locale fallisce.
============================================================================= */

/* ------------------------------------------------------------- i materiali
   Un elenco, non un solo posto: si registra un temporale, si carica una
   stanza, e si passa dall'uno all'altra senza perderli. Vuoto all'apertura —
   questa sorgente tace finché non le si dà qualcosa, ed è giusto così: non
   c'è nessun suono in dotazione da granulare. */
const materiali = [];
let materiale = -1;
const DURATA_MAX_CATTURA = 90;      // secondi: oltre, la memoria non vale la resa

function materiaCorrente() {
  return materiale >= 0 && materiali[materiale] ? materiali[materiale] : null;
}

function aggiungiMateria(nome, buffer) {
  materiali.push({ nome, buffer, durata: buffer.duration });
  materiale = materiali.length - 1;
  testaOra = 0;                     // la testa riparte dall'inizio della cosa nuova
  return materiale;
}

/* Un file scelto a mano. `decodeAudioData` vuole un ArrayBuffer, e `File` ne
   dà uno senza passare da nessuna richiesta. */
async function caricaFile(ctx, file) {
  const dati = await file.arrayBuffer();
  const buf = await ctx.decodeAudioData(dati);
  return aggiungiMateria(file.name.replace(/\.[^.]+$/, ""), buf);
}

/* ------------------------------------------------------------- la cattura
   Un AudioWorklet costruito come stringa e caricato da un blob: su `file://`
   `addModule` di un percorso locale fallisce per il CORS, e questa è l'unica
   strada che regge. Il processore non fa nient'altro che spedire al thread
   principale i blocchi che gli arrivano — la mescolanza a mono si fa qui,
   dentro il thread audio, perché mandare due canali vorrebbe dire il doppio
   dei messaggi per un materiale che poi verrebbe comunque letto a grani. */
const CODICE_CATTURA = `
class Cattura extends AudioWorkletProcessor {
  process(ingressi) {
    const inp = ingressi[0];
    if (inp && inp.length && inp[0] && inp[0].length) {
      const n = inp[0].length;
      const b = new Float32Array(n);
      if (inp.length > 1 && inp[1]) {
        for (let i = 0; i < n; i++) b[i] = (inp[0][i] + inp[1][i]) * 0.5;
      } else {
        b.set(inp[0]);
      }
      this.port.postMessage(b, [b.buffer]);
    }
    return true;
  }
}
registerProcessor("cattura", Cattura);
`;

/* IL MODULO SI CARICA DA UN `data:` URI, NON DA UN BLOB. Misurato in Chromium:
   aprendo la pagina con un doppio clic, `URL.createObjectURL` restituisce un
   `blob:null/…` — origine opaca — e `addModule` lo rifiuta con un AbortError
   secco, «Unable to load a worklet's module». Da `http://` il blob funziona,
   e questo è il modo in cui la cosa passa inosservata: si prova sul server,
   va, e poi non va sul doppio clic, che è proprio il caso che questo progetto
   promette di reggere.

   Il `data:` URI invece regge in tutti e due i posti, verificato. È scritto
   con `encodeURIComponent` e non con `btoa`, perché `btoa` non sa che farsene
   di un carattere fuori dal Latin-1 e basterebbe un accento in un commento a
   farlo esplodere — cioè un difetto che aspetta il primo che scrive una
   parola in italiano dentro il processore.

   Il blob resta come seconda strada e lo `ScriptProcessorNode` come terza:
   deprecato da anni, ancora ovunque, e su una registrazione di qualche decina
   di secondi il fatto che giri sul thread principale non si sente. */
let modulozzoCaricato = false;
async function preparaCattura(ctx) {
  if (modulozzoCaricato || !ctx.audioWorklet) return modulozzoCaricato;
  const strade = [
    "data:text/javascript," + encodeURIComponent(CODICE_CATTURA),
    URL.createObjectURL(new Blob([CODICE_CATTURA], { type: "text/javascript" })),
  ];
  for (const url of strade) {
    try {
      await ctx.audioWorklet.addModule(url);
      modulozzoCaricato = true;
      break;
    } catch (e) { /* si prova la prossima */ }
  }
  try { URL.revokeObjectURL(strade[1]); } catch (e) {}
  return modulozzoCaricato;
}

/* Attacca un catturatore a un nodo qualunque e restituisce come fermarlo.
   Prende un NODO e non il microfono, perché la stessa macchina servirà al
   registratore della sessione: lì la sorgente sarà l'uscita del banco.

   Il ripiego è `ScriptProcessorNode`, deprecato da anni e ancora ovunque. Il
   suo difetto — gira sul thread principale — qui pesa poco: si registra per
   qualche decina di secondi, non per ore.

   IL CATTURATORE VA COLLEGATO A QUALCOSA anche se non deve farsi sentire. Un
   nodo il cui uscita non arriva alla destinazione può non essere percorso
   affatto, e allora non gli arriva niente da catturare: perciò finisce in un
   guadagno a zero. E a zero deve restare — un microfono che torna
   dall'altoparlante è un anello. */
async function apriCattura(ctx, sorgente) {
  const blocchi = [];
  let campioni = 0;
  const silenzio = ctx.createGain();
  silenzio.gain.value = 0;
  silenzio.connect(ctx.destination);

  const raccogli = (b) => {
    if (campioni >= ctx.sampleRate * DURATA_MAX_CATTURA) return;
    blocchi.push(b);
    campioni += b.length;
  };

  let nodo;
  if (await preparaCattura(ctx)) {
    nodo = new AudioWorkletNode(ctx, "cattura", { numberOfOutputs: 1 });
    nodo.port.onmessage = (e) => raccogli(e.data);
  } else {
    nodo = ctx.createScriptProcessor(4096, 1, 1);
    nodo.onaudioprocess = (e) => raccogli(new Float32Array(e.inputBuffer.getChannelData(0)));
  }
  sorgente.connect(nodo);
  nodo.connect(silenzio);

  return {
    get secondi() { return campioni / ctx.sampleRate; },
    chiudi() {
      try { sorgente.disconnect(nodo); } catch (e) {}
      try { nodo.disconnect(); } catch (e) {}
      try { silenzio.disconnect(); } catch (e) {}
      if (nodo.port) nodo.port.onmessage = null;
      nodo.onaudioprocess = null;
      if (!campioni) return null;
      const buf = ctx.createBuffer(1, campioni, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let k = 0;
      for (const b of blocchi) { d.set(b, k); k += b.length; }
      return buf;
    },
  };
}

/* Il microfono. `echoCancellation` e compagnia vanno SPENTE: sono tarate per
   la voce al telefono e su un field recording tolgono proprio ciò che si è
   andati a registrare — il fondo, la stanza, il riverbero del posto. */
async function apriMicrofono() {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false, noiseSuppression: false,
      autoGainControl: false, channelCount: 1,
    },
  });
}

/* ------------------------------------------------------- la testa di lettura
   Dove si sta leggendo, in secondi dentro il materiale. È un accumulatore e
   non una posizione calcolata, perché la corsa si muove sotto le dita: si
   avanza di `dt · corsa` e ci si avvolge. A corsa zero la testa sta ferma —
   ed è il modo di stare *dentro* un suono invece che percorrerlo.

   Il ritorno al capo è per avvolgimento e non per rimbalzo: un rimbalzo si
   sente come un verso che cambia, un avvolgimento no — i grani stanno già
   sparpagliati attorno alla testa e nessuno sa dove sia il bordo. */
let testaOra = 0;

function avanzaTesta(dt) {
  const m = materiaCorrente();
  if (!m) return;
  const corsa = (effGR.corsa / 100);              // −1..1 volte il tempo reale
  testaOra += dt * corsa;
  const L = m.durata;
  if (L > 0) testaOra = ((testaOra % L) + L) % L;
}

/* Dove cade il centro della nube: la testa più il punto che il cursore ha
   scelto. Il cursore è una posizione ASSOLUTA nel materiale, la corsa la
   sposta: chi ferma la corsa e muove il cursore sta scegliendo il punto, chi
   ferma il cursore e apre la corsa sta scorrendo. Due gesti diversi con lo
   stesso risultato leggibile. */
function centroNube() {
  const m = materiaCorrente();
  if (!m) return 0;
  return (((effGR.testa / 100) * m.durata + testaOra) % m.durata + m.durata) % m.durata;
}

/* ------------------------------------------------------------- l'intonazione
   Un granulare traspone la materia, non la accorda: il materiale ha
   un'altezza sua che nessuno conosce — un temporale non ne ha affatto. Quello
   che si può scegliere sono gli INTERVALLI fra un grano e l'altro, e quelli sì
   che si sentono.

   In modo **intonato** i grani pescano i loro intervalli dalla stessa
   pentatonica anemitonica di tutto il resto: nessun semitono, nessun tritono,
   e la nube si accorda col pezzo anche partendo da un rumore di fondo. In modo
   **libero** l'intervallo è continuo, e il granulare torna a essere una cosa
   che sposta la velocità di lettura — che è l'altro modo di usarlo, e su una
   voce o su un motore è quello giusto.

   `sparpaglio` fa due mestieri e lo fa apposta: apre insieme il ventaglio
   delle altezze e quello del panorama, perché sono la stessa cosa detta in due
   assi — quanto la nube è larga. A zero è un punto: unisono, al centro. */
let graniIntonati = true;

/* Il punto da cui la nube conta i suoi intervalli. In modo intonato si
   ARROTONDA A UN SEMITONO, e non è un dettaglio: il baricentro della deriva è
   un numero reale che scorre, e lasciandolo continuo il reticolo scivolerebbe
   sotto ai grani — l'intonazione promessa diventerebbe un nastro che accelera.
   Arrotondato, il baricentro muove la nube A SCATTI di semitono: si sente che
   la nube sale, e resta un reticolo. In modo libero non c'è nessun reticolo da
   difendere e lo scorrimento continuo è proprio quello che si vuole. */
function baseGrani() {
  return graniIntonati ? Math.round(effGR.altezza) : effGR.altezza;
}

function semitoniGrano() {
  const base = baseGrani();
  if (!graniIntonati) {
    return base + (Math.random() * 2 - 1) * (effGR.sparpaglio / 100) * 12;
  }
  // Quanti gradi della collezione entrano in gioco: a sparpaglio zero uno
  // solo, cioè l'unisono; a cento tutti e cinque, su due ottave per lato.
  const quanti = Math.max(1, Math.round(1 + (effGR.sparpaglio / 100) * (GRADI.length - 1)));
  const grado = GRADI[Math.floor(Math.random() * quanti)];
  const ottave = Math.round((Math.random() * 2 - 1) * (effGR.sparpaglio / 100) * 2);
  return base + grado + 12 * ottave;
}

/* ---------------------------------------------------------------- la finestra
   Una campana di Hann, calcolata una volta sola e condivisa da tutti i grani.
   Un grano senza finestra è un taglio a ogni estremo, e centinaia di tagli al
   secondo non si sentono come grana: si sentono come ronzio.

   Sta in un nodo suo, separato dal peso, così la stessa curva 0..1 serve per
   qualunque ampiezza — `setValueCurveAtTime` scrive valori assoluti, e
   scalarla per ogni grano vorrebbe dire una copia dell'array a ogni grano. */
const PUNTI_FINESTRA = 128;
const FINESTRA_GRANO = new Float32Array(PUNTI_FINESTRA);
for (let i = 0; i < PUNTI_FINESTRA; i++) {
  FINESTRA_GRANO[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (PUNTI_FINESTRA - 1));
}

/* ------------------------------------------------------------------ un grano
   Tre nodi e un colpo di forbici. `start(quando, dentro, quanto)` vuole
   `quanto` misurato nel tempo del MATERIALE, non in quello del contesto:
   perciò la durata voluta va moltiplicata per il rapporto di lettura,
   altrimenti un grano trasposto all'ottava sopra durerebbe metà di quello che
   dice il cursore. */
function suonaGrano({ ctx, when, buf, dentro, dur, rate, vel, pan, dest }) {
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.playbackRate.value = rate;

  const fin = ctx.createGain();
  fin.gain.setValueAtTime(0, when);
  fin.gain.setValueCurveAtTime(FINESTRA_GRANO, when, dur);

  const peso = ctx.createGain();
  peso.gain.value = vel;

  const p = ctx.createStereoPanner();
  p.pan.value = clamp(pan, -1, 1);

  s.connect(fin); fin.connect(peso); peso.connect(p); p.connect(dest);

  const quanto = Math.min(dur * rate, Math.max(0.005, buf.duration - dentro));
  s.start(when, dentro, quanto);
  s.stop(when + dur + 0.02);
  libera(s, [s, fin, peso, p]);
  return dur;
}

/* ------------------------------------------------------------------ la nube
   I grani non stanno su un giro come le gocce: sono un flusso, e il flusso ha
   una densità. Il prossimo grano si colloca su un TEMPO ASSOLUTO — è la sola
   condizione che il patto del motore impone a chi aggiunge una sorgente, ed è
   anche ciò che rende l'esportazione una conseguenza invece che una funzione
   da scrivere.

   Lo scarto casuale sull'intervallo va da 0,6 a 1,4 volte, con media uno:
   così la densità dichiarata è quella vera, ma i grani non cadono su una
   griglia. Una nube su griglia non è una nube, è un tremolo — e a densità
   basse si sente subito. */
let prossimoGrano = 0;

function prenotaGrani(now, orizzonte, attiva, dest) {
  const m = materiaCorrente();
  if (!attiva || !m || !m.durata) { prossimoGrano = Math.max(prossimoGrano, now); return 0; }
  if (prossimoGrano < now) prossimoGrano = now;

  const dur = clamp(effGR.grano / 1000, 0.01, 0.5);
  const centro = centroNube();
  const largo = (effGR.nube / 100) * 2.5;          // secondi attorno alla testa
  const largoPan = effGR.sparpaglio / 100;
  let quanti = 0, guardia = 0;

  while (prossimoGrano < orizzonte && guardia++ < 500) {
    const rate = Math.pow(2, semitoniGrano() / 12);
    // Il grano deve stare dentro il materiale: se sfora, si riporta indietro
    // invece di accorciarlo. Un grano accorciato perde la coda della finestra
    // e torna a essere un taglio.
    const massimo = Math.max(0, m.durata - dur * rate - 0.001);
    const dentro = clamp(centro + (Math.random() * 2 - 1) * largo, 0, massimo);
    suonaGrano({
      ctx: ctxGrani, when: prossimoGrano, buf: m.buffer, dentro, dur, rate,
      vel: 0.45 * (0.7 + Math.random() * 0.3),
      pan: (Math.random() * 2 - 1) * largoPan,
      dest,
    });
    quanti++;
    prossimoGrano += (1 / effGR.densita) * (0.6 + Math.random() * 0.8);
  }
  return quanti;
}

/* Il contesto lo passa il motore prima di ogni prenotazione: dal vivo è quello
   reale, fuori tempo reale è quello del rendering. Nemmeno i grani sanno da
   dove viene il tempo. */
let ctxGrani = null;
function contestoGrani(c) { ctxGrani = c; }

/* Quanti grani stanno suonando insieme, in media: densità per durata. È un
   numero NOTO — non c'è niente da misurare — e serve alla compensazione del
   bus, che è la stessa dei tessuti e per la stessa ragione: sorgenti
   incoerenti si sommano in potenza, e senza dividere per √N alzare la densità
   vorrebbe dire alzare il volume invece di infittire la nube. */
function sovrapposizioneGrani() {
  return Math.max(1, effGR.densita * clamp(effGR.grano / 1000, 0.01, 0.5));
}
