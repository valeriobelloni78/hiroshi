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

/* I NOMI NON STANNO PIÙ QUI: stanno in `i18n.js`, che è più in alto di tutto e
   non dipende da niente. Prima erano quattro dizionari in questo file e la
   tavola veniva a prenderseli — era l'unica cosa che le serviva dai comandi, e
   adesso non le serve più nemmeno quella. */
/* Il circolo delle quinte com'è scritto sulla fascia: DO SOL RE… Ogni passo
   cambia una nota sola della pentatonica, ed è per questo che non ha un bordo
   che si senta. */
const CIRCOLO = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

const el = (id) => document.getElementById(id);
const dB = (v) => (v > 0 ? "+" : "") + numero(v, 1);
const mmss = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
const minsec = (s) => Math.floor(s / 60) + "′ " + String(Math.floor(s % 60)).padStart(2, "0") + "″";

/* --------------------------------------------------------------- le tendine
   `traduci` è una FUNZIONE e non un dizionario, ed è tutta la differenza: un
   dizionario si legge una volta, al momento di costruire le voci, e resterebbe
   nella lingua di allora. Una funzione la si richiama, ed è quello che fa
   `ridisegnaTendine()` quando qualcuno tocca il selettore in alto.

   Ogni tendina si iscrive a un elenco: il valore scelto è nel `value`, che non
   cambia mai — sono le PAROLE a cambiare, e il modello non se ne accorge. */
const TENDINE = [];

/* LA VOCE VUOTA SI SCRIVE «- - -», e non «niente»: in una tendina che può non
   avere niente di scelto — l'effetto sotto un cerchio, la sorgente del paesaggio
   prima che arrivi un suono — una parola al posto del vuoto si legge come una
   scelta fatta. Tre trattini sono un segno, non una parola, quindi non si
   traducono; il lettore di schermo sente comunque il nome, dall'`aria-label`. */
const VUOTO = "- - -";

function tendina(id, chiavi, traduci, corrente, scegli, vuota) {
  const sel = el(id);
  for (const k of chiavi) {
    const o = document.createElement("option");
    o.value = k;
    if (k === corrente) o.selected = true;
    sel.appendChild(o);
  }
  sel.addEventListener("change", () => scegli(sel.value));
  const scrivi = () => {
    for (const o of sel.options) {
      const nome = traduci ? traduci(o.value) : o.value;
      if (o.value === vuota) { o.textContent = VUOTO; o.setAttribute("aria-label", nome); }
      else o.textContent = nome;
    }
  };
  TENDINE.push(scrivi);
  scrivi();
  return sel;
}

function ridisegnaTendine() { for (const s of TENDINE) s(); }

const selTimbro  = tendina("timbro",  TIMBRI,  nomeTimbro,  timbroFrasi,   (v) => { timbroFrasi = v; });
/* Il tessuto scelto vale per le TENUTE CHE NASCONO DA ORA: quelle già aperte
   arrivano in fondo con la loro voce. Cambiare timbro a un suono che dura
   quaranta secondi vorrebbe dire sentirlo mutare a metà, che è un taglio. */
const selTessuto = tendina("tessuto", TESSUTI, nomeTenuto, timbroTessuti, (v) => { timbroTessuti = v; });

tendina("modoGocce",   ["deriva", "ancora"], nomeModo, MODI.gocce,   (v) => { MODI.gocce = v; });
tendina("modoTessuti", ["deriva", "ancora"], nomeModo, MODI.tessuti, (v) => { MODI.tessuti = v; });

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
  const voce = { input, def, mostra };
  CURSORI.push(voce);
  def.scrivi(Number(input.value));
  mostra();
  return voce;
}

/* ------------------------------------------------------------- le lingue
   Tutto quello che sta scritto nell'HTML lo rifà `applicaTesti()` da sé, e non
   serve dirglielo. Qui si rifà SOLO quello che l'HTML non contiene: le voci
   delle sei tendine, le parole delle otto righe delle linee, le cinque
   etichette del mixer, i nomi dei profili, le sei manopole degli inserti, e
   ogni targa — che è un numero, e i numeri cambiano separatore decimale
   insieme alla lingua.

   `alCambioDiLingua` non è registrata da nessuna parte: `i18n.js` la cerca per
   nome quando serve. È lo stesso patto della tavola col modello — chi sta più
   in basso guarda in su, non viceversa — e la ragione per cui `i18n.js` può
   stare in cima senza conoscere nessuno. */
