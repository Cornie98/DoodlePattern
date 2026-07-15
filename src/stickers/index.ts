export interface StickerDef {
  id: string;
  name: string;
  src: string;
  /** `tint` = recolor with brush color (SVG stickers). `photo` = stamp as-is. */
  mode?: "tint" | "photo";
}

export const STICKERS: StickerDef[] = [
  { id: "star", name: "Star", src: "/stickers/star.svg" },
  { id: "heart", name: "Heart", src: "/stickers/heart.svg" },
  { id: "blob", name: "Blob", src: "/stickers/blob.svg" },
  { id: "flower", name: "Flower", src: "/stickers/flower.svg" },
  { id: "leaf", name: "Leaf", src: "/stickers/leaf.svg" },
  { id: "dot", name: "Dot", src: "/stickers/dot.svg" },
  { id: "squiggle", name: "Squiggle", src: "/stickers/squiggle.svg" },
  { id: "sparkle", name: "Sparkle", src: "/stickers/sparkle.svg" },
  { id: "moon", name: "Moon", src: "/stickers/moon.svg" },
  { id: "diamond", name: "Diamond", src: "/stickers/diamond.svg" },
  { id: "swirl", name: "Swirl", src: "/stickers/swirl.svg" },
  { id: "zigzag", name: "Zigzag", src: "/stickers/zigzag.svg" },
  { id: "smiley", name: "Smiley", src: "/stickers/smiley.svg" },
  { id: "alien", name: "Alien", src: "/stickers/alien.svg" },
  { id: "cat", name: "Cat", src: "/stickers/cat.svg" },
  { id: "burst", name: "Burst", src: "/stickers/burst.svg" },
];

const imageCache = new Map<string, HTMLImageElement>();

export function loadSticker(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached?.complete) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}


export function stampSticker(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  const s = Math.max(8, size * 2.2);
  const ox = x - s / 2;
  const oy = y - s / 2;

  const off = document.createElement("canvas");
  off.width = Math.ceil(s);
  off.height = Math.ceil(s);
  const octx = off.getContext("2d")!;
  octx.drawImage(img, 0, 0, s, s);
  octx.globalCompositeOperation = "source-in";
  octx.fillStyle = color;
  octx.fillRect(0, 0, s, s);

  ctx.drawImage(off, ox, oy);
}


export function stampPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number
): void {
  const max = Math.max(16, size * 3);
  const aspect = img.naturalWidth / Math.max(1, img.naturalHeight);
  let w = max;
  let h = max;
  if (aspect >= 1) {
    h = max / aspect;
  } else {
    w = max * aspect;
  }
  ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
}

export function stampAt(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sticker: StickerDef,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  if (sticker.mode === "photo") {
    stampPhoto(ctx, img, x, y, size);
  } else {
    stampSticker(ctx, img, x, y, size, color);
  }
}
