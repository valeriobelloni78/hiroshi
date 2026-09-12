/* =============================================================================
   HIROSHI · paesaggio.js — una registrazione che diventa un luogo

   La quarta sorgente. Non è un granulare e non è un campionatore: si carica un
   suono, se ne sceglie un pezzo, e da quel pezzo lo strumento tira fuori un
   DRONE CONTINUO — la stessa materia percorsa molto più piano di com'è stata
   registrata, con dentro una stanza grande.

   COME SI RALLENTA UN SUONO SENZA TRASPORLO. Non si può leggere il buffer a
   velocità ridotta: quello abbassa anche l'altezza, e a un ottavo della
   velocità un temporale diventa un tuono e una voce diventa un mostro. Si fa
   come si è sempre fatto da Roads in poi: si legge la materia a velocità
   NATURALE, in finestre che si sovrappongono, e si fa camminare piano il punto
   da cui le finestre vengono prese. L'altezza resta quella del materiale, la
   durata si dilata quanto si vuole, e quello che si sente è la materia tenuta
   ferma sotto una lente.

   La sovrapposizione non è una taratura: è la ragione per cui non si sentono i
   confini fra una finestra e l'altra. Quattro strati per finestra vuol dire
   che ogni istante è coperto quattro volte da campane che salgono e scendono
   sfasate, e la somma non ha buchi. Con due si sente respirare, con uno è un
   loop che sbatte.

   LO SPARPAGLIO È QUELLO CHE LO RENDE UN PAESAGGIO E NON UN NASTRO. Se tutte
   le finestre partissero esattamente dallo stesso punto, la loro somma
   sarebbe una pettinatura — lo stesso identico campione ripetuto quattro volte
   a distanza fissa è un filtro a pettine, e si sente come un tubo. Uno scarto
   casuale su dove ciascuna comincia rompe la periodicità e lascia solo la
   materia.

   IL RIVERBERO STA QUI E NON NEL BANCO, e va detto perché altrove è una regola
   contraria: «il riverbero è una mandata, non un inserto, e la stanza resta
   una sola». Per le altre tre sorgenti è così. Qui no: per un drone la coda non
   è l'ambiente in cui il suono si trova, è metà del suono — cambiarne la
   lunghezza è comporre, non missare. Quindi il paesaggio si porta la sua rete
   dietro, con la sua coda e il suo tono, e la stanza dello studio resta intatta
   per tutti gli altri.

   NIENTE `fetch`, come dappertutto qui. I file arrivano da un `<input
   type=file>` e passano per `decodeAudioData`: nessuna richiesta di rete,
   quindi funziona anche aprendo `index.html` col doppio clic. La cattura dal
   microfono e la scrittura del wav stanno in `cattura.js`, perché sono la
   stessa macchina che serve al registratore della sessione.
============================================================================= */

/* ------------------------------------------------------------- i materiali
   Un elenco, non un solo posto: si registra un temporale, si carica una
   stanza, e si passa dall'uno all'altra senza perderli. Vuoto all'apertura —
   questa sorgente tace finché non le si dà qualcosa, ed è giusto così: non
   c'è nessun suono in dotazione da percorrere. */
const materiali = [];
let materiale = -1;
const MICROFONO_MAX = 90;           // secondi: oltre, la memoria non vale la resa

function materiaCorrente() {
  return materiale >= 0 && materiali[materiale] ? materiali[materiale] : null;
}

function aggiungiMateria(nome, buffer) {
  materiali.push({ nome, buffer, durata: buffer.duration });
  materiale = materiali.length - 1;
  testaOra = 0;                     // la testa riparte dal principio della cosa nuova
  versoTesta = 1; sostaResta = 0;
  return materiale;
}

/* Un file scelto a mano. `decodeAudioData` vuole un ArrayBuffer, e `File` ne
   dà uno senza passare da nessuna richiesta. */
async function caricaFile(ctx, file) {
  const dati = await file.arrayBuffer();
  const buf = await ctx.decodeAudioData(dati);
  return aggiungiMateria(file.name.replace(/\.[^.]+$/, ""), buf);
}

/* La cattura dal microfono sta in `cattura.js`, insieme alla scrittura del wav:
   è la stessa macchina che serve al registratore della sessione, e due copie
   divergerebbero al primo ritocco. Qui si usa e basta. */

