/* =============================================================================
   HIROSHI · registratore.js — portarsi via la sessione

   Due modi di ottenere un file, e non sono lo stesso file.

   LA PRESA DAL VIVO cattura l'uscita del banco mentre suona. Registra ciò che
   si è sentito, comprese le mani: un cursore mosso, un mood cambiato, una
   linea silenziata restano nel file perché sono successi. Dura quanto la si
   lascia durare, quindi quanto si è disposti ad ascoltare.

   L'ESPORTAZIONE FUORI TEMPO REALE non ascolta niente. Rende N secondi dentro
   un OfflineAudioContext molto più in fretta del tempo reale — un quarto d'ora
   in una manciata di secondi — e quello che ne esce non ha nessuna mano
   dentro: è il pezzo che l'apparecchio farebbe da solo, coi comandi dove
   stanno adesso. È possibile per una ragione sola, ed è il patto scritto in
   `motore.js`: `passo(now)` è una funzione del tempo che le viene passato.

   La differenza non è tecnica, è di che cosa si porta via. La prima è una
   registrazione di una seduta; la seconda è una tiratura.

   Tutte e due finiscono nello stesso scrittore di wav, in `cattura.js`, e sono
   file identici per formato: 24 bit, stereo, alla frequenza del contesto.
============================================================================= */

const SESSIONE_MAX = 900;             // secondi: un quarto d'ora, ~350 MB in memoria

let presaSessione = null;
let iniziataA = 0;

function stoRegistrando() { return presaSessione !== null; }

function secondiRegistrati() {
  return presaSessione ? presaSessione.secondi : 0;
}

/* La presa si attacca a `banco.uscita`, cioè DOPO il limitatore e il
   saturatore e prima della destinazione. È il punto in cui il segnale è
   quello che esce davvero dagli altoparlanti: registrare prima del limitatore
   vorrebbe dire un file che clippa dove l'ascolto non clippava, e questo studio
   registra proprio perché un file che clippa non si riascolta, si rifà. */
async function avviaPresa() {
  if (presaSessione) return false;
  costruisciMotore();
  if (ctx.state === "suspended") await ctx.resume();
  presaSessione = await apriCattura(ctx, banco.uscita, 2, SESSIONE_MAX);
  iniziataA = ctx.currentTime;
  return true;
}

/* Chiude la presa e restituisce il buffer, oppure null se non è arrivato
   niente — cosa che succede se si ferma nello stesso istante in cui si è
   cominciato. Non salva da sé: chi chiama decide se salvare, riascoltare o
   buttare. */
function fermaPresa() {
  if (!presaSessione) return null;
  const buf = presaSessione.chiudi();
  presaSessione = null;
  return buf;
}

/* L'esportazione. `rendiOffline` si porta dietro la fotografia del modello e
   lo rimette a posto dopo, quindi si può esportare mentre si ascolta senza
   scardinare la sessione — vedi `istantaneaModello()` in `motore.js`.

   Il contesto vivo va costruito PRIMA, anche se non serve al render: senza,
   una esportazione fatta senza aver mai premuto Ascolta partirebbe da un
   modello che nessun `passo` ha mai toccato. Suonerebbe lo stesso, ma non
   sarebbe quello che si sta ascoltando — e la promessa è proprio quella. */
async function esporta(secondi) {
  costruisciMotore();
  const reso = await rendiOffline(secondi);
  return reso;
}

/* Il wav dell'una e dell'altra passano di qui, così il formato è uno solo e
   non può divergere. */
function salvaComeWav(buffer) {
  if (!buffer || !buffer.length) return false;
  salvaFile(scriviWav(buffer, 24), nomeSessione("wav"));
  return true;
}
