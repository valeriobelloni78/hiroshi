/* =============================================================================
   HIROSHI · comandi.js — le mani

   Tendine, cursori, pulsanti, e il ciclo lento che liscia i parametri e
   aggiorna le targhe. Il DISEGNO sta in `tavola.js` ed è un file a parte — non
   per lunghezza, ma perché la regola «il disegno è puro display, non ascolta
   nulla» smette di essere un commento e diventa una cosa che si vede dalla
   lista dei file: la tavola legge il modello e non registra un ascoltatore, i
   comandi toccano il modello e non disegnano un pixel.

   I COMANDI SONO ELEMENTI HTML NATIVI. Anche quelli che sulla tavola sembrano
   manopole: sotto un arco graduato c'è un `input[type=range]` trasparente steso
   sopra il disegno, che risponde al dito, al puntatore, al tasto Tab e a un
   lettore di schermo. Un quadrante disegnato che ascolta il canvas sarebbe un
   comando che nessuno può usare senza vederlo — e nel canvas di Rada questa
   scelta è già costata fatica una volta.

   LE ETICHETTE DICONO L'AZIONE, NON LO STATO — «Ascolta», non «Fermo». Lo
   stato lo racconta la spia del pulsante, la riga in fondo e la tavola.

   I dizionari dei nomi stanno qui: sono testi d'interfaccia, e la tavola li
   legge da qui — è l'unica cosa che le serve dai comandi.
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
/* Il circolo delle quinte com'è scritto sulla fascia: DO SOL RE… Ogni passo
   cambia una nota sola della pentatonica, ed è per questo che non ha un bordo
   che si senta. */
const CIRCOLO = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

const el = (id) => document.getElementById(id);
const numero = (v, d = 0) => v.toFixed(d).replace(".", ",");
const dB = (v) => (v > 0 ? "+" : "") + numero(v, 1);
const mmss = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
const minsec = (s) => Math.floor(s / 60) + "′ " + String(Math.floor(s % 60)).padStart(2, "0") + "″";

/* --------------------------------------------------------------- le tendine */
function tendina(id, chiavi, nomi, corrente, scegli) {
  const sel = el(id);
  for (const k of chiavi) {
    const o = document.createElement("option");
    o.value = k; o.textContent = nomi ? nomi[k] : k;
    if (k === corrente) o.selected = true;
    sel.appendChild(o);
  }
  sel.addEventListener("change", () => scegli(sel.value));
  return sel;
}

const selTimbro  = tendina("timbro",  TIMBRI,  NOMI_TIMBRI,  timbroFrasi,   (v) => { timbroFrasi = v; });
/* Il tessuto scelto vale per le TENUTE CHE NASCONO DA ORA: quelle già aperte
   arrivano in fondo con la loro voce. Cambiare timbro a un suono che dura
   quaranta secondi vorrebbe dire sentirlo mutare a metà, che è un taglio. */
const selTessuto = tendina("tessuto", TESSUTI, NOMI_TESSUTI, timbroTessuti, (v) => { timbroTessuti = v; });

tendina("modoGocce",   ["deriva", "ancora"], null, MODI.gocce,   (v) => { MODI.gocce = v; });
tendina("modoTessuti", ["deriva", "ancora"], null, MODI.tessuti, (v) => { MODI.tessuti = v; });

/* ------------------------------------------------------------------ i cursori
   Un cursore scrive sul BERSAGLIO `GT`, non su `G`: `G` ci arriva lisciato in
   `battito()`, e un cursore che scrivesse su `G` farebbe uno scalino — che su
   una frequenza di taglio si sente come un clic.

   Fanno eccezione i filetti della FORMA, che scrivono diretto: la forma non
   entra in nessun suono già cominciato, la legge il costruttore quando la nota
   nasce, quindi non c'è nessuno scalino da lisciare.

   `--u` è la frazione percorsa, e serve al CSS per annerire il filo dietro al
   quadratino: un filo tutto uguale non dice da che parte si sta andando. */
const CURSORI = [];

function frazione(input) {
  const a = Number(input.min), b = Number(input.max);
  return b > a ? (Number(input.value) - a) / (b - a) : 0;
}

