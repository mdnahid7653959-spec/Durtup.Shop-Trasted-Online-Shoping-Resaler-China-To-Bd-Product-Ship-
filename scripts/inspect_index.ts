import fs from "fs";
const data = JSON.parse(fs.readFileSync("public/visual_index.json", "utf-8"));
const map = new Map<string, number>();
data.forEach((p: any) => {
  const key = `${p.categorySlug} (${p.categoryName})`;
  map.set(key, (map.get(key) || 0) + 1);
});
console.log("Unique categories in visual_index.json:");
for (const [k, count] of map.entries()) {
  console.log(`  ${k}: ${count} products`);
}
