import { test } from "node:test";
import assert from "node:assert/strict";
import { haversineKm, findFacilities, isVerifiedYes } from "./facilities.js";

const F = (id, type, lat, lng, extra = {}) => ({
  id, type, lat, lng, name: { en: id, km: id },
  open24h: "unknown", emergency24h: "unknown", ctScan: "unknown", bpCheck: "unknown", lastVerifiedOn: null, ...extra,
});

const list = [
  F("far", "national_hospital", 13.36, 103.86),
  F("near", "national_hospital", 11.58, 104.92),
  F("pharmacy", "pharmacy", 11.57, 104.91),
  F("no-er", "private_hospital", 11.56, 104.92, { emergency24h: "no" }),
  F("mid", "provincial_referral_hospital", 12.0, 105.46),
  F("extra", "national_hospital", 11.55, 104.90),
];

test("haversine: Phnom Penh → Siem Reap is about 230 km in a straight line", () => {
  const d = haversineKm({ lat: 11.5564, lng: 104.9282 }, { lat: 13.3618, lng: 103.8606 });
  assert.ok(d > 220 && d < 245, `got ${d}`);
});

test("sorts by distance", () => {
  const { list: out } = findFacilities(list, { mode: "bp", origin: { lat: 11.57, lng: 104.91 } });
  assert.equal(out[0].id, "pharmacy");
  const d = out.map((f) => f.distanceKm);
  assert.deepEqual(d, [...d].sort((a, b) => a - b));
});

test("emergency mode: hospitals only, never emergency24h = no, top three", () => {
  const { list: out } = findFacilities(list, { mode: "emergency", origin: { lat: 11.57, lng: 104.91 } });
  assert.equal(out.length, 3);
  assert.ok(out.every((f) => f.type !== "pharmacy" && f.emergency24h !== "no"));
});

test("nothing within 50 km → provincial referral hospital first", () => {
  const r = findFacilities(list, { mode: "bp", origin: { lat: 14.18, lng: 103.52 } });
  assert.equal(r.nearestTooFar, true);
  assert.equal(r.list[0].type, "provincial_referral_hospital");
});

test("unknown or unverified capabilities are never 'verified'", () => {
  assert.equal(isVerifiedYes(F("x", "clinic", 0, 0, { ctScan: "unknown" }), "ctScan"), false);
  assert.equal(isVerifiedYes(F("x", "clinic", 0, 0, { ctScan: "yes" }), "ctScan"), false);
  assert.equal(isVerifiedYes(F("x", "clinic", 0, 0, { ctScan: "yes", lastVerifiedOn: "2026-11-20" }), "ctScan"), true);
});
