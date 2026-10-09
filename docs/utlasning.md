# Utläsning av en produktsida (U3)

Fast instruktion för hur Claude i projektet gör om en inklistrad produktlänk till ett foder i datamodellen (D2, `src/model.ts`). Instruktionen gäller version 1. I version 2 gör backend och Claude API samma sak (D1), med samma regler.

Målet är att två utläsningar av samma sida alltid ger samma data. Exempelfodren i `testdata/foods/` är facit: följer man stegen nedan på deras sidor ska man få samma värden.

## Steg

1. **Rensa länken (K1.2).** Kör `npm run rensa -- "<länk>"`. Den tar bort spårningsparametrar som `utm_`, `gclid`, `gbraid`, `gad_` och `pu`, tar bort `#`-delen och byter `http` mot `https`. Parametrar som väljer produkt eller storlek (`variant`, `pid`, `p`) behålls. Den rensade länken är den som hämtas och sparas.
2. **Hämta sidan.** Använd WebFetch på den rensade länken. Läs produktbeskrivning, ingrediensförteckning (sammansättning), analytiska beståndsdelar, tillsatser, utfodringsråd och pris. Ofta ligger de under flikar som "Innehåll", "Näringsvärde" eller "Sammansättning". Om sidan inte går att hämta från containern med `curl` (butikernas spärrar), använd WebFetch.
3. **Om sidan inte går att läsa (K1.3, D6).** Svarar sidan inte, blockeras hämtningen eller saknas ingredienser och analys: säg det tydligt och be Keti klistra in etiketttexten. Fortsätt sedan från steg 5 med den texten. Gissa aldrig värden.
4. **Kontrollera att fodret stöds (K1.4).** Version 1 stöder torrfoder, våtfoder och färsk- eller frystfoder för hund och katt. Är det konserverat foder, godis, tuggben eller foder för andra djur: säg att det inte stöds än och avsluta. Konserverat foder kommer i version 2.
5. **Fyll i datamodellen** enligt fältreglerna nedan och spara som JSON i `/mnt/project-files/djurmatkollen/foder/<djurslag>-<märke>-<produkt>.json`, med små bokstäver och bindestreck.
6. **Kontrollera filen.** Kör `npm run kontrollera -- <fil>`. Den säger vad som är fel om filen inte följer datamodellen. Om samma länk finns i testdatan jämför den också med facit och visar alla skillnader. Skillnader i fritext (`name`, `targetGroup`, `claims`, `ingredientNotes`) visas för granskning men räknas inte som fel, eftersom de inte används av beräkningar eller varningsregler. Rätta och kör igen tills filen följer datamodellen. Om den skiljer sig från facit: läs sidan igen och avgör vilken som har fel. Är det facit, rätta testdatan och säg det.

## Fältregler

Grundregel (K7): skriv bara det som står på sidan. Det som inte står där är `null`, aldrig en gissning eller ett typvärde. Siffror skrivs med punkt som decimaltecken (`2.4`, inte `2,4`).

WebFetch sammanfattar sidan med en mellanmodell. Be den därför uttryckligen citera ingrediensförteckningen, analystabellen och tillsatserna ordagrant, på sidans språk. Den citerar bara korta stycken åt gången, så be om en del i taget (till exempel de första tio ingredienserna, sedan resten) tills hela förteckningen är citerad. Siffror och ingrediensnamn tas bara från citat, aldrig från sammanfattningen.