function alCambioDiLingua() {
  ridisegnaTendine();
  for (const r of RINOMINA_INSERTI) r();
  for (const c of CANALI_MIXER) c.rinomina();
  for (const L of frasi.concat(tessuti)) if (L._rinomina) L._rinomina();
  elencaProfili();
  aggiornaMaterie();
  didascaliaDeriva();
  allinea();
  aggiornaRiallineo();
  // Le letture che cambiano da sé — la riga di stato, il baricentro, i picchi —
  // le riscrive `battito()` fra trentatré millesimi, e non c'è niente da fare.
}

/* La didascalia della deriva porta dentro un tempo, e il tempo lo sa `deriva.js`
   — scritto a mano nell'HTML sarebbe una cifra da tenere in pari con una
   costante che sta in un altro file. */
function didascaliaDeriva() {
  el("didaDeriva").textContent = dice("dida.deriva", { t: minsec(PASSO_QUINTA) });
}

/* Il tema e il selettore delle lingue: il primo sta in `tema.js` e il secondo
   in `i18n.js`, perché li usa anche la guida. Qui si accendono e basta. */
costruisciSelettoreLingua(el("lingue"));
applicaTesti();
didascaliaDeriva();
avviaTema("tema");

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
const ottave = (v) => dice("unita.ott", { n: numero(v * 0.032, 1) });

/* ------------------------------------------------------------------ 01 gocce */
cursore("fAttacco", "vfAttacco", con(suOggetto(FORMA, "attacco", 1000), (v) => numero(v * 1000) + " ms"));
cursore("fCoda",    "vfCoda",    con(suOggetto(FORMA, "coda", 10), secondi));
cursore("fInarm",   "vfInarm",   con(suOggetto(FORMA, "inarm", 100), frazioneDi));
cursore("fBrill",   "vfBrill",   con(suOggetto(FORMA, "brill", 100), frazioneDi));
cursore("fCorpo",   "vfCorpo",   con(suOggetto(FORMA, "corpo", 100), frazioneDi));

cursore("registro",     "vRegistro",     con(suGT("registro"), ottave));
cursore("calore",       "vCalore",       con(suGT("calore"), (v) => numero(v / 100, 2)));
cursore("addensamento", "vAddensamento", con(suGT("addensamento"), (v) => numero(v / 100, 2)));
cursore("densita",      "vDensita",      con(suGT("densita"), (v) => dice("unita.giro", { n: numero(v) })));
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
/* Il livello dei tessuti è il terzo comando dell'Insieme, quello che nelle gocce
   è la densità: quanto lo sfondo sta sotto al primo piano. Si legge in decibel
   perché è quello che fa — 32 è l'esordio, e a 32 il canale sta a −7 dB. Non è
   l'asta del mixer: quella scosta il canale, questo è il carattere della classe,
   e la deriva muove solo questo. */
cursore("livello", "vLivello", con(suGT("tLivello"),
        (v) => dB(20 * Math.log10(clamp(v, 8, 60) / 32) - 7) + " dB"));
cursore("tspazio",   "vTspazio",   con(suGT("tSpazio"), (v) => numero(v / 100, 2)));

/* ------------------------------------------------- l'inserto delle due classi
   Una tendina e tre manopole per parte, sotto la linea. Le manopole scrivono
   sempre lo stesso numero — 0÷100 in `GT` — e sono l'EFFETTO a dire che cosa
   voglia dire: la targa lo chiede a `EFFETTI` ogni volta che la deve scrivere,
   quindi non c'è nessuna tabella di nomi da tenere in pari con l'altra.

   L'etichetta invece si riscrive a mano quando la tendina cambia, e non a ogni
   fotogramma: è la sola cosa nel foglio che il disegno non ridipinge da sé, e
   riscriverla sessanta volte al secondo per niente farebbe lavorare il
   browser sul testo di sei elementi.

   A inserto vuoto le tre manopole si spengono davvero — `disabled` — invece di
   restare girabili senza effetto. Un comando che si muove e non fa niente è
   peggio di un comando che dice di no. */
function testoInserto(classe, i) {
  return (v) => {
    const par = EFFETTI[EFFETTO[classe]].param[i];
    if (!par) return "—";
    // L'unità «ott» è l'unica parola fra quelle degli effetti, e sta nel
    // dizionario: `u` porta i segni, non le parole.
    const x = numero(par.da(v) * par.k, par.d);
    return par.u === "ott" ? dice("unita.ott", { n: x }) : x + par.u;
  };
}

