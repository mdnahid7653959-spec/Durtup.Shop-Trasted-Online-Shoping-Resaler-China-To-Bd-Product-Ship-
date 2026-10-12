const fs = require("fs");
const path = require("path");

const env = fs.readFileSync(path.join(__dirname, "../.env"), "utf8");
const match = env.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/);
const key = match ? match[1].trim() : "";

// Create a small 1x1 png base64 for testing
const testBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function testCandidate(model) {
  console.log(`\nTesting ${model} with image input...`);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "Describe what you see in JSON: {\"color\": \"string\"}" },
              {
                inline_data: {
                  mime_type: "image/png",
                  data: testBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      })
    });
    console.log(`${model} status:`, res.status);
    const data = await res.json();
    console.log(`${model} response text:`, data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data).slice(0, 200));
  } catch (e) {
    console.error(`${model} error:`, e.message);
  }
}

async function run() {
  await testCandidate("gemini-3.5-flash-lite");
  await testCandidate("gemini-flash-lite-latest");
  await testCandidate("gemini-2.5-flash-lite");
  await testCandidate("gemini-3.1-flash-lite");
}

run();
