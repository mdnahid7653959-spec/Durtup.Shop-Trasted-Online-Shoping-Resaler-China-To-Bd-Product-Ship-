const fs = require('fs');

const content = fs.readFileSync('src/App.tsx', 'utf8');

// Find all Route paths
const routeMatches = content.match(/<Route\s+[^>]*path=["']([^"']+)["'][^>]*element=\{<([^ />]+)/g) || [];
const routes = [];
const rRegex = /path=["']([^"']+)["'][^>]*element=\{<([a-zA-Z0-9_]+)/;

for (const m of routeMatches) {
  const match = m.match(rRegex);
  if (match) {
    routes.push({ path: match[1], component: match[2] });
  }
}

// Also check all files in src/pages
const pages = [];
function readPages(dir, base = '') {
  for (const f of fs.readdirSync(dir)) {
    const full = dir + '/' + f;
    const rel = base ? base + '/' + f : f;
    if (fs.statSync(full).isDirectory()) {
      readPages(full, rel);
    } else if (f.endsWith('.tsx') || f.endsWith('.jsx')) {
      pages.push(rel.replace(/\.tsx$|\.jsx$/, ''));
    }
  }
}
readPages('src/pages');

console.log('Total routes in App.tsx:', routes.length);
console.log('Total page components in src/pages:', pages.length);

const inventory = {
  customerRoutes: routes.filter(r => !r.path.startsWith('/admin') && !r.path.startsWith('/seller') && !r.path.startsWith('/reseller') && !r.path.startsWith('/staff')),
  sellerResellerRoutes: routes.filter(r => r.path.startsWith('/seller') || r.path.startsWith('/reseller')),
  adminStaffRoutes: routes.filter(r => r.path.startsWith('/admin') || r.path.startsWith('/staff')),
  allPages: pages
};

fs.writeFileSync('scripts/route_inventory.json', JSON.stringify(inventory, null, 2));
console.log('Wrote inventory to scripts/route_inventory.json');
console.log('Customer routes count:', inventory.customerRoutes.length);
console.log('Seller/Reseller routes count:', inventory.sellerResellerRoutes.length);
console.log('Admin/Staff routes count:', inventory.adminStaffRoutes.length);
