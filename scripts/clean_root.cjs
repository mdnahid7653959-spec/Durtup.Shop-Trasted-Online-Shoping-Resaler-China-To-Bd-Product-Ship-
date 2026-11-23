const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove <style id="critical-ssr-css">...</style>
const styleStart = html.indexOf('    <style id="critical-ssr-css">');
if (styleStart !== -1) {
  const styleEnd = html.indexOf('</style>', styleStart);
  if (styleEnd !== -1) {
    html = html.substring(0, styleStart) + html.substring(styleEnd + 8);
  }
}

// 2. Replace <div id="root">...</div> with clean <div id="root"></div>
const rootStart = html.indexOf('<div id="root">');
const rootEnd = html.indexOf('    <!-- Pre-rendered Semantic Crawler & AI Fallback Content -->');

if (rootStart !== -1 && rootEnd !== -1) {
  html = html.substring(0, rootStart) + '<div id="root"></div>\n\n' + html.substring(rootEnd);
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully cleaned index.html and set <div id="root"></div> clean!');