/* LA TARGA DICE DOVE STA LA MANO, non che cosa sta suonando: legge il cursore,
   non il modello. Fra i due c'è il lisciamento di `battito()` e c'è la deriva,
   quindi leggendo `G` la targa mostrerebbe un numero che nell'istante in cui lo
   si guarda non è né quello vecchio né quello nuovo — e non tornerebbe mai in
   pari, perché si riscrive solo quando il cursore si muove. Quello che sta
   suonando lo dicono la corona e le graduazioni delle manopole, che è
   esattamente il posto giusto: due letture separate, e la distanza fra loro è
   la deriva. */
function cursore(id, targaId, def) {
  const input = el(id), targa = el(targaId);
  const mostra = () => {
    targa.textContent = def.testo(def.valore(Number(input.value)));
    input.style.setProperty("--u", frazione(input).toFixed(4));
  };
  const scrivi = () => { def.scrivi(Number(input.value)); mostra(); segnaMano(input); };
  input.addEventListener("input", scrivi);
  CURSORI.push({ input, def, mostra });
  def.scrivi(Number(input.value));
  mostra();
  return input;
}

/* «A mano»: gli ultimi filetti che qualcuno ha mosso, in fondo al foglio. Una
   tavola che si muove da sé per tre quarti ha bisogno di dire quale quarto è
   stato deciso, e questa riga è tutta la differenza fra «sta derivando» e
   «l'ho messo io lì». Il nome lo prende dall'etichetta che sta sopra al
   cursore, quindi non c'è una seconda lista di nomi da tenere in pari. */
const MANI = [];
function segnaMano(input) {
  // Il nome sta accanto al filetto o sotto la manopola: si cerca in tutti e due
  // i posti, o le due manopole di ogni classe non finirebbero mai in questa
  // riga — e sono proprio quelle che si girano di più.
  const cassa = input.closest(".filetto, .manopola");
  const et = cassa && cassa.querySelector(".fl");
  if (!et) return;
  const nome = et.textContent.trim().toLowerCase();
  const k = MANI.indexOf(nome);
  if (k >= 0) MANI.splice(k, 1);
  MANI.unshift(nome);
  if (MANI.length > 3) MANI.pop();
}

/* Rimette i cursori dove il modello li ha messi. Serve dopo un mood, che è
   l'unico gesto che scrive su tutto in una volta. */
function allinea() {
  for (const c of CURSORI) {
    if (c.def.crudo) c.input.value = String(Math.round(c.def.crudo()));
    c.mostra();
  }
  // Anche le aste del mixer: quella dei tessuti scrive un parametro del
  // modello, e un mood lo riscrive sotto le dita.
  for (const c of CANALI_MIXER) {
    if (!c.input) continue;
    c.input.value = String(c.dai().toFixed(1));
    c.mostra();
  }
}

/* Le tre forme di cursore che bastano a tutta la tavola. */
function suGT(chiave, k = 1) {
  return { valore: (x) => x / k, scrivi: (x) => { GT[chiave] = x / k; }, crudo: () => G[chiave] * k };
}
function suOggetto(ogg, campo, k = 1) {
  return { valore: (x) => x / k, scrivi: (x) => { ogg[campo] = x / k; }, crudo: () => ogg[campo] * k };
}
function con(def, testo) { return Object.assign({}, def, { testo }); }

const frazioneDi = (v) => numero(v, 2);
const secondi = (v) => numero(v, 1) + " s";
/* Il registro non è un numero senza unità: è quanto è larga la forbice con cui
   il campo viene guardato. Sedici gradi di pentatonica a cursore pieno fanno
   poco più di tre ottave, e dirlo in ottave è dire una cosa che si sente. */
const ottave = (v) => numero(v * 0.032, 1) + " ott";

/* ------------------------------------------------------------------ 01 gocce */
cursore("fAttacco", "vfAttacco", con(suOggetto(FORMA, "attacco", 1000), (v) => Math.round(v * 1000) + " ms"));
cursore("fCoda",    "vfCoda",    con(suOggetto(FORMA, "coda", 10), secondi));
cursore("fInarm",   "vfInarm",   con(suOggetto(FORMA, "inarm", 100), frazioneDi));
cursore("fBrill",   "vfBrill",   con(suOggetto(FORMA, "brill", 100), frazioneDi));
cursore("fCorpo",   "vfCorpo",   con(suOggetto(FORMA, "corpo", 100), frazioneDi));

