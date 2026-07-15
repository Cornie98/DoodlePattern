
export function flattenCanvas(
  canvas: HTMLCanvasElement,
  backgroundColor: string | null
): HTMLCanvasElement {
  if (!backgroundColor) return canvas;

  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0);
  return out;
}

export function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  backgroundColor: string | null
): string {
  return flattenCanvas(canvas, backgroundColor).toDataURL("image/png");
}
