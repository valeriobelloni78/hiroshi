/* =============================================================================
   HIROSHI · banco.js — l'uscita dello studio

   In Rada il grafo finiva dritto in `destination`: una sola classe di suoni,
   un solo riverbero, un solo volume. Hiroshi ha quattro sorgenti che devono
   convivere, un equalizzatore a otto bande, un limitatore e un registratore.
   Tutto questo sta qui, e sta SOTTO alle sorgenti: il banco non sa che cosa
   suona, sa solo che gli arrivano dei canali.

   La catena, dall'alto in basso:

       canale ─┬─ livello ──────────────────→ somma ─→ eq ─→ limitatore
               └─ mandata ─→ riverbero ─→ ritorno ─┘        ─→ saturatore
                                                            ─→ uscita ─┬→ destinazione
                                                                       └→ misuratori

   Due scelte da non disfare senza sapere perché.

   IL RIVERBERO È UNA MANDATA, NON UN INSERTO. In Rada era un bivio secco sul
   master (dry/wet) e bastava: una classe sola. Qui «spazio» è un comando di
   ciascuna classe — sta sulla corona del proprio cerchio — e due sorgenti
   devono poter stare l'una nell'ambiente e l'altra asciutta. Con un inserto
   sul master non si può; con una mandata per canale sì, e il riverbero resta
   uno solo, cioè una stanza sola per tutti, che è il punto.

   IL LIMITATORE È DOPPIO. Il DynamicsCompressor di Web Audio non è un vero
   limitatore a muro: ha un ginocchio e un tempo d'attacco, e un transiente
   ripido gli passa sotto. Dopo di lui c'è quindi una tangente iperbolica, che
   è una saturazione dolce e non ha tempo di reazione: qualunque cosa arrivi,
   esce sotto il tetto. Il compressore fa il lavoro musicale, la tangente fa
   la promessa. Serve perché lo studio REGISTRA: un file che clippa non si
   riascolta, si rifà.
============================================================================= */

/* --------------------------------------------------------------- il riverbero
   Rete a retroazione (Schroeder), trapiantata da Rada2 con le sue tarature.
   I quattro ritardi sono primi fra loro in millisecondi, quindi gli echi non
   si allineano; il guadagno d'anello è diviso per il picco MISURATO del
   filtro, e quel «misurato» è la ragione per cui la coda si spegne invece di
   crescere — vedi piccoDi(). */
const RIV_T60 = 3.6;                        // secondi per scendere di 60 dB
const RIV_SMORZAMENTO = 2800;               // Hz, il passa-basso dentro ogni pettine
const RIV_PETTINI = [31, 37, 41, 43];       // ms, primi
const RIV_PASSATUTTO = [[7, 11], [5, 13]];  // ms, una catena per canale

/* Il picco vero del filtro, chiesto al filtro.
   Il passa-basso di Web Audio arriva a 1,22 di modulo anche a Q basso, dove un
   Butterworth non dovrebbe passare l'unità. Moltiplicato per un guadagno
   d'anello di 0,94 porta il giro sopra 1: misurato, +600 dB in venti secondi.
   Il ripiego è 1,3 e NON 1: dividere per 1 non ridurrebbe nulla. E una misura
   sotto l'unità va rifiutata, perché dividere per meno di 1 ALZEREBBE il giro.
   Il modo di sbagliare è una coda più corta, mai una che esplode. */
function piccoDi(ctx, filtro) {
  const PRUDENTE = 1.3;
  try {
    const N = 512, nyq = ctx.sampleRate / 2;
    const hz = new Float32Array(N), mag = new Float32Array(N), fase = new Float32Array(N);
    for (let i = 0; i < N; i++) hz[i] = 20 * Math.pow(nyq / 20, i / (N - 1));
    filtro.getFrequencyResponse(hz, mag, fase);
    let max = 0;
    for (let i = 0; i < N; i++) if (mag[i] > max) max = mag[i];
    // La misura si accetta solo se cade dove un passa-basso a Q basso può
    // cadere. Sotto l'unità andrebbe rifiutata comunque — dividere per meno di
    // 1 ALZEREBBE il giro — e sopra 1,4 vuol dire che la risposta non era
    // pronta: capita, e prendere per buono un numero sbagliato cambia la coda
    // da una sessione all'altra. Misurato: senza questo tetto la stessa rete
    // rendeva code diverse a ogni ricostruzione.
    return (isFinite(max) && max >= 1 && max <= 1.4) ? max : PRUDENTE;
  } catch (e) { return PRUDENTE; }
}

