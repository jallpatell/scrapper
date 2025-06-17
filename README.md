# 📈 Stock Data Scraper <br>
### A robust Node.js-based web scraping utility built using Puppeteer that collects financial and trading data for a list of companies from the web, and exports the results to both CSV and JSON formats. <br>


| Setting          | Description                              | Default         |
| ---------------- | ---------------------------------------- | --------------- |
| `MAX_RETRIES`    | Number of retry attempts per company     | 3               |
| `REQUEST_DELAY`  | Delay (in ms) between scraping companies | 3000 ms (3 sec) |
| `SCRAPE_TIMEOUT` | Timeout for each page load               | 30000 ms (30s)  |


<br>
<br>
<br>
<br>
<br>
Data Saved at: https://docs.google.com/spreadsheets/d/1gDCqR7-SWlzCZ2OpTcG0wySUSuTFuuROFjvp6tjUUMU/edit?gid=25717652#gid=25717652 
<br>
<br>
<br>
<br>
<br>
<br>
<br>



🧪 Usage: 
0. Install the dependencies:
    ``` npm init -y ```
    <br>
    ``` npm install ```


1. Fetches compnay fetails from the list.js <br>

<pre><code>## 📄 Example: `list.js` ```js // list.js exports.companies = [ { name: "Tata Consultancy Services", symbol: "TCS", url: "https://www.moneycontrol.com/financials/tcs" }, { name: "Infosys", symbol: "INFY", url: "https://www.moneycontrol.com/financials/infosys" } ]; ``` </code></pre>




2. Run the scraper:
``` node main-scrapper.js  ```
