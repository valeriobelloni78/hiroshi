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
const NOMI_NOTE = ["do", "do♯", "re", "mi♭", "mi", "fa", "fa♯", "sol", "la♭", "la", "si♭", "si"];

const el = (id) => document.getElementById(id);

/* --------------------------------------------------------------- la tendina */
const selTimbro = el("timbro");
for (const k of TIMBRI) {
  const o = document.createElement("option");
  o.value = k; o.textContent = NOMI_TIMBRI[k];
  if (k === timbroFrasi) o.selected = true;
  selTimbro.appendChild(o);
}
selTimbro.addEventListener("change", () => { timbroFrasi = selTimbro.value; });

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
function cursore(id, chiave, mostra) {
  const input = el(id), targa = el("v" + id.charAt(0).toUpperCase() + id.slice(1));
  input.addEventListener("input", () => {
    const v = Number(input.value);
    targa.textContent = mostra ? mostra(v) : v;
    if (chiave) GT[chiave] = v;
    if (id === "spazio" && banco) banco.spazio("frasi", v / 100);
  });
}
cursore("densita", "densita");
cursore("addensamento", "addensamento");
cursore("registro", "registro");
cursore("spazio", null);

/* ------------------------------------------------------------- il ciclo lento
   Non è il ciclo del disegno: è quello che liscia i parametri e aggiorna le
   letture. Gira anche a motore fermo, così i cursori rispondono comunque.

   SMUSSO 0,1164 è il coefficiente 0,94 di Rada a 60 fps ricalcolato per i 30
   giri al secondo di qui: 1 − 0,94². Cambiando la cadenza va rifatto il conto,
   altrimenti la morbidezza cambia con lo schermo. */
const SMUSSO = 0.1164;
let ultimaTesta = effG.addensamento;

function battito() {
  for (const k in GT) G[k] += (GT[k] - G[k]) * SMUSSO;
  effettiviFrasi();

  // L'addensamento non si può lisciare dentro il piano: il piano si
  // ricostruisce, e ricostruirlo a ogni giro di questo ciclo sarebbe uno
  // spreco. Si ricostruisce solo quando si è mosso abbastanza da sentirsi.
  if (Math.abs(effG.addensamento - ultimaTesta) > 0.3) {
    ultimaTesta = effG.addensamento;
    ricostruisciPiani(ctx ? ctx.currentTime : null);
  }

  if (banco) {
    const p = banco.picchi();
    const dB = Math.max(p[0], p[1]);
    el("picco").textContent = isFinite(dB) ? dB.toFixed(1) + " dB" : "—";
    el("riduzione").textContent = banco.riduzione().toFixed(1) + " dB";
  }
  el("tonalita").textContent = NOMI_NOTE[tonalita()];
  const s = riallineamento(frasi);
  el("riallineo").textContent = Math.floor(s / 3600) + " h " + Math.round((s % 3600) / 60) + "′";

  setTimeout(battito, 33);
}
battito();
