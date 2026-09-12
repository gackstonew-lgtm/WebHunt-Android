import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Simple CRC32 implementation for PNG chunks
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const chunkCrc = crc32(typeAndData);
  chunk.writeUInt32BE(chunkCrc, 8 + len);
  return chunk;
}

function createPng(width: number, height: number, isMaskable: boolean = false): Buffer {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // Generate RGBA raster
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  // WebHunt colors
  const black = [0x00, 0x00, 0x00, 0xff];
  const cardBg = [0x0d, 0x0d, 0x0d, 0xff];
  const coral = [0xf9, 0x5c, 0x4b, 0xff];
  const paper = [0xf6, 0xf4, 0xf1, 0xff];
  const sage = [0x5e, 0xba, 0x8c, 0xff];

  const padding = isMaskable ? width * 0.15 : width * 0.08;
  const rectLeft = padding;
  const rectRight = width - padding;
  const rectTop = padding;
  const rectBottom = height - padding;
  const cornerRadius = (rectRight - rectLeft) * 0.2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Check rounded rect boundaries
      const inX = x >= rectLeft && x <= rectRight;
      const inY = y >= rectTop && y <= rectBottom;

      let inCard = false;
      let isBorder = false;

      if (inX && inY) {
        // Corner check
        let dist = 0;
        let inCorner = false;
        if (x < rectLeft + cornerRadius && y < rectTop + cornerRadius) {
          dist = Math.hypot(x - (rectLeft + cornerRadius), y - (rectTop + cornerRadius));
          inCorner = true;
        } else if (x > rectRight - cornerRadius && y < rectTop + cornerRadius) {
          dist = Math.hypot(x - (rectRight - cornerRadius), y - (rectTop + cornerRadius));
          inCorner = true;
        } else if (x < rectLeft + cornerRadius && y > rectBottom - cornerRadius) {
          dist = Math.hypot(x - (rectLeft + cornerRadius), y - (rectBottom - cornerRadius));
          inCorner = true;
        } else if (x > rectRight - cornerRadius && y > rectBottom - cornerRadius) {
          dist = Math.hypot(x - (rectRight - cornerRadius), y - (rectBottom - cornerRadius));
          inCorner = true;
        }

        if (!inCorner || dist <= cornerRadius) {
          inCard = true;
          const borderWidth = Math.max(2, width * 0.025);
          if (
            (inCorner && dist >= cornerRadius - borderWidth) ||
            (!inCorner &&
              (x <= rectLeft + borderWidth ||
                x >= rectRight - borderWidth ||
                y <= rectTop + borderWidth ||
                y >= rectBottom - borderWidth))
          ) {
            isBorder = true;
          }
        }
      }

      // Draw stylized "W" & Radar dot inside card
      let isGlyph = false;
      let isRadarDot = false;

      if (inCard && !isBorder) {
        const cx = width / 2;
        const cy = height / 2 + height * 0.02;
        const scale = (width - padding * 2) / 100;

        // Radar pulse dot at top right inside card
        const dotX = rectRight - (rectRight - rectLeft) * 0.25;
        const dotY = rectTop + (rectBottom - rectTop) * 0.25;
        const dotDist = Math.hypot(x - dotX, y - dotY);
        if (dotDist <= scale * 5) {
          isRadarDot = true;
        }

        // Draw "W" strokes
        const lx = (x - cx) / scale;
        const ly = (y - cy) / scale;

        // W consists of 4 diagonal strokes:
        // Stroke 1: (-24, -18) to (-12, 18)
        // Stroke 2: (-12, 18) to (0, -4)
        // Stroke 3: (0, -4) to (12, 18)
        // Stroke 4: (12, 18) to (24, -18)
        const strokeWidth = 6.5;

        function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
          const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
          if (l2 === 0) return Math.hypot(px - x1, py - y1);
          let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
          t = Math.max(0, Math.min(1, t));
          return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
        }

        const d1 = distToSegment(lx, ly, -22, -18, -11, 18);
        const d2 = distToSegment(lx, ly, -11, 18, 0, -5);
        const d3 = distToSegment(lx, ly, 0, -5, 11, 18);
        const d4 = distToSegment(lx, ly, 11, 18, 22, -18);

        if (Math.min(d1, d2, d3, d4) <= strokeWidth / 2) {
          isGlyph = true;
        }
      }

      // Color selection
      let col = black;
      if (isRadarDot) {
        col = paper;
      } else if (isGlyph || isBorder) {
        col = coral;
      } else if (inCard) {
        col = cardBg;
      }

      rawData[pixelOffset] = col[0];
      rawData[pixelOffset + 1] = col[1];
      rawData[pixelOffset + 2] = col[2];
      rawData[pixelOffset + 3] = col[3];
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

async function generateAllIcons() {
  const iconsDir = path.join(process.cwd(), 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('[PWA Icons] Generating standard WebHunt PWA icons...');

  const icon192 = createPng(192, 192, false);
  fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), icon192);
  console.log('✅ Generated public/icons/icon-192.png');

  const icon512 = createPng(512, 512, false);
  fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512);
  console.log('✅ Generated public/icons/icon-512.png');

  const appleTouch = createPng(180, 180, false);
  fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), appleTouch);
  console.log('✅ Generated public/icons/apple-touch-icon.png');

  const maskable192 = createPng(192, 192, true);
  fs.writeFileSync(path.join(iconsDir, 'maskable-192.png'), maskable192);
  console.log('✅ Generated public/icons/maskable-192.png');

  const maskable512 = createPng(512, 512, true);
  fs.writeFileSync(path.join(iconsDir, 'maskable-512.png'), maskable512);
  console.log('✅ Generated public/icons/maskable-512.png');

  console.log('[PWA Icons] All icons generated successfully.');
}

generateAllIcons().catch((err) => {
  console.error('[PWA Icons] Error:', err);
  process.exit(1);
});
