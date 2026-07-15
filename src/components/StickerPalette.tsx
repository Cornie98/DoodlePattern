import type { StickerDef } from "../stickers";

interface StickerPaletteProps {
  stickers: StickerDef[];
  selectedId: string | null;
  onSelect: (s: StickerDef) => void;
}

export function StickerPalette({
  stickers,
  selectedId,
  onSelect,
}: StickerPaletteProps) {
  return (
    <div className="sticker-palette" role="listbox" aria-label="Stickers">
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
    </div>
  );
}