cursore("registro",     "vRegistro",     con(suGT("registro"), ottave));
cursore("calore",       "vCalore",       con(suGT("calore"), (v) => numero(v / 100, 2)));
cursore("addensamento", "vAddensamento", con(suGT("addensamento"), (v) => numero(v / 100, 2)));
cursore("densita",      "vDensita",      con(suGT("densita"), (v) => Math.round(v) + " / giro"));
cursore("spazio",       "vSpazio",       con(suGT("spazio"), (v) => numero(v / 100, 2)));

/* ---------------------------------------------------------------- 02 tessuti
   I cinque filetti dei tessuti NON sono quelli delle gocce, e non è una svista.
   Per un tenuto non esiste un attacco da misurare in millesimi e non esiste una
   coda: c'è una dissolvenza. Esiste invece una cosa che le gocce non hanno — il
   tipo e la velocità del movimento interno — perché un tenuto perfettamente
   fermo, dopo pochi secondi, smette di essere un suono e diventa una proprietà
   della stanza. */
cursore("apertura",   "vApertura",    con(suGT("tApertura", 10), secondi));
cursore("chiusura",   "vChiusura",    con(suGT("tChiusura", 10), secondi));
cursore("fMovimento", "vfMovimento",  con(suOggetto(FORMA_T, "movimento", 100), frazioneDi));
cursore("fTbrill",    "vfTbrill",     con(suOggetto(FORMA_T, "brill", 100), frazioneDi));
cursore("fTcorpo",    "vfTcorpo",     con(suOggetto(FORMA_T, "corpo", 100), frazioneDi));

cursore("tregistro", "vTregistro", con(suGT("tRegistro"), ottave));
cursore("passo",     "vPasso",     con(suGT("tPasso"), (v) => numero(v / 100, 2)));
cursore("intreccio", "vIntreccio", con(suGT("tIntreccio"), (v) => numero(v / 100, 2)));
cursore("tspazio",   "vTspazio",   con(suGT("tSpazio"), (v) => numero(v / 100, 2)));

/* ------------------------------------------------------------------ 04 grani */
cursore("gtesta", "vGtesta", con(suGT("gTesta"), (v) => {
  const m = materiaCorrente();
  return m ? numero((v / 100) * m.durata, 1) + " s" : numero(v / 100, 2);
}));
cursore("gcorsa",      "vGcorsa",      con(suGT("gCorsa"), (v) => numero(v / 100, 2) + "×"));
cursore("gdensita",    "vGdensita",    con(suGT("gDensita"), (v) => Math.round(v) + "/s"));
cursore("ggrano",      "vGgrano",      con(suGT("gGrano"), (v) => Math.round(v) + " ms"));
cursore("gnube",       "vGnube",       con(suGT("gNube"), (v) => "±" + Math.round((v / 100) * 2500) + " ms"));
cursore("galtezza",    "vGaltezza",    con(suGT("gAltezza"), (v) => (v > 0 ? "+" : "") + Math.round(v) + " st"));
cursore("gsparpaglio", "vGsparpaglio", con(suGT("gSparpaglio"), (v) => numero(v / 100, 2)));
cursore("gspazio",     "vGspazio",     con(suGT("gSpazio"), (v) => numero(v / 100, 2)));

el("intonato").addEventListener("change", (e) => { graniIntonati = e.target.checked; });

/* -------------------------------------------------------------------- i mood
   Un mood scrive su `G` E su `GT`: è uno scatto, non un gesto. Lasciarlo
   lisciare da `battito()` vorrebbe dire sentire lo strumento scivolare verso il
   nuovo carattere per due o tre secondi, cioè un fondo che si dissolve — il
   contrario di un cambio di scena. Dopo, i cursori e le targhe vanno rimessi in
   pari, o l'interfaccia racconta lo stato di prima. */
tendina("moodGocce", Object.keys(MOOD_GOCCE), NOMI_MOOD, null, (v) => {
  applicaMoodGocce(v);
  selTimbro.value = timbroFrasi;
  allinea(); aggiornaLinee();
});
tendina("moodTessuti", Object.keys(MOOD_TESSUTI), NOMI_MOOD, null, (v) => {
  applicaMoodTessuti(v);
  selTessuto.value = timbroTessuti;
  allinea(); aggiornaLinee();
});

/* ------------------------------------------------------------- l'accensione */
const btnAscolto = el("ascolto");
let acceso = false;
btnAscolto.addEventListener("click", async () => {
  acceso = !acceso;
  await accendi(acceso);
  btnAscolto.setAttribute("aria-pressed", String(acceso));
  el("etichettaAscolto").textContent = acceso ? "Pausa" : "Ascolta";
});
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target === document.body) { e.preventDefault(); btnAscolto.click(); }
});

