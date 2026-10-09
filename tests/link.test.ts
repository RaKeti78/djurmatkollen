import { describe, expect, it } from "vitest";
import { cleanUrl, hasTrackingParams } from "../src/link.js";
import { loadTestFoods } from "../src/testdata.js";

// Länkar som Keti klistrade in, med klick-id:n utbytta mot EXEMPEL.
// Andra värdet är länken som sparats i testdatan, alltså facit.
const pasted: [string, string][] = [
  [
    "https://essentialfoods.se/products/superior-living-10kg-uk?variant=46804863844590&utm_source=google&utm_medium=organic&utm_campaign=Google_Swedish_Language_SEK&utm_content=OUR%20FINEST%20SUPERIOR%20LIVING%2C%2010KG&gad_source=1&gad_campaignid=22184308497&gbraid=EXEMPEL&gclid=EXEMPEL",
    "https://essentialfoods.se/products/superior-living-10kg-uk?variant=46804863844590",
  ],
  [
    "https://www.granngarden.se/farskfoder-mush-vaisto-cat-gul-kycklingnot-800g?utm_source=google&utm_medium=cpc&utm_campaign=shop_lia&utm_id=23779796794&utm_term=&utm_content=807408141481&utm_source_platform=Google+Ads&pu=EXEMPEL&gad_source=1&gad_campaignid=23779796794&gbraid=EXEMPEL&gclid=EXEMPEL",
    "https://www.granngarden.se/farskfoder-mush-vaisto-cat-gul-kycklingnot-800g",
  ],
  [
    "https://www.granngarden.se/farskfoder-mush-vaisto-gron-notgriskyckling-3kg?utm_source=google&utm_medium=cpc&utm_campaign=shop_lia&utm_id=23779796794&utm_term=&utm_content=807408141481&utm_source_platform=Google+Ads&pu=EXEMPEL&gad_source=1&gad_campaignid=23779796794&gbraid=EXEMPEL&gclid=EXEMPEL",
    "https://www.granngarden.se/farskfoder-mush-vaisto-gron-notgriskyckling-3kg",
  ],
  [
    "https://www.vetzoo.se/produkt/royal-canin-medium-adult-torrfoder-till-hund-P001398?pid=207778&utm_source=google&utm_medium=cpc&utm_campaign=AR-SE%3A%20Standard%20Shopping%20-%20REA&utm_id=23347144313&gad_source=1&gad_campaignid=23347144313&gbraid=EXEMPEL&gclid=EXEMPEL",
    "https://www.vetzoo.se/produkt/royal-canin-medium-adult-torrfoder-till-hund-P001398?pid=207778",
  ],
  [
    "https://www.zoo.se/hund/produkter/pondus-original?p=300000518&utm_source=google&utm_medium=cpc&utm_campaign=%7Bcampaignname%7D&gad_source=1&gad_campaignid=23568799193&gbraid=EXEMPEL&gclid=EXEMPEL",
    "https://www.zoo.se/hund/produkter/pondus-original?p=300000518",
  ],
];

describe("länkrensning (K1.2)", () => {
  it.each(pasted)("rensar %s", (input, expected) => {
    expect(cleanUrl(input)).toBe(expected);
  });

  it("rensar länkar där & har kopierats som &amp;", () => {
    expect(cleanUrl("https://www.zoo.se/hund/produkter/pondus-original?p=300000518&amp;utm_source=google")).toBe(
      "https://www.zoo.se/hund/produkter/pondus-original?p=300000518",
    );
  });

  it("behåller parametrar som väljer produkt eller storlek", () => {
    expect(cleanUrl("https://butik.se/foder?variant=12&size=4kg&fbclid=x")).toBe(
      "https://butik.se/foder?variant=12&size=4kg",
    );
  });

  it("tar bort #-delen, mellanslag runt länken och byter http mot https", () => {
    expect(cleanUrl("  http://butik.se/foder#recensioner \n")).toBe("https://butik.se/foder");
  });

  it("lämnar redan rena länkar orörda", () => {
    for (const food of loadTestFoods()) expect(cleanUrl(food.source)).toBe(food.source);
  });

  it.each(["Royal Canin Medium Adult", "", "ftp://butik.se/foder"])("avvisar %j", (input) => {
    expect(() => cleanUrl(input)).toThrow(/webblänk|https/);
  });

  it("känner igen spårningsparametrar oavsett stora eller små bokstäver", () => {
    expect(hasTrackingParams("https://butik.se/foder?UTM_Source=x")).toBe(true);
    expect(hasTrackingParams("https://butik.se/foder?pid=1")).toBe(false);
  });
});
