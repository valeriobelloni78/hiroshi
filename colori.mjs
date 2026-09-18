/* =============================================================================
   HIROSHI · colori.mjs — le palette entrano ed escono da `colori.md`

   `colori.md` È LA FONTE DELLE UNDICI PALETTE. Si scrivono lì, in tabelle che
   si leggono a occhio, e questo file le riversa nel CSS.

   PERCHÉ NON LE LEGGE L'APP. Su `file://` il CORS blocca ogni `fetch`, e il
   doppio clic su `index.html` è la promessa che questo progetto fa: un foglio
   di stile che andasse a prendersi i colori da un file di testo lascerebbe la
   tavola senza palette proprio nel caso che deve reggere. Per la stessa ragione
   i dizionari sono oggetti JavaScript e non JSON caricati. Quindi la strada è
   l'opposta: si scrive il markdown, si lancia questo, e il CSS — che l'app
   legge — si aggiorna.

     node colori.mjs            da `colori.md` al CSS e al tema d'apertura
     node colori.mjs --leggi    rifà `colori.md` dal CSS, com'è adesso

   NON RISCRIVE I BLOCCHI, cambia i valori dentro di loro: nel CSS, accanto a
   ogni tinta, c'è il conto che l'ha decisa — i rapporti di contrasto, le misure
   sullo schermo, le ragioni. Un generatore che rifacesse i blocchi da capo
   butterebbe via la sola cosa che non si può ricavare dai numeri.

   L'ETICHETTA «default» accanto al nome di un tema dice quale si apre. Finisce
   in `TEMA_ESORDIO`, dentro `js/tema.js`; senza etichetta resta `null` e
   l'apertura torna a chiedere `prefers-color-scheme`, come ha sempre fatto.
============================================================================= */

import { readFileSync, writeFileSync } from "node:fs";

const CSS = new URL("./css/style.css", import.meta.url);
const MD = new URL("./colori.md", import.meta.url);
const TEMA = new URL("./js/tema.js", import.meta.url);

/* I nomi leggibili, che servono solo a scrivere il file: in lettura comanda il
   token, perché è lui che finisce nel CSS. Un token senza nome qui si scrive
   con il proprio, che è meglio di un file che si rifiuta di nascere. */
const NOMI = {
  "--carta": "carta", "--vetro": "vetro", "--inchiostro": "inchiostro",
  "--inchiostro-2": "inchiostro tenue", "--grigio": "etichette", "--muto": "muto",
  "--filo": "filo", "--filo-2": "filo tenue", "--spento": "spento",
  "--ambra": "ambra · accento", "--su-ambra": "cifre sull'ambra",
  "--retino": "grana della carta",
  "--piano-gocce": "gocce", "--piano-tessuti": "tessuti", "--piano-effetti": "effetti",
  "--piano-banco": "banco", "--piano-deriva": "deriva", "--piano-influenze": "influenze",
};

/* L'ordine in cui i temi compaiono nel file: quello della tendina, che è quello
   in cui li incontra chi li sceglie — non l'ordine in cui sono stati scritti. */
const ORDINE = ["chiaro", "scuro", "alba", "meriggio", "crepuscolo", "primavera",
                "mietitura", "estate", "autunno", "novembre", "inverno"];

/* Un valore è un colore se è un esadecimale o il rimando a un'altra tinta.
   Serve a lasciare fuori `--sans`, `--mono` e le misure dei piani senza doverne
   tenere una lista: quello che non è un colore si riconosce da sé. */
const colore = (v) => /^#[0-9a-f]{3,8}$/i.test(v) || /^var\(--[a-z0-9-]+\)$/i.test(v);

/* IL RETINO È UN COLORE TRAVESTITO DA IMMAGINE: la grana della carta è un
   `url(data:image/svg+xml…)` con dentro un cerchietto, e l'unica cosa che cambia
   da un tema all'altro è il suo `fill`. Qui si mostra come colore e si rimette
   dentro l'url, che resta quello che era: riscriverlo per intero vorrebbe dire
   ricopiare un svg in un file di palette, cioè invitare a sbagliarlo. */
