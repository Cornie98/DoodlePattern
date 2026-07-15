import { useRef } from "react";
import type { StickerDef } from "../stickers";

interface StickerPaletteProps {
  stickers: StickerDef[];
  libraryStamps: StickerDef[];
  selectedId: string | null;
  onSelect: (s: StickerDef) => void;
  onAddFromLibrary: (stamps: StickerDef[]) => void;
}

export function StickerPalette({
  stickers,
  libraryStamps,
  selectedId,
  onSelect,
  onAddFromLibrary,
}: StickerPaletteProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;

    const stamps: StickerDef[] = [];
    Array.from(files).forEach((file, i) => {
      if (stamps.length >= 4) return;
      if (!file.type.startsWith("image/")) return;
      const src = URL.createObjectURL(file);
      stamps.push({
        id: `lib-${Date.now()}-${i}-${file.name}`,
        name: file.name.replace(/\.[^.]+$/, "") || "Stamp",
        src,
        mode: "photo",
      });
    });
    if (stamps.length) onAddFromLibrary(stamps);
  };

  return (
    <div className="sticker-palette" role="listbox" aria-label="Stickers and stamps">
      {stickers.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`sticker-btn${selectedId === s.id ? " active" : ""}`}
          title={s.name}
          aria-selected={selectedId === s.id}
          onClick={() => onSelect(s)}
        >
          <img src={s.src} alt={s.name} />
        </button>
      ))}

      {libraryStamps.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`sticker-btn sticker-btn--photo${selectedId === s.id ? " active" : ""}`}
          title={`Stamp: ${s.name}`}
          aria-selected={selectedId === s.id}
          onClick={() => onSelect(s)}
        >
          <img src={s.src} alt={s.name} />
        </button>
      ))}

      <button
        type="button"
        className="sticker-btn sticker-btn--add"
        title="Add images from your device"
        onClick={() => fileRef.current?.click()}
      >
        <span aria-hidden>+</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
