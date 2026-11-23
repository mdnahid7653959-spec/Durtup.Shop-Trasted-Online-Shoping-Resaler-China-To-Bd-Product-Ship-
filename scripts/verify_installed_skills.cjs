const fs = require('fs');
const path = require('path');

const skillsDir = path.resolve('.agents', 'skills');

if (!fs.existsSync(skillsDir)) {
  console.error("❌ .agents/skills directory does not exist!");
  process.exit(1);
}

const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
const skillFolders = entries.filter(e => e.isDirectory()).map(e => e.name);

console.log("=================================================");
console.log(`🔍 AUDITING ${skillFolders.length} INSTALLED AGENT SKILLS`);
console.log("=================================================");

let passed = 0;
let errors = [];

for (const folder of skillFolders) {
  const skillFile = path.join(skillsDir, folder, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    errors.push(`❌ ${folder}: Missing SKILL.md file`);
    continue;
  }

  const content = fs.readFileSync(skillFile, 'utf8');
  // Check YAML frontmatter
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    errors.push(`❌ ${folder}: Missing or invalid YAML frontmatter in SKILL.md`);
    continue;
  }

  const frontmatter = match[1];
  const hasName = /name:\s*([^\r\n]+)/.test(frontmatter);
  const hasDesc = /description:\s*([^\r\n]+)/.test(frontmatter);

  if (!hasName) {
    errors.push(`❌ ${folder}: Missing 'name' in YAML frontmatter`);
    continue;
  }
  if (!hasDesc) {
    errors.push(`❌ ${folder}: Missing 'description' in YAML frontmatter`);
    continue;
  }

  const nameMatch = frontmatter.match(/name:\s*["']?([^"'\r\n]+)["']?/);
  const skillName = nameMatch ? nameMatch[1].trim() : folder;

  console.log(`✔ [OK] ${skillName} (${folder}) - Valid SKILL.md & Frontmatter`);
  passed++;
}

console.log("\n=================================================");
console.log(`📊 RESULTS: ${passed}/${skillFolders.length} SKILLS VALIDATED`);
if (errors.length > 0) {
  console.error("Errors found:", errors);
  process.exit(1);
} else {
  console.log("🎉 ALL INSTALLED SKILLS MEET ANTIGRAVITY SPECIFICATIONS!");
  console.log("=================================================");
}
