# Hiroshi

**Uno studio per fare musica d'ambiente, interamente nel browser.**

Hiroshi riunisce ed estende tre strumenti: il collage per sfasamento di
[Rada](https://github.com/valeriobelloni78/rada), il tempo lungo di
[Rada Deriva](https://github.com/valeriobelloni78/rada2) e il campo continuo
di [Nuvole](https://github.com/valeriobelloni78/nuvole). Non riproduce un
brano registrato: costruisce il suono in tempo reale, e lo registra.

---

## Dove siamo

Il motore è alla sua prima spina. Suona la classe delle **frasi** — quattro
linee di gocce con periodi coprimi 7 · 11 · 13 · 17 — attraverso il **banco
d'uscita**: mixer a quattro canali, mandata a un riverbero condiviso,
equalizzatore a otto bande, limitatore, misuratori.

Le gocce hanno otto timbri: *Vetro, Legno, Onda, Soffio, Corda, Metallo,
Canna, Sabbia*. Sono otto materie, non otto forme d'onda: a distinguerle è
quasi tutto l'attacco e la lunghezza della coda.

Tessuti, voci, cielo, grani e registratore sono i prossimi. La tavola
disegnata — i due quadranti, le corone, la fascia dei grani, la deriva — è
ferma nel progetto e arriva quando il motore è completo; per ora
`index.html` è un'impalcatura che serve solo ad ascoltare.

## Come funziona

Nessuna dipendenza da installare, nessun passaggio di compilazione: si apre
`index.html` e funziona, anche senza rete.

```
index.html        lo strumento
css/style.css     palette, tipografia, impaginazione
js/deriva.js      il tempo lungo: sei canali e il campo armonico. Non dipende da nulla
js/linee.js       lo stato: linee, idee, piani, ricambio
js/timbri.js      gli otto suoni delle gocce
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

## Verifica

```bash
node prova.mjs
```

Rende venti secondi fuori tempo reale e misura che cosa esce: che suoni, che
non clippi, che ogni timbro esca dal silenzio senza esplodere, che
l'equalizzatore muova lo spettro e che la coda del riverbero scenda invece di
crescere. Serve `playwright`.

## Licenza

MIT — vedi [LICENSE](LICENSE). Nessuna libreria, nessun campione, nessun file
esterno: anche il riverbero è una rete costruita al momento.

Un progetto di **Valerio Belloni** — [valeriobelloni.art](https://www.valeriobelloni.art)