el("gocceOn").addEventListener("change", (e) => { frasiOn = e.target.checked; });
el("tessutiOn").addEventListener("change", (e) => { tessutiOn = e.target.checked; });
el("graniOn").addEventListener("change", (e) => { graniOn = e.target.checked; });

/* -------------------------------------------------------- i comandi per linea
   Tre per ciascuna delle otto: quanto dura il giro, se tace, e una idea nuova.
   La tavola scrive le stesse cifre sugli anelli, così si sa quale cerchio si
   sta silenziando.

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

    const n = document.createElement("span");
    n.className = "n"; n.textContent = String(i + 1);

    const dur = document.createElement("input");
    dur.type = "range"; dur.min = min; dur.max = max; dur.step = 0.5;
    dur.value = L.target;
    dur.setAttribute("aria-label", "Durata del giro, linea " + (i + 1));

    const val = document.createElement("span");
    val.className = "vl"; val.textContent = numero(L.target, 1) + "″";

    const aggiorna = () => {
      val.textContent = numero(L.target, 1) + "″";
      dur.style.setProperty("--u", frazione(dur).toFixed(4));
    };
    dur.addEventListener("input", () => {
      L.target = Number(dur.value);
      aggiorna();
      aggiornaRiallineo();
      aggiornaPeriodi();
    });

    const muto = document.createElement("button");
    muto.className = "tasto";
    muto.textContent = "muta";
    muto.setAttribute("aria-pressed", "false");
    muto.setAttribute("aria-label", "Silenzia la linea " + (i + 1));
    muto.addEventListener("click", () => {
      L.muted = !L.muted;
      muto.setAttribute("aria-pressed", String(L.muted));
    });

    const nuova = document.createElement("button");
    nuova.className = "tasto";
    nuova.textContent = "↻";
    nuova.setAttribute("aria-label", "Nuova idea, linea " + (i + 1));
    nuova.addEventListener("click", () => {
      rigenerala(L);
      if (ctx) riposizionaIdx(L, orizzonteSicuro(ctx.currentTime));
    });

    riga.append(n, dur, val, muto, nuova);
    box.appendChild(riga);
    L._cursoreDurata = dur;
    L._aggiornaDurata = aggiorna;
    L._pulsanteMuto = muto;
    aggiorna();
  });
}

costruisciLinee("lineeGocce",   frasi,   PERIODO_MIN, PERIODO_MAX, rigenera);
costruisciLinee("lineeTessuti", tessuti, TENUTA_MIN,  TENUTA_MAX,  rigeneraTrama);

function aggiornaLinee() {
  for (const L of frasi.concat(tessuti)) {
    if (!L._cursoreDurata) continue;
    L._cursoreDurata.value = String(L.target);
    L._aggiornaDurata();
    L._pulsanteMuto.setAttribute("aria-pressed", String(L.muted));
  }
  aggiornaRiallineo();
  aggiornaPeriodi();
}

function aggiornaPeriodi() {
  el("periodiGocce").textContent = frasi.map((L) => Math.round(L.target)).join(" ");
  el("periodiTessuti").textContent = tessuti.map((L) => Math.round(L.target)).join(" ");
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

/* ------------------------------------------------------------ 03 banco · eq
   Otto bande, otto aste verticali. I decibel stanno in `EQ_DB`, che è quello
   che `tara()` rilegge a ogni costruzione: scritti solo nei filtri, un
   rendering fuori tempo reale uscirebbe con l'equalizzatore piatto. */
const NOMI_BANDE = ["20", "50", "100", "500", "1K", "5K", "10K", "18K"];
const ASTE = [];
BANDE.forEach((b, i) => {
  const et = document.createElement("span");
  et.textContent = NOMI_BANDE[i];
  el("scalaEq").appendChild(et);

  const cella = document.createElement("div");
  cella.className = "asta";
  const a = document.createElement("input");
  a.type = "range"; a.className = "verticale";
  a.min = -EQ_CORSA; a.max = EQ_CORSA; a.step = 0.5; a.value = EQ_DB[i];
  a.setAttribute("aria-label", "Banda " + NOMI_BANDE[i] + " hertz");
  a.addEventListener("input", () => {
    EQ_DB[i] = Number(a.value);
    if (banco) banco.banda(i, EQ_DB[i]);
  });
  cella.appendChild(a);
  el("aste").appendChild(cella);
  ASTE.push(a);
});