const RETINO = /fill='%23([0-9a-fA-F]{6})'/;

/* I blocchi del CSS, uno per tema. Il chiaro è `:root` senza attributo — ce ne
   sono altri più avanti nel foglio, e si riconosce perché è quello che dichiara
   la carta. */
function blocchi(css) {
  const trovati = {};
  const re = /^:root(?:\[data-tema="([a-z]+)"\])?\{\n([\s\S]*?)^\}/gm;
  let m;
  while ((m = re.exec(css))) {
    const nome = m[1] || (m[2].includes("--carta:") ? "chiaro" : null);
    if (!nome) continue;
    trovati[nome] = { da: m.index, a: m.index + m[0].length, corpo: m[2] };
  }
  return trovati;
}

function tinteDi(corpo) {
  const fuori = [];
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(corpo))) {
    const v = m[2].trim();
    if (colore(v)) fuori.push([m[1], v]);
    else if (m[1] === "--retino" && RETINO.test(v)) fuori.push([m[1], "#" + RETINO.exec(v)[1]]);
  }
  return fuori;
}

/* ------------------------------------------------------------ dal CSS al file */
function scriviMarkdown() {
  const css = readFileSync(CSS, "utf8");
  const b = blocchi(css);
  const esordio = /const TEMA_ESORDIO = ("([a-z]+)"|null)/.exec(readFileSync(TEMA, "utf8"));
  const quale = esordio && esordio[2] ? esordio[2] : null;

  const testa = [
    "# I colori di Hiroshi",
    "",
    "Questo file è la FONTE delle undici palette. Si scrive qui, poi si lancia",
    "",
    "```bash",
    "node colori.mjs",
    "```",
    "",
    "e i valori finiscono in `css/style.css`, che è quello che l'app legge. L'app non",
    "legge questo file: su `file://` il CORS blocca ogni richiesta, e il doppio clic su",
    "`index.html` deve funzionare anche senza rete. Il verso opposto — rifare questo",
    "file dal CSS, dopo averlo ritoccato a mano — è `node colori.mjs --leggi`.",
    "",
    "**L'etichetta «default»** accanto al nome di un tema dice quale si apre all'avvio.",
    "Se non ce l'ha nessuno, all'apertura si chiede al sistema operativo se vuole",
    "chiaro o scuro, come è sempre stato. L'etichetta sta su un tema solo.",
    "",
    "I valori sono esadecimali, oppure il rimando a un'altra tinta dello stesso tema",
    "— `var(--vetro)` vuol dire «lo stesso del vetro», e ritoccando il vetro si",
    "ritoccano tutti insieme. Un pannello che qui non compare prende quello che il",
    "tema gli dà altrove: nei temi che non colorano i piani, il vetro.",
    "",
    "Le ragioni dei numeri — i rapporti di contrasto, le misure fatte sullo schermo —",
    "stanno nei commenti del CSS accanto a ogni blocco, e non si perdono: questo",
    "strumento cambia i valori, non riscrive i blocchi.",
    "",
    "---",
  ];

  const pezzi = [];
  for (const nome of ORDINE) {
    if (!b[nome]) continue;
    const tinte = tinteDi(b[nome].corpo);
    const piani = tinte.filter(([t]) => t.startsWith("--piano-"));
    const toni = tinte.filter(([t]) => !t.startsWith("--piano-"));
    pezzi.push("", "## " + nome + (nome === quale ? " — default" : ""), "");
    if (piani.length) {
      pezzi.push("| pannello | token | colore |", "|---|---|---|");
      for (const [t, v] of piani) pezzi.push("| " + (NOMI[t] || t) + " | " + t + " | " + v + " |");
      pezzi.push("");
    }
    if (toni.length) {
      pezzi.push("| tono | token | colore |", "|---|---|---|");
      for (const [t, v] of toni) pezzi.push("| " + (NOMI[t] || t) + " | " + t + " | " + v + " |");
    }
  }

  writeFileSync(MD, testa.concat(pezzi).join("\n").trimEnd() + "\n");
  console.log("colori.md scritto: " + ORDINE.filter((n) => b[n]).length + " temi" +
              (quale ? ", default «" + quale + "»" : ", nessun default"));
}

