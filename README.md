# DjurMatKollen

Klistra in länken till ett hund- eller kattfoder och få veta vad det innehåller: ingredienser på vanlig svenska, näring i diagram och varningar för sådant man bör se upp med.

Projektet byggs med spec driven development. Allt börjar i [docs/spec.md](docs/spec.md): krav (K1–K8), design (D1–D7) och uppgifter (U1–U15). Varje ändring i koden ska gå att koppla till ett krav.

## Struktur

| Mapp | Innehåll |
| --- | --- |
| `docs/` | Specen |
| `src/` | Datamodell, beräkningar, varningsregler och diagram |
| `tests/` | Tester mot exempelfodren |
| `testdata/foods/` | Sex exempelfoder (tre hund, tre katt) med facit för varningarna |

## Kom igång

```sh
npm install
npm test
```

## Status

Version 1, uppgift U1 klar. Nästa steg är U2 (datamodellen).