/* ------------------------------------------------------------------ il segmento
   Due estremi in centesimi del materiale, e la CORSA che ne resta: la testa non
   percorre tutto il segmento ma il segmento meno una finestra, perché una
   finestra che cominciasse a un soffio dalla fine finirebbe fuori dal materiale
   e andrebbe accorciata — e una finestra accorciata perde la sua campana, cioè
   torna a essere un taglio.

   Se il segmento è più corto di una finestra, è la finestra a stringersi. Così
   si può scegliere anche mezzo secondo di materiale e sentirlo comunque tenuto,
   invece di non sentire niente. */
const VELO_MIN = 0.08;

function segmento() {
  const m = materiaCorrente();
  if (!m) return { a: 0, b: 0, durata: 0, velo: VELO_MIN, corsa: 0 };
  let a = clamp(effGP.inizio / 100, 0, 1) * m.durata;
  let b = clamp(effGP.fine / 100, 0, 1) * m.durata;
  if (b - a < VELO_MIN) b = Math.min(m.durata, a + VELO_MIN);
  if (b - a < VELO_MIN) a = Math.max(0, b - VELO_MIN);
  const durata = Math.max(VELO_MIN, b - a);
  const velo = Math.min(clamp(effGP.velo / 1000, VELO_MIN, 2), durata);
  return { a, b, durata, velo, corsa: Math.max(0.001, durata - velo) };
}

/* ------------------------------------------------------- la testa di lettura
   È un accumulatore e non una posizione calcolata, perché il rallentamento si
   muove sotto le dita: a ogni giro si cammina di `dt / rallentamento`.

   LE CINQUE LETTURE dicono come la testa percorre la corsa, e NESSUNA TOCCA LE
   FINESTRE: ogni strato suona in avanti a velocità naturale in tutte e cinque,
   perché è quello che tiene l'altezza e l'attacco del materiale. INDIETRO è la
   testa che torna verso il capo, non il suono rovesciato — i quattro toni della
   prova, letti all'indietro, scendono invece di salire, e ciascuno resta un tono
   che comincia.

     · AVANTI e INDIETRO si avvolgono dentro la corsa. Un avvolgimento non si
       sente, perché le finestre stanno già sparpagliate e nessuno sa dove sia
       il bordo.
     · PENDOLO rimbalza, ed è l'unico: lì il verso che cambia È la lettura. Si
       tiene come una FASE su andata e ritorno, lunga due corse, così un passo
       che attraversa un bordo — o due, a rallentamento uno su un segmento
       corto — rimbalza giusto senza casi a parte.
     · FERMO non cammina. La materia sta sotto la lente, e quello che si muove è
       solo lo sparpaglio.
     · RANDOM salta in un punto a caso della corsa, legge da lì in avanti per la
       SOSTA — secondi veri, non di materiale — e salta di nuovo. Il salto non ha
       bisogno di una dissolvenza: gli strati già partiti finiscono la loro
       campana dove erano, i nuovi cominciano dall'altra parte, e la
       sovrapposizione fa l'incrocio da sé.

   LA TESTA SI CALCOLA IN UN POSTO SOLO, `camminaTesta`, che non tocca niente: la
   usa `avanzaTesta` per camminare davvero, e il velo per sapere dove sarà la
   testa quando uno strato prenotato comincerà. Due conti divergerebbero al primo
   ritocco, e nel pendolo e nel random una previsione sbagliata non è un errore
   piccolo: è un rimbalzo o un salto nel posto sbagliato. Per questo IL PUNTO
   D'ARRIVO DEL RANDOM SI SORTEGGIA PRIMA DEL SALTO: la previsione deve sapere
   dove si atterra prima che si atterri.

   Lo stato sono numeri RELATIVI — il verso, i secondi che mancano al salto,
   l'arrivo in frazione della corsa — e nessun tempo assoluto: il render fuori
   tempo reale riparte da zero, e un salto fissato su un orologio resterebbe nel
   futuro (vedi `avvia()` fra le insidie). L'arrivo è una FRAZIONE per la stessa
   ragione per cui la testa si avvolge: se nel frattempo il segmento si stringe,
   si atterra comunque dentro. */
const LETTURA = { avanti: 0, indietro: 1, pendolo: 2, fermo: 3, random: 4 };

/* La sosta è ESPONENZIALE, da uno a trenta secondi: fra uno e tre si sente la
   differenza di mezzo secondo, fra venti e trenta no, e una corsa lineare
   spenderebbe metà manopola dove l'orecchio non distingue niente. */
