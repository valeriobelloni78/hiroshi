# I colori di Hiroshi

Questo file è la FONTE delle undici palette. Si scrive qui, poi si lancia

```bash
node colori.mjs
```

e i valori finiscono in `css/style.css`, che è quello che l'app legge. L'app non
legge questo file: su `file://` il CORS blocca ogni richiesta, e il doppio clic su
`index.html` deve funzionare anche senza rete. Il verso opposto — rifare questo
file dal CSS, dopo averlo ritoccato a mano — è `node colori.mjs --leggi`.

**L'etichetta «default»** accanto al nome di un tema dice quale si apre all'avvio.
Se non ce l'ha nessuno, all'apertura si chiede al sistema operativo se vuole
chiaro o scuro, come è sempre stato. L'etichetta sta su un tema solo.

I valori sono esadecimali, oppure il rimando a un'altra tinta dello stesso tema
— `var(--vetro)` vuol dire «lo stesso del vetro», e ritoccando il vetro si
ritoccano tutti insieme. Un pannello che qui non compare prende quello che il
tema gli dà altrove: nei temi che non colorano i piani, il vetro.

Le ragioni dei numeri — i rapporti di contrasto, le misure fatte sullo schermo —
stanno nei commenti del CSS accanto a ogni blocco, e non si perdono: questo
strumento cambia i valori, non riscrive i blocchi.

---

## chiaro

| pannello | token | colore |
|---|---|---|
| gocce | --piano-gocce | var(--vetro) |
| tessuti | --piano-tessuti | var(--vetro) |
| effetti | --piano-effetti | var(--vetro) |
| banco | --piano-banco | var(--vetro) |
| deriva | --piano-deriva | var(--vetro) |
| influenze | --piano-influenze | var(--piano-deriva) |

| tono | token | colore |
|---|---|---|
| carta | --carta | #e7e7e4 |
| inchiostro | --inchiostro | #20211c |
| inchiostro tenue | --inchiostro-2 | #55564c |
| etichette | --grigio | #8f9084 |
| muto | --muto | #b8b7aa |
| filo | --filo | #c3c2b4 |
| filo tenue | --filo-2 | #d8d7cc |
| vetro | --vetro | #f0efe9 |
| spento | --spento | #d2d1c5 |
| ambra · accento | --ambra | #c25a2b |
| cifre sull'ambra | --su-ambra | var(--carta) |

## scuro

| tono | token | colore |
|---|---|---|
| carta | --carta | #20211c |
| inchiostro | --inchiostro | #e7e7e4 |
| cifre sull'ambra | --su-ambra | var(--inchiostro) |
| inchiostro tenue | --inchiostro-2 | #9e9e9b |
| etichette | --grigio | var(--inchiostro-2) |
| muto | --muto | #7f7f7b |
| filo | --filo | #3b3b38 |
| filo tenue | --filo-2 | #33332f |
| vetro | --vetro | #2d2e28 |
| spento | --spento | #373733 |
| grana della carta | --retino | #393936 |

## alba

| pannello | token | colore |
|---|---|---|
| gocce | --piano-gocce | #a8c8dd |
| tessuti | --piano-tessuti | #f1b5ad |
| effetti | --piano-effetti | #e4c5c7 |
| banco | --piano-banco | #c2c8bd |
| deriva | --piano-deriva | var(--piano-tessuti) |
| influenze | --piano-influenze | var(--piano-gocce) |

| tono | token | colore |
|---|---|---|
| carta | --carta | #e7ede4 |
| vetro | --vetro | #f1f5ef |
| inchiostro | --inchiostro | #132a37 |
| inchiostro tenue | --inchiostro-2 | #244658 |
| etichette | --grigio | #4e585b |
| muto | --muto | #6d7474 |
| filo | --filo | #808685 |
| spento | --spento | #939996 |
| filo tenue | --filo-2 | #9fa5a1 |
| cifre sull'ambra | --su-ambra | var(--carta) |
| grana della carta | --retino | #c4cac3 |

