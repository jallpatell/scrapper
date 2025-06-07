const puppeteer = require('puppeteer');
const { companies } = require('./list.js');
const fs = require('fs');
const path = require('path');

// Configuration
const MAX_RETRIES = 3;
const REQUEST_DELAY = 3000; // 3 seconds between requests
const SCRAPE_TIMEOUT = 30000; // 30 seconds timeout per company
const RESULTS_DIR = './scrapped_data';

// Create directory if it doesn't exist
if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR);
}

async function scrapeCompanyData(browser, company, retryCount = 0) {
    let page;
    try {
        page = await browser.newPage();
        
        // Configure browser settings
        await page.setDefaultNavigationTimeout(SCRAPE_TIMEOUT);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });

        // Block unnecessary resources
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            ['image', 'stylesheet', 'font', 'media', 'ads'].includes(req.resourceType()) 
                ? req.abort() 
                : req.continue();
        });

        console.log(`Scraping ${company.name} (${company.symbol}) [Attempt ${retryCount + 1}]...`);
        
        await page.goto(company.url, {
            waitUntil: 'domcontentloaded',
            timeout: SCRAPE_TIMEOUT
        });

        // Wait for key elements with multiple fallback options
        await waitForAnySelector(page, [
            '.pcnsb div.infoDisp',
            '.oview_table',
            '#nsecp',
            '.stockprice div'
        ], { timeout: 10000 });

        const stockData = await page.evaluate(() => {
            const getValue = (label) => {
                // Try multiple methods to find the data
                const infoDisps = Array.from(document.querySelectorAll('.pcnsb div.infoDisp, .oview_table div.infoDisp'));
                const element = infoDisps.find(el => el.textContent.includes(label));
                if (element && element.nextElementSibling) {
                    return element.nextElementSibling.textContent.trim();
                }

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

        console.log(`Successfully scraped ${company.symbol}`);
        return {
            symbol: company.symbol,
            name: company.name,
            ...stockData,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error(`Failed to scrape ${company.symbol}:`, error.message);
        
        if (retryCount < MAX_RETRIES - 1) {
            console.log(`Retrying ${company.symbol}...`);
            await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
            return scrapeCompanyData(browser, company, retryCount + 1);
        }
        
        return {
            symbol: company.symbol,
            name: company.name,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    } finally {
        if (page && !page.isClosed()) {
            await page.close().catch(e => console.error('Error closing page:', e));
        }
    }
}

async function scrapeAllCompanies() {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });

        const results = [];
        
        for (const company of companies) {
            const result = await scrapeCompanyData(browser, company);
            results.push(result);
            
            // Add delay between requests
            if (company !== companies[companies.length - 1]) {
                await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
            }
        }

        return results;

    } finally {
        if (browser) {
            await browser.close().catch(e => console.error('Error closing browser:', e));
        }
    }
}

// Helper function to wait for any selector
async function waitForAnySelector(page, selectors, options = {}) {
    const { timeout = 10000 } = options;
    
    for (const selector of selectors) {
        try {
            await page.waitForSelector(selector, { timeout });
            return selector;
        } catch (e) {
            continue;
        }
    }
    throw new Error(`None of the selectors found: ${selectors.join(', ')}`);
}

// Run the scraper with enhanced error handling
(async () => {
    try {
        const results = await scrapeAllCompanies();
        
        // Save results to CSV
        const csvContent = convertToCSV(results);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = path.join(RESULTS_DIR, `stock_data_${timestamp}.csv`);
        fs.writeFileSync(filename, csvContent);
        console.log(`Results saved to ${filename}`);
        
        // Also save raw JSON for debugging
        fs.writeFileSync(path.join(RESULTS_DIR, `stock_data_${timestamp}.json`), JSON.stringify(results, null, 2));
        
    } catch (error) {
        console.error('Fatal error in scraping process:', error);
    }
})();

function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = new Set();
    data.forEach(item => {
        Object.keys(item).forEach(key => headers.add(key));
    });
    
    const headerArray = Array.from(headers);
    
    let csv = headerArray.join(',') + '\n';
    
    data.forEach(item => {
        const row = headerArray.map(header => {
            let value = item[header] !== undefined ? String(item[header]) : '';
            if (value.includes(',')) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csv += row.join(',') + '\n';
    });
    
    return csv;
}