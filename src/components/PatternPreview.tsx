import type { CSSProperties } from "react";

export type PreviewMode = "off" | "backdrop" | "split";

interface PatternPreviewProps {
  tileDataUrl: string;
  tileSize?: number;
  mode: PreviewMode;
  /** Half-tile shifts from Wrap canvas, so the wallpaper doesn't jump. */
  wrapPhase?: number;
}

export function nextPreviewMode(mode: PreviewMode): PreviewMode {
  if (mode === "off") return "backdrop";
  if (mode === "backdrop") return "split";
  return "off";
}

export function PatternPreview({
  tileDataUrl,
  tileSize = 512,
  mode,
  wrapPhase = 0,
}: PatternPreviewProps) {
  if (mode === "off" || !tileDataUrl) return null;

  if (mode === "backdrop") {
    const cell = Math.max(72, Math.floor(tileSize / 4));
    const phasePx = -wrapPhase * cell;
    return (
      <div
        className="pattern-backdrop pattern-backdrop--scroll"
        style={
          {
            backgroundImage: `url(${tileDataUrl})`,
            backgroundSize: `${cell}px ${cell}px`,
            "--tile-cell": `${cell}px`,
            "--phase-x": `${phasePx}px`,
            "--phase-y": `${phasePx}px`,
          } as CSSProperties
        }
        aria-hidden
      />
    );
  }

  // Split panel — larger tiles so the pattern reads clearly on mobile
  const cell = Math.max(56, Math.floor(tileSize / 5));
  const phasePx = -wrapPhase * cell;

  return (
    <aside className="preview-panel" aria-label="Pattern preview">
      <div
        className="preview-tile preview-tile--scroll"
        style={
          {
            backgroundImage: `url(${tileDataUrl})`,
            backgroundSize: `${cell}px ${cell}px`,
            "--tile-cell": `${cell}px`,
            "--phase-x": `${phasePx}px`,
            "--phase-y": `${phasePx}px`,
          } as CSSProperties
        }
        role="img"
        aria-label="Tiled pattern preview"
      />
    </aside>
  );
}
