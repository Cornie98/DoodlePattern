const MAX_HISTORY = 40;

export class CanvasHistory {
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  push(snapshot: ImageData) {
    this.undoStack.push(snapshot);
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo(current: ImageData): ImageData | null {
    if (this.undoStack.length === 0) return null;
    const prev = this.undoStack.pop()!;
    this.redoStack.push(current);
    return prev;
  }

  redo(current: ImageData): ImageData | null {
    if (this.redoStack.length === 0) return null;
    const next = this.redoStack.pop()!;
    this.undoStack.push(current);
    return next;
  }
}

export function capture(ctx: CanvasRenderingContext2D, size: number): ImageData {
  return ctx.getImageData(0, 0, size, size);
}

export function restore(
  ctx: CanvasRenderingContext2D,
  snapshot: ImageData
): void {
  ctx.putImageData(snapshot, 0, 0);
}
