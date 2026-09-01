/* =============================================================================
   HIROSHI · motore.js — lo scheduler e l'assemblaggio

   Il cuore è uno scheduler a lookahead: ogni 25 ms prenota le note sul clock
   del motore audio, preciso al singolo campione. I timer di JavaScript sono
   troppo imprecisi per frasi che devono restare in fase per ore.

   UNA COSA NUOVA RISPETTO A RADA, ed è quella che rende possibile
   l'esportazione: IL MOTORE NON SA DA DOVE VIENE IL TEMPO. `passo(now)` è una
   funzione pura del tempo che le viene passato. Dal vivo lo chiama un
   setInterval sul contesto reale; per scrivere il wav lo chiama un ciclo che
   percorre N secondi virtuali dentro un OfflineAudioContext, molto più in
   fretta del tempo reale. Non ci sono due strade e nemmeno due motori: c'è
   una funzione e due modi di chiamarla. Chi aggiunge una sorgente non deve
   fare niente perché l'esportazione la includa.

   L'ordine dentro un passo è vincolante:
       deriva → prenotazione → ricambio
   La deriva avanza per prima perché le altezze delle note che stiamo per
   prenotare devono venire dal campo aggiornato; il ricambio viene per ultimo
   perché l'orizzonte che consulta dev'essere quello vero, già alzato dalla
   prenotazione.
============================================================================= */

const PASSO_MS = 25;
const LOOKAHEAD_VISIBILE = 0.15;
const LOOKAHEAD_NASCOSTA = 3.0;
const LOOKAHEAD_MAX = 12.0;

let ctx = null;
let banco = null;
let running = false;
let frasiOn = true;
let tessutiOn = true;
let timer = null;
let ultimoGiro = 0;
let sospensione = null;

/* Quali timbri suonano le due classi. */
let timbroFrasi = "legno";
let timbroTessuti = "bordone";

/* La memoria per il disegno: gli ultimi trenta secondi di gocce. Si chiama
   così e non `history` perché quello ombreggerebbe window.history. */
const FASCIA_SEC = 30;
const storiaGocce = [];

/* Gli inviluppi dei tessuti prenotati e non ancora finiti. Non è una lista di
   voci: è la lista delle FORME, con i loro tempi assoluti. Serve alla
   compensazione qui sotto, che ha bisogno di sapere quanto vale la somma degli
   inviluppi in un istante — non quante voci ci sono. */
const tenuteAperte = [];

/* ------------------------------------------------------------ la prenotazione
   Generica: prende la lista delle linee, come si ricostruisce il piano e come
   si suona un evento. Le due classi differiscono per come suonano, non per
   come vengono collocate nel tempo — e due copie dello scheduler
   divergerebbero al primo ritocco. */
function prenota(lista, ricostruisci, suona, now, orizzonte, attiva) {
  for (const L of lista) {
    let guardia = 0;
    while (guardia++ < 300) {
      if (L.idx >= L.plan.length) {
        L.cycleStart += L.period;
        L.period = L.target;               // la durata nuova entra al giro dopo
        L.cycles.push({ start: L.cycleStart, period: L.period });
        if (L.cycles.length > 8) L.cycles.shift();
        ricostruisci(L);
        L.idx = 0;
        if (L.cycleStart > orizzonte) break;
      }
      const p = L.plan[L.idx];
      if (!p) break;
      const t = L.cycleStart + p.ph * L.period;
      if (t >= orizzonte) break;

      // Quattro condizioni, tutte necessarie.
      //  · t >= now − 0.25 : una nota in ritardo di meno di un quarto di
      //    secondo si suona subito; più vecchia di così si lascia cadere,
      //    invece di rovesciarne un mucchio tutte insieme al risveglio.
      //  · t − flash > period/2 : il periodo refrattario. Lo stesso evento non
      //    può riscattare entro mezzo giro. Difende da due strade di doppio
      //    scatto già viste: una fase ricalcolata che riporta oltre l'orizzonte
      //    una goccia già emessa, e una goccia di fine giro che si avvolge
      //    sulla testa del giro successivo.
      if (attiva && !L.muted && t >= now - 0.25 && t - p.ev.flash > L.period * 0.5) {
        suona(Math.max(t, now), p.ev, L);
      }
      L.idx++;                             // consuma l'indice anche se muta
    }
  }
}

