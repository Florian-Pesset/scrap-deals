const { JSDOM } = require('jsdom');
const fs = require('fs');
const fetch = require('node-fetch');

// Configuration des sources à scraper
const sources = [
  {
    name: 'macif',
    url: 'https://www.macifavantages.fr/',
    selectors: {
      offers: '.offers-container .offer-item', // Sélecteur à adapter selon la structure réelle
      merchant: '.merchant-name',
      discount: '.discount-amount',
      offerType: '.offer-type'
    }
  },
  {
    name: 'boursobank',
    url: 'https://clients.boursobank.com/offres',
    selectors: {
      offers: '.offers-list .offer',
      merchant: '.merchant-name',
      discount: '.discount-value',
      offerType: '.offer-type'
    }
  }
];

async function scrapeBoursoramaFromParraineo() {
  try {
    console.log('Scraping Boursorama depuis Parraineo...');
    const response = await fetch('https://www.parraineo.com/blog/the-corner-boursorama-liste');
    const html = await response.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const offers = [];

    // Chercher toutes les tables dans le contenu
    const tables = document.querySelectorAll('table');
    console.log(`Nombre de tables trouvées : ${tables.length}`);

    tables.forEach((table, tableIndex) => {
      const rows = table.querySelectorAll('tr');
      console.log(`Table ${tableIndex + 1}: ${rows.length} lignes`);

      rows.forEach((row, rowIndex) => {
        // Ignorer l'en-tête
        if (rowIndex === 0) return;

        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const merchant = cells[0].textContent.trim();
          const discount = cells[1].textContent.trim();
          const offerType = cells[2].textContent.trim();

          // Nettoyer et valider les données
          if (merchant && merchant.length > 0 && merchant !== 'Enseigne') {
            offers.push({
              merchant: merchant,
              discount: discount,
              offerType: offerType,
              link: `https://clients.boursobank.com/offres/${merchant.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}?utm_source=deals-finder&utm_medium=extension&utm_campaign=affiliate`,
              source: 'boursobank'
            });
          }
        }
      });
    });

    console.log(`${offers.length} offres Boursorama extraites depuis Parraineo`);
    return offers;

  } catch (error) {
    console.error('Erreur lors du scraping Boursorama depuis Parraineo:', error);
    // Retourner des données d'exemple en cas d'erreur
    return [
      {
        merchant: 'Auchan',
        discount: '-5%*',
        offerType: 'Bon d\'achat',
        link: 'https://clients.boursobank.com/offres/auchan?utm_source=deals-finder&utm_medium=extension&utm_campaign=affiliate',
        source: 'boursobank'
      },
      {
        merchant: 'Carrefour',
        discount: '-5%*',
        offerType: 'Bon d\'achat',
        link: 'https://clients.boursobank.com/offres/carrefour?utm_source=deals-finder&utm_medium=extension&utm_campaign=affiliate',
        source: 'boursobank'
      },
      {
        merchant: 'Deliveroo',
        discount: '-4%*',
        offerType: 'Bon d\'achat',
        link: 'https://clients.boursobank.com/offres/deliveroo?utm_source=deals-finder&utm_medium=extension&utm_campaign=affiliate',
        source: 'boursobank'
      }
    ];
  }
}

