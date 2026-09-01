# Hiroshi — contesto di progetto

Uno studio per fare musica d'ambiente nel browser. Riunisce ed estende Rada,
Rada Deriva e Nuvole: otto linee sfasate, un campo continuo che chiama le
voci, il granulare su registrazioni proprie, e un banco d'uscita che registra
ed esporta.

**Rispondi sempre in italiano.** Commenti nel codice, messaggi di commit e
testi dell'interfaccia sono in italiano.

---

## Regole da non violare

**Dentro una serie i quattro periodi devono essere coprimi a due a due.** Non
devono essere primi — 8, 9 e 25 sono composti e vanno benissimo: **il vincolo
è il massimo comun divisore, non la primalità**, e va verificato prima di
toccare una serie, non dopo.

**Fra le due classi la coprimalità è un obiettivo, non una legge.** Le due
tabelle di mood si scelgono indipendentemente e fanno 64 combinazioni: in
alcune un periodo delle gocce condivide un divisore con uno dei tessuti —
«carillon» ha 4, 9, 25 e «seta» ha 8, 9, 25. Quello che va difeso non è il
gcd ma **il tempo di riallineamento**, cioè quando tutte e otto le linee
tornano nella stessa combinazione; la coprimalità è una condizione
*sufficiente* per tenerlo alto, non necessaria. Misurato su tutte e 64: il
peggiore è **247 ore**, dieci giorni. `prova.mjs` rifà quel conto a ogni corsa
e fallisce sotto le 24 ore.

**La somma dei tessuti si normalizza sugli INVILUPPI, mai su un conteggio di
voci.** Sorgenti incoerenti si sommano in potenza, quindi il bus si divide per
√N — ma sotto la radice va la somma degli inviluppi. Contando le teste, il bus
scenderebbe di 3 dB nell'istante in cui una voce comincia ad aprirsi, cioè
mentre è ancora inudibile: un buco che precede il suono. È possibile solo
perché gli inviluppi sono noti in forma chiusa — `finestra()` in `tessuti.js` è
la stessa funzione che scrive l'automazione dell'audio, e la compensazione la
legge invece di misurare il bus. Misurare vorrebbe dire inseguire, e inseguire
vuol dire arrivare dopo.

**Nessuna libreria, né per il suono né per il disegno.** Web Audio API diretta,
API 2D del browser. Nessun bundler, nessun npm, nessun passo di compilazione:
si apre `index.html` e funziona, anche senza rete.

**Niente file caricati con `fetch`.** Su `file://` il CORS li blocca e l'app
resterebbe senza testi al doppio clic. I dizionari sono oggetti JavaScript.
Vale anche per gli AudioWorklet: `addModule` di un file locale fallisce. Se
serviranno, il modulo va costruito come stringa e caricato da un blob —
`URL.createObjectURL(new Blob([codice], {type:"text/javascript"}))` — che
funziona anche da `file://`.

**La palette è definita una volta sola**, nelle variabili CSS di
`css/style.css`. Quando arriverà il disegno, anche il canvas le leggerà da lì.
Non introdurre colori scritti direttamente nel JavaScript.

**Due letture del segno, una volta ciascuna.** Sulla tavola *il colore è
l'altezza* e *la lunghezza è la durata*. Non aggiungere una terza codifica
della stessa grandezza e non spostare una di queste due senza spostare anche
la chiave che le dichiara.

**Le dipendenze scorrono in una direzione sola:**
`deriva ← linee ← timbri ← tessuti ← mood ← banco ← motore ← tavola`. Il
modello non conosce l'audio; l'audio non conosce il disegno.

**`mood.js` è l'unico file che attraversa**, e ha un file suo proprio per
dichiararlo. Un mood scrive insieme i parametri del modello, i periodi delle
linee e il nome del timbro, perché in Rada la configurazione temporale è parte
del carattere quanto lo è il suono: un «vespro» coi periodi della «pioggia» non
sarebbe un vespro più lento, sarebbe un'altra cosa. L'eccezione è una sola e
sta in un posto.

**Un mood scrive su `G` E su `GT`.** È l'unico punto del progetto in cui si
tocca `G` direttamente: un mood è uno scatto, non un gesto. Lasciarlo lisciare
da `battito()` vorrebbe dire sentire lo strumento scivolare verso il nuovo
carattere per due o tre secondi, cioè un fondo che si dissolve — il contrario
di un cambio di scena.

