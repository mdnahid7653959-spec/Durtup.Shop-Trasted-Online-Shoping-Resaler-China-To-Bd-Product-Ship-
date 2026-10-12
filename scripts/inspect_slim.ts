import fs from "fs";
const data = JSON.parse(fs.readFileSync("public/mohasagor_catalog_slim.json", "utf-8"));
console.log("Total products in mohasagor_catalog_slim.json:", data.length);
console.log("First item sample:", Object.keys(data[0]));
const catCounts = new Map<string, number>();
data.forEach((p: any) => {
  const cat = p.category || "uncategorized";
  catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
});
console.log("Categories in slim catalog:");
for (const [k, v] of catCounts.entries()) {
  console.log(`  ${k}: ${v} products`);
}
