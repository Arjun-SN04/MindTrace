// Procedurally generated textures. No external image assets are needed.

import * as THREE from 'three';

type Draw = (ctx: CanvasRenderingContext2D, size: number) => void;

let seed = 1337;
export function rand() {
  // Deterministic so the city looks the same every load.
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

function canvasTexture(size: number, draw: Draw, color = true, repeat = 1): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  if (color) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function speckle(ctx: CanvasRenderingContext2D, size: number, count: number, min: number, max: number, alpha: number) {
  for (let i = 0; i < count; i++) {
    const v = Math.floor(min + rand() * (max - min));
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha})`;
    const s = 1 + rand() * 2;
    ctx.fillRect(rand() * size, rand() * size, s, s);
  }
}

function blobs(ctx: CanvasRenderingContext2D, size: number, count: number, color: string, rMin: number, rMax: number) {
  for (let i = 0; i < count; i++) {
    const x = rand() * size, y = rand() * size, r = rMin + rand() * (rMax - rMin);
    for (const [dx, dy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]]) {
      const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x + dx, y + dy, r, r * (0.5 + rand() * 0.5), rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

const cache = new Map<string, THREE.Texture>();
function cached(key: string, make: () => THREE.Texture) {
  let t = cache.get(key);
  if (!t) {
    t = make();
    cache.set(key, t);
  }
  return t;
}

// Textures are authored at "1 texture = N metres"; geometry UVs are in metres,
// so repeat = 1 / N.

export const tex = {
  asphalt: () =>
    cached('asphalt', () =>
      canvasTexture(512, (c, s) => {
        c.fillStyle = '#26282d';
        c.fillRect(0, 0, s, s);
        speckle(c, s, 9000, 20, 70, 0.6);
        blobs(c, s, 10, 'rgba(10,10,14,0.5)', 30, 90);
        c.strokeStyle = 'rgba(12,12,14,0.8)';
        c.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
          c.beginPath();
          let x = rand() * s, y = rand() * s;
          c.moveTo(x, y);
          for (let k = 0; k < 8; k++) c.lineTo((x += (rand() - 0.5) * 40), (y += (rand() - 0.5) * 40));
          c.stroke();
        }
      }, true, 1 / 6),
    ),
  /** Roughness map: dark blobs = puddles (smooth, reflective). */
  asphaltRough: () =>
    cached('asphaltRough', () =>
      canvasTexture(512, (c, s) => {
        c.fillStyle = '#9a9a9a';
        c.fillRect(0, 0, s, s);
        speckle(c, s, 6000, 120, 200, 0.5);
        blobs(c, s, 16, 'rgba(10,10,10,0.95)', 25, 80);
      }, false, 1 / 6),
    ),
  /** Seamless fractal noise (grey) used as an organic puddle mask. */
  puddles: () =>
    cached('puddles', () => {
      const size = 256;
      const lattice = (period: number) => {
        const g = new Float32Array(period * period);
        for (let i = 0; i < g.length; i++) g[i] = rand();
        return (x: number, y: number) => {
          const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
          const at = (a: number, b: number) => g[((b % period) + period) % period * period + (((a % period) + period) % period)];
          const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
          const top = at(xi, yi) * (1 - sx) + at(xi + 1, yi) * sx;
          const bot = at(xi, yi + 1) * (1 - sx) + at(xi + 1, yi + 1) * sx;
          return top * (1 - sy) + bot * sy;
        };
      };
      const octaves = [4, 8, 16, 32].map((p) => ({ p, f: lattice(p) }));
      return canvasTexture(size, (c, s) => {
        const img = c.createImageData(s, s);
        for (let y = 0; y < s; y++)
          for (let x = 0; x < s; x++) {
            let v = 0, amp = 0.5, norm = 0;
            for (const o of octaves) {
              v += o.f((x / s) * o.p, (y / s) * o.p) * amp;
              norm += amp;
              amp *= 0.5;
            }
            const n = Math.round((v / norm) * 255);
            const i = (y * s + x) * 4;
            img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
            img.data[i + 3] = 255;
          }
        c.putImageData(img, 0, 0);
      }, false, 1);
    }),
  concrete: () =>
    cached('concrete', () =>
      canvasTexture(512, (c, s) => {
        c.fillStyle = '#5a5c60';
        c.fillRect(0, 0, s, s);
        speckle(c, s, 7000, 60, 120, 0.4);
        blobs(c, s, 6, 'rgba(30,32,36,0.35)', 40, 100);
        c.strokeStyle = 'rgba(25,25,28,0.9)';
        c.lineWidth = 3;
        for (let i = 0; i <= 2; i++) {
          c.beginPath(); c.moveTo((i * s) / 2, 0); c.lineTo((i * s) / 2, s); c.stroke();
          c.beginPath(); c.moveTo(0, (i * s) / 2); c.lineTo(s, (i * s) / 2); c.stroke();
        }
      }, true, 1 / 3),
    ),
  concreteRough: () =>
    cached('concreteRough', () =>
      canvasTexture(256, (c, s) => {
        c.fillStyle = '#b0b0b0';
        c.fillRect(0, 0, s, s);
        blobs(c, s, 8, 'rgba(30,30,30,0.9)', 15, 45);
      }, false, 1 / 3),
    ),
  brick: (tint = 'red') =>
    cached(`brick-${tint}`, () =>
      canvasTexture(512, (c, s) => {
        const palettes: Record<string, string[]> = {
          red: ['#5b2d26', '#6a3328', '#4e2620', '#723a2c', '#5f3027'],
          brown: ['#4a3b33', '#54443a', '#3f322b', '#5c4a3f'],
          grey: ['#3c3f45', '#45484f', '#34373c', '#4c4f56'],
        };
        const pal = palettes[tint] ?? palettes.red;
        c.fillStyle = '#2a2624';
        c.fillRect(0, 0, s, s);
        const rows = 16, cols = 8, bh = s / rows, bw = s / cols;
        for (let r = 0; r < rows; r++) {
          const off = (r % 2) * bw * 0.5;
          for (let k = -1; k < cols; k++) {
            c.fillStyle = pal[Math.floor(rand() * pal.length)];
            c.fillRect(k * bw + off + 2, r * bh + 2, bw - 4, bh - 4);
          }
        }
        speckle(c, s, 5000, 0, 60, 0.25);
        blobs(c, s, 5, 'rgba(0,0,0,0.25)', 60, 140);
      }, true, 1 / 3),
    ),
  plaster: (color = '#7b7f78') =>
    cached(`plaster-${color}`, () =>
      canvasTexture(256, (c, s) => {
        c.fillStyle = color;
        c.fillRect(0, 0, s, s);
        speckle(c, s, 3000, 90, 160, 0.08);
      }, true, 1 / 2),
    ),
  wood: () =>
    cached('wood', () =>
      canvasTexture(512, (c, s) => {
        const planks = 8, pw = s / planks;
        for (let i = 0; i < planks; i++) {
          const v = 70 + rand() * 30;
          c.fillStyle = `rgb(${v + 30},${v + 5},${v - 20})`;
          c.fillRect(i * pw, 0, pw, s);
          for (let g = 0; g < 40; g++) {
            c.strokeStyle = `rgba(40,22,10,${0.1 + rand() * 0.15})`;
            c.lineWidth = 1;
            const x = i * pw + rand() * pw;
            c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 4, s * 0.3, x - 4, s * 0.6, x + 2, s); c.stroke();
          }
          c.fillStyle = 'rgba(20,10,5,0.8)';
          c.fillRect(i * pw, 0, 2, s);
          const cut = rand() * s;
          c.fillRect(i * pw, cut, pw, 2);
        }
      }, true, 1 / 1.6),
    ),
  tiles: () =>
    cached('tiles', () =>
      canvasTexture(256, (c, s) => {
        const n = 4, t = s / n;
        for (let y = 0; y < n; y++)
          for (let x = 0; x < n; x++) {
            c.fillStyle = (x + y) % 2 ? '#1f2328' : '#b9b4a8';
            c.fillRect(x * t, y * t, t, t);
          }
        speckle(c, s, 1500, 80, 200, 0.12);
      }, true, 1 / 2.4),
    ),
  windows: (variant = 0) =>
    cached(`windows-${variant}`, () =>
      canvasTexture(512, (c, s) => {
        const pal = [['#3a3f47', '#2f333a'], ['#3b302b', '#302722'], ['#2c3036', '#24272c']][variant % 3];
        c.fillStyle = pal[0];
        c.fillRect(0, 0, s, s);
        speckle(c, s, 4000, 30, 80, 0.3);
        const n = 4, cw = s / n;
        for (let y = 0; y < n; y++)
          for (let x = 0; x < n; x++) {
            c.fillStyle = pal[1];
            c.fillRect(x * cw + 18, y * cw + 14, cw - 36, cw - 22);
            c.fillStyle = '#0c0f15';
            c.fillRect(x * cw + 24, y * cw + 20, cw - 48, cw - 34);
          }
      }, true, 1 / 12),
    ),
  windowsEmissive: (variant = 0) =>
    cached(`windowsE-${variant}`, () =>
      canvasTexture(512, (c, s) => {
        c.fillStyle = '#000';
        c.fillRect(0, 0, s, s);
        const n = 4, cw = s / n;
        for (let y = 0; y < n; y++)
          for (let x = 0; x < n; x++) {
            const r = rand();
            if (r > 0.38) continue;
            const warm = rand() > 0.35;
            const g = c.createLinearGradient(0, y * cw + 20, 0, y * cw + cw - 14);
            g.addColorStop(0, warm ? '#f2b56b' : '#8fb8e8');
            g.addColorStop(1, warm ? '#7a4a20' : '#2c4a70');
            c.fillStyle = g;
            c.fillRect(x * cw + 24, y * cw + 20, cw - 48, cw - 34);
            // Blind slats on some windows.
            if (rand() > 0.5) {
              c.fillStyle = 'rgba(0,0,0,0.55)';
              for (let k = 0; k < 8; k++) c.fillRect(x * cw + 24, y * cw + 24 + k * 9, cw - 48, 4);
            }
          }
      }, true, 1 / 12),
    ),
  shutter: () =>
    cached('shutter', () =>
      canvasTexture(256, (c, s) => {
        for (let y = 0; y < s; y += 8) {
          const g = c.createLinearGradient(0, y, 0, y + 8);
          g.addColorStop(0, '#5d6066');
          g.addColorStop(1, '#2d3035');
          c.fillStyle = g;
          c.fillRect(0, y, s, 8);
        }
        blobs(c, s, 6, 'rgba(60,30,20,0.35)', 20, 60);
      }, true, 1 / 2),
    ),
  cork: () =>
    cached('cork', () =>
      canvasTexture(256, (c, s) => {
        c.fillStyle = '#8a6440';
        c.fillRect(0, 0, s, s);
        speckle(c, s, 6000, 40, 140, 0.35);
      }, true, 1),
    ),
  chainlink: () =>
    cached('chainlink', () =>
      canvasTexture(128, (c, s) => {
        c.clearRect(0, 0, s, s);
        c.strokeStyle = '#9aa0a8';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(0, 0); c.lineTo(s, s);
        c.moveTo(s, 0); c.lineTo(0, s);
        c.stroke();
      }, true, 1 / 0.25),
    ),
  stripes: () =>
    cached('stripes', () =>
      canvasTexture(128, (c, s) => {
        c.fillStyle = '#e8e2d6';
        c.fillRect(0, 0, s, s);
        c.fillStyle = '#b8202e';
        for (let i = -s; i < s * 2; i += 32) {
          c.beginPath();
          c.moveTo(i, 0); c.lineTo(i + 16, 0); c.lineTo(i + 16 - s, s); c.lineTo(i - s, s);
          c.fill();
        }
      }, true, 1),
    ),
  softDot: () =>
    cached('softDot', () =>
      canvasTexture(128, (c, s) => {
        const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        g.addColorStop(0, 'rgba(255,255,255,0.55)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.18)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, s, s);
      }, true, 1),
    ),
};

export interface TextTextureOptions {
  width?: number;
  height?: number;
  font?: string;
  color?: string;
  glow?: string;
  glowBlur?: number;
  background?: string;
  align?: CanvasTextAlign;
  lines?: { text: string; font?: string; color?: string }[];
}

/** Text drawn on a transparent canvas, e.g. for neon signs and plaques. */
export function textTexture(key: string, text: string, o: TextTextureOptions = {}): THREE.CanvasTexture {
  return cached(`text-${key}`, () => {
    const w = o.width ?? 1024, h = o.height ?? 256;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d')!;
    if (o.background) {
      c.fillStyle = o.background;
      c.fillRect(0, 0, w, h);
    }
    const lines = o.lines ?? [{ text }];
    const lh = h / lines.length;
    c.textAlign = o.align ?? 'center';
    c.textBaseline = 'middle';
    lines.forEach((line, i) => {
      c.font = line.font ?? o.font ?? `600 ${Math.floor(lh * 0.62)}px "Playfair Display", Georgia, serif`;
      const x = c.textAlign === 'center' ? w / 2 : 30;
      const y = lh * i + lh / 2;
      if (o.glow) {
        c.shadowColor = o.glow;
        c.shadowBlur = o.glowBlur ?? 30;
        c.fillStyle = line.color ?? o.color ?? '#fff';
        c.fillText(line.text, x, y);
        c.fillText(line.text, x, y);
      }
      c.shadowBlur = 0;
      c.fillStyle = line.color ?? o.color ?? '#fff';
      c.fillText(line.text, x, y);
    });
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }) as THREE.CanvasTexture;
}
