/* =============================================================================
   HIROSHI · tavola.js — i comandi, per ora quelli minimi

   Provvisorio: qui ci sarà la tavola disegnata — i due quadranti, le corone,
   il banco, la fascia dei grani, la deriva. Finché il motore non suona, questo
   file esiste solo per poterlo ascoltare e per vedere che cosa esce davvero
   dall'uscita.

   Una regola che vale già da adesso: i comandi sono elementi HTML nativi, e
   funzionano identici col puntatore, col dito, col tasto Tab e con un lettore
   di schermo. Il disegno, quando arriverà, sarà puro display: non ascolterà
   nulla. Nel canvas di Rada questa scelta è costata fatica ed è quella giusta.
============================================================================= */

const NOMI_TIMBRI = {
  vetro: "Vetro", legno: "Legno", onda: "Onda", soffio: "Soffio",
  corda: "Corda", metallo: "Metallo", canna: "Canna", sabbia: "Sabbia",
};
const NOMI_TESSUTI = {
  bordone: "Bordone", marea: "Marea", attrito: "Attrito", frangia: "Frangia",
  corrente: "Corrente", cavo: "Cavo", brina: "Brina", soglia: "Soglia",
};
const NOMI_NOTE = ["do", "do♯", "re", "mi♭", "mi", "fa", "fa♯", "sol", "la♭", "la", "si♭", "si"];

const el = (id) => document.getElementById(id);

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
}
tendina("timbro",  TIMBRI,  NOMI_TIMBRI,  timbroFrasi,   (v) => { timbroFrasi = v; });
// Il tessuto scelto vale per le TENUTE CHE NASCONO DA ORA: quelle già aperte
// arrivano in fondo con la loro voce. Cambiare timbro a un suono che dura
// quaranta secondi vorrebbe dire sentirlo mutare a metà, che è un taglio.
tendina("tessuto", TESSUTI, NOMI_TESSUTI, timbroTessuti, (v) => { timbroTessuti = v; });

/* ------------------------------------------------------------------ l'ascolto */
const btn = el("ascolto");
let acceso = false;
btn.addEventListener("click", async () => {
  acceso = !acceso;
  await accendi(acceso);
  // L'etichetta dice l'AZIONE, non lo stato: lo stato lo racconta la riga in
  // alto. È la convenzione di Rada e conviene tenerla.
  btn.textContent = acceso ? "Pausa" : "Ascolta";
  el("stato").textContent = acceso ? "in ascolto" : "fermo";
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target === document.body) { e.preventDefault(); btn.click(); }
});

/* ------------------------------------------------------------------ i cursori
   Scrivono su GT, il bersaglio; G ci arriva lisciato in tickParams. Un cursore
   che scrivesse su G farebbe uno scalino, e uno scalino su una frequenza di
   taglio si sente come un clic. */
function cursore(id, chiave, azione, mostra) {
  const input = el(id), targa = el("v" + id.charAt(0).toUpperCase() + id.slice(1));
  input.addEventListener("input", () => {
    const v = Number(input.value);
    targa.textContent = mostra ? mostra(v) : v;
    if (chiave) GT[chiave] = v;
    if (azione) azione(v);
  });
}
cursore("densita", "densita");
cursore("addensamento", "addensamento");
cursore("registro", "registro");
cursore("spazio", null, (v) => { if (banco) banco.spazio("frasi", v / 100); });

cursore("intreccio", "tIntreccio");
cursore("tregistro", "tRegistro");
cursore("tspazio", null, (v) => { if (banco) banco.spazio("tessuti", v / 100); });

/* I filetti della FORMA scrivono diretto, senza passare da GT. Non è una
   scorciatoia: la forma non entra in nessun suono già cominciato — la legge il
   costruttore quando la tenuta nasce — quindi non c'è nessuno scalino da
   lisciare. I cursori del modello, invece, toccano cose che stanno suonando, e
   quelli devono passare per il bersaglio. */
cursore("apertura",  null, (v) => { FORMA_T.apertura = v / 10; },
        (v) => (v / 10).toFixed(1).replace(".", ",") + " s");
cursore("movimento", null, (v) => { FORMA_T.movimento = v / 100; });
cursore("passo",     null, (v) => { FORMA_T.passo = v / 100; });

/* ------------------------------------------------------------- il ciclo lento
   Non è il ciclo del disegno: è quello che liscia i parametri e aggiorna le
   letture. Gira anche a motore fermo, così i cursori rispondono comunque.

   SMUSSO 0,1164 è il coefficiente 0,94 di Rada a 60 fps ricalcolato per i 30
   giri al secondo di qui: 1 − 0,94². Cambiando la cadenza va rifatto il conto,
   altrimenti la morbidezza cambia con lo schermo. */
const SMUSSO = 0.1164;
let ultimaTesta = effG.addensamento;
let ultimoIntreccio = effGT.intreccio;

function battito() {
  for (const k in GT) G[k] += (GT[k] - G[k]) * SMUSSO;
  effettiviFrasi();
  effettiviTessuti();

  // L'addensamento non si può lisciare dentro il piano: il piano si
  // ricostruisce, e ricostruirlo a ogni giro di questo ciclo sarebbe uno
  // spreco. Si ricostruisce solo quando si è mosso abbastanza da sentirsi.
  if (Math.abs(effG.addensamento - ultimaTesta) > 0.3) {
    ultimaTesta = effG.addensamento;
    ricostruisciPiani(ctx ? ctx.currentTime : null);
  }
  // L'intreccio non sposta le tenute sul giro — quelle stanno dove stanno —
  // ma cambia quante ne vuole ciascuna linea, e di questo si accorge il
  // ricambio. La soglia è più larga di quella delle gocce perché una trama
  // ricostruita di frequente è una trama che non si sente mai finire.
  if (Math.abs(effGT.intreccio - ultimoIntreccio) > 1.5) {
    ultimoIntreccio = effGT.intreccio;
    ricostruisciTrame(ctx ? ctx.currentTime : null);
  }

  if (banco) {
    const p = banco.picchi();
    const dB = Math.max(p[0], p[1]);
    el("picco").textContent = isFinite(dB) ? dB.toFixed(1) + " dB" : "—";
    el("riduzione").textContent = banco.riduzione().toFixed(1) + " dB";
  }
  el("voci").textContent = sommaTessuti.toFixed(2);
  el("compenso").textContent = (20 * Math.log10(compensazione)).toFixed(1) + " dB";
  el("tonalita").textContent = NOMI_NOTE[tonalita()];
  const s = riallineamento(frasi);
  el("riallineo").textContent = Math.floor(s / 3600) + " h " + Math.round((s % 3600) / 60) + "′";

  setTimeout(battito, 33);
}
battito();
