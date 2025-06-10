const { chromium } = require('playwright');

(async () => {
  // Configure Brave's path
  const bravePath = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'; // Update for your OS

  // Launch Brave instead of Chromium
  const browser = await chromium.launch({
    headless: false,
    executablePath: bravePath, // Point to Brave's executable
    args: ['--start-maximized'] // Optional: Launch maximized
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    async () => {
      await page.goto("https://projects.100xdevs.com/")
    }
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'error.png' }); // Debug screenshot
  } finally {
    await browser.close();
  }
})();