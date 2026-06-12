// Generates the placeholder hero illustration at public/hero/shipday-workspace.png.
// Hand-rolled PNG encoder (no image library, no browser) so the layout is
// correct before the final illustration lands. The final asset is a 16:9 PNG
// dropped at the same path; replacing the file needs no code change.
//
// Run: node scripts/gen-hero-placeholder.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const W = 1600;
const H = 900;

// CRC32 table for PNG chunk checksums.
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

// Raw RGB scanlines with a filter byte (0) per row.
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y += 1) {
  const rowStart = y * (1 + W * 3);
  raw[rowStart] = 0; // filter: none
  const ty = y / H;
  for (let x = 0; x < W; x += 1) {
    // Vertical gradient: void at top to a slightly raised base at the bottom.
    let r = lerp(7, 13, ty);
    let g = lerp(9, 17, ty);
    let b = lerp(13, 24, ty);

    // Soft accent glow above the centre, like a screen lighting the room.
    const dx = (x - W * 0.5) / W;
    const dy = (y - H * 0.42) / H;
    const glow = Math.max(0, 1 - (dx * dx + dy * dy) * 7);
    r += 91 * 0.16 * glow;
    g += 168 * 0.16 * glow;
    b += 245 * 0.16 * glow;

    // Faint engineering grid.
    if (x % 80 === 0 || y % 80 === 0) {
      r += 10;
      g += 12;
      b += 16;
    }

    // Centre placeholder frame with a diagonal cross, so it reads as a
    // placeholder rather than final art.
    const ix = W * 0.3;
    const iy = H * 0.3;
    const onFrame =
      (Math.abs(x - ix) < 2 || Math.abs(x - (W - ix)) < 2) && y > iy && y < H - iy
        ? true
        : (Math.abs(y - iy) < 2 || Math.abs(y - (H - iy)) < 2) && x > ix && x < W - ix;
    const inBox = x > ix && x < W - ix && y > iy && y < H - iy;
    const u = (x - ix) / (W - 2 * ix);
    const v = (y - iy) / (H - 2 * iy);
    const onCross = inBox && (Math.abs(u - v) < 0.004 || Math.abs(u - (1 - v)) < 0.004);
    if (onFrame || onCross) {
      r = lerp(r, 56, 0.7);
      g = lerp(g, 68, 0.7);
      b = lerp(b, 88, 0.7);
    }

    const o = rowStart + 1 + x * 3;
    raw[o] = clamp(r);
    raw[o + 1] = clamp(g);
    raw[o + 2] = clamp(b);
  }
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // colour type: RGB
const png = Buffer.concat([
  sig,
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

mkdirSync("public/hero", { recursive: true });
writeFileSync("public/hero/shipday-workspace.png", png);
console.log(`wrote public/hero/shipday-workspace.png (${W}x${H}, ${png.length} bytes)`);
