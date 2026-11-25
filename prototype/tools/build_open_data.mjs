// build_open_data.mjs -- turn open_data_numbers.csv into files the app can use.
// (Node port of build_open_data.py. Same checks, same output files.)
//
// Usage:   node prototype/tools/build_open_data.mjs (from the repository root)
// Reads :  open_data_numbers.csv        (open in Excel / Google Sheets to check and edit)
// Writes:  open_data_numbers.mjs        (imported by steps.mjs and the app)
//          open_data_numbers.json       (same data as JSON)
//
// The editable CSV and generated data files live in ../data/ beside the logic and dashboard folders.
//
// Team workflow: when someone compares a number with the original source they set check_status to
// "verified" and fill in checked_by and checked_on, then run this script again.
// The script stops with a clear message if the sheet has a mistake.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(HERE, "../data");
const CSV_PATH = path.join(DATA_DIR, "open_data_numbers.csv");
const MJS_PATH = path.join(DATA_DIR, "open_data_numbers.mjs");
const JSON_PATH = path.join(DATA_DIR, "open_data_numbers.json");

const SOURCES = {
  steps2023: {
    name: "Ministry of Health, Cambodia, with WHO. Prevalence of non-communicable disease risk factors and conditions in Cambodia: STEPS Survey Country Report 2023",
    short: "STEPS 2023 (MoH/WHO)",
    url: "https://cdn.who.int/media/docs/default-source/ncds/ncd-surveillance/data-reporting/cambodia/cambodia-2023-steps-report-english-final.pdf",
  },
  who_wpro_2025: {
    name: "WHO Western Pacific. 1 in 5 Cambodian adults are at risk of stroke as noncommunicable disease risks increase. 11 March 2025",
    short: "WHO 2025",
    url: "https://www.who.int/westernpacific/newsroom/feature-stories/item/1-in-5-cambodian-adults-are-at-risk-of-stroke-as-noncommunicable-disease-risks-increase",
  },
  who_ghe_2021: {
    name: "WHO Global Health Estimates 2021 (causes of death); total deaths from UN World Population Prospects 2024",
    short: "WHO GHE 2021",
    url: "https://www.indexmundi.com/clocks/indicator/deaths/cambodia",
    note: "Accessed through IndexMundi. VERIFY on the WHO data portal and quote WHO figures from there.",
  },
  gbd2019: {
    name: "Stroke incidence, mortality, prevalence and DALYs in Asia 1990-2019 (Global Burden of Disease data, Cambodia rows). Karger",
    short: "GBD 2019",
    url: "https://karger.com/view-large/16232851",
    note: "Second table: https://karger.com/view-large/16232816",
  },
  whs_plus_2023: {
    name: "WHO World Health Survey Plus, Cambodia 2023, microdata catalogue (stroke variable q4010)",
    short: "WHO WHS+ 2023",
    url: "https://apps.who.int/healthinfo/systems/surveydata/index.php/catalog/224/variable/F2/V806?name=q4010",
  },
};
const KINDS = ["survey", "estimate", "model_estimate"];
const STATUSES = ["from_guide", "verified"];

/** Small CSV parser (handles quoted fields, commas and line breaks inside quotes, and a BOM). */
function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x !== "")) rows.push(row);
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ""])));
}

export function readRows(csvPath) {
  const rows = parseCsv(fs.readFileSync(csvPath, "utf-8"));
  const seen = new Set();
  return rows.map((row, i) => {
    const where = `${csvPath} line ${i + 2} (${row.id})`;
    const id = (row.id || "").trim();
    if (!id) throw new Error(`${where}: id is empty`);
    if (seen.has(id)) throw new Error(`${where}: duplicate id`);
    seen.add(id);

    const raw = (row.value || "").trim();
    const value = raw === "" ? NaN : Number(raw);
    if (!Number.isFinite(value)) throw new Error(`${where}: value '${row.value}' is not a number`);

    if (!(row.source_id in SOURCES))
      throw new Error(`${where}: unknown source_id '${row.source_id}' (use one of ${Object.keys(SOURCES).join(", ")})`);
    if (!KINDS.includes(row.kind)) throw new Error(`${where}: kind must be one of ${KINDS.join(", ")}`);
    const status = (row.check_status || "").trim();
    if (!STATUSES.includes(status)) throw new Error(`${where}: check_status must be one of ${STATUSES.join(", ")}`);
    if (status === "verified" && !(row.checked_by && row.checked_on))
      throw new Error(`${where}: verified needs checked_by and checked_on`);

    return {
      id,
      label: row.label.trim(),
      value,
      unit: row.unit.trim(),
      group: row.group.trim(),
      source_id: row.source_id,
      table_or_page: row.table_or_page.trim() || null,
      kind: row.kind,
      note: row.note.trim() || null,
      check_status: status,
      checked_by: row.checked_by.trim() || null,
      checked_on: row.checked_on.trim() || null,
    };
  });
}

function main() {
  const numbers = readRows(CSV_PATH);
  fs.writeFileSync(JSON_PATH, JSON.stringify({ sources: SOURCES, numbers }, null, 2));
  fs.writeFileSync(
    MJS_PATH,
    "// GENERATED by build_open_data.mjs from open_data_numbers.csv. Do not edit by hand:\n" +
      "// change the CSV and run the script again.\n\n" +
      "export const SOURCES = " + JSON.stringify(SOURCES, null, 2) + ";\n\n" +
      "export const NUMBERS = " + JSON.stringify(numbers, null, 2) + ";\n\n" +
      "export const NUMBERS_BY_ID = Object.fromEntries(NUMBERS.map((n) => [n.id, n]));\n"
  );
  const verified = numbers.filter((n) => n.check_status === "verified").length;
  console.log(`${numbers.length} numbers written (${verified} verified against the original source).`);
  console.log(`  ${MJS_PATH}\n  ${JSON_PATH}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (e) { console.error(e.message); process.exit(1); }
}
