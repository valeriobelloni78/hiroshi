/* =============================================================================
   RADA2 · deriva.js — il tempo lungo

   Rada teneva quattro frasi sfasate con periodi interi coprimi: nessuna coppia
   condivide un divisore, quindi il collage non si ripete presto. Ma era una
   promessa sulla COMBINAZIONE, non sullo STATO. I parametri restavano fermi
   dove li avevi messi, la scala era una pentatonica fissa, e dopo un'ora lo
   strumento era esattamente dov'era all'inizio: imprevedibile e immobile.

   Qui la stessa idea sale di un piano. Lo stato del pezzo è un punto su un
   toro, e ogni dimensione gira alla propria velocità; le velocità però non
   stanno in rapporti coprimi ma in rapporti IRRAZIONALI — √2, √3, √5, √7, √11.
   Per il teorema di Kronecker un'orbita con frequenze razionalmente
   indipendenti è densa sul toro e non si chiude mai: lo stato non ripassa mai
   esattamente dov'è già stato. Coprimalità fra interi diventa indipendenza
   razionale fra reali; la promessa è la stessa, cresciuta di un ordine.

   La scelta delle radici non è decorativa. Le radici quadrate di interi
   distinti liberi da quadrati, prese insieme a 1, sono linearmente
   indipendenti sui razionali: è il fatto classico che rende il teorema
   applicabile. Sostituirle con numeri qualunque — 1,3 e 1,7 e 2,1 — perde
   l'indipendenza e riporta a un'orbita che prima o poi si richiude, cioè
   esattamente al difetto che questo file esiste per togliere.

   NON DIPENDE DA NULLA, ed è il primo file caricato dopo le traduzioni: la
   deriva è sotto al modello, non accanto. Le dipendenze scorrono
   deriva ← model ← audio ← disegno/ui.
============================================================================= */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* --- i canali della deriva -------------------------------------------------
   Sei velocità. Il giro più lento è di nove minuti, il più rapido di poco
   meno di tre: abbastanza lenti da non leggersi come un'oscillazione,
   abbastanza rapidi da spostare qualcosa nell'arco di un ascolto.

   Le fasi iniziali sono casuali, e per questo due sessioni non cominciano
   mai nello stesso punto del toro.                                        */
const DERIVA_LENTA = 540;
const RADICI = [1, Math.SQRT2, Math.sqrt(3), Math.sqrt(5), Math.sqrt(7), Math.sqrt(11)];
const FASI = RADICI.map(() => Math.random());

function canale(k, t) {
  return Math.sin(2 * Math.PI * (FASI[k] + t * RADICI[k] / DERIVA_LENTA));
}

/* Nessun parametro pende da un canale solo: tre canali sommati con pesi
   diversi danno una curva che l'orecchio non riconosce come periodica, mentre
   una sinusoide sola — per quanto lenta — si sente andare e tornare. I pesi
   sommano a uno, così il risultato resta in −1..1 e le ampiezze si leggono
   dove vengono applicate, non qui.                                        */
function misto(t, a, b, c) {
  return canale(a, t) * 0.55 + canale(b, t) * 0.30 + canale(c, t) * 0.15;
}

/* I valori correnti della deriva, in −1..1. Chi li usa decide di quanto
   pesano: qui non c'è nessuna unità, solo la forma del movimento.         */
const deriva = { centro: 0, dens: 0, spread: 0, head: 0, corpo: 0 };

/* --- il campo armonico ----------------------------------------------------
   Due movimenti indipendenti: uno a scatti nell'armonia, uno continuo nel
   registro. Prima erano una collezione che scattava e una tonica che
   scivolava; la tonica non scivola più.

   L'ACCORDATURA È FISSA. Il campo nasce sul do ricavato dal la a 440 — e ogni
   altezza è una potenza esatta di due dodicesimi: temperamento equabile, senza
   scarti. È il vincolo che rende Rada2 suonabile da fuori: chi imbraccia uno
   strumento accordato ci trova sopra le stesse note che ha sotto le dita.
   Prima la tonica derivava di ±350 centesimi, e quella deriva era ciò che
   garantiva il non-ritorno; il prezzo era che nessuno potesse suonarci sopra.
   Chi rimettesse un fattore non intero qui dentro romperebbe quel patto.

   La COLLEZIONE gira sul circolo delle quinte, un passo per volta. Fra una
   pentatonica e quella della sua quinta cambia UNA nota su cinque — {do re mi
   sol la} contro {sol la si re mi} — ed è il passo più piccolo che esista fra
   due collezioni consonanti. Per questo il cambio non ha un bordo che si
   senta: te ne accorgi dopo, come della luce che cambia in una stanza.

   La pentatonica anemitonica resta la garanzia ereditata da Rada — nessun
   semitono, nessun tritono, nessuna combinazione sgradevole possibile.
   Cambiarla in una collezione che contenga semitoni è una decisione musicale
   grossa, non una regolazione.                                            */
