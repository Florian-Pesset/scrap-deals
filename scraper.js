const { JSDOM } = require('jsdom');
const fs = require('fs');
const fetch = require('node-fetch');

// Scrape all Macif offers by iterating through all categories and paginated pages
async function scrapeMacifAvantages() {
  try {
    console.log('Scraping Macif Avantages...');
    // Fetch the main page to get all tab links
    const mainResponse = await fetch('https://www.macifavantages.fr/');
    const mainHtml = await mainResponse.text();
    const mainDom = new JSDOM(mainHtml);
    const mainDocument = mainDom.window.document;

    // Get all tab links (categories)
    const tabLinks = mainDocument.querySelectorAll('a.link-level-0');
    const categories = [];
    tabLinks.forEach(link => {
      const href = link.getAttribute('href');
      const text = link.textContent.trim();
      if (href && href.includes('macifavantages.fr') && text) {
        categories.push({
          name: text,
          url: href
        });
      }
    });
    console.log(`Number of categories found: ${categories.length}`);

    const allOffers = [];
    const processedOffers = new Set();

    // For each category, iterate through all pages
    for (const category of categories) {
      let page = 1;
      let previousPageSignature = null;
      while (true) {
        let pageUrl = category.url + (page > 1 ? (category.url.includes('?') ? '&' : '?') + 'page=' + page : '');
        console.log(`Scraping category: ${category.name} - page ${page}`);
        const pageResponse = await fetch(pageUrl);
        const pageHtml = await pageResponse.text();
        const pageDom = new JSDOM(pageHtml);
        const pageDocument = pageDom.window.document;

        // Select all offer articles
        const offerArticles = pageDocument.querySelectorAll('article.js-offre');
        if (offerArticles.length === 0) break; // End of pagination

        // Create a unique signature for the current page
        const currentPageSignature = Array.from(offerArticles).map(a => a.getAttribute('data-id')).join(',');
        if (currentPageSignature === previousPageSignature) {
          console.log('  - Pagination stopped: page identical to previous.');
          break;
        }
        previousPageSignature = currentPageSignature;

        console.log(`  - ${offerArticles.length} offers found on page ${page}`);

        offerArticles.forEach(article => {
          try {
            const merchant = article.getAttribute('data-partner-name') || article.getAttribute('data-name') || 'Partenaire inconnu';
            const discount = article.querySelector('.card-title')?.textContent.trim() || '';
            const description = article.querySelector('.card-subtitle')?.textContent.trim() || '';
            let offerType = 'Réduction';
            if (discount.toLowerCase().includes('bon') || discount.toLowerCase().includes('code')) {
              offerType = "Bon d'achat";
            } else if (discount.toLowerCase().includes('cashback') || discount.toLowerCase().includes('remboursement')) {
              offerType = 'Cashback';
            }
            const offerKey = `${merchant}-${discount}-${category.name}`;
            if (merchant && merchant !== 'Partenaire inconnu' && !processedOffers.has(offerKey)) {
              processedOffers.add(offerKey);
              allOffers.push({
                merchant: merchant,
                discount: discount,
                offerType: offerType,
                description: description,
                link: `https://www.macifavantages.fr/offres/${merchant.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}?utm_source=deals-finder&utm_medium=extension&utm_campaign=affiliate`,
                source: 'macif',
                category: category.name,
                page: page
              });
            }
          } catch (error) {
            console.log(`    - Error while parsing an offer: ${error.message}`);
          }
        });
        page++;
        await new Promise(resolve => setTimeout(resolve, 500)); // Be nice to the server
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Pause between categories
    }
    console.log(`Total Macif offers extracted: ${allOffers.length}`);
    if (allOffers.length === 0) {
      console.log("No offer found, using example data...");
      return [
        {
          merchant: 'Garmin',
          discount: '-10%',
          offerType: 'Réduction',
          description: 'sur la Vivoactive 6',
          link: 'https://www.macifavantages.fr/offres/garmin?utm_source=deals-finder&utm_medium=extension&utm_campaign=affiliate',
          source: 'macif',
          category: 'High-Tech & Electroménager',
          page: 1
        }
      ];
    }
    return allOffers;
  } catch (error) {
    console.error('Error while scraping Macif:', error);
    return [];
  }
}

// Scrape all Boursorama offers from Parraineo by parsing all tables
async function scrapeBoursoramaFromParraineo() {
  try {
    console.log('Scraping Boursorama from Parraineo...');
    const response = await fetch('https://www.parraineo.com/blog/the-corner-boursorama-liste');
    const html = await response.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const offers = [];

    // Find all tables in the content
    const tables = document.querySelectorAll('table');
    console.log(`Number of tables found: ${tables.length}`);

    tables.forEach((table, tableIndex) => {
      const rows = table.querySelectorAll('tr');
      console.log(`Table ${tableIndex + 1}: ${rows.length} rows`);

      rows.forEach((row, rowIndex) => {
        // Skip header row
        if (rowIndex === 0) return;

        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const merchant = cells[0].textContent.trim();
          const discount = cells[1].textContent.trim();
          const offerType = cells[2].textContent.trim();

          // Clean and validate data
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

    console.log(`${offers.length} Boursorama offers extracted from Parraineo`);
    return offers;

  } catch (error) {
    console.error('Error while scraping Boursorama from Parraineo:', error);
    // Return example data in case of error
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

// Scrape all sources and write the result to the JSON file
async function scrapeAllSources() {
  try {
    console.log('Starting multi-source scraping...');

    // Scrape Macif Avantages
    const macifOffers = await scrapeMacifAvantages();
    console.log(`${macifOffers.length} Macif offers found`);

    // Scrape Boursorama from Parraineo
    const boursoOffers = await scrapeBoursoramaFromParraineo();
    console.log(`${boursoOffers.length} Boursorama offers found`);

    // Organize the data as required
    const result = {
      boursobank: boursoOffers,
      macif: macifOffers
    };

    // Save the results
    fs.writeFileSync(
      'all-offers.json',
      JSON.stringify(result, null, 2),
      'utf-8'
    );

    console.log('\nScraping completed successfully!');
    console.log(`Total: ${macifOffers.length + boursoOffers.length} offers found`);
    console.log('Data saved to all-offers.json');

    return result;

  } catch (error) {
    console.error('Error while scraping:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  scrapeMacifAvantages,
  scrapeBoursoramaFromParraineo,
  scrapeAllSources
};

// Run the main script if called directly
if (require.main === module) {
  scrapeAllSources();
} 