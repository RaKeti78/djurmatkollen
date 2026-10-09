# DjurMatKollen – Spec

Ögonblicksbild 2026-10-08. Originalet, där ändringar görs först, är [specdokumentet](https://claude.ai/code/artifact/3b5b804b-773e-40f6-a3a9-d8e509955f28). Den här filen uppdateras när specen ändras.

## Om specen

DjurMatKollen är en webbsida där man klistrar in länken till ett hund- eller kattfoder i en nätbutik och får innehåll, näring och varningar förklarade på vanlig svenska, med diagram.

Arbetet följer spec driven development i fyra led: **krav** (vad den ska göra) → **design** (hur den byggs) → **uppgifter** (små steg att bocka av) → **kod**. Ingen kod skrivs förrän krav och design är godkända. Varje uppgift pekar på de krav den uppfyller, och varje krav har acceptanskriterier som går att testa mot exempelfodren i `testdata/foods/`.

### Versioner

| Version | För vem | Omfattning | Hur det körs |
| --- | --- | --- | --- |
| 1 | Bara Keti | Torr- och våtfoder för hund och katt | Keti klistrar in länken i projektet. Claude hämtar sidan och läser ut den, och regelmotorn och diagrammen från repot körs. Ingen API-nyckel och ingen publicering behövs. |
| 2 | Alla på nätet | + konserverat foder, + ras, ålder och vikt | Egen webbsida med backend och Claude API-nyckel, publicerad på Vercel. |
| 3 | Alla på nätet | + kombinerade måltider: torr- och våtfoder i gram per måltid, bedömda mot djurets behov | Samma webbsida som version 2. |

## Krav

Åtta krav, skrivna som användarberättelser med acceptanskriterier ("NÄR … SKA systemet …").

**K1 Klistra in länk.** Som djurägare vill jag klistra in en produktlänk så att jag slipper skriva av etiketten.

1. NÄR en giltig länk klistras in SKA systemet hämta sidan och visa resultatet utan fler steg.
2. NÄR länken har spårningsparametrar (utm_, gclid m.fl.) SKA de tas bort innan sidan hämtas.
3. NÄR sidan inte går att hämta eller saknar foderinformation SKA systemet säga det tydligt och erbjuda att klistra in etiketttexten i stället.
4. NÄR fodret inte är torr-, våt- eller färsk-/fryst foder för hund eller katt SKA systemet säga att det inte stöds än. Konserverat foder kommer i version 2.

**K2 Se upp med (varningar).** Som djurägare vill jag se dåliga eller tveksamma ingredienser först.

1. Varningarna SKA visas överst, före allt annat.
2. Varje varning SKA ha nivå (röd, orange, gul), vad det gäller och en mening om varför.
3. NÄR inget hittas SKA det stå "Inget att anmärka".
4. Reglerna SKA följa listan i Design (D4).

**K3 Vad den består av.** Som djurägare vill jag förstå ingredienserna.

1. Ingredienserna SKA förklaras på vanlig svenska och grupperas (animaliskt, spannmål, övriga kolhydrater, fetter, tillsatser).
2. NÄR tillverkaren anger procent per ingrediens SKA de visas i ett stapeldiagram.
3. NÄR procent saknas SKA det stå att diagrammet inte kan ritas.

**K4 Näring.** Som djurägare vill jag se proportionerna i fodret.

1. Protein, fett, fibrer, aska, vatten och kolhydrater SKA visas i en stapel som summerar till 100 %.
2. Uppskattade värden (kolhydrater, vatten när det saknas) SKA märkas som uppskattade.
3. Varje värde SKA ha en kort kommentar (lågt, normalt, högt). NÄR fodret är våtfoder SKA värdena också visas omräknade till torrfoderbasis (D3), så att de går att jämföra med torrfoder.

**K5 Passar bäst för.** Systemet SKA ge en mening om vilken typ av hund eller katt fodret passar och inte passar.

**K6 Jämförelse.** NÄR två eller fler foder har analyserats SKA de kunna jämföras i en tabell och i näringsdiagrammet, sida vid sida.

**K7 Tillförlitlighet.** Systemet SKA bara visa siffror som står på sidan eller som räknats fram ur dem, aldrig gissade värden som om de vore fakta, och länka till källsidan. NÄR sidan visar två olika värden för samma sak SKA värdet i analystabellen användas och skillnaden visas som en gul varning.

**K8 Kombinerade måltider (version 3).** Som djurägare som blandar torr- och våtfoder vill jag ange hur många gram av varje jag ger per måltid, så att jag ser om kombinationen är bra för mitt djur.

1. NÄR ras, ålder och vikt är angivna (U12) SKA man kunna välja två eller fler analyserade foder och ange gram per måltid för varje, samt antal måltider per dag.
2. Systemet SKA visa dagens totala energi jämfört med djurets energibehov.
3. Systemet SKA visa protein, fett, kolhydrater och fibrer för hela kombinationen och jämföra protein och fett med minimikraven.
4. Systemet SKA ge ett samlat omdöme (bra, se över eller inte bra) med en mening om varför, till exempel "ca 20 % mer energi än behovet, risk för viktuppgång".
5. NÄR något foder är märkt som kompletteringsfoder SKA systemet säga att det inte räcker som ensam mat.

## Design

En webbsida med en liten backend: AI läser butikssidan, men alla beräkningar och varningsregler görs i vanlig kod så att samma foder alltid får samma resultat.

### D1 Arkitektur

```
Webbsida ──länk──▶ Backend ──text──▶ Utläsning med AI ──data──▶ Regelmotor
    ▲                                                              │
    └──────────────── resultat, varningar och diagram ─────────────┘
```

- **Webbsida:** inmatningsfält, resultatvy och diagram.
- **Backend-funktion:** behövs eftersom en webbläsare inte får hämta andra butikers sidor direkt. Den rensar länken (K1.2), hämtar sidan och plockar ut texten.
- **Utläsning med AI (Claude API):** gör om sidans text till datamodellen i D2. Butikerna presenterar innehållet på olika sätt, så fasta regler för varje butik skulle bli sköra.
- **Regelmotor (kod):** räknar fram kolhydrater, sätter varningar enligt D4 och ger kommentarer om näringsnivåerna.

I version 1 gör Claude i projektet det som Backend och Utläsning med AI gör i bilden. Regelmotorn och diagrammen är samma kod i alla versioner.

### D2 Datamodell (per foder)

| Fält | Innehåll | Exempel |
| --- | --- | --- |
| namn, märke, källa | Produktnamn och länk | Royal Canin Medium Adult |
| djurslag, fodertyp | Hund eller katt; torr, våt eller färsk/fryst | Hund, torrfoder |
| målgrupp | Ålder, storlek, aktivitet | Vuxen, 11–25 kg |
| ingredienser | Lista i sidans ordning med namn, procent (eller tomt), grupp | Vattenbuffel, 30 %, animaliskt |
| analys | Protein, fett, fibrer, aska, vatten, kalcium, fosfor i % | 25 / 14 / 1,6 / 6,2 / – |
| tillsatser | Namn och mängd per kg | Taurin 1 500 mg |
| påståenden | Tillverkarens påståenden ordagrant | "Över 80 % kött" |
| pris | kr och vikt, om det finns | 599 kr / 4 kg |

### D3 Beräkningar

- Kolhydrater = 100 − protein − fett − fibrer − aska − vatten.
- När vatten saknas används 9 % för torrfoder och 78 % för våtfoder, märkt som uppskattat (K4.2). Torrfoderbasis = värde × 90 / (100 − vatten), det vill säga som om fodret hade 10 % vatten. Varningsgränserna i D4 jämförs alltid mot torrfoderbasis.
- Kilopris = pris / vikt.
- Summan av angivna animaliska procent jämförs med tillverkarens påstående och flaggas om de skiljer mer än 5 procentenheter.

### D4 Varningsregler

| Nivå | Hund och katt | Bara hund | Bara katt |
| --- | --- | --- | --- |
| Röd | Socker eller sirap, konstgjorda färgämnen, BHA, BHT, etoxikin, propylenglykol | – | Taurin saknas i värmebehandlat foder |
| Orange | Djurkälla som inte anges ("animaliska biprodukter", "djurfetter"), konserveringsmedel eller antioxidanter som inte anges, spannmål uppdelad på 3 eller fler namn, baljväxter i spannmålsfritt foder utan angiven mängd | Fett över 18 %, protein under 18 % | Fett över 22 %, protein under 26 %, kolhydrater över 35 % |
| Gul | Påstående som inte stämmer med siffrorna (D3), "nyttiga" tillsatser under 0,1 %, procent saknas för någon av de fem första ingredienserna, två olika värden för samma sak på sidan (K7), råfoder (hygienråd: rått kött kan bära salmonella) | | Råfoder utan angiven taurinhalt (hjärta ger naturligt taurin, men mängden är okänd) |

### D5 Diagram

- **Näring:** en liggande stapel per foder som summerar till 100 %, sex färger, med uppskattade värden märkta. Flera foder visas under varandra (K6).
- **Ingredienser:** liggande staplar med procent, färgade efter animaliskt eller vegetabiliskt.
- Båda diagrammen visar exakta värden när man håller muspekaren över dem, och kan visas som tabell.

### D6 Felhantering

- Sidan svarar inte eller blockerar hämtning: visa ett meddelande och ett fält där etiketttexten kan klistras in (K1.3).
- Analysvärden saknas: visa det som saknas och hoppa över de beräkningar som behöver dem.

### D7 Kombinerade måltider (version 3)

- **Energibehov per dag:** grundbehov = 70 × vikt^0,75 kcal, gånger en faktor för ålder och aktivitet. Hund: kastrerad vuxen 1,6, okastrerad vuxen 1,8, valp 2–3, senior 1,4. Katt: kastrerad 1,2, okastrerad 1,4.
- **Energi i fodret:** tillverkarens kcal/kg när den finns, annars 3,5 × protein + 8,5 × fett + 3,5 × kolhydrater (kcal per 100 g), märkt som uppskattad.
- **Kombinationen:** gram per dag för varje foder = gram per måltid × antal måltider. Totalt protein, fett, kolhydrater och fibrer i gram räknas fram ur varje foders analys.
- **Jämförelse med minimikrav:** protein och fett i gram per 1 000 kcal, mot FEDIAF:s riktvärden för vuxna djur (ungefär hund 45 g protein och 13,75 g fett, katt 62,5 g protein och 22,5 g fett). Exakta värden kontrolleras mot FEDIAF:s tabell i U14.
- **Omdöme:** energi inom ±10 % av behovet och protein och fett över minimum ger "bra". 10–20 % fel energi ger "se över". Mer än 20 % fel energi, eller protein eller fett under minimum, ger "inte bra".
- **Diagram:** en stapel för dagens energi mot behovet, uppdelad på hur mycket varje foder bidrar, och näringsstapeln från D5 för hela kombinationen.

## Uppgifter

Sju uppgifter för version 1, fem för version 2 och tre för version 3. Varje uppgift är klar när dess tester går igenom med exempelfodren.

**Version 1**

- [x] **U1 Projektet.** Repot med specen som fil, testuppsättning och exempelfodren som testdata (fem hundfoder varav två färsk-/frysta, fem kattfoder varav två färsk-/frysta). (alla)
- [ ] **U2 Datamodell.** Definiera datamodellen i kod med validering. (D2)
- [ ] **U3 Utläsning i projektet.** En fast instruktion för hur Claude hämtar sidan, rensar länken och fyller datamodellen. Värdena i testdata är facit. (K1, K7)
- [ ] **U4 Beräkningar.** Kolhydrater, torrfoderbasis, kilopris och kontroll av köttpåståenden. (K4, D3)
- [ ] **U5 Varningsregler.** Regelmotorn med ett test per regel och djurslag. Facit finns i `expected` i varje testdatafil. (K2, D4)
- [ ] **U6 Resultatvy och diagram.** Sektionerna i ordningen Se upp med, Vad den består av, Näring, Passar bäst för, med närings- och ingrediensdiagram. (K2–K5, D5)
- [ ] **U7 Jämförelse.** Visa flera foder sida vid sida. (K6)

**Version 2**

- [ ] **U8 Backend.** Funktion som rensar länken och hämtar sidan. (K1, D6)
- [ ] **U9 Utläsning med API.** Samma instruktion som U3, men via Claude API-nyckel. (D1)
- [ ] **U10 Publicering.** Lägg ut webbsidan på Vercel och testa med fem nya länkar från olika butiker.
- [ ] **U11 Konserverat foder.** Stöd för konserver med samma beräkning på torrfoderbasis som våtfoder.
- [ ] **U12 Ras, ålder och vikt.** Använd djurets uppgifter för en bättre rekommendation under Passar bäst för.

**Version 3**

- [ ] **U13 Måltidsinmatning.** Välj foder, ange gram per måltid och antal måltider per dag. (K8.1)
- [ ] **U14 Energi och näring.** Beräkna energibehov, energi i kombinationen och näring per 1 000 kcal, och kontrollera riktvärdena mot FEDIAF. (K8.2–K8.3, D7)
- [ ] **U15 Omdöme och diagram.** Visa omdömet med motivering och energistapeln. Testa med Royal Canin Medium Adult och ett våtfoder för en kastrerad hund på 20 kg. (K8.4–K8.5, D7)

## Beslut

- Nytt repo `djurmatkollen` på RaKeti78.
- Version 1 körs bara av Keti, utan egen API-nyckel och utan publicering.
- Version 1: torr- och våtfoder för hund och katt. Version 2: konserverat foder, ras, ålder och vikt, publicering. Version 3: kombinerade måltider.