## meriggio

| pannello | token | colore |
|---|---|---|
| gocce | --piano-gocce | #d3bdab |
| tessuti | --piano-tessuti | #e9c791 |
| effetti | --piano-effetti | #b8d0b7 |
| banco | --piano-banco | #afc5c8 |
| deriva | --piano-deriva | var(--piano-tessuti) |
| influenze | --piano-influenze | var(--piano-gocce) |

| tono | token | colore |
|---|---|---|
| carta | --carta | #efe9c8 |
| vetro | --vetro | #f6f1da |
| inchiostro | --inchiostro | #31261c |
| inchiostro tenue | --inchiostro-2 | #4b3c2f |
| etichette | --grigio | #5a5445 |
| muto | --muto | #77715f |
| filo | --filo | #89836f |
| spento | --spento | #9b957f |
| filo tenue | --filo-2 | #a7a28a |
| cifre sull'ambra | --su-ambra | var(--carta) |
| grana della carta | --retino | #ccc7aa |

## crepuscolo

| pannello | token | colore |
|---|---|---|
| gocce | --piano-gocce | #14494c |
| tessuti | --piano-tessuti | #633225 |
| effetti | --piano-effetti | #34472d |
| banco | --piano-banco | #263a3c |
| deriva | --piano-deriva | #632330 |

| tono | token | colore |
|---|---|---|
| carta | --carta | #23191a |
| vetro | --vetro | #342b28 |
| inchiostro | --inchiostro | #fbe8d1 |
| inchiostro tenue | --inchiostro-2 | #d3c2af |
| etichette | --grigio | #b8a999 |
| muto | --muto | #9f9283 |
| filo | --filo | #8b7f73 |
| spento | --spento | #7e7367 |
| filo tenue | --filo-2 | #766c61 |
| cifre sull'ambra | --su-ambra | var(--inchiostro) |
| grana della carta | --retino | #3f3732 |

## primavera

| pannello | token | colore |
|---|---|---|
| gocce | --piano-gocce | #e8bbc0 |
| tessuti | --piano-tessuti | #eadda2 |
| effetti | --piano-effetti | #e2bbaf |
| banco | --piano-banco | #c3c5b3 |
| deriva | --piano-deriva | var(--piano-tessuti) |
| influenze | --piano-influenze | var(--piano-gocce) |

| tono | token | colore |
|---|---|---|
| carta | --carta | #fde9eb |
| vetro | --vetro | #fef4f5 |
| inchiostro | --inchiostro | #27291b |
| inchiostro tenue | --inchiostro-2 | #41442e |
| etichette | --grigio | #5a5550 |
| muto | --muto | #7a716f |
| filo | --filo | #8d8281 |
| spento | --spento | #a19594 |
| filo tenue | --filo-2 | #aea1a1 |
| cifre sull'ambra | --su-ambra | var(--carta) |
| grana della carta | --retino | #d7c6c8 |

## mietitura

| pannello | token | colore |
|---|---|---|
| gocce | --piano-gocce | #a4ccc6 |
| tessuti | --piano-tessuti | #f0d7a9 |
| effetti | --piano-effetti | #f4b5a0 |
| banco | --piano-banco | #c2c6ad |
| deriva | --piano-deriva | var(--piano-tessuti) |
| influenze | --piano-influenze | var(--piano-gocce) |

| tono | token | colore |
|---|---|---|
| carta | --carta | #f9ecd7 |
| vetro | --vetro | #fcf5ec |
| inchiostro | --inchiostro | #132c2c |
| inchiostro tenue | --inchiostro-2 | #224848 |
| etichette | --grigio | #535751 |
| muto | --muto | #75746a |
| filo | --filo | #89857a |
| spento | --spento | #9d988a |
| filo tenue | --filo-2 | #aaa495 |
| cifre sull'ambra | --su-ambra | var(--carta) |
| grana della carta | --retino | #d4c9b8 |

