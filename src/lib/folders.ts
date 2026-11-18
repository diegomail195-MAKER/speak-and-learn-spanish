// Folder colours for My Activities: eight solid colours.
// The keys are the ones saved in the database since folders were added, so folders created before
// this palette keep their colour family (sun → yellow, coral → red, …). "berry" (fuchsia) is new.
// A folder with no colour, or an old colour that is no longer offered ("slate"), shows the default.
// `on` is the colour for a check mark or text drawn on top of the colour (contrast ≥ 3:1).
export const FOLDER_COLORS = [
  { key: "coral", label: "Red", es: "Rojo", hex: "#EF4444", on: "#ffffff" },
  { key: "sky", label: "Blue", es: "Azul", hex: "#2563EB", on: "#ffffff" },
  { key: "sun", label: "Yellow", es: "Amarillo", hex: "#FACC15", on: "#172033" },
  { key: "leaf", label: "Green", es: "Verde", hex: "#22C55E", on: "#172033" },
  { key: "orange", label: "Orange", es: "Naranja", hex: "#F97316", on: "#172033" },
  { key: "grape", label: "Purple", es: "Morado", hex: "#9333EA", on: "#ffffff" },
  { key: "berry", label: "Fuchsia", es: "Fucsia", hex: "#EC4899", on: "#172033" },
  { key: "teal", label: "Turquoise", es: "Turquesa", hex: "#06B6D4", on: "#172033" },
] as const;

export type FolderColor = (typeof FOLDER_COLORS)[number]["key"];
export type FolderColorDef = (typeof FOLDER_COLORS)[number];

export const DEFAULT_FOLDER_COLOR: FolderColor = "sky";
export const FOLDER_COLOR_KEYS = FOLDER_COLORS.map((c) => c.key) as [FolderColor, ...FolderColor[]];

export function isFolderColor(key: unknown): key is FolderColor {
  return typeof key === "string" && FOLDER_COLORS.some((c) => c.key === key);
}

/** The colour to show for a saved value: unknown, empty or retired values show the default. */
export function folderColor(key: string | null | undefined): FolderColorDef {
  return FOLDER_COLORS.find((c) => c.key === key) ?? FOLDER_COLORS.find((c) => c.key === DEFAULT_FOLDER_COLOR)!;
}

/** The key to preselect when editing a folder (old folders without a valid colour get the default). */
export const folderColorKey = (key: string | null | undefined): FolderColor => folderColor(key).key;