const GRADI = [0, 2, 4, 7, 9];
/* Il do di riferimento, ancorato al LA 440 e non scritto a mano: 261,63 è
   l'arrotondamento a due decimali di questo numero, e quei due decimali
   valgono tre centesimi di semitono. Inudibili — la soglia sta attorno a
   cinque — ma qui la promessa è l'intonazione esatta, e un'ancora calcolata
   costa una moltiplicazione una volta sola. Chi suona accorda sul la, non
   sul do: è quello il riferimento da cui partire.                         */
const TONICA_BASE = 440 * Math.pow(2, -9 / 12);
const PASSO_QUINTA = 150;      // secondi esatti fra un passo e il successivo

/* IL PASSO È REGOLARE, e lo è per chi suona. Prima aveva un ±25% di
   irregolarità, che serviva a non far diventare la modulazione un metronomo;
   ma un musicista che accompagna deve poter contare quanto manca al cambio, e
   una modulazione che arriva quando le pare è una modulazione che si subisce.
   L'imprevedibilità si è spostata dal QUANDO al DOVE, qui sotto.          */

/* --- dove si va: un cammino che non si ripete ------------------------------
   Il passo non è più sempre "+1 quinta", che dopo dodici scatti riporterebbe
   esattamente al punto di partenza. La direzione — su o giù di una quinta —
   viene da una parola sturmiana costruita su φ: `floor((n+1)α) − floor(nα)`
   con α irrazionale dà una successione di 0 e 1 che non è periodica, per la
   stessa ragione per cui non lo sono i canali della deriva.

   In un verso o nell'altro cambia comunque UNA nota sola: la proprietà che
   rende il passo inudibile è salva. Quello che si perde è la prevedibilità
   della meta — con α = 1/φ si sale nel 61,8% dei casi, quindi il giro
   circola lentamente invece di marciare, e passa e ripassa per le tonalità
   vicine come farebbe una modulazione vera.

   ONESTÀ SU COSA RESTA. Con l'accordatura fissa le altezze possibili sono un
   insieme FINITO, e nessun cammino dentro un insieme finito può evitare di
   ripassare: le dodici tonalità si rivedranno tutte, molte volte. A non
   tornare è lo STATO — baricentro, fasi, materiale — non l'altezza delle
   note. È un non-ritorno più debole di quello di prima, ed è il prezzo
   dichiarato della suonabilità.                                           */
const ALFA = 0.6180339887498949;   // 1/φ

/* Il giro parte da un punto qualsiasi del circolo: due sessioni non aprono
   nella stessa tonalità. `quinta` è dove ci si trova — può andare sotto zero,
   perché il cammino torna anche indietro — e `passiQuinta` è quanta strada si
   è fatta da quando si ascolta.                                            */
let quinta = Math.floor(Math.random() * 12);
let passiQuinta = 0;
let passoN = 0;
let prossimaQuinta = PASSO_QUINTA;

/* L'indice della tonalità corrente, da 0 a 11 in semitoni sopra il do. Il
   modello espone un NUMERO, non un nome: "Sol" e "G" e "Ré" sono la stessa
   cosa detta in tre lingue, e le parole stanno in i18n.js come tutte le
   altre. Il doppio modulo serve perché `quinta` può essere negativa.      */
function tonalita() { return ((quinta * 7) % 12 + 12) % 12; }

/* Che tonalità sarà fra n passi — o che cos'era n passi fa, se n è negativo.
   La parola sturmiana è deterministica e si percorre nei due versi: il passo
   che ha portato QUI è `floor(passoN·α) − floor((passoN−1)·α)`, quindi
   tornare indietro è sottrarre quello che si era sommato.

   Serve alla corsia della deriva, che mostra il tempo lungo intorno all'ora:
   il passo di quinta è regolare per scelta — un musicista deve poter contare
   quanto manca — e una fascia che dicesse solo dove siamo racconterebbe metà
   della promessa. Qui non si calcola nessuno stato: si legge un cammino che
   esiste già, avanti e indietro. */
function tonalitaFra(n) {
  let q = quinta;
  for (let k = 0; k < n; k++)
    q += (Math.floor((passoN + k + 1) * ALFA) - Math.floor((passoN + k) * ALFA)) ? 1 : -1;
  for (let k = 0; k > n; k--)
    q -= (Math.floor((passoN + k) * ALFA) - Math.floor((passoN + k - 1) * ALFA)) ? 1 : -1;
  return ((q * 7) % 12 + 12) % 12;
}

