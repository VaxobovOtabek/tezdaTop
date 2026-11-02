const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_IMAGE = 'C:/Users/User/.gemini/antigravity/brain/56573c23-3bd6-4305-be82-f68df6c924d4/.user_uploaded/media_1793355546787_87f9571a.png';

async function generateAll() {
  console.log('Reading source image:', SOURCE_IMAGE);
  const { data, info } = await sharp(SOURCE_IMAGE).raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // 1. Flood-fill background detection
  const isBg = new Uint8Array(width * height);
  const queue = [0, width - 1, (height - 1) * width, height * width - 1];
  queue.forEach(idx => { isBg[idx] = 1; });

  let head = 0;
  while(head < queue.length) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    const neighbors = [];
    if (cx > 0) neighbors.push(curr - 1);
    if (cx < width - 1) neighbors.push(curr + 1);
    if (cy > 0) neighbors.push(curr - width);
    if (cy < height - 1) neighbors.push(curr + width);

    for (const n of neighbors) {
      if (!isBg[n]) {
        const idx = n * 4;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        if (r > 235 && g > 235 && b > 235) {
          isBg[n] = 1;
          queue.push(n);
        }
      }
    }
  }

  // 2. Clear background alpha with anti-aliasing
  const transparentBuf = Buffer.from(data);
  for (let i = 0; i < width * height; i++) {
    if (isBg[i]) transparentBuf[i * 4 + 3] = 0;
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (!isBg[i]) {
        if (isBg[i-1] || isBg[i+1] || isBg[i-width] || isBg[i+width]) {
          const idx = i * 4;
          const whiteness = Math.min(transparentBuf[idx], transparentBuf[idx+1], transparentBuf[idx+2]);
          if (whiteness > 180) {
            transparentBuf[idx + 3] = Math.max(0, Math.min(255, Math.round((255 - whiteness) * 255 / 75)));
          }
        }
      }
    }
  }

  // 3. Trimmed squircle buffer
  const baseSquircle = await sharp(transparentBuf, { raw: { width, height, channels: 4 } })
    .trim()
    .png()
    .toBuffer();

  console.log('Base squircle prepared.');

  // Helper function to create centered icon on transparent square
  async function createSquareIcon(size, paddingRatio = 0.96) {
    const iconSize = Math.round(size * paddingRatio);
    const resized = await sharp(baseSquircle)
      .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    return await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: resized, gravity: 'center' }])
      .png({ quality: 100, compressionLevel: 9 })
      .toBuffer();
  }

  // Helper function to create full-bleed maskable icon (80% safe zone)
  async function createMaskableIcon(size) {
    const bgSvg = Buffer.from(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0FB165" />
            <stop offset="100%" stop-color="#077D5B" />
          </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" fill="url(#grad)" />
      </svg>
    `);

    // In maskable icon, 80% safe zone
    const innerSize = Math.round(size * 0.78);
    const squircle = await sharp(baseSquircle)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    return await sharp(bgSvg)
      .composite([{ input: squircle, gravity: 'center' }])
      .png({ quality: 100, compressionLevel: 9 })
      .toBuffer();
  }

  // Helper for apple-touch-icon (180x180, full-bleed so iOS rounded mask never shows black corners)
  async function createAppleTouchIcon() {
    const bgSvg = Buffer.from(`
      <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0FB165" />
            <stop offset="100%" stop-color="#077D5B" />
          </linearGradient>
        </defs>
        <rect width="180" height="180" fill="url(#grad)" />
      </svg>
    `);

    const innerSquircle = await sharp(baseSquircle)
      .resize(176, 176, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    return await sharp(bgSvg)
      .composite([{ input: innerSquircle, gravity: 'center' }])
      .png({ quality: 100, compressionLevel: 9 })
      .toBuffer();
  }

  // Generate all sizes
  console.log('Generating high-res PNG buffers...');
  const icon512 = await createSquareIcon(512, 0.96);
  const icon192 = await createSquareIcon(192, 0.96);
  const maskable512 = await createMaskableIcon(512);
  const maskable192 = await createMaskableIcon(192);
  const appleTouch = await createAppleTouchIcon();
  const favicon128 = await createSquareIcon(128, 0.96);
  const favicon96 = await createSquareIcon(96, 0.96);
  const favicon48 = await createSquareIcon(48, 0.96);

  // Generate SVG icon
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="yaqinTopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0FB165"/>
      <stop offset="100%" stop-color="#077D5B"/>
    </linearGradient>
  </defs>
  <rect x="65" y="76" width="892" height="878" rx="240" ry="240" fill="url(#yaqinTopGrad)"/>
  <path d="M 327,360 L 451,360 L 511.5,489 L 573,360 L 695,360 L 567,580 L 567,741 L 453,741 L 453,580 Z" fill="#FFFFFF"/>
</svg>
`;

  // Targets to write
  const publicDirs = [
    'apps/customer/public',
    'apps/landing/public',
    'apps/merchant/public',
    'apps/admin/public',
    'apps/moderator/public'
  ];

  for (const pDir of publicDirs) {
    if (!fs.existsSync(pDir)) continue;

    console.log('Writing assets to:', pDir);
    // Write root favicons and apple-touch-icon
    fs.writeFileSync(path.join(pDir, 'apple-touch-icon.png'), appleTouch);
    fs.writeFileSync(path.join(pDir, 'favicon-48x48.png'), favicon48);
    fs.writeFileSync(path.join(pDir, 'favicon-96x96.png'), favicon96);
    fs.writeFileSync(path.join(pDir, 'favicon.png'), favicon128);
    fs.writeFileSync(path.join(pDir, 'favicon.ico'), favicon48); // 48x48 PNG ico
    fs.writeFileSync(path.join(pDir, 'favicon.svg'), svgContent);

    // Write icons folder if exists or for customer/landing/merchant
    const iconsDir = path.join(pDir, 'icons');
    if (fs.existsSync(iconsDir) || pDir.includes('customer') || pDir.includes('landing') || pDir.includes('merchant')) {
      if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });
      fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512);
      fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), icon192);
      fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), maskable512);
      fs.writeFileSync(path.join(iconsDir, 'icon-maskable-192.png'), maskable192);
      fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);
    }
  }

  console.log('All icons generated and deployed successfully!');
}

generateAll().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
