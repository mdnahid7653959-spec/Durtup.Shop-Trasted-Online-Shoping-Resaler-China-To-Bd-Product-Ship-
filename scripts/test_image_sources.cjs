const fs = require('fs');
const path = require('path');

// Read .env
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
let supabaseUrl = '', supabaseKey = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, image, images, category')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('DB error:', error);
    return;
  }

  console.log(`Retrieved ${data.length} newest products:`);
  for (const p of data) {
    console.log(`- ID: ${p.id} | Name: ${p.name.substring(0, 35)}... | Image: ${p.image}`);
  }
}

check();