/* Passa-tutto di Schroeder, SVOLTO IN UNA SERIE DI PRESE — non a retroazione.

   La forma canonica sarebbe questa:
       v[n] = x[n] + g·v[n−M]
       y[n] = v[n−M] − g·v[n]
   ed è quella che il progetto aveva. In Web Audio non funziona, e la ragione
   è misurata (vedi CLAUDE.md): un anello di retroazione si porta dietro un
   blocco implicito di 128 campioni, e DOVE cade quel blocco cambia da una
   costruzione all'altra. Quando cade fra la presa diretta e quella ritardata,
   le due smettono di essere lo stesso istante e il passa-tutto smette di
   essere passa-tutto. La firma numerica è netta: un solo stadio misurava
   guadagno RMS 1,0000 oppure 1,2894 a caso, e 1,291 è esattamente
   √((1+g²)/(1−g²)) con g = 0,5, cioè quello che resta quando i due termini
   non si cancellano più.

   Qui la stessa risposta è scritta senza anello. Dividendo il polinomio:
       H(z) = (z^−M − g) / (1 − g·z^−M) = −g + (1−g²)·Σ_{k≥1} g^(k−1)·z^−kM
   cioè una presa secca a −g più una coda geometrica di prese ritardate. Non
   c'è retroazione, quindi non c'è nessun blocco implicito da collocare e la
   rete misura sempre lo stesso numero.

   Il prezzo è che la coda va troncata: si ferma dove il residuo scende sotto
   −60 dB, e da lì in poi la rete è passa-tutto a meno di un millesimo. Il
   prezzo si paga volentieri — una rete che colora sempre uguale è musica, una
   che colora a caso è un difetto. */
function passatutto(ctx, sorgente, ms, g) {
  const uscita = ctx.createGain();

  // La presa secca: −g, senza ritardo.
  const diretto = ctx.createGain();
  diretto.gain.value = -g;
  sorgente.connect(diretto); diretto.connect(uscita);

  // La coda: tante prese quante ne servono perché l'ultima stia sotto −60 dB.
  // Con g = 0,5 sono dieci. I ritardi sono PARALLELI e non in cascata: una
  // cascata interpolerebbe dieci volte lo stesso ritardo frazionario — a
  // 44,1 kHz 7 ms non cade su un campione intero — e ogni interpolazione è
  // un filo di passa-basso in più.
  const prese = Math.min(16, Math.max(4, Math.ceil(Math.log(1e-3) / Math.log(g))));
  for (let k = 1; k <= prese; k++) {
    const secondi = (k * ms) / 1000;
    const ritardo = ctx.createDelay(secondi + 0.01);
    ritardo.delayTime.value = secondi;
    const peso = ctx.createGain();
    peso.gain.value = (1 - g * g) * Math.pow(g, k - 1);
    sorgente.connect(ritardo); ritardo.connect(peso); peso.connect(uscita);
  }

  return uscita;
}

/* La rete si costruisce su misura: la stanza dello studio tiene le tarature di
   Rada, il PAESAGGIO se ne fa una sua, più grande e più lunga. Non è una
   seconda stanza per le altre sorgenti — quelle continuano a stare tutte
   nell'unica, e «spazio» resta una mandata: è che per un drone il riverbero
   non è un ambiente in cui il suono sta, è metà del suono, e va dove sta la
   sorgente invece che in fondo al banco. */
