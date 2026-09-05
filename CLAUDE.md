# Hiroshi — contesto di progetto

Uno studio per fare musica d'ambiente nel browser. Riunisce ed estende Rada,
Rada Deriva e Nuvole: otto linee sfasate, un campo continuo che chiama le
voci, il paesaggio tirato da registrazioni proprie, e un banco d'uscita che registra
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

**IL PAESAGGIO SI RALLENTA SENZA TRASPORRE, e questo è tutto il pezzo.** Non
si legge il buffer più piano — quello abbassa anche l'altezza, e a un ottavo
della velocità una voce diventa un mostro. Si legge la materia a velocità
NATURALE, in finestre che si sovrappongono, e si fa camminare piano il punto da
cui le finestre vengono prese. L'altezza resta quella del materiale, la durata
si dilata quanto si vuole. La prova lo verifica misurando dove sta l'energia
dello spettro con due rallentamenti diversi: se il baricentro si sposta di più
di un quinto, il velo sta trasportando e non distendendo.

**Quattro strati per finestra, e non è una taratura.** È la ragione per cui non
si sentono i confini: ogni istante è coperto quattro volte da campane sfasate, e
la somma non ha buchi. Con due si sente respirare, con uno è un loop che sbatte.

**Lo sparpaglio è quello che lo rende un paesaggio e non un nastro.** Finestre
che partissero tutte dallo stesso punto sarebbero lo stesso identico campione
ripetuto a distanza fissa, cioè un filtro a pettine: si sente come un tubo. Uno
scarto casuale su dove ciascuna comincia rompe la periodicità e lascia solo la
materia.

**Il riverbero del paesaggio sta DENTRO la sorgente, e altrove è il contrario.**
Per le altre tre classi vale la regola di Rada — il riverbero è una mandata, non
un inserto, e la stanza resta una sola. Qui no: per un drone la coda non è
l'ambiente in cui il suono si trova, è metà del suono, e cambiarne la lunghezza
è comporre e non missare. Quindi il paesaggio si porta la sua rete dietro, con
la sua coda e il suo tono, e la mandata alla stanza dello studio resta a zero —
è la sola sorgente senza uno «spazio».

**OGNI CLASSE HA UN INSERTO, E IL RIVERBERO NON CI STA DENTRO.** Sotto il
quadrante, oltre la linea, ci sono una tendina e tre manopole: l'effetto scelto
sta sul canale della classe, fra il normalizzatore e la coppia livello/mandata
— `ingresso → normale → presa → [effetto] → ritorno → { livello, mandata }`.
Prima del normalizzatore l'effetto lavorerebbe su un segnale che sale e scende
con quante voci sono aperte; dopo la mandata, la stanza sentirebbe il secco
mentre davanti canta l'eco, cioè due sorgenti diverse nello stesso posto.

Gli effetti sono ECO, TREMOLO, CORO e FILTRO, più «niente». **Il riverbero non
c'è perché c'è già**: «spazio», la terza traccia della corona di ogni classe, è
la mandata alla stanza dello studio. Metterlo anche qui vorrebbe dire due
comandi sulla stessa grandezza e due stanze invece di una, contro la regola qui
sopra. Quello che il riverbero non sa fare, e che qui mancava davvero, è l'eco:
ripetizioni che si contano invece di una coda che si spalma.

**TRE PARAMETRI PER EFFETTO, e le tre manopole ci sono sempre.** Se ogni effetto
ne portasse quanti gliene servono, cambiare effetto vorrebbe dire veder saltare
l'impaginazione, e la simmetria fra le due classi durerebbe finché le due
tendine dicono la stessa cosa. A inserto vuoto le tre si spengono davvero —
`disabled` — perché un comando che si muove e non fa niente è peggio di un
comando che dice di no. **La terna è UNA SOLA PER CLASSE**, non una per
effetto: cambiando effetto le manopole restano dove sono e il nuovo le legge a
modo suo, come su un pannello vero, dove le manopole stanno fuori dall'effetto.
Stanno in `G` in 0÷100 e la conversione nell'unità vera è dentro `effetti.js`:
in unità reali andrebbero riscritte a ogni cambio di effetto, cioè spostate
sotto le dita di chi ha appena girato la tendina.

**L'anello di retroazione dell'eco VA BENE, e quello del passa-tutto no.** La
differenza non è il rischio, è a che cosa serve l'anello: nel passa-tutto due
prese devono cancellarsi, e i 128 campioni che Web Audio infila in ogni ciclo le
scollavano (vedi fra le insidie); qui una strada sola torna indietro più tardi, e
il blocco si somma al tempo di ritardo — 2,7 ms su un'eco da mezzo secondo. I
ritorni non passano 0,8 e nell'anello c'è un passa-basso: senza, la ventesima
ripetizione suonerebbe come la prima, che non è un'eco ma un loop.

**Cambiare effetto dal vivo passa per una dissolvenza, la costruzione no.**
Trenta millesimi giù, si smonta e si rimonta, trenta su: il taglio netto fra due
catene diverse è un clic. La dissolvenza usa un `setTimeout` e per questo NON
può essere la strada della costruzione — `tara()`, che vale anche dentro un
rendering fuori tempo reale, dove il render finirebbe prima che il timer scatti
e l'effetto non ci sarebbe mai. Al montaggio i tre valori si scrivono con la
costante di lisciamento a ZERO (`scrivi(v, quando, 0)`): un effetto appena
costruito non ha un valore vecchio da cui scivolare, e un tempo di ritardo che
sale da zero non è un'entrata, è una glissata.

