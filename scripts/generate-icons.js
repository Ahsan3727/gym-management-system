const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function generatePng(size) {
  const width = size;
  const height = size;
  
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Generate image buffer (filter byte + RGBA per pixel per row)
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(rowBytes * height);

  // Color constants
  // Background: #0f172a (15, 23, 42)
  const bgR = 15, bgG = 23, bgB = 42;
  // Accent: #e11d48 (225, 29, 72)
  const acR = 225, acG = 29, acB = 72;
  // Barbell bar: #f8fafc (248, 250, 252)
  const brR = 248, brG = 250, brB = 252;

  const cx = size / 2;
  const cy = size / 2;
  const cornerRadius = size * 0.22;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      
      // Rounded rect check
      let inBounds = true;
      const dx = Math.min(x, width - 1 - x);
      const dy = Math.min(y, height - 1 - y);
      if (dx < cornerRadius && dy < cornerRadius) {
        const dist = Math.hypot(cornerRadius - dx, cornerRadius - dy);
        if (dist > cornerRadius) {
          inBounds = false;
        }
      }

      if (!inBounds) {
        // Transparent outside rounded icon
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
        continue;
      }

      // Normalized coordinates from center (-1 to 1)
      const nx = (x - cx) / (size * 0.45);
      const ny = (y - cy) / (size * 0.45);

      let r = bgR, g = bgG, b = bgB, a = 255;

      // Barbell bar: horizontal line
      if (Math.abs(ny) <= 0.08 && Math.abs(nx) <= 0.8) {
        r = brR; g = brG; b = brB;
      }

      // Outer plates (left and right)
      if ((Math.abs(nx + 0.65) <= 0.09 || Math.abs(nx - 0.65) <= 0.09) && Math.abs(ny) <= 0.45) {
        r = acR; g = acG; b = acB;
      }

      // Inner plates (left and right)
      if ((Math.abs(nx + 0.42) <= 0.06 || Math.abs(nx - 0.42) <= 0.06) && Math.abs(ny) <= 0.32) {
        r = acR; g = acG; b = acB;
      }

      // Center plate / emblem
      const centerDist = Math.hypot(nx, ny);
      if (centerDist <= 0.16) {
        r = acR; g = acG; b = acB;
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(__dirname, '../frontend/public');
const icon192 = generatePng(192);
const icon512 = generatePng(512);

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);

console.log('Successfully generated icon-192.png and icon-512.png in frontend/public/');
