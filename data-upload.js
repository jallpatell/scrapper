const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Configuration
const SPREADSHEET_ID = '1gDCqR7-SWlzCZ2OpTcG0wySUSuTFuuROFjvp6tjUUMU'; // Replace with your Google Sheet ID
const CREDENTIALS_FILE = '/Users/jal/Desktop/YT-Scrape/stock-data-uploader-46b3e051d134.json'; // Path to service account JSON
const DATA_DIRECTORY = './scrapped_data'; // Directory where JSON files are stored

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  keyFile: CREDENTIALS_FILE,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Helper function to clean and format numeric values
function cleanNumericValue(value) {
  if (value === '--' || value === null || value === undefined) return '';
  if (typeof value === 'string') {
    // Remove commas from numbers like "1,441.00"
    value = value.replace(/,/g, '');
    // Handle cases like "0.00\n                                0.00"
    value = value.split('\n')[0].trim();
  }
  return isNaN(value) ? value : Number(value);
}

// Process a single stock data file
async function processStockFile(filePath) {
  try {
    // Read and parse the JSON file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let stockData = JSON.parse(fileContent);
    
    // Extract date from filename (format: stock_data_2025-06-07T15-31-04-587Z.json)
    const dateMatch = path.basename(filePath).match(/(\d{4}-\d{2}-\d{2})/);
    const dataDate = dateMatch ? dateMatch[1] : 'unknown_date';
    
    // Prepare sheet name (format: "2025-06-07")
    const sheetName = dataDate.replace(/-/g, '_'); // Google Sheets doesn't like hyphens in sheet names
    
    // Process each stock entry
    const rows = stockData.map(stock => {
      return [
        stock.symbol,
        stock.name,
        cleanNumericValue(stock.Open),
        cleanNumericValue(stock['Previous Close']),
        cleanNumericValue(stock.Volume),
        cleanNumericValue(stock['Value (Lacs)']),
        cleanNumericValue(stock.VWAP),
        cleanNumericValue(stock.Beta),
        cleanNumericValue(stock['Mkt Cap (Rs. Cr.)']),
        cleanNumericValue(stock.High),
        cleanNumericValue(stock.Low),
        cleanNumericValue(stock['UC Limit']),
        cleanNumericValue(stock['LC Limit']),
        cleanNumericValue(stock['52 Week High']),
        cleanNumericValue(stock['52 Week Low']),
        cleanNumericValue(stock['Face Value']),
        cleanNumericValue(stock['All Time High']),
        cleanNumericValue(stock['All Time Low']),
        cleanNumericValue(stock['20D Avg Volume']),
        cleanNumericValue(stock['20D Avg Delivery(%)']),
        cleanNumericValue(stock['Book Value Per Share']),
        cleanNumericValue(stock['Dividend Yield']),
        stock.timestamp,
        dataDate // Add the date column extracted from filename
      ];
    });
    
    // Add headers
    const headers = [
      'Symbol', 'Company Name', 'Open', 'Previous Close', 'Volume', 
      'Value (Lacs)', 'VWAP', 'Beta', 'Market Cap (Rs. Cr.)', 
      'High', 'Low', 'UC Limit', 'LC Limit', '52 Week High', 
      '52 Week Low', 'Face Value', 'All Time High', 'All Time Low', 
      '20D Avg Volume', '20D Avg Delivery(%)', 'Book Value Per Share', 
      'Dividend Yield', 'Timestamp', 'Data Date'
    ];
    
    rows.unshift(headers);
    
    // Initialize Google Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Check if sheet exists, create if not
    try {
      await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
        ranges: [sheetName],
        fields: 'sheets.properties'
      });
    } catch (error) {
      // Sheet doesn't exist, create it
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName,
                gridProperties: {
                  rowCount: 1,
                  columnCount: headers.length
                }
              }
            }
          }]
        }
      });
    }
    
    // Clear existing data in the sheet
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
    });
    
    // Update the sheet with new data
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: rows,
      },
    });
    
    console.log(`Successfully uploaded ${stockData.length} stocks to sheet "${sheetName}"`);
    
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}

// Main function to process all stock data files
async function processAllStockFiles() {
  try {
    // Get list of all JSON files in the data directory
    const files = fs.readdirSync(DATA_DIRECTORY)
      .filter(file => file.endsWith('.json') && file.startsWith('stock_data_'));
    
    if (files.length === 0) {
      console.log('No stock data files found in directory');
      return;
    }
    
    console.log(`Found ${files.length} stock data files to process`);
    
    // Process each file sequentially
    for (const file of files) {
      const filePath = path.join(DATA_DIRECTORY, file);
      await processStockFile(filePath);
    }
    
    console.log('All stock data files processed successfully');
    
  } catch (error) {
    console.error('Error processing stock data files:', error.message);
  }
}

// Run the script
processAllStockFiles();