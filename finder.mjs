// Facility Query, Filtering, Fallback & Labels (Build Guide B9)
// Same functions and same output fields as the finder.mjs you wrote. Two changes (marked CHANGED):
//   1. Emergency mode only lists HOSPITAL types, so a clinic, pharmacy or health centre whose emergency
//      status is "unknown" is never shown as an emergency option (B8: "go to the nearest hospital").
//   2. The 50 km fallback shows ONE place (the nearest provincial referral hospital that fits the mode)
//      instead of every provincial hospital in the country.
import { distanceKm, formatDistance } from "./distance.mjs";

const ALLOWED_CAPABILITIES = new Set(["yes", "no", "unknown"]);
const HOSPITAL_TYPES = new Set([
  "hospital",
  "national_hospital",
  "provincial_referral_hospital",
  "district_referral_hospital",
  "private_hospital",
]);
const BP_CARE_TYPES = new Set([
  ...HOSPITAL_TYPES,
  "health_centre",
  "health_center",
  "clinic",
  "pharmacy",
]);

function normalizeCapability(value) {
  return ALLOWED_CAPABILITIES.has(value) ? value : "unknown";
}

function isProvincialReferral(facility) {
  const typeMatch = facility.type === "provincial_referral_hospital";
  const nameMatch =
    typeof facility.name === "string" &&
    facility.name.toLowerCase().includes("provincial referral hospital");
  return typeMatch || nameMatch;
}

export function normalizeFacility(raw) {
  const lat = Number(raw.lat ?? raw.latitude);
  const lng = Number(raw.lng ?? raw.longitude);
  const emergency = normalizeCapability(raw.emergency ?? raw.emergency_24h);
  const open24h = normalizeCapability(raw.open_24h);
  const ctScan = normalizeCapability(raw.ct_scan);
  const checksBp = normalizeCapability(raw.checks_bp ?? raw.bp_check);
  const verifiedOn = raw.verified_on ?? raw.last_verified_on ?? null;
  const isVerified = Boolean(raw.verified && verifiedOn);

  return {
    ...raw,
    lat,
    lng,
    phones: Array.isArray(raw.phones) ? raw.phones : raw.phone_numbers ?? [],
    emergency,
    open_24h: open24h,
    ct_scan: ctScan,
    checks_bp: checksBp,
    verified: isVerified,
    verified_on: isVerified ? verifiedOn : null,
    verified_by: raw.verified_by ?? null,
  };
}

export function getVerificationLabel(facility) {
  if (facility.verified && facility.verified_on) {
    return `Verified on ${facility.verified_on}`;
  }
  return "Please call first";
}

export function hasVerifiedCtBadge(facility) {
  return Boolean(facility.verified && facility.verified_on && facility.ct_scan === "yes");
}

export function findFacilities({
  facilities,
  userLat,
  userLng,
  mode = "all", // "emergency" | "bp" | "all"
  maxDistanceKm = 50,
  limit = null,
}) {
  const originLat = Number(userLat);
  const originLng = Number(userLng);

  const ranked = facilities
    .map(normalizeFacility)
    .filter((f) => Number.isFinite(f.lat) && Number.isFinite(f.lng))
    .map((f) => {
      const dist = distanceKm(originLat, originLng, f.lat, f.lng);
      return {
        ...f,
        distance_km: dist,
        distance_label: formatDistance(dist),
        verification_label: getVerificationLabel(f),
        show_ct_badge: hasVerifiedCtBadge(f),
      };
    })
    .sort((a, b) => a.distance_km - b.distance_km);

  let candidates = ranked;

  if (mode === "emergency") {
    // CHANGED: hospital types only
    candidates = ranked.filter(
      (f) => HOSPITAL_TYPES.has(f.type) && (f.emergency === "yes" || f.emergency === "unknown")
    );
  } else if (mode === "bp") {
    candidates = ranked.filter((f) => BP_CARE_TYPES.has(f.type) && f.checks_bp !== "no");
  }

  const nearby = candidates.filter((f) => f.distance_km <= maxDistanceKm);

  let results = nearby;
  let usedProvincialFallback = false;

  if (results.length === 0) {
    // CHANGED: only the nearest provincial referral hospital that fits the mode (B9: "show the provincial referral hospital")
    const provincialFallback = candidates.filter(isProvincialReferral);
    if (provincialFallback.length > 0) {
      results = provincialFallback.slice(0, 1);
      usedProvincialFallback = true;
    } else {
      results = candidates.slice(0, 3);
    }
  }

  if (mode === "emergency") {
    results = results.slice(0, 3);
  } else if (typeof limit === "number" && limit > 0) {
    results = results.slice(0, limit);
  }

  return {
    mode,
    used_provincial_fallback: usedProvincialFallback,
    results,
  };
}