/* Venticinque frequenze, cinque ottave per cinque gradi, da 65 Hz a 1975 Hz.
   Erano venti su quattro ottave: la quinta ottava è lo spazio in cui il
   baricentro può scorrere senza che la selezione vada a sbattere contro gli
   estremi — 12 ± 4 di baricentro ± 8 di apertura fa esattamente 0..24, e la
   forbice non tocca mai i bordi.

   Si riscrive IN POSTO, e solo quando la collezione scatta: con l'accordatura
   fissa il contenuto non ha più ragione di cambiare fra un passo e l'altro.
   Prima si ricostruiva due volte al secondo perché la tonica scivolava.   */
const SCALE = new Array(25);
/* La classe d'altezza di ciascun grado, 0÷11 sopra il do. Si tiene in
   parallelo invece di ricavarla con un logaritmo a ogni lettura: serve a
   sapere quali gradi sopravvivono al prossimo passo di quinta, e quella
   domanda si fa una volta per tenuta lunga. */
const CLASSI = new Array(25);
const MEZZA_CAMPATA  = 8;   // semi-apertura massima della selezione, in gradi
const AMPIEZZA_CENTRO = 4;  // di quanto scorre il baricentro, in gradi
const CENTRO_BASE     = 12; // il grado di mezzo, fra i venticinque

function costruisciCampo() {
  const q = tonalita();
  const v = [];
  for (let oct = -2; oct <= 2; oct++)
    for (const g of GRADI) {
      const classe = (g + q) % 12;
      v.push({ hz: TONICA_BASE * Math.pow(2, (oct * 12 + classe) / 12), classe });
    }
  // Si ordina la coppia e non il solo vettore delle frequenze: la classe deve
  // restare attaccata alla sua altezza, o `CLASSI` racconterebbe un'altra scala.
  v.sort((a, b) => a.hz - b.hz);
  for (let i = 0; i < v.length; i++) { SCALE[i] = v[i].hz; CLASSI[i] = v[i].classe; }
}

/* --- IL BARICENTRO ---------------------------------------------------------
   Qui vive il movimento continuo che prima stava nell'accordatura. Le altezze
   sono ferme; a scorrere è il punto attorno a cui vengono pescate.

   L'effetto che si sente è quasi quello di prima — la musica sale e scende
   piano, senza che si possa indicare il momento — ma nessuna nota è stonata:
   il campo non si sposta, si sposta la finestra che lo guarda. È anche il
   solo posto in cui il non-ritorno sopravvive intero, perché il baricentro è
   un numero reale che si muove quasi-periodicamente.

   Passano di qui TUTTE le altezze, gocce e tessuti: sono lo stesso pezzo, e
   se il baricentro muovesse solo il primo piano lo sfondo resterebbe indietro.
   Il `rel` dell'evento e l'apertura del cursore decidono dove cade rispetto
   al centro, esattamente come prima.                                      */
function indiceDi(rel, spread) {
  const centro = CENTRO_BASE + deriva.centro * AMPIEZZA_CENTRO;
  return clamp(Math.round(centro + rel * spread * MEZZA_CAMPATA), 0, SCALE.length - 1);
}

function altezza(rel, spread) {
  return SCALE[indiceDi(rel, spread)];
}

/* --- l'altezza che sopravvive al passo -------------------------------------
   UNA TENUTA VIENE INTONATA UNA VOLTA SOLA, quando viene prenotata, e tiene
   quella frequenza fino in fondo: sessanta secondi, al massimo. Se nel
   frattempo scatta la quinta e il grado che aveva scelto è proprio quello che
   se ne va, resta fuori dalla collezione con una nota sola di scarto — e una
   nota sola di scarto, su una pentatonica anemitonica, è l'unica dissonanza
   che questo strumento sappia produrre. Misurato prima della correzione: fra
   le tenute che attraversano un passo, il 22% finiva fuori.

   La correzione è piccola perché il passo di quinta è piccolo: fra una
   pentatonica e la sua quinta CAMBIA UNA NOTA SU CINQUE, quindi quattro gradi
   su cinque valgono in tutte e due le collezioni. Basta scegliere fra quelli,
   e si sceglie il PIÙ VICINO a quello che si voleva — così la tenuta non
   salta di ottava e la trama non se ne accorge.

   Vale per le tenute e non per le gocce: la coda di una goccia dura pochi
   secondi e sta già scendendo quando il passo arriva, mentre un tenuto sta
   ancora aprendosi. E vale in tutti e due i modi del materiale: non dipende
   dal ricambio ma dal fatto che una nota lunga attraversa un cambio d'armonia. */
