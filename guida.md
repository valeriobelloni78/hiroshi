<!--
  GUIDA DI HIROSHI · COPIA DI LAVORO IN ITALIANO

  Qui si scrive la guida; poi i testi si riportano in js/guida-i18n.js e si
  traducono in francese, inglese e giapponese.

  · Ogni testo ha sopra una riga di commento con la sua chiave (per esempio
    g.pae.1): dice a quale testo della pagina appartiene quello che segue.
    Lasciala al suo posto; il testo sotto si può cambiare liberamente.
  · Un paragrafo NUOVO si scrive senza commento: gli verrà data una chiave.
    Un paragrafo da togliere si cancella insieme al suo commento.
  · Nelle tabelle la mappa sopra ciascuna dice da dove viene ogni cella.
    «nome» è una parola dello strumento, la stessa che sta sul pannello:
    cambiarla qui vuol dire cambiarla anche sui comandi. «corsa» è scritta a
    mano in guida.html, ed è l'unica cifra che la guida non legge dal motore.
    Le tabelle che nella pagina non hanno intestazione qui ce l'hanno vuota.
  · I simboli e le unità (dB, Hz, ms, ×, °) non si traducono.
-->

<!-- g.titolo -->
# Hiroshi · Guida

<!-- g.occhiello -->
*Manuale d'uso*

<!-- g.intro -->
Hiroshi è un generatore di musica ambientale che gira nel browser. Produce due classi di eventi — impulsi brevi e suoni tenuti — su otto linee cicliche indipendenti, li intona su un campo armonico che si sposta lentamente, e li somma in un banco d'uscita con equalizzatore, limitatore e registratore. Una quarta sorgente riproduce materiale registrato rallentato senza trasposizione. Questo documento descrive ogni comando: corsa, unità e effetto sul segnale.

---

<!-- g.pan.t -->
## Catena del segnale

<!-- g.pan.1 -->
Le tre sorgenti sono indipendenti e si possono spegnere una per una col tasto ON sotto il loro canale del mixer. Ogni sorgente ha un canale nel banco: normalizzatore, inserto d'effetto, cursore di livello e mandata al riverbero comune. La somma passa per un filtro di colore d'insieme, l'equalizzatore a otto bande e un limitatore a due stadi.

<!-- g.pan.catena -->
```
sorgente → normalizzatore → inserto → livello → somma → colore → equalizzatore → limitatore → uscita
livello → mandata → riverbero → somma
```

<!-- g.pan.2 -->
Spegnere una sorgente non mette in pausa il modello: i cicli e il ricambio delle idee proseguono, e riaccendendola si sente il punto in cui il pezzo è arrivato, non quello in cui era stato lasciato.

<!-- g.pan.3 -->
Il riverbero della sorgente Paesaggio è interno e non usa la mandata comune: la sua coda è parte del suono.

---

<!-- g.tempo.t -->
## Struttura temporale

<!-- g.tempo.1 -->
Otto linee cicliche, quattro per classe. Ogni linea ha un periodo proprio, regolabile fra 3 e 30 s per le gocce e fra 7 e 60 s per i tessuti, e mantiene una fase indipendente. Il generatore riempie un giro alla volta e prenota gli eventi con un anticipo di 0,15 s.

<!-- g.tempo.2 -->
Di default i quattro periodi di una classe sono coprimi a due a due. La combinazione delle otto fasi si ripete solo dopo il minimo comune multiplo dei periodi: con i valori d'esordio il riallineamento cade oltre le sessanta ore. La lettura RIALLINEA in testa alla sezione 05 riporta quel tempo per i periodi correnti.

<!-- g.tempo.3 -->
Ogni riga di linea espone la durata del giro, un interruttore di silenziamento e un comando di rigenerazione, che sostituisce l'idea di quella linea senza toccare le altre.

---

<!-- g.gocce.t -->
## 01 · Gocce

<!-- g.gocce.1 -->
Impulsi brevi con inviluppo percussivo. Ogni linea tiene un'idea — una sequenza di posizioni nel campo armonico — e la ripete a ogni giro finché non viene sostituita. La posizione è relativa: la frequenza si calcola al momento della prenotazione, quindi un'idea ferma segue i cambi del campo senza essere riscritta.

<!-- g.gocce.forma -->
### Forma del suono

