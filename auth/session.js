// auth/cookies.js
const { list } = require('../list')
require('dotenv').config()

function getManualCookies() {
  // You'll need to manually extract these after logging in through browser
  return {
    'PHPSESSID': 'your_session_id',
    'mc_user_token': 'your_user_token',
    // Add other cookies you find in DevTools
  };
}

function formatCookiesForHeader(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

module.exports = {
  getManualCookies,
  formatCookiesForHeader
};