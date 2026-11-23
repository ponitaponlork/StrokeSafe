// Run with:  node distance.test.mjs     (needs Node.js, nothing else)
import assert from "node:assert";
import { distanceKm, sortByDistance, nearestFacilities, formatDistance } from "./distance.mjs";

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    console.log(`[FAIL] ${name}\n        ${err.message}`);
    process.exitCode = 1;
  }
}

test("same point = 0 km", () => {
  assert.strictEqual(distanceKm(11.55, 104.92, 11.55, 104.92), 0);
});

test("1 degree of latitude is about 111.2 km", () => {
  const d = distanceKm(11, 104, 12, 104);
  assert.ok(Math.abs(d - 111.2) < 0.5, `got ${d}`);
});

test("distance is the same in both directions", () => {
  const a = distanceKm(11.55, 104.92, 13.36, 103.86);
  const b = distanceKm(13.36, 103.86, 11.55, 104.92);
  assert.ok(Math.abs(a - b) < 1e-9);
});

// Fake facilities, placed north of the user at different distances
const user = { lat: 11.5, lng: 105.0 };
const fakes = [
  { id: "far", name: "Far", type: "hospital", lat: 11.7, lng: 105.0 },
  { id: "near", name: "Near", type: "clinic", lat: 11.51, lng: 105.0 },
  { id: "mid", name: "Mid", type: "hospital", lat: 11.6, lng: 105.0 },
  { id: "broken", name: "No coordinates", type: "hospital" },
];

test("sorted nearest first, and broken entries are dropped", () => {
  const result = sortByDistance(fakes, user.lat, user.lng);
  assert.deepStrictEqual(result.map((f) => f.id), ["near", "mid", "far"]);
});

test("original list is not changed", () => {
  const copy = JSON.stringify(fakes);
  sortByDistance(fakes, user.lat, user.lng);
  assert.strictEqual(JSON.stringify(fakes), copy);
});

test("type filter and limit work", () => {
  const result = nearestFacilities(fakes, user.lat, user.lng, { types: ["hospital"], limit: 1 });
  assert.deepStrictEqual(result.map((f) => f.id), ["mid"]);
});

test("formatDistance", () => {
  assert.strictEqual(formatDistance(0.85), "850 m");
  assert.strictEqual(formatDistance(3.24), "3.2 km");
  assert.strictEqual(formatDistance(0.9996), "1.0 km"); // not "1000 m"
  assert.strictEqual(formatDistance(0.9994), "999 m");
  assert.strictEqual(formatDistance(0), "0 m");
});

console.log(`\n${passed} tests passed`);
