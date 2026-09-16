const fs = require("fs");
const { scrapeTheCorner, buildCatalog } = require("./scrape-the-corner");
const merchantDomains = require("./merchant-domains");

async function scrapeAllSources() {
  console.log("Scraping The Corner (Parraineo + Detective Banque + page officielle Bourso)...");
  const boursoOffers = await scrapeTheCorner();
  console.log(boursoOffers.length + " BoursoBank offers after merge");

  const result = buildCatalog(boursoOffers, merchantDomains);
  fs.writeFileSync("all-offers.json", JSON.stringify(result, null, 2), "utf-8");
  console.log("Saved all-offers.json (boursobank only, official The Corner links)");
  return result;
}

module.exports = { scrapeAllSources };

if (require.main === module) {
  scrapeAllSources().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