| Fält | Regel |
| --- | --- |
| `name` | Märket följt av produktnamnet, utan förpackningsstorlek, till exempel "Oliver's Signature Riverside Feast Medium". Rubriker i versaler skrivs med vanliga bokstäver. Fritext. |
| `brand` | Märket som tillverkaren själv skriver det, med apostrof och stora bokstäver, till exempel "Oliver's" eller "Royal Canin". |
| `source` | Den rensade länken från steg 1. |
| `fetchedAt` | Dagens datum, `ÅÅÅÅ-MM-DD`. |
| `species` | `hund` eller `katt`: det djur fodret i första hand är gjort för. Gäller det båda lika mycket, det som nämns först på sidan. |
| `alsoFor` | Bara när sidan säger att fodret passar även det andra djurslaget, till exempel `["katt"]`. Annars utelämnas fältet. |
| `foodType` | `torr` för torrfoder, `vat` för våtfoder i påse eller tråg, `farsk` för färsk- eller frystfoder och råfoder. |
| `complementary` | `true` när sidan kallar fodret kompletteringsfoder eller säger att det inte räcker som ensam mat. Annars `false`. |
| `targetGroup` | Ålder, storlek, aktivitet eller annat sidan anger, som en kort fras på svenska, till exempel "Vuxna hundar, aktiva". Fritext. |
| `ingredients` | En rad per ingrediens, i samma ordning som i ingrediensförteckningen. Se ingrediensreglerna nedan. |
| `ingredientNotes` | Upplysningar om ingrediensernas mängd som inte får plats i listan, till exempel "Ben 6 % och lever 6 % ingår i köttandelarna ovan." Annars utelämnas fältet. Fritext. |
| `analysis` | Analytiska beståndsdelar i procent, se analysreglerna nedan. |
| `analysisExtras` | Alla övriga värden i analystabellen i procent, till exempel `{ "omega-3": 1.2, "magnesium": 0.09 }`. Namnen skrivs på svenska med små bokstäver. Utelämnas när det inte finns några. |
| `energyKcalPerKg` | Energi i kcal per kg när sidan anger den, var som helst på sidan. Står den per 100 g, gånger 10. Står den bara i kJ, dela med 4,184. Avrunda till heltal sist. Annars `null`. |
| `additives` | Tillsatser (vitaminer, mineraler, aminosyror, konserveringsmedel, antioxidanter), se tillsatsreglerna nedan. Tom lista när sidan inte anger några. |
| `claims` | Tillverkarens viktigaste påståenden, kortade till en fras var, till exempel "Mer än 80 % animaliska råvaror", "Spannmålsfri" eller "Kompletteringsfoder". Ta med påståenden om andel kött, spannmål, protein, fett, tillagning, helfoder eller kompletteringsfoder, hälsa och hur fodret ska ges, högst sex stycken. Korta genom att stryka ord, aldrig genom att lägga till egna. Fritext. |
| `claimedAnimalPercent` | När ett påstående anger hur stor del som är kött eller animaliskt, det talet (vid "över 80 %" blir det 80). Annars utelämnas fältet. |
| `conflictingValues` | Två olika värden för samma sak på sidan (K7), se nedan. Tom lista när allt stämmer överens. |
| `price` | `{ "sek": pris, "kg": vikt }` för den förpackning länken pekar på, eller den som är förvald på sidan. Ordinarie pris, inte prenumerations- eller medlemspris. Visas ett pris men säljs fodret bara i butik, används det priset. Vikt i gram räknas om till kg, och "3 x 200 g" blir 0.6. `null` när priset saknas. |

### Ingredienser

