/* ============================================================== gli effetti
   L'INSERTO DI CLASSE: una catena che sta sul canale delle gocce o su quello
   dei tessuti, scelta da una tendina, con TRE manopole sotto il quadrante.

   TRE PARAMETRI E NON UN NUMERO VARIABILE. Le tre manopole sotto il quadrante
   ci sono sempre, anche quando l'inserto è vuoto: se ogni effetto ne portasse
   quanti gliene servono, cambiare effetto vorrebbe dire veder saltare
   l'impaginazione, e la simmetria fra le due classi — che è una regola di
   questo progetto — durerebbe finché le due tendine dicono la stessa cosa. Tre
   è anche il numero che si può girare senza leggere: quanto, quanto in fretta,
   quanto largo.

   LE TRE MANOPOLE SONO UNA TERNA SOLA PER CLASSE, non una terna per effetto.
   Cambiando effetto restano dove sono e il nuovo le legge a modo suo — è come
   si comporta un inserto vero, dove le manopole stanno sul pannello e non
   dentro l'effetto. Costa una sorpresa la prima volta e risparmia
   dodici numeri da ricordare per classe.

   IL RIVERBERO NON È FRA QUESTI, e la ragione è che c'è già: «spazio», sulla
   corona di ogni classe, è la mandata alla stanza dello studio. Metterne uno
   anche qui vorrebbe dire due comandi sulla stessa grandezza e due stanze
   invece di una — vedi la regola in cima a `banco.js`. Quello che manca
   davvero, e che il riverbero non sa fare, è l'ECO: ripetizioni che si contano
   invece di una coda che si spalma.

   DOVE STA L'INSERTO. Fra il normalizzatore e la coppia livello/mandata:
   `ingresso → normale → presa → [effetto] → ritorno → { livello, mandata }`.
   Prima del normalizzatore l'effetto lavorerebbe su un segnale che sale e
   scende con quante voci sono aperte; dopo la mandata, la stanza sentirebbe il
   secco mentre davanti canta l'eco, cioè due sorgenti diverse nello stesso
   posto. Qui in mezzo la compensazione resta quella delle VOCI — che è quello
   che conta — e la stanza sente quello che si sente. */

const EFFETTI_NOMI = ["niente", "eco", "tremolo", "coro", "filtro"];

/* `scrivi(valori, quando, t)`: `t` MOLTIPLICA le costanti di lisciamento, e a
   zero vuol dire adesso. Serve al montaggio — un effetto appena costruito non
   ha un valore vecchio da cui scivolare, e far salire i ritorni di un'eco da
   zero con un decimo di secondo di costante vuol dire sentirla entrare in
   ritardo; peggio, il tempo di ritardo che scivola da zero al suo valore è una
   glissata. In tutti gli altri casi `t` vale uno.

   Il valore di una manopola arriva sempre in 0÷100: `da()` lo porta
   nell'unità dell'effetto, `k`, `d` e `u` dicono come si scrive sulla targa
   (`numero(x * k, d) + u`, e la formattazione la fa chi disegna). Le corse
   esponenziali dove l'orecchio è esponenziale — tempi e frequenze — lineari
   dove è lineare.

   `fl` è una CHIAVE del dizionario e non un'etichetta: qui non si scrivono
   parole, perché un file che descrive dei nodi audio non è il posto dove tenere
   quattro lingue. Le parole stanno in `i18n.js`, sotto `par`. Le unità invece
   sono qui e non si traducono — `ms`, `Hz`, `°` sono segni; l'unica parola è
   l'ottava del filtro, e quella la mette la targa. */
