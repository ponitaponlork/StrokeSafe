// Tests for finder.mjs (Build Guide B9).  Run with:  node finder_test.mjs
// Needs finder.mjs and distance.mjs in the same folder. The last test also checks the real data list.
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  findFacilities, normalizeFacility, getVerificationLabel, hasVerifiedCtBadge,
} from "./finder.mjs";

// The user stands at 11.50, 105.00. One degree of latitude is about 111.2 km.
const USER = { lat: 11.5, lng: 105.0 };
const at = (km) => USER.lat + km / 111.2; // a latitude that is `km` kilometres north of the user
const place = (id, type, km, extra = {}) => ({
  id, name: id, type, lat: at(km), lng: USER.lng, emergency: "unknown", checks_bp: "unknown",
  ct_scan: "unknown", verified: false, ...extra,
});
const find = (facilities, options = {}) =>
  findFacilities({ facilities, userLat: USER.lat, userLng: USER.lng, ...options });
const ids = (r) => r.results.map((f) => f.id);

const TESTS = [];
const test = (name, fn) => TESTS.push([name, fn]);

// ---------------------------------------------------------------- normalising and labels
test("anything that is not yes / no / unknown becomes 'unknown' (never guess)", () => {
  const f = normalizeFacility({ lat: 1, lng: 1, emergency: "Yes", ct_scan: "maybe", checks_bp: undefined, open_24h: true });
  assert.deepEqual([f.emergency, f.ct_scan, f.checks_bp, f.open_24h], ["unknown", "unknown", "unknown", "unknown"]);
  assert.equal(normalizeFacility({ lat: 1, lng: 1, emergency: "no" }).emergency, "no");
});

test("alternative field names are understood", () => {
  const f = normalizeFacility({ latitude: "11.5", longitude: "105", emergency_24h: "yes", bp_check: "no",
    last_verified_on: "2026-11-24", verified: true, phone_numbers: ["1"] });
  assert.equal(f.lat, 11.5);
  assert.equal(f.emergency, "yes");
  assert.equal(f.checks_bp, "no");
  assert.equal(f.verified_on, "2026-11-24");
  assert.deepEqual(f.phones, ["1"]);
});

test("'verified' without a date does not count as verified", () => {
  const f = normalizeFacility({ lat: 1, lng: 1, verified: true });
  assert.equal(f.verified, false);
  assert.equal(getVerificationLabel(f), "Please call first");
});

test("verification label and CT badge (badge only if CT = yes AND verified)", () => {
  const v = normalizeFacility({ lat: 1, lng: 1, verified: true, verified_on: "2026-11-24", ct_scan: "yes" });
  assert.equal(getVerificationLabel(v), "Verified on 2026-11-24");
  assert.equal(hasVerifiedCtBadge(v), true);
  assert.equal(hasVerifiedCtBadge(normalizeFacility({ lat: 1, lng: 1, ct_scan: "yes" })), false);
  assert.equal(hasVerifiedCtBadge({ ...v, ct_scan: "unknown" }), false);
});

// ---------------------------------------------------------------- modes
const MIX = [
  place("h1", "hospital", 1, { emergency: "yes" }),
  place("clinic", "clinic", 0.3),                         // nearest, but not a hospital
  place("pharm", "pharmacy", 0.2, { checks_bp: "yes" }),
  place("hc", "health_centre", 0.5, { checks_bp: "yes" }),
  place("h2", "hospital", 3),                              // emergency unknown: kept
  place("h3", "private_hospital", 4, { emergency: "no" }), // says no emergency: dropped
  place("h4", "national_hospital", 6, { emergency: "yes" }),
  place("h5", "hospital", 8),
  place("bad", "hospital", 2, { lat: "x" }),               // broken coordinates: skipped
];

test("emergency mode: hospital types only, drops 'no', keeps 'unknown', nearest first, top 3", () => {
  const r = find(MIX, { mode: "emergency" });
  assert.deepEqual(ids(r), ["h1", "h2", "h4"]);
  assert.equal(r.used_provincial_fallback, false);
});

test("emergency mode never lists a clinic, pharmacy or health centre, even when they are nearest", () => {
  for (const id of ids(find(MIX, { mode: "emergency" }))) assert.ok(!["clinic", "pharm", "hc"].includes(id));
});

test("blood pressure mode: clinics, pharmacies, health centres and hospitals; drops 'no'", () => {
  const list = [...MIX, place("nobp", "clinic", 0.1, { checks_bp: "no" })];
  const r = find(list, { mode: "bp" });
  assert.ok(!ids(r).includes("nobp"));
  assert.deepEqual(ids(r).slice(0, 4), ["pharm", "clinic", "hc", "h1"]);
});

