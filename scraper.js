const { JSDOM } = require('jsdom');
const fs = require('fs');
const fetch = require('node-fetch');

async function scrapeFromHtml(html) {
  console.log('Analyse du HTML...');
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const partners = {};

  // Trouver tous les h3 et les tables associées
  const h3Elements = document.querySelectorAll('h3');
  console.log(`Nombre de titres h3 trouvés : ${h3Elements.length}`);

  h3Elements.forEach((h3, index) => {
    const category = h3.textContent.trim();
    console.log(`\nCatégorie trouvée : "${category}"`);

    // Chercher la table qui suit ce h3
    let nextElement = h3.nextElementSibling;
    let table = null;

    while (nextElement) {
      if (nextElement.querySelector('table')) {
        table = nextElement.querySelector('table');
        break;
      }
      nextElement = nextElement.nextElementSibling;
    }

    if (!table) {
      console.log(`Aucune table trouvée pour la catégorie "${category}"`);
      return;
    }

    // Initialiser le tableau pour cette catégorie
    partners[category] = [];

    // Parcourir les lignes de la table
    const rows = table.querySelectorAll('tr');
    console.log(`Nombre de lignes dans la table : ${rows.length}`);

    rows.forEach((row, rowIndex) => {
      // Ignorer l'en-tête
      if (rowIndex === 0) return;

      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        const partner = {
          enseigne: cells[0].textContent.trim(),
          offre: cells[1].textContent.trim(),
          typeOffre: cells[2].textContent.trim()
        };
        partners[category].push(partner);
        console.log(`  - Partenaire ajouté : ${partner.enseigne}`);
      }
    });

    console.log(`Nombre de partenaires dans la catégorie "${category}" : ${partners[category].length}`);
  });

  // Vérifier si des données ont été trouvées
  const totalPartners = Object.values(partners).reduce((acc, curr) => acc + curr.length, 0);
  console.log(`\nNombre total de partenaires trouvés : ${totalPartners}`);

  if (totalPartners === 0) {
    console.log('\nAucun partenaire trouvé dans les catégories, tentative de récupération sans catégories...');
    // Si aucune donnée trouvée avec les catégories, essayer de récupérer juste les tables
    const tables = document.querySelectorAll('table');
    if (tables.length > 0) {
      partners['Partenaires'] = [];
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach((row, rowIndex) => {
          if (rowIndex === 0) return;
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            const partner = {
              enseigne: cells[0].textContent.trim(),
              offre: cells[1].textContent.trim(),
              typeOffre: cells[2].textContent.trim()
            };
            partners['Partenaires'].push(partner);
            console.log(`  - Partenaire ajouté : ${partner.enseigne}`);
          }
        });
      });
    }
  }

  return partners;
}

async function scrapeTheCornerPartners() {
  try {
    // URL de la page à scraper
    const url = 'https://www.parraineo.com/blog/the-corner-boursorama-liste';

    console.log('Récupération de la page web...');
    const response = await fetch(url);
    const html = await response.text();
    console.log('Page web récupérée avec succès');

    // Analyser le HTML
    const partners = await scrapeFromHtml(html);

    // Sauvegarder les résultats dans un fichier JSON
    fs.writeFileSync(
      'the-corner-partners.json',
      JSON.stringify(partners, null, 2),
      'utf-8'
    );

    console.log('\nLes données ont été extraites avec succès et sauvegardées dans the-corner-partners.json');

  } catch (error) {
    console.error('Erreur lors du scraping:', error);
    console.error(error.stack);
  }
}

// Exporter les fonctions
module.exports = {
  scrapeFromHtml,
  scrapeTheCornerPartners
};

// Exécuter le script principal seulement si appelé directement
if (require.main === module) {
  scrapeTheCornerPartners();
} 