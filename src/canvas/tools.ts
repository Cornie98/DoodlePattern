import {
  beginPencilStroke,
  continuePencilStroke,
  endPencilStroke,
  ensurePencilTip,
} from "./pencilStamp";
import {
  beginBrushStroke,
  cancelBrushStroke,
  continueBrushStroke,
  endBrushStroke,
} from "./brushStroke";

export type DrawTool =
  | "pencil"
  | "marker"
  | "brush"
  | "eraser"
  | "fill"
  | "sticker";

export interface StrokeStyle {
  color: string;
  size: number;
  tool: DrawTool;
  /** 0–1 stroke / eraser opacity */
  opacity: number;
  /** 0–1 edge hardness (0 = soft, 1 = hard) */
  hardness: number;
}

export { ensurePencilTip };

function setupStroke(ctx: CanvasRenderingContext2D, style: StrokeStyle) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = style.size;
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.globalCompositeOperation = "source-over";

  const opacity = Math.min(1, Math.max(0.02, style.opacity));
  const hardness = Math.min(1, Math.max(0, style.hardness));
  const softness = 1 - hardness;

  switch (style.tool) {
    case "pencil":
      ctx.strokeStyle = style.color;
      ctx.globalAlpha = opacity * 0.95;
      ctx.lineWidth = Math.max(1, style.size * 0.55);
      break;
    case "marker":
      // Flat, even chisel stroke — distinct from the tapered brush
      ctx.strokeStyle = style.color;
      ctx.lineCap = "square";
      ctx.globalAlpha = opacity * 0.55;
      ctx.lineWidth = style.size * 1.35;
      break;
    case "brush":
      ctx.strokeStyle = style.color;
      ctx.globalAlpha = opacity;
      break;
    case "eraser":
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.globalAlpha = opacity;
      break;
    default:
      ctx.strokeStyle = style.color;
      ctx.globalAlpha = opacity;
  }

  if (softness > 0.01 && style.tool !== "brush") {
    ctx.shadowBlur = style.size * softness * 0.9;
    ctx.shadowColor =
      style.tool === "eraser" ? "rgba(0,0,0,1)" : style.color;
  }
}

export function beginStroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  style: StrokeStyle
) {
  cancelBrushStroke();

  if (style.tool === "pencil" && beginPencilStroke(ctx, x, y, style)) {
    return;
  }

  if (style.tool === "brush") {
    beginBrushStroke(ctx, x, y, style);
    return;
  }

  setupStroke(ctx, style);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 0.01, y + 0.01);
  ctx.stroke();
}

export function continueStroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  style: StrokeStyle
) {
  if (style.tool === "pencil" && continuePencilStroke(ctx, x, y, style)) {
    return;
  }

  if (style.tool === "brush") {
    continueBrushStroke(ctx, x, y, style);
    return;
  }

  setupStroke(ctx, style);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

export function endStroke(
  ctx: CanvasRenderingContext2D,
  style?: StrokeStyle
) {
  endPencilStroke();
  if (style?.tool === "brush") {
    endBrushStroke(ctx, style);
  } else {
    cancelBrushStroke();
  }
  ctx.closePath();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "source-over";
}