<!-- tabella
  intestazione: g.col.par | g.col.corsa | g.col.fun
  riga: fl.attacco | a mano: corsa | g.p.attacco
  riga: fl.coda | a mano: corsa | g.p.coda
  riga: fl.inarmonicita | a mano: corsa | g.p.inarm
  riga: fl.brillantezza | a mano: corsa | g.p.brill
  riga: fl.corpo | a mano: corsa | g.p.corpo
-->
| Parametro | Corsa | Funzione |
|---|---|---|
| Attacco | 1 – 60 ms | Tempo di salita dell'inviluppo. |
| Coda | 0,2 – 6,0 s | Tempo di discesa. Determina la lunghezza della tacca radiale sul quadrante. |
| Inarmonicità | 0 – 1 | Scostamento dei parziali dai multipli interi della fondamentale. |
| Brillantezza | 0 – 1 | Frequenza di taglio del passa-basso di voce, in scala esponenziale. |
| Corpo | 0 – 1 | Peso relativo della fondamentale rispetto ai parziali. |

<!-- g.gocce.insieme -->
### Insieme

<!-- tabella
  intestazione: nessuna
  riga: fl.addensamento | a mano: corsa | g.p.addens
  riga: fl.densita | a mano: corsa | g.p.densita
  riga: fl.spazio | a mano: corsa | g.p.spazio
-->
|   |   |   |
|---|---|---|
| Addensamento | 0,05 – 1 | Frazione del giro entro cui cadono gli eventi di un'idea. A valori bassi si raccolgono all'inizio del giro; a 100 sono distribuiti su tutto il giro. |
| Densità | 1 – 20 | Numero massimo di eventi per giro. Il valore effettivo per ciascuna idea viene sorteggiato entro questo limite alla nascita dell'idea. |
| Spazio | 0 – 1 | Mandata al riverbero comune del canale. |

<!-- g.gocce.man -->
### Manopole

<!-- tabella
  intestazione: nessuna
  riga: fl.registro | g.corsa.ott | g.p.registro
  riga: fl.calore | a mano: corsa | g.p.calore
-->
|   |   |   |
|---|---|---|
| Registro | 0 – 3,2 ott | Ampiezza della finestra sul campo armonico. A cursore pieno la finestra copre poco più di tre ottave. |
| Calore | 0 – 1 | Parametro unico del timbro: ciascuno degli otto lo interpreta a modo suo, e la corona ne mostra il valore effettivo dopo l'influenza dell'ora del giorno. |

<!-- g.gocce.timbri -->
### Gli otto timbri

<!-- tabella
  intestazione: g.col.nome | g.col.desc
  riga: timbri.vetro | g.tim.vetro
  riga: timbri.legno | g.tim.legno
  riga: timbri.onda | g.tim.onda
  riga: timbri.soffio | g.tim.soffio
  riga: timbri.corda | g.tim.corda
  riga: timbri.metallo | g.tim.metallo
  riga: timbri.canna | g.tim.canna
  riga: timbri.sabbia | g.tim.sabbia
-->
| Nome | Sintesi |
|---|---|
| Vetro | Sinusoide con due parziali inarmonici e coda lunga. |
| Legno | Impulso filtrato con risonanza media e decadimento rapido. |
| Onda | Triangolare filtrata, attacco morbido, nessun parziale inarmonico. |
| Soffio | Rumore filtrato a banda stretta accordato sull'altezza. |
| Corda | Dente di sega con passa-basso che scende durante la coda. Non è una Karplus-Strong: un anello su un nodo di ritardo non scende sotto i 128 campioni, che fisserebbero l'altezza massima a 375 Hz. |
| Metallo | Sei parziali in rapporti inarmonici fissi, decadimento differenziato. |
| Canna | Quadra filtrata con formante fissa, attacco con rumore. |
| Sabbia | Rumore a banda larga con inviluppo brevissimo: grana, non altezza. |

---

<!-- g.tess.t -->
## 02 · Tessuti

<!-- g.tess.1 -->
Suoni tenuti, da pochi secondi a un minuto. A differenza delle gocce non sono materie diverse ma modi diversi di essere instabili.

<!-- g.tess.2 -->
La somma del bus si normalizza sugli inviluppi e non sul numero di voci aperte: la compensazione legge la stessa funzione che scrive l'automazione, quindi non c'è un salto di livello nell'istante in cui una voce comincia ad aprirsi.

<!-- g.gocce.forma -->
### Forma del suono

