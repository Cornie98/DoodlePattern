function colorMatch(
  data: Uint8ClampedArray,
  i: number,
  r: number,
  g: number,
  b: number,
  a: number,
  tolerance: number
): boolean {
  return (
    Math.abs(data[i] - r) <= tolerance &&
    Math.abs(data[i + 1] - g) <= tolerance &&
    Math.abs(data[i + 2] - b) <= tolerance &&
    Math.abs(data[i + 3] - a) <= tolerance
  );
}

function parseColor(color: string): [number, number, number, number] {
  const el = document.createElement("canvas");
  el.width = 1;
  el.height = 1;
  const c = el.getContext("2d")!;
  c.fillStyle = color;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = c.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a];
}

export function floodFill(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  fillColor: string,
  tolerance = 24
): boolean {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  if (x0 < 0 || y0 < 0 || x0 >= w || y0 >= h) return false;

  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  const start = (y0 * w + x0) * 4;
  const tr = data[start];
  const tg = data[start + 1];
  const tb = data[start + 2];
  const ta = data[start + 3];
  const [fr, fg, fb, fa] = parseColor(fillColor);

  if (
    tr === fr &&
    tg === fg &&
    tb === fb &&
    ta === fa
  ) {
    return false;
  }

  const stack: number[] = [x0, y0];
  const visited = new Uint8Array(w * h);
  let changed = false;

  while (stack.length) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const idx = y * w + x;
    if (visited[idx]) continue;
    visited[idx] = 1;

    const i = idx * 4;
    if (!colorMatch(data, i, tr, tg, tb, ta, tolerance)) continue;

    data[i] = fr;
    data[i + 1] = fg;
    data[i + 2] = fb;
    data[i + 3] = fa;
    changed = true;

    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }

  if (changed) {
    ctx.putImageData(image, 0, 0);
  }
  return changed;
}