const EFFETTI = {

  niente: {
    param: [],
    costruisci(ctx, ingresso, uscita) {
      ingresso.connect(uscita);
      return { nodi: [], scrivi() {} };
    },
  },

  /* L'ECO. Una linea di ritardo che si rimanda dentro il proprio ingresso, col
     passa-basso nell'anello: senza quello le ripetizioni tornerebbero identiche
     e la ventesima suonerebbe come la prima, che non è un'eco ma un loop.

     QUESTO ANELLO DI RETROAZIONE VA BENE, e quello del passa-tutto no. La
     differenza sta in cima a `banco.js`: là i 128 campioni che Web Audio
     infila in ogni ciclo scollavano due prese che dovevano cancellarsi, e la
     rete smetteva di essere quello che era. Qui il blocco si somma al tempo di
     ritardo — 2,7 ms su un'eco da mezzo secondo — e nessuno lo sente. Un anello
     è pericoloso quando due strade devono ritrovarsi in fase, non quando una
     strada sola torna indietro più tardi.

     I ritorni non passano 0,8: sopra, il giro cresce invece di scendere. */
  eco: {
    param: [
      { fl: "tempo",    da: (v) => 0.06 * Math.pow(20, v / 100), k: 1000, d: 0, u: " ms" },
      { fl: "ritorni",  da: (v) => (v / 100) * 0.8,              k: 1,    d: 2, u: "" },
      { fl: "quantita", da: (v) => v / 100,                      k: 1,    d: 2, u: "" },
    ],
    costruisci(ctx, ingresso, uscita) {
      const secco = ctx.createGain(), bagnato = ctx.createGain();
      const ritardo = ctx.createDelay(2), ritorni = ctx.createGain();
      const cupo = ctx.createBiquadFilter();
      cupo.type = "lowpass"; cupo.frequency.value = 2800;
      secco.gain.value = 1; bagnato.gain.value = 0; ritorni.gain.value = 0;
      ingresso.connect(secco); secco.connect(uscita);
      ingresso.connect(ritardo);
      ritardo.connect(cupo); cupo.connect(ritorni); ritorni.connect(ritardo);
      ritardo.connect(bagnato); bagnato.connect(uscita);
      return {
        nodi: [secco, bagnato, ritardo, ritorni, cupo],
        scrivi(v, quando, t) {
          ritardo.delayTime.setTargetAtTime(clamp(v[0], 0.02, 1.9), quando, 0.15 * t);
          ritorni.gain.setTargetAtTime(clamp(v[1], 0, 0.8), quando, 0.08 * t);
          dosa(secco, bagnato, v[2], quando, t);
        },
      };
    },
  },

  /* IL TREMOLO, e i due lati non battono insieme. Uno sfasamento fra destra e
     sinistra è quello che separa un tremolo da un pannello che oscilla: a zero
     gradi il suono pulsa al centro, a centottanta si sposta da un lato
     all'altro, e in mezzo gira. Su un fondo lungo la seconda è quasi sempre la
     cosa giusta, e con un comando solo non si potrebbe scegliere.

     Lo sfasamento è un RITARDO sull'oscillatore, non un secondo oscillatore
     fatto partire più tardi: due oscillatori si possono far partire solo nel
     futuro, e la fase che serve qui sta nel passato. Un ritardo sul segnale di
     comando dà la stessa cosa e non ha un istante da indovinare. */
  tremolo: {
    param: [
      { fl: "velocita",   da: (v) => 0.1 * Math.pow(60, v / 100), k: 1, d: 1, u: " Hz" },
      { fl: "profondita", da: (v) => v / 100,                     k: 1, d: 2, u: "" },
      { fl: "sghembo",    da: (v) => (v / 100) * 180,             k: 1, d: 0, u: "°" },
    ],
    costruisci(ctx, ingresso, uscita) {
      const divide = ctx.createChannelSplitter(2), unisce = ctx.createChannelMerger(2);
      const gL = ctx.createGain(), gR = ctx.createGain();
      const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = 3;
      const profL = ctx.createGain(), profR = ctx.createGain();
      // Dieci secondi di corsa: a un decimo di hertz mezzo giro sono cinque
      // secondi, e un massimo più corto tarperebbe lo sghembo proprio alle
      // velocità lente, che sono quelle per cui esiste.
      const sfasa = ctx.createDelay(10);
      gL.gain.value = 1; gR.gain.value = 1;
      profL.gain.value = 0; profR.gain.value = 0; sfasa.delayTime.value = 0;
      ingresso.connect(divide);
      divide.connect(gL, 0); divide.connect(gR, 1);
      gL.connect(unisce, 0, 0); gR.connect(unisce, 0, 1);
      unisce.connect(uscita);
      osc.connect(profL); profL.connect(gL.gain);
      osc.connect(sfasa); sfasa.connect(profR); profR.connect(gR.gain);
      osc.start(ctx.currentTime);
      return {
        nodi: [divide, unisce, gL, gR, osc, profL, profR, sfasa],
        scrivi(v, quando, t) {
          const f = clamp(v[0], 0.05, 20), p = clamp(v[1], 0, 1);
          osc.frequency.setTargetAtTime(f, quando, 0.1 * t);
          // Il guadagno oscilla fra 1−p e 1, quindi il centro sta a 1−p/2 e
          // l'ampiezza è p/2: così la profondità scava e non alza.
          gL.gain.setTargetAtTime(1 - p / 2, quando, 0.1 * t);
          gR.gain.setTargetAtTime(1 - p / 2, quando, 0.1 * t);
          profL.gain.setTargetAtTime(p / 2, quando, 0.1 * t);
          profR.gain.setTargetAtTime(p / 2, quando, 0.1 * t);
          sfasa.delayTime.setTargetAtTime(clamp((v[2] / 360) / f, 0, 9.9), quando, 0.1 * t);
        },
      };
    },
  },

  /* IL CORO: due copie ritardate di pochi millesimi, con i ritardi che
     respirano in controfase — una si allunga mentre l'altra si accorcia. In
     controfase e non insieme, o le due copie resterebbero identiche e ci
     sarebbe una voce sola spostata: la larghezza nasce dalla DIFFERENZA fra i
     due lati, non dal ritardo. */
  coro: {
    param: [
      { fl: "velocita",   da: (v) => 0.05 * Math.pow(40, v / 100),  k: 1,    d: 2, u: " Hz" },
      { fl: "profondita", da: (v) => 0.0004 + (v / 100) * 0.0055,   k: 1000, d: 1, u: " ms" },
      { fl: "quantita",   da: (v) => v / 100,                       k: 1,    d: 2, u: "" },
    ],
    costruisci(ctx, ingresso, uscita) {
      const secco = ctx.createGain(), bagnato = ctx.createGain();
      const unisce = ctx.createChannelMerger(2);
      const dL = ctx.createDelay(0.1), dR = ctx.createDelay(0.1);
      const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = 0.4;
      const pL = ctx.createGain(), pR = ctx.createGain();
      dL.delayTime.value = 0.011; dR.delayTime.value = 0.017;
      pL.gain.value = 0; pR.gain.value = 0;
      secco.gain.value = 1; bagnato.gain.value = 0;
      ingresso.connect(secco); secco.connect(uscita);
      ingresso.connect(dL); ingresso.connect(dR);
      dL.connect(unisce, 0, 0); dR.connect(unisce, 0, 1);
      unisce.connect(bagnato); bagnato.connect(uscita);
      osc.connect(pL); pL.connect(dL.delayTime);
      osc.connect(pR); pR.connect(dR.delayTime);
      osc.start(ctx.currentTime);
      return {
        nodi: [secco, bagnato, unisce, dL, dR, osc, pL, pR],
        scrivi(v, quando, t) {
          osc.frequency.setTargetAtTime(clamp(v[0], 0.02, 5), quando, 0.2 * t);
          const p = clamp(v[1], 0, 0.008);
          pL.gain.setTargetAtTime(p, quando, 0.2 * t);
          pR.gain.setTargetAtTime(-p, quando, 0.2 * t);
          dosa(secco, bagnato, v[2], quando, t);
        },
      };
    },
  },

  /* IL FILTRO: un passa-basso con la sua risonanza e un movimento lento sul
     taglio. È in serie e non in parallelo — un filtro mescolato col secco non
     filtra niente, lascia passare tutto e aggiunge una gobba.

     Il movimento si misura in OTTAVE e non in hertz: a taglio basso una corsa
     di mille hertz è un salto enorme, a taglio alto non si sente. In ottave
     vuol dire la stessa cosa dappertutto — e siccome l'automazione di
     `frequency` è lineare in hertz, l'ampiezza si ricalcola dal taglio ogni
     volta che uno dei due si muove. */
  filtro: {
    param: [
      { fl: "taglio",     da: (v) => 200 * Math.pow(60, v / 100), k: 1, d: 0, u: " Hz" },
      { fl: "risonanza",  da: (v) => 0.7 + (v / 100) * 11,        k: 1, d: 1, u: "" },
      { fl: "movimento",  da: (v) => (v / 100) * 2,               k: 1, d: 2, u: "ott" },
    ],
    costruisci(ctx, ingresso, uscita) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = 3000; f.Q.value = 0.7;
      const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = 0.08;
      const corsa = ctx.createGain(); corsa.gain.value = 0;
      ingresso.connect(f); f.connect(uscita);
      osc.connect(corsa); corsa.connect(f.frequency);
      osc.start(ctx.currentTime);
      return {
        nodi: [f, osc, corsa],
        scrivi(v, quando, t) {
          const hz = clamp(v[0], 120, 14000);
          f.frequency.setTargetAtTime(hz, quando, 0.2 * t);
          f.Q.setTargetAtTime(clamp(v[1], 0.5, 12), quando, 0.2 * t);
          // Mezza corsa in su e mezza in giù, in ottave, senza mai scendere
          // sotto i cento hertz né salire oltre la metà del campionamento.
          const ott = clamp(v[2], 0, 2) / 2;
          corsa.gain.setTargetAtTime(Math.min(hz * (Math.pow(2, ott) - 1), 8000), quando, 0.2 * t);
        },
      };
    },
  },
};

/* La dissolvenza fra secco e bagnato è a POTENZA COSTANTE — seno e coseno — e
   non lineare: le due strade sono incoerenti, quindi si sommano in potenza, e
   una dissolvenza lineare farebbe un avvallamento di tre decibel proprio a
   metà corsa. È la stessa aritmetica del bus dei tessuti, applicata a due
   sorgenti invece che a molte. */
function dosa(secco, bagnato, quanto, quando, t) {
  const q = clamp(quanto, 0, 1) * Math.PI / 2;
  secco.gain.setTargetAtTime(Math.cos(q), quando, 0.08 * t);
  bagnato.gain.setTargetAtTime(Math.sin(q), quando, 0.08 * t);
}

/* Ogni nodo creato per un effetto va scollegato a mano, e gli oscillatori
   fermati: la regola delle note vale anche qui, e un LFO dimenticato continua
   a girare per tutta la sessione senza che nessuno lo senta. */
function staccaEffetto(inserto) {
  if (!inserto) return;
  for (const n of inserto.nodi) {
    if (n.stop) { try { n.stop(); } catch (e) { /* già fermo */ } }
    n.disconnect();
  }
}