<!-- tabella
  intestazione: g.col.par | g.col.corsa | g.col.fun
  riga: fl.apertura | a mano: corsa | g.p.apertura
  riga: fl.chiusura | a mano: corsa | g.p.chiusura
  riga: fl.movimento | a mano: corsa | g.p.movimento
  riga: fl.brillantezza | a mano: corsa | g.p.tbrill
  riga: fl.corpo | a mano: corsa | g.p.tcorpo
-->
| Parametro | Corsa | Funzione |
|---|---|---|
| Apertura | 0,3 – 12,0 s | Tempo di salita dell'inviluppo. |
| Chiusura | 0,3 – 15,0 s | Tempo di discesa. |
| Movimento | 0 – 1 | Ampiezza del movimento interno. Che cosa si muova dipende dal tenuto scelto. |
| Brillantezza | 0 – 1 | Frequenza di taglio del passa-basso di voce. |
| Corpo | 0 – 1 | Peso della fondamentale rispetto alle bande superiori. |

<!-- g.gocce.insieme -->
### Insieme

<!-- tabella
  intestazione: nessuna
  riga: fl.intreccio | a mano: corsa | g.p.intreccio
  riga: fl.livello | a mano: corsa | g.p.livello
  riga: fl.spazio | a mano: corsa | g.p.tspazio
-->
|   |   |   |
|---|---|---|
| Intreccio | 0 – 1 | Durata di una tenuta come frazione del periodo della sua linea, e con essa quante ne restano aperte insieme. |
| Livello | −19,0 – −1,5 dB | Livello della classe rispetto al primo piano, in decibel. È un parametro del modello, distinto dall'asta del mixer: la deriva lo muove di ±9 e un mood lo riscrive. |
| Spazio | 0 – 1 | Mandata al riverbero comune del canale. |

<!-- g.gocce.man -->
### Manopole

<!-- tabella
  intestazione: nessuna
  riga: fl.registro | g.corsa.ott | g.p.tregistro
  riga: fl.passo | a mano: corsa | g.p.passo
-->
|   |   |   |
|---|---|---|
| Registro | 0 – 3,2 ott | Ampiezza della finestra sul campo armonico, con ripiegamento per ottave che conserva la classe d'altezza. |
| Passo | 0 – 1 | Velocità del movimento interno. L'unità dipende dal tenuto: centesimi di semitono, hertz di battimento, larghezza di banda. |

<!-- g.tess.timbri -->
### Gli otto tenuti

<!-- tabella
  intestazione: g.col.nome | g.col.desc
  riga: tenuti.bordone | g.ten.bordone
  riga: tenuti.marea | g.ten.marea
  riga: tenuti.attrito | g.ten.attrito
  riga: tenuti.frangia | g.ten.frangia
  riga: tenuti.corrente | g.ten.corrente
  riga: tenuti.cavo | g.ten.cavo
  riga: tenuti.brina | g.ten.brina
  riga: tenuti.soglia | g.ten.soglia
-->
| Nome | Sintesi |
|---|---|
| Bordone | Fondamentale con quinta e ottava, deriva di intonazione lentissima. |
| Marea | Due bande di rumore filtrato che si scambiano energia. |
| Attrito | Dente di sega dentro un passa-basso la cui frequenza oscilla: grana dentro l'altezza. |
| Frangia | Due sinusoidi separate di pochi hertz. Il battimento è la loro differenza, e il passo la scrive in hertz. |
| Corrente | Rumore filtrato con banda che si sposta in continuo. |
| Cavo | Tre formanti che si spostano fra la posizione della «a» e quella della «u». Altezza ferma, spettro in movimento. |
| Brina | Parziali alti con ampiezze che si accendono e si spengono in modo indipendente. |
| Soglia | Rumore ad alta frequenza di cui varia solo il livello. Nessuna altezza, nessun battimento. |

---

<!-- g.ins.t -->
## Inserti

<!-- g.ins.1 -->
Ogni classe ha un inserto sul proprio canale, fra il normalizzatore e la coppia livello/mandata. L'effetto si sceglie dalla tendina sotto il quadrante; le tre manopole cambiano funzione con l'effetto ma mantengono la posizione, come le manopole di un pannello che sta fuori dall'effetto.

<!-- g.ins.2 -->
Il riverbero non è fra gli effetti: la mandata alla stanza comune è già il comando Spazio della corona di ciascuna classe.

<!-- g.ins.3 -->
Il cambio di effetto dal vivo passa per una dissolvenza di 30 ms in entrata e in uscita.