function costruisciRiverbero(ctx, opz) {
  const conf = Object.assign({
    t60: RIV_T60, smorzamento: RIV_SMORZAMENTO,
    pettini: RIV_PETTINI, passatutto: RIV_PASSATUTTO,
  }, opz || {});

  const ingresso = ctx.createGain();
  ingresso.channelCount = 1;
  ingresso.channelCountMode = "explicit";

  const somma = ctx.createGain();
  somma.gain.value = 1 / conf.pettini.length;

  // I pettini sono CONDIVISI fra i due canali, non sdoppiati: sdoppiandoli si
  // misura uno squilibrio di 6 dB fra i lati, perché un anello più corto torna
  // più spesso e restituisce più energia. La larghezza stereo nasce solo dai
  // passa-tutto, che spostano la fase senza toccare il livello.
  // Il picco si misura UNA VOLTA SOLA: i quattro filtri sono identici, e
  // misurarli quattro volte dà quattro occasioni di ottenere numeri diversi —
  // che è esattamente il difetto per cui la coda cambiava da una prova
  // all'altra.
  const campione = ctx.createBiquadFilter();
  campione.type = "lowpass";
  campione.frequency.value = conf.smorzamento;
  campione.Q.value = Math.SQRT1_2;

  const massimo = Math.max(...conf.pettini) / 1000;
  const pettini = [];
  for (const ms of conf.pettini) {
    const ritardo = ctx.createDelay(Math.max(0.1, massimo * 1.5));
    ritardo.delayTime.value = ms / 1000;
    const smorza = ctx.createBiquadFilter();
    smorza.type = "lowpass";
    smorza.frequency.value = conf.smorzamento;
    smorza.Q.value = Math.SQRT1_2;
    const anello = ctx.createGain();
    ingresso.connect(ritardo);
    ritardo.connect(smorza); smorza.connect(anello); anello.connect(ritardo);
    ritardo.connect(somma);
    pettini.push({ ms, smorza, anello });
  }

  /* La taratura, e si rifà TUTTA ogni volta che si tocca uno dei due numeri.
     Il picco si RIMISURA sul filtro col nuovo smorzamento invece di riusare
     quello di prima: il guadagno d'anello ci si divide dentro, e riusare un
     picco vecchio è il modo per cui una rete a retroazione smette di scendere
     e comincia a crescere. Costa una risposta in frequenza — sincrona, e
     nessun rendering. */
  function tara(t60, smorzamento) {
    conf.t60 = clamp(t60, 0.2, 60);
    conf.smorzamento = clamp(smorzamento, 200, 18000);
    campione.frequency.value = conf.smorzamento;
    const picco = piccoDi(ctx, campione);
    for (const p of pettini) {
      p.smorza.frequency.value = conf.smorzamento;
      p.anello.gain.value = Math.pow(10, -3 * (p.ms / 1000) / conf.t60) / picco;
    }
  }
  tara(conf.t60, conf.smorzamento);

  // Un filo di continua a 10⁻¹⁵ tiene i valori sopra la soglia dei denormali,
  // che su molti processori costano decine di volte tanto proprio quando la
  // coda sta svanendo. −300 dB: inudibile.
  if (typeof ctx.createConstantSource === "function") {
    const semino = ctx.createConstantSource();
    semino.offset.value = 1e-15;
    semino.connect(ingresso);
    semino.start();
  }

  const unione = ctx.createChannelMerger(2);
  conf.passatutto.forEach((catena, canale) => {
    let nodo = somma;
    for (const ms of catena) nodo = passatutto(ctx, nodo, ms, 0.5);
    nodo.connect(unione, 0, canale);
  });

  return { ingresso, uscita: unione, tara };
}

/* ------------------------------------------------------------ l'equalizzatore
   Otto bande, le stesse targhe che stanno sulla tavola. La prima è uno scaffale
   basso e l'ultima uno scaffale alto: alle estremità una campana avrebbe metà
   della sua gonna fuori dalla banda udibile, e il cursore lavorerebbe a metà. */