const RINOMINA_INSERTI = [];

function inserto(classe, pre, idTendina) {
  const M = pre.toUpperCase();
  const manopole = [];
  for (let i = 0; i < 3; i++) {
    manopole.push(cursore(pre + (i + 1), "v" + M + (i + 1),
                          con(suGT(pre + (i + 1)), testoInserto(classe, i))));
  }
  /* Si rifà solo la LETTURA delle tre targhe, non `allinea()`: quello rimette
     ogni cursore dove `G` lo trova, e `G` insegue `GT` con mezzo secondo di
     ritardo. Chiamarlo qui vorrebbe dire che cambiare effetto mentre una
     manopola sta ancora scivolando la tira indietro di qualche punto. Per un
     mood è la cosa giusta — un mood scrive `G` e `GT` insieme, quindi non c'è
     ritardo da subire — qui no. */
  const rinomina = () => {
    const spec = EFFETTI[EFFETTO[classe]].param;
    manopole.forEach((m, i) => {
      const par = spec[i];
      el("fl" + M + (i + 1)).textContent = par ? nomeParam(par.fl) : "—";
      m.input.disabled = !par;
      m.input.closest(".manopola").classList.toggle("spenta", !par);
      m.input.setAttribute("aria-label",
        dice("a11y.effetto", { classe: dice("sez." + classe), n: i + 1 }));
      m.mostra();
    });
  };
  tendina(idTendina, EFFETTI_NOMI, nomeEffetto, EFFETTO[classe], (v) => {
    EFFETTO[classe] = v;
    rinomina();
  }, "niente");
  rinomina();
  RINOMINA_INSERTI.push(rinomina);
}

inserto("gocce",   "gE", "effGocce");
inserto("tessuti", "tE", "effTessuti");

/* -------------------------------------------------------------- 04 paesaggio
   Le due maniglie del segmento non hanno una targa loro: la coppia si legge in
   cifre nel capo della sezione, «3″ → 1′ 15″», perché un inizio senza la sua
   fine non dice niente e due targhe separate costringerebbero a fare la
   sottrazione a mente. */
cursore("pRallenta",   "vRallenta",    con(suGT("pRallenta"), (v) => numero(v) + "×"));
cursore("pVelo",       "vVelo",        con(suGT("pVelo"), (v) => numero(v) + " ms"));
cursore("pSparpaglio", "vPsparpaglio", con(suGT("pSparpaglio"), (v) => numero(v / 100, 2)));
/* L'accordatura dosa fra il paesaggio crudo e quello intonato; il fuoco è
   quanto sono stretti i risonatori. Sono due domande diverse — quanto, e che
   cosa — e per questo sono due cursori. */
cursore("pAccordatura","vAccordatura", con(suGT("pAccordatura"), (v) => numero(v / 100, 2)));
cursore("pFuoco",      "vFuoco",       con(suGT("pFuoco"), (v) => numero(v)));
cursore("pCoda",       "vCoda",        con(suGT("pCoda"), (v) => numero(v, 1) + " s"));
cursore("pTono",       "vTono",        con(suGT("pTono"), (v) => numero(v / 1000, 1) + " kHz"));
cursore("pRiverbero",  "vRiverbero",   con(suGT("pRiverbero"), (v) => numero(v / 100, 2)));

/* LE CINQUE LETTURE E LA SOSTA. La lettura si scrive su `G` E su `GT` insieme,
   come un mood: è uno scatto fra cinque posizioni, e lisciarla vorrebbe dire
   passare per le letture di mezzo. La sosta serve solo al random, e con le altre
   quattro la manopola si spegne davvero — `disabled` — come quelle di un inserto
   vuoto: un comando che si muove e non fa niente è peggio di uno che dice di no. */
cursore("pSosta",      "vPsosta",      con(suGT("pSosta"), (v) => numero(sostaDi(v), 1) + " s"));
const MODI_LETTURA = [...document.querySelectorAll(".modo[data-lettura]")];
function segnaLettura() {
  for (const b of MODI_LETTURA)
    b.setAttribute("aria-pressed", String(Number(b.dataset.lettura) === G.pLettura));
  const spenta = G.pLettura !== LETTURA.random;
  el("pSosta").disabled = spenta;
  el("pSosta").closest(".manopola").classList.toggle("spenta", spenta);
}
for (const b of MODI_LETTURA) {
  b.addEventListener("click", () => {
    G.pLettura = GT.pLettura = Number(b.dataset.lettura);
    segnaLettura();
  });
}
segnaLettura();

