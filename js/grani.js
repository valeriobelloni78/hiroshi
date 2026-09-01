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
   quindi funziona anche aprendo `index.html` col doppio clic. La cattura dal
   microfono e la scrittura del wav stanno in `cattura.js`, perché sono la
   stessa macchina che serve al registratore della sessione.
============================================================================= */

/* ------------------------------------------------------------- i materiali
   Un elenco, non un solo posto: si registra un temporale, si carica una
   stanza, e si passa dall'uno all'altra senza perderli. Vuoto all'apertura —
   questa sorgente tace finché non le si dà qualcosa, ed è giusto così: non
   c'è nessun suono in dotazione da granulare. */
const materiali = [];
let materiale = -1;
const MICROFONO_MAX = 90;           // secondi: oltre, la memoria non vale la resa

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

/* La cattura dal microfono sta in `cattura.js`, insieme alla scrittura del wav:
   è la stessa macchina che serve al registratore della sessione, e due copie
   divergerebbero al primo ritocco. Qui si usa e basta. */

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

/* La memoria per il disegno: gli ultimi secondi di grani, con dove sono stati
   pescati e a che velocità. È la sorella di `storiaGocce` in `motore.js`, e sta
   qui per la stessa ragione per cui quella sta là — chi emette l'evento è
   l'unico che ne conosce i campi, e farli ricostruire alla tavola vorrebbe dire
   riscrivere la nube una seconda volta, in un altro file, con altri numeri.

   Si pota per tempo e non per lunghezza: a densità sessanta i grani sono
   sessanta al secondo, e una lista lunga a piacere diventerebbe un peso che
   cresce con la seduta. */
const FASCIA_GRANI = 2.0;
const storiaGrani = [];

function prenotaGrani(now, orizzonte, attiva, dest) {
  while (storiaGrani.length && storiaGrani[0].t < now - FASCIA_GRANI) storiaGrani.shift();
  const m = materiaCorrente();
  if (!attiva || !m || !m.durata) { prossimoGrano = Math.max(prossimoGrano, now); return 0; }
  if (prossimoGrano < now) prossimoGrano = now;

  const dur = clamp(effGR.grano / 1000, 0.01, 0.5);
  const centro = centroNube();
  const largo = (effGR.nube / 100) * 2.5;          // secondi attorno alla testa
  const largoPan = effGR.sparpaglio / 100;
  let quanti = 0, guardia = 0;

  while (prossimoGrano < orizzonte && guardia++ < 500) {
    const semi = semitoniGrano();
    const rate = Math.pow(2, semi / 12);
    // Il grano deve stare dentro il materiale: se sfora, si riporta indietro
    // invece di accorciarlo. Un grano accorciato perde la coda della finestra
    // e torna a essere un taglio.
    const massimo = Math.max(0, m.durata - dur * rate - 0.001);
    const dentro = clamp(centro + (Math.random() * 2 - 1) * largo, 0, massimo);
    const pan = (Math.random() * 2 - 1) * largoPan;
    suonaGrano({
      ctx: ctxGrani, when: prossimoGrano, buf: m.buffer, dentro, dur, rate,
      vel: 0.45 * (0.7 + Math.random() * 0.3),
      pan,
      dest,
    });
    storiaGrani.push({ t: prossimoGrano, dentro, semi, pan, dur });
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
