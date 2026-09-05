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

  /* 6b · LE TENUTE CHE ATTRAVERSANO UN PASSO DI QUINTA.

         Una tenuta viene intonata una volta sola, quando viene prenotata, e
         tiene quella frequenza fino in fondo — sessanta secondi al massimo.
         Se nel frattempo la collezione scatta e il grado che aveva scelto è
         proprio quello che se ne va, resta fuori: una nota sola di scarto, che
         su una pentatonica anemitonica è l'unica dissonanza che questo
         strumento sappia produrre. Misurato prima della correzione: il 22%
         delle tenute che attraversano un passo finiva fuori.

         `altezzaCheResta` sceglie fra i quattro gradi su cinque che valgono in
         tutte e due le collezioni, e prende il più vicino a quello voluto.
         Qui si verifica che non ne esca nemmeno una fuori, e che il rimedio
         non sia peggio del male: la nota si sposta di un grado, non di
         un'ottava. */
  {
    const classe = (hz) =>
      ((Math.round(12 * Math.log2(hz / (440 * Math.pow(2, -9 / 12)))) % 12) + 12) % 12;
    let fuoriPrima = 0, fuoriDopo = 0, spostate = 0, saltoMax = 0;
    const PROVE = 600;
    for (let k = 0; k < PROVE; k++) {
      const rel = Math.random() * 2 - 1, spread = effGT.registro / 100;
      const senza = altezza(rel, spread);
      const con = altezzaCheResta(rel, spread);
      if (senza !== con) {
        spostate++;
        saltoMax = Math.max(saltoMax, Math.abs(12 * Math.log2(con / senza)));
      }
      prossimaQuinta = 0; avanzaDeriva(k + 1);          // fa scattare la collezione
      const dopo = new Set(SCALE.map(classe));
      if (!dopo.has(classe(senza))) fuoriPrima++;
      if (!dopo.has(classe(con))) fuoriDopo++;
    }
    R.tenuteAlPasso = {
      senzaCorrezione: fuoriPrima + " su " + PROVE,
      conCorrezione: fuoriDopo + " su " + PROVE,
      spostate: spostate + " su " + PROVE,
      saltoMassimo: +saltoMax.toFixed(1) + " semitoni",
    };
    if (fuoriDopo)
      R.errori.push("una tenuta che attraversa il passo resta fuori dalla collezione: " +
                    fuoriDopo + " su " + PROVE);
    if (fuoriPrima === 0)
      R.errori.push("la prova non sa più distinguere il caso sbagliato: senza correzione " +
                    "nessuna tenuta finisce fuori, e allora non sta provando niente");
    if (saltoMax > 4)
      R.errori.push("la correzione sposta la nota di " + saltoMax.toFixed(1) +
                    " semitoni: doveva prendere il grado vicino, non saltare");
  }

  /* 6c · GLI INSERTI DELLE DUE CLASSI.

         NON si confrontano due render. Il modello sorteggia le idee mentre
         il render cammina, quindi due passate a inserto vuoto danno già uno
         scarto quadratico di 0,075 — grande quanto quello di un effetto
         acceso — e una prova che li sottraesse starebbe misurando il sorteggio.
         È la stessa regola che ha già fatto cadere una verifica dei grani:
         quello che si verifica è la PROMESSA, non un numero.

         Quindi ogni effetto viene costruito da solo, dentro un contesto suo,
         con un segnale noto in ingresso, e gli si chiede quello che dichiara di
         fare: l'eco che le ripetizioni arrivino a distanza giusta e SCENDANO,
         il tremolo che il guadagno scavi e che i due lati siano in controfase,
         il coro che allarghi i due lati, il filtro che tolga l'acuto. Ognuna
         verifica anche sé stessa, girando la manopola che dovrebbe spegnerla.

         Dal motore intero si chiede solo il resto: che arrivi all'uscita e che
         non clippi. */
  {
    const sr = 48000;

    /* Un effetto da solo: ingresso, effetto, uscita, e la sorgente che il
       chiamante attacca. I valori si scrivono con `t = 0`, cioè adesso, come
       fa il banco al montaggio: con la costante di lisciamento il primo
       secondo sarebbe una salita e non una misura. */
    const soloEffetto = async (nome, manopole, sorgente, secondi) => {
      const c = new OfflineAudioContext(2, Math.round(secondi * sr), sr);
      const ing = c.createGain(), usc = c.createGain();
      const e = EFFETTI[nome].costruisci(c, ing, usc);
      e.scrivi(EFFETTI[nome].param.map((par, i) => par.da(manopole[i])), 0, 0);
      usc.connect(c.destination);
      sorgente(c, ing);
      return c.startRendering();
    };
    const colpo = (c, dove) => {
      const b = c.createBuffer(1, 64, sr);
      b.getChannelData(0)[0] = 1;
      const s = c.createBufferSource(); s.buffer = b;
      s.connect(dove); s.start(0);
    };
    // Rumore IDENTICO sui due canali: la larghezza che si misura dopo dev'essere
    // tutta dell'effetto, e con due rumori diversi ci sarebbe già in partenza.
    const rumore = (secondi) => (c, dove) => {
      const n = Math.round(secondi * sr);
      const b = c.createBuffer(2, n, sr);
      let x = 12345;
      for (let i = 0; i < n; i++) {
        x = (x * 1103515245 + 12345) & 0x7fffffff;
        const v = (x / 0x3fffffff - 1) * 0.3;
        b.getChannelData(0)[i] = v; b.getChannelData(1)[i] = v;
      }
      const s = c.createBufferSource(); s.buffer = b;
      s.connect(dove); s.start(0);
    };
    const piccoFra = (buf, da, a) => {
      let m = 0;
      for (let ch = 0; ch < buf.numberOfChannels; ch++) {
        const x = buf.getChannelData(ch);
        for (let i = Math.floor(da * sr); i < Math.min(buf.length, Math.floor(a * sr)); i++)
          if (Math.abs(x[i]) > m) m = Math.abs(x[i]);
      }
      return m;
    };
    // Il correlatore fra due serie, −1 ÷ +1.
    const correla = (a, b) => {
      let ma = 0, mb = 0;
      for (let i = 0; i < a.length; i++) { ma += a[i]; mb += b[i]; }
      ma /= a.length; mb /= b.length;
      let ab = 0, aa = 0, bb = 0;
      for (let i = 0; i < a.length; i++) {
        const u = a[i] - ma, v = b[i] - mb;
        ab += u * v; aa += u * u; bb += v * v;
      }
      return aa > 0 && bb > 0 ? ab / Math.sqrt(aa * bb) : 0;
    };
    // L'inviluppo a blocchi di 25 ms: quello che il tremolo scava.
    const inviluppo = (buf, ch) => {
      const x = buf.getChannelData(ch), passo = Math.round(0.025 * sr), v = [];
      for (let i = 0; i + passo <= x.length; i += passo) {
        let s2 = 0;
        for (let k = 0; k < passo; k++) s2 += x[i + k] * x[i + k];
        v.push(Math.sqrt(s2 / passo));
      }
      return v;
    };
    // Quanto acuto c'è: la differenza prima di un rumore bianco vale √2 volte
    // il rumore stesso, e dopo un passa-basso stretto quasi niente. Non serve
    // una trasformata per una domanda che ha una risposta sola.
    const acuto = (buf) => {
      const x = buf.getChannelData(0);
      let d2 = 0, x2 = 0;
      for (let i = 1; i < x.length; i++) { const d = x[i] - x[i - 1]; d2 += d * d; x2 += x[i] * x[i]; }
      return x2 > 0 ? Math.sqrt(d2 / x2) : 0;
    };

    R.effetti = {};

    /* L'ECO: quantità al massimo, cioè solo bagnato, così quello che si misura
       sono le ripetizioni e non la somma col secco. */
    {
      const T = EFFETTI.eco.param[0].da(50);
      const buf = await soloEffetto("eco", [50, 100, 100], colpo, 6);
      const p = [];
      for (let k = 1; k <= 6; k++) p.push(piccoFra(buf, k * T, (k + 1) * T));
      const muto = await soloEffetto("eco", [50, 0, 100], colpo, 6);
      R.effetti.eco = { tempo: Math.round(T * 1000) + " ms",
                        ripetizioni: p.map((v) => +v.toFixed(3)) };
      if (p[0] < 0.1) R.errori.push("l'eco non ripete: la prima ripetizione è " + p[0].toFixed(3));
      for (let k = 1; k < p.length; k++)
        if (p[k] >= p[k - 1])
          R.errori.push("l'anello dell'eco non scende: la ripetizione " + (k + 1) +
                        " è " + p[k].toFixed(3) + " contro " + p[k - 1].toFixed(3));
      if (piccoFra(muto, 2 * T, 3 * T) > 0.02)
        R.errori.push("la prova non sa distinguere il caso sbagliato: a ritorni zero " +
                      "l'eco ripete lo stesso");
    }

    /* IL TREMOLO: profondità piena e i due lati a mezzo giro l'uno dall'altro. */
    {
      const buf = await soloEffetto("tremolo", [70, 100, 100], rumore(5), 5);
      const eL = inviluppo(buf, 0), eR = inviluppo(buf, 1);
      const max = Math.max(...eL), min = Math.min(...eL);
      const scava = (max - min) / Math.max(1e-9, max);
      const contro = correla(eL, eR);
      const fermo = await soloEffetto("tremolo", [70, 0, 100], rumore(5), 5);
      const fL = inviluppo(fermo, 0);
      const piatto = (Math.max(...fL) - Math.min(...fL)) / Math.max(1e-9, Math.max(...fL));
      R.effetti.tremolo = { scava: +scava.toFixed(2), lati: +contro.toFixed(2),
                            aProfonditaZero: +piatto.toFixed(2) };
      if (scava < 0.8) R.errori.push("il tremolo a profondità piena scava solo " + scava.toFixed(2));
      if (contro > -0.5)
        R.errori.push("i due lati del tremolo non sono in controfase: correlazione " +
                      contro.toFixed(2));
      if (piatto > 0.25)
        R.errori.push("la prova non sa distinguere il caso sbagliato: a profondità zero " +
                      "l'inviluppo si muove lo stesso");
    }

    /* IL CORO: quello che deve fare è SFASCIARE i due lati, e in ingresso sono
       lo stesso identico rumore. */
    {
      const buf = await soloEffetto("coro", [50, 100, 100], rumore(4), 4);
      const largo = correla(buf.getChannelData(0), buf.getChannelData(1));
      const secco = await soloEffetto("coro", [50, 100, 0], rumore(4), 4);
      const stretto = correla(secco.getChannelData(0), secco.getChannelData(1));
      R.effetti.coro = { lati: +largo.toFixed(2), aQuantitaZero: +stretto.toFixed(3) };
      if (largo > 0.7) R.errori.push("il coro non allarga: i due lati stanno a " + largo.toFixed(2));
      if (stretto < 0.99)
        R.errori.push("la prova non sa distinguere il caso sbagliato: a quantità zero " +
                      "i due lati sono già diversi");
    }

    /* IL FILTRO: taglio basso e nessun movimento, così la misura non insegue
       una frequenza che cammina. */
    {
      const buf = await soloEffetto("filtro", [20, 100, 0], rumore(3), 3);
      const nudo = await soloEffetto("niente", [], rumore(3), 3);
      R.effetti.filtro = { taglio: Math.round(EFFETTI.filtro.param[0].da(20)) + " Hz",
                           acuto: +acuto(buf).toFixed(3), crudo: +acuto(nudo).toFixed(3) };
      if (acuto(nudo) < 1)
        R.errori.push("la prova non sa distinguere il caso sbagliato: il rumore in " +
                      "ingresso non ha acuti da togliere");
      if (acuto(buf) > acuto(nudo) / 3)
        R.errori.push("il filtro non toglie l'acuto: " + acuto(buf).toFixed(3) +
                      " contro " + acuto(nudo).toFixed(3) + " crudo");
    }

    /* E dal motore intero, per tutti e quattro: che arrivino all'uscita e che
       non clippino, spinti nel loro angolo. */
    {
      const salva = { g: EFFETTO.gocce, t: EFFETTO.tessuti,
                      m: ["gE1", "gE2", "gE3", "tE1", "tE2", "tE3"].map((k) => G[k]) };
      const ANGOLI = { eco: [50, 100, 100], tremolo: [50, 100, 100],
                       coro: [50, 100, 100], filtro: [20, 100, 100] };
      R.effetti.resa = {};
      for (const nome of EFFETTI_NOMI) {
        if (nome === "niente") continue;
        EFFETTO.gocce = EFFETTO.tessuti = nome;
        ANGOLI[nome].forEach((v, i) => {
          G["gE" + (i + 1)] = GT["gE" + (i + 1)] = v;
          G["tE" + (i + 1)] = GT["tE" + (i + 1)] = v;
        });
        const m = misura(await rendiOffline(8));
        R.effetti.resa[nome] = { rms: m.rms, picco: dB(m.picco) + " dB" };
        if (m.rms < 0.002) R.errori.push("con «" + nome + "» non arriva niente all'uscita");
        if (m.picco >= 0.999) R.errori.push("«" + nome + "» clippa");
      }
      EFFETTO.gocce = salva.g; EFFETTO.tessuti = salva.t;
      ["gE1", "gE2", "gE3", "tE1", "tE2", "tE3"].forEach((k, i) => { G[k] = GT[k] = salva.m[i]; });
    }
  }

  /* 7 · IL PAESAGGIO.

        All'apertura questa sorgente è muta per costruzione — non c'è nessun
        suono in dotazione da percorrere — quindi la prova si porta una materia
        sua: sei secondi di quattro toni in successione, che è materiale
        riconoscibile e permette di verificare che la testa si muova davvero
        invece di stare ferma sullo stesso punto.

        Si verificano cinque cose:
         (a) che il drone suoni e non clippi, reso dal motore intero;
         (b) che LA TESTA CAMMINI AL PASSO GIUSTO: con un rallentamento di N il
             segmento deve durare N volte tanto. È il difetto più facile da
             introdurre — un accumulatore che non accumula, o che accumula alla
             velocità sbagliata — ed è muto: si sente solo come un paesaggio che
             non va da nessuna parte;
         (c) che il SEGMENTO tenga: la testa non deve mai uscire dai due estremi,
             comunque li si metta, e nemmeno rovesciandoli;
         (d) che L'ALTEZZA NON CAMBI col rallentamento — è tutto il punto del
             velo: la materia si distende senza traslocare — e per dirlo si
             misura dove sta l'energia dello spettro con due rallentamenti
             diversi;
         (e) che il riverbero del paesaggio SCENDA invece di crescere, che è il
             modo in cui una rete a retroazione sbaglia, e che ritararlo non lo
             faccia esplodere: la coda e il tono si muovono, e ogni volta il
             picco del filtro va rimisurato. */
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

    // (b) e (c) la testa dentro il segmento
    G.pInizio = GT.pInizio = 20; G.pFine = GT.pFine = 80;
    G.pRallenta = GT.pRallenta = 10; G.pVelo = GT.pVelo = 500;
    effettiviPaesaggio();
    const seg = segmento();
    testaOra = seg.a;
    let fuori = 0;
    for (let k = 0; k < 200; k++) {
      avanzaTesta(0.05);                       // dieci secondi di tempo vero
      if (testaOra < seg.a - 1e-6 || testaOra > seg.a + seg.corsa + 1e-6) fuori++;
    }
    R.paesaggio = {
      segmento: [+seg.a.toFixed(2), +seg.b.toFixed(2)],
      corsa: +seg.corsa.toFixed(2),
      dopo10s: +(testaOra - seg.a).toFixed(2),
    };
    if (fuori) R.errori.push("la testa esce dal segmento " + fuori + " volte su 200");
    // dieci secondi veri a rallentamento dieci fanno un secondo di materiale
    if (Math.abs((testaOra - seg.a) - 1) > 0.15)
      R.errori.push("la testa non cammina al passo del rallentamento: " +
                    (testaOra - seg.a).toFixed(2) + " s di materiale in dieci di tempo");
    // rovesciando le maniglie il segmento non sparisce, si specchia
    G.pInizio = GT.pInizio = 80; G.pFine = GT.pFine = 20;
    effettiviPaesaggio();
    const rovescio = segmento();
    if (Math.abs(rovescio.a - seg.a) > 1e-6 || Math.abs(rovescio.b - seg.b) > 1e-6)
      R.errori.push("rovesciando le maniglie il segmento non è lo stesso");
    G.pInizio = GT.pInizio = 0; G.pFine = GT.pFine = 100;

    // (a) la resa, dal motore intero
    G.pRallenta = GT.pRallenta = 8; G.pRiverbero = GT.pRiverbero = 70;
    G.pCoda = GT.pCoda = 12; G.pTono = GT.pTono = 2000;
    effettiviPaesaggio();
    const prima = [frasiOn, tessutiOn];
    frasiOn = false; tessutiOn = false;
    const drone = await rendiOffline(8);
    R.paesaggio.resa = misura(drone);
    R.paesaggio.veli = ultimoRender ? ultimoRender.veli : 0;
    if (R.paesaggio.resa.rms < 0.002) R.errori.push("il paesaggio non arriva all'uscita");
    if (R.paesaggio.resa.picco >= 0.999) R.errori.push("il paesaggio clippa");
    if (R.paesaggio.veli < 20)
      R.errori.push("in otto secondi sono usciti solo " + R.paesaggio.veli + " strati");

    // (d) il rallentamento non trasporta: il baricentro spettrale resta dov'è
    const baricentroDi = async (rallenta) => {
      G.pRallenta = GT.pRallenta = rallenta; effettiviPaesaggio();
      const buf = await rendiOffline(4);
      const n = 16384;
      const x = buf.getChannelData(0).slice(sr, sr + n);
      // Una DFT rada basta: si cerca dove sta l'energia, non lo spettro esatto.
      let somma = 0, peso = 0;
      for (let k = 4; k < 400; k++) {
        const f = (k * sr) / n;
        let re = 0, im = 0;
        for (let i = 0; i < n; i += 4) {
          const a = (2 * Math.PI * k * i) / n;
          re += x[i] * Math.cos(a); im -= x[i] * Math.sin(a);
        }
        const e = re * re + im * im;
        somma += e * f; peso += e;
      }
      return peso > 0 ? somma / peso : 0;
    };
    const lento = await baricentroDi(4), lentissimo = await baricentroDi(32);
    R.paesaggio.altezza = { a4: Math.round(lento), a32: Math.round(lentissimo) };
    const scarto = Math.abs(lento - lentissimo) / Math.max(1, lento);
    if (scarto > 0.2)
      R.errori.push("il rallentamento trasporta: il baricentro passa da " +
                    Math.round(lento) + " a " + Math.round(lentissimo) + " Hz");
    frasiOn = prima[0]; tessutiOn = prima[1];
    G.pRallenta = GT.pRallenta = 8; effettiviPaesaggio();

    // (e) la coda del riverbero del paesaggio, ritarata due volte
    {
      const p = new OfflineAudioContext(2, sr * 8, sr);
      const riv = costruisciRiverbero(p, { t60: 6, smorzamento: 3000,
                                           pettini: PETTINI_PAESAGGIO,
                                           passatutto: PASSATUTTO_PAESAGGIO });
      riv.tara(24, 900);                        // coda lunga e tono scuro
      riv.tara(9, 5200);                        // e ancora, per rimisurare
      const imp = p.createBufferSource();
      const b1 = p.createBuffer(1, 64, sr);
      b1.getChannelData(0)[0] = 1;
      imp.buffer = b1;
      imp.connect(riv.ingresso); riv.uscita.connect(p.destination);
      imp.start(0);
      const coda = await p.startRendering();
      const rmsFra = (buf, da, a) => {
        let s2 = 0, n = 0;
        for (let ch = 0; ch < buf.numberOfChannels; ch++) {
          const x = buf.getChannelData(ch);
          for (let i = Math.floor(da * sr); i < Math.floor(a * sr); i++) { s2 += x[i] * x[i]; n++; }
        }
        return Math.sqrt(s2 / Math.max(1, n));
      };
      const presto = rmsFra(coda, 1, 2), tardi = rmsFra(coda, 6, 7);
      R.paesaggio.riverbero = { caduta: numeroDb(dB(tardi) - dB(presto)) + " fra 1 s e 6 s" };
      if (!(tardi < presto))
        R.errori.push("la coda del paesaggio non scende dopo due ritarature");
    }

    /* (f) L'ACCORDATURA. Il paesaggio non ha un'altezza da trasporre — una
           registrazione ha la sua, che nessuno conosce, e un temporale non ne
           ha affatto — quindi non si tocca il materiale: un banco di
           passa-banda accordati sui gradi della collezione lo filtra, e quello
           che esce canta le note del campo qualunque cosa sia entrata. Si prova
           sul caso peggiore per qualunque altro metodo e migliore per questo:
           RUMORE BIANCO.

           Si misura l'energia SUI GRADI contro quella un SEMITONO più su. Il
           semitono e non un quarto di tono, per due ragioni: la pentatonica non
           ha semitoni, quindi quella frequenza è per costruzione una nota che la
           collezione non contiene; e un quarto di tono starebbe ancora dentro la
           banda passante, quindi la misura direbbe che il banco non fa niente.

           Si verifica anche il contrario — che il materiale crudo NON mostri
           nessuna preferenza. Una misura che trovasse i gradi già accesi senza
           il banco non starebbe misurando il banco. */
    {
      /* Il rumore è SORTEGGIATO CON UN SEME, non con `Math.random`. Con un
         rumore diverso a ogni corsa la misura qui sotto ballava di un decibel
         buono e il controllo su sé stessa — che il crudo non mostri
         preferenze — falliva una corsa ogni tanto senza che niente fosse
         rotto. Un seme non rende la prova più debole: il rumore bianco è
         bianco comunque, e questo è sempre lo stesso. */
      const rumore = c.createBuffer(1, sr * sec, sr);
      const r = rumore.getChannelData(0);
      let seme = 20260905;
      for (let i = 0; i < r.length; i++) {
        seme = (seme * 1103515245 + 12345) & 0x7fffffff;
        r[i] = (seme / 0x3fffffff - 1) * 0.4;
      }
      aggiungiMateria("rumore", rumore);

      // Goertzel: l'energia a una frequenza sola, senza costruire uno spettro.
      const energia = (x, f) => {
        const k = 2 * Math.cos((2 * Math.PI * f) / sr);
        let s0 = 0, s1 = 0, s2 = 0;
        for (let i = 0; i < x.length; i++) { s0 = x[i] + k * s1 - s2; s2 = s1; s1 = s0; }
        return s1 * s1 + s2 * s2 - k * s1 * s2;
      };
      const PRESE = [-6, -4, -2, 0, 2, 4, 6];
      const FETTE = [1, 2, 3, 4];
      const suiGradi = (buf) => {
        const d0 = buf.getChannelData(0);
        let sui = 0, fra = 0;
        // QUATTRO FETTE da un secondo invece di una da due, e sette prese per
        // grado invece di tre. L'energia a una frequenza sola su del rumore è
        // una variabile aleatoria con la coda lunga: quello che la calma non è
        // guardare più a lungo — una finestra doppia dà una riga più stretta,
        // non una stima più ferma — ma MEDIARE PIÙ STIME INDIPENDENTI. Ventotto
        // per grado invece di tre. Le sette prese stanno su dodici hertz, cioè
        // dentro la banda passante (a fuoco 24 un filtro su 400 Hz è largo
        // diciassette) mentre il semitono accanto, che dista il sei per cento,
        // ne sta comodamente fuori.
        for (const t of FETTE) {
          const x = d0.slice(sr * t, sr * (t + 1));
          for (let i = 0; i < SCALE.length; i++) {
            if (SCALE[i] < 150 || SCALE[i] > 1200) continue;
            for (const d of PRESE) {
              sui += energia(x, SCALE[i] + d);
              fra += energia(x, SCALE[i] * Math.pow(2, 1 / 12) + d);
            }
          }
        }
        return 10 * Math.log10(sui / fra);
      };

      /* Le altre due classi vanno spente, e non è un dettaglio: gocce e tessuti
         stanno GIÀ sui gradi della collezione per costruzione, quindi lasciarle
         accese vorrebbe dire misurare loro. Misurato: con le classi accese il
         materiale crudo mostrava +24 dB di preferenza per i gradi, cioè la
         prova diceva che il banco funziona anche quando è spento. */
      const acceseQui = [frasiOn, tessutiOn];
      frasiOn = false; tessutiOn = false;
      G.pRiverbero = GT.pRiverbero = 0;        // si misura il segnale, non la stanza
      G.pFuoco = GT.pFuoco = 24;
      const rendiCon = async (quanto) => {
        G.pAccordatura = GT.pAccordatura = quanto;
        effettiviPaesaggio();
        const buf = await rendiOffline(6);
        return { sui: suiGradi(buf), m: misura(buf) };
      };
      const crudo = await rendiCon(0);
      const intonato = await rendiCon(100);

      R.paesaggio.accordatura = {
        crudo: +crudo.sui.toFixed(1) + " dB sui gradi",
        intonato: +intonato.sui.toFixed(1) + " dB sui gradi",
        livello: numeroDb(dB(intonato.m.rms) - dB(crudo.m.rms)),
      };
      if (intonato.sui < crudo.sui + 4)
        R.errori.push("l'accordatura non intona: sui gradi " + intonato.sui.toFixed(1) +
                      " dB contro " + crudo.sui.toFixed(1) + " dB del crudo");
      if (Math.abs(crudo.sui) > 3)
        R.errori.push("la prova dell'accordatura non sa distinguere: il materiale crudo " +
                      "mostra già " + crudo.sui.toFixed(1) + " dB di preferenza per i gradi");
      if (Math.abs(dB(intonato.m.rms) - dB(crudo.m.rms)) > 3)
        R.errori.push("accendere l'accordatura sposta il livello di " +
                      (dB(intonato.m.rms) - dB(crudo.m.rms)).toFixed(1) + " dB");
      if (intonato.m.picco >= 0.999) R.errori.push("l'accordatura fa clippare il paesaggio");

      frasiOn = acceseQui[0]; tessutiOn = acceseQui[1];
      G.pRiverbero = GT.pRiverbero = 70;
      G.pAccordatura = GT.pAccordatura = 55;
      G.pFuoco = GT.pFuoco = 18;
      effettiviPaesaggio();
      materiale = 0;                            // si torna ai quattro toni
    }
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
      g: [prossimoVelo, testaOra],
      s: SCALE.slice(0, 3),
    });

    // Si porta il modello in un punto qualunque, non all'origine: un'impronta
    // presa a modello appena nato passerebbe anche se il ripristino non
    // facesse niente. Le sorgenti si spengono mentre lo si porta avanti — lo
    // scheduler consuma gli indici e fa girare i cicli lo stesso, che è tutto
    // quello che serve, senza costruire quarantamila nodi da buttare.
    costruisciMotore();
    const acceso = [frasiOn, tessutiOn, paesaggioOn];
    frasiOn = tessutiOn = paesaggioOn = false;
    for (let t = 0; t < 40; t += 0.05) passo(t, false);
    frasiOn = acceso[0]; tessutiOn = acceso[1]; paesaggioOn = acceso[2];
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
