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
periodi 8 · 9 · 19 · 25 — passano per il **banco d'uscita**: mixer a quattro
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

Voci, cielo, grani e registratore sono i prossimi. La tavola disegnata — i due
quadranti, le corone, la fascia dei grani, la deriva — è ferma nel progetto e
arriva quando il motore è completo; per ora `index.html` è un'impalcatura che
serve solo ad ascoltare.

## Come funziona

Nessuna dipendenza da installare, nessun passaggio di compilazione: si apre
`index.html` e funziona, anche senza rete.

```
index.html        lo strumento
css/style.css     palette, tipografia, impaginazione
js/deriva.js      il tempo lungo: sei canali e il campo armonico. Non dipende da nulla
js/linee.js       lo stato: linee, idee, piani, ricambio
js/timbri.js      gli otto suoni delle gocce
js/tessuti.js     gli otto tenuti, e la finestra che li apre e li chiude
js/banco.js       l'uscita: mixer, riverbero, equalizzatore, limitatore
js/motore.js      lo scheduler e l'assemblaggio
js/tavola.js      i comandi (provvisori)
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
node prova.mjs
```

Rende il motore fuori tempo reale e misura che cosa esce: che suoni, che non
clippi, che ogni timbro e ogni tenuto escano dal silenzio senza esplodere, che
l'equalizzatore muova lo spettro, che un passa-tutto sia unitario, che i due
lati del riverbero stiano pari, che la coda scenda invece di crescere e che la
compensazione dei tessuti sia liscia dove quella per conteggio scatterebbe. Va
rifatta più volte: i difetti che sono costati di più non erano rotture ma
oscillazioni. Serve `playwright`.

## Licenza

MIT — vedi [LICENSE](LICENSE). Nessuna libreria, nessun campione, nessun file
esterno: anche il riverbero è una rete costruita al momento.

Un progetto di **Valerio Belloni** — [valeriobelloni.art](https://www.valeriobelloni.art)