**IL PAESAGGIO SI INTONA PER RISONANZA, non per trasposizione.** Una
registrazione ha un'altezza sua che nessuno conosce, e un temporale non ne ha
affatto: trasporla su un grado vorrebbe dire prima indovinarla, e su pioggia,
folla o vento non c'è niente da indovinare. Quindi non si tocca il materiale —
gli si mette dietro un banco di passa-banda accordati sui gradi della
collezione, e la sua energia a banda larga li eccita. Funziona MEGLIO proprio
sui materiali che non hanno un'altezza da rilevare, e non può fallire su
nessuno. Misurato su rumore bianco: senza banco l'energia sui gradi è a ±1,5 dB
da quella sul semitono accanto — cioè nessuna preferenza; col banco a fuoco 24
sale di **nove-dieci decibel**, e il livello complessivo non si muove di più di
un decibel.

Il banco tiene gli INDICI del campo, non le frequenze: quando la quinta scatta
`SCALE[i]` dà la nota nuova e i filtri ci scivolano sopra con una costante
lunga. Quattro filtri su cinque riscrivono lo stesso numero, quindi il cambio
non ha un bordo — la stessa promessa delle altre classi.

Due cursori e non uno. ACCORDATURA dosa fra il paesaggio crudo e quello
intonato; FUOCO è quanto sono stretti i filtri, cioè la strada fra «la
registrazione con dentro le note del campo» e «un pad che del luogo non ha più
niente». Sono due domande diverse — quanto, e che cosa — e con un cursore solo
se ne potrebbe rispondere una. **Il fuoco non deve girare il volume**: un
passa-banda lascia passare una fetta larga f/Q, quindi il guadagno del banco
cresce col fuoco (esponente 0,6, non 0,5: a fuoco largo i filtri si accavallano
e la somma è più coerente della teoria incoerente). Il fuoco non scende sotto
otto — misurato, sotto quella soglia i filtri non distinguono più un grado dal
semitono accanto, e sarebbe un terzo di corsa che non fa quello che l'etichetta
promette.

**L'accordatura sta PRIMA del riverbero.** La coda deve prendere le note già
intonate: al contrario la stanza si riempirebbe del materiale crudo mentre
davanti canta il campo, cioè due paesaggi diversi nello stesso posto.

**Ritarare una rete a retroazione vuol dire RIMISURARE il picco del filtro.**
`costruisciRiverbero` restituisce una `tara(t60, smorzamento)` che rifà i
guadagni d'anello, e ogni volta richiama `piccoDi()` sul filtro col nuovo
smorzamento invece di riusare il picco di prima. Riusarlo è il modo per cui una
coda smette di scendere e comincia a crescere — vedi i +600 dB fra le insidie.
La misura è sincrona e non costa un rendering.

**Il microfono non si percorre dal vivo: si registra, e si percorre la
registrazione.** Tre ragioni, tutte strutturali. L'ESPORTAZIONE: `passo(now)`
percorre il tempo più in fretta del tempo reale, e un flusso dal microfono non
si può percorrere più in fretta del tempo reale — renderebbe silenzio nel wav,
cioè romperebbe la promessa che il file suoni come quello che si è ascoltato.
LA TESTA DI LETTURA: su un flusso si può solo guardare indietro di un ritardo
fisso, mentre su una registrazione la testa si ferma, torna, cammina a un
sessantaquattresimo — e tenere ferma una materia sotto una lente è tutto quello
che il paesaggio serve a fare. IL RIENTRO: microfono aperto e altoparlanti
accesi sono un anello, e un anello con dentro una coda di venti secondi è un
fischio.

**Una tenuta che attraversa il passo di quinta sceglie un grado che
sopravvive.** È l'unica dissonanza che questo strumento sapesse produrre, e non
veniva dal materiale né dai modi: una tenuta viene intonata UNA VOLTA SOLA,
quando viene prenotata, e tiene quella frequenza fino a sessanta secondi. Se nel
frattempo la collezione scatta e il grado scelto è quello che se ne va, la nota
resta fuori. Misurato prima della correzione: il **22%** delle tenute che
attraversano un passo finiva fuori collezione, cioè circa una per passo, per
qualche secondo.

Il rimedio è piccolo perché il passo è piccolo: fra una pentatonica e la sua
quinta cambia una nota su cinque, quindi quattro gradi su cinque valgono in
tutte e due le collezioni. `altezzaCheResta()` in `deriva.js` sceglie fra quelli
il più vicino a quello voluto — misurato, sposta il 20% delle tenute lunghe di
tre semitoni al massimo, mai di un'ottava. Non tocca le gocce: la coda di una
goccia sta già scendendo quando il passo arriva, mentre un tenuto sta ancora
aprendosi. Non dipende dal modo del materiale: «ancora» e «deriva» non c'entrano
niente, il problema è una nota lunga che attraversa un cambio d'armonia.

