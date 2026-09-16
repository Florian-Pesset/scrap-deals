(function (root) {
  function normalizeHost(hostname) {
    if (typeof hostname !== "string") return null;
    const trimmed = hostname.trim().toLowerCase();
    if (!trimmed || /[\s/]/.test(trimmed) || trimmed.includes("://")) return null;
    return trimmed.replace(/^www\./, "");
  }

  function cleanMerchantName(name) {
    if (typeof name !== "string") return "";
    return name.replace(/\s*Nouveau\s*$/i, "").trim();
  }

  function merchantKey(name) {
    return cleanMerchantName(name)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function matchesOffer(hostname, offer) {
    if (!offer || !Array.isArray(offer.domains) || offer.domains.length === 0) {
      return false;
    }
    const host = normalizeHost(hostname);
    if (!host) return false;
    for (const raw of offer.domains) {
      const dom = normalizeHost(raw);
      if (!dom) continue;
      if (host === dom || host.endsWith("." + dom)) return true;
    }
    return false;
  }

  function lookupDomains(merchant, domainMap) {
    if (!domainMap) return [];
    const key = merchantKey(merchant);
    const domains = domainMap[key];
    return Array.isArray(domains) ? domains.slice() : [];
  }

  function enrichOffer(offer, domainMap) {
    const merchant = cleanMerchantName(offer.merchant || "");
    const existing = Array.isArray(offer.domains) ? offer.domains.filter(Boolean) : [];
    const domains = existing.length > 0 ? existing : lookupDomains(offer.merchant, domainMap);
    return { ...offer, merchant, domains };
  }

  function enrichCatalog(catalog, domainMap) {
    const out = {};
    if (!catalog || typeof catalog !== "object") return out;
    for (const provider of Object.keys(catalog)) {
      const offers = catalog[provider];
      if (!Array.isArray(offers)) {
        out[provider] = [];
        continue;
      }
      out[provider] = offers.map((offer) => enrichOffer(offer, domainMap));
    }
    return out;
  }

  function isMerchantEnabled(merchant, enabledMerchants) {
    if (!enabledMerchants || typeof enabledMerchants !== "object") return true;
    const target = merchantKey(merchant);
    if (!target) return true;
    let saw = false;
    let enabled = true;
    for (const [key, val] of Object.entries(enabledMerchants)) {
      if (merchantKey(key) === target) {
        saw = true;
        if (val === false) enabled = false;
      }
    }
    return saw ? enabled : true;
  }

  function findMatchingOffers(hostname, catalog, settings, domainMap) {
    const enabledProviders = settings && settings.enabledProviders;
    const enabledMerchants = settings && settings.enabledMerchants;
    const data = enrichCatalog(catalog, domainMap);
    const detected = [];
    for (const provider of Object.keys(data)) {
      if (Array.isArray(enabledProviders) && !enabledProviders.includes(provider)) continue;
      for (const offer of data[provider]) {
        if (!isMerchantEnabled(offer.merchant, enabledMerchants)) continue;
        if (!matchesOffer(hostname, offer)) continue;
        if (!String(offer.discount || "").trim()) continue;
        detected.push({ ...offer, provider });
      }
    }
    return detected;
  }

  const api = {
    normalizeHost,
    cleanMerchantName,
    merchantKey,
    matchesOffer,
    lookupDomains,
    enrichOffer,
    enrichCatalog,
    findMatchingOffers,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.DealMatcher = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