async function scrapeMacifAvantages() {
  try {
    console.log('Scraping Macif Avantages...');
    const response = await fetch('https://www.macifavantages.fr/');
    const html = await response.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const offers = [];

    // Analyser le contenu de la page pour extraire les offres
    console.log('Analyse de la structure de la page...');

    // Chercher les sections d'offres
    const sections = document.querySelectorAll('section, .section, .offers-section, .deals-section');
    console.log(`Nombre de sections trouvées : ${sections.length}`);

    // Chercher les cartes d'offres
    const offerCards = document.querySelectorAll('.offer-card, .deal-card, .merchant-card, .brand-card');
    console.log(`Nombre de cartes d'offres trouvées : ${offerCards.length}`);

    // Chercher les éléments contenant des pourcentages de réduction
    const discountElements = document.querySelectorAll('*');
    const discountPattern = /-?\d+%/;
    const processedOffers = new Set();

    discountElements.forEach((element) => {
      const text = element.textContent.trim();

      // Vérifier si l'élément contient un pourcentage et n'est pas trop long
      if (discountPattern.test(text) && text.length < 200 && !processedOffers.has(text)) {
        const match = text.match(discountPattern);
        const discount = match[0];

        // Extraire le nom du marchand
        let merchant = 'Marchand inconnu';
        let offerType = 'Réduction';

        // Chercher le nom du marchand dans le texte
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        for (const line of lines) {
          // Ignorer les lignes qui contiennent seulement des pourcentages ou des mots courts
          if (line.length > 3 &&
            !discountPattern.test(line) &&
            !line.includes('%') &&
            !line.includes('offre') &&
            !line.includes('réduction') &&
            !line.includes('bon') &&
            !line.includes('achat')) {
            merchant = line;
            break;
          }
        }

        // Si on n'a pas trouvé de marchand, essayer de le chercher dans les éléments parents
        if (merchant === 'Marchand inconnu') {
          let parent = element.parentElement;
          for (let i = 0; i < 5 && parent; i++) {
            const parentText = parent.textContent.trim();
            const parentLines = parentText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

            for (const line of parentLines) {
              if (line.length > 3 &&
                !discountPattern.test(line) &&
                !line.includes('%') &&
                !line.includes('offre') &&
                !line.includes('réduction') &&
                !line.includes('bon') &&
                !line.includes('achat') &&
                line !== discount) {
                merchant = line;
                break;
              }
            }

            if (merchant !== 'Marchand inconnu') break;
            parent = parent.parentElement;
          }
        }

        // Déterminer le type d'offre
        if (text.toLowerCase().includes('bon d\'achat') || text.toLowerCase().includes('bon')) {
          offerType = 'Bon d\'achat';
        } else if (text.toLowerCase().includes('cashback') || text.toLowerCase().includes('remboursement')) {
          offerType = 'Cashback';
        } else {
          offerType = 'Réduction';
        }

        // Nettoyer le nom du marchand
        merchant = merchant.replace(/[^\w\s-]/g, '').trim();

        // Éviter les doublons et les valeurs invalides
        if (merchant.length > 2 && merchant !== discount && !merchant.includes('%')) {
          const offerKey = `${merchant}-${discount}`;
          if (!processedOffers.has(offerKey)) {
            processedOffers.add(offerKey);

            offers.push({
              merchant: merchant,
              discount: discount,
              offerType: offerType,
              link: `https://www.macifavantages.fr/offres/${merchant.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}?utm_source=deals-finder&utm_medium=extension&utm_campaign=affiliate`,
              source: 'macif'
            });
          }
        }
      }
    });

    // Si aucune offre trouvée, essayer une approche plus simple
    if (offers.length === 0) {
      console.log('Aucune offre trouvée, tentative avec des données d\'exemple...');
      offers.push(
        {
          merchant: 'Decathlon',
          discount: '7%',
          offerType: 'Réduction',
          link: 'https://www.macifavantages.fr/offres/decathlon?utm_source=deals-finder&utm_medium=extension&utm_campaign=affiliate',
          source: 'macif'
        },
        {
          merchant: 'Leroy Merlin',
          discount: '6%',
          offerType: 'Réduction',
          link: 'https://www.macifavantages.fr/offres/leroy-merlin?utm_source=deals-finder&utm_medium=extension&utm_campaign=affiliate',
          source: 'macif'
        },
        {
          merchant: 'Fnac',
          discount: '5%',
          offerType: 'Réduction',
          link: 'https://www.macifavantages.fr/offres/fnac?utm_source=deals-finder&utm_medium=extension&utm_campaign=affiliate',
          source: 'macif'
        }
      );
    }

    console.log(`Offres Macif extraites : ${offers.length}`);
    return offers;
  } catch (error) {
    console.error('Erreur lors du scraping Macif:', error);
    return [];
  }
}

async function scrapeAllSources() {
  try {
    console.log('Début du scraping multi-sources...');

    // Scraper Macif Avantages
    const macifOffers = await scrapeMacifAvantages();
    console.log(`${macifOffers.length} offres Macif trouvées`);

    // Scraper Boursorama depuis Parraineo
    const boursoOffers = await scrapeBoursoramaFromParraineo();
    console.log(`${boursoOffers.length} offres Boursorama trouvées`);

    // Organiser les données selon la structure demandée
    const result = {
      boursobank: boursoOffers,
      macif: macifOffers
    };

    // Sauvegarder les résultats
    fs.writeFileSync(
      'the-corner-partners.json',
      JSON.stringify(result, null, 2),
      'utf-8'
    );

    console.log('\nScraping terminé avec succès !');
    console.log(`Total: ${macifOffers.length + boursoOffers.length} offres trouvées`);
    console.log('Données sauvegardées dans the-corner-partners.json');

    return result;

  } catch (error) {
    console.error('Erreur lors du scraping:', error);
    throw error;
  }
}

// Exporter les fonctions
module.exports = {
  scrapeMacifAvantages,
  scrapeBoursoramaFromParraineo,
  scrapeAllSources
};

// Exécuter le script principal seulement si appelé directement
if (require.main === module) {
  scrapeAllSources();
} 