const SOSTA_MIN = 1, SOSTA_MAX = 30;
function sostaDi(v) {
  return SOSTA_MIN * Math.pow(SOSTA_MAX / SOSTA_MIN, clamp(v, 0, 100) / 100);
}

let testaOra = 0;
let versoTesta = 1;         // il pendolo: +1 verso la fine, −1 verso il capo
let sostaResta = 0;         // il random: secondi veri al prossimo salto
let prossimaArea = 0;       // il random: dove si atterra, in frazione della corsa
let letturaVista = -1;

/* Dove sarà la testa fra `d` secondi veri, partendo da `t`, senza muovere
   niente. Restituisce anche il verso e la sosta che resta, e se c'è stato un
   salto — che è l'unica cosa che `avanzaTesta` deve sapere per sorteggiare il
   prossimo arrivo. */
function camminaTesta(t, verso, resta, d, s) {
  const corsa = s.corsa, passo = d / clamp(effGP.rallenta, 1, 64);
  const giro = (x) => s.a + (((x - s.a) % corsa) + corsa) % corsa;
  switch (G.pLettura) {
    case LETTURA.indietro:
      return { t: giro(t - passo), verso, resta, salto: false };
    case LETTURA.pendolo: {
      const x = clamp(t - s.a, 0, corsa), giroPieno = 2 * corsa;
      const fase = (((verso > 0 ? x : giroPieno - x) + passo) % giroPieno + giroPieno) % giroPieno;
      return fase <= corsa ? { t: s.a + fase, verso: 1, resta, salto: false }
                           : { t: s.a + giroPieno - fase, verso: -1, resta, salto: false };
    }
    case LETTURA.fermo:
      return { t: clamp(t, s.a, s.a + corsa), verso, resta, salto: false };
    case LETTURA.random: {
      if (d < resta) return { t: giro(t + passo), verso, resta: resta - d, salto: false };
      const dopo = (d - resta) / clamp(effGP.rallenta, 1, 64);
      return { t: giro(s.a + prossimaArea * corsa + dopo), verso,
               resta: Math.max(0, resta - d + sostaDi(effGP.sosta)), salto: true };
    }
    default:
      return { t: giro(t + passo), verso, resta, salto: false };
  }
}

function avanzaTesta(dt) {
  const s = segmento();
  if (!s.durata) return;
  if (G.pLettura !== letturaVista) {
    // Entrando nel random si salta subito: un pulsante premuto deve sentirsi.
    if (G.pLettura === LETTURA.random) { sostaResta = 0; prossimaArea = Math.random(); }
    letturaVista = G.pLettura;
  }
  // Una sosta accorciata vale subito, invece di aspettare la fine di quella lunga.
  sostaResta = Math.min(sostaResta, sostaDi(effGP.sosta));
  const p = camminaTesta(testaOra, versoTesta, sostaResta, dt, s);
  testaOra = p.t; versoTesta = p.verso; sostaResta = p.resta;
  if (p.salto) prossimaArea = Math.random();
}

/* Dove sta la testa adesso, in secondi dentro il materiale: la legge la tavola
   per disegnarla, e la legge il velo per sapere da dove ritagliare. */
function testaPaesaggio() {
  const s = segmento();
  return clamp(testaOra, s.a, s.a + s.corsa);
}

/* ------------------------------------------------------------- la risonanza
   IL PAESAGGIO NON HA UN'ALTEZZA. Una registrazione ha la sua, che nessuno
   conosce, e un temporale non ne ha affatto: trasporla su un grado vorrebbe
   dire prima indovinarla, e su pioggia, folla o vento non c'è niente da
   indovinare. Quindi non si tocca il materiale — gli si mette dietro un banco
   di passa-banda accordati sui gradi della collezione, e la sua energia a banda
   larga li eccita. Quello che esce canta le note del campo qualunque cosa sia
   entrata: è il modo di intonare il rumore, e funziona MEGLIO proprio sui
   materiali che non hanno un'altezza da rilevare.

   I filtri seguono il campo. Quando la quinta scatta, le frequenze scivolano
   sui gradi nuovi con una costante lunga, e siccome cambia una nota su cinque
   quattro filtri su cinque riscrivono lo stesso numero: il cambio non ha un
   bordo che si senta, esattamente come per le altre classi.

   ACCORDATURA e FUOCO sono due cose diverse e vogliono due cursori. La prima
   dosa fra il paesaggio crudo e quello intonato; il secondo è quanto sono
   stretti i filtri, cioè quanta strada c'è fra «la registrazione con dentro le
   note del campo» e «un pad che del luogo non ha più niente». Con un cursore
   solo si sceglierebbe quanto, senza poter scegliere che cosa. */
