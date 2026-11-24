/*
  Checks the translation files:
  1. en.json and km.json have exactly the same keys,
  2. no value is empty,
  3. every literal key used in the code, t("…") or translate(lang, "…"), exists.
  Run: node scripts/check-i18n.mjs   (also part of `npm test`)
*/
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const en = JSON.parse(readFileSync(join(root, "src/i18n/en.json"), "utf8"));
const km = JSON.parse(readFileSync(join(root, "src/i18n/km.json"), "utf8"));
const meta = (k) => k.startsWith("_");
let problems = 0;
const fail = (msg) => {
  problems++;
  console.error("✗ " + msg);
};

for (const k of Object.keys(en)) if (!meta(k) && !(k in km)) fail(`missing in km.json: ${k}`);
for (const k of Object.keys(km)) if (!meta(k) && !(k in en)) fail(`missing in en.json: ${k}`);
for (const [name, dict] of [["en", en], ["km", km]])
  for (const [k, v] of Object.entries(dict)) if (!meta(k) && !String(v).trim()) fail(`empty value in ${name}.json: ${k}`);

// placeholders like {n} must match between languages
for (const k of Object.keys(en)) {
  if (meta(k) || !km[k]) continue;
  const a = (en[k].match(/\{\w+\}/g) || []).sort().join();
  const b = (km[k].match(/\{\w+\}/g) || []).sort().join();
  if (a !== b) fail(`placeholders differ for ${k}: en[${a}] km[${b}]`);
}

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|mjs)$/.test(f) && !f.includes(".test.") && !p.includes("/preview/")) out.push(p);
  }
  return out;
}
const used = new Set();
for (const file of walk(join(root, "src"))) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/\bt\(\s*"([^"]+)"/g)) used.add(m[1]);
  for (const m of src.matchAll(/translate\(\s*"(?:en|km)"\s*,\s*"([^"]+)"/g)) used.add(m[1]);
  for (const m of src.matchAll(/(?:labelKey|key|reason|headline|sub|extra|label):\s*"([a-z][\w]*\.[\w.]+)"/g)) used.add(m[1]);
}
for (const k of used) if (!(k in en)) fail(`used in code but missing in en.json: ${k}`);

const total = Object.keys(en).filter((k) => !meta(k)).length;
if (problems) {
  console.error(`\n${problems} i18n problem(s).`);
  process.exit(1);
}
console.log(`✓ i18n OK: ${total} keys in each language, ${used.size} literal keys used in code all present.`);
