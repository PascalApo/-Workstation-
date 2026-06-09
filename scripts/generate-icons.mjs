// Generiert PWA-Icons (PNG) ohne externe Abhängigkeiten.
// Aufruf: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'icons')
mkdirSync(outDir, { recursive: true })

// ---------- PNG-Encoder ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0 // Filter: none
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------- Zeichnen ----------
function lerp(a, b, t) {
  return a + (b - a) * t
}

function inRoundedRect(px, py, x, y, w, h, r) {
  if (px < x || px >= x + w || py < y || py >= y + h) return false
  const cx = Math.max(x + r, Math.min(px, x + w - r))
  const cy = Math.max(y + r, Math.min(py, y + h - r))
  const dx = px - cx
  const dy = py - cy
  return dx * dx + dy * dy <= r * r || (px >= x + r && px < x + w - r) || (py >= y + r && py < y + h - r)
}

function renderIcon(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4)
  const u = size / 512 // Skalierungseinheit (Design auf 512 ausgelegt)

  // Hintergrund-Gradient: Indigo → Violett (diagonal)
  const bgTop = [49, 46, 129] // indigo-900
  const bgBot = [109, 40, 217] // violet-700
  const cornerR = maskable ? 0 : 96 * u

  // Kalender-Karte (bei maskable mehr Innenabstand für die sichere Zone)
  const pad = maskable ? 120 * u : 96 * u
  const cardX = pad
  const cardY = pad + 16 * u
  const cardW = size - pad * 2
  const cardH = size - pad * 2 - 16 * u
  const cardR = 40 * u
  const headerH = cardH * 0.26

  // Punkte-Raster (3×2) im Kartenkörper
  const dotR = 26 * u
  const cols = [0.26, 0.5, 0.74]
  const rows = [0.5, 0.78]
  const dots = []
  for (const ry of rows)
    for (const rx of cols)
      dots.push([cardX + cardW * rx, cardY + cardH * ry])

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const t = (x + y) / (2 * size)

      // Außenbereich (abgerundete Ecken) transparent lassen
      if (!maskable && !inRoundedRect(x, y, 0, 0, size, size, cornerR)) {
        buf[i + 3] = 0
        continue
      }

      let r = lerp(bgTop[0], bgBot[0], t)
      let g = lerp(bgTop[1], bgBot[1], t)
      let b = lerp(bgTop[2], bgBot[2], t)

      if (inRoundedRect(x, y, cardX, cardY, cardW, cardH, cardR)) {
        if (y < cardY + headerH) {
          // Header-Balken: kräftiges Violett
          r = 139
          g = 92
          b = 246
        } else {
          // Kartenkörper: fast weiß
          r = 241
          g = 245
          b = 249
        }
        // Punkte: letzter = Emerald (Akzent), Rest = Slate
        for (let d = 0; d < dots.length; d++) {
          const [dx, dy] = dots[d]
          const dist = (x - dx) * (x - dx) + (y - dy) * (y - dy)
          if (dist <= dotR * dotR) {
            if (d === dots.length - 1) {
              r = 16
              g = 185
              b = 129 // emerald-500
            } else {
              r = 100
              g = 116
              b = 139 // slate-500
            }
          }
        }
      }

      // Ringbinder oben (zwei kleine Stege über dem Header)
      const ringW = 20 * u
      const ringH = 56 * u
      const ringY = cardY - ringH * 0.55
      for (const rx of [0.3, 0.7]) {
        const ringX = cardX + cardW * rx - ringW / 2
        if (inRoundedRect(x, y, ringX, ringY, ringW, ringH, ringW / 2)) {
          r = 224
          g = 231
          b = 255 // indigo-100
        }
      }

      buf[i] = Math.round(r)
      buf[i + 1] = Math.round(g)
      buf[i + 2] = Math.round(b)
      buf[i + 3] = 255
    }
  }
  return encodePng(size, size, buf)
}

writeFileSync(join(outDir, 'icon-192.png'), renderIcon(192))
writeFileSync(join(outDir, 'icon-512.png'), renderIcon(512))
writeFileSync(join(outDir, 'icon-maskable-512.png'), renderIcon(512, { maskable: true }))

// Icon für die Chrome-Erweiterung
const extDir = join(root, 'chrome-extension')
mkdirSync(extDir, { recursive: true })
writeFileSync(join(extDir, 'icon-128.png'), renderIcon(128))

console.log('Icons erzeugt: public/icons/ (192, 512, maskable) + chrome-extension/icon-128.png')