const RISONANZA_BASSO = 110, RISONANZA_ALTO = 1500;
/* Il fuoco non scende sotto otto: misurato, sotto quella soglia i filtri sono
   così larghi da non distinguere più un grado della collezione dal semitono
   accanto — colorerebbero senza intonare, cioè un terzo di corsa che non fa
   quello che l'etichetta promette. */
const FUOCO_MIN = 8, FUOCO_MAX = 80;

/* Gli INDICI del campo, non le frequenze: quando la collezione scatta l'indice
   resta lo stesso e `SCALE[i]` dà la nota nuova. Si contano una volta sola,
   alla costruzione, perché fra una pentatonica e l'altra una nota si sposta al
   massimo di un semitono e nessun filtro esce dalla banda per questo. */
function costruisciRisonanza(ctx) {
  const ingresso = ctx.createGain();
  const uscita = ctx.createGain();
  const filtri = [];
  for (let i = 0; i < SCALE.length; i++) {
    if (SCALE[i] < RISONANZA_BASSO || SCALE[i] > RISONANZA_ALTO) continue;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = SCALE[i];
    f.Q.value = clamp(effGP.fuoco, FUOCO_MIN, FUOCO_MAX);
    ingresso.connect(f);
    f.connect(uscita);
    filtri.push({ i, f });
  }
  uscita.gain.value = livelloRisonanza(filtri.length, effGP.fuoco);
  return { ingresso, uscita, filtri, quinta: -1, fuoco: -1 };
}

/* Quanto il banco vada alzato per stare alla pari col secco, e perché ha
   quella forma. Due fatti:

     · SOMMA INCOERENTE. Passa-banda stretti su frequenze diverse non escono in
       fase: si sommano in potenza, quindi si divide per √N. È la stessa
       aritmetica dei tessuti e degli strati, applicata a un banco di filtri.
     · IL FUOCO CAMBIA L'ENERGIA. Un passa-banda lascia passare una fetta di
       spettro larga f/Q: stringendo i filtri passa meno segnale, in potenza
       proporzionalmente a 1/Q. Per questo il guadagno cresce col fuoco —
       senza, girare il fuoco girerebbe anche il volume, e il fuoco è un
       comando di carattere, non di livello. L'esponente è 0,6 e non 0,5:
       a fuoco largo i filtri si accavallano e la somma è più coerente di
       quanto la teoria incoerente preveda, quindi la radice pura
       sovraccompenserebbe il basso. Misurato su rumore bianco, con 0,6 lo
       scarto fra fuoco 6 e fuoco 60 resta dentro un paio di decibel; esatto
       non può essere, perché dipende dallo spettro del materiale.

   La costante davanti è MISURATA: la prova rende il paesaggio con accordatura
   a zero e a uno e confronta i due rms. Non va cambiata a occhio. */
const GUADAGNO_RISONANZA = 1.5;

function livelloRisonanza(quanti, fuoco) {
  return GUADAGNO_RISONANZA * Math.pow(clamp(fuoco, FUOCO_MIN, FUOCO_MAX), 0.6) /
         Math.sqrt(Math.max(1, quanti));
}

function accordaRisonanza(r, quando) {
  if (r.quinta !== passiQuinta) {
    r.quinta = passiQuinta;
    for (const b of r.filtri) b.f.frequency.setTargetAtTime(SCALE[b.i], quando, 0.4);
  }
  if (Math.abs(effGP.fuoco - r.fuoco) > 0.2) {
    r.fuoco = effGP.fuoco;
    for (const b of r.filtri) b.f.Q.setTargetAtTime(effGP.fuoco, quando, 0.1);
    r.uscita.gain.setTargetAtTime(livelloRisonanza(r.filtri.length, effGP.fuoco), quando, 0.1);
  }
}

/* ------------------------------------------------------------------ la catena
   Ingresso, secco e bagnato, e in mezzo una rete tutta sua. Si costruisce una
   volta per contesto: dal vivo una volta, e un'altra dentro ogni rendering
   fuori tempo reale, che ha nodi suoi. I pettini sono più lunghi di quelli
   dello studio — una stanza più grande — e restano primi fra loro in
   millisecondi, così gli echi non si allineano mai. */
