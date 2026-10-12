const fs = require("fs");
const path = require("path");

const env = fs.readFileSync(path.join(__dirname, "../.env"), "utf8");
const match = env.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/);
const key = match ? match[1].trim() : "";
console.log("Key length:", key.length, "Prefix:", key.slice(0, 10));

async function test() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    console.log("List models status:", res.status);
    const data = await res.json();
    if (data.models) {
      const flashModels = data.models.map(m => m.name.replace("models/", "")).filter(m => m.includes("gemini") || m.includes("flash"));
      console.log("Found Gemini models:", flashModels);
    } else {
      console.log("Response:", JSON.stringify(data));
    }

    // Now test gemini-2.0-flash-lite specifically
    console.log("\nTesting gemini-2.0-flash-lite directly...");
    const genRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: "Respond in JSON: {\"status\": \"ok\", \"model\": \"gemini-2.0-flash-lite\"}" }] }
        ]
      })
    });
    console.log("gemini-2.0-flash-lite status:", genRes.status);
    const genData = await genRes.json();
    console.log("gemini-2.0-flash-lite response:", JSON.stringify(genData).slice(0, 300));

    // Also test gemini-2.0-flash
    console.log("\nTesting gemini-2.0-flash directly...");
    const flashRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: "Hello" }] }
        ]
      })
    });
    console.log("gemini-2.0-flash status:", flashRes.status);
    const flashData = await flashRes.json();
    console.log("gemini-2.0-flash response:", JSON.stringify(flashData).slice(0, 300));
  } catch (err) {
    console.error("Test error:", err);
  }
}

test();
