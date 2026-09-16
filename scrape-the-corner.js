const { merchantKey, enrichCatalog } = require("./match-offer");

const PARRAINEO_URL = "https://www.parraineo.com/blog/the-corner-boursorama-liste";
const DETECTIVE_URL =
  "https://www.detective-banque.fr/banque/boursorama-banque/the-corner-boursorama-liste/";
const OFFICIAL_URL = "https://www.boursobank.com/bon-plan/the-corner";
const OFFICIAL_PORTAL = "https://www.boursobank.com/bon-plan/the-corner";
const MIN_OFFERS = 80;
const OFFICIAL_TEASERS = ["Carrefour", "Alpiq", "Auchan", "Samsung", "IKEA"];

function officialOffer(partial) {
  return {
    merchant: String(partial.merchant || "").trim(),
    discount: String(partial.discount || "The Corner").trim() || "The Corner",
    offerType: String(partial.offerType || "Avantage The Corner").trim(),
    link: OFFICIAL_PORTAL,
    source: "boursobank",
    sources: Array.isArray(partial.sources) ? partial.sources.slice() : [],
  };
}

function splitMerchantList(text) {
  return String(text || "")
    .split(/[,;]/)
    .map((part) => part.replace(/\s+/g, " ").trim().replace(/[.:;!?]+$/g, ""))
    .filter((part) => part.length > 1 && !/^liste des/i.test(part));
}

function isPlausibleMerchant(name) {
  const value = String(name || "").trim();
  if (value.length < 2 || value.length > 60) return false;
  if (/[{};:=<>%]|px\b|min-width|!important|calc\(/i.test(value)) return false;
  if (/^-?\d/.test(value)) return false;
  if (!/[a-zA-Zàâäéèêëïîôùûüç]/i.test(value)) return false;
  return true;
}

function parseParraineoHtml(html) {
  const { JSDOM } = require("jsdom");
  const document = new JSDOM(html).window.document;
  const offers = [];
  document.querySelectorAll("table").forEach((table) => {
    table.querySelectorAll("tr").forEach((row, rowIndex) => {
      if (rowIndex === 0) return;
      const cells = row.querySelectorAll("td");
      if (cells.length < 3) return;
      const merchant = cells[0].textContent.trim();
      const discount = cells[1].textContent.trim();
      const offerType = cells[2].textContent.trim();
      if (!isPlausibleMerchant(merchant) || merchant === "Enseigne") return;
      offers.push(
        officialOffer({
          merchant,
          discount,
          offerType,
          sources: ["parraineo"],
        })
      );
    });
  });
  return offers;
}

function parseParraineoLists(html) {
  const { JSDOM } = require("jsdom");
  const document = new JSDOM(html).window.document;
  const names = new Set();
  document.querySelectorAll("p, li").forEach((el) => {
    const text = el.textContent || "";
    if (!/enseigne/i.test(text) || !text.includes(":")) return;
    const afterColon = text.split(":").slice(1).join(":");
    if (!afterColon.includes(",")) return;
    splitMerchantList(afterColon).forEach((name) => {
      if (isPlausibleMerchant(name)) names.add(name);
    });
  });
  return [...names].map((merchant) =>
    officialOffer({
      merchant,
      discount: "The Corner",
      sources: ["parraineo"],
    })
  );
}

function parseDetectiveHtml(html) {
  const { JSDOM, VirtualConsole } = require("jsdom");
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", () => {});
  const document = new JSDOM(html, { virtualConsole }).window.document;
  document.querySelectorAll("script, style").forEach((el) => el.remove());
  const names = new Set();

  document.querySelectorAll("table tr").forEach((row) => {
    const cells = [...row.querySelectorAll("td")];
    if (cells.length < 2) return;
    splitMerchantList(cells[cells.length - 1].textContent).forEach((name) => {
      if (isPlausibleMerchant(name)) names.add(name);
    });
  });

  const nameOffers = [...names].map((merchant) =>
    officialOffer({
      merchant,
      discount: "The Corner",
      offerType: "Avantage The Corner",
      sources: ["detective-banque"],
    })
  );

  return { names: [...names], withDiscount: [], nameOffers };
}

function parseOfficialHtml(html) {
  const raw = String(html || "");
  return OFFICIAL_TEASERS.filter((name) =>
    raw.toLowerCase().includes(name.toLowerCase())
  ).map((merchant) =>
    officialOffer({
      merchant,
      discount: "The Corner",
      sources: ["boursobank-officiel"],
    })
  );
}

function hasConcreteDiscount(discount) {
  const value = String(discount || "").trim();
  return value.length > 0 && value !== "The Corner";
}

function mergeBoursoOffers(parraineoOffers, detective, officialOffers, parraineoLists) {
  const byKey = new Map();

  function upsert(offer) {
    const key = merchantKey(offer.merchant);
    if (!key || !isPlausibleMerchant(offer.merchant)) return;
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, officialOffer(offer));
      return;
    }
    const sources = new Set([...(current.sources || []), ...(offer.sources || [])]);
    const keepDiscount = hasConcreteDiscount(current.discount)
      ? current.discount
      : offer.discount;
    const keepType =
      current.offerType && current.offerType !== "Avantage The Corner"
        ? current.offerType
        : offer.offerType;
    byKey.set(key, officialOffer({
      ...current,
      discount: keepDiscount,
      offerType: keepType,
      sources: [...sources],
    }));
  }

  (parraineoOffers || []).forEach(upsert);
  (parraineoLists || []).forEach(upsert);
  (detective && detective.withDiscount ? detective.withDiscount : []).forEach(upsert);
  (detective && detective.nameOffers ? detective.nameOffers : []).forEach(upsert);
  (officialOffers || []).forEach(upsert);

  return [...byKey.values()].sort((a, b) => a.merchant.localeCompare(b.merchant, "fr"));
}