**Un evento non contiene nessuna frequenza, contiene una POSIZIONE NEL CAMPO.**
`rel` sta in −1÷1 e diventa un'altezza solo al momento della prenotazione, con
`altezza()`, che legge il campo di quell'istante. È la ragione per cui un'idea
congelata in «ancora» non può stonare: quando la collezione scatta, cinque
indici su venticinque cambiano nota e l'idea ferma li segue senza saperlo. E le
due classi leggono lo STESSO campo — un `SCALE` solo, un baricentro solo — con
la sola differenza di quanto larga è la forbice, più un ripiegamento per ottave
sui tessuti che conserva la classe d'altezza. Non esiste un modo per cui una
classe si trovi in una tonalità diversa dall'altra.

**La somma dei tessuti si normalizza sugli INVILUPPI, mai su un conteggio di
voci.** Vale anche per il **paesaggio**, dove però la somma si conosce senza
sommarla: quanti strati suonano insieme è la sovrapposizione del velo, che è una
costante. Senza dividere per √N, allargare la finestra vorrebbe dire alzare il
volume invece di distendere il suono. Sorgenti incoerenti si sommano in potenza, quindi il bus si divide per
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
`storiaGocce` e `veliEmessi` raccontano la sessione e non il render. Quello
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
processore. Il codice è in `preparaCattura()`, dentro `cattura.js`, e il
registratore userà lo stesso.

**La palette è definita una volta sola**, nelle variabili CSS di
`css/style.css`. Anche il canvas le legge da lì, al caricamento, con
`getComputedStyle`. Non introdurre colori scritti direttamente nel JavaScript:
nella tavola non ce n'è nessuno, e la prima eccezione sarebbe la fine della
regola.

**IL TEMA SCURO È LO STESSO FOGLIO GIRATO, non una seconda palette.** Carta e
inchiostro si SCAMBIANO — gli stessi due colori — e i sei toni in mezzo stanno
sulla retta fra i due nuovi estremi, ciascuno nel punto in cui il suo rapporto
di contrasto col fondo è quello che aveva sulla carta chiara: 6,01 · 2,61 ·
1,63 · 1,45 · 1,17 · 1,24, gli stessi a due cifre. È per questo che il tema
scuro non è più contrastato né più piatto dell'altro. Chi aggiunge una tinta
alla palette la calcoli così e scriva il numero, o il tema scuro comincerà a
essere un'altra tavola.

**L'ambra non cambia col tema**, ed è il punto: l'accento dice ADESSO, e un
accento che cambiasse tinta smetterebbe di essere una cosa sola. Sul fondo scuro
il suo contrasto scende da 3,54 a 2,72, ma è l'unica cosa colorata di tutta la
tavola e su una pagina di soli grigi un arancio non ha bisogno di luminanza per
farsi vedere.

**Il tema sta in un attributo sulla radice, e la tavola se ne accorge da sé.**
`data-tema="scuro"` sull'elemento radice, scritto dai comandi; il CSS ci appende
la palette e `tavola.js` confronta l'attributo con la propria copia a ogni
fotogramma — lo stesso modo in cui si accorge che una mano ha mosso un cursore,
e la ragione per cui non c'è un `addEventListener` in tutto quel file. Con la
palette cade anche l'ONDA IN CACHE, che è disegnata coi grigi del tema:
`ondaChiave = ""`, o resterebbe la scala di prima fino al cambio di materiale.

**Il tema non si scrive da nessuna parte.** All'apertura si chiede al sistema
con `prefers-color-scheme` e si continua ad ascoltarlo finché nessuno ha scelto
a mano; dopo la scelta comanda chi l'ha fatta. È l'unico modo di ritrovare il
proprio tema senza toccare il disco di chi ascolta — che in questo progetto è
una decisione non ancora presa (vedi i materiali del paesaggio) e non la si
prende per un colore.

`color-scheme` non dipinge niente di quello che si vede — ogni comando è
ridisegnato con le variabili — ma dice al browser di che colore fare quello che
disegna lui: il menù che si apre da una tendina, la barra di scorrimento. Senza,
in tema scuro si aprirebbe un menù bianco in mezzo a una tavola nera.

**LA LUNGHEZZA CODIFICA, L'AMBRA NO.** C'è un accento solo — `--ambra`, il rosso
di Rada Deriva — e non dice mai *che cosa*. Quello che le cose SONO lo dice la
geometria, una grandezza per classe: sulle gocce la lunghezza RADIALE della
tacca è il registro, sui tessuti la lunghezza dell'ARCO è la durata. Tutto il
resto è inchiostro — acceso, spento, muto, dove sta la mano, dove sta la testa
di lettura.

**L'AMBRA È DOVE GUARDARE.** Su un foglio che per il resto è tutto inchiostro su
carta, l'accento non dice una grandezza: dice *qui*. Sono quattro famiglie e
non una in più:

- ADESSO, e sta sul canvas: la goccia scattata nell'ultimo mezzo secondo, la
  tenuta entrata per ultima, il punto di fase, i fili che le legano al mirino, il
  legame fra due gocce cadute insieme;
- IL VALORE: ogni `.vl`, il cronometro, i periodi dentro una didascalia — e la
  curva dell'equalizzatore, che è i numeri delle otto aste disegnati invece che
  scritti, quindi va con loro e non con l'inchiostro;
