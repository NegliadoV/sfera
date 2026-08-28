const fs = require('fs');
const path = require('path');

const publicIconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(publicIconsDir)) {
  fs.mkdirSync(publicIconsDir, { recursive: true });
}

const brainDir = 'C:\\Users\\stanis\\.gemini\\antigravity-ide\\brain\\3e2b0b18-dc7d-491c-8c5f-e9c063ebb8f7';

const mappings = [
  { prefix: 'quantum_room_icon_', dest: 'quantum.png' },
  { prefix: 'philosophy_room_icon_', dest: 'philosophy.png' },
  { prefix: 'cosmic_room_icon_', dest: 'cosmic.png' },
  { prefix: 'gossip_room_icon_', dest: 'gossip.png' },
  { prefix: 'embroidery_room_icon_', dest: 'embroidery.png' },
  { prefix: 'urbanism_room_icon_', dest: 'urbanism.png' },
  { prefix: 'sea_room_icon_', dest: 'sea.png' },
];

try {
  const dirFiles = fs.readdirSync(brainDir);
  mappings.forEach(({ prefix, dest }) => {
    const file = dirFiles.find(f => f.startsWith(prefix) && f.endsWith('.png'));
    if (file) {
      fs.copyFileSync(path.join(brainDir, file), path.join(publicIconsDir, dest));
      console.log(`Copied ${dest}`);
    }
  });
} catch (e) {
  console.error('Error copying icons:', e);
}
