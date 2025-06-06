const cheerio = require('cheerio');
const axios = require('axios');

(async () => {
    try {
        const { data } = await axios.get("https://www.moneycontrol.com/markets/indian-indices/");
        const $ = cheerio.load(data);
        console.log($('h1').text());
    } catch (error) {
        console.error("Error fetching the page:", error.message);
    }
})();