const PETTINI_PAESAGGIO = [61, 73, 79, 89];
const PASSATUTTO_PAESAGGIO = [[11, 19], [13, 17]];

let catena = null, ctxCatena = null, destCatena = null;

function catenaPaesaggio(ctx, dest) {
  if (catena && ctxCatena === ctx && destCatena === dest) return catena;
  const ingresso = ctx.createGain();

  /* L'accordatura sta PRIMA del riverbero, e conta: la coda deve prendere le
     note già intonate, o la stanza si riempirebbe del materiale crudo mentre
     davanti canta il campo — due paesaggi diversi nello stesso posto. */
  const risonanza = costruisciRisonanza(ctx);
  const crudo = ctx.createGain(), accordato = ctx.createGain();
  const misto = ctx.createGain();
  ingresso.connect(crudo); crudo.connect(misto);
  ingresso.connect(risonanza.ingresso);
  risonanza.uscita.connect(accordato); accordato.connect(misto);

  const riverbero = costruisciRiverbero(ctx, {
    t60: clamp(effGP.coda, 0.5, 40), smorzamento: clamp(effGP.tono, 200, 18000),
    pettini: PETTINI_PAESAGGIO, passatutto: PASSATUTTO_PAESAGGIO,
  });
  const secco = ctx.createGain(), bagnato = ctx.createGain();
  misto.connect(secco); secco.connect(dest);
  misto.connect(riverbero.ingresso);
  riverbero.uscita.connect(bagnato); bagnato.connect(dest);

  catena = { ingresso, risonanza, crudo, accordato, riverbero, secco, bagnato,
             coda: -1, tono: -1, quanto: -1, accordo: -1 };
  ctxCatena = ctx; destCatena = dest;
  return catena;
}

/* I tre numeri del riverbero, riscritti solo quando si muovono davvero. La
   coda e il tono ritarano la rete — e ritararla vuol dire RIMISURARE il picco
   del filtro, che è la sola cosa che tiene il giro sotto l'unità.

   Il secco e il bagnato si incrociano in potenza (√) e non in ampiezza: due
   segnali scorrelati che si sommano danno la stessa energia solo così, e a
   metà corsa un incrocio lineare farebbe un buco di tre decibel. */
function taraPaesaggio(c, quando) {
  accordaRisonanza(c.risonanza, quando);
  if (Math.abs(effGP.accordatura - c.accordo) > 0.5) {
    c.accordo = effGP.accordatura;
    const a = clamp(effGP.accordatura / 100, 0, 1);
    c.crudo.gain.setTargetAtTime(Math.sqrt(1 - a), quando, 0.08);
    c.accordato.gain.setTargetAtTime(Math.sqrt(a), quando, 0.08);
  }
  if (Math.abs(effGP.coda - c.coda) > 0.05 || Math.abs(effGP.tono - c.tono) > 5) {
    c.coda = effGP.coda; c.tono = effGP.tono;
    c.riverbero.tara(effGP.coda, effGP.tono);
  }
  if (Math.abs(effGP.riverbero - c.quanto) > 0.5) {
    c.quanto = effGP.riverbero;
    const u = clamp(effGP.riverbero / 100, 0, 1);
    c.secco.gain.setTargetAtTime(Math.sqrt(1 - u), quando, 0.08);
    c.bagnato.gain.setTargetAtTime(Math.sqrt(u) * 1.4, quando, 0.08);
  }
}

/* ------------------------------------------------------------------- il velo
   Uno strato ogni `finestra/sovrapposizione`, su tempi ASSOLUTI: è la sola
   condizione che il patto del motore impone a chi aggiunge una sorgente, ed è
   anche quello che rende l'esportazione una conseguenza invece che una
   funzione da scrivere. */
const SOVRAPPOSIZIONE = 4;
const PUNTI_FINESTRA = 128;
const FINESTRA_VELO = new Float32Array(PUNTI_FINESTRA);
for (let i = 0; i < PUNTI_FINESTRA; i++) {
  FINESTRA_VELO[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (PUNTI_FINESTRA - 1));
}

let prossimoVelo = 0;
let veliEmessi = 0;
let ctxPaesaggio = null;
function contestoPaesaggio(c) { ctxPaesaggio = c; }

