const { scrapeFromHtml } = require('./scraper');

const testHtml = `
<div class="content">
  <h3>Maison : Services, mobilier, décoration, bricolage, jardinage, électroménager</h3>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Enseigne</th>
          <th>Offre</th>
          <th>Type d'offre</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Alinéa</td>
          <td>-8%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>AMPM</td>
          <td>-5%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>Brico Cash</td>
          <td>-5%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>Bricomarché</td>
          <td>-5%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>Bricorama</td>
          <td>-5%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>Castorama</td>
          <td>-6%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>Conforama</td>
          <td>-7%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>Darty</td>
          <td>-5%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>IKEA</td>
          <td>-4%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>Jardiland</td>
          <td>-8%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>Leroy Merlin</td>
          <td>-5%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>Les Gentlemen du Déménagement</td>
          <td>-10%*</td>
          <td>Remise immédiate</td>
        </tr>
        <tr>
          <td>Maisons du Monde</td>
          <td>-10%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>Nature & Découvertes</td>
          <td>-10%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>Otovo</td>
          <td>-5%*</td>
          <td>Remise immédiate</td>
        </tr>
        <tr>
          <td>Selency</td>
          <td>-10%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>TRUFFAUT</td>
          <td>-10%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>Verisure</td>
          <td>-300€*</td>
          <td>Remise immédiate</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h3>Alimentaire : Supermarché, hypermarché, drive, livraison de repas</h3>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Enseigne</th>
          <th>Offre</th>
          <th>Type d'offre</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Auchan</td>
          <td>-5%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>Carrefour</td>
          <td>-5%*</td>
          <td>Bon d'achat</td>
        </tr>
        <tr>
          <td>Deliveroo</td>
          <td>-4%*</td>
          <td>Bon d'achat</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`;

async function runTest() {
  const partners = await scrapeFromHtml(testHtml);
  console.log('Résultats du test :', JSON.stringify(partners, null, 2));
}

runTest(); 