**Ogni timbro compare una volta sola per tabella di mood.** Non è simmetria
decorativa: è la garanzia che girando gli otto pulsanti si attraversino
davvero tutti e otto i suoni invece di ritrovarsi tre volte nello stesso
posto. La prova lo verifica.

**L'ora del giorno inclina le gocce, la stagione inclina i tessuti**, e nessuna
delle due si sovrappone alla deriva: ogni parametro pende da una cosa sola,
altrimenti non si sa più chi lo sta muovendo. Oggi la deriva muove registro,
densità e addensamento delle gocce e il livello dei tessuti; l'ora muove
calore, spazio e il colore d'insieme; la stagione muove registro, apertura,
chiusura e passo dei tessuti. Chi aggiunge un'influenza dica da quale casella
la prende.

**Il motore non sa da dove viene il tempo.** `passo(now)` è una funzione del
tempo che le viene passato. Dal vivo la chiama un `setInterval`; per scrivere
il wav la chiama un ciclo dentro un `OfflineAudioContext`, molto più in fretta
del tempo reale. Non ci sono due motori. Chi aggiunge una sorgente non deve
fare niente perché l'esportazione la includa — ma **deve** collocare gli
eventi su tempi assoluti, perché è quello a renderlo possibile.

---

## Insidie già incontrate (non ripeterle)

**Il picco del passa-basso di Web Audio arriva a 1,22 anche a Q basso**, dove
un Butterworth non dovrebbe passare l'unità. Moltiplicato per un guadagno
d'anello di 0,94 porta il giro del riverbero sopra 1: misurato, **+600 dB in
venti secondi**. Per questo `piccoDi()` misura il picco vero del filtro e ci
divide, con un ripiego prudente a **1,3** e mai a 1 — dividere per 1 non
ridurrebbe nulla — e rifiutando una misura sotto l'unità, perché dividere per
meno di 1 alzerebbe il giro.

**Un anello di retroazione in Web Audio si porta dietro un blocco implicito di
128 campioni, e dove cade quel blocco non è deciso da chi scrive il grafo.** È
la ragione per cui il passa-tutto di Schroeder **non** è scritto nella sua
forma canonica a retroazione ma svolto in una serie di prese (vedi
`passatutto()` in `banco.js`). Nella forma ad anello la presa diretta e quella
ritardata finiscono, a volte sì e a volte no, su istanti diversi: i due termini
smettono di cancellarsi e la rete smette di essere passa-tutto. Misurato: uno
stadio solo dava guadagno RMS **1,0000 oppure 1,2894** con lo stesso identico
ingresso, e 1,291 è esattamente √((1+g²)/(1−g²)) con g = 0,5 — la firma
numerica dei due termini che non si cancellano. A valle si vedeva come uno
squilibrio fra i lati del riverbero che ballava fra −5 e +2 dB da una
costruzione all'altra. La forma svolta —
`H(z) = −g + (1−g²)·Σ g^(k−1)·z^−kM`, troncata a −60 dB — non ha anello, quindi
non ha niente da collocare, e misura sempre lo stesso numero.

Corollario, se un giorno tornasse la forma canonica: **la presa diretta va
presa da `v`**, cioè dall'ingresso del ritardo, non da `x`. Prendendola da `x`
il coefficiente del termine ritardato diventa (1+g²) e la rete colora il timbro
e sbilancia i livelli. Ma la strada giusta è non riaprire l'anello.

**I pettini del riverbero sono condivisi fra i due canali, non sdoppiati.**
Sdoppiandoli si misura uno squilibrio di 6 dB fra i lati, perché un anello più
corto torna più spesso e restituisce più energia. La larghezza stereo nasce
solo dai passa-tutto.

**Ogni nodo creato per una nota va scollegato a mano.** Il rilascio automatico
dipende dalla raccolta della memoria, che è attività del thread principale —
proprio quello che a schermo bloccato viene strozzato. Il thread audio intanto
accumula: il grafo cresce più in fretta di quanto venga ripulito e i buffer
prima frusciano, poi saltano.

**`LOOKAHEAD` e `bookedUntil` hanno una sola autorità** e stanno in `linee.js`
benché sia il motore a scriverli. Chi ricostruisce un piano e chi prenota le
note devono guardare esattamente altrettanto avanti: se lo scheduler
prenotasse a tre secondi e la ricostruzione ne considerasse pianificati solo
0,15, una mossa dell'addensamento riposizionerebbe gocce già prenotate e le
sentiresti due volte.

**Il periodo refrattario di mezzo giro non è prudenza, è una toppa.** Difende
da due strade di doppio scatto già viste: una fase ricalcolata che riporta
oltre l'orizzonte una goccia già emessa, e una goccia di fine giro che si
avvolge sulla testa del giro successivo.