<!-- tabella
  intestazione: g.col.nome | g.col.desc
  riga: effetto.niente | g.eff.niente
  riga: effetto.eco | g.eff.eco
  riga: effetto.tremolo | g.eff.tremolo
  riga: effetto.coro | g.eff.coro
  riga: effetto.filtro | g.eff.filtro
-->
| Nome | Sintesi |
|---|---|
| niente | Inserto vuoto. Le tre manopole sono disattivate. |
| eco | Linea di ritardo con retroazione e passa-basso nell'anello a 2,8 kHz. Miscelazione a potenza costante fra secco e ripetizioni. |
| tremolo | Modulazione d'ampiezza sui due canali, con sfasamento regolabile fra destra e sinistra. |
| coro | Due copie ritardate di 11 e 17 ms, modulate in controfase. La larghezza nasce dalla differenza fra i due lati. |
| filtro | Passa-basso risonante con oscillatore lento sul taglio. In serie, non miscelato. |

<!-- effetto.eco -->
### eco

<!-- tabella
  intestazione: nessuna
  riga: par.tempo | a mano: corsa | g.pe.tempo
  riga: par.ritorni | a mano: corsa | g.pe.ritorni
  riga: par.quantita | a mano: corsa | g.pe.quantita
-->
|   |   |   |
|---|---|---|
| Tempo | 60 – 1200 ms | Tempo di ritardo. |
| Ritorni | 0 – 0,80 | Guadagno d'anello. Il massimo è 0,8: sopra, la coda cresce invece di scendere. |
| Quantità | 0 – 1 | Miscelazione fra segnale diretto ed effetto, a potenza costante. |

<!-- effetto.tremolo -->
### tremolo

<!-- tabella
  intestazione: nessuna
  riga: par.velocita | a mano: corsa | g.pe.velocita
  riga: par.profondita | a mano: corsa | g.pe.profondita
  riga: par.larghezza | a mano: corsa | g.pe.larghezza
-->
|   |   |   |
|---|---|---|
| Velocità | 0,1 – 6,0 Hz | Frequenza dell'oscillatore di modulazione. |
| Profondità | 0 – 1 | Ampiezza della modulazione. |
| Larghezza | 0 – 180° | Sfasamento della modulazione fra i due canali. A 0° il suono pulsa al centro, a 180° si sposta da un lato all'altro. |

<!-- effetto.coro -->
### coro

<!-- tabella
  intestazione: nessuna
  riga: par.velocita | a mano: corsa | g.pe.velocita
  riga: par.profondita | a mano: corsa | g.pe.profondita
  riga: par.quantita | a mano: corsa | g.pe.quantita
-->
|   |   |   |
|---|---|---|
| Velocità | 0,05 – 2,00 Hz | Frequenza dell'oscillatore di modulazione. |
| Profondità | 0,4 – 5,9 ms | Ampiezza della modulazione. |
| Quantità | 0 – 1 | Miscelazione fra segnale diretto ed effetto, a potenza costante. |

<!-- effetto.filtro -->
### filtro

<!-- tabella
  intestazione: nessuna
  riga: par.taglio | a mano: corsa | g.pe.taglio
  riga: par.risonanza | a mano: corsa | g.pe.risonanza
  riga: par.movimento | g.corsa.ottmov | g.pe.movimento
-->
|   |   |   |
|---|---|---|
| Taglio | 200 – 12000 Hz | Frequenza di taglio, in scala esponenziale. |
| Risonanza | 0,7 – 11,7 | Fattore di merito del filtro. |
| Movimento | 0 – 2 ott | Escursione dell'oscillatore lento sul taglio, in ottave attorno alla frequenza impostata. |

---

<!-- g.banco.t -->
## 03 · Banco

<!-- g.banco.1 -->
Uscita dello studio. Ogni canale ha un normalizzatore scritto dalla sorgente — che compensa quante voci sono aperte — un cursore di livello e una mandata al riverbero comune, in quest'ordine: il riverbero riceve il segnale già compensato.

<!-- g.banco.2 -->
L'equalizzatore ha otto bande a frequenza fissa, corsa ±8 dB. La curva disegnata sopra le aste è la risposta vera dei filtri, chiesta al grafo audio, non un'interpolazione delle posizioni.

