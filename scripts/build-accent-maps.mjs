// Builds the accent maps used by the editor's autocorrect (src/lib/text/accents-*.json):
// unaccented spelling → accented word, from the Hunspell word lists (dictionary-es, dictionary-fr).
// Only unambiguous entries are kept: the unaccented form must not itself be a word.
// Run: node scripts/build-accent-maps.mjs
import { writeFileSync } from "node:fs";
import es from "dictionary-es";
import fr from "dictionary-fr";

const strip = (w) => w.normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC");
const words = (dic) =>
  dic.toString("utf8").split("\n").slice(1)
    .map((l) => l.split("/")[0].trim())
    .filter((w) => /^[\p{Ll}]+(?:-[\p{Ll}]+)*$/u.test(w) && w.length > 1);

function build(dic, extraPlural) {
  const list = words(dic);
  const set = new Set(list);
  if (extraPlural) for (const w of list) if (/[aeiouáéíóúàâèêëîïôûù]$/.test(w)) set.add(w + "s");
  const map = {};
  const clash = new Set();
  for (const w of set) {
    const s = strip(w);
    if (s === w || set.has(s)) continue; // no accent, or the plain form is a word too ("papa", "esta")
    if (map[s] && map[s] !== w) clash.add(s);
    else map[s] = w;
  }
  for (const s of clash) delete map[s];
  return map;
}

for (const [name, dict] of [["es", es], ["fr", fr]]) {
  const map = build(dict.dic, true);
  writeFileSync(`src/lib/text/accents-${name}.json`, JSON.stringify(map));
  console.log(name, Object.keys(map).length, "entries");
}
