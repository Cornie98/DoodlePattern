import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
  useState,
} from "react";
import {
  beginStroke,
  continueStroke,
  endStroke,
  ensurePencilTip,
  type DrawTool,
  type StrokeStyle,
} from "../canvas/tools";
import { floodFill } from "../canvas/floodFill";
import { wrapCanvas } from "../canvas/wrapCanvas";
import {
  CanvasHistory,
  capture,
  restore,
} from "../canvas/history";
import { exportPng } from "../canvas/exportPng";
import { canvasToDataUrl } from "../canvas/flatten";
import { loadSticker, stampAt, type StickerDef } from "../stickers";

export const TILE_SIZE = 512;
const WRAP_MS = 550;

export interface CanvasStageHandle {
  undo: () => void;
  redo: () => void;
  wrap: () => void;
  clear: () => void;
  exportImage: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

interface CanvasStageProps {
  tool: DrawTool;
  color: string;
  brushSize: number;
  opacity: number;
  hardness: number;
  backgroundColor: string | null;
  sticker: StickerDef | null;
  onHistoryChange: () => void;
  onTileChange: (dataUrl: string) => void;
  onWrapComplete?: () => void;
}

type WrapSnapshot = { dataUrl: string; animate: boolean };

function getCanvasCoords(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * TILE_SIZE;
  const y = ((clientY - rect.top) / rect.height) * TILE_SIZE;
  return { x, y };
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const CanvasStage = forwardRef<CanvasStageHandle, CanvasStageProps>(
  function CanvasStage(
    {
      tool,
      color,
      brushSize,
      opacity,
      hardness,
      backgroundColor,
      sticker,
      onHistoryChange,
      onTileChange,
      onWrapComplete,
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const historyRef = useRef(new CanvasHistory());
    const drawingRef = useRef(false);
    const wrappingRef = useRef(false);
    const bgRef = useRef(backgroundColor);
    const styleRef = useRef<StrokeStyle>({
      tool,
      color,
      size: brushSize,
      opacity,
      hardness,
    });
    const toolRef = useRef(tool);
    const colorRef = useRef(color);
    const sizeRef = useRef(brushSize);
    const stickerRef = useRef(sticker);
    const [wrapShot, setWrapShot] = useState<WrapSnapshot | null>(null);

    useEffect(() => {
      void ensurePencilTip();
    }, []);

    useEffect(() => {
      toolRef.current = tool;
      colorRef.current = color;
      sizeRef.current = brushSize;
      stickerRef.current = sticker;
      bgRef.current = backgroundColor;
      styleRef.current = {
        tool,
        color,
        size: brushSize,
        opacity,
        hardness,
      };
    }, [tool, color, brushSize, opacity, hardness, backgroundColor, sticker]);

    const notifyTile = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      onTileChange(canvasToDataUrl(canvas, bgRef.current));
    }, [onTileChange]);

    useEffect(() => {
      notifyTile();
    }, [backgroundColor, notifyTile]);

    const pushHistory = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;
      historyRef.current.push(capture(ctx, TILE_SIZE));
      onHistoryChange();
    }, [onHistoryChange]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = TILE_SIZE;
      canvas.height = TILE_SIZE;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
      notifyTile();
    }, [notifyTile]);

    const finishWrap = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        wrapCanvas(ctx);
        onWrapComplete?.();
      }
      setWrapShot(null);
      wrappingRef.current = false;
    }, [onWrapComplete]);

    useImperativeHandle(
      ref,
      () => ({
        undo() {
          if (wrappingRef.current) return;
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (!ctx) return;
          const current = capture(ctx, TILE_SIZE);
          const prev = historyRef.current.undo(current);
          if (!prev) return;
          restore(ctx, prev);
          onHistoryChange();
          notifyTile();
        },
        redo() {
          if (wrappingRef.current) return;
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (!ctx) return;
          const current = capture(ctx, TILE_SIZE);
          const next = historyRef.current.redo(current);
          if (!next) return;
          restore(ctx, next);
          onHistoryChange();
          notifyTile();
        },
        wrap() {
          if (wrappingRef.current) return;
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (!canvas || !ctx) return;

          wrappingRef.current = true;
          pushHistory();
          const dataUrl = canvasToDataUrl(canvas, bgRef.current);
          const animate = !prefersReducedMotion();

          if (!animate) {
            wrapCanvas(ctx);
            onWrapComplete?.();
            wrappingRef.current = false;
            return;
          }

          setWrapShot({ dataUrl, animate: true });
          window.setTimeout(finishWrap, WRAP_MS);
        },
        clear() {
          if (wrappingRef.current) return;
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (!ctx) return;
          pushHistory();
          ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
          notifyTile();
        },
        exportImage() {
          const canvas = canvasRef.current;
          if (canvas) exportPng(canvas, "doodlepattern.png", bgRef.current);
        },
        canUndo() {
          return historyRef.current.canUndo();
        },
        canRedo() {
          return historyRef.current.canRedo();
        },
      }),
      [finishWrap, notifyTile, onHistoryChange, onWrapComplete, pushHistory]
    );

    const onPointerDown = async (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (wrappingRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const { x, y } = getCanvasCoords(canvas, e.clientX, e.clientY);
      const t = toolRef.current;

      if (t === "fill") {
        pushHistory();
        floodFill(ctx, x, y, colorRef.current);
        notifyTile();
        return;
      }

      if (t === "sticker") {
        const s = stickerRef.current;
        if (!s) return;
        pushHistory();
        try {
          const img = await loadSticker(s.src);
          stampAt(ctx, img, s, x, y, sizeRef.current, colorRef.current);
          notifyTile();
        } catch {
          
        }
        return;
      }

      pushHistory();
      drawingRef.current = true;
      beginStroke(ctx, x, y, styleRef.current);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const { x, y } = getCanvasCoords(canvas, e.clientX, e.clientY);
      continueStroke(ctx, x, y, styleRef.current);
    };

    const finishStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) endStroke(ctx, styleRef.current);
      try {
        canvas?.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      notifyTile();
    };

    const quarterStyle = wrapShot
      ? {
          backgroundImage: `url(${wrapShot.dataUrl})`,
          backgroundSize: "200% 200%",
        }
      : undefined;

    return (
      <div
        className={`canvas-wrap${wrapShot ? " wrapping" : ""}${backgroundColor ? " canvas-wrap--solid" : ""}`}
        style={
          backgroundColor
            ? { backgroundColor, backgroundImage: "none" }
            : undefined
        }
        aria-busy={!!wrapShot}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          onPointerLeave={(e) => {
            if (drawingRef.current) finishStroke(e);
          }}
          aria-label="Pattern tile canvas"
        />
        {wrapShot && (
          <div
            className="wrap-overlay"
            style={
              backgroundColor
                ? { backgroundColor, backgroundImage: "none" }
                : undefined
            }
            aria-hidden
          >
            <div
              className="wrap-quarter wrap-quarter--tl"
              style={{
                ...quarterStyle,
                backgroundPosition: "0% 0%",
              }}
            />
            <div
              className="wrap-quarter wrap-quarter--tr"
              style={{
                ...quarterStyle,
                backgroundPosition: "100% 0%",
              }}
            />
            <div
              className="wrap-quarter wrap-quarter--bl"
              style={{
                ...quarterStyle,
                backgroundPosition: "0% 100%",
              }}
            />
            <div
              className="wrap-quarter wrap-quarter--br"
              style={{
                ...quarterStyle,
                backgroundPosition: "100% 100%",
              }}
            />
            <div className="wrap-crosshair" />
          </div>
        )}
      </div>
    );
  }
);
