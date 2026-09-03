# Hiroshi

**Uno studio per fare musica d'ambiente, interamente nel browser.**

Hiroshi riunisce ed estende tre strumenti: il collage per sfasamento di
[Rada](https://github.com/valeriobelloni78/rada), il tempo lungo di
[Rada Deriva](https://github.com/valeriobelloni78/rada2) e il campo continuo
di [Nuvole](https://github.com/valeriobelloni78/nuvole). Non riproduce un
brano registrato: costruisce il suono in tempo reale, e lo registra.

---

## Dove siamo

Suonano le due classi che fanno il collage. Le **frasi** — quattro linee di
gocce, periodi 7 · 11 · 13 · 17 — e i **tessuti** — quattro linee tenute,
periodi 9 · 16 · 25 · 31 — passano per il **banco d'uscita**: mixer a quattro
canali, mandata a un riverbero condiviso, equalizzatore a otto bande,
limitatore, misuratori. Gli otto periodi sono coprimi a due a due anche fra
le due classi, quindi la combinazione completa non si ripete per ore.

Le gocce hanno otto timbri — *Vetro, Legno, Onda, Soffio, Corda, Metallo,
Canna, Sabbia* — e sono otto materie: a distinguerle è quasi tutto l'attacco e
la lunghezza della coda.

I tessuti ne hanno altri otto — *Bordone, Marea, Attrito, Frangia, Corrente,
Cavo, Brina, Soglia* — e non sono materie: sono modi di essere instabili. Un
tenuto perfettamente fermo, dopo pochi secondi, smette di essere un suono e
diventa una proprietà della stanza, come il frigorifero; quindi a distinguere
un tenuto dall'altro è **che cosa si muove mentre non accade niente** —
un battimento, una deriva d'intonazione, una grana d'attrito, delle formanti
che camminano — e in quale dei quattro registri sta: il fondo, il corpo,
l'aria, il velo.

**Sedici mood** — otto per classe — cambiano insieme il timbro, i parametri e
i quattro periodi, perché in Rada la configurazione temporale è parte del
carattere quanto lo è il suono. Ogni timbro compare in un mood solo, così
girando gli otto pulsanti si attraversano davvero tutti e otto i suoni.

**Due influenze esterne, simmetriche.** L'ora del giorno inclina le gocce —
calore del timbro, spazio, e il colore d'insieme, che a mezzanotte taglia a
1200 Hz e alle tre del pomeriggio a 3441. La stagione inclina i tessuti —
registro, e il respiro con cui si aprono e si chiudono. Nessuna delle due si
sovrappone alla deriva: ogni parametro pende da una cosa sola. Chi apre l'app
alle sei del mattino non sente la stessa cosa di chi la apre a mezzanotte, e
non c'è nessun comando che glielo dica.

Ogni linea ha i suoi tre comandi — durata del giro, silenzia, nuova idea — e
ciascuna classe ha il **modo del materiale**: in *deriva* le idee si rinnovano
da sé, una alla volta e tutte insieme al passo di quinta; in *ancora* restano
quelle che il mood ha scelto, mentre tutto il resto continua a muoversi.

**I grani** macinano registrazioni proprie: un file scelto a mano, o il
microfono. Non c'è nessun suono in dotazione — questa sorgente tace finché non
le si dà qualcosa, ed è il punto: la materia è il field recording di chi
ascolta. Una testa di lettura scorre il materiale (o si ferma dentro, che è
metà di quello che il granulare serve a fare) e attorno le si sparpaglia una
nube di grani, ciascuno con la sua finestra, la sua altezza e il suo posto nel
campo stereo. In modo **intonato** gli intervalli fra i grani sono quelli della
stessa pentatonica di tutto il resto: la nube si accorda col pezzo anche
partendo da un rumore di fondo.

Il microfono entra da una porta sola — *registra* — e da lì in poi è materia
come un file. Non si granula un flusso dal vivo: l'esportazione non potrebbe
percorrerlo più in fretta del tempo reale, la testa non potrebbe fermarsi, e
microfono più altoparlanti sono un anello.

**Portarsi via la sessione** si fa in due modi, e non danno lo stesso file. La
*presa dal vivo* cattura l'uscita mentre suona, con dentro le mani: un cursore
mosso, un mood cambiato, una linea silenziata restano nel file perché sono
successi. L'*esportazione* rende N minuti fuori tempo reale — molto più in
fretta dell'ascolto — e non ha nessuna mano dentro: è il pezzo che
l'apparecchio farebbe da solo, coi comandi dove stanno adesso. La prima è la
registrazione di una seduta, la seconda è una tiratura. Tutte e due escono in
wav a 24 bit stereo, e l'esportazione si può fare mentre si ascolta senza che
la sessione se ne accorga.

**La tavola** è il disegno di tutto questo, e non ha un comando dentro: un
canvas solo, steso sotto tutto il foglio e senza eventi, mentre i comandi sono
elementi nativi che ci galleggiano sopra. Anche quello che sembra una manopola
da girare è un cursore trasparente disteso sopra il disegno dell'arco — il
canvas la disegna, il browser la comanda — così tutto resta raggiungibile col
dito, col tasto Tab e con un lettore di schermo.

Due letture del segno, una volta ciascuna: **il colore è l'altezza** — cinque
fermate dal blu al rosso mattone — e **la lunghezza è la durata**. Tutto il
resto è inchiostro, perché il colore è già impegnato.

Cinque sezioni numerate. Le **due classi** stanno su due quadranti gemelli, un
anello per linea: la fase corre come un quadratino, una goccia è una tacca
radiale lunga quanto la sua coda, una tenuta è un arco lungo quanto sta in aria
e opaco quanto il suo inviluppo — quello vero, preso dalla stessa funzione che
scrive l'automazione dell'audio. Attorno corre la corona, tre tracce graduate
che mostrano quello che sta suonando mentre i filetti in colonna mostrano dove
sta la mano: fra i due c'è la deriva. Le due classi sono simmetriche comando per
comando, e la traccia più esterna è lo spazio da tutt'e due le parti. Il **banco** ha la
registrazione, l'equalizzatore a otto bande con la sua curva vera e il mixer. Dei **grani** si vede la materia intera, distesa per il
lungo come un istogramma di quadratini grigi, e sopra la nube dei grani —
colorati, nel punto esatto da cui ciascuno è stato ritagliato. La **deriva** mostra la tonalità di adesso e quella che
viene, e quindici minuti di baricentro come istogramma a punti, con le colonne
in cui la curva ha girato scritte a inchiostro pieno. Non tiene memoria di
niente: la deriva è una funzione del tempo, quindi la corsia si ricostruisce a
ogni fotogramma e una sessione ripresa dopo una pausa non ha buchi.

Le voci alla *In C* di Nuvole aspettano una decisione musicale: il loro
archivio attraversa tutti e dodici i gradi, mentre gocce e tessuti stanno su
una pentatonica dove nulla può stonare.

## Come funziona

Nessuna dipendenza da installare, nessun passaggio di compilazione: si apre
`index.html` e funziona, anche senza rete.

```
index.html        lo strumento
css/style.css     palette, tipografia, impaginazione
js/deriva.js      il tempo lungo: sei canali e il campo armonico. Non dipende da nulla
js/cattura.js     prendere il suono dal grafo, e scriverlo in un wav a 24 bit
js/linee.js       lo stato: linee, idee, piani, ricambio
js/timbri.js      gli otto suoni delle gocce
js/tessuti.js     gli otto tenuti, e la finestra che li apre e li chiude
js/grani.js       la materia registrata, la cattura dal microfono, la nube
js/mood.js        i sedici stati dello strumento: parametri, periodi, timbro
js/banco.js       l'uscita: mixer, riverbero, colore, equalizzatore, limitatore
js/motore.js      lo scheduler e l'assemblaggio
js/registratore.js la presa dal vivo e l'esportazione fuori tempo reale
js/comandi.js     le mani: tendine, cursori, pulsanti, le letture in cifre
js/tavola.js      il disegno: due quadranti, i grani, la deriva, i misuratori
prova.mjs         la verifica: rende il motore fuori tempo reale e lo misura
```

**Il suono usa la Web Audio API direttamente.** Il cuore è uno scheduler a
lookahead: ogni 25 ms prenota le note sul clock del motore audio, preciso al
singolo campione. La finestra è adattiva — 150 ms quando la pagina si vede,
fino a dodici secondi a schermo bloccato, dove il browser rallenta i timer ma
non il thread audio.

**Il motore non sa da dove viene il tempo.** `passo(now)` è una funzione del
tempo che le viene passato: dal vivo la chiama un timer, per scrivere il wav
la chiama un ciclo dentro un `OfflineAudioContext`, molto più in fretta del
tempo reale. Non ci sono due motori, e l'esportazione non può divergere da
quello che si ascolta.

**Il riverbero è una mandata, non un inserto.** «Spazio» è un comando di
ciascuna classe, e due sorgenti devono poter stare l'una nell'ambiente e
l'altra asciutta — ma la stanza resta una sola.

**La somma dei tessuti si compensa sugli inviluppi.** Otto voci tenute che
suonano insieme si sommano in potenza, quindi il bus si divide per √N. Ma
sotto la radice sta la somma degli inviluppi, non un conteggio di voci:
contando le voci, il bus scenderebbe di tre decibel nell'istante in cui una
nuova voce comincia ad aprirsi — cioè mentre è ancora inudibile. Si sentirebbe
la trama abbassarsi per far posto a qualcosa che non c'è ancora.

## Verifica

```bash
npm i -D playwright && npx playwright install chromium
```

```bash
node prova.mjs
```

Rende il motore fuori tempo reale e misura che cosa esce: che suoni, che non
clippi, che ogni timbro e ogni tenuto escano dal silenzio senza esplodere, che
l'equalizzatore muova lo spettro, che un passa-tutto sia unitario, che i due
lati del riverbero stiano pari, che la coda scenda invece di crescere e che la
compensazione dei tessuti sia liscia dove quella per conteggio scatterebbe. Va
rifatta più volte: i difetti che sono costati di più non erano rotture ma
oscillazioni. Apre la pagina con `file://`, perché è il doppio clic la promessa
da verificare.

## Licenza

MIT — vedi [LICENSE](LICENSE). Nessuna libreria, nessun campione, nessun file
esterno: anche il riverbero è una rete costruita al momento.

Un progetto di **Valerio Belloni** — [valeriobelloni.art](https://www.valeriobelloni.art)
