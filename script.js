const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create directory if it doesn't exist
const dir = './scraped_data';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

async function scrapeStockData() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  try {
    console.log('Scraping fundamental data...');
    // Scrape fundamental data - using mobile URL for simpler structure
    await page.goto('https://www.moneycontrol.com/mc/mci/stock/overview/NLI', { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    // Wait for key elements to load
    await page.waitForSelector('.stockprice', { timeout: 10000 });
    await page.waitForSelector('.swot_new', { timeout: 10000 });

    const fundamentalData = await page.evaluate(() => {
      // Helper function to get value by label
      const getValueByLabel = (label) => {
        const elements = Array.from(document.querySelectorAll('td'));
        const labelElement = elements.find(el => 
          el.textContent.trim().includes(label)
        );
        if (labelElement && labelElement.nextElementSibling) {
          return labelElement.nextElementSibling.textContent.trim();
        }
        return 'N/A';
      };

      // Get price data
      const getPriceValue = (className) => {
        const el = document.querySelector(`.${className} .val`);
        return el ? el.textContent.trim() : 'N/A';
      };

      // Get SWOT data
      const getSWOT = (index) => {
        const items = Array.from(document.querySelectorAll(`#swot_box_${index} li`));
        return items.map(li => li.textContent.trim()).filter(t => t).join('; ');
      };

      return {
        open: getPriceValue('open'),
        previousClose: getPriceValue('prevclose'),
        volume: getPriceValue('volume'),
        value: getPriceValue('value'),
        faceValue: getValueByLabel('Face Value') || 'N/A',
        bookValue: getValueByLabel('Book Value') || 'N/A',
        strength: getSWOT(0),
        weakness: getSWOT(1),
        opportunities: getSWOT(2),
        threats: getSWOT(3)
      };
    });

    console.log('Fundamental data:', fundamentalData);

    console.log('Scraping technical data...');
    // Scrape technical analysis data
    await page.goto('https://www.moneycontrol.com/technical-analysis/nipponlifeindiaassetmanagement/NLI/daily', { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    // Switch to technical indicators tab
    await page.waitForSelector('#techtab', { timeout: 10000 });
    const technicalData = await page.evaluate(async () => {
      // Helper function to get technical indicator
      const getIndicator = (name, tableSelector = '#techtab') => {
        try {
          const rows = Array.from(document.querySelectorAll(`${tableSelector} tr`));
          const row = rows.find(tr => 
            tr.textContent.trim().includes(name)
          );
          if (row) {
            // Get the signal from the last column
            const cells = row.querySelectorAll('td');
            if (cells.length > 2) {
              return cells[cells.length - 1].textContent.trim();
            }
          }
          return 'N/A';
        } catch (e) {
          return 'N/A';
        }
      };

      return {
        rsi: getIndicator('RSI'),
        macd: getIndicator('MACD'),
        stochastic: getIndicator('Stochastic'),
        adx: getIndicator('ADX'),
        williams: getIndicator('Williams'),
        movingAvg20: getIndicator('20 Day Moving Avg', '#movingavgtab'),
        movingAvg50: getIndicator('50 Day Moving Avg', '#movingavgtab'),
        movingAvg200: getIndicator('200 Day Moving Avg', '#movingavgtab')
      };
    });

    console.log('Technical data:', technicalData);

    // Combine all data
    const allData = {
      ...fundamentalData,
      ...technicalData
    };

    // Prepare CSV content
    const csvContent = Object.entries(allData)
      .map(([key, value]) => `"${key}","${value.replace(/"/g, '""')}"`)
      .join('\n');

    // Write to file
    const filePath = path.join(dir, 'nippon_stock_data.csv');
    fs.writeFileSync(filePath, 'Parameter,Value\n' + csvContent);
    console.log(`Data saved to ${filePath}`);

  } catch (error) {
    console.error('Scraping failed:', error);
    // Capture screenshot for debugging
    await page.screenshot({ path: 'error.png' });
    console.log('Screenshot saved as error.png');
  } finally {
    await browser.close();
  }
}

scrapeStockData();