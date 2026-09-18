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

/* ------------------------------------------------------ che cosa si porta via
   QUATTRO MODI, e cambiano solo DOVE si attaccano le prese. Il file unico è la
   seduta come si è sentita; il multitraccia sono le stesse sorgenti prima che
   la somma le mescoli, per rimissarle altrove.

   LA STANZA HA UNA TRACCIA SUA, e non è una comodità: il riverbero del banco è
   una mandata comune a tutti e tre i canali — la stanza è una sola, ed è una
   regola — quindi la sua coda non appartiene a nessuna delle tre sorgenti.
   Senza quella traccia il multitraccia suonerebbe più asciutto del mix, e chi
   lo apre in un altro programma non saprebbe che cosa gli manca.

   SOMMANDO le tracce delle sorgenti e la stanza si ritrova l'uscita PRIMA di
   colore d'insieme, equalizzatore e limitatore: quei tre stanno sulla somma e
   non su un canale, quindi nel multitraccia non ci sono. Chi vuole anche quello
   prende «tutto», che aggiunge il mix finale come riferimento. */
const TRACCE = {
  mix:      ["mix"],
  sorgenti: ["frasi", "tessuti", "paesaggio"],
  stanza:   ["frasi", "tessuti", "paesaggio", "stanza"],
  tutto:    ["frasi", "tessuti", "paesaggio", "stanza", "mix"],
};
let modoTracce = "mix";

/* Dove si attacca la presa di ciascuna traccia. Il MIX sta dopo il limitatore e
   il saturatore, cioè dove il segnale è quello che esce davvero: registrare
   prima vorrebbe dire un file che clippa dove l'ascolto non clippava, e questo
   studio registra proprio perché un file che clippa non si riascolta, si rifà.
   Le SORGENTI stanno dopo il loro cursore di livello e prima della somma: le
   mani sul mixer restano nel file, perché sono successe, ma le tracce non si
   coprono a vicenda. */
function puntoDi(nome) {
  if (nome === "mix") return banco.uscita;
  if (nome === "stanza") return banco.ritornoStanza;
  const c = banco.canali[nome];
  return c ? c.livello : null;
}

/* IL TETTO È DI MEMORIA, non di minuti. Tutto sta in RAM — un quarto d'ora di
   stereo a 48 kHz in virgola mobile sono circa 350 MB — quindi con cinque
   tracce i minuti si dividono per cinque. Un tetto uguale in tutti i modi
   sarebbe un gigabyte e mezzo, cioè una pagina che esaurisce la memoria e
   perde la registrazione proprio quando la si ferma. */
function tettoSessione(modo) {
  return Math.round(SESSIONE_MAX / TRACCE[modo || modoTracce].length);
}

let prese = null;                     // [{ nome, presa }] mentre si registra
let iniziataA = 0;

function stoRegistrando() { return prese !== null; }

function secondiRegistrati() {
  return prese && prese.length ? prese[0].presa.secondi : 0;
}

/* Le prese si aprono TUTTE PRIMA che cominci a scorrere il tempo, una dopo
   l'altra: `apriCattura` è asincrona solo la prima volta per contesto — carica
   il modulo del worklet — quindi le altre partono nello stesso istante. Un
   avvio scaglionato sposterebbe le tracce l'una rispetto all'altra, che in un
   multitraccia è l'unico difetto che non si può correggere dopo. */
async function avviaPresa() {
  if (prese) return false;
  costruisciMotore();
  if (ctx.state === "suspended") await ctx.resume();
  const tetto = tettoSessione();
  const aperte = [];
  for (const nome of TRACCE[modoTracce]) {
    const punto = puntoDi(nome);
    if (punto) aperte.push({ nome, presa: await apriCattura(ctx, punto, 2, tetto) });
  }
  if (!aperte.length) return false;
  prese = aperte;
  iniziataA = ctx.currentTime;
  return true;
}

/* Chiude le prese e restituisce `[{ nome, buffer }]`, o un elenco vuoto se non
   è arrivato niente — cosa che succede fermando nello stesso istante in cui si
   è cominciato. Non salva da sé: chi chiama decide se salvare o buttare. */
function fermaPresa() {
  if (!prese) return [];
  const fuori = prese.map(({ nome, presa }) => ({ nome, buffer: presa.chiudi() }))
                     .filter((t) => t.buffer && t.buffer.length);
  prese = null;
  return fuori;
}

/* L'ESPORTAZIONE FUORI TEMPO REALE NON HA PIÙ UN COMANDO. Il rendering resta nel
   motore, `rendiOffline()` in `motore.js`, e `prova.mjs` lo percorre a ogni corsa:
   è lì che si verifica che il wav suoni come l'ascolto. Quello che è caduto è la
   riga «Traccia wav» del banco, insieme alla tavola in png e alla scena. Se un
   giorno torna, il comando ricostruisce `costruisciMotore()` PRIMA del render:
   senza, un'esportazione fatta prima di aver mai premuto Ascolta partirebbe da un
   modello che nessun `passo` ha mai toccato. */

/* Il wav di tutte le tracce passa di qui, così il formato è uno solo e non può
   divergere. Il file unico tiene il nome di sempre; in multitraccia ciascuno si
   porta il nome della sua sorgente dopo la data, così i file di una seduta
   restano vicini in una cartella ordinata per nome.

   I SALVATAGGI SONO SCAGLIONATI di un quarto di secondo. Cinque `click()` nello
   stesso istante il browser li prende per uno solo e ne lascia cadere quattro;
   e la prima volta chiede il permesso di scaricare più file, che è una domanda
   sola per tutta la seduta. */
function salvaSessione(tracce) {
  if (!tracce || !tracce.length) return 0;
  const unico = tracce.length === 1;
  tracce.forEach(({ nome, buffer }, i) => {
    const file = scriviWav(buffer, 24);
    const come = nomeSessione("wav", unico ? "" : nome);
    if (!i) salvaFile(file, come);
    else setTimeout(() => salvaFile(file, come), i * 250);
  });
  return tracce.length;
}
