/**
 * build_facilities.mjs -- turn an OpenStreetMap (Overpass) export into facilities.json (B9 schema)
 *
 * Usage (from the repository root):
 *     node prototype/tools/build_facilities.mjs path/to/overpass_export.json
 *     node prototype/tools/build_facilities.mjs path/to/overpass_export.json --limit 40 --must "Calmette,Kossamak"
 *
 * Options:
 *     --limit N        how many facilities to keep (default 20)
 *     --must a,b       name words that must be kept (e.g. the hospitals named in the Build Guide)
 *     --bp-places N    reserve N places for the blood pressure filter: health centres, clinics and
 *                      pharmacies that have a phone number (default 5)
 *     --keep a,b       bring back an entry that was wrongly left out as "not a care facility"
 *     --no-exclude     do not leave anything out
 *
 * What it does:
 *   1. Reads the raw OpenStreetMap export (hospitals, clinics and, if you ask for them, pharmacies).
 *   2. Keeps only entries that have a name and coordinates, and leaves out entries that are clearly not
 *      a place to be treated (offices, companies, laboratories, Red Cross ...). The list is printed so you can check it.
 *   3. Converts each one to the simple shape the app uses (see makeFacility below).
 *   4. Applies "overrides" from data/facility_overrides.csv, where your business teammate
 *      records what the phone calls confirmed (type, province, phones, emergency, CT scan, ...).
 *   5. Keeps the --must names, reserves a few blood pressure places, then fills up with hospitals
 *      (hospitals that OpenStreetMap tags as having emergency care come first) until --limit is reached.
 *   6. Writes prototype/data/facilities.json by default
 *
 * Everything that was not confirmed by a phone call stays "unknown" and verified = false.
 * Never change "unknown" to "yes" unless someone has actually checked.
 *
 * Fields (Build Guide B9):
 *   id, name, name_km, type, lat, lng, province, district, phones (list), address,
 *   open_24h, emergency (= "emergency 24 hours"), ct_scan, checks_bp (= "blood pressure check available"),
 *   source, verified, verified_on (= "last verified on"), verified_by
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const SOURCE_TEXT = "OpenStreetMap contributors (ODbL)";
const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data");

// B9 facility types. OpenStreetMap only tells us hospital / private hospital / clinic / health
// centre / pharmacy. National, provincial and district hospitals must come from the overrides file.
const TYPES = [
  "hospital", // generic: the source does not say which kind
  "national_hospital",
  "provincial_referral_hospital",
  "district_referral_hospital",
  "private_hospital",
  "health_centre",
  "clinic",
  "pharmacy",
];
const HOSPITAL_TYPES = [
  "hospital",
  "national_hospital",
  "provincial_referral_hospital",
  "district_referral_hospital",
  "private_hospital",
];
const BP_ONLY_TYPES = ["health_centre", "clinic", "pharmacy"];
const CAPABILITY_VALUES = ["yes", "no", "unknown"];
const CAPABILITY_FIELDS = ["open_24h", "emergency", "ct_scan", "checks_bp"];

/** Prefer the English name, otherwise the main name. */
function getName(tags) {
  return tags["name:en"] || tags["name"];
}

/** OpenStreetMap separates several numbers with ';'. Returns an array (maybe empty). */
function getPhones(tags) {
  const raw = tags["phone"] || tags["contact:phone"] || "";
  return raw.split(";").map((p) => p.trim()).filter(Boolean);
}

/** Join whatever address parts exist, e.g. 'Street 271, Phnom Penh'. */
function getAddress(tags) {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"] || tags["addr:province"],
  ];
  const text = parts.filter(Boolean).join(", ");
  return text || null;
}

/** Map OpenStreetMap tags to one of our types. Returns null for things we do not use. */
export function getType(tags) {
  const amenity = tags["amenity"];
  if (amenity === "pharmacy") return "pharmacy";
  if (amenity !== "clinic" && amenity !== "hospital") return null;
  // The NAME beats the tag: volunteers often tag a health centre as "hospital".
  const name = (getName(tags) || "").toLowerCase();
  if (name.includes("health cent")) return "health_centre"; // matches "centre" and "center"
  if (name.includes("provincial referral hospital")) return "provincial_referral_hospital";
  if (amenity === "clinic") return "clinic";
  return tags["operator:type"] === "private" ? "private_hospital" : "hospital";
}