let COMUNI = null, comuniPer = -1;

function classiCheRestano() {
  if (COMUNI && comuniPer === passiQuinta) return COMUNI;
  const q = tonalita(), p = tonalitaFra(1);
  const dopo = new Set(GRADI.map((g) => (g + p) % 12));
  COMUNI = new Set(GRADI.map((g) => (g + q) % 12).filter((c) => dopo.has(c)));
  comuniPer = passiQuinta;
  return COMUNI;
}

function altezzaCheResta(rel, spread) {
  const i = indiceDi(rel, spread);
  const restano = classiCheRestano();
  if (restano.has(CLASSI[i])) return SCALE[i];
  for (let d = 1; d < SCALE.length; d++) {
    for (const k of [i - d, i + d]) {
      if (k < 0 || k >= SCALE.length) continue;
      if (restano.has(CLASSI[k])) return SCALE[k];
    }
  }
  return SCALE[i];                       // non può succedere: quattro su cinque restano
}

/* --- l'avanzamento --------------------------------------------------------
   Chiamata dallo scheduler, con il tempo del MOTORE AUDIO e non con quello di
   sistema. La differenza conta: `ctx.currentTime` si ferma quando il contesto
   è sospeso, quindi in pausa la deriva aspetta invece di correre di nascosto.
   È la stessa promessa che la pausa fa già per i cicli — si riprende da dov'era
   — estesa alla sola cosa che in Rada non aveva un "dov'era".              */
function avanzaDeriva(t) {
  /* Ogni parametro pesca da una terna diversa: se due parametri condividessero
     tutti e tre i canali si muoverebbero all'unisono, e la deriva si
     ridurrebbe a una manopola sola tirata da una mano invisibile.         */
  deriva.centro = misto(t, 0, 3, 5);
  deriva.dens   = misto(t, 1, 4, 2);
  deriva.spread = misto(t, 2, 0, 4);
  deriva.head   = misto(t, 3, 1, 5);
  deriva.corpo  = misto(t, 4, 5, 0);

  if (t >= prossimaQuinta) {
    const su = Math.floor((passoN + 1) * ALFA) - Math.floor(passoN * ALFA);
    passoN++;
    quinta += su ? 1 : -1;
    passiQuinta++;
    prossimaQuinta = t + PASSO_QUINTA;
    costruisciCampo();
  }
}

/* UNA QUINTA A MANO, in senso orario. È il solo modo in cui una tonalità si
   sceglie invece di aspettarla, e c'è solo quando TUTTI E DUE i materiali stanno
   su «ancora»: lì il pezzo non rinnova più le idee, e la sola cosa che continua
   a muoversi sotto le dita è l'armonia — sceglierla è finire di fermare lo
   strumento. Con un materiale in deriva il comando non compare: sarebbe una mano
   sul volante di una cosa che sta già guidando.

   ORARIO VUOL DIRE SEMPRE +1, non il passo sturmiano: il cammino che sale nel
   61,8% dei casi è la DERIVA, e la mano non ci entra. Per la stessa ragione
   `passoN` non avanza — il cammino automatico riprende da dove sarebbe andato,
   spostato di una quinta — mentre `passiQuinta` sì, perché conta le modulazioni
   avvenute e questa è avvenuta.

   E IL PROSSIMO PASSO SI RIMANDA di un giro intero: chi ha appena scelto una
   tonalità non se la vede cambiare fra dieci secondi. Quattro clic per quattro
   quinte lasciano comunque i due minuti e mezzo pieni dall'ultimo.

   Quello che questo salto NON fa è proteggere le tenute già in aria:
   `altezzaCheResta()` guarda il passo PREVISTO, e un salto a mano previsto non
   è. Una tenuta lunga può restare fuori collezione finché finisce. È il prezzo
   di una modulazione decisa adesso, e si sente come si sente una modulazione. */
function spingiQuinta(t) {
  quinta += 1;
  passiQuinta++;
  prossimaQuinta = t + PASSO_QUINTA;
  costruisciCampo();
}

/* Dove sta il baricentro, in −1..1: lo legge la corsia lunga della fascia.
   Prima qui c'erano i centesimi di scarto della tonica, che adesso sono
   sempre zero per costruzione.                                            */
function derivaCentro() { return deriva.centro; }

/* Il campo esiste già prima del primo giro dello scheduler: `playDrop` non
   deve mai trovarsi davanti a un vettore di `undefined`.                  */
costruisciCampo();
