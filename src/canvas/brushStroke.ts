export type BrushStyle = {
  color: string;
  size: number;
  opacity: number;
  hardness: number;
};

type BrushStroke = {
  x: number;
  y: number;
  remainder: number;
  lastW: number;
  vx: number;
  vy: number;
};

let active: BrushStroke | null = null;

function stampDisc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  opacity: number,
  hardness: number
) {
  if (radius < 0.35) return;

  const soft = 1 - Math.min(1, Math.max(0, hardness));
  const inner = radius * Math.max(0.05, hardness * 0.92);

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = opacity;

  if (soft < 0.04) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const g = ctx.createRadialGradient(x, y, inner, x, y, radius);
    g.addColorStop(0, color);
    g.addColorStop(Math.min(0.92, 0.45 + hardness * 0.45), color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/** Slow strokes stay wide; fast strokes taper thin. */
function speedFactor(speed: number, size: number): number {
  const ref = Math.max(8, size * 1.8);
  return Math.max(0.18, Math.min(1, 1.15 - speed / ref));
}

function brushWidth(style: BrushStyle, speed: number): number {
  const pressure = speedFactor(speed, style.size);
  const min = style.size * 0.18;
  const max = style.size * 1.35;
  return min + (max - min) * pressure;
}

function stampAlong(
  ctx: CanvasRenderingContext2D,
  style: BrushStyle,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  startW: number,
  endW: number,
  remainder: number
): { remainder: number; lastW: number } {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.01) return { remainder, lastW: startW };

  const opacity = Math.min(1, Math.max(0.04, style.opacity * 0.88));

  let travelled = remainder;
  let lastW = startW;

  while (travelled <= dist) {
    const t = travelled / dist;
    const x = fromX + dx * t;
    const y = fromY + dy * t;
    const w = startW + (endW - startW) * t;
    lastW = w;
    stampDisc(ctx, x, y, w / 2, style.color, opacity, style.hardness);
    travelled += Math.max(0.8, w * 0.28);
  }

  return {
    remainder: travelled - dist,
    lastW,
  };
}

export function beginBrushStroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  style: BrushStyle
) {
  const w = style.size * 0.55;
  active = { x, y, remainder: 0, lastW: w, vx: 0, vy: 0 };
  const opacity = Math.min(1, Math.max(0.04, style.opacity * 0.88));
  stampDisc(ctx, x, y, w / 2, style.color, opacity, style.hardness);
}

export function continueBrushStroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  style: BrushStyle
) {
  if (!active) {
    beginBrushStroke(ctx, x, y, style);
    return;
  }

  const dx = x - active.x;
  const dy = y - active.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.4) return;

  active.vx = active.vx * 0.55 + dx * 0.45;
  active.vy = active.vy * 0.55 + dy * 0.45;
  const speed = Math.hypot(active.vx, active.vy);

  const nextW = brushWidth(style, speed);
  const endW = active.lastW * 0.55 + nextW * 0.45;

  const stepped = stampAlong(
    ctx,
    style,
    active.x,
    active.y,
    x,
    y,
    active.lastW,
    endW,
    active.remainder
  );

  active.remainder = stepped.remainder;
  active.lastW = stepped.lastW;
  active.x = x;
  active.y = y;
}

/** Finish with a pointed tip along the stroke direction. */
export function endBrushStroke(
  ctx: CanvasRenderingContext2D,
  style: BrushStyle
) {
  if (!active) return;

  const len = Math.max(active.lastW * 1.8, style.size * 1.2);
  const speed = Math.hypot(active.vx, active.vy);
  let dirX = active.vx;
  let dirY = active.vy;
  if (speed < 0.4) {
    dirX = 1;
    dirY = 0;
  } else {
    dirX /= speed;
    dirY /= speed;
  }

  stampAlong(
    ctx,
    style,
    active.x,
    active.y,
    active.x + dirX * len,
    active.y + dirY * len,
    active.lastW,
    Math.max(0.6, style.size * 0.06),
    0
  );

  active = null;
}

export function cancelBrushStroke(): void {
  active = null;
}
