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

**Il microfono non si granula dal vivo: si registra, e si granula la
registrazione.** Tre ragioni, tutte strutturali. L'ESPORTAZIONE: `passo(now)`
percorre il tempo più in fretta del tempo reale, e un flusso dal microfono non
si può percorrere più in fretta del tempo reale — renderebbe silenzio nel wav,
cioè romperebbe la promessa che il file suoni come quello che si è ascoltato.
LA TESTA DI LETTURA: su un flusso si può solo guardare indietro di un ritardo
fisso, mentre su una registrazione la testa si ferma, torna, va al contrario —
e «fermarsi dentro un suono» è metà di quello che il granulare serve a fare.
IL RIENTRO: microfono aperto e altoparlanti accesi sono un anello, e un anello
con dentro un granulare è un fischio.

**La somma dei tessuti si normalizza sugli INVILUPPI, mai su un conteggio di
voci.** Vale anche per i **grani**, dove però la somma si conosce senza
sommarla: quanti grani suonano insieme è densità per durata, due numeri che
stanno in un cursore. Senza dividere per √N, alzare la densità vorrebbe dire
alzare il volume invece di infittire la nube — e la densità è proprio il
comando che si muove per cambiare la grana. Sorgenti incoerenti si sommano in potenza, quindi il bus si divide per
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
resterebbe senza testi al doppio clic. I dizionari sono oggetti JavaScript. I
file dell'utente arrivano da un `<input type=file>` e passano per
`decodeAudioData`: nessuna richiesta di rete.

**`rendiOffline` fotografa il modello e lo rimette a posto.** Percorre lo
stesso modello che sta suonando e riparte da zero, quindi senza la fotografia
esportare mentre si ascolta riporterebbe l'origine dei giri a zero e farebbe
ricominciare l'armonia da un'altra parte. La fotografia comprende anche le
variabili della DERIVA — `quinta`, `passiQuinta`, `passoN`, `prossimaQuinta` —
che stanno in un altro file e che nessuno penserebbe di salvare: sono proprio
quelle che, dimenticate, si notano solo dopo. Conseguenza da tenere a mente:
**i contatori tornano indietro insieme al resto**, quindi dopo un render
`storiaGocce` e `graniEmessi` raccontano la sessione e non il render. Quello
che il render conteneva si legge in `ultimoRender`.

**Un AudioWorklet si carica da un `data:` URI, NON da un blob.** `addModule`
di un percorso locale fallisce per il CORS — quello si sapeva — ma anche il
blob fallisce: su `file://` `URL.createObjectURL` dà un `blob:null/…`, origine
opaca, e `addModule` risponde `AbortError: Unable to load a worklet's module`.
Misurato. Da `http://` il blob funziona, ed è così che la cosa passa
inosservata: si prova sul server, va, e poi non va sul doppio clic — che è
proprio il caso che questo progetto promette di reggere. La strada è
`"data:text/javascript," + encodeURIComponent(codice)`, verificata su tutti e
due. Si usa `encodeURIComponent` e non `btoa` perché `btoa` non regge un
carattere fuori dal Latin-1: basterebbe un accento in un commento dentro il
processore. Il codice è in `preparaCattura()`, dentro `grani.js`, e il
registratore userà lo stesso.

**La palette è definita una volta sola**, nelle variabili CSS di
`css/style.css`. Anche il canvas le legge da lì, al caricamento, con
`getComputedStyle`. Non introdurre colori scritti direttamente nel JavaScript:
nella tavola non ce n'è nessuno, e la prima eccezione sarebbe la fine della
regola.

**Due letture del segno, una volta ciascuna.** Sulla tavola *il colore è
l'altezza* e *la lunghezza è la durata*. Non aggiungere una terza codifica
della stessa grandezza e non spostare una di queste due senza spostare anche
la chiave che le dichiara. Conseguenza pratica: **lo stato è inchiostro** —
acceso, spento, muto, dove sta la mano, dove sta la testa di lettura. Il
colore è già impegnato e non può dire anche quello.

**Gli estremi della rampa dell'altezza sono fissi e non sono quelli del
campo.** `SCALE` va da 65 a 1975 Hz, ma la selezione ne prende due o tre ottave
attorno al centro: tarando la rampa sul campo intero, tutto quello che si sente
finirebbe nel verde di mezzo. Gli ancoraggi sono 100 e 1500 Hz, e chi esce
dalla banda si appoggia sul blu pieno o sul rosso pieno — che per il fondo di
«bordone» o il velo di «soglia» è la lettura giusta. Prenderli da `SCALE`
sarebbe peggio ancora: la rampa si sposterebbe a ogni passo di quinta e il
colore direbbe la tonalità invece dell'altezza.