- DOVE QUALCOSA GIRA: la punta del baricentro, cioè l'istante in cui ha smesso
  di salire o di scendere. Il corpo della colonna resta inchiostro — sono quindici
  minuti di passato, e se fossero tutti in accento non ci sarebbe più una punta;
- DOVE QUALCOSA COMINCIA: i cinque numeri di sezione, e le due «d» di rada e
  studio sotto il marchio.

Le etichette restano grigie e le parole inchiostro. È la proporzione a farlo
funzionare, non la regola: l'accento indica finché resta una minoranza, e il
giorno che una quinta famiglia lo porta sopra il resto smette di indicare
qualunque cosa. Chi ne aggiunge una tolga qualcosa. Misurato: 3,54 di contrasto
sulla carta chiara e 2,72 sul fondo scuro, contro il 2,61 delle etichette in
tutt'e due — un valore in accento è la cosa più leggibile della colonna, che è
quello che deve essere.

Prima il colore era l'altezza, su una rampa a cinque fermate ancorata a 100 e
1500 Hz, e la rampa è stata tolta insieme ai due quadranti di Rada Deriva. Due
ragioni, e la seconda vale più della prima: cinque tinte su una tacca larga un
pixel e mezzo non si distinguono l'una dall'altra; e una tavola con cinque
colori addosso non ha più un accento, perché se tutto è colorato niente
lampeggia. Chi rimettesse l'altezza nel colore si riprenderebbe tutti e due i
problemi.

**L'INTERFACCIA SEGUE UN MOCKUP, e il mockup è la fonte.** Sta come canvas di
design fra gli artifact di Claude — «Hiroshi · interfaccia», un'artboard 1440 ×
1176 — e da lì vengono le misure, la scala tipografica e la geometria delle
sezioni. Chi cambia l'impaginazione lo guardi prima: le colonne da 205, la luce
di 1360, i quadranti da 420 e la corona a 178·189·200 con la sua bocca di
sessanta gradi in basso non sono numeri scelti qui. Fanno eccezione gli anelli,
che il mockup metteva a 82·108·134·160 e che oggi seguono Rada Deriva.

Dove il mockup e il motore non coincidono, **vince il motore**: il disegno è
stato fatto prima che i parametri fossero fermi, e mostra dei tessuti con
«attacco, rilascio, parziali» che non esistono. La tavola ne prende la forma,
non le etichette.

**I DUE QUADRANTI VENGONO DA RADA DERIVA, non dal mockup**, ed è l'unico posto
della tavola dove il mockup non è la fonte. Là le otto linee stanno in un
cerchio solo; qui sono due cerchi separati, gocce da una parte e tessuti
dall'altra, ma il linguaggio è quello, copiato segno per segno: quattro anelli
a **0,30 · 0,47 · 0,64 · 0,81** del raggio, i numerali **romani** fuori
dall'anello e dalla parte della propria colonna — le gocce a ovest, i tessuti a
est — le quattro diagonali della crociera, il punto di fase che percorre
l'anello, e al centro il **mirino**: un punto che si accende con una goccia sul
quadrante delle gocce, un cerchietto che si accende quando una tenuta entra su
quello dei tessuti.

**Lo spessore del tratto pieno è lo stesso sui due quadranti** — `1.6`, un
numero solo in `SPESSORE_ARCO` — e vale sia per la zona attiva delle gocce, cioè
l'arco dentro cui le tacche cadono, sia per la tenuta che sta suonando. I due
cerchi stanno uno accanto all'altro: un arco più grasso da una parte non si
legge come «un'altra classe», si legge come «qui c'è più roba». Quello che
distingue una tenuta passata da una che suona è l'opacità, non il peso.

I numerali sono romani e non arabi perché sulla tavola le cifre arabe dicono già
quantità dappertutto — secondi, decibel, hertz — e un «3» accanto a un anello si
leggerebbe come una misura invece che come un nome.

**TRE TEMPI E NON UNO, e ognuno dice una cosa diversa.** Il lampo dura mezzo
secondo — `LAMPO`, 0,45 — e segna l'ISTANTE: la tacca si ingrossa, il punto del
mirino si accende, e basta che si veda. Il filo che lega una GOCCIA al mirino
dura 0,7, quello di una TENUTA un secondo: non sono lampi ma percorsi, che
l'occhio deve seguire dal bordo al centro per capire QUALE dei quattro anelli ha
parlato, e mezzo secondo non basta a farlo. Fra le due classi la differenza è la
differenza fra i due suoni: una tenuta entra e resta, una goccia è già finita
mentre la si guarda, e un filo che le sopravvivesse racconterebbe un suono che
non c'è più. Chi pareggia questi tre numeri toglie tre letture e ne lascia una.

**IL LEGAME: quando due gocce di LINEE DIVERSE cadono a meno di 0,18 s l'una
dall'altra, un filo le unisce** e sfuma con loro — è il segno che viene da Rada.
Di linee diverse e non della stessa: due gocce della stessa frase sono la frase
che scorre, non un incontro. Non a distanza zero: quattro periodi coprimi non
cadono mai sullo stesso istante esatto, e un accordo lo si sente accordo anche a
un sesto di secondo. La coppia sfuma con lo SCARTO oltre che col tempo, così un
incontro stretto si vede pieno e uno lasco appena. Le gocce calde si raccolgono
in una scorta di lunghezza fissa mentre si disegnano gli anelli e si consumano
subito dopo, prima del mirino: a sessanta fotogrammi al secondo, allocare un
array per buttarlo via è l'unica cosa che il disegno può fare per disturbare
l'audio.

