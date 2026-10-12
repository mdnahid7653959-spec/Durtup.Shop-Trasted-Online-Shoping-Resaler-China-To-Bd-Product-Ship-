const fs = require('fs');
const path = require('path');

const cameraImageMap = {
  // A9 Wi-Fi Night Vision Mini IP Camera
  "87": "https://img.drz.lazcdn.com/g/kf/Sec2b1daa39534496942b05d978d99040g.jpg_720x720q80.jpg",
  // V380 Pro Dual Lens 1080P WiFi Security Camera
  "5125": "https://img.drz.lazcdn.com/static/bd/p/70d7c24ecfcbd4c8615cb5c952bc426a.jpg_720x720q80.jpg",
  // Smart 360° Rotated Bulb WiFi Security Camera HD 1080P
  "2431": "https://img.drz.lazcdn.com/static/bd/p/4154d27d204df90add314e4f05b378ac.jpg_720x720q80.jpg",
  // V380 SQ002 3MP Bulb WiFi IP Camera
  "6796": "https://img.drz.lazcdn.com/static/bd/p/4154d27d204df90add314e4f05b378ac.jpg_720x720q80.jpg",
  // V380 E9 Dual Lens Bulb PTZ IP Camera
  "9286": "https://img.drz.lazcdn.com/static/bd/p/4154d27d204df90add314e4f05b378ac.jpg_720x720q80.jpg",
  // Smart V380 Q9 Dual-Lens & Dual-Screen 8MP WiFi Home Security Camera
  "9303": "https://img.drz.lazcdn.com/static/bd/p/70d7c24ecfcbd4c8615cb5c952bc426a.jpg_720x720q80.jpg",
  // V380 Dual Lens 8MP Outdoor WiFi Security Camera
  "9304": "https://img.drz.lazcdn.com/static/bd/p/022277b51ad6d2516a503a08ca032d5c.jpg_720x720q80.jpg",
  // V380 Full HD Q1 360 Degree WiFi IP Security Mini Camera
  "9305": "https://img.drz.lazcdn.com/static/bd/p/1ca37081509bd3b71686d504d0cb21ff.jpg_720x720q80.jpg",
  // New V380 Mini Indoor PTZ Dual Lens 4MP HD Smart Home WiFi
  "9306": "https://img.drz.lazcdn.com/static/bd/p/56b97b289e2d1eca33cab53fd40582db.png_720x720q80.png",
  // V380 Pro Dual Lens 4G SIM Supported Security Camera
  "10004": "https://img.drz.lazcdn.com/static/bd/p/022277b51ad6d2516a503a08ca032d5c.jpg_720x720q80.jpg",
  // W8 Mini FHD Portable Hidden Spy Pen Camera
  "2283": "https://img.drz.lazcdn.com/static/bd/p/56b97b289e2d1eca33cab53fd40582db.png_720x720q80.png"
};

function patchFile(filepath) {
  if (!fs.existsSync(filepath)) {
    console.log('Skipping missing:', filepath);
    return;
  }
  console.log('Patching:', filepath);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  let updated = 0;
  
  if (Array.isArray(data)) {
    for (const item of data) {
      const idStr = String(item.id);
      if (cameraImageMap[idStr]) {
        const correctUrl = cameraImageMap[idStr];
        item.image = correctUrl;
        if (item.image_url) item.image_url = correctUrl;
        if (Array.isArray(item.images)) {
          item.images = [correctUrl, ...item.images.filter(x => x !== correctUrl)];
        }
        if (Array.isArray(item.product_images)) {
          item.product_images = [
            { id: 'img-0', image_url: correctUrl, is_primary: true, sort_order: 0 },
            ...item.product_images.filter(x => (x.image_url || x) !== correctUrl)
          ];
        }
        updated++;
        console.log(`  Updated ${idStr}: ${item.name ? item.name.slice(0, 40) : ''}`);
      }
    }
  }
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${filepath} (${updated} items updated)`);
}

patchFile(path.resolve('public/mohasagor_catalog_slim.json'));
patchFile(path.resolve('public/mohasagor_catalog.json'));
patchFile(path.resolve('public/visual_index.json'));
