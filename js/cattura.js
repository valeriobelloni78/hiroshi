/* =============================================================================
   HIROSHI · cattura.js — prendere il suono, e scriverlo su un file

   Due mestieri che sembrano diversi e sono lo stesso: portare fuori dal grafo
   una manciata di campioni e farne qualcosa. Da qui passano il **microfono**,
   che diventa materia per i grani, e il **registratore della sessione**, che
   diventa un wav. Il codice è uno solo apposta: la seconda volta che si scrive
   un catturatore, i due divergono al primo ritocco.

   Non dipende da niente del progetto tranne `clamp`. Sta in cima alla catena
   proprio perché lo usano due file lontani fra loro.
============================================================================= */

/* --------------------------------------------------------- il processore
   Non fa nient'altro che spedire al thread principale i blocchi che gli
   arrivano, uno per canale, TRASFERENDONE la memoria invece di copiarla: a
   375 messaggi al secondo una copia in più per blocco si accumula.

   Non mescola a mono qui dentro: il microfono lo vuole mono e il registratore
   lo vuole stereo, e decidere nel thread audio vorrebbe dire due processori.
   Decide chi riceve. */
const CODICE_CATTURA = `
class Cattura extends AudioWorkletProcessor {
  process(ingressi) {
    const inp = ingressi[0];
    if (!inp || !inp.length || !inp[0] || !inp[0].length) return true;
    const n = inp[0].length;
    const canali = [], trasferibili = [];
    for (let c = 0; c < inp.length; c++) {
      const b = new Float32Array(n);
      b.set(inp[c]);
      canali.push(b);
      trasferibili.push(b.buffer);
    }
    this.port.postMessage(canali, trasferibili);
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

   Il `data:` URI regge in tutti e due i posti, verificato. È scritto con
   `encodeURIComponent` e non con `btoa`, perché `btoa` non sa che farsene di
   un carattere fuori dal Latin-1 e basterebbe un accento in un commento a
   farlo esplodere — cioè un difetto che aspetta il primo che scrive una parola
   in italiano dentro il processore. */
/* IL MODULO SI SEGNA PER CONTESTO, non con un interruttore solo. Un worklet vive
   dentro il contesto in cui è stato caricato: con un booleano globale, il primo
   contesto che lo carica faceva credere a tutti gli altri di averlo già, e la
   costruzione del nodo falliva con un `InvalidStateError` — cioè «cattura non
   riuscita» a schermo, con il microfono appena aperto e tutto il resto a posto. */
const contestiColModulo = new WeakSet();
async function preparaCattura(ctx) {
  if (contestiColModulo.has(ctx)) return true;
  if (!ctx.audioWorklet) return false;
  const strade = [
    "data:text/javascript," + encodeURIComponent(CODICE_CATTURA),
    URL.createObjectURL(new Blob([CODICE_CATTURA], { type: "text/javascript" })),
  ];
  let fatto = false;
  for (const url of strade) {
    try {
      await ctx.audioWorklet.addModule(url);
      contestiColModulo.add(ctx);
      fatto = true;
      break;
    } catch (e) { /* si prova la prossima */ }
  }
  try { URL.revokeObjectURL(strade[1]); } catch (e) {}
  return fatto;
}

/* ------------------------------------------------------------- la cattura
   Prende un NODO qualunque — il microfono per i grani, l'uscita del banco per
   il registratore — e restituisce come fermarlo. Il tetto in secondi è un
   argomento e non una costante perché i due mestieri hanno due misure: una
   presa dal microfono è un gesto di qualche decina di secondi, una sessione
   registrata sono minuti.

   TUTTO STA IN MEMORIA. Un quarto d'ora di stereo a 48 kHz in virgola mobile
   sono circa 350 MB: è il motivo del tetto, ed è anche il motivo per cui non
   si può registrare per un'ora. Scrivere su disco mentre si registra vorrebbe
   dire la File System Access API, che sta solo su Chrome e chiede un permesso:
   una dipendenza grossa per un caso raro.

   IL CATTURATORE VA COLLEGATO A QUALCOSA anche se non deve farsi sentire. Un
   nodo la cui uscita non arriva alla destinazione può non essere percorso
   affatto, e allora non gli arriva niente da catturare: perciò finisce in un
   guadagno a zero. E a zero deve restare — un microfono che torna
   dall'altoparlante è un anello. */
async function apriCattura(ctx, sorgente, canali = 1, secondiMax = 90) {
  const blocchi = [];
  let campioni = 0;
  const limite = Math.floor(ctx.sampleRate * secondiMax);

  const silenzio = ctx.createGain();
  silenzio.gain.value = 0;
  silenzio.connect(ctx.destination);

  const raccogli = (arrivo) => {
    if (campioni >= limite) return;
    if (canali === 1 && arrivo.length > 1) {
      const n = arrivo[0].length, m = new Float32Array(n);
      for (let i = 0; i < n; i++) m[i] = (arrivo[0][i] + arrivo[1][i]) * 0.5;
      blocchi.push([m]);
    } else if (canali === 2 && arrivo.length === 1) {
      blocchi.push([arrivo[0], arrivo[0]]);      // mono steso sui due lati
    } else {
      blocchi.push(arrivo.slice(0, canali));
    }
    campioni += arrivo[0].length;
  };

  /* DUE STRADE, E LA SECONDA È UN RIPIEGO VERO. Il worklet è la strada buona —
     gira sul thread audio — ma se il modulo non c'è, o il nodo non si costruisce
     per qualunque ragione, la cattura NON deve fallire: uno `ScriptProcessor`
     registra lo stesso, e una presa un po' meno solida vale infinitamente più di
     un «cattura non riuscita». */
  let nodo = null;
  if (await preparaCattura(ctx)) {
    try {
      nodo = new AudioWorkletNode(ctx, "cattura", {
        numberOfInputs: 1, numberOfOutputs: 1,
        channelCount: canali, channelCountMode: "explicit",
      });
      nodo.port.onmessage = (e) => raccogli(e.data);
    } catch (e) {
      console.warn("cattura: il worklet non si costruisce, ripiego:", e && e.name, e && e.message);
      nodo = null;
    }
  }
  if (!nodo) {
    nodo = ctx.createScriptProcessor(4096, canali, canali);
    nodo.onaudioprocess = (e) => {
      const a = [];
      for (let c = 0; c < e.inputBuffer.numberOfChannels; c++) {
        a.push(new Float32Array(e.inputBuffer.getChannelData(c)));
      }
      raccogli(a);
    };
  }
  sorgente.connect(nodo);
  nodo.connect(silenzio);

  return {
    get secondi() { return campioni / ctx.sampleRate; },
    get pieno() { return campioni >= limite; },
    chiudi() {
      try { sorgente.disconnect(nodo); } catch (e) {}
      try { nodo.disconnect(); } catch (e) {}
      try { silenzio.disconnect(); } catch (e) {}
      if (nodo.port) nodo.port.onmessage = null;
      nodo.onaudioprocess = null;
      if (!campioni) return null;
      const buf = ctx.createBuffer(canali, campioni, ctx.sampleRate);
      for (let c = 0; c < canali; c++) {
        const d = buf.getChannelData(c);
        let k = 0;
        for (const b of blocchi) { d.set(b[Math.min(c, b.length - 1)], k); k += b[0].length; }
      }
      return buf;
    },
  };
}

/* Il microfono. `echoCancellation` e compagnia vanno SPENTE: sono tarate per
   la voce al telefono e su un field recording tolgono proprio ciò che si è
   andati a registrare — il fondo, la stanza, il riverbero del posto.

   LA SESSIONE AUDIO VA CHIESTA PRIMA, e senza questo Safari non registra. WebKit
   tiene una `navigator.audioSession` con una categoria, e una pagina che sta
   suonando la mette su «playback»: da lì `getUserMedia` risponde
   `InvalidStateError` — «AudioSession category is not compatible with audio
   capture» — che NON è un permesso negato, ma gli somiglia abbastanza da mandare
   fuori strada. Si chiede «play-and-record», cioè suonare e registrare insieme,
   che è esattamente quello che fa questo studio: il paesaggio continua mentre il
   microfono raccoglie.

   E SI RIMETTE COM'ERA quando la presa finisce. Su iPhone e iPad «play-and-record»
   abbassa l'uscita e la manda all'auricolare: lasciarla accesa vorrebbe dire uno
   strumento che dopo una registrazione suona piano, e nessuno collegherebbe le due
   cose. Dove `audioSession` non esiste — Chrome, Firefox — non si tocca niente. */
let sessionePrima = null;

async function apriMicrofono() {
  try {
    if (navigator.audioSession && navigator.audioSession.type !== "play-and-record") {
      sessionePrima = navigator.audioSession.type;
      navigator.audioSession.type = "play-and-record";
    }
  } catch (e) { /* una categoria che non si può scrivere non è un motivo per fermarsi */ }
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false, noiseSuppression: false,
      autoGainControl: false, channelCount: 1,
    },
  });
}

/* Chiude il microfono: ferma le tracce — la spia del sistema si spegne — e
   rimette la sessione audio dov'era. Sta qui e non nei comandi perché è il
   contrario esatto di `apriMicrofono()`, e due pezzi che si annullano stanno
   vicini. */
function chiudiMicrofono(flusso) {
  if (flusso) flusso.getTracks().forEach((t) => t.stop());
  try {
    if (navigator.audioSession && sessionePrima !== null) {
      navigator.audioSession.type = sessionePrima;
      sessionePrima = null;
    }
  } catch (e) {}
}

/* ================================================================== il wav
   RIFF/WAVE a 24 bit interi. Non 16, che su una coda di riverbero che scende
   per trenta secondi si sente rumoreggiare, e non virgola mobile a 32, che i
   lettori comuni non aprono. A 24 bit il rumore di quantizzazione sta sotto
   qualunque stanza reale e il file lo apre chiunque — e non serve il dithering,
   che a quel punto sarebbe più rumore di quello che toglie.

   L'intestazione è di 44 byte e non ha nulla di negoziabile: se un campo è
   sbagliato il file non si apre, e non c'è modo di accorgersene guardandolo.
   Per questo `prova.mjs` fa un'andata e ritorno vera — scrive un buffer noto,
   lo ridà da decodificare al browser e confronta i campioni. */
function scriviWav(buffer, bit = 24) {
  const canali = buffer.numberOfChannels;
  const n = buffer.length;
  const sr = buffer.sampleRate;
  const bytes = bit / 8;
  const lunghezzaDati = n * canali * bytes;

  const arr = new ArrayBuffer(44 + lunghezzaDati);
  const v = new DataView(arr);
  const testo = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };

  testo(0, "RIFF");
  v.setUint32(4, 36 + lunghezzaDati, true);
  testo(8, "WAVE");
  testo(12, "fmt ");
  v.setUint32(16, 16, true);                 // lunghezza del blocco fmt
  v.setUint16(20, 1, true);                  // 1 = PCM intero
  v.setUint16(22, canali, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * canali * bytes, true);// byte al secondo
  v.setUint16(32, canali * bytes, true);     // byte per fotogramma
  v.setUint16(34, bit, true);
  testo(36, "data");
  v.setUint32(40, lunghezzaDati, true);

  const dati = [];
  for (let c = 0; c < canali; c++) dati.push(buffer.getChannelData(c));
  const massimo = Math.pow(2, bit - 1) - 1;
  let off = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < canali; c++) {
      const x = clamp(dati[c][i], -1, 1);
      const q = Math.round(x * massimo);
      if (bit === 16) {
        v.setInt16(off, q, true); off += 2;
      } else {
        // Little endian a mano: i due byte bassi senza segno, il terzo con —
        // che è il complemento a due di un intero a 24 bit, scritto come lo
        // vuole il formato.
        v.setUint8(off, q & 255);
        v.setUint8(off + 1, (q >> 8) & 255);
        v.setInt8(off + 2, q >> 16);
        off += 3;
      }
    }
  }
  return new Blob([arr], { type: "audio/wav" });
}

/* Il salvataggio. Un `<a download>` costruito e cliccato: nessuna libreria,
   nessun permesso, e funziona anche aprendo la pagina col doppio clic. */
function salvaFile(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Il rilascio va rimandato: revocare subito toglie l'indirizzo da sotto al
  // salvataggio che è appena cominciato, e su file grossi il file esce tronco.
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/* Un nome che si ordina da sé: hiroshi-2026-09-01-1543.wav, e col suffisso di
   una traccia hiroshi-2026-09-01-1543-tessuti.wav. La data sta davanti perché i
   file di una seduta restino vicini in una cartella ordinata per nome. */
function nomeSessione(estensione, suffisso) {
  const d = new Date(), due = (x) => String(x).padStart(2, "0");
  return "hiroshi-" + d.getFullYear() + "-" + due(d.getMonth() + 1) + "-" + due(d.getDate()) +
         "-" + due(d.getHours()) + due(d.getMinutes()) +
         (suffisso ? "-" + suffisso : "") + "." + estensione;
}