/* Il segmento scrive DIRETTO su `G` oltre che su `GT`, ed è l'unica eccezione
   fuori dai mood. Una maniglia lisciata da `battito()` si trascinerebbe dietro
   il disegno con un decimo di secondo di ritardo — e trascinare un bordo che
   arriva dopo il dito è la sola cosa che un'interfaccia diretta non può
   permettersi. Il segmento poi non entra in nessun suono già cominciato: lo
   legge la testa al giro dopo, quindi non c'è nessuno scalino da lisciare. */
function maniglia(id) {
  const input = el(id);
  const chiaveG = id;
  const scrivi = () => {
    G[chiaveG] = GT[chiaveG] = Number(input.value);
    input.style.setProperty("--u", frazione(input).toFixed(4));
    segnaMano(input);
  };
  input.addEventListener("input", scrivi);
  CURSORI.push({ input, def: { crudo: () => G[chiaveG], testo: () => "" },
                 mostra: () => input.style.setProperty("--u", frazione(input).toFixed(4)) });
  scrivi();
}
maniglia("pInizio");
maniglia("pFine");

/* -------------------------------------------------------------------- i mood
   Un mood scrive su `G` E su `GT`: è uno scatto, non un gesto. Lasciarlo
   lisciare da `battito()` vorrebbe dire sentire lo strumento scivolare verso il
   nuovo carattere per due o tre secondi, cioè un fondo che si dissolve — il
   contrario di un cambio di scena. Dopo, i cursori e le targhe vanno rimessi in
   pari, o l'interfaccia racconta lo stato di prima. */
tendina("moodGocce", Object.keys(MOOD_GOCCE), nomeMood, null, (v) => {
  applicaMoodGocce(v);
  selTimbro.value = timbroFrasi;
  allinea(); aggiornaLinee();
});
tendina("moodTessuti", Object.keys(MOOD_TESSUTI), nomeMood, null, (v) => {
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
  el("etichettaAscolto").textContent = dice(acceso ? "governo.pausa" : "governo.ascolta");
});
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target === document.body) { e.preventDefault(); btnAscolto.click(); }
});

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
    dur.setAttribute("aria-label", dice("a11y.durataGiro", { n: i + 1 }));

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
    muto.textContent = dice("linea.muta");
    muto.setAttribute("aria-pressed", "false");
    muto.setAttribute("aria-label", dice("a11y.silenzia", { n: i + 1 }));
    muto.addEventListener("click", () => {
      L.muted = !L.muted;
      muto.setAttribute("aria-pressed", String(L.muted));
    });

    const nuova = document.createElement("button");
    nuova.className = "tasto";
    nuova.textContent = "↻";
    nuova.setAttribute("aria-label", dice("a11y.nuovaIdea", { n: i + 1 }));
    nuova.addEventListener("click", () => {
      rigenerala(L);
      if (ctx) riposizionaIdx(L, orizzonteSicuro(ctx.currentTime));
    });

    riga.append(n, dur, val, muto, nuova);
    box.appendChild(riga);
    L._cursoreDurata = dur;
    L._aggiornaDurata = aggiorna;
    L._pulsanteMuto = muto;
    /* Le parole di questa riga si rifanno al cambio di lingua. Il numero della
       linea NON è una parola: «1» resta «1» in tutte e quattro, come i numerali
       romani sugli anelli. */
    L._rinomina = () => {
      muto.textContent = dice("linea.muta");
      dur.setAttribute("aria-label", dice("a11y.durataGiro", { n: i + 1 }));
      muto.setAttribute("aria-label", dice(L.muted ? "a11y.riattiva" : "a11y.silenzia", { n: i + 1 }));
      nuova.setAttribute("aria-label", dice("a11y.nuovaIdea", { n: i + 1 }));
      aggiorna();
    };
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

/* I quattro periodi di una classe, e nient'altro: [7·11·13·17]. Le cifre sono
   valori e vanno in ambra; le parentesi e i punti sono la punteggiatura della
   serie e vanno in inchiostro, che col tema scuro diventa chiaro da sé. Nessuna
   parola intorno — che siano quattro lo dice la stringa. */