- En rad per ingrediens som står i förteckningen. Det som står inom parentes efter en ingrediens hör till den raden, som "Nöt (kött, hjärta, lunga)". Uppräkningar utan parentes som "broccoli, gurkmeja, morot" blir en rad per ord, och "kycklingkött, -brosk och -ben" blir tre rader. Undantaget är när sidan anger andelar för grupper av ingredienser, som "kött 70 %, ben 30 %": då blir varje grupp en rad med gruppens andel och namnen ihopskrivna, till exempel "Kycklingkött och brosk" (70) och "Kycklingben" (30).
- `name`: på svenska, med sidans egna ord och böjning, och med tillägg inom parentes som de står, till exempel "Vattenbuffel (färsk)" eller "Cikoria (källa till FOS)". Procenten tas bort ur namnet. Står namnet på ett annat språk, översätt ordagrant.
- `percent`: andelen när sidan anger den, i förteckningen eller någon annanstans på sidan, annars `null`. Står det "minst 26 %" blir det 26. Delandelar inom parentes, som "kyckling 40 % (varav lever 5 %)", blir en rad för kycklingen och en mening i `ingredientNotes`.
- `group`, en av:
  - `animaliskt`: kött, fisk, organ, ben, ägg, mjölk och animaliska proteiner.
  - `spannmal`: vete, majs, korn, ris, havre, råg och mjöl, gluten eller kli av dem.
  - `baljvaxt`: ärtor, linser, kikärtor, bönor, soja och protein eller fibrer av dem.
  - `kolhydrat`: andra stärkelsekällor, som potatis, sötpotatis, tapioka och kassava.
  - `fett`: oljor och fetter, både animaliska (kycklingfett, svålfett, fiskolja) och vegetabiliska.
  - `tillsats`: vitaminer, mineraler, aminosyror och tillskott som glukosamin, kondroitin och MSM.
  - `ovrigt`: allt annat, till exempel betmassa, jäst, grönsaker (även pumpa och morot), frukt, bär, örter, tång och prebiotika (cikoria, MOS, FOS).
- Stryk inte ingredienser och slå inte ihop dem. "Vete, vetemjöl, vetegluten" är tre rader.

### Analys

- `protein`, `fat`, `ash`: råprotein, råfett (fetthalt) och råaska. Aska kallas också oorganiska ämnen eller mineraler i analysen. Krävs.
- `fibre`: råcellulosa eller växttråd, `null` när den saknas.
- `moisture`: vattenhalt, `null` när den saknas. Fyll inte i ett typvärde, beräkningarna gör det och märker det som uppskattat (D3).
- `carbohydrates`: när sidan själv anger kolhydrater eller NFE, det värdet. Annars utelämnas fältet, eftersom beräkningarna räknar fram det (U4).
- `calcium`, `phosphorus`: i procent, `null` när de saknas. Står de i mg/kg, dela med 10 000.
- Står samma värde på flera ställen på sidan, använd värdet i analystabellen (K7).

### Tillsatser

- En rad per tillsats med `name`, `amount` och `unit`, till exempel `{ "name": "Vitamin D3", "amount": 1000, "unit": "IE/kg" }`.
- `name` är bara ämnet på svenska ("Vitamin A", "Koppar", "Jod", "Taurin", "Rosmarinextrakt"). Den kemiska formen, som "koppar(II)sulfat, pentahydrat" eller "tokoferol", tas inte med. Vad ämnet används till, som "konservering", skrivs i `note`.
- `unit` skrivs som på sidan men med svenska förkortningar (IU blir IE). Räkna inte om mängden. Står det per 100 g, skriv `"mg/100 g"`. Står det ingen bas alls, som "10000 IE", gäller kilo, eftersom tillsatser anges per kg foder på etiketter, och då skrivs `"IE/kg"`.
- Står bara en grupp utan mängd, som "Konserveringsmedel" eller "Antioxidanter", blir det `"amount": null, "unit": null`. Det är så regelmotorn ser att de inte anges (D4).
- När en mängd är otydlig, till exempel en procentsats som inte kan stämma, blir `amount` och `unit` `null` och det som står på sidan skrivs i `note`.

### Två olika värden (K7)

När sidan visar olika värden för samma sak, till exempel en analystabell och en produkttext, används analystabellens värde i `analysis`. Alla värden som förekommer skrivs i `conflictingValues`, med analystabellens först:

```json
{ "field": "ash", "values": [8.1, 8.5] }
```

`field` är fältets namn i datamodellen (`protein`, `fat`, `ash` och så vidare) eller ett kort ord för annat, som `size` för förpackningsstorlek. Uppenbara enhetsfel, som 0,16 i stället för 16,4 %, räknas också.

## Exempel

Ett komplett exempel är [katt-royal-canin-sterilised-37.json](../testdata/foods/katt-royal-canin-sterilised-37.json), som har motstridiga värden. Övriga facit finns i samma mapp.