<!-- g.banco.3 -->
Due uscite diverse. La registrazione dal vivo cattura la seduta con dentro i movimenti dei cursori. L'esportazione rende il pezzo fuori tempo reale, molto più in fretta del tempo reale, senza nessuna mano dentro: percorre lo stesso modello e le stesse tarature, quindi il file suona come quello che si sta ascoltando.

<!-- tabella
  intestazione: g.col.par | g.col.corsa | g.col.fun
  riga: et.mixer | a mano: corsa | g.p.mixer
  riga: et.profilo | a mano: corsa | g.p.eq
  riga: fl.limitatore | a mano: corsa | g.p.limitatore
  riga: fl.picco | a mano: corsa | g.p.picco
  riga: banco.registra | a mano: corsa | g.p.registra
  riga: banco.tracciaWav | g.corsa.min | g.p.esporta
-->
| Parametro | Corsa | Funzione |
|---|---|---|
| MIXER | −24 – +6 dB | Livello dei tre canali e dell'uscita. Sul canale dei tessuti si somma in decibel al parametro Livello del modello. |
| PROFILO | ±8 dB | Otto bande: 20 Hz shelf, 50 · 100 · 500 · 1k · 5k · 10k campana, 18 kHz shelf. |
| Limitatore | dB | Due stadi in cascata sull'uscita. La lettura indica la riduzione di guadagno istantanea. |
| Picco | dB | Picco del segnale d'uscita, con tenuta di 20 dB al secondo. |
| Registra | — | Presa dal vivo dall'uscita del banco. Il file esce in wav 24 bit stereo. |
| Traccia wav | 1 – 20 min | Rendering fuori tempo reale della durata scelta, in wav 24 bit stereo. |

---

<!-- g.pae.t -->
## 04 · Paesaggio

<!-- g.pae.1 -->
Riproduce materiale registrato — un file caricato o una presa dal microfono — rallentato di un fattore fra 1 e 64 senza trasporlo. Il materiale non si conserva: vive finché la pagina resta aperta.

<!-- g.pae.2 -->
Il rallentamento non si ottiene leggendo il buffer più piano, che abbasserebbe anche l'altezza. La materia si legge a velocità naturale in finestre sovrapposte, e a camminare piano è il punto da cui le finestre vengono prese. Le finestre sono quattro per istante, con campane sfasate: con meno si sente il confine fra una e l'altra.

<!-- g.pae.3 -->
L'intonazione non trasporta il materiale ma gli mette dietro un banco di passa-banda accordati sui gradi della collezione corrente, fra 110 e 1500 Hz. Il banco tiene gli indici del campo, non le frequenze: al passo di quinta i filtri si spostano con una costante lunga, e quattro filtri su cinque riscrivono lo stesso valore.

<!-- g.pae.4 -->
Il segmento si sceglie con le due maniglie sopra l'onda. Rovesciandole il segmento si specchia invece di annullarsi. La banda chiara che cammina dentro il segmento è la finestra di lettura corrente.

<!-- g.pae.5 -->
La testa di lettura ha cinque modi. AVANTI la fa camminare verso la fine del segmento e la riporta al capo; INDIETRO la fa camminare verso l'inizio. PENDOLO la fa rimbalzare fra i due estremi. FERMO la tiene nel punto in cui si trova. RANDOM la fa saltare in un punto casuale del segmento, legge da lì in avanti per la durata della sosta e poi salta di nuovo; il punto d'arrivo del salto successivo è segnato sull'onda con un tratteggio. In tutti i modi le finestre suonano in avanti a velocità naturale: a cambiare verso è la testa, non il materiale.

<!-- tabella
  intestazione: g.col.par | g.col.corsa | g.col.fun
  riga: fl.segmento | a mano: corsa | g.p.segmento
  riga: et.lettura | a mano: corsa | g.p.lettura
  riga: fl.sosta | a mano: corsa | g.p.sosta
  riga: fl.rallentamento | a mano: corsa | g.p.rallenta
  riga: fl.velo | a mano: corsa | g.p.velo
  riga: fl.sparpaglio | a mano: corsa | g.p.sparpaglio
  riga: fl.accordatura | a mano: corsa | g.p.accordatura
  riga: fl.fuoco | a mano: corsa | g.p.fuoco
  riga: fl.coda | a mano: corsa | g.p.pcoda
  riga: fl.tono | a mano: corsa | g.p.ptono
  riga: fl.riverbero | a mano: corsa | g.p.priverbero
