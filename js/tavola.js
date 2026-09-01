/* =============================================================================
   HIROSHI · tavola.js — i comandi, per ora quelli minimi

   Provvisorio: qui ci sarà la tavola disegnata — i due quadranti, le corone,
   il banco, la fascia dei grani, la deriva. Finché il motore non è completo,
   questo file esiste solo per poterlo ascoltare e per vedere che cosa esce
   davvero dall'uscita.

   Una regola che vale già da adesso: i comandi sono elementi HTML nativi, e
   funzionano identici col puntatore, col dito, col tasto Tab e con un lettore
   di schermo. Il disegno, quando arriverà, sarà puro display: non ascolterà
   nulla. Nel canvas di Rada questa scelta è costata fatica ed è quella giusta.

   LE ETICHETTE DICONO L'AZIONE, NON LO STATO — «Pausa», non «In ascolto». Lo
   stato lo racconta la riga in alto e il punto che pulsa.
============================================================================= */

const NOMI_TIMBRI = {
  vetro: "Vetro", legno: "Legno", onda: "Onda", soffio: "Soffio",
  corda: "Corda", metallo: "Metallo", canna: "Canna", sabbia: "Sabbia",
};
const NOMI_TESSUTI = {
  bordone: "Bordone", marea: "Marea", attrito: "Attrito", frangia: "Frangia",
  corrente: "Corrente", cavo: "Cavo", brina: "Brina", soglia: "Soglia",
};
const NOMI_MOOD = {
  sereno: "Sereno", pioggia: "Pioggia", vespro: "Vespro", carillon: "Carillon",
  arcipelago: "Arcipelago", collina: "Collina", finestra: "Finestra", nuvola: "Nuvola",
  velo: "Velo", fondale: "Fondale", lino: "Lino", respiro: "Respiro",
  bruma: "Bruma", tenda: "Tenda", seta: "Seta", vela: "Vela",
};
const NOMI_NOTE = ["do", "do♯", "re", "mi♭", "mi", "fa", "fa♯", "sol", "la♭", "la", "si♭", "si"];

const el = (id) => document.getElementById(id);
const numero = (v, d = 0) => v.toFixed(d).replace(".", ",");

/* --------------------------------------------------------------- le tendine */
function tendina(id, chiavi, nomi, corrente, scegli) {
  const sel = el(id);
  for (const k of chiavi) {
    const o = document.createElement("option");
    o.value = k; o.textContent = nomi[k];
    if (k === corrente) o.selected = true;
    sel.appendChild(o);
  }
  sel.addEventListener("change", () => scegli(sel.value));
  return sel;
}

const selTimbro  = tendina("timbro",  TIMBRI,  NOMI_TIMBRI,  timbroFrasi,   (v) => { timbroFrasi = v; });
// Il tessuto scelto vale per le TENUTE CHE NASCONO DA ORA: quelle già aperte
// arrivano in fondo con la loro voce. Cambiare timbro a un suono che dura
// quaranta secondi vorrebbe dire sentirlo mutare a metà, che è un taglio.
const selTessuto = tendina("tessuto", TESSUTI, NOMI_TESSUTI, timbroTessuti, (v) => { timbroTessuti = v; });

tendina("modoGocce",   ["deriva", "ancora"], { deriva: "deriva", ancora: "ancora" },
        MODI.gocce,   (v) => { MODI.gocce = v; });
tendina("modoTessuti", ["deriva", "ancora"], { deriva: "deriva", ancora: "ancora" },
        MODI.tessuti, (v) => { MODI.tessuti = v; });

/* ------------------------------------------------------------------ i mood
   Un mood scrive su G e su GT insieme, quindi dopo averlo applicato bisogna
   rimettere in pari i cursori e le loro targhe: altrimenti l'interfaccia
   racconta lo stato di prima. */
tendina("moodGocce", Object.keys(MOOD_GOCCE), NOMI_MOOD, null, (v) => {
  applicaMoodGocce(v);
  selTimbro.value = timbroFrasi;
  allinea();
  aggiornaLinee();
});
tendina("moodTessuti", Object.keys(MOOD_TESSUTI), NOMI_MOOD, null, (v) => {
  applicaMoodTessuti(v);
  selTessuto.value = timbroTessuti;
  allinea();
  aggiornaLinee();
});

/* ------------------------------------------------------------ l'accensione */
const btn = el("ascolto");
let acceso = false;
btn.addEventListener("click", async () => {
  acceso = !acceso;
  await accendi(acceso);
  btn.textContent = acceso ? "Pausa" : "Ascolta";
  el("stato").textContent = acceso ? "in ascolto" : "fermo";
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target === document.body) { e.preventDefault(); btn.click(); }
});

/* Le classi si accendono e si spengono da sole. Cicli e ricambio avanzano
   comunque: riaccendendo una classe non si ritrova quello che si era lasciato,
   si ritrova quello che sarebbe successo. È la promessa di Rada, ed è la
   ragione per cui spegnere una classe non è una pausa. */