**Quello che la tavola disegna esce dalle stesse funzioni che scrivono
l'audio.** Il colore di un evento da `altezza()`, la lunghezza di una tenuta da
`durataTenuta()`, la sua opacità da `finestra()`, la coda di una goccia da
`formaGocce()`. Una tavola che ridisegnasse a modo suo comincerebbe a mentire
al primo ritocco, e mentirebbe piano.

**Le dipendenze scorrono in una direzione sola:**
`deriva ← cattura ← linee ← timbri ← tessuti ← grani ← mood ← banco ← motore ←
registratore ← comandi ← tavola`. Il modello non conosce l'audio; l'audio non
conosce il disegno.

**I comandi e il disegno sono due file, e la separazione è la regola resa
visibile.** `comandi.js` tocca il modello e non disegna un pixel; `tavola.js`
legge il modello e non registra un ascoltatore. Non c'è un `addEventListener`
in tutta la tavola e non deve arrivarcene uno: un cursore disegnato sarebbe un
cursore che nessuno può usare senza vederlo. La tavola prende dai comandi una
cosa sola — i dizionari dei nomi — e per quello l'arrow punta in quel verso.

**La tavola si accorge da sé che una mano ha mosso qualcosa**, confrontando
`GT` con la propria copia a ogni fotogramma. È il modo di reagire senza
ascoltare, ed è quello che tiene in piedi la separazione qui sopra. Se un
giorno servisse sapere altro dai comandi, la strada è guardare il modello, non
farsi chiamare.

**`cattura.js` sta in cima e non dipende da niente** tranne `clamp`, perché lo
usano due file lontani fra loro: il microfono dei grani e il registratore della
sessione. Sono lo stesso mestiere — portare fuori dal grafo una manciata di
campioni — e due copie divergerebbero al primo ritocco.

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

**In canvas l'opacità si moltiplica per quella che c'è già, e si rimette
dov'era.** Un `globalAlpha = 1` alla fine di una primitiva sembra il modo
giusto di ripulire e invece cancella l'opacità con cui il chiamante ha
avvolto un gruppo intero: una classe spenta tornava a disegnarsi piena, e il
difetto si vedeva solo togliendo la spunta a una classe mentre suonava. Il
salvataggio vale anche per `T.save()`: dentro, `globalAlpha *=`, mai `=`.

**`clearRect` non guarda l'opacità: cancella e basta.** È quello che serve per
lo strappo nel filo dove sta il numero di una linea — il canvas è trasparente,
quindi cancellare rimette la carta con la sua grana e non una toppa di colore —
ma vuol dire anche che uno strappo dentro un gruppo dimezzato d'opacità
cancella lo stesso.

**Il modello si popola da sé.** In fondo a `linee.js` c'è
`frasi.forEach(rigenera)`. Senza quella riga le frasi nascono vuote e l'app è
muta all'apertura: è già successo, dividendo il file in moduli.

---

## Convenzioni

**Le etichette dei comandi descrivono l'azione, non lo stato** («Pausa», non
«In ascolto»). Lo stato lo racconta la riga in alto e il punto che pulsa.

**I comandi sono elementi HTML nativi** e funzionano identici col puntatore,
col dito, col tasto Tab e con un lettore di schermo. Il disegno è puro
display: non ascolta nulla, e il canvas porta `aria-hidden` perché quello che
mostra è scritto anche in cifre nelle letture in fondo alla colonna.

**Le corone non hanno etichette ferme.** Ne compare una, per due secondi e
mezzo, sul settore che la mano ha appena mosso. Dodici parole scritte attorno a
due cerchi si leggono una volta sola e poi si smette; il nome per esteso sta
nella colonna, dove serve quando si cerca. Un mood scrive quindici bersagli in
un colpo, e allora l'etichetta tace: non è una mano su un filetto, è uno
scatto.

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
quattro accoppiate rese dal motore intero senza clippare. Sui **grani**
verifica che la testa di lettura si muova davvero (un accumulatore che non
accumula è un difetto muto: si sente solo come una nube che non va da nessuna
parte), che la compensazione segua la densità, e che in modo intonato tutti
gli intervalli stiano nella collezione. Esce con codice diverso da zero se
qualcosa non torna. Serve `playwright` e un Chromium — `npm i -D playwright`
e `npx playwright install chromium`, una volta sola. La prova non ha percorsi
scritti a mano: il browser è quello che playwright ha installato e la pagina si
ricava da dove sta `prova.mjs`, aperta con `file://` perché è il doppio clic la
promessa da verificare. `HIROSHI_CHROMIUM` resta per chi ha un Chromium suo.