const BANDE = [
  { hz: 20,    tipo: "lowshelf"  },
  { hz: 50,    tipo: "peaking"   },
  { hz: 100,   tipo: "peaking"   },
  { hz: 500,   tipo: "peaking"   },
  { hz: 1000,  tipo: "peaking"   },
  { hz: 5000,  tipo: "peaking"   },
  { hz: 10000, tipo: "peaking"   },
  { hz: 18000, tipo: "highshelf" },
];
const EQ_CORSA = 8;   // ±8 dB, la corsa dell'asta sulla tavola

function costruisciEq(ctx) {
  const filtri = BANDE.map((b) => {
    const f = ctx.createBiquadFilter();
    f.type = b.tipo;
    f.frequency.value = b.hz;
    f.Q.value = 1.0;                 // poco meno di un'ottava: le bande non si accavallano
    f.gain.value = 0;
    return f;
  });
  for (let i = 0; i < filtri.length - 1; i++) filtri[i].connect(filtri[i + 1]);
  return { ingresso: filtri[0], uscita: filtri[filtri.length - 1], filtri };
}

/* ----------------------------------------------------------- la tangente
   Curva di saturazione dolce: y = tanh(k·x) / tanh(k), normalizzata perché a
   x = 1 esca 1. Con k basso è quasi lineare in mezzo e stringe solo le punte.
   Non ha tempo di reazione, quindi è una promessa e non una reazione. */
function curvaTangente(k = 1.6, n = 2048) {
  const c = new Float32Array(n), norma = Math.tanh(k);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(k * x) / norma;
  }
  return c;
}