/* I profili: otto numeri con un nome, in memoria e solo per questa seduta.
   Scriverli sul disco di chi ascolta è la prima cosa in tutto il progetto che
   lo farebbe, ed è una decisione che non è stata presa. */
const PROFILI = [{ nome: "piatto", v: [0, 0, 0, 0, 0, 0, 0, 0] }];
const selProfilo = el("profilo");
function elencaProfili() {
  selProfilo.innerHTML = "";
  PROFILI.forEach((p, i) => {
    const o = document.createElement("option");
    o.value = String(i); o.textContent = p.nome;
    selProfilo.appendChild(o);
  });
}
selProfilo.addEventListener("change", () => {
  const p = PROFILI[Number(selProfilo.value)];
  if (!p) return;
  p.v.forEach((dB, i) => {
    EQ_DB[i] = dB;
    ASTE[i].value = String(dB);
    if (banco) banco.banda(i, dB);
  });
});
el("salvaProfilo").addEventListener("click", () => {
  PROFILI.push({ nome: "profilo " + PROFILI.length, v: EQ_DB.slice() });
  elencaProfili();
  selProfilo.value = String(PROFILI.length - 1);
});
elencaProfili();

/* --------------------------------------------------------- 03 banco · mixer
   Cinque aste. Quattro scrivono un livello del banco; quella dei tessuti no —
   scrive `tLivello`, che è un parametro del modello e non un guadagno, perché
   è là che la deriva lo muove. Due comandi sullo stesso numero sarebbero due
   comandi che si contraddicono. */
const CANALI_MIXER = [
  { et: "Frasi",   dai: () => LIVELLI.frasi,  metti: (v) => { LIVELLI.frasi = v; if (banco) banco.livello("frasi", v); }, min: -24, max: 6 },
  { et: "Tessuti", dai: () => 20 * Math.log10(clamp(G.tLivello, 8, 60) / 32) - 7,
    metti: (v) => { GT.tLivello = clamp(32 * Math.pow(10, (v + 7) / 20), 8, 60); }, min: -19, max: -1.5 },
  { et: "Voci",    dai: () => LIVELLI.voci, metti: () => {}, min: -24, max: 6, spento: true },
  { et: "Grani",   dai: () => LIVELLI.grani,  metti: (v) => { LIVELLI.grani = v; if (banco) banco.livello("grani", v); }, min: -24, max: 6 },
  { et: "Uscita",  dai: () => LIVELLI.uscita, metti: (v) => { LIVELLI.uscita = v;
      if (banco && running) banco.uscita.gain.setTargetAtTime(Math.pow(10, v / 20), ctx.currentTime, 0.1); },
    min: -24, max: 0 },
];

CANALI_MIXER.forEach((c) => {
  const cella = document.createElement("div");
  cella.className = "fader";
  const a = document.createElement("input");
  a.type = "range"; a.className = "verticale";
  a.min = c.min; a.max = c.max; a.step = 0.5; a.value = c.dai();
  a.disabled = !!c.spento;
  a.setAttribute("aria-label", "Livello " + c.et);
  const et = document.createElement("span");
  et.className = "fl" + (c.spento ? " tenue" : ""); et.textContent = c.et;
  const val = document.createElement("span");
  val.className = "vl" + (c.spento ? " tenue" : "");
  const mostra = () => { val.textContent = dB(c.dai()); };
  a.addEventListener("input", () => { c.metti(Number(a.value)); mostra(); });
  cella.append(a, et, val);
  el("faders").appendChild(cella);
  c.input = a; c.mostra = mostra;
  mostra();
});

/* ---------------------------------------------------- 03 banco · le uscite
   Due comandi che danno due file diversi. La presa dal vivo registra la seduta
   con dentro le mani: un cursore mosso resta nel file perché è successo.
   L'esportazione rende il pezzo che l'apparecchio farebbe da solo, fuori tempo
   reale, e non ha nessuna mano dentro. La prima è la registrazione di una
   seduta, la seconda è una tiratura. */
const btnPresa = el("presa"), btnEsporta = el("esporta");
let orologioPresa = null;