// Names that are not a place where a patient can be treated (offices, companies, labs ...).
const STRONG_JUNK = /\b(office|hq|head ?quarters?|laborator(?:y|ies)|red cross|warehouse|factory)\b/i;
const COMPANY_WORDS = /\b(corp|corporation|ltd|limited|company|co\.)(?=\W|$)/i;
const HEALTH_WORDS = /(hospital|clinic|health|medical|maternity|dental|paediatric|pediatric)/i;

/** Why a name does not look like a care facility, or null if it looks fine. */
export function junkReason(name) {
  if (STRONG_JUNK.test(name)) return "looks like an office, laboratory or organisation";
  if (COMPANY_WORDS.test(name) && !HEALTH_WORDS.test(name)) return "looks like a company";
  return null;
}

/** Nodes have lat/lon directly; buildings (ways) have a 'center'. */
function getCoordinates(element) {
  if ("lat" in element && "lon" in element) return [element.lat, element.lon];
  const center = element.center;
  if (center) return [center.lat ?? null, center.lon ?? null];
  return [null, null];
}

/** Convert one raw OpenStreetMap element to one app facility. Returns null to skip it. */
export function makeFacility(element) {
  const tags = element.tags || {};
  const name = getName(tags);
  const [lat, lng] = getCoordinates(element);
  const kind = getType(tags);
  if (!name || lat == null || lng == null || kind == null) return null;

  return {
    id: `${element.type}/${element.id}`, // e.g. "node/123456"
    name,
    name_km: tags["name:km"] ?? null,
    type: kind,
    lat,
    lng,
    province: tags["addr:province"] || tags["addr:state"] || null,
    district: tags["addr:district"] ?? null,
    phones: getPhones(tags),
    address: getAddress(tags),
    // Capabilities: "unknown" until a phone call confirms them.
    emergency: tags["emergency"] === "yes" ? "yes" : "unknown",
    open_24h: tags["opening_hours"] === "24/7" ? "yes" : "unknown",
    ct_scan: "unknown",
    checks_bp: "unknown",
    source: SOURCE_TEXT,
    verified: false,
    verified_on: null, // date of the phone call, e.g. "2026-11-24" (S7 shows it)
    verified_by: null, // who made the call
  };
}

/** Minimal RFC 4180 CSV parser (handles quotes, escaped quotes, CRLF). Returns rows of strings. */
function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Read data/facility_overrides.csv if it exists. Returns { id: { field: value } }.
 * CSV columns: id, type, province, district, phones, open_24h, emergency, ct_scan, checks_bp,
 *              verified, verified_on, verified_by
 * - Leave a cell empty to keep the existing value.
 * - phones: several numbers separated by ';'
 * - open_24h / emergency / ct_scan / checks_bp: yes, no or unknown (anything else is an error)
 * - verified: yes/true/1 (needs verified_on and verified_by)
 * A typo stops the script with a message that names the row, so a wrong value never slips in.
 */
export function loadOverrides(filePath) {
  const overrides = {};
  if (!fs.existsSync(filePath)) return overrides;

  const rows = parseCsv(fs.readFileSync(filePath, "utf-8"));
  if (rows.length === 0) return overrides;
  const header = rows[0].map((h) => h.trim());

  rows.slice(1).forEach((cells, index) => {
    const lineNumber = index + 2;
    if (cells.every((c) => c.trim() === "")) return; // blank line
    const row = {};
    header.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });

    const fid = (row.id || "").trim();
    if (!fid) return;
    const changes = {};

    for (const field of CAPABILITY_FIELDS) {
      const value = (row[field] || "").trim().toLowerCase();
      if (value) {
        if (!CAPABILITY_VALUES.includes(value)) {
          throw new Error(
            `${filePath} line ${lineNumber} (${fid}): ${field} must be yes, no or unknown, got '${value}'`
          );
        }
        changes[field] = value;
      }
    }

    const kind = (row.type || "").trim().toLowerCase();
    if (kind) {
      if (!TYPES.includes(kind)) {
        throw new Error(
          `${filePath} line ${lineNumber} (${fid}): type must be one of ${TYPES.join(", ")}, got '${kind}'`
        );
      }
      changes.type = kind;
    }

    for (const field of ["province", "district", "verified_on", "verified_by"]) {
      const value = (row[field] || "").trim();
      if (value) changes[field] = value;
    }

    const phones = (row.phones || "").split(";").map((p) => p.trim()).filter(Boolean);
    if (phones.length) changes.phones = phones;

    if (["true", "yes", "1"].includes((row.verified || "").trim().toLowerCase())) {
      if (!changes.verified_on || !changes.verified_by) {
        throw new Error(
          `${filePath} line ${lineNumber} (${fid}): verified needs verified_on (date) and verified_by (name)`
        );
      }
      changes.verified = true;
    }

    overrides[fid] = changes;
  });
  return overrides;
}