/* --------------------------------------------------------------- le sorgenti */
function suonaGoccia(at, ev, L) {
  const freq = altezza(ev.rel, effG.registro / 100);
  suonaTimbro(timbroFrasi, {
    ctx, when: at, freq, vel: ev.vel,
    pan: clamp(L.pan + (Math.random() * 2 - 1) * 0.18, -1, 1),
    dest: banco.canali.frasi.ingresso,
    F: FORMA,
  });
  ev.flash = at;
  storiaGocce.push({ t: at, linea: L.i, rel: ev.rel });
}

function suonaTenuta(at, ev, L) {
  const freq = altezza(ev.rel, effGT.registro / 100);
  const dur = durataTenuta(L, ev);
  const e = suonaTessuto(timbroTessuti, {
    ctx, when: at, dur, freq, vel: ev.vel,
    // Lo scarto casuale del panorama è metà di quello delle gocce: una goccia
    // è un punto e può stare dove vuole, un tessuto è una superficie e se si
    // sposta da un giro all'altro lo sfondo scivola.
    pan: clamp(L.pan + (Math.random() * 2 - 1) * 0.12, -1, 1),
    dest: banco.canali.tessuti.ingresso,
    F: FORMA_T,
  });
  ev.flash = at;
  ev.fino = at + dur;              // finché dura, il ricambio non la tocca
  tenuteAperte.push(e);
}

/* ------------------------------------------------- la somma dei tessuti
   Quattro tessuti che suonano insieme non fanno quattro volte il livello di
   uno: sono sorgenti incoerenti, e sorgenti incoerenti si sommano in POTENZA.
   N voci uguali danno √N di ampiezza, quindi per tenere fermo il bus si divide
   per √N. Fin qui è aritmetica.

   IL PUNTO È CHE COSA SI METTE SOTTO LA RADICE, e non è un conteggio di teste.
   Un tessuto ci mette secondi ad aprirsi. Contando le teste, il bus
   scenderebbe di 3 dB NELL'ISTANTE in cui una quinta voce comincia ad aprirsi
   — cioè mentre quella voce è ancora del tutto inudibile: si sentirebbe
   l'intera trama abbassarsi per far posto a qualcosa che non c'è ancora, un
   buco che precede il suono. Sotto la radice va la somma degli INVILUPPI, che
   sale al ritmo con cui sale l'energia vera.

   È possibile solo perché gli inviluppi sono noti in anticipo e in forma
   chiusa: `finestra()` in tessuti.js è la stessa funzione che scrive
   l'automazione dell'audio. Misurare il bus con un analizzatore darebbe lo
   stesso numero ma in ritardo — e inseguire una somma che si muove vuol dire
   arrivare sempre dopo.

   Si guarda avanti di una costante di tempo, così l'inseguimento arriva in
   pari invece che in ritardo di quella stessa costante. */
const ANTICIPO = 0.12;
let sommaTessuti = 0;        // le voci equivalenti aperte, per la lettura
let compensazione = 1;

function compensaTessuti(now) {
  for (let k = tenuteAperte.length - 1; k >= 0; k--) {
    if (tenuteAperte[k].t1 < now - 0.5) tenuteAperte.splice(k, 1);
  }
  const t = now + ANTICIPO;
  let somma = 0;
  for (const e of tenuteAperte) somma += e.amp * finestra(t, e);
  sommaTessuti = somma;
  compensazione = somma > 1 ? 1 / Math.sqrt(somma) : 1;
  banco.normalizza("tessuti", compensazione, now);
}

