/* ============================================ il tavolo di lavoro di Hiroshi
   Costruisce i due artboard del canvas di design — chiaro e scuro — PRENDENDOLI
   DALL'APP che gira, invece di ridisegnarli.

   La versione di prima era un secondo disegno, seicento righe di Python che
   rifacevano in SVG quello che `tavola.js` fa in canvas. Aveva un difetto
   strutturale: era una COPIA, e una copia diverge. In una sola sessione si è
   trovata con gli anelli al raggio vecchio, senza gli inserti, e col marchio in
   Times per una virgoletta di troppo — tre bugie che nessuno vedeva perché il
   confronto con l'originale non lo faceva nessuno. Qui l'originale È la fonte:
   si apre `index.html`, lo si lascia suonare finché i quadranti hanno qualcosa
   dentro, e si porta via quello che c'è.

   I COMANDI RESTANO MARKUP VERO — le colonne, le etichette, i valori, i
   cursori, le tendine — con il foglio di stile dell'app attaccato: sono
   esattamente gli elementi dell'app, quindi non possono essere sbagliati, e
   nell'editor si spostano e si riscrivono. IL DISEGNO diventa un'immagine: un
   canvas 2D non si esporta in vettori senza riscriverlo, ed è la parte che non
   si ritocca sul mockup — quella si cambia in `tavola.js` e si rigenera di qui.

   Si rifà con: node tavolo.mjs                                         */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

/* Nessun percorso scritto a mano, come in `prova.mjs`: l'app è la cartella di
   questo file, gli artboard finiscono in `tavolo/` accanto al loro canvas.json.
   Il primo modo in cui l'ho scritto aveva i percorsi dentro, viveva nella
   cartella temporanea della sessione, ed è sparito con lei. */
const APP = path.dirname(new URL(import.meta.url).pathname);
const QUI = path.join(APP, 'tavolo');
const LARGO = 1440;

/* Il foglio di stile dell'app, con una sola riscrittura, e solo per lo scuro:
   le variabili di quel tema stanno su `:root[data-tema="scuro"]` e dentro un
   artboard nessuno può scrivere quell'attributo sulla radice. Diventano un
   secondo `:root`, che essendo più in basso vince — un artboard è un documento
   suo e ha un tema solo, quindi non c'è niente da alternare.

   Marcare il div del foglio invece della radice NON basta, ed è il primo modo
   in cui l'ho scritto: le variabili scendono per eredità e sul foglio erano
   giuste, ma `color` e `background` stanno su `body` — che sta FUORI dal
   foglio — e lì si erano già risolti sui valori chiari. L'artboard veniva
   fuori con l'inchiostro scuro sulla carta chiara e le variabili scure sotto,
   cioè giusto in tutto tranne che a vedersi. */
function stile(tema) {
  const css = fs.readFileSync(path.join(APP, 'css/style.css'), 'utf8');
  return tema === 'scuro' ? css.replace(':root[data-tema="scuro"]', ':root') : css;
}

/* Quello che il browser non mette nell'HTML da sé. `outerHTML` serializza gli
   ATTRIBUTI, non le proprietà: un cursore mosso a mano ha `.value` giusto e
   `value=` fermo al valore d'esordio, una spunta tolta resta `checked`, e la
   voce scelta di una tendina non è marcata da nessuna parte. Senza questo giro
   l'artboard mostrerebbe l'apertura dell'app invece dello stato che si è
   preparato. */
const FISSA = () => {
  document.querySelectorAll('input').forEach((i) => {
    if (i.type === 'checkbox' || i.type === 'radio') {
      if (i.checked) i.setAttribute('checked', ''); else i.removeAttribute('checked');
    } else {
      i.setAttribute('value', i.value);
    }
  });
  document.querySelectorAll('select').forEach((s) => {
    [...s.options].forEach((o, k) => {
      if (k === s.selectedIndex) o.setAttribute('selected', ''); else o.removeAttribute('selected');
    });
  });
};

/* Il canvas al posto suo, come immagine, con la stessa geometria che aveva. */
const SOSTITUISCI_TELA = (nomeFile) => {
  const t = document.getElementById('tavola');
  const img = document.createElement('img');
  img.setAttribute('src', nomeFile);
  img.setAttribute('alt', '');
  img.setAttribute('style',
    'position:absolute;left:0;top:0;width:100%;pointer-events:none;z-index:0;display:block');
  t.replaceWith(img);
};

