# DjurMatKollen

Klistra in länken till ett hund- eller kattfoder och få veta vad det innehåller: ingredienser på vanlig svenska, näring i diagram och varningar för sådant man bör se upp med.

Projektet byggs med spec driven development. Allt börjar i [docs/spec.md](docs/spec.md): krav (K1–K8), design (D1–D7) och uppgifter (U1–U15). Varje ändring i koden ska gå att koppla till ett krav.

## Struktur

| Mapp | Innehåll |
| --- | --- |
| `docs/` | Specen |
| `src/` | Datamodell, beräkningar, varningsregler och diagram |
| `tests/` | Tester mot exempelfodren |
| `testdata/foods/` | Exempelfoder för hund och katt med facit för varningarna |

## Kom igång

```sh
npm install
npm test
```

## Status

Version 1: U1 (projektgrund) och U2 (datamodell) klara. Nästa steg är U3 (utläsning).