-->
| Parametro | Corsa | Funzione |
|---|---|---|
| Segmento | 0 – 100 % | Estremi del segmento percorso, in centesimi della durata del materiale. |
| LETTURA | — | Modo in cui la testa percorre il segmento: avanti, indietro, pendolo, fermo, random. |
| Sosta | 1 – 30 s | Durata di lettura di ciascuna area nel modo RANDOM, in scala esponenziale. Negli altri modi è disattivata. |
| Rallentamento | 1 – 64 × | Fattore di rallentamento della testa di lettura. |
| Velo | 80 – 2000 ms | Durata di una finestra di lettura. |
| Sparpaglio | 0 – 1 | Scarto casuale sul punto di partenza di ogni finestra. A zero le finestre partono tutte dallo stesso punto e la somma diventa un filtro a pettine. |
| Accordatura | 0 – 1 | Miscelazione fra materiale crudo e materiale passato per il banco risonante. |
| Fuoco | 8 – 80 | Fattore di merito dei filtri del banco. Sotto 8 i filtri non distinguono più un grado dal semitono accanto; il guadagno del banco cresce col fuoco in modo da non spostare il livello. |
| Coda | 1 – 40 s | Tempo di riverberazione della rete interna del paesaggio. |
| Tono | 300 – 12000 Hz | Frequenza di smorzamento nell'anello del riverbero. |
| Riverbero | 0 – 1 | Miscelazione fra segnale diretto e coda. |

---

<!-- g.der.t -->
## 05 · Deriva

<!-- g.der.1 -->
Il campo armonico è una pentatonica anemitonica — gradi 0, 2, 4, 7, 9 — replicata su cinque ottave, per venticinque altezze. Le due classi leggono lo stesso campo e lo stesso baricentro; cambia solo l'ampiezza della finestra.

<!-- g.der.2 -->
Ogni 2′ 30″ esatti la collezione si sposta di una quinta. Fra una pentatonica e la sua quinta cambia una nota su cinque: quattro gradi su cinque restano validi in entrambe. Una tenuta destinata ad attraversare il passo viene intonata su un grado che sopravvive, così non resta fuori collezione mentre suona.

<!-- g.der.3 -->
Il baricentro è il movimento continuo: le altezze restano ferme e a scorrere è il punto attorno a cui vengono scelte. Lo governano sei canali a rapporti irrazionali, quindi il pezzo non ripassa mai esattamente dove è già stato. La corsia in fondo alla sezione ne mostra quindici minuti; le colonne in ambra segnano i punti di inversione.

<!-- g.der.4 -->
Il comando MATERIALE decide che cosa succede alle idee al passo di quinta.

<!-- tabella
  intestazione: et.materiale | g.col.fun
  riga: modo.ancora | g.p.ancora
  riga: modo.deriva | g.p.deriva
-->
| MATERIALE | Funzione |
|---|---|
| ancora | Le idee restano quelle fissate dal mood: cambiano di altezza seguendo il campo, ma la sequenza resta la stessa. |
| deriva | Le idee si rigenerano a ogni passo di quinta. |

---

<!-- g.mood.t -->
## Mood

<!-- g.mood.1 -->
Sedici configurazioni complete, otto per classe. Un mood scrive insieme i parametri, i quattro periodi delle linee e il nome del timbro, perché la configurazione temporale è parte del carattere quanto il suono. La scrittura è immediata e non lisciata: un mood è uno scatto, non un gesto.

<!-- g.mood.2 -->
Ogni timbro compare una volta sola per tabella: girando gli otto si attraversano tutti e otto i suoni.

<!-- tabella
  intestazione: sez.gocce | et.timbro | g.col.periodi
  riga: mood.sereno | timbri.vetro | a mano: corsa
  riga: mood.pioggia | timbri.sabbia | a mano: corsa
  riga: mood.vespro | timbri.onda | a mano: corsa
  riga: mood.carillon | timbri.metallo | a mano: corsa
  riga: mood.arcipelago | timbri.corda | a mano: corsa
  riga: mood.collina | timbri.legno | a mano: corsa
  riga: mood.finestra | timbri.soffio | a mano: corsa
  riga: mood.nuvola | timbri.canna | a mano: corsa