**Il baricentro è un ISTOGRAMMA A PUNTI, non una curva**, ed è il mockup a
dirlo. Una linea continua su una fascia alta quaranta pixel diventa un filo che
ondeggia e di cui non si legge più quanto sia salito; una colonna di punti si
conta. Le colonne dove la curva ha girato — i massimi e i minimi in valore
assoluto — si scrivono a inchiostro pieno: più colonne vicine arrotondano allo
stesso numero di punti, e senza quel segno non si saprebbe quale delle tre è il
momento in cui il baricentro ha smesso di salire. Dove il valore è nullo la
colonna non sparisce: resta un puntino più piccolo e più chiaro sulla linea
dello zero, perché una colonna vuota si leggerebbe come un buco nei dati. Non
serve nessuna memoria: `misto()` risponde per qualunque istante passato.

**L'onda del materiale si disegna una volta sola, su una tela sua.** Un file di
novanta secondi sono quattro milioni di campioni e duecentocinquanta colonne di
quadratini: rifarli a ogni fotogramma sarebbe l'unica cosa in tutta la tavola
capace di far saltare il suono. La chiave della cache comprende il nome, la
durata e il riquadro, così basta cambiare materiale o ridimensionare la finestra
perché si rifaccia. Si normalizza sul picco del materiale, altrimenti una
registrazione presa piano sarebbe una riga piatta e non ci si potrebbe mirare
niente.

**Quello che la tavola disegna esce dalle stesse funzioni che scrivono
l'audio.** Il colore di un evento da `altezza()`, la lunghezza di una tenuta da
`durataTenuta()`, la sua opacità da `finestra()`, la coda di una goccia da
`formaGocce()`. Una tavola che ridisegnasse a modo suo comincerebbe a mentire
al primo ritocco, e mentirebbe piano.

**Le dipendenze scorrono in una direzione sola:**
`deriva ← cattura ← linee ← timbri ← tessuti ← mood ← effetti ← banco ←
paesaggio ← motore ← registratore ← comandi ← tavola`. Gli effetti vengono PRIMA
del banco perché è il banco a montarli sui canali, e loro non sanno niente di
lui: un effetto riceve due nodi e ci costruisce in mezzo. Il paesaggio viene
DOPO il banco, e
non è un caso: è l'unica sorgente che si costruisce una rete di riverbero, e la
rete la sa fare il banco. Il modello non conosce l'audio; l'audio non
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
usano due file lontani fra loro: il microfono del paesaggio e il registratore della
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

**`avvia()` deve azzerare anche la memoria degli eventi**, cioè `flash`,
`fino` e `ultimaSpiga`. Sono tempi assoluti, e quando il tempo riparte da zero — a ogni
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

**La corona mostra l'EFFICACE, il filetto nella colonna mostra la MANO.**
Sono due comandi che dicono la stessa grandezza in due punti, e non è una
ripetizione: fra i due c'è la deriva, l'ora e la stagione, e vederli separati è
l'unico modo di sapere chi sta muovendo un parametro. Chi togliesse una delle
due lascerebbe la tavola senza il suo argomento principale.

Sulle MANOPOLE le due letture stanno sulla stessa figura, perché il comando è
l'arco: le graduazioni si riempiono fino all'EFFICACE, il quadrato sta dove sta
la MANO. Il quadrato deve seguire il dito — è un comando — e le tacche devono
dire il vero: qui non si può scegliere una cosa sola.

**Una targa legge il CURSORE, mai `G`.** Fra i due c'è il lisciamento di
`battito()` e c'è la deriva, e una targa che leggesse il modello mostrerebbe un
numero che nell'istante in cui lo si guarda non è né quello vecchio né quello
nuovo. Peggio: si riscrive solo quando il cursore si muove, quindi non tornerebbe
mai in pari — misurato, muovendo «dispersione» la targa restava sul valore di
prima. Quello che sta suonando lo dicono la corona e le graduazioni, che è il
posto giusto.

