import tipUrl from "../assets/brushes/pencil-tip.png";

export type PencilStyle = {
  color: string;
  size: number;
  opacity: number;
  hardness: number;
};

let tipImage: HTMLImageElement | null = null;
let tipPromise: Promise<HTMLImageElement> | null = null;
const tintCache = new Map<string, HTMLCanvasElement>();

type PencilStroke = {
  x: number;
  y: number;
  remainder: number;
};

let active: PencilStroke | null = null;

export function ensurePencilTip(): Promise<HTMLImageElement> {
  if (tipImage?.complete) return Promise.resolve(tipImage);
  if (tipPromise) return tipPromise;

  tipPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      tipImage = img;
      resolve(img);
    };
    img.onerror = () => reject(new Error("Failed to load pencil tip"));
    img.src = tipUrl;
  });

  return tipPromise;
}

function parseHexColor(color: string): [number, number, number] {
  const hex = color.trim();
  if (hex.startsWith("#") && hex.length === 7) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }
  const el = document.createElement("canvas");
  el.width = 1;
  el.height = 1;
  const c = el.getContext("2d")!;
  c.fillStyle = color;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

function getTintedTip(color: string, hardness: number): HTMLCanvasElement | null {
  if (!tipImage?.complete) return null;

  const hardKey = Math.round(hardness * 20);
  const key = `${color}|${hardKey}`;
  const cached = tintCache.get(key);
  if (cached) return cached;

  const w = tipImage.naturalWidth || tipImage.width;
  const h = tipImage.naturalHeight || tipImage.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(tipImage, 0, 0);
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  const [r, g, b] = parseHexColor(color);
  // Higher hardness = punchier grain; softer = softer midtones
  const gamma = 1.35 - hardness * 0.55;

  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / (3 * 255);
    const alpha = Math.pow(lum, gamma);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = Math.round(Math.min(1, alpha) * 255);
  }

  ctx.putImageData(image, 0, 0);
  tintCache.set(key, canvas);
  if (tintCache.size > 48) {
    const first = tintCache.keys().next().value;
    if (first !== undefined) tintCache.delete(first);
  }
  return canvas;
}

function tipDiameter(style: PencilStyle): number {
  return Math.max(3, style.size * 1.35);
}

function stamp(
  ctx: CanvasRenderingContext2D,
  tip: HTMLCanvasElement,
  x: number,
  y: number,
  size: number,
  angle: number,
  opacity: number,
  softness: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = "source-over";
  if (softness > 0.02) {
    ctx.shadowBlur = size * softness * 0.45;
    ctx.shadowColor = "rgba(0,0,0,0.35)";
  }
  ctx.drawImage(tip, -size / 2, -size / 2, size, size);
  ctx.restore();
}

export function beginPencilStroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  style: PencilStyle
): boolean {
  const tip = getTintedTip(style.color, style.hardness);
  if (!tip) return false;

  active = { x, y, remainder: 0 };
  const size = tipDiameter(style);
  const opacity = Math.min(1, Math.max(0.03, style.opacity * 0.9));
  const softness = 1 - Math.min(1, Math.max(0, style.hardness));
  stamp(ctx, tip, x, y, size, Math.random() * Math.PI * 2, opacity, softness);
  return true;
}

export function continuePencilStroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  style: PencilStyle
): boolean {
  if (!active) return beginPencilStroke(ctx, x, y, style);

  const tip = getTintedTip(style.color, style.hardness);
  if (!tip) return false;

  const dx = x - active.x;
  const dy = y - active.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.5) return true;

  const size = tipDiameter(style);
  const spacing = Math.max(1.2, size * 0.16);
  const opacity = Math.min(1, Math.max(0.03, style.opacity * 0.9));
  const softness = 1 - Math.min(1, Math.max(0, style.hardness));
  const baseAngle = Math.atan2(dy, dx);

  let travelled = active.remainder;
  while (travelled <= dist) {
    const t = travelled / dist;
    const px = active.x + dx * t;
    const py = active.y + dy * t;
    const jitter = (Math.random() - 0.5) * 0.35;
    stamp(ctx, tip, px, py, size, baseAngle + jitter, opacity, softness);
    travelled += spacing;
  }

  active.remainder = travelled - dist;
  active.x = x;
  active.y = y;
  return true;
}

export function endPencilStroke(): void {
  active = null;
}
