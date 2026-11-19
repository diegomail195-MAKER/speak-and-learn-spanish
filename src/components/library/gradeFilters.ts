// The Library grade filters (shared by the server page and the client header).
export const GRADE_FILTERS = [
  { id: "all", label: "All Grades", icon: "book-open", color: "#620D78", shade: "#3E0750" },
  { id: "k-2", label: "K–2", icon: "grad-cap", color: "#14C8C4", shade: "#0B9592" },
  { id: "3-4", label: "3–4", icon: "books", color: "#FFC928", shade: "#D9A400" },
  { id: "5-6", label: "5–6", icon: "sprout", color: "#FF6458", shade: "#D63E33" },
] as const;
export type GradeFilter = (typeof GRADE_FILTERS)[number]["id"];
