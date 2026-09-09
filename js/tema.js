/* ============================================================== chiaro e scuro
   Sta in un file suo perché lo usano DUE PAGINE lontane fra loro: lo strumento
   e la guida. È lo stesso mestiere — scrivere un attributo sulla radice e
   marcare due pulsanti — e due copie divergerebbero al primo ritocco, come
   sarebbe successo a `cattura.js` fra il microfono e il registratore.

   Il tema sta in un ATTRIBUTO SULLA RADICE, e basta quello: il CSS ci appende
   la palette scura, e la tavola se ne accorge da sé confrontandolo con la
   propria copia a ogni fotogramma — lo stesso modo in cui si accorge che una
   mano ha mosso un cursore. Nessun ascoltatore nel disegno, nessuna chiamata
   dai comandi al disegno.

   All'apertura si CHIEDE AL SISTEMA con `prefers-color-scheme`. È l'unico modo
   di ritrovare il proprio tema senza scrivere niente da nessuna parte, e in un
   progetto che non ha ancora deciso se toccare il disco di chi ascolta non lo
   si decide per un colore — mentre per la LINGUA quella decisione è presa, e la
   ragione sta in cima a `i18n.js`. Il seguito lo si ascolta: se il sistema
   cambia idea a metà seduta, perché è calato il sole, la pagina lo segue — ma
   solo finché nessuno ha scelto a mano, perché dopo la scelta è di chi l'ha
   fatta. */

const TEMI = {};
let temaAMano = false;

function scegliTema(quale) {
  document.documentElement.dataset.tema = quale;
  for (const k in TEMI) TEMI[k].setAttribute("aria-pressed", String(k === quale));
}

function avviaTema(idChiaro, idScuro) {
  TEMI.chiaro = document.getElementById(idChiaro);
  TEMI.scuro = document.getElementById(idScuro);
  for (const k in TEMI) {
    if (!TEMI[k]) continue;
    TEMI[k].addEventListener("click", () => { temaAMano = true; scegliTema(k); });
  }
  const scuro = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
  scegliTema(scuro && scuro.matches ? "scuro" : "chiaro");
  if (scuro && scuro.addEventListener) {
    scuro.addEventListener("change", (e) => {
      if (!temaAMano) scegliTema(e.matches ? "scuro" : "chiaro");
    });
  }
}
