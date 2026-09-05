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
let paesaggioOn = true;
let timer = null;
let ultimoGiro = 0;
let sospensione = null;

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
    F: formaGocce(effG.calore),
  });
  ev.flash = at;
  storiaGocce.push({ t: at, linea: L.i, rel: ev.rel });
}

function suonaTenuta(at, ev, L) {
  const dur = durataTenuta(L, ev);
  /* Una tenuta che arriva oltre il prossimo passo di quinta sceglie un grado
     che sopravvive al passo: la ragione per esteso sta accanto ad
     `altezzaCheResta` in `deriva.js`. Il conto si fa qui e non là perché solo
     qui si sa quanto durerà questa nota. */
  const freq = at + dur > prossimaQuinta
    ? altezzaCheResta(ev.rel, effGT.registro / 100)
    : altezza(ev.rel, effGT.registro / 100);
  const e = suonaTessuto(timbroTessuti, {
    ctx, when: at, dur, freq, vel: ev.vel,
    // Lo scarto casuale del panorama è metà di quello delle gocce: una goccia
    // è un punto e può stare dove vuole, un tessuto è una superficie e se si
    // sposta da un giro all'altro lo sfondo scivola.
    pan: clamp(L.pan + (Math.random() * 2 - 1) * 0.12, -1, 1),
    dest: banco.canali.tessuti.ingresso,
    F: formaTessuti(),
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

/* La stessa compensazione dei tessuti, applicata a una somma che qui si CONOSCE
   invece di doverla sommare: quanti strati suonano insieme è la sovrapposizione
   del velo, e quella è una costante. Senza dividere per √N, allargare la
   finestra vorrebbe dire alzare il volume invece di distendere il suono. */
let compensaPaesaggioValore = 1;
function compensaPaesaggio(now) {
  compensaPaesaggioValore = 1 / Math.sqrt(sovrapposizionePaesaggio());
  banco.normalizza("paesaggio", compensaPaesaggioValore, now);
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
  // Quanto tempo è passato davvero dal giro precedente. Serve alla testa di
  // lettura del paesaggio, che è un accumulatore: dal vivo i giri sono a 25 ms,
  // fuori tempo reale a 50, e la testa deve percorrere la stessa strada nei
  // due casi. Il tetto a mezzo secondo difende dal primo giro e dai risvegli.
  const dt = clamp(now - ultimoGiro, 0, 0.5);
  ultimoGiro = now;

  avanzaDeriva(now);

  // I VALORI EFFICACI SI CALCOLANO QUI, non nel ciclo del disegno. Il disegno
  // gira solo quando c'è uno schermo davanti; il rendering fuori tempo reale
  // non ne ha nessuno, e finché questo conto stava là un'esportazione usciva
  // con i parametri congelati sull'ultimo fotogramma disegnato — la deriva
  // avanzava e nessuno la ascoltava.
  effettiviFrasi();
  effettiviTessuti();
  effettiviPaesaggio();
  avanzaTesta(dt);
  applicaEfficaci(now);
  // Dal vivo con la dissolvenza: l'unico modo perché la scelta cambi qui è che
  // qualcuno abbia girato la tendina, e fuori tempo reale la tendina non c'è.
  applicaInserti(now, true);

  const orizzonte = now + LOOKAHEAD;
  if (orizzonte > bookedUntil) bookedUntil = orizzonte;   // monòtono: invecchia da sé

  while (storiaGocce.length && storiaGocce[0].t < now - FASCIA_SEC) storiaGocce.shift();

  prenota(frasi,   costruisciPiano, suonaGoccia, now, orizzonte, frasiOn);
  prenota(tessuti, costruisciTrama, suonaTenuta, now, orizzonte, tessutiOn);

  contestoPaesaggio(ctx);
  prenotaVelo(now, orizzonte, paesaggioOn, banco.canali.paesaggio.ingresso);

  compensaTessuti(now);
  compensaPaesaggio(now);

  // IL RINNOVO AL PASSO DI QUINTA: la scala grossa del ricambio. Quello fine
  // sostituisce una goccia per volta e non si nota mai; questo rifà tutte e
  // quattro le idee di una classe, e arriva insieme al cambio di collezione —
  // cioè si nasconde dentro il solo momento in cui la luce cambia comunque.
  // L'indice va riposizionato subito dopo: `rigenera` lo azzera, e senza
  // questo passaggio le note già prenotate si sentirebbero due volte.
  if (quintaScattata()) {
    const orizzonteQ = orizzonteSicuro(now);
    if (MODI.gocce === "deriva")
      frasi.forEach((L) => { rigenera(L); riposizionaIdx(L, orizzonteQ); });
    if (MODI.tessuti === "deriva")
      tessuti.forEach((L) => { rigeneraTrama(L); riposizionaIdx(L, orizzonteQ); });
  }

  if (MODI.gocce === "deriva") for (const L of frasi) {
    if (now < L.prossimoRicambio) continue;
    if (ricambia(L, now)) {
      // ±15 % di scarto: due linee con periodi vicini non devono rinnovarsi
      // in cadenza.
      L.prossimoRicambio = now + TEMPI_RICAMBIO[L.i] * (0.85 + Math.random() * 0.3);
    }
  }
  if (MODI.tessuti === "deriva") for (const L of tessuti) {
    if (now < L.prossimoRicambio) continue;
    if (ricambiaTessuto(L, now)) {
      L.prossimoRicambio = now + TEMPI_RICAMBIO_T[L.i] * (0.85 + Math.random() * 0.3);
    }
  }
}

/* I valori efficaci che vanno al banco. Si riscrivono solo quando si sono
   mossi abbastanza da sentirsi: `setTargetAtTime` a ogni passo su quattro
   parametri farebbe quaranta eventi d'automazione al secondo per niente, e
   fuori tempo reale li farebbe tutti in una volta. */
/* Il paesaggio non compare qui: la sua mandata alla stanza dello studio resta
   a zero, perché la sua stanza se la porta dietro. È l'unica sorgente che non
   ha uno «spazio», e la ragione sta in cima a `paesaggio.js`. */
const ultimo = { spazio: -1, colore: -1, livello: -1, tSpazio: -1 };
function applicaEfficaci(now) {
  if (!banco) return;
  if (Math.abs(effG.spazio - ultimo.spazio) > 0.5) {
    ultimo.spazio = effG.spazio;
    banco.spazio("frasi", effG.spazio / 100);
  }
  if (Math.abs(effG.colore - ultimo.colore) > 20) {
    ultimo.colore = effG.colore;
    banco.colore(effG.colore, now);
  }
  if (Math.abs(effGT.spazio - ultimo.tSpazio) > 0.5) {
    ultimo.tSpazio = effGT.spazio;
    banco.spazio("tessuti", effGT.spazio / 100);
  }
  if (Math.abs(effGT.livello - ultimo.livello) > 0.3) {
    ultimo.livello = effGT.livello;
    // 32 è il livello d'esordio, e a 32 il canale sta a −7 dB: la scala di
    // Rada (8÷60) diventa una scala in decibel senza spostare il punto zero.
    // Lo scostamento dell'asta del mixer si somma qui, in decibel.
    banco.livello("tessuti", LIVELLI.tessuti + 20 * Math.log10(effGT.livello / 32) - 7);
  }
}

/* ------------------------------------------------------------- gli inserti
   Le tre manopole di un inserto NON passano per `effG`, e non è una
   dimenticanza: `effG` esiste perché fra il cursore e il suono ci sono la
   deriva, l'ora e la stagione, e su queste tre non c'è nessuna di quelle
   influenze. Un parametro pende da una cosa sola; questi pendono dalla mano, e
   `G` è già il valore lisciato da `battito()`.

   Il confronto con l'ultima terna si fa sui NUMERI DELLA MANOPOLA, in 0÷100,
   non su quelli convertiti: mezzo punto di manopola vuol dire la stessa cosa
   per tutti e quattro gli effetti, mentre mezzo hertz e mezzo millesimo di
   secondo no. */
const INSERTI = [
  { canale: "frasi",   classe: "gocce",   chiavi: ["gE1", "gE2", "gE3"] },
  { canale: "tessuti", classe: "tessuti", chiavi: ["tE1", "tE2", "tE3"] },
];
const ultimoInserto = {
  frasi:   { quale: null, p: [-1, -1, -1] },
  tessuti: { quale: null, p: [-1, -1, -1] },
};

function applicaInserti(now, dissolvi) {
  if (!banco) return;
  for (const s of INSERTI) {
    const quale = EFFETTI[EFFETTO[s.classe]] ? EFFETTO[s.classe] : "niente";
    const u = ultimoInserto[s.canale];
    const spec = EFFETTI[quale].param;
    const manopole = s.chiavi.map((k) => G[k]);
    const reali = spec.map((par, i) => par.da(manopole[i]));
    if (u.quale !== quale) {
      u.quale = quale;
      u.p = manopole;
      banco.inserto(s.canale, quale, reali, dissolvi);
      continue;
    }
    if (!spec.length) continue;
    if (manopole.every((x, i) => Math.abs(x - u.p[i]) < 0.5)) continue;
    u.p = manopole;
    banco.parametriInserto(s.canale, reali, now);
  }
}

/* Rimette in discussione i valori con cui `applicaEfficaci` decide se vale la
   pena riscrivere l'automazione. Serve a chi cambia una taratura dal mixer: il
   modello non si è mosso, ma il numero che finisce nel banco sì. */
function rileggiTarature() {
  ultimo.spazio = ultimo.colore = ultimo.livello = ultimo.tSpazio = -1;
  // Solo la terna, non la scelta: azzerare anche `quale` rimonterebbe
  // l'effetto — con la sua dissolvenza — perché qualcuno ha mosso un'asta del
  // mixer.
  for (const k in ultimoInserto) ultimoInserto[k].p = [-1, -1, -1];
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
  banco = costruisciBanco(ctx, ["frasi", "tessuti", "voci", "paesaggio"]);
  tara();

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
  prossimoVelo = now;
  veliEmessi = 0;
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

/* I livelli del banco e le otto bande, in dB. Stanno QUI e non dentro il banco
   perché `tara()` li rilegge a ogni costruzione — dal vivo e dentro un
   rendering fuori tempo reale — e il banco del render è un banco nuovo, che
   nasce piatto. Scritti nel banco e basta, un'esportazione uscirebbe con le
   tarature d'esordio invece che con quelle che si stanno ascoltando: cioè con
   un mixer diverso da quello che si è appena regolato.

   IL CANALE DEI TESSUTI HA DUE MANI SOPRA, e sono due cose diverse. `tLivello`
   è un parametro del MODELLO — quanto lo sfondo sta sotto al primo piano — e la
   deriva lo muove, un mood lo riscrive, la corona lo mostra. `LIVELLI.tessuti`
   è l'asta del MIXER, cioè una decisione di missaggio come quella delle frasi o
   del paesaggio. Il guadagno del canale è la loro SOMMA: l'asta scosta, il modello
   respira. Sono due cose che si moltiplicano sullo stesso bus e vanno tenute
   separate lo stesso, perché un mood deve poter scrivere il carattere senza
   spostare il missaggio, e viceversa. */
const LIVELLI = { frasi: -4, tessuti: 0, voci: -12, paesaggio: -6, uscita: -0.9 };
const EQ_DB = [0, 0, 0, 0, 0, 0, 0, 0];

/* La taratura d'esordio dei canali. Sta in una funzione sola perché il motore
   dal vivo e il rendering fuori tempo reale devono partire dallo stesso punto:
   due copie di questi numeri vorrebbero dire un'esportazione che non suona
   come quello che si è ascoltato. */
function tara() {
  banco.livello("frasi", LIVELLI.frasi);
  banco.livello("voci", LIVELLI.voci);
  banco.livello("paesaggio", LIVELLI.paesaggio);
  EQ_DB.forEach((dB, i) => banco.banda(i, dB));
  ultimo.spazio = ultimo.colore = ultimo.livello = ultimo.tSpazio = -1;
  // Il banco è NUOVO e non ha nessun inserto montato: `quale` torna a null
  // perché la scelta va rifatta valere su questi nodi, non su quelli di prima.
  // Senza dissolvenza — vedi `inserto()` in `banco.js`.
  for (const k in ultimoInserto) ultimoInserto[k] = { quale: null, p: [-1, -1, -1] };
  effettiviFrasi();
  effettiviTessuti();
  effettiviPaesaggio();
  applicaEfficaci(ctx.currentTime);
  applicaInserti(ctx.currentTime, false);
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
    banco.uscita.gain.setTargetAtTime(Math.pow(10, LIVELLI.uscita / 20), ctx.currentTime, 0.4);
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
/* ------------------------------------------------- l'istantanea del modello
   `rendiOffline` percorre LO STESSO MODELLO che sta suonando, e lo percorre
   ripartendo da zero: `avvia(0)` riporta l'origine dei giri a zero, la deriva
   ricomincia il suo cammino, la testa del paesaggio torna dov'era. Fatto mentre si
   ascolta, questo scardinerebbe la sessione in corso — i giri si troverebbero
   con l'origine centinaia di secondi nel passato e lo scheduler ne rincorrerebbe
   il recupero.

   La strada giusta sarebbe dare al render un modello suo, e resta scritta fra
   i punti aperti. Ma finché non c'è, si fa la cosa che costa venti righe e
   risolve il problema vero: si fotografa lo stato prima e si rimette dopo. La
   fotografia deve comprendere anche le variabili della DERIVA — passo di
   quinta, contatori, valori correnti — che sono in un altro file e che nessuno
   penserebbe di salvare: sono proprio quelle che, dimenticate, farebbero
   ripartire l'armonia da un'altra parte a metà ascolto.

   `idea` si copia evento per evento perché il render li rigenera: tenerne il
   riferimento vorrebbe dire rimettere a posto degli oggetti che nel frattempo
   sono stati riscritti. I piani non si salvano — si ricostruiscono, che è più
   corto e non può divergere. */
function istantaneaLinea(L) {
  return {
    period: L.period, target: L.target, cycleStart: L.cycleStart, idx: L.idx,
    cycles: L.cycles.map((c) => ({ ...c })),
    idea: L.idea.map((e) => ({ ...e })),
    planHead: L.planHead, offset: L.offset, muted: L.muted,
    prossimoRicambio: L.prossimoRicambio,
  };
}

function istantaneaModello() {
  return {
    frasi: frasi.map(istantaneaLinea),
    tessuti: tessuti.map(istantaneaLinea),
    deriva: { ...deriva },
    quinta, passiQuinta, passoN, prossimaQuinta, ultimaQuinta,
    bookedUntil, LOOKAHEAD, ultimoGiro,
    prossimoVelo, veliEmessi, testaOra,
    tenute: tenuteAperte.slice(),
    storia: storiaGocce.slice(),
  };
}

function ripristinaModello(s) {
  const rimetti = (L, d, costruisci) => {
    L.period = d.period; L.target = d.target; L.cycleStart = d.cycleStart;
    L.cycles = d.cycles; L.idea = d.idea; L.planHead = d.planHead;
    L.offset = d.offset; L.muted = d.muted; L.prossimoRicambio = d.prossimoRicambio;
    costruisci(L);
    L.idx = d.idx;                       // dopo il piano, che altrimenti lo azzera
  };
  frasi.forEach((L, i) => rimetti(L, s.frasi[i], costruisciPiano));
  tessuti.forEach((L, i) => rimetti(L, s.tessuti[i], costruisciTrama));

  Object.assign(deriva, s.deriva);
  quinta = s.quinta; passiQuinta = s.passiQuinta; passoN = s.passoN;
  prossimaQuinta = s.prossimaQuinta; ultimaQuinta = s.ultimaQuinta;
  costruisciCampo();                     // la scala dipende dalla quinta rimessa

  bookedUntil = s.bookedUntil; LOOKAHEAD = s.LOOKAHEAD; ultimoGiro = s.ultimoGiro;
  prossimoVelo = s.prossimoVelo; veliEmessi = s.veliEmessi; testaOra = s.testaOra;
  tenuteAperte.length = 0; for (const e of s.tenute) tenuteAperte.push(e);
  storiaGocce.length = 0; for (const g of s.storia) storiaGocce.push(g);
}

let ultimoRender = null;      // che cosa conteneva l'ultima esportazione

async function rendiOffline(secondi, sampleRate = 48000) {
  const salvato = { ctx, banco, running, LOOKAHEAD, bookedUntil };
  const modello = istantaneaModello();

  ctx = new OfflineAudioContext(2, Math.ceil(secondi * sampleRate), sampleRate);
  banco = costruisciBanco(ctx, ["frasi", "tessuti", "voci", "paesaggio"]);
  tara();
  banco.uscita.gain.value = Math.pow(10, LIVELLI.uscita / 20);

  bookedUntil = 0;
  LOOKAHEAD = 0.4;
  ultimoGiro = 0;
  avvia(0);
  for (let t = 0; t < secondi; t += 0.05) passo(t, false);

  const reso = await ctx.startRendering();
  // Quello che il render ha prodotto va letto PRIMA di rimettere a posto il
  // modello: i contatori sono stato della sessione, e il ripristino li riporta
  // dov'erano — che è giusto, ma vuol dire che dopo non si sa più niente di
  // quello che è appena stato reso.
  ultimoRender = { secondi, veli: veliEmessi, gocce: storiaGocce.length };

  ctx = salvato.ctx; banco = salvato.banco; running = salvato.running;
  LOOKAHEAD = salvato.LOOKAHEAD; bookedUntil = salvato.bookedUntil;
  ripristinaModello(modello);
  // I bersagli del banco vivo sono rimasti quelli di prima, ma i valori con
  // cui `applicaEfficaci` li confronta sono stati riscritti dal render: senza
  // azzerarli, il primo passo dal vivo non riscriverebbe niente e il banco
  // resterebbe con lo spazio e il colore dell'esportazione.
  ultimo.spazio = ultimo.colore = ultimo.livello = ultimo.tSpazio = -1;
  for (const k in ultimoInserto) ultimoInserto[k].p = [-1, -1, -1];
  return reso;
}
