import { flattenCanvas } from "./flatten";

export function exportPng(
  canvas: HTMLCanvasElement,
  filename = "doodlepattern.png",
  backgroundColor: string | null = null
): void {
  flattenCanvas(canvas, backgroundColor).toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

