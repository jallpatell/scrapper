const axios = require('axios');
const cheerio = require('cheerio');

const config = {
  method: 'get',
  url: 'https://www.moneycontrol.com/india/stockpricequote/refineries/relianceindustries/RI',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
  }
};

axios(config)
  .then(response => {
    const $ = cheerio.load(response.data);
    
    // More resilient data extraction
    const extractData = (label) => {
      const row = $(`div.pcnsb div.infoDisp:contains("${label}")`).first();
      return row.next().text().trim() || row.parent().next().text().trim();
    };

    const stockData = {
      companyName: $('#stockName h1').text().trim(),
      currentPrice: $('#nsecp').text().trim() || $('.lastprice').text().trim(),
      change: $('#nsechange').text().trim(),
      percentChange: $('#nsepercentchange').text().trim(),
      previousClose: extractData('Previous Close') || $('td:contains("Previous Close") + td').text().trim(),
      open: extractData('Open') || $('td:contains("Open") + td').text().trim(),
      volume: extractData('Volume') || $('td:contains("Volume") + td').text().trim()
    };

    console.log('Extracted Data:', stockData);
  })
  .catch(error => {
    console.error('Error:', error.response?.status || error.message);
  });