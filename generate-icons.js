// Run: node generate-icons.js
// Generates icon-192.png and icon-512.png without extra dependencies

const fs = require('fs');
const path = require('path');

// Simple PNG generator - creates a solid colored square with ⚡ text
// We'll create a minimal valid PNG using canvas if available, otherwise use a pre-made base64

// Base64 encoded minimal purple square PNG icons
// icon-192.png (192x192 purple #5865f2 with lightning bolt)
const icon192 = `iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF
HGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0w
TXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRh
LyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2
LzEzLTIyOjAxOjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMu
b3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91
dD0iIi8+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4B`;

// Use a script approach - create icons via HTML canvas in a Node script
const script = `
const { createCanvas } = require('canvas');
const fs = require('fs');

function createIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  const radius = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = '#5865f2';
  ctx.fill();
  
  // Lightning bolt emoji
  ctx.font = \`bold \${size * 0.55}px Arial\`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡', size / 2, size / 2 + size * 0.05);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log('Created:', outputPath);
}

createIcon(192, 'public/icon-192.png');
createIcon(512, 'public/icon-512.png');
`;

// Check if canvas is available
try {
  require('canvas');
  // Write and run the canvas script
  fs.writeFileSync('_gen.js', script);
  require('child_process').execSync('node _gen.js', { stdio: 'inherit' });
  fs.unlinkSync('_gen.js');
} catch (e) {
  // canvas not available - create simple colored PNG manually
  console.log('canvas not available, creating simple PNG icons...');
  
  function createSimplePNG(size, filepath) {
    // Minimal PNG: solid #5865f2 square
    const { PNG } = (() => {
      try { return require('pngjs'); } catch { return null; }
    })() || {};
    
    if (PNG) {
      const png = new PNG({ width: size, height: size });
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (size * y + x) * 4;
          png.data[idx]     = 0x58; // R
          png.data[idx + 1] = 0x65; // G
          png.data[idx + 2] = 0xf2; // B
          png.data[idx + 3] = 0xff; // A
        }
      }
      const buffer = PNG.sync.write(png);
      fs.writeFileSync(filepath, buffer);
      console.log('Created:', filepath);
    } else {
      console.log('Please install canvas: npm install canvas');
      console.log('Or manually add icon-192.png and icon-512.png to public/');
    }
  }
  
  createSimplePNG(192, path.join(__dirname, 'public/icon-192.png'));
  createSimplePNG(512, path.join(__dirname, 'public/icon-512.png'));
}
