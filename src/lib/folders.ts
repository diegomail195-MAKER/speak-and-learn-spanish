// Folder colours for My Activities, in the LextroSpeak palette (light fill, darker tab).
export const FOLDER_COLORS = [
  { key: "sun", label: "Yellow", fill: "#ffe08a", tab: "#f2c445" },
  { key: "coral", label: "Red", fill: "#ffb3a8", tab: "#ef7a6c" },
  { key: "orange", label: "Orange", fill: "#ffc89a", tab: "#f6a15e" },
  { key: "grape", label: "Purple", fill: "#d9bcff", tab: "#b57bff" },
  { key: "sky", label: "Blue", fill: "#b5d5f2", tab: "#6ea9de" },
  { key: "teal", label: "Teal", fill: "#a9e0d9", tab: "#4fb5a8" },
  { key: "leaf", label: "Green", fill: "#b7e3c4", tab: "#6cc08a" },
  { key: "slate", label: "Gray", fill: "#d6d3cc", tab: "#a8a397" },
] as const;

export type FolderColor = (typeof FOLDER_COLORS)[number]["key"];

export function folderColor(key: string) {
  return FOLDER_COLORS.find((c) => c.key === key) ?? FOLDER_COLORS[4];
}
