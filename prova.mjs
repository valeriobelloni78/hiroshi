/* Prova del motore. Non verifica il gusto: verifica che suoni, che non clippi,
   che ogni timbro esca dal silenzio senza esplodere, che l'equalizzatore muova
   davvero lo spettro e che la coda del riverbero scenda invece di crescere —
   che è il modo in cui una rete a retroazione sbaglia. */
import { chromium } from 'playwright';

/* Il browser e la pagina non hanno percorsi scritti a mano. Il Chromium è
   quello che `npx playwright install chromium` ha messo dove playwright lo
   cerca — un percorso fisso qui dentro vuol dire una prova che gira su una
   macchina sola — e la pagina si ricava da DOVE STA QUESTO FILE, così la prova
   funziona da qualunque cartella la si lanci. Si apre con `file://`, che è la
   promessa dell'app: nessun server, nessuna rete.

   `HIROSHI_CHROMIUM` resta per chi ha un Chromium suo e non vuole scaricarne
   un altro. */
const b = await chromium.launch(
  process.env.HIROSHI_CHROMIUM ? { executablePath: process.env.HIROSHI_CHROMIUM } : {});
const p = await b.newPage();
const errori = [];
p.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
p.on('pageerror', (e) => errori.push('pageerror: ' + e.message));

await p.goto(new URL('./index.html', import.meta.url).href);
await p.waitForTimeout(400);

