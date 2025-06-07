const puppeteer = require('puppeteer');

async function extractKnowBeforeYouInvest() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  try {
    // Configure the page to look like a regular browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });

    await page.goto('https://www.moneycontrol.com/india/stockpricequote/refineries/relianceindustries/RI', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for the specific section to load
    await page.waitForSelector('#KnowBeforeYouInvest', { timeout: 10000 });

    // Extract all paragraph content from the section
    const knowBeforeContent = await page.evaluate(() => {
      const section = document.querySelector('#KnowBeforeYouInvest');
      if (!section) return null;
      
      // Get all paragraphs and their text content
      const paragraphs = Array.from(section.querySelectorAll('p'));
      return paragraphs.map(p => p.textContent.trim()).filter(text => text.length > 0);
    });

    if (knowBeforeContent && knowBeforeContent.length > 0) {
      console.log('Content from Know Before You Invest section:');
      knowBeforeContent.forEach((para, index) => {
        console.log(`${index + 1}. ${para}`);
      });
    } else {
      console.log('No content found in the Know Before You Invest section');
    }

  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await browser.close();
  }
}

extractKnowBeforeYouInvest();