function artboard(css, foglio) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>
${css}
body{margin:0}
</style>
</helmet>
${foglio}
</x-dc>
</body>
</html>
`;
}

/* `HIROSHI_CHROMIUM` resta per chi ha un Chromium suo, come nella prova. */
/* `HIROSHI_CHROMIUM` resta per chi ha un Chromium suo, come nella prova. Il
   flag dell'autoplay serve perché il contesto audio parta senza un gesto: qui
   il gesto non c'è, e senza suono i quadranti restano vuoti. */
const b = await chromium.launch({
  ...(process.env.HIROSHI_CHROMIUM ? { executablePath: process.env.HIROSHI_CHROMIUM } : {}),
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const errori = [];

for (const tema of ['chiaro', 'scuro']) {
  const p = await b.newPage({ viewport: { width: LARGO, height: 1000 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => errori.push(tema + ': ' + e.message));
  /* L'immagine che sostituisce il canvas la si cerca accanto a `index.html`,
     dove non c'è: il browser lo dice, e non è un difetto — la sostituzione
     avviene DOPO la presa, sulla pagina che stiamo per buttare via. Si scarta
     per nome, così un errore vero non si perde in mezzo. */
  p.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (m.text().includes('net::ERR_FILE_NOT_FOUND')) return;
    errori.push(tema + ': ' + m.text());
  });
  await p.goto('file://' + path.join(APP, 'index.html'));
  await p.click('#ascolto');
  if (tema === 'scuro') await p.selectOption('#tema', 'scuro');

  /* Una materia da mostrare nel paesaggio: l'app all'apertura è muta per
     costruzione, e una fascia vuota non direbbe niente di come si legge. Sono
     gli stessi quattro toni che usa `prova.mjs`. */
  await p.evaluate(() => {
    const c = ctx, n = Math.floor(c.sampleRate * 6);
    const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) {
      const t = i / c.sampleRate, f = [220, 330, 440, 550][Math.floor(t / 1.5) % 4];
      d[i] = Math.sin(2 * Math.PI * f * t) * 0.4 * (0.4 + 0.6 * Math.sin(t * 3));
    }
    aggiungiMateria('quattro toni', buf); aggiornaMaterie();
  });
  // Un inserto per classe, o le tre manopole sarebbero spente e senza nome.
  await p.selectOption('#effGocce', 'eco');
  await p.selectOption('#effTessuti', 'coro');
  // E un equalizzatore non piatto: a zero la curva è una riga dritta.
  await p.evaluate(() => {
    [4, -6, 3, 0, -4, 7, -2, 5].forEach((dB, i) => {
      ASTE[i].value = String(dB);
      ASTE[i].dispatchEvent(new Event('input'));
    });
  });

  // Il tempo che serve ai quadranti per riempirsi di gocce e tenute.
  await p.waitForTimeout(24000);

  /* WEBP E NON PNG, e a 0,95. Il disegno è un foglio quasi vuoto attraversato
     da fili sottili su fondo trasparente: in PNG sono 194 KB di rumore
     d'antialiasing, in webp a qualità 95 sono 86 KB con la stessa riga. Il
     senza-perdite qui è la scelta peggiore delle tre — 685 KB — perché webp
     lossless su tratti sfumati fa il contrario di quello che promette. Sotto
     0,9 comincia a sfrangiare i capelli, e i capelli sono tutto il disegno.

     Conta perché ogni Save ripubblica la pagina intera: due immagini in meno
     di trecento kilobyte in tutto invece di ottocento. */
  const dati = await p.evaluate(() => document.getElementById('tavola').toDataURL('image/webp', 0.95));
  const nomeImmagine = 'tavola-' + tema + '.webp';
  fs.writeFileSync(path.join(QUI, nomeImmagine),
                   Buffer.from(dati.split(',')[1], 'base64'));

  await p.evaluate(FISSA);
  await p.evaluate(SOSTITUISCI_TELA, nomeImmagine);
  const foglio = await p.evaluate(() => document.querySelector('.foglio').outerHTML);
  const alto = await p.evaluate(() => Math.ceil(document.querySelector('.foglio').getBoundingClientRect().height));

  const nome = tema === 'chiaro' ? 'Main.dc.html' : 'Scuro.dc.html';
  fs.writeFileSync(path.join(QUI, nome), artboard(stile(tema), foglio));
  /* L'altezza del foglio va confrontata col riquadro dichiarato in canvas.json:
     l'artboard non ridimensiona e non ritaglia, quindi un foglio cresciuto
     oltre il suo riquadro si vedrebbe tagliato in fondo e basta. */
  const riquadro = JSON.parse(fs.readFileSync(path.join(QUI, 'canvas.json'), 'utf8'))
    .artboards.find((a) => a.file === nome);
  if (riquadro && alto > riquadro.h)
    console.error('  il foglio è alto ' + alto + ' e il riquadro di ' + nome +
                  ' è ' + riquadro.h + ': allarga la `h` in canvas.json');
  console.log(nome, Math.round(fs.statSync(path.join(QUI, nome)).size / 1024) + ' KB',
              '· ' + nomeImmagine, Math.round(fs.statSync(path.join(QUI, nomeImmagine)).size / 1024) + ' KB',
              '· alto ' + alto);
  await p.close();
}

console.log(errori.length ? 'ERRORI: ' + errori.join(' | ') : 'nessun errore di pagina');
await b.close();
