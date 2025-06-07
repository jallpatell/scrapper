const puppeteer = require('puppeteer');

async function extractStockData() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Configure to look like a regular user
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  await page.setViewport({ width: 1366, height: 768 });

  try {
    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      ['image', 'stylesheet', 'font', 'media', 'ads'].includes(req.resourceType()) 
        ? req.abort() 
        : req.continue();
    });

    console.log('Navigating to page...');
    await page.goto('https://www.moneycontrol.com/india/stockpricequote/refineries/relianceindustries/RI', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // More flexible waiting strategy
    console.log('Waiting for content to load...');
    await waitForAnySelector(page, [
      '.pcnsb div.infoDisp', // Primary selector
      '.oview_table', // Alternative table structure
      '#nsecp', // Price element as fallback
    ], { timeout: 15000 });

    console.log('Extracting data...');
    const stockData = await page.evaluate(() => {
      // Try multiple approaches to find the data
      const getValue = (label) => {
        // Method 1: Look for label in infoDisp elements
        const infoDisps = Array.from(document.querySelectorAll('.pcnsb div.infoDisp, .oview_table div.infoDisp'));
        const element = infoDisps.find(el => el.textContent.includes(label));
        if (element && element.nextElementSibling) {
          return element.nextElementSibling.textContent.trim();
        }

        // Method 2: Look for table rows
        const rows = Array.from(document.querySelectorAll('tr'));
        const row = rows.find(r => r.textContent.includes(label));
        if (row) {
          return row.querySelector('td:last-child')?.textContent.trim();
        }

        return 'N/A';
      };

      return {
        'Open': getValue('Open'),
        'Previous Close': getValue('Previous Close'),
        'Volume': getValue('Volume'),
        'Value (Lacs)': getValue('Value (Lacs)'),
        'VWAP': getValue('VWAP'),
        'Beta': getValue('Beta'),
        'Mkt Cap (Rs. Cr.)': getValue('Mkt Cap (Rs. Cr.)'),
        'High': getValue('High'),
        'Low': getValue('Low'),
        'UC Limit': getValue('UC Limit'),
        'LC Limit': getValue('LC Limit'),
        '52 Week High': getValue('52 Week High'),
        '52 Week Low': getValue('52 Week Low'),
        'Face Value': getValue('Face Value'),
        'All Time High': getValue('All Time High'),
        'All Time Low': getValue('All Time Low'),
        '20D Avg Volume': getValue('20D Avg Volume'),
        '20D Avg Delivery(%)': getValue('20D Avg Delivery(%)'),
        'Book Value Per Share': getValue('Book Value Per Share'),
        'Dividend Yield': getValue('Dividend Yield')
      };
    });

    console.log('Stock Data:', stockData);
    return stockData;

  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Helper function to wait for any of multiple selectors
async function waitForAnySelector(page, selectors, options = {}) {
  const { timeout = 10000 } = options;
  let error;
  
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout });
      return selector;
    } catch (e) {
      error = e;
    }
  }
  
  throw error || new Error(`None of the selectors found: ${selectors.join(', ')}`);
}

extractStockData().catch(console.error);