const esito = await p.evaluate(async () => {
  const misura = (buf) => {
    let somma = 0, picco = 0, primo = -1;
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < buf.length; i++) {
        const v = Math.abs(d[i]);
        somma += d[i] * d[i];
        if (v > picco) picco = v;
        if (primo < 0 && v > 0.002) primo = i / buf.sampleRate;
      }
    }
    const n = buf.length * buf.numberOfChannels;
    return { rms: +Math.sqrt(somma / n).toFixed(5), picco: +picco.toFixed(4), primo: +primo.toFixed(3) };
  };
  const dB = (x) => (x > 0 ? +(20 * Math.log10(x)).toFixed(1) : -Infinity);
  const numeroDb = (x) => (x > 0 ? "+" : "") + x.toFixed(2) + " dB";

  const R = { errori: [] };

  /* 0 · L'ORA E LA STAGIONE SI FISSANO, altrimenti questa prova misura cose
        diverse a seconda di quando la si lancia: l'ora del giorno inclina il
        calore, lo spazio e il colore d'insieme, la stagione inclina il respiro
        dei tessuti. Un'ora qualunque e un mese qualunque, purché sempre gli
        stessi. */
  ORA = 14; MESE = 9;                       // pomeriggio, autunno

  /* 1 · venti secondi di frasi, dal motore intero */
  const brano = await rendiOffline(20);
  R.brano = misura(brano);
  // Da `ultimoRender`, non da `storiaGocce`: l'esportazione rimette a posto il
  // modello quando ha finito — compresa la storia — quindi il contatore vivo
  // dopo un render non racconta il render, racconta la sessione.
  R.brano.gocce = ultimoRender ? ultimoRender.gocce : 0;
  if (R.brano.gocce < 5) R.errori.push("in venti secondi sono cadute solo " + R.brano.gocce + " gocce");
  if (R.brano.rms < 0.002) R.errori.push("il motore è muto");
  if (R.brano.picco >= 0.999) R.errori.push("l'uscita clippa");

  /* 2 · ogni timbro, da solo */
  R.timbri = {};
  for (const nome of TIMBRI) {
    const c = new OfflineAudioContext(2, 48000 * 3, 48000);
    const dest = c.createGain(); dest.connect(c.destination);
    for (let k = 0; k < 6; k++) {
      suonaTimbro(nome, {
        ctx: c, when: 0.05 + k * 0.4, freq: 220 * Math.pow(2, k / 6),
        vel: 0.9, pan: 0, dest, F: FORMA,
      });
    }
    const m = misura(await c.startRendering());
    R.timbri[nome] = { rms: m.rms, dB: dB(m.picco) };
    if (m.rms < 0.0005) R.errori.push(nome + " è muto");
    if (m.picco > 1.5) R.errori.push(nome + " esce troppo forte: " + dB(m.picco) + " dB");
  }

  /* 2b · ogni tessuto, da solo. Tre tenute che si accavallano, come nell'uso
         vero: un tenuto misurato da solo e in isolamento non direbbe niente di
         quello che fa quando ce ne sono altri. */
  R.tessuti = {};
  for (const nome of TESSUTI) {
    const c = new OfflineAudioContext(2, 48000 * 12, 48000);
    const dest = c.createGain(); dest.connect(c.destination);
    for (let k = 0; k < 3; k++) {
      suonaTessuto(nome, {
        ctx: c, when: 0.1 + k * 3.4, dur: 6, freq: 196 * Math.pow(2, k / 4),
        vel: 0.9, pan: 0, dest, F: FORMA_T,
      });
    }
    const m = misura(await c.startRendering());
    R.tessuti[nome] = { rms: m.rms, dB: dB(m.picco) };
    if (m.rms < 0.0005) R.errori.push(nome + " è muto");
    if (m.picco > 1.5) R.errori.push(nome + " esce troppo forte: " + dB(m.picco) + " dB");
  }

  /* 2c · i tessuti dal motore intero, senza le gocce: che la seconda classe
         arrivi davvero all'uscita e non solo ai suoi costruttori. */
  {
    const prima = frasiOn;
    frasiOn = false;
    const solo = await rendiOffline(25);
    frasiOn = prima;
    R.trama = misura(solo);
    if (R.trama.rms < 0.002) R.errori.push("i tessuti non arrivano all'uscita");
    if (R.trama.picco >= 0.999) R.errori.push("i tessuti da soli clippano");
  }

  /* 3 · l'equalizzatore: una campana a −8 dB deve togliere otto decibel lì e
        lasciare in pace il resto */
  const c2 = new OfflineAudioContext(1, 128, 48000);
  const f = c2.createBiquadFilter();
  f.type = "peaking"; f.frequency.value = 5000; f.Q.value = 1; f.gain.value = -8;
  const hz = new Float32Array([100, 5000]), mag = new Float32Array(2), fa = new Float32Array(2);
  f.getFrequencyResponse(hz, mag, fa);
  R.eq = { a100: dB(mag[0]), a5000: dB(mag[1]) };
  if (Math.abs(R.eq.a5000 + 8) > 0.3) R.errori.push("la banda non toglie gli 8 dB dichiarati");
  if (Math.abs(R.eq.a100) > 0.5) R.errori.push("la banda dei 5 kHz tocca anche i 100 Hz");

  /* 4 · il riverbero, in tre misure.

        (a) UNO STADIO SOLO deve avere guadagno unitario: è la definizione di
        passa-tutto. Questa misura è qui perché è quella che ha scoperto il
        difetto: nella forma a retroazione lo stesso stadio dava 1,0000 oppure
        1,2894 a seconda di dove Web Audio collocava il blocco implicito
        dell'anello. Se un giorno tornasse a oscillare, si vede qui per primo.

        (b) L'EQUILIBRIO FRA I LATI: le catene di passa-tutto sono l'unico
        punto in cui i due lati possono differire, perché i pettini sono
        condivisi apposta. Si misura sulla rete INTERA — che è dove conta — con
        rumore continuo a regime.

        (c) LA CADUTA DELLA CODA, sulla rete intera: una rete a retroazione
        sbaglia crescendo, quindi questa è la misura che dice se i pettini sono
        ancora sotto controllo. */
  const rumoreIn = (c, sec, amp) => {
    const b = c.createBuffer(1, Math.floor(48000 * sec), 48000);
    const d = b.getChannelData(0);
    let seme = 20260901 >>> 0;
    for (let i = 0; i < d.length; i++) {
      seme = (seme * 1664525 + 1013904223) >>> 0;
      d[i] = ((seme / 4294967296) * 2 - 1) * amp;
    }
    const s = c.createBufferSource(); s.buffer = b; s.start(0);
    return s;
  };
  const en = (d, a, z) => { let s = 0; for (let i = Math.floor(a); i < Math.floor(z); i++) s += d[i] * d[i]; return s; };

  // (a) uno stadio solo: guadagno unitario
  const cs = new OfflineAudioContext(1, 48000 * 2, 48000);
  passatutto(cs, rumoreIn(cs, 2, 0.3), 7, 0.5).connect(cs.destination);
  const ps = await cs.startRendering();
  // Il riferimento è lo stesso rumore, con lo stesso seme, senza la rete.
  const cs2 = new OfflineAudioContext(1, 48000 * 2, 48000);
  rumoreIn(cs2, 2, 0.3).connect(cs2.destination);
  const rif = await cs2.startRendering();
  const unitario = Math.sqrt(
    en(ps.getChannelData(0), 24000, 96000) / en(rif.getChannelData(0), 24000, 96000));
  R.passatutto = { guadagno: +unitario.toFixed(4) };
  if (Math.abs(unitario - 1) > 0.02)
    R.errori.push("uno stadio di passa-tutto non è unitario: " + unitario.toFixed(4));

  // (b) e (c) la rete intera: equilibrio fra i lati e caduta della coda
  const c3 = new OfflineAudioContext(2, 48000 * 6, 48000);
  const riv = costruisciRiverbero(c3);
  riv.uscita.connect(c3.destination);
  rumoreIn(c3, 3, 0.4).connect(riv.ingresso);
  const coda = await c3.startRendering();
  const d0 = coda.getChannelData(0), d1 = coda.getChannelData(1);
  const squilibrio = dB(Math.sqrt(
    en(d1, 48000, 48000 * 2.5) / en(d0, 48000, 48000 * 2.5)));
  if (Math.abs(squilibrio) > 1) R.errori.push("i due lati del riverbero sono sbilanciati: " + squilibrio + " dB");
  const presto = en(d0, 48000 * 3.2, 48000 * 3.7);
  const tardi  = en(d0, 48000 * 5.0, 48000 * 5.5);
  const caduta = dB(Math.sqrt(tardi / presto));
  R.riverbero = { caduta: caduta + " dB fra 3,2 s e 5 s", squilibrio: squilibrio + " dB fra i lati" };
  if (tardi >= presto) R.errori.push("la coda del riverbero cresce invece di spegnersi");
  if (caduta > -12) R.errori.push("la coda scende troppo poco: " + caduta + " dB");

  /* 5 · LA COMPENSAZIONE DEI TESSUTI, che è la ragione per cui questa classe
        ha richiesto un meccanismo suo.

        Quattro tenute già aperte; una quinta comincia ad aprirsi. Il bus
        dev'essere compensato su √(somma degli inviluppi) e NON su √(numero di
        voci): contando le teste, la compensazione salta di 20·log₁₀(√5/√4) =
        0,97 dB nell'istante in cui la quinta voce comincia — cioè mentre è
        ancora del tutto inudibile. Si sentirebbe l'intera trama abbassarsi per
        far posto a qualcosa che non c'è.

        La prova misura lo SCATTO MASSIMO fra due passi consecutivi dello
        scheduler, nelle due versioni. Quella per inviluppi dev'essere liscia;
        quella per teste dev'essere ruvida — e si verifica anche quello, perché
        una prova che non sa distinguere i due casi non sta provando niente. */
  {
    const aperte = [];
    for (let k = 0; k < 4; k++) aperte.push({ t0: -50, t1: 200, ap: 3, di: 3, amp: 1 });
    const quinta = { t0: 10, t1: 60, ap: 3.2, di: 5.4, amp: 1 };
    const tutte = aperte.concat([quinta]);

    const perInviluppi = (t) => {
      let s = 0;
      for (const e of tutte) s += e.amp * finestra(t, e);
      return s > 1 ? 1 / Math.sqrt(s) : 1;
    };
    const perTeste = (t) => {
      let n = 0;
      for (const e of tutte) if (t >= e.t0 && t < e.t1) n++;
      return n > 1 ? 1 / Math.sqrt(n) : 1;
    };

    const scatto = (f) => {
      let max = 0, prima = f(9);
      for (let t = 9; t <= 15; t += 0.05) {
        const v = f(t);
        max = Math.max(max, Math.abs(v - prima));
        prima = v;
      }
      return max;
    };
    const liscio = scatto(perInviluppi), ruvido = scatto(perTeste);
    R.compensazione = {
      perInviluppi: +liscio.toFixed(5),
      perTeste: +ruvido.toFixed(5),
      salto: dB(perTeste(10) / perTeste(9.99)) + " dB, contando le teste",
    };
    if (liscio > 0.01) R.errori.push("la compensazione per inviluppi scatta: " + liscio.toFixed(4));
    if (ruvido < 0.02) R.errori.push("la prova non distingue i due casi: rivederla");
  }

  /* 6 · I SEDICI MOOD.

        (a) Dentro una serie i quattro periodi devono essere coprimi a due a
        due: è il meccanismo stesso del collage.

        (b) Fra le due serie la coprimalità NON si può pretendere — le due
        tabelle si scelgono indipendentemente e fanno 64 combinazioni — quindi
        si misura quello che quella regola difende davvero: il tempo prima che
        tutte e otto le linee tornino nella stessa combinazione. La condizione
        «coprimi» è sufficiente, non necessaria; il riallineamento è la cosa
        vera, e sotto le 24 ore si fallisce.

        (c) Ogni timbro compare una volta sola per tabella, così girando gli
        otto pulsanti si attraversano davvero tutti e otto i suoni. */
  {
    const mcd = (a, b) => (b ? mcd(b, a % b) : a);
    const mcm = (a, b) => (a / mcd(a, b)) * b;
    const G8 = Object.entries(MOOD_GOCCE), T8 = Object.entries(MOOD_TESSUTI);

    for (const [nome, m] of G8.concat(T8)) {
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
        if (mcd(m.periodi[i], m.periodi[j]) > 1)
          R.errori.push("dentro «" + nome + "» due periodi non sono coprimi: " +
                        m.periodi[i] + " e " + m.periodi[j]);
      }
    }

    let peggiore = Infinity, chi = "";
    for (const [ng, mg] of G8) for (const [nt, mt] of T8) {
      const ore = mg.periodi.concat(mt.periodi).reduce(mcm, 1) / 3600;
      if (ore < peggiore) { peggiore = ore; chi = ng + " × " + nt; }
    }
    R.mood = {
      combinazioni: G8.length * T8.length,
      riallineoPeggiore: Math.round(peggiore) + " ore (" + chi + ")",
    };
    if (peggiore < 24)
      R.errori.push("una combinazione di mood si riallinea in " +
                    peggiore.toFixed(1) + " ore: " + chi);

    const unaVolta = (tab, dove) => {
      const visti = new Set();
      for (const [nome, m] of Object.entries(tab)) {
        if (visti.has(m.timbro))
          R.errori.push("il timbro «" + m.timbro + "» compare due volte fra i mood " + dove +
                        " (l'ultimo è «" + nome + "»)");
        visti.add(m.timbro);
      }
      return visti.size;
    };
    R.mood.timbriGocce = unaVolta(MOOD_GOCCE, "delle gocce");
    R.mood.timbriTessuti = unaVolta(MOOD_TESSUTI, "dei tessuti");

    /* (d) Quattro mood scelti agli estremi, resi dal motore intero: che
           nessuno sia muto e che nessuno clippi. «Nuvola» è quello che ci va
           più vicino — quattordici gocce per idea e addensamento a 64. */
    R.resa = {};
    for (const [g, t] of [["sereno", "velo"], ["nuvola", "seta"],
                          ["vespro", "fondale"], ["pioggia", "lino"]]) {
      applicaMoodGocce(g); applicaMoodTessuti(t);
      const m = misura(await rendiOffline(14));
      R.resa[g + "+" + t] = { rms: m.rms, picco: m.picco };
      if (m.rms < 0.002) R.errori.push("il mood " + g + "+" + t + " è muto");
      if (m.picco >= 0.999) R.errori.push("il mood " + g + "+" + t + " clippa");
    }
    applicaMoodGocce("sereno"); applicaMoodTessuti("velo");
  }

  /* 7 · I GRANI.

        All'apertura questa sorgente è muta per costruzione — non c'è nessun
        suono in dotazione da granulare — quindi la prova si porta una materia
        sua: sei secondi di quattro toni in successione, che è materiale
        riconoscibile e permette di verificare che la testa di lettura si
        muova davvero invece di macinare sempre lo stesso punto.

        Si verificano quattro cose:
         (a) che i grani suonino e non clippino, resi dal motore intero;
         (b) che la TESTA SI MUOVA: a corsa zero la nube resta ferma, a corsa
             piena percorre il materiale. È il difetto più facile da
             introdurre — un accumulatore che non accumula — ed è muto: si
             sente solo come una nube che non va da nessuna parte.
         (c) che la compensazione segua la densità: raddoppiando i grani il
             bus deve scendere di 3 dB, non salire;
         (d) che in modo INTONATO tutti gli intervalli stiano nella collezione
             — nessun semitono, che è la garanzia che il granulare non deve
             rompere. */
  {
    const sr = 48000, sec = 6;
    const c = new OfflineAudioContext(1, sr * sec, sr);
    const mat = c.createBuffer(1, sr * sec, sr);
    const d = mat.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const f = [180, 240, 320, 430][Math.floor((i / sr / sec) * 4)];
      d[i] = 0.5 * Math.sin((2 * Math.PI * f * i) / sr);
    }
    aggiungiMateria("prova", mat);

    // (b) la testa
    testaOra = 0; G.gCorsa = GT.gCorsa = 0; effettiviGrani();
    for (let k = 0; k < 100; k++) avanzaTesta(0.05);
    const ferma = testaOra;
    G.gCorsa = GT.gCorsa = 100; effettiviGrani();
    for (let k = 0; k < 100; k++) avanzaTesta(0.05);
    const corsa = testaOra;
    R.grani = { testaFerma: +ferma.toFixed(3), testaDopo5s: +corsa.toFixed(2) };
    if (ferma !== 0) R.errori.push("a corsa zero la testa si muove lo stesso");
    if (Math.abs(corsa - 5) > 0.3) R.errori.push("a corsa piena la testa ha fatto " +
      corsa.toFixed(2) + " s invece di 5");

    // (c) la compensazione
    G.gDensita = GT.gDensita = 10; G.gGrano = GT.gGrano = 100; effettiviGrani();
    const c1 = sovrapposizioneGrani();
    G.gDensita = GT.gDensita = 20; effettiviGrani();
    const c2 = sovrapposizioneGrani();
    const scarto = 20 * Math.log10(Math.sqrt(c1) / Math.sqrt(c2));
    R.grani.compensazione = numeroDb(scarto) + " raddoppiando la densità";
    if (Math.abs(scarto + 3) > 0.4)
      R.errori.push("la compensazione dei grani non segue la densità: " + scarto.toFixed(2) + " dB");

    // (d) gli intervalli, in modo intonato. Quello che va verificato sono gli
    //     INTERVALLI dentro la nube, non l'altezza assoluta: un materiale
    //     registrato non ha una tonalità che si possa conoscere — un temporale
    //     non ne ha affatto — quindi la trasposizione assoluta non vuol dire
    //     niente, mentre gli intervalli fra un grano e l'altro si sentono
    //     eccome. La promessa è che siano quelli della collezione: nessun
    //     semitono, nessun tritono.
    graniIntonati = true;
    G.gSparpaglio = GT.gSparpaglio = 100; G.gAltezza = GT.gAltezza = 0;
    effettiviGrani();
    const base = baseGrani();
    const classi = new Set();
    let interi = true;
    for (let k = 0; k < 3000; k++) {
      const s = semitoniGrano() - base;
      if (Math.abs(s - Math.round(s)) > 1e-9) { interi = false; break; }
      classi.add(((Math.round(s) % 12) + 12) % 12);
    }
    R.grani.classi = [...classi].sort((a, b) => a - b);
    if (!interi) R.errori.push("un intervallo intonato non cade su un semitono intero");
    for (const q of classi) {
      if (!GRADI.includes(q))
        R.errori.push("in modo intonato esce una classe fuori dalla collezione: " + q);
    }
    // E che il reticolo non scivoli col baricentro: due basi diverse devono
    // restare a distanza intera.
    if (Math.abs(baseGrani() - Math.round(baseGrani())) > 1e-9)
      R.errori.push("in modo intonato la base non è un semitono intero");

    // (a) la resa, dal motore intero
    G.gCorsa = GT.gCorsa = 20; G.gDensita = GT.gDensita = 18;
    G.gNube = GT.gNube = 30; G.gSparpaglio = GT.gSparpaglio = 30;
    effettiviGrani();
    const prima = [frasiOn, tessutiOn];
    frasiOn = false; tessutiOn = false;
    const nube = await rendiOffline(12);
    frasiOn = prima[0]; tessutiOn = prima[1];
    R.grani.resa = misura(nube);
    // Il conteggio si legge da `ultimoRender` e non dal contatore vivo: il
    // ripristino del modello rimette quest'ultimo dov'era prima — che è
    // giusto, ma vuol dire che dopo un'esportazione non racconta più il render.
    R.grani.emessi = ultimoRender ? ultimoRender.grani : 0;
    if (R.grani.resa.rms < 0.002) R.errori.push("i grani non arrivano all'uscita");
    if (R.grani.resa.picco >= 0.999) R.errori.push("i grani clippano");
    if (R.grani.emessi < 100) R.errori.push("in dodici secondi sono usciti solo " + R.grani.emessi + " grani");
  }

  /* 8 · IL WAV, ANDATA E RITORNO.

        L'intestazione di un wav è di 44 byte e non ha nulla di negoziabile: se
        un campo è sbagliato il file non si apre, e guardandolo non c'è modo di
        accorgersene. Quindi non si controlla l'intestazione — si scrive un
        buffer noto, lo si ridà da decodificare al browser e si confrontano i
        campioni. Se il ritorno somiglia all'andata, l'intestazione è giusta per
        costruzione. */
  {
    const sr = 48000, n = sr;                   // un secondo, stereo
    const c = new OfflineAudioContext(2, n, sr);
    const orig = c.createBuffer(2, n, sr);
    const a = orig.getChannelData(0), b = orig.getChannelData(1);
    for (let i = 0; i < n; i++) {
      a[i] = 0.8 * Math.sin((2 * Math.PI * 440 * i) / sr);
      b[i] = (i / n) * 2 - 1;                   // una rampa: prende tutti i valori
    }
    const blob = scriviWav(orig, 24);
    const tornato = await c.decodeAudioData(await blob.arrayBuffer());

    let peggio = 0;
    const a2 = tornato.getChannelData(0), b2 = tornato.getChannelData(1);
    for (let i = 0; i < n; i++) {
      peggio = Math.max(peggio, Math.abs(a[i] - a2[i]), Math.abs(b[i] - b2[i]));
    }
    R.wav = {
      byte: blob.size,
      attesi: 44 + n * 2 * 3,
      canali: tornato.numberOfChannels,
      campioni: tornato.length,
      scartoMax: +peggio.toExponential(1),
    };
    if (blob.size !== R.wav.attesi) R.errori.push("il wav è lungo " + blob.size + " byte invece di " + R.wav.attesi);
    if (tornato.numberOfChannels !== 2) R.errori.push("il wav torna con " + tornato.numberOfChannels + " canali");
    if (tornato.length !== n) R.errori.push("il wav torna con " + tornato.length + " campioni invece di " + n);
    // A 24 bit il passo di quantizzazione è 2⁻²³ ≈ 1,2·10⁻⁷: qualunque cosa
    // sopra 10⁻⁵ vuol dire che i byte non sono dove dovrebbero.
    if (peggio > 1e-5) R.errori.push("il wav torna diverso da com'è andato: " + peggio.toExponential(2));
  }

  /* 9 · L'ESPORTAZIONE NON DEVE TOCCARE LA SESSIONE.

        `rendiOffline` percorre lo stesso modello che sta suonando e riparte da
        zero: senza la fotografia, esportare mentre si ascolta riporterebbe
        l'origine dei giri a zero e farebbe ricominciare l'armonia da un'altra
        parte. Qui si prende un'impronta dello stato, si esporta, e si guarda
        se l'impronta è ancora quella. */
  {
    const impronta = () => JSON.stringify({
      f: frasi.map((L) => [L.period, L.cycleStart, L.idx, L.idea.length, L.offset, L.prossimoRicambio]),
      t: tessuti.map((L) => [L.period, L.cycleStart, L.idx, L.idea.length, L.offset, L.prossimoRicambio]),
      d: [deriva.centro, deriva.dens, deriva.spread, deriva.head, deriva.corpo],
      q: [quinta, passiQuinta, passoN, prossimaQuinta],
      g: [prossimoGrano, testaOra],
      s: SCALE.slice(0, 3),
    });

    // Si porta il modello in un punto qualunque, non all'origine: un'impronta
    // presa a modello appena nato passerebbe anche se il ripristino non
    // facesse niente. Le sorgenti si spengono mentre lo si porta avanti — lo
    // scheduler consuma gli indici e fa girare i cicli lo stesso, che è tutto
    // quello che serve, senza costruire quarantamila nodi da buttare.
    costruisciMotore();
    const acceso = [frasiOn, tessutiOn, graniOn];
    frasiOn = tessutiOn = graniOn = false;
    for (let t = 0; t < 40; t += 0.05) passo(t, false);
    frasiOn = acceso[0]; tessutiOn = acceso[1]; graniOn = acceso[2];
    const prima = impronta();
    await rendiOffline(6);
    const dopo = impronta();
    R.esportazione = { intatta: prima === dopo };
    if (prima !== dopo) R.errori.push("esportare ha spostato il modello della sessione");
  }

  return R;
});

console.log(JSON.stringify(esito, null, 1));
console.log("errori di pagina:", errori.length ? errori : "nessuno");
await b.close();
process.exit(esito.errori.length || errori.length ? 1 : 0);