-->
| Gocce | TIMBRO | Periodi |
|---|---|---|
| Sereno | Vetro | 7 · 11 · 13 · 17 |
| Pioggia | Sabbia | 5 · 7 · 9 · 11 |
| Vespro | Onda | 17 · 19 · 23 · 29 |
| Carillon | Metallo | 4 · 9 · 17 · 25 |
| Arcipelago | Corda | 13 · 16 · 21 · 25 |
| Collina | Legno | 8 · 13 · 19 · 27 |
| Finestra | Soffio | 9 · 14 · 23 · 25 |
| Nuvola | Canna | 6 · 11 · 19 · 25 |

<!-- tabella
  intestazione: sez.tessuti | et.timbro | g.col.periodi
  riga: mood.velo | tenuti.corrente | a mano: corsa
  riga: mood.fondale | tenuti.bordone | a mano: corsa
  riga: mood.lino | tenuti.attrito | a mano: corsa
  riga: mood.respiro | tenuti.frangia | a mano: corsa
  riga: mood.bruma | tenuti.soglia | a mano: corsa
  riga: mood.tenda | tenuti.cavo | a mano: corsa
  riga: mood.seta | tenuti.brina | a mano: corsa
  riga: mood.vela | tenuti.marea | a mano: corsa
-->
| Tessuti | TIMBRO | Periodi |
|---|---|---|
| Velo | Corrente | 9 · 16 · 25 · 31 |
| Fondale | Bordone | 31 · 37 · 41 · 43 |
| Lino | Attrito | 8 · 15 · 19 · 23 |
| Respiro | Frangia | 23 · 29 · 41 · 43 |
| Bruma | Soglia | 31 · 37 · 43 · 47 |
| Tenda | Cavo | 19 · 29 · 37 · 47 |
| Seta | Brina | 8 · 9 · 25 · 29 |
| Vela | Marea | 31 · 41 · 47 · 53 |

---

<!-- g.infl.t -->
## Influenze esterne

<!-- g.infl.1 -->
Due grandezze prese dall'orologio di sistema modificano i valori efficaci senza toccare la posizione dei cursori. L'ora del giorno muove calore, spazio e colore d'insieme delle gocce; la stagione muove registro, apertura, chiusura e passo dei tessuti. La differenza fra la posizione del cursore e il valore efficace si legge confrontando il filetto in colonna con la corona attorno al quadrante.

---

<!-- g.tav.t -->
## Lettura della tavola

<!-- g.tav.1 -->
Ogni classe ha un quadrante con quattro anelli concentrici, uno per linea, numerati in cifre romane. Un punto percorre ogni anello e indica la fase udibile, non quella dello scheduler.

<!-- g.tav.2 -->
Una goccia è una tacca radiale che attraversa l'anello: la sua lunghezza è il registro della nota. Una tenuta è un arco lungo quanto la nota resta in aria; è tenue quando è passata, a inchiostro pieno mentre suona.

<!-- g.tav.3 -->
L'ambra segna quattro cose e non di più: quello che sta suonando adesso, ogni valore numerico, il punto in cui il baricentro ha invertito, e l'inizio di una sezione. Quando una goccia suona un filo la unisce al centro del quadrante; se due gocce di linee diverse cadono a meno di 0,18 s l'una dall'altra, un secondo filo unisce anche loro.

<!-- g.tav.4 -->
La corona attorno al quadrante mostra i valori efficaci dei tre comandi dell'Insieme; i filetti nella colonna mostrano dove sta la mano. Fra i due c'è la deriva, l'ora e la stagione.

---

<!-- g.spec.t -->
## Specifiche

<!-- g.spec.1 -->
L'applicazione non fa richieste di rete: si apre da file locale e funziona senza connessione. I file audio dell'utente sono decodificati nel browser e non lasciano la macchina.

<!-- tabella
  intestazione: g.col.par | g.col.valore
  riga: a mano: nome | g.spec.motore
  riga: a mano: nome | g.spec.uscita
  riga: a mano: nome | g.spec.buffer
  riga: g.spec.krete | g.spec.rete
  riga: g.spec.kmem | g.spec.memoria
  riga: testata.lingua | g.spec.lingua
-->
| Parametro | Valore |
|---|---|
| Web Audio | Web Audio API, nessuna libreria |
| wav | wav 24 bit stereo, 48 kHz |
| buffer | 1024 campioni (latencyHint playback) |
| Rete | nessuna richiesta di rete |
| Memoria | i materiali del paesaggio non si conservano fra due aperture |
| Lingua | la lingua scelta viene ricordata; il tema no, e si chiede al sistema |

---

<!-- g.torna -->
[Torna allo strumento](index.html)
