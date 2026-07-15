/**
 * Toroidal wrap: shift canvas content by 50% width and 50% height
 * so tile edges move into the center (paper-cutting method).
 */
export function wrapCanvas(ctx: CanvasRenderingContext2D): void {
  const { width: w, height: h } = ctx.canvas;
  const halfW = Math.floor(w / 2);
  const halfH = Math.floor(h / 2);

  const src = document.createElement("canvas");
  src.width = w;
  src.height = h;
  const srcCtx = src.getContext("2d")!;
  srcCtx.drawImage(ctx.canvas, 0, 0);

  ctx.clearRect(0, 0, w, h);

  // A B  ->  D C
  // C D      B A
  // Quadrants: TL(A), TR(B), BL(C), BR(D)
  // After +50%/+50% shift: each pixel moves from (x,y) to ((x-halfW+w)%w, (y-halfH+h)%h)
  // Equivalent drawImage tiling:

  // BR (D) -> TL
  ctx.drawImage(src, halfW, halfH, halfW, halfH, 0, 0, halfW, halfH);
  // BL (C) -> TR
  ctx.drawImage(src, 0, halfH, halfW, halfH, halfW, 0, halfW, halfH);
  // TR (B) -> BL
  ctx.drawImage(src, halfW, 0, halfW, halfH, 0, halfH, halfW, halfH);
  // TL (A) -> BR
  ctx.drawImage(src, 0, 0, halfW, halfH, halfW, halfH, halfW, halfH);
}