/* REGOLA DI FERRO, la stessa dei timbri: ogni nodo creato per uno strato va
   scollegato a mano. Qui gli strati sono lunghi — fino a due secondi — e ne
   vivono quattro insieme: affidarsi alla raccolta della memoria, che è
   attività del thread principale, vuol dire un grafo che cresce più in fretta
   di quanto venga ripulito. */
function suonaStrato({ ctx, when, buf, dentro, dur, vel, pan, dest }) {
  const s = ctx.createBufferSource();
  s.buffer = buf;

  const fin = ctx.createGain();
  fin.gain.setValueAtTime(0, when);
  fin.gain.setValueCurveAtTime(FINESTRA_VELO, when, dur);

  const peso = ctx.createGain();
  peso.gain.value = vel;

  const p = ctx.createStereoPanner();
  p.pan.value = clamp(pan, -1, 1);

  s.connect(fin); fin.connect(peso); peso.connect(p); p.connect(dest);
  s.start(when, dentro, Math.min(dur, Math.max(0.01, buf.duration - dentro)));
  s.stop(when + dur + 0.02);
  libera(s, [s, fin, peso, p]);
}

function prenotaVelo(now, orizzonte, attiva, dest) {
  const m = materiaCorrente();
  if (!ctxPaesaggio) return 0;
  const c = catenaPaesaggio(ctxPaesaggio, dest);
  taraPaesaggio(c, now);
  if (!attiva || !m || !m.durata) { prossimoVelo = Math.max(prossimoVelo, now); return 0; }
  if (prossimoVelo < now) prossimoVelo = now;

  const s = segmento();
  const passo = s.velo / SOVRAPPOSIZIONE;
  const scarto = (effGP.sparpaglio / 100) * Math.min(0.5, s.corsa / 2);
  /* Dove la testa rimbalza o sta ferma, lo sparpaglio SI SPECCHIA sui bordi
     invece di avvolgersi: avvolta, una finestra vicina a un bordo andrebbe a
     prendere l'altro capo del segmento, cioè una materia che la testa non sta
     leggendo e non leggerà. Dove la testa si avvolge da sé, si avvolge anche lui. */
  const specchia = G.pLettura === LETTURA.pendolo || G.pLettura === LETTURA.fermo;
  let quanti = 0, guardia = 0;

  while (prossimoVelo < orizzonte && guardia++ < 200) {
    /* Dov'è la testa NELL'ISTANTE in cui questo strato comincia, non adesso:
       lo scheduler prenota fino a mezzo secondo avanti e fuori tempo reale
       anche di più, e una testa letta adesso farebbe camminare il paesaggio a
       scatti lunghi quanto la finestra di prenotazione. La chiede alla stessa
       funzione con cui la testa cammina, quindi rimbalzi e salti cadono dove
       cadranno davvero. */
    const t = camminaTesta(testaOra, versoTesta, sostaResta, prossimoVelo - now, s).t;
    const grezzo = t - s.a + (Math.random() * 2 - 1) * scarto;
    const giri = ((grezzo % (2 * s.corsa)) + 2 * s.corsa) % (2 * s.corsa);
    const dentro = s.a + (specchia ? (giri <= s.corsa ? giri : 2 * s.corsa - giri)
                                   : ((grezzo % s.corsa) + s.corsa) % s.corsa);
    // Gli strati si alternano fra i due lati: due campane che salgono e
    // scendono sfasate su lati opposti sono quello che allarga il paesaggio
    // senza che nessuno debba muovere niente.
    const lato = (veliEmessi + quanti) % 2 ? 0.65 : -0.65;
    suonaStrato({
      ctx: ctxPaesaggio, when: prossimoVelo, buf: m.buffer,
      dentro: clamp(dentro, 0, Math.max(0, m.durata - s.velo)),
      dur: s.velo, vel: 0.5, pan: lato, dest: c.ingresso,
    });
    quanti++;
    prossimoVelo += passo;
  }
  veliEmessi += quanti;
  return quanti;
}

/* Quanti strati suonano insieme: è la sovrapposizione, e si conosce senza
   contarla. Sorgenti scorrelate si sommano in potenza, quindi il bus si divide
   per √N — la stessa ragione dei tessuti e degli ex grani. */
function sovrapposizionePaesaggio() {
  return SOVRAPPOSIZIONE;
}