## estate

| pannello | token | colore |
|---|---|---|
| gocce | --piano-gocce | #b4c8c6 |
| tessuti | --piano-tessuti | #ffc68d |
| effetti | --piano-effetti | #ffaf94 |
| banco | --piano-banco | #ccc3aa |
| deriva | --piano-deriva | var(--piano-tessuti) |
| influenze | --piano-influenze | var(--piano-gocce) |

| tono | token | colore |
|---|---|---|
| carta | --carta | #f0ebdc |
| vetro | --vetro | #f6f3eb |
| inchiostro | --inchiostro | #1d2a2a |
| inchiostro tenue | --inchiostro-2 | #324646 |
| etichette | --grigio | #535551 |
| muto | --muto | #72736c |
| filo | --filo | #85847c |
| spento | --spento | #99978d |
| filo tenue | --filo-2 | #a6a399 |
| cifre sull'ambra | --su-ambra | var(--carta) |
| grana della carta | --retino | #ccc8bc |

## autunno

| pannello | token | colore |
|---|---|---|
| gocce | --piano-gocce | #4a385b |
| tessuti | --piano-tessuti | #5b3805 |
| effetti | --piano-effetti | #653125 |
| banco | --piano-banco | #3d383a |
| deriva | --piano-deriva | var(--piano-tessuti) |
| influenze | --piano-influenze | var(--piano-gocce) |

| tono | token | colore |
|---|---|---|
| carta | --carta | #201a1c |
| vetro | --vetro | #322b2a |
| inchiostro | --inchiostro | #fee7d2 |
| inchiostro tenue | --inchiostro-2 | #d2bead |
| etichette | --grigio | #b7a597 |
| muto | --muto | #9d8e82 |
| filo | --filo | #8a7d71 |
| spento | --spento | #7c7066 |
| filo tenue | --filo-2 | #756960 |
| cifre sull'ambra | --su-ambra | var(--inchiostro) |
| grana della carta | --retino | #3e3734 |

## novembre - default

| pannello | token | colore |
|---|---|---|
| gocce | --piano-gocce | #2f464c |
| tessuti | --piano-tessuti | #513e33 |
| effetti | --piano-effetti | #722712 |
| banco | --piano-banco | #373830 |
| deriva | --piano-deriva | var(--piano-tessuti) |
| influenze | --piano-influenze | var(--piano-gocce) |

| tono | token | colore |
|---|---|---|
| carta | --carta | #1b1c17 |
| vetro | --vetro | #2f2d28 |
| inchiostro | --inchiostro | #fae7df |
| inchiostro tenue | --inchiostro-2 | #d3c3bc |
| etichette | --grigio | #b7a9a3 |
| muto | --muto | #9d928c |
| filo | --filo | #8a807a |
| spento | --spento | #7c736e |
| filo tenue | --filo-2 | #756c68 |
| cifre sull'ambra | --su-ambra | var(--inchiostro) |
| grana della carta | --retino | #3b3834 |

## inverno 

| pannello | token | colore |
|---|---|---|
| gocce | --piano-gocce | #2d4554 |
| tessuti | --piano-tessuti | #732a28 |
| effetti | --piano-effetti | #2d4832 |
| banco | --piano-banco | #30383a |
| deriva | --piano-deriva | var(--piano-tessuti) |
| influenze | --piano-influenze | var(--piano-gocce) |

| tono | token | colore |
|---|---|---|
| carta | --carta | #111b1d |
| vetro | --vetro | #252c2c |
| inchiostro | --inchiostro | #e4f1e5 |
| inchiostro tenue | --inchiostro-2 | #bdc8bf |
| etichette | --grigio | #a4afa6 |
| muto | --muto | #8d968e |
| filo | --filo | #7b837d |
| spento | --spento | #6f7771 |
| filo tenue | --filo-2 | #686f6a |
| cifre sull'ambra | --su-ambra | var(--inchiostro) |
| grana della carta | --retino | #323837 |
