// distance.mjs -- distance and "nearest first" sorting for the facility finder (S7, S9).
//
// How teammate A uses it (in the React app):
//   import { sortByDistance, nearestFacilities } from "./distance.mjs";
//   const list = nearestFacilities(facilities, userLat, userLng, { limit: 5 });
//   // list[0].distanceKm is the distance in km, list[0].name is the name, etc.
//
// The distance is a straight line "as the crow flies" (Haversine formula), NOT the road
// distance. Say so on screen, e.g. "about 3.2 km away".

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/** Straight-line distance in km between two points given as latitude/longitude. */
export function distanceKm(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** Return a NEW list of facilities, each with a distanceKm field, nearest first.
 *  Facilities without valid coordinates are left out. */
export function sortByDistance(facilities, userLat, userLng) {
  return facilities
    .filter((f) => Number.isFinite(f.lat) && Number.isFinite(f.lng))
    .map((f) => ({ ...f, distanceKm: distanceKm(userLat, userLng, f.lat, f.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Convenience wrapper.
 *  options.types : e.g. ["hospital"] to keep only hospitals (default: all types)
 *  options.limit : how many to return (default 5)
 */
export function nearestFacilities(facilities, userLat, userLng, options = {}) {
  const { types = null, limit = 5 } = options;
  const wanted = types ? facilities.filter((f) => types.includes(f.type)) : facilities;
  return sortByDistance(wanted, userLat, userLng).slice(0, limit);
}

/** Nicer text for the screen: "850 m" or "3.2 km". */
export function formatDistance(km) {
  const meters = Math.round(km * 1000);
  return meters < 1000 ? `${meters} m` : `${km.toFixed(1)} km`; // 0.9996 km must read "1.0 km", not "1000 m"
}
