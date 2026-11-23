const https = require('https');

function testUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk.slice(0, 100));
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          firstBytes: data.slice(0, 60)
        });
      });
    }).on('error', (e) => resolve({ url, error: e.message }));
  });
}

async function main() {
  const urls = [
    'https://www.durtup.shop/uploads/test.jpg',
    'https://www.durtup.shop/public/storage/test.jpg',
    'https://www.durtup.shop/api/ecomseller/catalog',
    'https://www.durtup.shop/api/mohasagor/api/products'
  ];

  for (const u of urls) {
    const res = await testUrl(u);
    console.log(res);
  }
}

main();