**Il canvas sta sotto e i comandi sopra.** Un solo canvas, steso su tutto il
foglio, `pointer-events:none`; i comandi nativi ci galleggiano sopra. Quello che
sembra una manopola da girare è un `input[type=range]` trasparente disteso sopra
il disegno dell'arco: il canvas la disegna, il browser la comanda. È così che la
tavola resta puro display mentre le manopole restano raggiungibili col dito, col
tasto Tab e con un lettore di schermo — e la stessa cosa vale per le aste
verticali dell'equalizzatore e del mixer, che sono cursori in `writing-mode:
vertical-rl` e non rotazioni: una rotazione lascerebbe il rettangolo del fuoco
dov'era.

**Il disegno non ha misure sue.** Legge i RIQUADRI degli elementi marcati
`[data-quadro]` e `[data-manopola]` e ci disegna dentro. L'impaginazione sta
tutta nel CSS, quindi il disegno segue le colonne quando si riordinano su uno
schermo stretto senza sapere niente di media query. Chi aggiunge una sezione
disegnata aggiunga un riquadro nell'HTML, non una costante nel JavaScript.

**I livelli del mixer e le otto bande stanno in `LIVELLI` e `EQ_DB`, dentro
`motore.js`, e `tara()` li rilegge.** Il banco del rendering fuori tempo reale è
un banco NUOVO, che nasce piatto: scritti solo nei nodi, un'esportazione uscirebbe
con le tarature d'esordio invece che con quelle che si stanno ascoltando — cioè
con un mixer diverso da quello appena regolato.

**Il canale dei tessuti ha due mani sopra, e sono due cose diverse.**
`tLivello` è un parametro del MODELLO — quanto lo sfondo sta sotto al primo
piano — e la deriva lo muove, un mood lo riscrive, la corona lo mostra.
`LIVELLI.tessuti` è l'asta del MIXER, una decisione di missaggio come quella
delle frasi o del paesaggio. Il guadagno del canale è la loro SOMMA in decibel:
l'asta scosta, il modello respira. Tenerle separate è quello che permette a un
mood di scrivere il carattere senza spostare il missaggio, e viceversa. Chi le
unisse rimetterebbe due comandi sullo stesso numero.

**I cursori scrivono sul bersaglio `GT`**, non su `G`. `G` ci arriva lisciato
in `battito()`: un cursore che scrivesse su `G` farebbe uno scalino, e uno
scalino su una frequenza di taglio si sente come un clic. Fanno eccezione i
filetti della FORMA — `FORMA` e `FORMA_T` — che scrivono diretto: la forma non
entra in nessun suono già cominciato, la legge il costruttore quando la nota
nasce, quindi non c'è nessuno scalino da lisciare.

**Le due classi hanno cinque filetti diversi, e non è una svista.** Nel
riquadro «Forma del suono» le gocce hanno `attacco · coda · inarmonicità ·
brillantezza · corpo`; i tessuti hanno `apertura · chiusura · movimento ·
brillantezza · corpo`, e il `passo` — la velocità di quel movimento — sta fra le
due manopole dell'Insieme, dove le gocce hanno il calore. Per un tenuto non
esiste un attacco da misurare in millesimi e non esiste una coda — c'è una
dissolvenza — mentre esiste una cosa che le gocce non hanno: il tipo e la
velocità del movimento interno. Chi unificasse i due gruppi «per coerenza»
toglierebbe ai tessuti l'unico comando che li distingue davvero.

**I comandi di una classe stanno in quattro posti, e il posto dice che cosa
sono.** Nella colonna: cinque filetti sotto «Forma del suono» — che cosa è il
suono — e tre sotto «Insieme», che sulla tavola sono le tre tracce della corona:
addensamento · densità · spazio per le gocce, intreccio · livello · spazio per i
tessuti. SOTTO IL QUADRANTE, le due manopole: registro e calore per le gocce, registro e passo per i tessuti.
Stanno lì e non in colonna perché sono la stessa figura del quadrante — un arco
graduato con un quadrato che ci corre sopra — e la bocca della corona si apre in
basso proprio verso di loro: si leggono come due satelliti del cerchio invece
che come due comandi qualunque in fondo a una lista. SOTTO LA LINEA, la tendina
dell'effetto e le sue tre manopole: la linea separa quello che sta DENTRO il
suono da quello che gli viene DOPO, e senza di lei sarebbero cinque manopole in
fila senza una ragione per cui tre cambiano nome quando si tocca una tendina.

**LE DUE CLASSI SONO SIMMETRICHE, comando per comando**, e la simmetria è una
cosa da difendere: cinque filetti, tre tracce di corona, due manopole, la
tendina dell'effetto con le sue tre manopole, quattro righe di linee, il modo
del materiale. La più esterna delle tre tracce è lo
SPAZIO da tutt'e due le parti — lo stesso parametro allo stesso raggio sui due
quadranti. Chi aggiunge un comando a una classe si chieda che cosa gli
corrisponde nell'altra: se non c'è risposta, forse il comando è nel posto
sbagliato.

**I numeri che cambiano** usano cifre a larghezza fissa, altrimenti tremolano
a ogni aggiornamento.

**Il marchio si allarga con la SPAZIATURA, non col corpo**, e `margin-right` è
sempre l'opposto di `letter-spacing`. Le sette lettere restano di diciassette
pixel — il peso del nome rispetto alle sezioni numerate è quello — mentre il
vuoto fra l'una e l'altra si apre fin dove serve: a 1,04 em il blocco misura
172 px contro i 129 di prima. Il margine negativo toglie il vuoto che
`letter-spacing` mette anche DOPO l'ultima lettera, e senza di lui il filo
sotto il nome sporgerebbe di una spaziatura intera oltre la I finale. Chi tocca
uno dei due numeri tocchi anche l'altro.

**La testata va a capo da sé**, con `flex-wrap` e un'altezza minima invece che
fissa: la riga resta di cinquantanove pixel finché ci sta e si spezza quando non
ci sta più. Non c'è nessuna larghezza scritta da tenere in pari col marchio o
con quante sorgenti ci sono — e con una media query al posto suo, allargare il
marchio di un terzo faceva sbordare la pagina fra i 760 e i 950 px.

---

## Verifica

`node prova.mjs` rende il motore fuori tempo reale dentro un
`OfflineAudioContext` e misura quello che esce: che suoni, che non clippi, che
ogni timbro esca dal silenzio senza esplodere, che l'equalizzatore muova
davvero lo spettro, che uno stadio di passa-tutto abbia **guadagno unitario**,
che i due lati del riverbero stiano **pari**, che la coda **scenda** — che è
il modo in cui una rete a retroazione sbaglia — che la compensazione dei
tessuti sia **liscia** dove quella per conteggio di teste scatterebbe, che
nessuna tenuta che attraversa un passo di quinta resti fuori collezione, e che i
sedici mood siano in regola: periodi coprimi dentro ogni serie, riallineamento
sopra le 24 ore in tutte e 64 le combinazioni, ogni timbro una volta sola, e
quattro accoppiate rese dal motore intero senza clippare. Sugli **inserti**
verifica ogni effetto DA SOLO, in un contesto suo e con un segnale noto — l'eco
che ripeta alla distanza giusta e scenda, il tremolo che scavi e tenga i due lati
in controfase, il coro che allarghi due canali identici, il filtro che tolga
l'acuto — e ciascuna di quelle misure verifica anche sé stessa, girando la
manopola che dovrebbe spegnere l'effetto. Dal motore intero chiede solo il
resto: che arrivino all'uscita e che non clippino, spinti nel loro angolo.

**Gli effetti NON si provano sottraendo due render.** Il modello sorteggia le
idee mentre il render cammina, quindi due passate a inserto vuoto danno già uno
scarto quadratico di **0,075** — grande quanto quello di un effetto acceso — e
una prova che li sottraesse starebbe misurando il sorteggio. Misurato, e la
prova lo diceva da sé: fallivano tutti e quattro insieme, che è la firma di una
misura sbagliata e non di quattro difetti. Sul **paesaggio**
verifica che la testa cammini AL PASSO DEL RALLENTAMENTO (un accumulatore che
accumula alla velocità sbagliata è un difetto muto: si sente solo come un
paesaggio che non va da nessuna parte), che non esca mai dal segmento nemmeno
rovesciandone le maniglie, che il drone arrivi all'uscita senza clippare, che
**il rallentamento non trasporti** — il baricentro dello spettro deve restare
dov'è fra un rallentamento di quattro e uno di trentadue — e che la coda del suo
riverbero scenda anche dopo due ritarature. E che **l'accordatura intoni**: su
rumore bianco l'energia deve spostarsi sui gradi della collezione di almeno
quattro decibel rispetto al semitono accanto — il semitono e non un quarto di
tono, perché la pentatonica non ha semitoni e un quarto di tono starebbe ancora
dentro la banda passante. Quella prova verifica anche sé stessa: fallisce se il
materiale crudo mostra già una preferenza per i gradi, il che vorrebbe dire che
sta misurando qualcos'altro — misurato, succedeva lasciando accese le altre due
classi, che sui gradi ci stanno per costruzione.
Esce con codice diverso da zero se
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

**La prova si porta una materia sua**: il paesaggio all'apertura è muto per
costruzione — non c'è nessun suono in dotazione da percorrere — quindi la prova
sintetizza sei secondi di quattro toni, che sono riconoscibili e permettono di
vedere se la testa si sposta e se l'altezza resta dov'era.

**La prova fissa l'ora e la stagione** (`ORA = 14`, `MESE = 9`). Senza,
misurerebbe cose diverse a seconda di quando la si lancia — il calore, lo
spazio, il colore d'insieme e il respiro dei tessuti dipendono dall'orologio.

Quest'ultima prova verifica anche **sé stessa**: misura lo scatto nelle due
versioni e fallisce se quella per teste NON è ruvida. Una prova che non sa
distinguere il caso giusto da quello sbagliato non sta provando niente.

**Una prova non deve mai confrontare due stati diversi.** Una verifica dei
grani, prima che diventassero un paesaggio, misurava un render e lo confrontava
con un valore letto DOPO: ma durante un render il baricentro cammina e il
modello viene poi rimesso a posto, quindi i due numeri appartenevano a due
momenti diversi e la prova falliva una corsa su tre. Quello che si verifica è la
promessa, non un numero solo.

**Una misura su del rumore va MEDIATA, e il rumore va SEMINATO.** L'energia a
una frequenza sola su del rumore bianco è una variabile aleatoria con la coda
lunga: la verifica dell'accordatura la prendeva tre volte per grado, su una
fetta sola, con un rumore diverso a ogni corsa — e il suo controllo su sé stessa
(che il materiale crudo non mostri preferenze, soglia ±3 dB) è arrivato a
misurare −3,1 e a fallire senza che niente fosse rotto. Quello che la calma non
è guardare più a lungo — una finestra doppia dà una riga più stretta, non una
stima più ferma — ma mediare più stime INDIPENDENTI: adesso sono quattro fette
da un secondo per sette prese, ventotto invece di tre, e il rumore esce da un
seme fisso. Misurato su cinque corse: da −2,3÷+1,1 a −0,9÷+1,2. La soglia non si
è allargata, si è resa vera la misura — allargarla sarebbe stato togliere il
controllo invece di ripararlo.

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

Fatto anche il **paesaggio** (archivio dei materiali, cattura dal microfono,
segmento scelto sull'onda, velo che distende senza trasporre, riverbero proprio)
e il
**registratore**: la presa dal vivo sull'uscita del banco e l'esportazione
fuori tempo reale, tutte e due in wav a 24 bit stereo. **IL MOTORE È
COMPLETO.**

**C'È ANCHE LA TAVOLA, ed è quella del mockup.** Il disegno ha sostituito
l'impalcatura, e l'ha sostituita separandosi da lei: i comandi in `comandi.js`,
il canvas in `tavola.js`. Un foglio che scorre, cinque sezioni numerate fra una
testata e un piede:

- la **testata**: le quattro sorgenti e il cielo come spunte quadrate, la
  pausa, le lingue (una sola, per ora, e le altre lo dicono);
- **01 · 02**, le due classi in cinque colonne — comandi, quadrante, filo,
  quadrante, comandi. Ogni quadrante è un cerchio di Rada Deriva: quattro anelli,
  uno per linea, con la crociera e il mirino al centro e il numerale romano fuori
  dall'anello. Una goccia è una tacca radiale lunga quanto è alta la sua nota, e
  quando suona un filo la lega al mirino — se ne cadono due insieme, su linee
  diverse, un secondo filo unisce anche loro;
  una tenuta è un arco lungo quanto sta in aria, tenue finché è passata, a
  inchiostro pieno mentre suona, in ambra solo l'ultima entrata. Attorno, la corona: tre tracce di
  graduazioni aperte in basso, che mostrano l'efficace mentre i filetti in
  colonna mostrano la mano. Sotto il cerchio due manopole — registro e calore,
  registro e passo — poi una linea, poi la tendina dell'**effetto** con le sue
  tre manopole;
- **03 · banco**: registrazione con cronometro e misuratori a tessere,
  esportazione (wav, la tavola in png, la scena che aspetta un seme),
  equalizzatore a otto aste con la curva vera sopra — chiesta ai filtri con
  `getFrequencyResponse` — e il mixer a cinque aste;
- **04 · paesaggio**: LA MATERIA INTERA distesa per il lungo, come istogramma
  di quadratini in scala di grigi che PARTONO DALLA RIGA DI MEZZO — il primo ci
  sta sopra, non accanto, o resterebbe una riga vuota in mezzo alla fascia che
  si legge come un taglio. Sopra ci stanno le due maniglie del segmento, che
  sono due cursori nativi trasparenti — l'inizio sul bordo di sopra, la fine su
  quello di sotto, uno per lato perché due cursori distesi sullo stesso
  rettangolo se li prenderebbe sempre quello davanti. Fuori dal segmento la
  carta si posa sopra; dentro, la finestra che si sta leggendo è una banda
  chiara che cammina. Sotto, i sei filetti;
- **05 · deriva**: la tonalità, il circolo delle quinte con dove siamo e dove
  andremo, il baricentro su quindici minuti di passato e le sette voci che non
  ci sono ancora;
  In alto a destra, dopo le lingue, il selettore **chiaro/scuro**: due pulsanti
  veri, non due parole, perché si prendono col tasto Tab;
- il **piede**: lo stato, le due influenze esterne, e «a mano», cioè gli ultimi
  tre filetti che qualcuno ha mosso. Una tavola che si muove da sé per tre
  quarti ha bisogno di dire quale quarto è stato deciso.

Sotto i 1180 px le cinque colonne diventano due e i quadranti si impilano; sotto
i 720 una sola. I quadranti non crescono oltre 460 px: un cerchio da mezzo metro
con quattro anelli lontanissimi si legge peggio, non meglio.

Da fare, in ordine:

1. **Rifinire la tavola sul vetro vero.** Il disegno è al primo passaggio
   completo sul mockup e la prova non lo guarda: quello che resta si vede solo
   aprendo `index.html` e stando a guardare per qualche minuto — quanto pesa un
   anello di tessuti a intreccio alto, se il lampo si legge ancora con otto
   linee che scattano insieme, se la fascia del paesaggio regge un'ora di seduta.
   Restano fuori dal mockup, e sono aggiunte consapevoli: le due tendine dei
   **mood**, le quattro righe dei **comandi per linea** e il **microfono**, che
   il disegno non prevedeva e senza i quali mancherebbe metà dello strumento.
2. Le **voci** e il **cielo**: il motore alla *In C* di Nuvole con l'archivio
   delle 53 frasi, e il campo `fBm` che le sveglia. **Rimandati per scelta**:
   l'archivio attraversa tutti e dodici i gradi mentre gocce e tessuti stanno
   su una pentatonica anemitonica, e far entrare le voci vuol dire decidere
   che cosa succede a quella garanzia. È una decisione musicale, non tecnica,
   e non è ancora presa. La tavola le aspetta già in tre punti: la spunta
   «voci» nella testata, l'asta del mixer, e le sette spie in fondo alla
   deriva. Sono spente e lo dicono; il giorno che si accendono non c'è
   impaginazione da rifare.

Aperti: `rendiOffline` percorre lo stesso modello che sta suonando, quindi
esportare mentre si ascolta oggi disturberebbe la sessione in corso — va dato
al render un modello suo. E `deriva.js` sorteggia le fasi al caricamento: per
un'esportazione riproducibile servirà un seme. I **materiali del paesaggio non si
conservano**: un file caricato o una registrazione vivono finché la pagina è
aperta, e salvarli vorrebbe dire IndexedDB, cioè la prima cosa in tutto il
progetto a scrivere sul disco di chi ascolta — da decidere se si vuole.