/** Keep the 'must' facilities first, then a few places for the blood pressure filter (health centres, clinics,
 *  pharmacies with a phone number), then fill up with hospitals: OSM-tagged emergency first, then with a phone. */
export function choose(facilities, mustKeywords, limit, bpPlaces = 0) {
  const chosen = [];
  const seen = new Set();
  const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

  const add = (f) => {
    if (!seen.has(f.id) && chosen.length < limit) {
      chosen.push(f);
      seen.add(f.id);
      return true;
    }
    return false;
  };

  for (const keyword of mustKeywords) {
    for (const f of facilities) {
      const text = `${f.name} ${f.name_km || ""}`.toLowerCase();
      if (text.includes(keyword.toLowerCase())) add(f);
    }
  }

  let reserved = 0;
  const bpCandidates = facilities.filter((f) => BP_ONLY_TYPES.includes(f.type) && f.phones.length > 0).sort(byName);
  for (const f of bpCandidates) {
    if (reserved >= bpPlaces) break;
    if (add(f)) reserved++;
  }

  const rest = [...facilities].sort((a, b) => {
    const ka = [!HOSPITAL_TYPES.includes(a.type), a.emergency !== "yes", a.phones.length === 0];
    const kb = [!HOSPITAL_TYPES.includes(b.type), b.emergency !== "yes", b.phones.length === 0];
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return Number(ka[i]) - Number(kb[i]);
    }
    return byName(a, b);
  });
  for (const f of rest) add(f);
  return chosen;
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string", default: path.join(DATA_DIR, "facilities.json") },
      overrides: { type: "string", default: path.join(DATA_DIR, "facility_overrides.csv") },
      limit: { type: "string", default: "20" },
      must: { type: "string", default: "" },
      "bp-places": { type: "string", default: "5" },
      keep: { type: "string", default: "" },
      "no-exclude": { type: "boolean", default: false },
    },
  });

  const input = positionals[0];
  if (!input) {
    console.error("Usage: node build_facilities.mjs <overpass_export.json> [--output F] [--overrides F] [--limit N] [--must a,b]");
    process.exit(1);
  }
  const limit = parseInt(values.limit, 10);

  const raw = JSON.parse(fs.readFileSync(input, "utf-8"));

  const keep = values.keep.split(",").map((w) => w.trim().toLowerCase()).filter(Boolean);
  const facilities = [];
  const excluded = [];
  for (const element of raw.elements || []) {
    const f = makeFacility(element);
    if (!f) continue;
    const reason = values["no-exclude"] ? null : junkReason(f.name);
    if (reason && !keep.some((k) => f.name.toLowerCase().includes(k))) excluded.push({ f, reason });
    else facilities.push(f);
  }
  console.log(`Found ${facilities.length} usable facilities in the export.`);
  if (excluded.length) {
    console.log(`Left out ${excluded.length} entries that do not look like care facilities (check them; --keep "name" brings one back):`);
    for (const { f, reason } of excluded) console.log(`   - ${f.name} (${f.id}): ${reason}`);
  }

  const overrides = loadOverrides(values.overrides);
  const byId = new Map(facilities.map((f) => [f.id, f]));
  let applied = 0;
  for (const [fid, changes] of Object.entries(overrides)) {
    const f = byId.get(fid);
    if (f) {
      Object.assign(f, changes);
      applied++;
    } else {
      console.log(`WARNING: overrides has id '${fid}' but it is not in the export (typo?).`);
    }
  }
  if (Object.keys(overrides).length) {
    console.log(`Applied overrides for ${applied} facilities.`);
  }

  const must = values.must.split(",").map((w) => w.trim()).filter(Boolean);
  const chosen = choose(facilities, must, limit, parseInt(values["bp-places"], 10));

  for (const w of must) {
    if (!chosen.some((f) => f.name.toLowerCase().includes(w.toLowerCase()))) {
      console.log(`WARNING: no facility matching '${w}' was found. Check the spelling or OSM.`);
    }
  }

  fs.mkdirSync(path.dirname(path.resolve(values.output)), { recursive: true });
  fs.writeFileSync(values.output, JSON.stringify(chosen, null, 2), "utf-8");
  console.log(`Wrote ${chosen.length} facilities to ${values.output}`);
}

// Run main() only when this file is started directly (so the test file can import the functions above)
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