/* ------------------------------------------------------------------ il passo */
function passo(now, nascosta) {
  if (nascosta) {
    // La finestra insegue il ritardo MISURATO invece di indovinarlo: a schermo
    // bloccato i giri si diradano davvero, e una finestra fissa perderebbe le
    // note che cadono nel buco.
    const ritardo = now - ultimoGiro;
    LOOKAHEAD = clamp(ritardo * 2.5, LOOKAHEAD_NASCOSTA, LOOKAHEAD_MAX);
  }
  ultimoGiro = now;

  avanzaDeriva(now);

  const orizzonte = now + LOOKAHEAD;
  if (orizzonte > bookedUntil) bookedUntil = orizzonte;   // monòtono: invecchia da sé

  while (storiaGocce.length && storiaGocce[0].t < now - FASCIA_SEC) storiaGocce.shift();

  prenota(frasi,   costruisciPiano, suonaGoccia, now, orizzonte, frasiOn);
  prenota(tessuti, costruisciTrama, suonaTenuta, now, orizzonte, tessutiOn);

  compensaTessuti(now);

  for (const L of frasi) {
    if (now < L.prossimoRicambio) continue;
    if (ricambia(L, now)) {
      // ±15 % di scarto: due linee con periodi vicini non devono rinnovarsi
      // in cadenza.
      L.prossimoRicambio = now + TEMPI_RICAMBIO[L.i] * (0.85 + Math.random() * 0.3);
    }
  }
  for (const L of tessuti) {
    if (now < L.prossimoRicambio) continue;
    if (ricambiaTessuto(L, now)) {
      L.prossimoRicambio = now + TEMPI_RICAMBIO_T[L.i] * (0.85 + Math.random() * 0.3);
    }
  }
}

/* ----------------------------------------------------------- l'assemblaggio */
function costruisciMotore() {
  if (ctx) return;
  try {
    // latencyHint "playback": di suo un AudioContext è tarato per strumenti
    // suonati dal vivo — buffer da 256 campioni, 5,8 ms — e su un telefono
    // modesto non ce la fa; ogni buffer mancato è un raschio. Qui non si
    // risponde a nessun gesto in tempo reale, le gocce sono prenotate secondi
    // prima, quindi il ritardo d'uscita non si percepisce e il buffer sale a
    // 1024 campioni: quattro volte il margine.
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "playback" });
  } catch (e) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  banco = costruisciBanco(ctx, ["frasi", "tessuti", "voci", "grani"]);
  tara(banco);

  avvia(ctx.currentTime);

  if (!timer) timer = setInterval(() => {
    if (!ctx || !running) return;
    passo(ctx.currentTime, document.hidden);
  }, PASSO_MS);

  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    LOOKAHEAD = document.hidden ? LOOKAHEAD_NASCOSTA : LOOKAHEAD_VISIBILE;
    if (!document.hidden && running) passo(ctx.currentTime, false);
  });
}

/* Le linee non partono tutte insieme: entrano scaglionate, altrimenti il primo
   secondo è un accordo e non un collage. E cycleStart si arretra della fase
   del primo evento, così è la NOTA a cadere quando deve, non l'origine del
   giro.

   I tessuti entrano prima delle gocce e più larghi. Un tenuto ci mette secondi
   ad arrivare, quindi partire insieme alle gocce vorrebbe dire aprire su
   quattro punti sospesi nel vuoto; entrando prima, quando la prima goccia cade
   c'è già qualcosa sotto. */
/* AVVIA VUOL DIRE «IL TEMPO COMINCIA QUI», e va detto anche agli eventi.
   Ogni evento ricorda quando ha suonato l'ultima volta — `flash` per il periodo
   refrattario, `fino` per proteggere una tenuta in corso dal ricambio — e
   quei due campi sono TEMPI ASSOLUTI. Se il tempo riparte da zero, come
   succede a ogni rendering fuori tempo reale, quelle memorie restano nel
   futuro: il periodo refrattario legge `t − flash` negativo e SALTA la nota,
   in silenzio, consumandone l'indice.

   Misurato: senza queste due righe una esportazione fatta dopo un ascolto
   restava senza tessuti per i primi ventun secondi — esattamente il tempo che
   serviva al tempo virtuale per superare le memorie lasciate dal render
   precedente. Le gocce lo mascheravano perché si rinnovano in fretta.

   È anche un sintomo del punto già aperto in CLAUDE.md: il render percorre lo
   stesso modello che sta suonando. Finché sarà così, «avvia» deve azzerare
   tutto ciò che è un tempo assoluto. */