function assertOfficialTeasers(merged) {
  const keys = new Set(merged.map((offer) => merchantKey(offer.merchant)));
  const missing = OFFICIAL_TEASERS.filter((name) => !keys.has(merchantKey(name)));
  if (missing.length) {
    throw new Error(
      "Official The Corner teasers missing from catalog: " + missing.join(", ")
    );
  }
}

async function fetchText(url) {
  const fetch = require("node-fetch");
  const response = await fetch(url, {
    headers: { "User-Agent": "NotifCashbackBot/1.0 (catalog refresh)" },
  });
  if (!response.ok) {
    throw new Error("HTTP " + response.status + " for " + url);
  }
  return response.text();
}

async function scrapeTheCorner() {
  const parraineoHtml = await fetchText(PARRAINEO_URL);
  const parraineoOffers = parseParraineoHtml(parraineoHtml);
  const parraineoLists = parseParraineoLists(parraineoHtml);
  if (parraineoOffers.length < MIN_OFFERS) {
    throw new Error(
      "Parraineo tables too small (" + parraineoOffers.length + ", min " + MIN_OFFERS + ")."
    );
  }

  let detective = { names: [], withDiscount: [], nameOffers: [] };
  try {
    const detectiveHtml = await fetchText(DETECTIVE_URL);
    detective = parseDetectiveHtml(detectiveHtml);
  } catch (err) {
    console.warn("Detective-banque unavailable, continuing with Parraineo:", err.message);
  }

  let officialOffers = OFFICIAL_TEASERS.map((merchant) =>
    officialOffer({ merchant, discount: "The Corner", sources: ["boursobank-officiel"] })
  );
  try {
    const officialHtml = await fetchText(OFFICIAL_URL);
    const parsedOfficial = parseOfficialHtml(officialHtml);
    if (parsedOfficial.length) officialOffers = parsedOfficial;
  } catch (err) {
    console.warn("Official The Corner page unavailable, using known teasers:", err.message);
  }

  const merged = mergeBoursoOffers(parraineoOffers, detective, officialOffers, parraineoLists);
  assertOfficialTeasers(merged);
  if (merged.length < MIN_OFFERS) {
    throw new Error(
      "The Corner catalog too small (" + merged.length + ", min " + MIN_OFFERS + "). Refusing to publish."
    );
  }
  return merged;
}

function buildCatalog(boursoOffers, domainMap) {
  return enrichCatalog({ boursobank: boursoOffers }, domainMap);
}

module.exports = {
  PARRAINEO_URL,
  DETECTIVE_URL,
  OFFICIAL_URL,
  OFFICIAL_PORTAL,
  OFFICIAL_TEASERS,
  MIN_OFFERS,
  parseParraineoHtml,
  parseParraineoLists,
  parseDetectiveHtml,
  parseOfficialHtml,
  mergeBoursoOffers,
  assertOfficialTeasers,
  isPlausibleMerchant,
  scrapeTheCorner,
  buildCatalog,
};