function scriviPeriodi(id, linee) {
  const dove = el(id);
  const segno = (s, classe) => {
    const i = document.createElement("i");
    if (classe) i.className = classe;
    i.textContent = s;
    dove.appendChild(i);
  };
  dove.textContent = "";
  segno("[");
  linee.forEach((L, k) => {
    if (k) segno("·", "sep");
    const b = document.createElement("b");
    b.textContent = Math.round(L.target);
    dove.appendChild(b);
  });
  segno("]");
}

function aggiornaPeriodi() {
  scriviPeriodi("periodiGocce", frasi);
  scriviPeriodi("periodiTessuti", tessuti);
}

/* 06 · INFLUENZE — di quanto ciascuna fonte sposta il proprio parametro, nell'unità
   in cui lo dice la targa del suo cursore. Ogni parametro pende da UNA fonte sola,
   quindi efficace meno mano È il contributo di quella fonte: qui non si rifà
   nessun conto, e non c'è un secondo posto dove la deriva, l'ora o la stagione
   possano raccontare un numero diverso da quello che suona.

   Apertura e chiusura sono un FATTORE e non una differenza, perché la stagione le
   moltiplica. Il colore d'insieme non ha una mano, quindi non ha uno spostamento:
   si scrive il taglio intero, che è tutto dell'ora. */
function segnato(v, cifre) {
  const zero = Math.abs(v) < 0.5 * Math.pow(10, -cifre);
  return (zero ? "" : v > 0 ? "+" : "−") + numero(Math.abs(v), cifre);
}
function scriviInfluenze() {
  const ottaveDi = (d) => dice("unita.ott", { n: segnato(d * 0.032, 1) });
  el("infCalore").textContent = segnato((effG.calore - G.calore) / 100, 2);
  el("infSpazio").textContent = segnato((effG.spazio - G.spazio) / 100, 2);
  el("infColore").textContent = numero(effG.colore / 1000, 1) + " kHz";
  el("infTregistro").textContent = ottaveDi(effGT.registro - G.tRegistro);
  el("infApertura").textContent = "×" + numero(effGT.apertura / Math.max(0.01, G.tApertura), 2);
  el("infChiusura").textContent = "×" + numero(effGT.chiusura / Math.max(0.01, G.tChiusura), 2);
  el("infPasso").textContent = segnato((effGT.passo - G.tPasso) / 100, 2);
  el("infRegistro").textContent = ottaveDi(effG.registro - G.registro);
  el("infAddensamento").textContent = segnato((effG.addensamento - G.addensamento) / 100, 2);
  el("infDensita").textContent = dice("unita.giro", { n: segnato(effG.densita - G.densita, 1) });
  el("infLivello").textContent = segnato(20 * Math.log10(effGT.livello / Math.max(1, G.tLivello)), 1) + " dB";
  el("nomeOra").textContent = dice("ora." + tavolozzaOraria(oraCorrente()).nome);
  el("nomeStagione").textContent = dice("stagione." + tavolozzaStagionale(meseCorrente()).nome);
}

/* Il riallineamento è quello di TUTTE E OTTO le linee: è il tempo prima che la
   combinazione completa ritorni, e le due classi non sono due pezzi separati.
   Con periodi lunghi il numero diventa enorme in fretta, e allora si cambia
   unità: «75.398 ore» non dice niente a nessuno, «otto anni» sì. */
