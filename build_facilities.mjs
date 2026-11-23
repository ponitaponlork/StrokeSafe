/**
 * build_facilities.mjs -- turn an OpenStreetMap (Overpass) export into facilities.json (B9 schema)
 *
 * Usage (from the folder containing this file):
 *     node build_facilities.mjs ../data/raw/overpass_export.json
 *     node build_facilities.mjs ../data/raw/overpass_export.json --limit 20 --must "Calmette,Kossamak"
 *
 * What it does:
 *   1. Reads the raw OpenStreetMap export (hospitals, clinics and, if you ask for them, pharmacies).
 *   2. Keeps only entries that have a name and coordinates.
 *   3. Converts each one to the simple shape the app uses (see makeFacility below).
 *   4. Applies "overrides" from data/facility_overrides.csv, where your business teammate
 *      records what the phone calls confirmed (type, province, phones, emergency, CT scan, ...).
 *   5. Keeps the --must names, then fills up with other hospitals until --limit is reached.
 *   6. Writes ../data/facilities.json
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

const SOURCE_TEXT = "OpenStreetMap contributors (ODbL)";

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
function getType(tags) {
  const amenity = tags["amenity"];
  if (amenity === "pharmacy") return "pharmacy";
  if (amenity === "clinic") {
    const name = (getName(tags) || "").toLowerCase();
    return name.includes("health cent") ? "health_centre" : "clinic";
  }
  if (amenity === "hospital") {
    return tags["operator:type"] === "private" ? "private_hospital" : "hospital";
  }
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
function makeFacility(element) {
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
function loadOverrides(filePath) {
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

/** Keep the 'must' facilities first, then fill up with hospitals that have a phone number. */
function choose(facilities, mustKeywords, limit) {
  const chosen = [];
  const seen = new Set();

  const add = (f) => {
    if (!seen.has(f.id) && chosen.length < limit) {
      chosen.push(f);
      seen.add(f.id);
    }
  };

  for (const keyword of mustKeywords) {
    for (const f of facilities) {
      const text = `${f.name} ${f.name_km || ""}`.toLowerCase();
      if (text.includes(keyword.toLowerCase())) add(f);
    }
  }

  // Fill up: hospitals first, ones with a phone number first, then by name
  const rest = [...facilities].sort((a, b) => {
    const ka = [!HOSPITAL_TYPES.includes(a.type), a.phones.length === 0];
    const kb = [!HOSPITAL_TYPES.includes(b.type), b.phones.length === 0];
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return Number(ka[i]) - Number(kb[i]);
    }
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
  for (const f of rest) add(f);
  return chosen;
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string", default: "../data/facilities.json" },
      overrides: { type: "string", default: "../data/facility_overrides.csv" },
      limit: { type: "string", default: "20" },
      must: { type: "string", default: "" },
    },
  });

  const input = positionals[0];
  if (!input) {
    console.error("Usage: node build_facilities.mjs <overpass_export.json> [--output F] [--overrides F] [--limit N] [--must a,b]");
    process.exit(1);
  }
  const limit = parseInt(values.limit, 10);

  const raw = JSON.parse(fs.readFileSync(input, "utf-8"));

  const facilities = (raw.elements || []).map(makeFacility).filter(Boolean);
  console.log(`Found ${facilities.length} usable facilities in the export.`);

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
  const chosen = choose(facilities, must, limit);

  for (const w of must) {
    if (!chosen.some((f) => f.name.toLowerCase().includes(w.toLowerCase()))) {
      console.log(`WARNING: no facility matching '${w}' was found. Check the spelling or OSM.`);
    }
  }

  fs.mkdirSync(path.dirname(path.resolve(values.output)), { recursive: true });
  fs.writeFileSync(values.output, JSON.stringify(chosen, null, 2), "utf-8");
  console.log(`Wrote ${chosen.length} facilities to ${values.output}`);
}

main();