**La prova non guarda il disegno**, e non è una dimenticanza: la tavola non
tocca il modello, quindi non può rompere il suono. Quello che la difende è che
un errore nel disegno si vede — e che `prova.mjs` fallisce se la pagina scrive
un solo errore in console, il che comprende quelli della tavola.

**Il wav si verifica per ANDATA E RITORNO, non guardando l'intestazione.** I
44 byte davanti non hanno nulla di negoziabile e, se un campo è sbagliato, il
file non si apre e guardandolo non c'è modo di accorgersene. La prova scrive un
buffer noto, lo ridà da decodificare al browser e confronta i campioni: a 24
bit lo scarto atteso è il passo di quantizzazione, 2⁻²³ ≈ 1,2·10⁻⁷. Verifica
anche che esportare **non sposti il modello della sessione**, prendendo
un'impronta prima e dopo.

**La prova si porta una materia sua**: i grani all'apertura sono muti per
costruzione — non c'è nessun suono in dotazione da granulare — quindi la prova
sintetizza sei secondi di quattro toni, che sono riconoscibili e permettono di
vedere se la testa si sposta.

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

Fatti anche i **grani** (archivio dei materiali, cattura dal microfono, nube
attorno alla testa di lettura, intonazione sulla collezione) e il
**registratore**: la presa dal vivo sull'uscita del banco e l'esportazione
fuori tempo reale, tutte e due in wav a 24 bit stereo. **IL MOTORE È
COMPLETO.**

**C'È ANCHE LA TAVOLA.** Il disegno ha sostituito l'impalcatura, e l'ha
sostituita separandosi da lei: i comandi stanno in `comandi.js`, il canvas in
`tavola.js`. Cinque sezioni, in unità logiche disposte da `disponi()` — che
ricava l'ALTEZZA dalla larghezza, così il disegno non si deforma mai, cresce:

- i **due quadranti**, un anello per linea, la fase come tacca d'inchiostro,
  gli eventi come archi colorati per altezza e lunghi quanto durano, il lampo
  su `flash` quando l'evento esce davvero, la zona attiva sulle sole gocce;
- le **corone**, un settore per parametro, l'arco pieno dov'è la mano e la
  tacca dov'è l'efficace — la stessa doppia lettura che la colonna scrive
  come «45 → 61», detta in modo che si veda muovere;
- la **fascia dei grani**: il materiale come profilo chiuso, la nube come
  banda, la testa di lettura come verticale, i grani come quadratini colorati
  per trasposizione e alti quanto il loro posto nel campo stereo;
- la **corsia della deriva**: dieci minuti di baricentro, cinque passati e
  cinque futuri, e sotto il cammino delle quinte coi nomi delle collezioni che
  devono ancora arrivare. È la sola parte della tavola che mostra qualcosa che
  non è ancora successo, e si può perché la deriva è una funzione del tempo;
- i **misuratori**: due picchi con tenuta e il limitatore che mangia
  all'indietro dalla cima.

Sotto i 430 px i due quadranti si impilano invece di rimpicciolirsi; sopra i
1040 la tavola sta a fianco della colonna e resta appesa in alto mentre quella
scorre. Un fotogramma costa 0,24 ms misurati, cioè niente.

Da fare, in ordine:

1. **Rifinire la tavola sul vetro vero.** Il disegno è al primo passaggio
   completo e la prova non lo guarda: quello che resta si vede solo aprendo
   `index.html` e stando a guardare per qualche minuto — le proporzioni delle
   corone, quanto pesa un anello di tessuti a intreccio alto, se il lampo si
   legge ancora con otto linee che scattano insieme.
2. Le **voci** e il **cielo**: il motore alla *In C* di Nuvole con l'archivio
   delle 53 frasi, e il campo `fBm` che le sveglia. **Rimandati per scelta**:
   l'archivio attraversa tutti e dodici i gradi mentre gocce e tessuti stanno
   su una pentatonica anemitonica, e far entrare le voci vuol dire decidere
   che cosa succede a quella garanzia. È una decisione musicale, non tecnica,
   e non è ancora presa. Quando entreranno, sulla tavola sono un terzo
   quadrante: la pianta è già fatta per accoglierlo.

Aperti: `rendiOffline` percorre lo stesso modello che sta suonando, quindi
esportare mentre si ascolta oggi disturberebbe la sessione in corso — va dato
al render un modello suo. E `deriva.js` sorteggia le fasi al caricamento: per
un'esportazione riproducibile servirà un seme. I **materiali dei grani non si
conservano**: un file caricato o una registrazione vivono finché la pagina è
aperta, e salvarli vorrebbe dire IndexedDB, cioè la prima cosa in tutto il
progetto a scrivere sul disco di chi ascolta — da decidere se si vuole.
