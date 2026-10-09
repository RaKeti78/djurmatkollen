// Rensar en inklistrad produktlänk innan sidan hämtas (K1.2).

// Parametrar som bara talar om var klicket kom ifrån. Allt annat behålls,
// eftersom butikerna ibland väljer storlek eller variant med en parameter
// (till exempel ?variant= eller ?pid=).
const TRACKING = [
  /^utm_/,
  /^gad_/,
  /^gclid$/,
  /^gclsrc$/,
  /^gbraid$/,
  /^wbraid$/,
  /^dclid$/,
  /^fbclid$/,
  /^msclkid$/,
  /^ttclid$/,
  /^srsltid$/,
  /^mc_cid$/,
  /^mc_eid$/,
  /^_ga$/,
  /^_gl$/,
  /^pu$/,
];

export function isTrackingParam(name: string): boolean {
  const key = name.toLowerCase();
  return TRACKING.some((re) => re.test(key));
}

// Ger en https-länk utan spårningsparametrar och utan #-del.
// Kastar ett fel på vanlig svenska när texten inte är en webblänk.
export function cleanUrl(input: string): string {
  // Länkar som kopieras från en webbsida kan ha &amp; i stället för &.
  const text = input.trim().replaceAll("&amp;", "&");

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`Det här ser inte ut som en webblänk: ${text}`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`Länken måste börja med https:// eller http://: ${text}`);
  }

  url.protocol = "https:";
  url.hash = "";
  for (const name of [...url.searchParams.keys()]) {
    if (isTrackingParam(name)) url.searchParams.delete(name);
  }
  return url.toString();
}

// Sant när länken har någon spårningsparameter kvar.
export function hasTrackingParams(link: string): boolean {
  try {
    return [...new URL(link).searchParams.keys()].some(isTrackingParam);
  } catch {
    return false;
  }
}
