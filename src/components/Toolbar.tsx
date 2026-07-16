import type { CSSProperties } from "react";
import type { DrawTool } from "../canvas/tools";
import type { StickerDef } from "../stickers";
import { StickerPalette } from "./StickerPalette";

const SWATCHES = [
  "#ffffff",
  "#000000",
  "#ff5a5a",
  "#ff8c42",
  "#ffc900",
  "#a8e063",
  "#90ffe0",
  "#6ec6ff",
  "#90a8ff",
  "#c4a8e8",
  "#ff90e8",
  "#ff9ecd",
];

const TOOLS: {
  id: DrawTool;
  label: string;
  icon?: string;
  materialIcon?: string;
}[] = [
  { id: "pencil", label: "Pencil", icon: "✎" },
  { id: "marker", label: "Marker", materialIcon: "ink_pen" },
  { id: "brush", label: "Brush", materialIcon: "brush" },
  { id: "eraser", label: "Eraser", materialIcon: "ink_eraser" },
  { id: "fill", label: "Fill", materialIcon: "colors" },
  { id: "sticker", label: "Stamps", icon: "★" },
];

const STROKE_TOOLS = new Set<DrawTool>([
  "pencil",
  "marker",
  "brush",
  "eraser",
]);

interface ToolbarProps {
  tool: DrawTool;
  color: string;
  brushSize: number;
  opacity: number;
  hardness: number;
  backgroundColor: string | null;
  stickerId: string | null;
  stickers: StickerDef[];
  libraryStamps: StickerDef[];
  previewMode: "off" | "backdrop" | "split";
  canUndo: boolean;
  canRedo: boolean;
  onTool: (t: DrawTool) => void;
  onColor: (c: string) => void;
  onBrushSize: (n: number) => void;
  onOpacity: (n: number) => void;
  onHardness: (n: number) => void;
  onBackgroundColor: (c: string | null) => void;
  onSticker: (s: StickerDef) => void;
  onAddFromLibrary: (stamps: StickerDef[]) => void;
  onWrap: () => void;
  onCyclePreview: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
}

export function Toolbar({
  tool,
  color,
  brushSize,
  opacity,
  hardness,
  backgroundColor,
  stickerId,
  stickers,
  libraryStamps,
  previewMode,
  canUndo,
  canRedo,
  onTool,
  onColor,
  onBrushSize,
  onOpacity,
  onHardness,
  onBackgroundColor,
  onSticker,
  onAddFromLibrary,
  onWrap,
  onCyclePreview,
  onUndo,
  onRedo,
  onClear,
  onExport,
}: ToolbarProps) {
  const showStrokeControls = STROKE_TOOLS.has(tool);
  const opacityPct = Math.round(opacity * 100);
  const hardnessPct = Math.round(hardness * 100);

  return (
    <div className="toolbar" role="toolbar" aria-label="Drawing tools">
      <div className="toolbar-row toolbar-row--wrap">
        <button
          type="button"
          className="wrap-btn"
          onClick={onWrap}
          title="Shift tile by 50% so edges meet in the center"
        >
          <span className="wrap-btn__icon" aria-hidden>
            ⟳
          </span>
          <strong className="wrap-btn__label">Patternise!</strong>
        </button>
      </div>

      <div className="toolbar-row">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tool-btn${tool === t.id ? " active" : ""}`}
            aria-pressed={tool === t.id}
            title={t.label}
            onClick={() => onTool(t.id)}
          >
            <span className="icon" aria-hidden>
              {t.materialIcon ? (
                <span className="material-symbols-outlined">{t.materialIcon}</span>
              ) : (
                t.icon
              )}
            </span>
            <span className="tool-btn__label">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="toolbar-row toolbar-row--colors">
        <div className="color-block">
          <label className="draw-color-picker">
            <span className="draw-color-picker__label">Colour</span>
            <span
              className="draw-color-picker__chip"
              style={{ "--draw-color": color } as CSSProperties}
            >
              <input
                type="color"
                className="draw-color-picker__input"
                value={color.length === 7 ? color : "#ffffff"}
                onChange={(e) => onColor(e.target.value)}
                title="Pick any colour"
                aria-label="Pick drawing colour"
              />
            </span>
          </label>
          <div className="swatch-grid">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch${color.toLowerCase() === c.toLowerCase() ? " active" : ""}`}
                style={{ background: c }}
                title={c}
                aria-label={`Color ${c}`}
                onClick={() => onColor(c)}
              />
            ))}
          </div>
        </div>

        <div className="stroke-sliders">
          <label className="size-control bg-control">
            Background
            <input
              type="color"
              className="bg-color-input"
              value={backgroundColor ?? "#ffffff"}
              onChange={(e) => onBackgroundColor(e.target.value)}
              title="Canvas background color"
              aria-label="Canvas background color"
            />
            <button
              type="button"
              className={`bg-clear-btn${!backgroundColor ? " active" : ""}`}
              onClick={() => onBackgroundColor(null)}
              title="Transparent background"
              aria-pressed={!backgroundColor}
            >
              Clear
            </button>
          </label>
          <label className="size-control">
            Size
            <input
              type="range"
              min={2}
              max={100}
              value={brushSize}
              onChange={(e) => onBrushSize(Number(e.target.value))}
            />
            <span>{brushSize}</span>
          </label>
          {showStrokeControls && (
            <>
              <label className="size-control">
                Opacity
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={opacityPct}
                  onChange={(e) => onOpacity(Number(e.target.value) / 100)}
                />
                <span>{opacityPct}%</span>
              </label>
              <label className="size-control">
                Hardness
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={hardnessPct}
                  onChange={(e) => onHardness(Number(e.target.value) / 100)}
                />
                <span>{hardnessPct}%</span>
              </label>
            </>
          )}
        </div>
      </div>

      <div className="toolbar-row">
        <button
          type="button"
          className={`tool-btn sun${previewMode !== "off" ? " active" : ""}${previewMode === "split" ? " preview-split" : ""}`}
          onClick={onCyclePreview}
          aria-pressed={previewMode !== "off"}
          title="Cycle preview: background → split view → off"
        >
          <span className="icon" aria-hidden>
            {previewMode === "split" ? "▥" : "⊞"}
          </span>
          <span className="tool-btn__label">
            {previewMode === "off"
              ? "Pattern preview"
              : previewMode === "backdrop"
                ? "Preview: bg"
                : "Preview: split"}
          </span>
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <span className="icon" aria-hidden>
            <span className="material-symbols-outlined">undo</span>
          </span>
          <span className="tool-btn__label">Undo</span>
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
        >
          <span className="icon" aria-hidden>
            <span className="material-symbols-outlined">redo</span>
          </span>
          <span className="tool-btn__label">Redo</span>
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={onClear}
          title="Clear"
        >
          <span className="icon" aria-hidden>
            <span className="material-symbols-outlined">delete</span>
          </span>
          <span className="tool-btn__label">Clear</span>
        </button>
        <button type="button" className="tool-btn sky" onClick={onExport} title="Export PNG">
          <span className="icon" aria-hidden>
            <span className="material-symbols-outlined">save</span>
          </span>
          <span className="tool-btn__label">Export PNG</span>
        </button>
      </div>

      {tool === "sticker" && (
        <StickerPalette
          stickers={stickers}
          libraryStamps={libraryStamps}
          selectedId={stickerId}
          onSelect={onSticker}
          onAddFromLibrary={onAddFromLibrary}
        />
      )}
    </div>
  );
}