function azzeraMemoria(L) {
  for (const ev of L.idea) {
    ev.flash = -99;
    if ("fino" in ev) ev.fino = -99;
  }
}

function avvia(now) {
  bookedUntil = 0;
  tenuteAperte.length = 0;
  frasi.forEach(azzeraMemoria);
  tessuti.forEach(azzeraMemoria);
  frasi.forEach((L, i) => {
    const entrata = 0.2 + i * 0.28 + Math.random() * 0.25;
    const primaFase = L.plan.length ? L.plan[0].ph : 0;
    L.cycleStart = now + entrata - primaFase * L.period;
    L.idx = 0;
    L.cycles = [{ start: L.cycleStart, period: L.period }];
    L.prossimoRicambio = now + TEMPI_RICAMBIO[i] * (0.3 + Math.random() * 0.7);
  });
  tessuti.forEach((L, i) => {
    const entrata = 0.05 + i * 0.9 + Math.random() * 0.6;
    const primaFase = L.plan.length ? L.plan[0].ph : 0;
    L.cycleStart = now + entrata - primaFase * L.period;
    L.idx = 0;
    L.cycles = [{ start: L.cycleStart, period: L.period }];
    L.prossimoRicambio = now + TEMPI_RICAMBIO_T[i] * (0.3 + Math.random() * 0.7);
  });
}

/* La taratura d'esordio dei canali. Sta in una funzione sola perché il motore
   dal vivo e il rendering fuori tempo reale devono partire dallo stesso punto:
   due copie di questi numeri vorrebbero dire un'esportazione che non suona
   come quello che si è ascoltato. */
function tara(b) {
  b.livello("frasi", -4);
  b.spazio("frasi", 0.35);
  b.livello("tessuti", -7);
  b.spazio("tessuti", 0.55);
}

async function accendi(acceso) {
  costruisciMotore();
  if (acceso) {
    clearTimeout(sospensione);
    if (ctx.state === "suspended") await ctx.resume();
    running = true;
    // Su iOS WebKit considera un AudioContext «suono d'ambiente» e lo sospende
    // a schermo bloccato: dichiararsi «playback» è la categoria della
    // riproduzione lunga. Va riaffermato a ogni ripresa.
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
    banco.uscita.gain.setTargetAtTime(0.9, ctx.currentTime, 0.4);
  } else {
    running = false;
    banco.uscita.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    sospensione = setTimeout(() => {
      if (!running && ctx.state === "running") ctx.suspend();
    }, 900);
  }
}

/* ============================================================ l'esportazione
   Lo stesso motore, percorso più in fretta del tempo reale. Non è una
   simulazione: sono gli stessi nodi, lo stesso scheduler, le stesse tarature.
   L'unica differenza è chi chiama `passo`.

   Con un OfflineAudioContext tutto va prenotato PRIMA di startRendering, e
   questo funziona solo perché ogni nota è collocata su un tempo assoluto: si
   percorre l'intero brano con la finestra spalancata e poi si rende. */
async function rendiOffline(secondi, sampleRate = 48000) {
  const salvato = { ctx, banco, running, LOOKAHEAD, bookedUntil };

  ctx = new OfflineAudioContext(2, Math.ceil(secondi * sampleRate), sampleRate);
  banco = costruisciBanco(ctx, ["frasi", "tessuti", "voci", "grani"]);
  tara(banco);
  banco.uscita.gain.value = 0.9;

  bookedUntil = 0;
  LOOKAHEAD = 0.4;
  ultimoGiro = 0;
  avvia(0);
  for (let t = 0; t < secondi; t += 0.05) passo(t, false);

  const reso = await ctx.startRendering();

  ctx = salvato.ctx; banco = salvato.banco; running = salvato.running;
  LOOKAHEAD = salvato.LOOKAHEAD; bookedUntil = salvato.bookedUntil;
  return reso;
}
