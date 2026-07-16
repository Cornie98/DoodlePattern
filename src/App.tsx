import { useCallback, useRef, useState } from "react";
import {
  CanvasStage,
  type CanvasStageHandle,
} from "./components/CanvasStage";
import { Toolbar } from "./components/Toolbar";
import {
  nextPreviewMode,
  PatternPreview,
  type PreviewMode,
} from "./components/PatternPreview";
import type { DrawTool } from "./canvas/tools";
import { STICKERS, type StickerDef } from "./stickers";

export default function App() {
  const stageRef = useRef<CanvasStageHandle>(null);
  const pendingWrapPhase = useRef(0);
  const [tool, setTool] = useState<DrawTool>("pencil");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(12);
  const [opacity, setOpacity] = useState(1);
  const [hardness, setHardness] = useState(0.85);
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
  const [sticker, setSticker] = useState<StickerDef | null>(STICKERS[0]);
  const [libraryStamps, setLibraryStamps] = useState<StickerDef[]>([]);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("backdrop");
  const [tileUrl, setTileUrl] = useState("");
  const [wrapPhase, setWrapPhase] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const refreshHistory = useCallback(() => {
    setCanUndo(stageRef.current?.canUndo() ?? false);
    setCanRedo(stageRef.current?.canRedo() ?? false);
  }, []);

  const handleTileChange = useCallback((dataUrl: string) => {
    const extra = pendingWrapPhase.current;
    pendingWrapPhase.current = 0;
    if (extra) {
      setWrapPhase((p) => (p + extra) % 1);
    }
    setTileUrl(dataUrl);
  }, []);

  const resetWrapPhase = useCallback(() => {
    pendingWrapPhase.current = 0;
    setWrapPhase(0);
  }, []);

  const handleClear = () => {
    if (
      window.confirm(
        "Clear the whole canvas? You can undo after if you change your mind."
      )
    ) {
      resetWrapPhase();
      stageRef.current?.clear();
    }
  };

  return (
    <div className={`app${previewMode === "split" ? " app--split-preview" : ""}`}>
      <PatternPreview
        tileDataUrl={tileUrl}
        mode={previewMode === "backdrop" ? "backdrop" : "off"}
        wrapPhase={wrapPhase}
      />

      <header className="brand">
        <h1>DoodlePattern</h1>
      </header>

      <div className="stage">
        <div className="stage-main">
          <div className="canvas-slot">
            <CanvasStage
              ref={stageRef}
              tool={tool}
              color={color}
              brushSize={brushSize}
              opacity={opacity}
              hardness={hardness}
              backgroundColor={backgroundColor}
              sticker={sticker}
              onHistoryChange={refreshHistory}
              onTileChange={handleTileChange}
              onWrapComplete={() => {
                pendingWrapPhase.current = (pendingWrapPhase.current + 0.5) % 1;
              }}
            />
          </div>

          <div
            className={`workspace${previewMode === "split" ? " workspace--split" : ""}`}
          >
            <Toolbar
              tool={tool}
              color={color}
              brushSize={brushSize}
              opacity={opacity}
              hardness={hardness}
              backgroundColor={backgroundColor}
              stickerId={sticker?.id ?? null}
              stickers={STICKERS}
              libraryStamps={libraryStamps}
              previewMode={previewMode}
              canUndo={canUndo}
              canRedo={canRedo}
              onTool={setTool}
              onColor={setColor}
              onBrushSize={setBrushSize}
              onOpacity={setOpacity}
              onHardness={setHardness}
              onBackgroundColor={setBackgroundColor}
              onSticker={(s) => {
                setSticker(s);
                setTool("sticker");
              }}
              onAddFromLibrary={(stamps) => {
                setLibraryStamps((prev) => {
                  const next = [...prev, ...stamps];
                  const overflow = next.length - 4;
                  if (overflow > 0) {
                    const removed = next.splice(0, overflow);
                    for (const s of removed) {
                      if (s.src.startsWith("blob:")) URL.revokeObjectURL(s.src);
                    }
                  }
                  return next;
                });
                setSticker(stamps[stamps.length - 1]);
                setTool("sticker");
              }}
              onWrap={() => stageRef.current?.wrap()}
              onCyclePreview={() => setPreviewMode(nextPreviewMode)}
              onUndo={() => {
                resetWrapPhase();
                stageRef.current?.undo();
              }}
              onRedo={() => {
                resetWrapPhase();
                stageRef.current?.redo();
              }}
              onClear={handleClear}
              onExport={() => stageRef.current?.exportImage()}
            />

            {previewMode === "split" && (
              <PatternPreview
                tileDataUrl={tileUrl}
                mode="split"
                wrapPhase={wrapPhase}
              />
            )}
          </div>
        </div>

        <p className="hint">
          1. Draw on the canvas
          <br />
          2. Click Patternise! to bring the edges into the middle
          <br />
          3. Doodle over the seams and see your pattern tile!
        </p>
        <p className="hint hint--compact" aria-hidden="true">
          Draw · Patternise · Doodle seams
        </p>
      </div>
    </div>
  );
}
