import fs from "fs";

// 1. Check visual_index.json
try {
  const visual = JSON.parse(fs.readFileSync("public/visual_index.json", "utf-8"));
  const catSlugs = new Set();
  const catNames = new Set();
  visual.forEach((p: any) => {
    if (p.category_slug) catSlugs.add(p.category_slug);
    if (p.category) catNames.add(p.category);
  });
  console.log("visual_index.json category_slugs:", Array.from(catSlugs));
  console.log("visual_index.json categories (sample 10):", Array.from(catNames).slice(0, 10));
} catch (e) {
  console.error("Error reading visual_index.json:", e);
}

// 2. Check ecomseller
try {
  const ecom = JSON.parse(fs.readFileSync("src/data/ecomsellerSeedCatalog.json", "utf-8"));
  const catSlugs = new Set();
  ecom.forEach((p: any) => {
    if (p.category_slug) catSlugs.add(p.category_slug);
    else if (p.category) catSlugs.add(p.category);
  });
  console.log("ecomseller categories:", Array.from(catSlugs));
} catch (e) {
  // try different path if not there
}
