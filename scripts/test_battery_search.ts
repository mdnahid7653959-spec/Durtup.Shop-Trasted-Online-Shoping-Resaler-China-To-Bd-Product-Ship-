import fs from "fs";
import path from "path";

async function runTest() {
  // Load .env
  const env = fs.readFileSync(".env", "utf8");
  env.split("\n").forEach(line => {
    const parts = line.split("=");
    if (parts.length >= 2) {
      process.env[parts[0].trim()] = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, "");
    }
  });

  // Fetch the image that the user used
  const imgUrl = "https://mohasagor.com.bd/public/storage/images/products/GseLlSOFjGdTdRJk7KvAKcVMyWL0aGio8Q2jD1N2.png";
  console.log("Fetching test battery charger image...");
  const imgRes = await fetch(imgUrl);
  const arrayBuffer = await imgRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  console.log("Image fetched, base64 length:", base64.length);

  // Import visual search engine
  const { handleVisualSearchServerRequest } = await import("../src/server/visualSearchEngine.ts");

  console.log("\nRunning handleVisualSearchServerRequest with battery charger image...");
  const result = await handleVisualSearchServerRequest({
    imageBase64: base64,
    filename: "camera-capture.jpg",
    userQuery: ""
  });

  console.log("Result success:", result.success);
  console.log("aiPowered:", result.aiPowered);
  console.log("primaryKeyword:", result.primaryKeyword);
  console.log("confidence:", result.confidence);
  console.log("detectedCategory:", result.detectedCategory);
  console.log("Total matched products:", result.total);
  console.log("Top 5 products:");
  (result.products || []).slice(0, 5).forEach((p, i) => {
    console.log(`  #${i + 1}: [ID: ${p.id}] ${p.name.slice(0, 60)} | Score: ${p.matchScore} | Tier: ${p.matchTier} | Reasons: ${p.matchedReasons?.join(", ")}`);
  });
}

runTest().catch(console.error);
