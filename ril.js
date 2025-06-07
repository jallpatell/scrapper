const axios = require('axios');

let config = {
  method: 'get',
  maxBodyLength: Infinity,
  url: 'https://www.moneycontrol.com/india/stockpricequote/refineries/relianceindustries/RI',
  headers: { 
    'Cookie': 'PHPSESSID=n26td99jtndu4j9o56o5jln7m5'
  }
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