function aggiornaRiallineo() {
  const s = riallineamento(frasi.concat(tessuti));
  const ore = s / 3600, giorni = ore / 24;
  /* Le tre scale del riallineamento: ore, giorni, anni. Le frasi stanno intere
     nel dizionario perché in giapponese il numero e l'unità non si staccano —
     «60,2年» e non «60,2 年» — e una concatenazione con lo spazio dentro non
     saprebbe toglierlo. */
  el("riallineo").textContent =
    giorni >= 400 ? dice("unita.anni",   { n: numero(giorni / 365, 1) })
    : ore >= 48   ? dice("unita.giorni", { n: numero(giorni) })
    : dice("unita.ore", { n: numero(ore, 1) });
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
  a.setAttribute("aria-label", dice("a11y.banda", { hz: NOMI_BANDE[i] }));
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
/* Il profilo d'esordio porta una CHIAVE e non una parola: la lista si ridisegna
   a ogni cambio di lingua, e «piatto» scritto qui resterebbe italiano. Quelli
   che si salvano dopo, invece, sono numerati — «profilo 2» — e il numero non ha
   bisogno di traduzione. */
const PROFILI = [{ nome: "banco.piatto", v: [0, 0, 0, 0, 0, 0, 0, 0] }];
const selProfilo = el("profilo");
function elencaProfili() {
  selProfilo.innerHTML = "";
  PROFILI.forEach((p, i) => {
    const o = document.createElement("option");
    o.value = String(i);
    o.textContent = p.nome ? dice(p.nome) : dice("banco.profiloN", { n: numero(p.n) });
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
  PROFILI.push({ n: PROFILI.length, v: EQ_DB.slice() });
  elencaProfili();
  selProfilo.value = String(PROFILI.length - 1);
});
elencaProfili();

/* --------------------------------------------------------- 03 banco · mixer
   Quattro aste, tutte e quattro un livello del banco. Quella dei tessuti SCOSTA il
   canale: il guadagno vero è la somma fra questa e `tLivello`, che è il
   carattere della classe e sta nella sua colonna. L'asta è il missaggio, il
   filetto è la musica — un mood scrive il secondo e non tocca il primo.

   SOTTO LE TRE SORGENTI C'È IL LORO ON, e sta qui e non nella testata perché
   accendere e spegnere una sorgente è una decisione di missaggio: la si prende
   guardando l'asta che la dosa, non in cima al foglio accanto alla lingua.
   Premuto vuol dire acceso, come il tasto ON di un canale su un banco vero, e
   all'apertura lo sono tutti e tre. SPEGNERE NON È UNA PAUSA E NON È UN MUTO: cicli
   e ricambio avanzano comunque, e riaccendendo non si ritrova quello che si era
   lasciato ma quello che sarebbe successo. L'uscita non ne ha uno: spegnerla
   sarebbe la pausa, che sta già nella testata. */
const CANALI_MIXER = [
  { et: "mix.frasi",   dai: () => LIVELLI.frasi,  metti: (v) => { LIVELLI.frasi = v; if (banco) banco.livello("frasi", v); }, min: -24, max: 6,
    acceso: { dai: () => frasiOn, metti: (v) => { frasiOn = v; } } },
  { et: "mix.tessuti", dai: () => LIVELLI.tessuti,
    metti: (v) => { LIVELLI.tessuti = v; if (banco) rileggiTarature(); }, min: -24, max: 6,
    acceso: { dai: () => tessutiOn, metti: (v) => { tessutiOn = v; } } },
  { et: "mix.paesaggio", dai: () => LIVELLI.paesaggio,
    metti: (v) => { LIVELLI.paesaggio = v; if (banco) banco.livello("paesaggio", v); }, min: -24, max: 6,
    acceso: { dai: () => paesaggioOn, metti: (v) => { paesaggioOn = v; } } },
  { et: "mix.uscita",  dai: () => LIVELLI.uscita, metti: (v) => { LIVELLI.uscita = v;
      if (banco && running) banco.uscita.gain.setTargetAtTime(Math.pow(10, v / 20), ctx.currentTime, 0.1); },
    min: -24, max: 0 },
];

CANALI_MIXER.forEach((c) => {
  const cella = document.createElement("div");
  cella.className = "fader";
  const a = document.createElement("input");
  a.type = "range"; a.className = "verticale";
  a.min = c.min; a.max = c.max; a.step = 0.5; a.value = c.dai();
  const et = document.createElement("span");
  et.className = "fl";
  const val = document.createElement("span");
  val.className = "vl";
  const mostra = () => { val.textContent = dB(c.dai()); };
  a.addEventListener("input", () => { c.metti(Number(a.value)); mostra(); });
  cella.append(a, et, val);

  let on = null;
  if (c.acceso) {
    on = document.createElement("button");
    on.type = "button"; on.className = "tasto";
    on.setAttribute("aria-pressed", String(c.acceso.dai()));
    on.addEventListener("click", () => {
      c.acceso.metti(!c.acceso.dai());
      on.setAttribute("aria-pressed", String(c.acceso.dai()));
    });
    cella.append(on);
  }
  c.rinomina = () => {
    et.textContent = dice(c.et);
    a.setAttribute("aria-label", dice("a11y.livello", { canale: dice(c.et) }));
    if (on) {
      on.textContent = dice("mix.on");
      on.setAttribute("aria-label", dice("a11y.accensione", { canale: dice(c.et) }));
    }
  };
  c.rinomina();
  el("faders").appendChild(cella);
  c.input = a; c.mostra = mostra; c.on = on;
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
    el("etichettaPresa").textContent = dice("banco.registra");
    el("formato").textContent = salvaComeWav(buf)
      ? numero(buf.duration, 1) + " s salvati"
      : "non è arrivato niente";
    return;
  }
  try {
    await avviaPresa();
    btnPresa.setAttribute("aria-pressed", "true");
    el("etichettaPresa").textContent = dice("banco.fermaSalva");
    el("formato").textContent = dice("banco.formato");
    orologioPresa = setInterval(() => {
      const s = secondiRegistrati();
      el("cronometro").textContent = mmss(s);
      if (s >= SESSIONE_MAX - 0.5) btnPresa.click();     // il tetto si ferma da sé
    }, 200);
  } catch (e) {
    el("formato").textContent = dice("banco.presaNegata");
  }
});

cursore("durata", "vDurata", {
  valore: (x) => x, scrivi: () => {}, crudo: () => Number(el("durata").value),
  testo: (v) => numero(v) + "′",
});

btnEsporta.addEventListener("click", async () => {
  const sec = Number(el("durata").value) * 60;
  btnEsporta.disabled = true;
  el("esito").textContent = dice("banco.rendo");
  // Un giro di eventi prima di partire, o l'etichetta non fa in tempo a
  // comparire: il rendering tiene occupato il thread principale.
  await new Promise((r) => setTimeout(r, 30));
  try {
    const t0 = performance.now();
    const buf = await esporta(sec);
    salvaComeWav(buf);
    el("esito").textContent = numero((performance.now() - t0) / 1000, 1) + " s → " +
                              numero(sec / 60) + "′";
  } catch (e) {
    el("esito").textContent = dice("banco.nonFatta");
  }
  btnEsporta.disabled = false;
});

/* La tavola come immagine. È l'unica esportazione che non passa per il suono:
   il canvas sa già disegnarsi, e quello che si vede è quello che si porta via. */
el("esportaPng").addEventListener("click", () => {
  const tela = el("tavola");
  tela.toBlob((b) => {
    if (!b) { el("misuraPng").textContent = dice("banco.nonFatta"); return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = "hiroshi-" + new Date().toISOString().slice(0, 16).replace(/[:T]/g, "") + ".png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    el("misuraPng").textContent = tela.width + " × " + tela.height;
  }, "image/png");
});

/* -------------------------------------------------------- 04 paesaggio · materia
   Le due porte da cui entra la materia: un file scelto a mano e il microfono.
   Da qui in poi sono la stessa cosa — un buffer con un nome — e il paesaggio
   non sa da quale delle due sia arrivato. */
const selMateria = el("materia");
function aggiornaMaterie() {
  selMateria.innerHTML = "";
  if (!materiali.length) {
    const o = document.createElement("option");
    o.value = "-1"; o.textContent = VUOTO;
    o.setAttribute("aria-label", dice("pae.nienteAncora"));
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
  el("cattura").textContent = dice("pae.leggo");
  try {
    await caricaFile(assicuraContesto(), f);
    aggiornaMaterie();
    el("cattura").textContent = "";
  } catch (err) {
    el("cattura").textContent = dice("pae.nonLeggo");
  }
  e.target.value = "";
});

const btnReg = el("registra");
let presa = null, flusso = null, orologioMic = null;

/* PERCHÉ IL MICROFONO NON SI APRE, detto per nome. Prima ogni errore diventava
   «microfono negato», e un permesso rifiutato, un microfono che manca, uno tenuto
   da un'altra applicazione e un browser che il microfono a questa pagina non lo dà
   sembravano la stessa cosa — mentre si riparano in quattro posti diversi. Le
   frasi sono corte perché stanno nella targhetta accanto al tasto; l'errore vero,
   col suo nome, va anche in console. */
function erroreMicrofono(err) {
  const nome = err && err.name;
  if (!navigator.mediaDevices || nome === "NotSupportedError" || nome === "TypeError") return "pae.micNonQui";
  if (nome === "NotAllowedError" || nome === "SecurityError") return "pae.negato";
  if (nome === "NotFoundError" || nome === "OverconstrainedError") return "pae.micAssente";
  if (nome === "NotReadableError" || nome === "AbortError") return "pae.micOccupato";
  return "pae.micGuasto";
}
btnReg.addEventListener("click", async () => {
  if (presa) {
    const buf = presa.chiudi();
    presa = null;
    clearInterval(orologioMic);
    if (flusso) { flusso.getTracks().forEach((t) => t.stop()); flusso = null; }
    btnReg.setAttribute("aria-pressed", "false");
    el("etichettaRegistra").textContent = dice("pae.microfono");
    if (buf && buf.length) {
      aggiungiMateria("microfono " + (materiali.filter((m) => /^microfono/.test(m.nome)).length + 1), buf);
      aggiornaMaterie();
      el("cattura").textContent = "";
    } else {
      el("cattura").textContent = dice("pae.nienteArrivato");
    }
    return;
  }
  try {
    const c = assicuraContesto();
    if (c.state === "suspended") await c.resume();
    flusso = await apriMicrofono();
    presa = await apriCattura(c, c.createMediaStreamSource(flusso), 1, MICROFONO_MAX);
    btnReg.setAttribute("aria-pressed", "true");
    el("etichettaRegistra").textContent = dice("pae.ferma");
    // Al tetto la presa si ferma da sé, come la registrazione del banco: prima
    // smetteva di raccogliere in silenzio mentre il tasto diceva ancora «Ferma».
    orologioMic = setInterval(() => {
      if (!presa) return;
      el("cattura").textContent = numero(presa.secondi, 1) + " s";
      if (presa.pieno) btnReg.click();
    }, 200);
  } catch (err) {
    console.warn("microfono:", err && err.name, err && err.message);
    el("cattura").textContent = dice(erroreMicrofono(err));
    // Se il flusso si era aperto e il guasto è venuto dopo, il microfono va
    // chiuso: altrimenti resterebbe acceso, con la sua spia, senza registrare.
    if (flusso) flusso.getTracks().forEach((t) => t.stop());
    presa = null; flusso = null;
  }
});

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
  if (!ctx) { effettiviFrasi(); effettiviTessuti(); effettiviPaesaggio(); }

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
  const t = ctx ? ctx.currentTime : 0;
  if (running && avvioSessione === null) avvioSessione = t;
  el("sessione").textContent = mmss(running ? t - (avvioSessione || 0) : 0);
  el("quinteFatte").textContent = String(passiQuinta);
  el("prossima").textContent = minsec(Math.max(0, prossimaQuinta - t));
  el("tonalita").textContent = nomeNota(tonalita());
  // Le note in uso, dalla tonica in su nell'ordine della scala: sul circolo sono
  // un arco, qui si leggono. I nomi vengono da `nomeNota`, quindi dalla lingua.
  el("collezione").textContent = GRADI.map((g) => nomeNota((tonalita() + g) % 12)).join(" ");
  scriviInfluenze();

  const mat = materiaCorrente();
  if (mat) {
    const seg = segmento();
    el("vSegmento").textContent = minsec(seg.a) + " → " + minsec(seg.b) +
      "  ·  " + numero(seg.durata * effGP.rallenta / 60, 1) + "′ di velo";
  } else {
    el("vSegmento").textContent = "—";
  }
  /* Il baricentro si legge in GRADI della collezione, non nel −1..1 in cui la
     deriva lo tiene: «+1,8» vuol dire che la finestra sul campo si è spostata
     di quasi due gradi verso l'alto, ed è un numero che si può contare sulla
     scala. Il fattore è lo stesso che usa `altezza()`. */
  el("vBaricentro").textContent = (deriva.centro >= 0 ? "+" : "") +
    numero(deriva.centro * AMPIEZZA_CENTRO, 1);

  el("piedeMano").textContent = MANI.length
    ? dice("piede.aMano", { elenco: MANI.join(", ") })
    : dice("piede.legenda");

  el("piedeStato").textContent =
    dice("piede.stato", {
      stato:    dice(running ? "piede.inAscolto" : "piede.fermo"),
      nota:     nomeNota(tonalita()),
      timbro:   nomeTimbro(timbroFrasi),
      tenuto:   nomeTenuto(timbroTessuti),
      ora:      nomeOra(tavolozzaOraria(oraCorrente()).nome),
      stagione: nomeStagione(tavolozzaStagionale(meseCorrente()).nome),
    });

  setTimeout(battito, 33);
}

allinea();
aggiornaLinee();
aggiornaMaterie();
battito();