test("all mode returns everything within 50 km, and limit works", () => {
  assert.equal(find(MIX, { mode: "all" }).results.length, 8); // 'bad' is skipped
  assert.equal(find(MIX, { mode: "all", limit: 2 }).results.length, 2);
});

test("sorted by distance only: a near unverified place comes before a far verified one", () => {
  const list = [
    place("far", "hospital", 10, { emergency: "yes", verified: true, verified_on: "2026-11-24", ct_scan: "yes" }),
    place("near", "hospital", 1),
  ];
  assert.deepEqual(ids(find(list, { mode: "emergency" })), ["near", "far"]);
});

test("places further than 50 km are left out when something is nearer", () => {
  const list = [place("a", "hospital", 10), place("b", "hospital", 60)];
  assert.deepEqual(ids(find(list)), ["a"]);
});

// ---------------------------------------------------------------- the 50 km fallback
test("nothing within 50 km -> ONE place: the nearest provincial referral hospital (even if a plain hospital is nearer)", () => {
  const list = [
    place("plain", "hospital", 80, { emergency: "yes" }),
    place("prov2", "provincial_referral_hospital", 150),
    place("prov1", "provincial_referral_hospital", 120),
  ];
  const r = find(list, { mode: "emergency" });
  assert.equal(r.used_provincial_fallback, true);
  assert.deepEqual(ids(r), ["prov1"]);
});

test("a place is also recognised as provincial by its name", () => {
  const list = [place("x", "hospital", 80, { name: "Kampot Provincial Referral Hospital" })];
  assert.equal(find(list, { mode: "all" }).used_provincial_fallback, true);
});

test("the fallback respects the mode: a provincial hospital that says 'no emergency' is not used", () => {
  const list = [
    place("prov", "provincial_referral_hospital", 80, { emergency: "no" }),
    place("other", "hospital", 90, { emergency: "yes" }),
  ];
  const r = find(list, { mode: "emergency" });
  assert.equal(r.used_provincial_fallback, false);
  assert.deepEqual(ids(r), ["other"]);
});

test("no provincial hospital in the data -> the nearest candidates, flag stays false", () => {
  const list = [place("a", "hospital", 80), place("b", "hospital", 90), place("c", "hospital", 100), place("d", "hospital", 110)];
  const r = find(list, { mode: "all" });
  assert.equal(r.used_provincial_fallback, false);
  assert.deepEqual(ids(r), ["a", "b", "c"]);
});

// ---------------------------------------------------------------- robustness
test("empty list does not crash", () => {
  assert.deepEqual(find([], { mode: "emergency" }), { mode: "emergency", used_provincial_fallback: false, results: [] });
});

test("the input list is not changed", () => {
  const copy = JSON.stringify(MIX);
  find(MIX, { mode: "emergency" });
  assert.equal(JSON.stringify(MIX), copy);
});

test("result fields the screen needs are present", () => {
  const f = find(MIX, { mode: "emergency" }).results[0];
  assert.equal(f.distance_label, "1.0 km");
  assert.equal(f.verification_label, "Please call first");
  assert.equal(f.show_ct_badge, false);
  assert.ok(Number.isFinite(f.distance_km));
});

// ---------------------------------------------------------------- your real data
test("REAL DATA: emergency results near central Phnom Penh are hospitals, not offices or companies", () => {
  const candidates = ["../data/facilities.json"].map((p) => new URL(p, import.meta.url));
  const file = candidates.find((u) => fs.existsSync(u));
  if (!file) return console.log("        (skipped: facilities.json not found next to this file)");
  const facilities = JSON.parse(fs.readFileSync(file, "utf8"));
  const r = findFacilities({ facilities, userLat: 11.5564, userLng: 104.9282, mode: "emergency" });
  assert.ok(r.results.length > 0, "no emergency results near Phnom Penh");
  for (const f of r.results) {
    assert.ok(/hospital/.test(f.type), `${f.name} is typed ${f.type}`);
    assert.ok(!/\b(office|hq|corp|ltd|laborator\w*|red cross)\b/i.test(f.name), `${f.name} does not look like a hospital`);
  }
  for (const f of facilities) {
    assert.ok(f.source && f.source.includes("OpenStreetMap"), `${f.name} has no open data source`);
    assert.equal(f.verified && !f.verified_on, false, `${f.name} is verified without a date`);
  }
});

// ---------------------------------------------------------------- run
let passed = 0;
for (const [name, fn] of TESTS) {
  try {
    fn();
    passed++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    process.exitCode = 1;
    console.log(`[FAIL] ${name}\n        ${err.message.split("\n")[0]}`);
  }
}
console.log(`\n${passed}/${TESTS.length} tests passed`);