el("gocceOn").addEventListener("change", (e) => { frasiOn = e.target.checked; });
el("tessutiOn").addEventListener("change", (e) => { tessutiOn = e.target.checked; });

/* ------------------------------------------------------------------ i cursori
   Scrivono su GT, il bersaglio; G ci arriva lisciato in `battito()`. Un cursore
   che scrivesse su G farebbe uno scalino, e uno scalino su una frequenza di
   taglio si sente come un clic. Fa eccezione il mood, che è uno scatto e non un
   gesto — e infatti scrive su tutti e due. */
const CURSORI = [];
function cursore(id, chiave, scala, mostra) {
  const input = el(id), targa = el("v" + id.charAt(0).toUpperCase() + id.slice(1));
  const leggi = (v) => (scala ? v / scala : v);
  const scrivi = () => {
    const v = Number(input.value);
    targa.textContent = mostra ? mostra(leggi(v)) : v;
    GT[chiave] = leggi(v);
  };
  input.addEventListener("input", scrivi);
  CURSORI.push({ input, targa, chiave, scala, mostra });
}

/* Rimette i cursori dove il modello li ha messi. Serve dopo un mood. */
function allinea() {
  for (const c of CURSORI) {
    const v = G[c.chiave];
    c.input.value = String(Math.round(c.scala ? v * c.scala : v));
    c.targa.textContent = c.mostra ? c.mostra(v) : Math.round(v);
  }
}

const secondi = (v) => numero(v, 1) + " s";

cursore("registro",     "registro");
cursore("calore",       "calore");
cursore("densita",      "densita");
cursore("addensamento", "addensamento");
cursore("spazio",       "spazio");

cursore("tregistro", "tRegistro");
cursore("intreccio", "tIntreccio");
cursore("apertura",  "tApertura", 10, secondi);
cursore("chiusura",  "tChiusura", 10, secondi);
cursore("passo",     "tPasso");
cursore("livello",   "tLivello");
cursore("tspazio",   "tSpazio");

/* -------------------------------------------------------- i comandi per linea
   Tre per ciascuna delle otto: quanto dura il giro, se tace, e una idea nuova.

   «Silenzia» non ferma la linea: la fa tacere. Lo scheduler consuma l'indice
   comunque, quindi la fase continua a correre e riaccendendola si rientra dove
   si sarebbe stati — non dove si era rimasti. Una linea messa in pausa
   tornerebbe indietro rispetto alle altre sette, e il collage è tutto lì.

   La durata nuova entra AL GIRO DOPO (`L.target`, non `L.period`): cambiarla a
   metà giro sposterebbe tutte le note già prenotate. */
function costruisciLinee(contenitore, lista, min, max, rigenerala) {
  const box = el(contenitore);
  lista.forEach((L, i) => {
    const riga = document.createElement("div");
    riga.className = "linea";

    const targa = document.createElement("span");
    targa.className = "mn nomeLinea";
    targa.textContent = String(i + 1);

    const dur = document.createElement("input");
    dur.type = "range"; dur.min = min; dur.max = max; dur.step = 0.5;
    dur.value = L.target;
    dur.setAttribute("aria-label", "Durata del giro, linea " + (i + 1));

    const val = document.createElement("span");
    val.className = "val durata";
    val.textContent = numero(L.target, 1) + " s";

    dur.addEventListener("input", () => {
      L.target = Number(dur.value);
      val.textContent = numero(L.target, 1) + " s";
      aggiornaRiallineo();
    });

    const muto = document.createElement("button");
    muto.className = "mini";
    muto.textContent = "silenzia";
    muto.setAttribute("aria-pressed", "false");
    muto.addEventListener("click", () => {
      L.muted = !L.muted;
      muto.classList.toggle("attivo", L.muted);
      muto.setAttribute("aria-pressed", String(L.muted));
    });

    const nuova = document.createElement("button");
    nuova.className = "mini";
    nuova.textContent = "↻";
    nuova.title = "Nuova idea";
    nuova.setAttribute("aria-label", "Nuova idea, linea " + (i + 1));
    nuova.addEventListener("click", () => {
      rigenerala(L);
      if (ctx) riposizionaIdx(L, orizzonteSicuro(ctx.currentTime));
    });

    riga.append(targa, dur, val, muto, nuova);
    box.appendChild(riga);
    L._cursoreDurata = dur;
    L._targaDurata = val;
    L._pulsanteMuto = muto;
  });
}

costruisciLinee("lineeGocce",   frasi,   PERIODO_MIN, PERIODO_MAX, rigenera);
costruisciLinee("lineeTessuti", tessuti, TENUTA_MIN,  TENUTA_MAX,  rigeneraTrama);