**Il confronto per riposizionare l'indice avviene su tempi assoluti, mai su
fasi.** `cycleStart` può essere nel futuro, e avvolgere la fase fa saltare
gocce o interi giri.

**I valori efficaci si calcolano dentro `passo()`, non nel ciclo del disegno.**
Il disegno gira solo quando c'è uno schermo davanti; il rendering fuori tempo
reale non ne ha nessuno. Finché quel conto stava in `battito()`, un'esportazione
usciva coi parametri congelati sull'ultimo fotogramma disegnato: la deriva
avanzava e nessuno la ascoltava. Vale per qualunque cosa il motore debba
sapere — se serve al suono, sta nel motore.

**`avvia()` deve azzerare anche la memoria degli eventi**, cioè `flash` e
`fino`. Sono tempi assoluti, e quando il tempo riparte da zero — a ogni
rendering fuori tempo reale — restano nel futuro: il periodo refrattario legge
`t − flash` negativo e SALTA la nota, in silenzio, consumandone l'indice.
Misurato: senza quell'azzeramento un'esportazione fatta dopo un ascolto
restava senza tessuti per i primi ventun secondi, il tempo che serviva al
tempo virtuale per superare le memorie del render precedente. Le gocce lo
mascheravano perché si rinnovano in fretta. È un sintomo del punto aperto in
fondo a questo file: finché il render percorre il modello che sta suonando,
tutto ciò che è un tempo assoluto va azzerato all'avvio.

**Il contesto nasce con `latencyHint: "playback"`.** Di suo un AudioContext è
tarato per strumenti suonati dal vivo — buffer da 256 campioni — e su un
telefono modesto non ce la fa: ogni buffer mancato è un raschio. Qui non si
risponde a nessun gesto in tempo reale, quindi il ritardo d'uscita non si
percepisce. **Non rimetterlo com'era per «ridurre la latenza».**

**Una Karplus-Strong vera non si può fare con i nodi.** Un anello su un
`DelayNode` non scende sotto un blocco di rendering — 128 campioni, 2,7 ms a
48 kHz — e quel minimo fissa l'altezza massima attorno ai 375 Hz. Per questo
«Corda» è un dente di sega con il passa-basso che scende, cioè l'impressione
della corda e non il modello.

**Il modello si popola da sé.** In fondo a `linee.js` c'è
`frasi.forEach(rigenera)`. Senza quella riga le frasi nascono vuote e l'app è
muta all'apertura: è già successo, dividendo il file in moduli.

---

## Convenzioni

**Le etichette dei comandi descrivono l'azione, non lo stato** («Pausa», non
«In ascolto»). Lo stato lo racconta la riga in alto e il punto che pulsa.

**I comandi sono elementi HTML nativi** e funzionano identici col puntatore,
col dito, col tasto Tab e con un lettore di schermo. Il disegno è puro
display: non ascolta nulla.

**I cursori scrivono sul bersaglio `GT`**, non su `G`. `G` ci arriva lisciato
in `battito()`: un cursore che scrivesse su `G` farebbe uno scalino, e uno
scalino su una frequenza di taglio si sente come un clic. Fanno eccezione i
filetti della FORMA — `FORMA` e `FORMA_T` — che scrivono diretto: la forma non
entra in nessun suono già cominciato, la legge il costruttore quando la nota
nasce, quindi non c'è nessuno scalino da lisciare.

**Le due classi hanno cinque filetti diversi, e non è una svista.** Le gocce
hanno `attacco · coda · inarm · brill · corpo`; i tessuti hanno
`apertura · movimento · passo · brill · corpo`. Per un tenuto non esiste un
attacco da misurare in millesimi e non esiste una coda — c'è una dissolvenza —
mentre esiste una cosa che le gocce non hanno: il tipo e la velocità del
movimento interno. Chi unificasse i due gruppi «per coerenza» toglierebbe ai
tessuti l'unico comando che li distingue davvero.

**I numeri che cambiano** usano cifre a larghezza fissa, altrimenti tremolano
a ogni aggiornamento.

---

## Verifica

