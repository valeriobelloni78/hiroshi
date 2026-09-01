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
let timer = null;
let ultimoGiro = 0;
let sospensione = null;

/* Quale timbro suonano le gocce, e con quale forma. */
let timbroFrasi = "legno";

/* La memoria per il disegno: gli ultimi trenta secondi di gocce. Si chiama
   così e non `history` perché quello ombreggerebbe window.history. */
const FASCIA_SEC = 30;
const storiaGocce = [];

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

  prenota(frasi, costruisciPiano, suonaGoccia, now, orizzonte, frasiOn);

  for (const L of frasi) {
    if (now < L.prossimoRicambio) continue;
    if (ricambia(L, now)) {
      // ±15 % di scarto: due linee con periodi vicini non devono rinnovarsi
      // in cadenza.
      L.prossimoRicambio = now + TEMPI_RICAMBIO[L.i] * (0.85 + Math.random() * 0.3);
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
  banco.livello("frasi", -4);
  banco.spazio("frasi", 0.35);

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
   della prima goccia, così è la NOTA a cadere quando deve, non l'origine del
   giro. */
function avvia(now) {
  bookedUntil = 0;
  frasi.forEach((L, i) => {
    const entrata = 0.2 + i * 0.28 + Math.random() * 0.25;
    const primaFase = L.plan.length ? L.plan[0].ph : 0;
    L.cycleStart = now + entrata - primaFase * L.period;
    L.idx = 0;
    L.cycles = [{ start: L.cycleStart, period: L.period }];
    L.prossimoRicambio = now + TEMPI_RICAMBIO[i] * (0.3 + Math.random() * 0.7);
  });
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
  banco.livello("frasi", -4);
  banco.spazio("frasi", 0.35);
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