/* ------------------------------------------------------------ dal file al CSS */
function leggiMarkdown() {
  const righe = readFileSync(MD, "utf8").split("\n");
  const temi = [];
  let corrente = null;
  for (const r of righe) {
    const t = /^##\s+([a-z]+)\s*(.*)$/.exec(r.trim());
    if (t) {
      corrente = { nome: t[1], def: /default/i.test(t[2]), tinte: [] };
      temi.push(corrente);
      continue;
    }
    if (!corrente || !r.trim().startsWith("|")) continue;
    const celle = r.split("|").map((c) => c.trim());
    const token = celle.find((c) => /^--[a-z0-9-]+$/.test(c));
    if (!token) continue;
    const valore = celle[celle.indexOf(token) + 1];
    if (valore && colore(valore)) corrente.tinte.push([token, valore]);
  }
  return temi;
}

function applica() {
  const temi = leggiMarkdown();
  let css = readFileSync(CSS, "utf8");
  let cambiati = 0, aggiunti = 0;
  const ignoti = [];

  for (const tema of temi) {
    const b = blocchi(css)[tema.nome];
    if (!b) { ignoti.push(tema.nome); continue; }
    let corpo = b.corpo;
    for (const [token, valore] of tema.tinte) {
      const re = new RegExp("(" + token + "\\s*:\\s*)([^;]+)(;)");
      if (token === "--retino" && re.test(corpo)) {
        // Del retino si cambia solo il cerchietto dentro l'svg.
        const vecchio = re.exec(corpo)[2];
        const nuovo = vecchio.replace(RETINO, "fill='%23" + valore.slice(1) + "'");
        if (nuovo !== vecchio) cambiati++;
        corpo = corpo.replace(vecchio, nuovo);
        continue;
      }
      if (re.test(corpo)) {
        const prima = re.exec(corpo)[2].trim();
        if (prima !== valore) cambiati++;
        corpo = corpo.replace(re, "$1" + valore + "$3");
      } else {
        // Una tinta che il blocco non aveva: si appende in fondo, con un segno
        // di dove viene. Meglio una riga in più che una palette che mente.
        corpo = corpo.trimEnd() + "\n  " + token + ":" + valore + ";   /* da colori.md */\n";
        aggiunti++;
      }
    }
    css = css.slice(0, b.da) + css.slice(b.da, b.a).replace(b.corpo, corpo) + css.slice(b.a);
  }

  const def = temi.filter((t) => t.def);
  if (def.length > 1) {
    console.error("più di un tema ha l'etichetta «default»: " + def.map((t) => t.nome).join(", "));
    process.exit(1);
  }
  writeFileSync(CSS, css);

  const quale = def.length ? '"' + def[0].nome + '"' : "null";
  const tema = readFileSync(TEMA, "utf8");
  const nuovo = tema.replace(/const TEMA_ESORDIO = (?:"[a-z]+"|null);/, "const TEMA_ESORDIO = " + quale + ";");
  if (nuovo !== tema) writeFileSync(TEMA, nuovo);

  console.log("css/style.css: " + cambiati + " valori cambiati" +
              (aggiunti ? ", " + aggiunti + " aggiunti" : ""));
  console.log("tema d'apertura: " + (def.length ? def[0].nome : "quello che dice il sistema"));
  if (ignoti.length) {
    console.log("temi senza un blocco nel CSS, saltati: " + ignoti.join(", "));
    console.log("un tema nuovo vuole anche una voce nella tendina e i suoi nomi in i18n.js");
  }
}

if (process.argv.includes("--leggi")) scriviMarkdown();
else applica();
