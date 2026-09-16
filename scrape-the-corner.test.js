const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  parseParraineoHtml,
  parseParraineoLists,
  parseDetectiveHtml,
  parseOfficialHtml,
  mergeBoursoOffers,
  assertOfficialTeasers,
  OFFICIAL_PORTAL,
  OFFICIAL_TEASERS,
} = require("./scrape-the-corner");

const parraineoHtml = `
<p>Voici la liste des enseignes de grande distribution offrant du cashback The Corner : Auchan, Carrefour, Deliveroo, HelloFresh.</p>
<table>
  <tr><th>Enseigne</th><th>Offre</th><th>Type d'offre</th></tr>
  <tr><td>Darty</td><td>-5%*</td><td>Bon d'achat</td></tr>
  <tr><td>Fnac</td><td>-5%*</td><td>Bon d'achat</td></tr>
  <tr><td>Carrefour</td><td>-5%*</td><td>Bon d'achat</td></tr>
  <tr><td>Auchan</td><td>-5%*</td><td>Bon d'achat</td></tr>
  <tr><td>Samsung</td><td>Jusqu'à -30%*</td><td>Remise immédiate</td></tr>
  <tr><td>IKEA</td><td>-4%*</td><td>Bon d'achat</td></tr>
  <tr><td>Alpiq</td><td>-8%*</td><td>Cashback</td></tr>
</table>`;

const detectiveHtml = `
<style>.box { width: 50%; min-width: 280px; }</style>
<table>
  <tr><td>High-tech</td><td>Fnac, Apple, Samsung, Darty, Cdiscount, HP</td></tr>
  <tr><td>Maison</td><td>Ikea, Conforama, But</td></tr>
</table>
<p>-4% Ikea, -5% Auchan, width: 50%</p>`;

const officialHtml = `
<h2>Quelques enseignes partenaires</h2>
<p>Carrefour</p><p>Alpiq</p><p>Auchan</p><p>Samsung</p><p>IKEA</p>`;

describe("the corner catalog parsers", () => {
  it("reads Parraineo tables and points to the official portal", () => {
    const offers = parseParraineoHtml(parraineoHtml);
    const darty = offers.find((o) => o.merchant === "Darty");
    assert.ok(darty);
    assert.equal(darty.discount, "-5%*");
    assert.equal(darty.link, OFFICIAL_PORTAL);
    assert.deepEqual(darty.sources, ["parraineo"]);
  });

  it("reads Parraineo category lists as extra merchant names", () => {
    const lists = parseParraineoLists(parraineoHtml);
    assert.ok(lists.some((o) => o.merchant === "HelloFresh"));
    assert.ok(lists.some((o) => o.merchant === "Deliveroo"));
  });

  it("reads Detective Banque names and sample percents", () => {
    const parsed = parseDetectiveHtml(detectiveHtml);
    assert.ok(parsed.names.includes("Darty"));
    assert.ok(parsed.names.includes("Apple"));
    assert.ok(parsed.names.includes("Ikea"));
    assert.equal(parsed.withDiscount.length, 0);
    assert.equal(parsed.names.some((n) => /min-width|280px|%/i.test(n)), false);
  });

  it("reads official Bourso teasers from the public marketing page", () => {
    const official = parseOfficialHtml(officialHtml);
    assert.deepEqual(
      official.map((o) => o.merchant).sort(),
      [...OFFICIAL_TEASERS].sort()
    );
    assert.equal(official[0].link, OFFICIAL_PORTAL);
    assert.deepEqual(official[0].sources, ["boursobank-officiel"]);
  });

  it("keeps Parraineo percent when Detective only has the name", () => {
    const merged = mergeBoursoOffers(
      parseParraineoHtml(parraineoHtml),
      parseDetectiveHtml(detectiveHtml),
      parseOfficialHtml(officialHtml),
      parseParraineoLists(parraineoHtml)
    );
    const darty = merged.find((o) => o.merchant === "Darty");
    assert.equal(darty.discount, "-5%*");
    assert.ok(darty.sources.includes("parraineo"));
    assert.ok(darty.sources.includes("detective-banque"));
    const apple = merged.find((o) => o.merchant === "Apple");
    assert.equal(apple.discount, "The Corner");
    assert.equal(apple.link, OFFICIAL_PORTAL);
    const hello = merged.find((o) => o.merchant === "HelloFresh");
    assert.ok(hello);
    assertOfficialTeasers(merged);
  });

  it("rejects a catalog that dropped official teasers", () => {
    assert.throws(() => assertOfficialTeasers([{ merchant: "Fnac", discount: "-5%*" }]));
  });
});
