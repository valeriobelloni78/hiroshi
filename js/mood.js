/* =============================================================================
   HIROSHI · mood.js — i sedici stati dello strumento

   Otto per le gocce, otto per i tessuti, trapiantati da Rada Deriva coi loro
   nomi e coi loro numeri. Un mood non è un preset di timbro: cambia insieme
   **quanto** si sente, **come** si sente e **con che ritmo** — perché in Rada
   la configurazione temporale è parte del carattere quanto lo è il suono. Un
   «vespro» con i periodi della «pioggia» non sarebbe un vespro più lento:
   sarebbe un'altra cosa.

   QUESTO FILE È L'UNICO CHE ATTRAVERSA. Le dipendenze del progetto scorrono in
   una direzione sola — deriva ← linee ← timbri ← tessuti ← mood ← banco ←
   motore ← tavola — e un mood è per sua natura l'oggetto che sta a cavallo:
   scrive i parametri del modello, i periodi delle linee e il nome del timbro.
   Che stia in un file suo è il modo di dire che l'eccezione è una sola e ha un
   posto.

   OGNI TIMBRO COMPARE UNA VOLTA SOLA, in ciascuna delle due tabelle. Non è
   una simmetria decorativa: è la garanzia che girando gli otto pulsanti si
   attraversino davvero tutti e otto i suoni, invece di ritrovarsi tre volte
   nello stesso posto.

   I PERIODI E IL RIALLINEAMENTO. Le due tabelle si scelgono indipendentemente,
   quindi esistono 64 combinazioni e in alcune un periodo delle gocce condivide
   un divisore con uno dei tessuti — «carillon» ha 4, 9, 25 e «seta» ha 8, 9,
   25. La regola scritta in CLAUDE.md («coprimi anche fra le classi») è una
   condizione SUFFICIENTE, non necessaria: quello che va difeso è il tempo di
   riallineamento, e misurato su tutte e 64 le combinazioni il peggiore è di
   **246 ore**, cioè dieci giorni. `prova.mjs` rifà quel conto a ogni corsa e
   fallisce sotto le 24 ore. Chi cambia un periodo guardi lì, non qui.
============================================================================= */

/* ------------------------------------------------------------------- gocce
   `calore` è il vecchio `warmth` di Rada: un numero solo che governa insieme
   la lunghezza della coda, l'inarmonicità, la brillantezza e il peso della
   fondamentale. L'ora del giorno lo inclina di ±18 punti. */
const MOOD_GOCCE = {
  sereno:     { timbro: "vetro",   registro: 45, calore: 70, spazio: 72, densita: 5,  addensamento: 30, periodi: [7, 11, 13, 17]  },
  pioggia:    { timbro: "sabbia",  registro: 60, calore: 55, spazio: 58, densita: 11, addensamento: 45, periodi: [5, 7, 9, 11]    },
  vespro:     { timbro: "onda",    registro: 35, calore: 85, spazio: 85, densita: 3,  addensamento: 22, periodi: [17, 19, 23, 29] },
  carillon:   { timbro: "metallo", registro: 70, calore: 45, spazio: 66, densita: 8,  addensamento: 35, periodi: [4, 9, 17, 25]   },
  arcipelago: { timbro: "corda",   registro: 72, calore: 58, spazio: 80, densita: 3,  addensamento: 18, periodi: [13, 16, 21, 25] },
  collina:    { timbro: "legno",   registro: 40, calore: 75, spazio: 55, densita: 6,  addensamento: 38, periodi: [8, 13, 19, 27]  },
  finestra:   { timbro: "soffio",  registro: 55, calore: 30, spazio: 40, densita: 4,  addensamento: 20, periodi: [9, 14, 23, 25]  },
  nuvola:     { timbro: "canna",   registro: 63, calore: 4,  spazio: 92, densita: 14, addensamento: 64, periodi: [6, 11, 19, 25]  },
};

