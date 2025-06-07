const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://www.moneycontrol.com/india/stockpricequote/refineries/relianceindustries/RI', {
    waitUntil: 'domcontentloaded',
  });

  // Wait for the dynamic element to appear
  await page.waitForSelector('#KnowBeforeYouInvest', { timeout: 45000 });

  // Extract only the HTML of the element
  const elementHTML = await page.$eval('#KnowBeforeYouInvest', el => el.outerHTML);

  console.log("Extracted HTML:\n", elementHTML);

  await browser.close();
})();
