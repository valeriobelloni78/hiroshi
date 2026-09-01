# Passare a Claude Code

Il motore è completo. Da qui in avanti conviene lavorare in locale, dove il
codice sta già, dove c'è git e dove `prova.mjs` gira sul posto invece che a
tremila chilometri.

## Una volta sola

```bash
cd ~/Documents/hiroshi
git init
git add -A
git commit -m "Il motore completo: linee, timbri, tessuti, grani, banco, registratore"
```

La prova ha bisogno di un browser vero, che non è nel repo:

```bash
npm init -y            # solo per avere un package.json dove appendere le dipendenze
npm i -D playwright
npx playwright install chromium
node prova.mjs
```

Quel `node_modules` non va in git — l'app non ne dipende, ci dipende solo la
prova:

```bash
printf 'node_modules/\n.DS_Store\n' > .gitignore
```

Poi, quando lo si vuole pubblicare: un repo su GitHub, `git push`, e nelle
impostazioni **Pages → deploy from branch → main / root**. Non c'è niente da
compilare, quindi la pagina è già il sito.

## Che cosa aspettarsi

Aprendo Claude Code dentro `~/Documents/hiroshi` il file `CLAUDE.md` viene
letto da solo: dentro ci sono le regole del progetto, tutte le insidie già
pagate coi numeri misurati, le convenzioni e la procedura di verifica. Non
serve rispiegare niente.

## Che cosa resta da fare

1. **La tavola** — il disegno vero, che sostituisce l'impalcatura di
   `tavola.js`. È il pezzo più grosso: un canvas che dovrà mostrare i due
   cerchi con le corone, il banco, la fascia dei grani e la deriva. Va fatto in
   locale, perché sono decine di iterazioni con uno screenshot in mezzo a
   ciascuna.
2. **Le voci e il cielo** — il motore alla *In C* di Nuvole. Aspettano una
   decisione musicale, non tecnica: l'archivio delle 53 frasi attraversa tutti
   e dodici i gradi, mentre gocce e tessuti stanno su una pentatonica dove
   nulla può stonare. Le tre strade stanno in fondo a `CLAUDE.md`.

## I due punti ancora aperti nel motore

- I **materiali dei grani non si conservano**: un file caricato o una
  registrazione vivono finché la pagina è aperta. Salvarli vorrebbe dire
  IndexedDB, cioè la prima cosa in tutto il progetto a scrivere sul disco di
  chi ascolta. Da decidere se si vuole.
- `deriva.js` **sorteggia le fasi al caricamento**: due esportazioni fatte in
  due sessioni diverse non danno lo stesso file. Per una riproducibilità vera
  servirà un seme, come `?cielo=42` in Nuvole.
