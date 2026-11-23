const fs = require('fs');
const content = fs.readFileSync('C:/Users/mdnah/.gemini/antigravity/brain/4a0ec98f-b643-4d8a-8324-6a10793efea6/.system_generated/logs/transcript.jsonl', 'utf8');
const lines = content.trim().split('\n');
const userInputs = [];
for (let i = 0; i < lines.length; i++) {
  try {
    const o = JSON.parse(lines[i]);
    if (o.type === 'USER_INPUT') {
      userInputs.push({ idx: i, item: o });
    }
  } catch (e) {}
}
console.log('Total user inputs:', userInputs.length);
userInputs.slice(-3).forEach(u => {
  console.log('----------------');
  console.log('Index:', u.idx);
  console.log('Text:', u.item.content || u.item.text || u.item.user_input);
  console.log('Keys:', Object.keys(u.item));
  if (u.item.files) console.log('Files:', u.item.files);
  if (u.item.attachments) console.log('Attachments:', u.item.attachments);
});