/* Dopo un mood i periodi sono cambiati sotto le dita. */
function aggiornaLinee() {
  for (const L of frasi.concat(tessuti)) {
    if (!L._cursoreDurata) continue;
    L._cursoreDurata.value = String(L.target);
    L._targaDurata.textContent = numero(L.target, 1) + " s";
    L._pulsanteMuto.classList.toggle("attivo", L.muted);
  }
  aggiornaRiallineo();
}

/* Il riallineamento è quello di TUTTE E OTTO le linee: è il tempo prima che la
   combinazione completa ritorni, e le due classi non sono due pezzi separati.
   Con periodi lunghi il numero diventa enorme in fretta, e allora si cambia
   unità: «75.398 ore» non dice niente a nessuno, «otto anni» sì. */
function aggiornaRiallineo() {
  const s = riallineamento(frasi.concat(tessuti));
  const ore = s / 3600, giorni = ore / 24;
  el("riallineo").textContent =
    giorni >= 400 ? numero(giorni / 365, 1) + " anni"
    : ore >= 48   ? Math.round(giorni) + " giorni"
    : Math.floor(ore) + " h " + Math.round((s % 3600) / 60) + "′";
}

/* ------------------------------------------------------------- il ciclo lento
   Non è il ciclo del disegno: è quello che liscia i parametri e aggiorna le
   letture. Gira anche a motore fermo, così i cursori rispondono comunque.

   I VALORI EFFICACI NON SI CALCOLANO QUI. Stanno in `passo()`, dentro il
   motore, perché il rendering fuori tempo reale non ha nessuno schermo davanti
   e questo ciclo lì non gira: finché il conto stava qui, un'esportazione usciva
   coi parametri congelati sull'ultimo fotogramma disegnato.

   SMUSSO 0,1164 è il coefficiente 0,94 di Rada a 60 fps ricalcolato per i 30
   giri al secondo di qui: 1 − 0,94². Cambiando la cadenza va rifatto il conto,
   altrimenti la morbidezza cambia con lo schermo. */
const SMUSSO = 0.1164;
let ultimaTesta = effG.addensamento;
let ultimoIntreccio = effGT.intreccio;

/* Il cursore dice dove sta la mano; l'efficace dice che cosa sta suonando. Fra
   i due c'è la deriva, l'ora e la stagione — che è tutto il punto — quindi
   quando differiscono si mostrano tutti e due. Chi legge il cursore nudo legge
   una cosa che non è vera. */
function due(cursore, efficace, d = 0) {
  const a = numero(cursore, d);
  const b = numero(efficace, d);
  return a === b ? a : a + " → " + b;
}

function battito() {
  for (const k in GT) G[k] += (GT[k] - G[k]) * SMUSSO;
  if (!ctx) { effettiviFrasi(); effettiviTessuti(); }   // a motore fermo li fa il ciclo

  if (Math.abs(effG.addensamento - ultimaTesta) > 0.3) {
    ultimaTesta = effG.addensamento;
    ricostruisciPiani(ctx ? ctx.currentTime : null);
  }
  if (Math.abs(effGT.intreccio - ultimoIntreccio) > 1.5) {
    ultimoIntreccio = effGT.intreccio;
    ricostruisciTrame(ctx ? ctx.currentTime : null);
  }

  el("vRegistro").textContent     = due(G.registro, effG.registro);
  el("vCalore").textContent       = due(G.calore, effG.calore);
  el("vDensita").textContent      = due(G.densita, effG.densita);
  el("vAddensamento").textContent = due(G.addensamento, effG.addensamento);
  el("vSpazio").textContent       = due(G.spazio, effG.spazio);
  el("vTregistro").textContent    = due(G.tRegistro, effGT.registro);
  el("vApertura").textContent     = due(G.tApertura, effGT.apertura, 1) + " s";
  el("vChiusura").textContent     = due(G.tChiusura, effGT.chiusura, 1) + " s";
  el("vPasso").textContent        = due(G.tPasso, effGT.passo);
  el("vLivello").textContent      = due(G.tLivello, effGT.livello);

  if (banco) {
    const p = banco.picchi();
    const dB = Math.max(p[0], p[1]);
    el("picco").textContent = isFinite(dB) ? numero(dB, 1) + " dB" : "—";
    el("riduzione").textContent = numero(banco.riduzione(), 1) + " dB";
  }
  el("voci").textContent = numero(sommaTessuti, 2);
  el("compenso").textContent = numero(20 * Math.log10(compensazione), 1) + " dB";
  el("tonalita").textContent = NOMI_NOTE[tonalita()];
  el("ora").textContent = tavolozzaOraria(oraCorrente()).nome +
                          " · " + Math.round(effG.colore) + " Hz";
  el("stagione").textContent = tavolozzaStagionale(meseCorrente()).nome;

  setTimeout(battito, 33);
}

allinea();
aggiornaRiallineo();
battito();
