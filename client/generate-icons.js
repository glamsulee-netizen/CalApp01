import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUT_DIR = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function generateIcon(size) {
  // SVG scales nicely. We define it as 512x512 and then scale it down using sharp.
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Sleek iOS-style linear gradient (Blue to Purple to Pink) -->
        <linearGradient id="bg" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stop-color="#1D4ED8" /> <!-- Blue 700 -->
          <stop offset="50%" stop-color="#7C3AED" /> <!-- Violet 600 -->
          <stop offset="100%" stop-color="#DB2777" /> <!-- Pink 600 -->
        </linearGradient>
        
        <!-- Subtle drop shadow for the text -->
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.25"/>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="512" height="512" fill="url(#bg)" />
      
      <!-- Subtle top inner glow for a premium 3D feel -->
      <path d="M 0 0 L 512 0 L 512 10 L 0 10 Z" fill="#ffffff" opacity="0.1" />

      <!-- Text: "blizz.nails" perfectly centered -->
      <text 
        x="256" 
        y="280" 
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
        font-size="82" 
        font-weight="800"
        letter-spacing="-1.5"
        fill="#ffffff" 
        text-anchor="middle" 
        filter="url(#shadow)">
        blizz.nails
      </text>
    </svg>
  `;

  const fileName = `icon-${size}x${size}.png`;
  const filePath = path.join(OUT_DIR, fileName);

  try {
    await sharp(Buffer.from(svg))
      .png()
      .toFile(filePath);
    console.log(`✅ Created \${fileName}`);
  } catch (error) {
    console.error(`❌ Error creating \${fileName}:`, error);
  }
}

async function main() {
  console.log('Generating premium PWA icons for blizz.nails...');
  for (const size of SIZES) {
    await generateIcon(size);
  }
  console.log('Done!');
}

main().catch(console.error);