`node prova.mjs` rende il motore fuori tempo reale dentro un
`OfflineAudioContext` e misura quello che esce: che suoni, che non clippi, che
ogni timbro esca dal silenzio senza esplodere, che l'equalizzatore muova
davvero lo spettro, che uno stadio di passa-tutto abbia **guadagno unitario**,
che i due lati del riverbero stiano **pari**, che la coda **scenda** — che è
il modo in cui una rete a retroazione sbaglia — che la compensazione dei
tessuti sia **liscia** dove quella per conteggio di teste scatterebbe, e che i
sedici mood siano in regola: periodi coprimi dentro ogni serie, riallineamento
sopra le 24 ore in tutte e 64 le combinazioni, ogni timbro una volta sola, e
quattro accoppiate rese dal motore intero senza clippare. Esce con codice
diverso da zero se qualcosa non torna. Serve `playwright` e un Chromium.

**La prova fissa l'ora e la stagione** (`ORA = 14`, `MESE = 9`). Senza,
misurerebbe cose diverse a seconda di quando la si lancia — il calore, lo
spazio, il colore d'insieme e il respiro dei tessuti dipendono dall'orologio.

Quest'ultima prova verifica anche **sé stessa**: misura lo scatto nelle due
versioni e fallisce se quella per teste NON è ruvida. Una prova che non sa
distinguere il caso giusto da quello sbagliato non sta provando niente.

**La prova va rifatta più volte, non una.** I difetti che sono costati di più
non erano rotture ma oscillazioni: la stessa rete che rendeva numeri diversi a
ogni costruzione. Tre corse di fila che danno le stesse cifre valgono più di
una corsa sola che passa.

**Chi aggiunge un timbro rifaccia la prova e scriva il peso che ne esce**, in
`PESO` dentro `timbri.js` per le gocce e in `PESO_T` dentro `tessuti.js` per i
tessuti. Le due serie sono pareggiate su misura: le gocce a circa −17 dB di
picco, i tessuti a −18 — un decibel sotto, perché i tessuti si sovrappongono e
la compensazione su √N tiene ferma la somma ma non regala margine. Senza quel
pareggio, cambiare timbro sarebbe cambiare volume.

Prima di ogni commit che tocchi il motore, verificare anche in locale aprendo
`index.html`: che il suono parta entro un secondo e che i cursori non facciano
clic.

---

## Stato e prossimi passi

**Hiroshi è al pari di Rada Deriva, e in due punti oltre.** Fatto: il **banco
d'uscita** (mixer a quattro canali con mandata al riverbero, normalizzazione
per canale, colore d'insieme, equalizzatore a otto bande, limitatore doppio,
misuratori), la **deriva** trapiantata intatta, il **modello delle linee** con
piani, trame e ricambio, gli **otto timbri** delle gocce, gli **otto tenuti**
dei tessuti con la normalizzazione del bus, i **sedici mood**, le **due
influenze esterne**, i **comandi per linea**, il **modo del materiale** col
rinnovo al passo di quinta, l'**accensione per classe**, lo **scheduler** e
l'**esportazione fuori tempo reale**.

Gli otto tenuti stanno su due assi — dove stanno e che cosa si muove — e non
sono materie come le gocce, sono modi di essere instabili. Il fatto che li
regge sta in cima a `tessuti.js`: un tenuto perfettamente fermo, dopo pochi
secondi, smette di essere un suono e diventa una proprietà della stanza.

Oltre Rada: i **timbri** (Rada ne aveva uno per classe, governato da un solo
numero; qui sono otto e otto, e `calore` è quel numero rimasto al suo posto) e
l'**esportazione deterministica**.

Da fare, in ordine:

1. I **grani**: microfono e file propri, con la nube attorno alla testa di
   lettura. È la funzione nuova che non viene da nessuna delle tre app.
2. Il **registratore**: cattura del bus d'uscita e scrittura del wav. La
   strada è l'AudioWorklet caricato da blob (vedi sopra); l'esportazione
   *deterministica* passa invece da `rendiOffline`, ed è già in piedi.
3. La **tavola**: il disegno vero, che sostituisce l'impalcatura di
   `tavola.js`.
4. Le **voci** e il **cielo**: il motore alla *In C* di Nuvole con l'archivio
   delle 53 frasi, e il campo `fBm` che le sveglia. **Rimandati per scelta**:
   l'archivio attraversa tutti e dodici i gradi mentre gocce e tessuti stanno
   su una pentatonica anemitonica, e far entrare le voci vuol dire decidere
   che cosa succede a quella garanzia. È una decisione musicale, non tecnica,
   e non è ancora presa.

Aperti: `rendiOffline` percorre lo stesso modello che sta suonando, quindi
esportare mentre si ascolta oggi disturberebbe la sessione in corso — va dato
al render un modello suo. E `deriva.js` sorteggia le fasi al caricamento: per
un'esportazione riproducibile servirà un seme.