/* ----------------------------------------------------------------- tessuti
   `apertura` e `chiusura` sono in secondi; `passo` è la velocità del movimento
   interno del tenuto, che ciascuno dei otto interpreta a modo suo — centesimi
   in Bordone, hertz in Frangia, larghezza della scossa in Attrito. `livello` è
   quanto lo sfondo sta sotto al primo piano, e la deriva lo muove di ±9. */
const MOOD_TESSUTI = {
  velo:     { timbro: "corrente", registro: 55, apertura: 3.0, chiusura: 4.3, intreccio: 42, passo: 38, livello: 32, periodi: [9, 16, 25, 31]  },
  fondale:  { timbro: "bordone",  registro: 22, apertura: 3.5, chiusura: 5.0, intreccio: 26, passo: 22, livello: 38, periodi: [31, 37, 41, 43] },
  lino:     { timbro: "attrito",  registro: 38, apertura: 3.2, chiusura: 4.7, intreccio: 78, passo: 30, livello: 28, periodi: [8, 15, 19, 23]  },
  respiro:  { timbro: "frangia",  registro: 66, apertura: 2.6, chiusura: 3.8, intreccio: 20, passo: 52, livello: 30, periodi: [23, 29, 41, 43] },
  bruma:    { timbro: "soglia",   registro: 70, apertura: 2.9, chiusura: 4.1, intreccio: 30, passo: 44, livello: 26, periodi: [31, 37, 43, 47] },
  tenda:    { timbro: "cavo",     registro: 18, apertura: 3.5, chiusura: 5.0, intreccio: 66, passo: 20, livello: 42, periodi: [19, 29, 37, 47] },
  seta:     { timbro: "brina",    registro: 60, apertura: 2.0, chiusura: 3.0, intreccio: 58, passo: 74, livello: 28, periodi: [8, 9, 25, 29]   },
  vela:     { timbro: "marea",    registro: 45, apertura: 3.3, chiusura: 4.8, intreccio: 32, passo: 24, livello: 36, periodi: [31, 41, 47, 53] },
};

/* --------------------------------------------------------------- applicare
   I valori si scrivono SU G E SU GT INSIEME. È l'unico posto del progetto in
   cui si tocca `G` direttamente, ed è voluto: un mood è uno scatto, non un
   gesto. Lasciarlo lisciare da `battito()` vorrebbe dire sentire lo strumento
   scivolare verso il nuovo carattere per due o tre secondi, che è esattamente
   l'effetto di un fondo che si dissolve — cioè il contrario di un cambio di
   scena.

   I periodi invece entrano SUBITO — `target` e `period` insieme — perché il
   materiale viene rigenerato nella stessa mossa: aspettare il giro dopo
   vorrebbe dire un giro di idee nuove sulla durata vecchia. */
function scriviParametri(coppie) {
  for (const k in coppie) { G[k] = coppie[k]; GT[k] = coppie[k]; }
}

function applicaMoodGocce(nome) {
  const m = MOOD_GOCCE[nome];
  if (!m) return false;
  scriviParametri({
    registro: m.registro, calore: m.calore, spazio: m.spazio,
    densita: m.densita, addensamento: m.addensamento,
  });
  timbroFrasi = m.timbro;
  effettiviFrasi();
  frasi.forEach((L, i) => { L.target = L.period = m.periodi[i]; L.idx = 0; });
  frasi.forEach(rigenera);
  return true;
}

function applicaMoodTessuti(nome) {
  const m = MOOD_TESSUTI[nome];
  if (!m) return false;
  scriviParametri({
    tRegistro: m.registro, tApertura: m.apertura, tChiusura: m.chiusura,
    tIntreccio: m.intreccio, tPasso: m.passo, tLivello: m.livello,
  });
  timbroTessuti = m.timbro;
  effettiviTessuti();
  tessuti.forEach((L, i) => { L.target = L.period = m.periodi[i]; L.idx = 0; });
  tessuti.forEach(rigeneraTrama);
  return true;
}