btnPresa.addEventListener("click", async () => {
  if (stoRegistrando()) {
    const buf = fermaPresa();
    clearInterval(orologioPresa);
    btnPresa.setAttribute("aria-pressed", "false");
    el("etichettaPresa").textContent = "Registra";
    el("formato").textContent = salvaComeWav(buf)
      ? numero(buf.duration, 1) + " s salvati"
      : "non è arrivato niente";
    return;
  }
  try {
    await avviaPresa();
    btnPresa.setAttribute("aria-pressed", "true");
    el("etichettaPresa").textContent = "Ferma e salva";
    el("formato").textContent = "48 kHz · 24 bit";
    orologioPresa = setInterval(() => {
      const s = secondiRegistrati();
      el("cronometro").textContent = mmss(s);
      if (s >= SESSIONE_MAX - 0.5) btnPresa.click();     // il tetto si ferma da sé
    }, 200);
  } catch (e) {
    el("formato").textContent = "non riesco ad aprire la presa";
  }
});

cursore("durata", "vDurata", {
  valore: (x) => x, scrivi: () => {}, crudo: () => Number(el("durata").value),
  testo: (v) => v + "′",
});

btnEsporta.addEventListener("click", async () => {
  const sec = Number(el("durata").value) * 60;
  btnEsporta.disabled = true;
  el("esito").textContent = "rendo…";
  // Un giro di eventi prima di partire, o l'etichetta non fa in tempo a
  // comparire: il rendering tiene occupato il thread principale.
  await new Promise((r) => setTimeout(r, 30));
  try {
    const t0 = performance.now();
    const buf = await esporta(sec);
    salvaComeWav(buf);
    el("esito").textContent = numero((performance.now() - t0) / 1000, 1) + " s per " +
                              Math.round(sec / 60) + "′";
  } catch (e) {
    el("esito").textContent = "non ce l'ho fatta";
  }
  btnEsporta.disabled = false;
});

/* La tavola come immagine. È l'unica esportazione che non passa per il suono:
   il canvas sa già disegnarsi, e quello che si vede è quello che si porta via. */
