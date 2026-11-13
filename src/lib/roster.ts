// Pure helpers for the roster: pasting a list of students, spotting duplicates, usernames and
// generated sign-in secrets. Shared by the "Add List" preview (browser) and the server action.

export type ListRow = { firstName: string; lastInitial: string; username: string };
export type CheckedRow = ListRow & { problems: string[]; duplicateOf?: "list" | "roster" };

export function slugName(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function suggestUsername(firstName: string, lastInitial: string) {
  return slugName(firstName + lastInitial) || "student";
}

/**
 * One student per line. Accepts "Ana López", "Ana L", "López, Ana", "Ana, L." and tab-separated
 * cells pasted from a spreadsheet (first name, last name). Only a first name and a last initial
 * are kept (minimal personal data).
 */
export function parseStudentList(text: string): ListRow[] {
  const rows: ListRow[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, " ").trim();
    if (!line) continue;
    let first = "";
    let last = "";
    if (raw.includes("\t")) {
      const cells = raw.split("\t").map((c) => c.trim()).filter(Boolean);
      [first = "", last = ""] = cells;
    } else if (line.includes(",")) {
      const [a, b] = line.split(",").map((c) => c.trim());
      // "López, Ana" (last, first) unless the part after the comma is just an initial.
      if (b && b.replace(".", "").length > 1) [first, last] = [b, a];
      else [first, last] = [a, b ?? ""];
    } else {
      const parts = line.split(" ");
      first = parts[0];
      last = parts.slice(1).join(" ");
    }
    first = first.replace(/[^\p{L}\p{M}' -]/gu, "").trim().slice(0, 40);
    const initial = (last.replace(/[^\p{L}]/gu, "")[0] ?? "").toUpperCase();
    if (!first) continue;
    rows.push({ firstName: capitalize(first), lastInitial: initial, username: suggestUsername(first, initial) });
  }
  return rows;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const key = (r: { firstName: string; lastInitial: string }) => `${slugName(r.firstName)}|${r.lastInitial.toUpperCase()}`;

/** Marks rows repeated inside the list or already on the roster (same name + initial, or username). */
export function checkRows(rows: ListRow[], roster: Array<{ firstName: string; lastInitial: string; username: string }>): CheckedRow[] {
  const rosterNames = new Set(roster.map(key));
  const rosterUsers = new Set(roster.map((r) => r.username.toLowerCase()));
  const seenNames = new Set<string>();
  const seenUsers = new Set<string>();
  return rows.map((r) => {
    const problems: string[] = [];
    let duplicateOf: CheckedRow["duplicateOf"];
    const k = key(r);
    const u = r.username.toLowerCase();
    if (!r.firstName.trim()) problems.push("First name is missing.");
    if (!/^[a-z0-9]{2,30}$/.test(u)) problems.push("Username: 2–30 lowercase letters or numbers.");
    if (rosterNames.has(k)) {
      duplicateOf = "roster";
      problems.push("Already on the roster.");
    } else if (seenNames.has(k)) {
      duplicateOf = "list";
      problems.push("Repeated in this list.");
    }
    if (rosterUsers.has(u)) problems.push("Username already used in this class.");
    else if (seenUsers.has(u)) problems.push("Username repeated in this list.");
    seenNames.add(k);
    seenUsers.add(u);
    return { ...r, problems, duplicateOf };
  });
}

/** Next free username: "ana", "ana2", "ana3"… */
export function uniqueUsername(base: string, taken: Set<string>) {
  let u = base || "student";
  for (let i = 2; taken.has(u); i++) u = `${base}${i}`;
  return u;
}

const WORDS = ["sol", "luna", "mar", "flor", "gato", "perro", "rojo", "azul", "verde", "nube", "pan", "rio", "oso", "pez", "casa", "tren", "lobo", "mango", "pato", "fresa"];

/** Kid-friendly password like "luna-gato-42", from a random source (crypto on the server). */
export function friendlyPassword(rand: (n: number) => number) {
  const a = WORDS[rand(WORDS.length)];
  let b = WORDS[rand(WORDS.length)];
  while (b === a) b = WORDS[rand(WORDS.length)];
  return `${a}-${b}-${String(rand(90) + 10)}`;
}

export function fourDigitPin(rand: (n: number) => number) {
  return String(rand(10000)).padStart(4, "0");
}