/* ================================================================ il banco */
function costruisciBanco(ctx, nomiCanali) {
  const somma = ctx.createGain();
  somma.gain.value = 1;

  const riverbero = costruisciRiverbero(ctx);
  const ritorno = ctx.createGain();
  ritorno.gain.value = 1;
  riverbero.uscita.connect(ritorno);
  ritorno.connect(somma);

  // Un canale per sorgente: il punto d'ingresso, la normalizzazione, il suo
  // livello, la sua mandata.
  //
  // IL NORMALIZZATORE STA PRIMA DEL LIVELLO, e non è la stessa cosa. Il
  // livello è del cursore, cioè di chi ascolta; il normalizzatore è della
  // sorgente, che lo scrive per compensare quante voci ha aperto in quel
  // momento. Se fossero un nodo solo, ogni compensazione automatica
  // sposterebbe il cursore sotto le dita. Sta anche PRIMA della mandata,
  // così il riverbero riceve il segnale già compensato: altrimenti la stanza
  // si riempirebbe proprio quando il segnale diretto viene abbassato.
  //
  // Il banco non sa che cosa sia una voce: espone il nodo e lascia che sia la
  // sorgente a dire di quanto. Le dipendenze scorrono in una direzione sola.
  const canali = {};
  for (const nome of nomiCanali) {
    const ingresso = ctx.createGain();
    const normale = ctx.createGain();
    const livello = ctx.createGain();
    const mandata = ctx.createGain();
    normale.gain.value = 1;
    livello.gain.value = 1;
    mandata.gain.value = 0;
    ingresso.connect(normale);
    normale.connect(livello); livello.connect(somma);
    normale.connect(mandata); mandata.connect(riverbero.ingresso);
    canali[nome] = { ingresso, normale, livello, mandata };
  }

  // IL COLORE D'INSIEME sta PRIMA dell'equalizzatore, ed è di un altro
  // padrone. L'equalizzatore è lo strumento di chi ascolta: otto aste che si
  // muovono a mano e restano dove le si lascia. Il colore invece non ha
  // cursore — dipende solo dall'ora del giorno — e vela tutto insieme, voci e
  // coda dell'ambiente, come fa la luce in una stanza. Metterlo dopo l'EQ
  // vorrebbe dire che una mano che alza gli acuti si trova davanti un muro
  // che non vede; metterlo prima vuol dire che l'EQ lavora su quello che il
  // giorno ha già colorato, che è la cosa giusta e anche l'ordine di Rada.
  const colore = ctx.createBiquadFilter();
  colore.type = "lowpass";
  colore.frequency.value = 2500;
  colore.Q.value = 0.6;
  somma.connect(colore);

  const eq = costruisciEq(ctx);
  colore.connect(eq.ingresso);

  const compressore = ctx.createDynamicsCompressor();
  compressore.threshold.value = -1.5;
  compressore.knee.value = 0;
  compressore.ratio.value = 20;
  compressore.attack.value = 0.003;
  compressore.release.value = 0.25;
  eq.uscita.connect(compressore);

  const tangente = ctx.createWaveShaper();
  tangente.curve = curvaTangente(1.6);
  tangente.oversample = "2x";
  compressore.connect(tangente);

  const uscita = ctx.createGain();
  uscita.gain.value = 0;            // si apre in applicaStato(), come in Rada
  tangente.connect(uscita);
  uscita.connect(ctx.destination);

  // I misuratori: uno per lato, dopo l'uscita, così mostrano quello che esce
  // davvero e non quello che si spera.
  const divisore = ctx.createChannelSplitter(2);
  uscita.connect(divisore);
  const misuratori = [0, 1].map((canale) => {
    const a = ctx.createAnalyser();
    a.fftSize = 1024;
    a.smoothingTimeConstant = 0;
    divisore.connect(a, canale);
    return a;
  });
  const finestra = new Float32Array(1024);

  return {
    canali, eq, uscita, compressore, riverbero, filtroColore: colore,

    /* Il colore d'insieme, in hertz. Lo scrive l'ora del giorno. Costante di
       tempo lunga — mezzo secondo — perché non è un gesto ma una luce che
       cambia: uno scalino su una frequenza di taglio si sente come un clic. */
    colore(hz, quando) {
      colore.frequency.setTargetAtTime(clamp(hz, 200, 20000), quando, 0.5);
    },

    /* Il livello di un canale, in dB. −Infinity spegne. */
    livello(nome, dB) {
      const c = canali[nome]; if (!c) return;
      c.livello.gain.setTargetAtTime(dB <= -60 ? 0 : Math.pow(10, dB / 20), ctx.currentTime, 0.05);
    },

    /* La compensazione di somma di un canale, 0..1. La scrive la sorgente, non
       chi ascolta. La costante di tempo è corta — 0,12 s — perché questo non è
       un gesto ma un inseguimento: deve arrivare quando arriva l'energia, non
       dopo. `quando` è un tempo assoluto, così la stessa chiamata vale dal vivo
       e dentro un rendering fuori tempo reale. */
    normalizza(nome, fattore, quando) {
      const c = canali[nome]; if (!c) return;
      c.normale.gain.setTargetAtTime(clamp(fattore, 0.02, 1), quando, 0.12);
    },

    /* La mandata al riverbero di un canale, 0..1. È «spazio» sulla corona. */
    spazio(nome, quanto) {
      const c = canali[nome]; if (!c) return;
      c.mandata.gain.setTargetAtTime(clamp(quanto, 0, 1), ctx.currentTime, 0.2);
    },

    /* Una banda dell'equalizzatore, in dB dentro la corsa dichiarata. */
    banda(i, dB) {
      const f = eq.filtri[i]; if (!f) return;
      f.gain.setTargetAtTime(clamp(dB, -EQ_CORSA, EQ_CORSA), ctx.currentTime, 0.05);
    },

    /* Il picco dei due lati, in dB, per il misuratore della tavola. */
    picchi() {
      return misuratori.map((a) => {
        a.getFloatTimeDomainData(finestra);
        let max = 0;
        for (let i = 0; i < finestra.length; i++) {
          const v = Math.abs(finestra[i]);
          if (v > max) max = v;
        }
        return max > 1e-6 ? 20 * Math.log10(max) : -Infinity;
      });
    },

    /* Quanto sta lavorando il limitatore, in dB (negativo o zero). */
    riduzione() { return compressore.reduction; },
  };
}