el("esportaPng").addEventListener("click", () => {
  const tela = el("tavola");
  tela.toBlob((b) => {
    if (!b) { el("misuraPng").textContent = "non ce l'ho fatta"; return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = "hiroshi-" + new Date().toISOString().slice(0, 16).replace(/[:T]/g, "") + ".png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    el("misuraPng").textContent = tela.width + " × " + tela.height;
  }, "image/png");
});

/* ------------------------------------------------------------ 04 grani · materia
   Le due porte da cui entra la materia. Il microfono passa da «registra» e da
   nessun'altra parte: non si granula un flusso dal vivo, si granula una
   registrazione — la ragione sta in cima a `grani.js` e sono tre, tutte
   strutturali. */
const selMateria = el("materia");
function aggiornaMaterie() {
  selMateria.innerHTML = "";
  if (!materiali.length) {
    const o = document.createElement("option");
    o.value = "-1"; o.textContent = "niente ancora";
    selMateria.appendChild(o);
    return;
  }
  materiali.forEach((m, i) => {
    const o = document.createElement("option");
    o.value = String(i);
    o.textContent = m.nome + " · " + minsec(m.durata);
    if (i === materiale) o.selected = true;
    selMateria.appendChild(o);
  });
}
selMateria.addEventListener("change", () => { materiale = Number(selMateria.value); testaOra = 0; });

/* Il contesto serve tanto per decodificare un file quanto per aprire il
   microfono, e a quel punto tanto vale costruirlo tutto: l'uscita resta chiusa
   finché non si preme Ascolta, quindi non si sente niente. */
function assicuraContesto() { costruisciMotore(); return ctx; }

el("file").addEventListener("change", async (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  el("cattura").textContent = "leggo…";
  try {
    await caricaFile(assicuraContesto(), f);
    aggiornaMaterie();
    el("cattura").textContent = "";
  } catch (err) {
    el("cattura").textContent = "non riesco a leggerlo";
  }
  e.target.value = "";
});

const btnReg = el("registra");
let presa = null, flusso = null, orologioMic = null;
btnReg.addEventListener("click", async () => {
  if (presa) {
    const buf = presa.chiudi();
    presa = null;
    clearInterval(orologioMic);
    if (flusso) { flusso.getTracks().forEach((t) => t.stop()); flusso = null; }
    btnReg.setAttribute("aria-pressed", "false");
    el("etichettaRegistra").textContent = "Microfono";
    if (buf && buf.length) {
      aggiungiMateria("microfono " + (materiali.filter((m) => /^microfono/.test(m.nome)).length + 1), buf);
      aggiornaMaterie();
      el("cattura").textContent = "";
    } else {
      el("cattura").textContent = "non è arrivato niente";
    }
    return;
  }
  try {
    const c = assicuraContesto();
    if (c.state === "suspended") await c.resume();
    flusso = await apriMicrofono();
    presa = await apriCattura(c, c.createMediaStreamSource(flusso));
    btnReg.setAttribute("aria-pressed", "true");
    el("etichettaRegistra").textContent = "Ferma";
    orologioMic = setInterval(() => {
      if (presa) el("cattura").textContent = numero(presa.secondi, 1) + " s";
    }, 200);
  } catch (err) {
    el("cattura").textContent = "microfono negato";
    presa = null; flusso = null;
  }
});

/* ----------------------------------------------------------- le sette voci
   Non ci sono ancora, e le spie lo dicono: sette caselle vuote. Aspettano una
   decisione musicale — l'archivio delle 53 frasi attraversa tutti e dodici i
   gradi, mentre gocce e tessuti stanno su una pentatonica dove nulla può
   stonare — e non una riga di codice. */
for (let k = 0; k < 7; k++) el("vociSpie").appendChild(document.createElement("span"));

/* ------------------------------------------------------------- il ciclo lento
   Non è il ciclo del disegno: è quello che liscia i parametri e aggiorna le
   targhe. Gira anche a motore fermo, così i cursori rispondono comunque.

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
let avvioSessione = null;

function battito() {
  for (const k in GT) G[k] += (GT[k] - G[k]) * SMUSSO;
  // A motore fermo li fa questo ciclo, così i cursori rispondono comunque.
  if (!ctx) { effettiviFrasi(); effettiviTessuti(); effettiviGrani(); }

  if (Math.abs(effG.addensamento - ultimaTesta) > 0.3) {
    ultimaTesta = effG.addensamento;
    ricostruisciPiani(ctx ? ctx.currentTime : null);
  }
  if (Math.abs(effGT.intreccio - ultimoIntreccio) > 1.5) {
    ultimoIntreccio = effGT.intreccio;
    ricostruisciTrame(ctx ? ctx.currentTime : null);
  }

  if (banco) {
    const p = banco.picchi();
    const picco = Math.max(p[0], p[1]);
    el("picco").textContent = isFinite(picco) ? numero(picco, 1) + " dB" : "—";
    el("riduzione").textContent = numero(banco.riduzione(), 1) + " dB";
  }
  // L'asta dei tessuti la muove anche la deriva: il numero segue.
  CANALI_MIXER[1].mostra();

  const t = ctx ? ctx.currentTime : 0;
  if (running && avvioSessione === null) avvioSessione = t;
  el("sessione").textContent = mmss(running ? t - (avvioSessione || 0) : 0);
  el("quinteFatte").textContent = String(passiQuinta);
  el("prossima").textContent = minsec(Math.max(0, prossimaQuinta - t));
  el("tonalita").textContent = NOMI_NOTE[tonalita()];
  /* Il baricentro si legge in GRADI della collezione, non nel −1..1 in cui la
     deriva lo tiene: «+1,8» vuol dire che la finestra sul campo si è spostata
     di quasi due gradi verso l'alto, ed è un numero che si può contare sulla
     scala. Il fattore è lo stesso che usa `altezza()`. */
  el("vBaricentro").textContent = (deriva.centro >= 0 ? "+" : "") +
    numero(deriva.centro * AMPIEZZA_CENTRO, 1);

  el("piedeMano").textContent = MANI.length
    ? "a mano: " + MANI.join(", ")
    : "il colore è l'altezza, la lunghezza la durata";

  el("piedeStato").textContent =
    (running ? "in ascolto" : "fermo") +
    " · tonalità " + NOMI_NOTE[tonalita()] +
    " · gocce " + NOMI_TIMBRI[timbroFrasi] +
    " · tessuti " + NOMI_TESSUTI[timbroTessuti] +
    " · " + tavolozzaOraria(oraCorrente()).nome +
    " · " + tavolozzaStagionale(meseCorrente()).nome;

  setTimeout(battito, 33);
}

allinea();
aggiornaLinee();
aggiornaMaterie();
battito();
