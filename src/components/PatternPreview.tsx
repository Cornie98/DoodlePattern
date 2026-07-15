import { useEffect, useState, type CSSProperties } from "react";

export type PreviewMode = "off" | "backdrop" | "split";

interface PatternPreviewProps {
  tileDataUrl: string;
  tileSize?: number;
  mode: PreviewMode;
  
  wrapPhase?: number;
}

export function nextPreviewMode(mode: PreviewMode): PreviewMode {
  if (mode === "off") return "backdrop";
  if (mode === "backdrop") return "split";
  return "off";
}


function useStableTileBackground(tileDataUrl: string): string | undefined {
  const [current, setCurrent] = useState(tileDataUrl);
  const [previous, setPrevious] = useState<string | null>(null);

  useEffect(() => {
    if (!tileDataUrl || tileDataUrl === current) return;
    setPrevious(current);
    setCurrent(tileDataUrl);
  }, [tileDataUrl, current]);

  useEffect(() => {
    if (!previous || !current) return;
    let cancelled = false;
    const img = new Image();
    const clearPrevious = () => {
      if (!cancelled) setPrevious(null);
    };
    img.onload = clearPrevious;
    img.onerror = clearPrevious;
    img.src = current;
    return () => {
      cancelled = true;
    };
  }, [current, previous]);

  if (!current) return undefined;
  if (previous && previous !== current) {
    return `url(${current}), url(${previous})`;
  }
  return `url(${current})`;
}

export function PatternPreview({
  tileDataUrl,
  tileSize = 512,
  mode,
  wrapPhase = 0,
}: PatternPreviewProps) {
  const backgroundImage = useStableTileBackground(tileDataUrl);

  if (mode === "off" || !tileDataUrl || !backgroundImage) return null;

  if (mode === "backdrop") {
    const cell = Math.max(72, Math.floor(tileSize / 4));
    const phasePx = -wrapPhase * cell;
    return (
      <div
        className="pattern-backdrop pattern-backdrop--scroll"
        style={
          {
            backgroundImage,
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

  
  const cell = Math.max(56, Math.floor(tileSize / 5));
  const phasePx = -wrapPhase * cell;

  return (
    <aside className="preview-panel" aria-label="Pattern preview">
      <div
        className="preview-tile preview-tile--scroll"
        style={
          {
            backgroundImage,
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
