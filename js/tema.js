/* ==================================================================== i temi
   Sta in un file suo perché lo usano DUE PAGINE lontane fra loro: lo strumento
   e la guida. È lo stesso mestiere — scrivere un attributo sulla radice e
   tenere in pari la tendina che lo sceglie — e due copie divergerebbero al primo
   ritocco, come sarebbe successo a `cattura.js` fra il microfono e il
   registratore.

   Il tema sta in un ATTRIBUTO SULLA RADICE, e basta quello: il CSS ci appende
   la palette, e la tavola se ne accorge da sé confrontandolo con la propria
   copia a ogni fotogramma — lo stesso modo in cui si accorge che una mano ha
   mosso un cursore. Nessun ascoltatore nel disegno, nessuna chiamata dai
   comandi al disegno.

   All'apertura si CHIEDE AL SISTEMA con `prefers-color-scheme`. È l'unico modo
   di ritrovare il proprio tema senza scrivere niente da nessuna parte, e in un
   progetto che non ha ancora deciso se toccare il disco di chi ascolta non lo
   si decide per un colore — mentre per la LINGUA quella decisione è presa, e la
   ragione sta in cima a `i18n.js`. Il seguito lo si ascolta: se il sistema
   cambia idea a metà seduta, perché è calato il sole, la pagina lo segue — ma
   solo finché nessuno ha scelto a mano, perché dopo la scelta è di chi l'ha
   fatta.

   I TEMI SONO UNDICI E LI SCEGLIE UNA TENDINA. Due pulsanti stavano in una
   riga, undici parole in fila no; e una tendina è un `select` nativo, che la
   tastiera e un lettore di schermo conoscono già. I NOVE TEMI A COLORI — alba,
   meriggio, crepuscolo, primavera, mietitura, estate, autunno, novembre,
   inverno — NON LI SA DIRE IL SISTEMA: sa dire chiaro o scuro e nient'altro.

   E UNO PUÒ ESSERE IL TEMA D'APERTURA. `TEMA_ESORDIO` lo scrive `colori.mjs`
   leggendo l'etichetta «default» in `colori.md`, che è la fonte di tutte le
   palette. Quando c'è, comanda lui e il sistema non viene più consultato: chi
   ha scritto «default» accanto a un tema ha già risposto alla domanda che si
   farebbe al sistema. Quando è `null` — e di suo lo è — si torna a chiedere
   `prefers-color-scheme` e a seguirlo finché nessuno sceglie a mano.

   In nessuno dei due casi si scrive niente sul disco di chi ascolta: il tema
   d'apertura sta nel codice, cioè nelle mani di chi pubblica, non in una
   preferenza salvata nel browser di chi passa. */

const TEMA_ESORDIO = "inverno";   // lo scrive colori.mjs dall'etichetta «default»

let SCELTA_TEMA = null;
let temaAMano = false;

function scegliTema(quale) {
  document.documentElement.dataset.tema = quale;
  if (SCELTA_TEMA && SCELTA_TEMA.value !== quale) SCELTA_TEMA.value = quale;
}

function avviaTema(idScelta) {
  SCELTA_TEMA = document.getElementById(idScelta);
  if (SCELTA_TEMA) {
    SCELTA_TEMA.addEventListener("change", () => {
      temaAMano = true;
      scegliTema(SCELTA_TEMA.value);
    });
  }
  if (TEMA_ESORDIO) { scegliTema(TEMA_ESORDIO); return; }
  const scuro = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
  scegliTema(scuro && scuro.matches ? "scuro" : "chiaro");
  if (scuro && scuro.addEventListener) {
    scuro.addEventListener("change", (e) => {
      if (!temaAMano) scegliTema(e.matches ? "scuro" : "chiaro");
    });
  }
}
