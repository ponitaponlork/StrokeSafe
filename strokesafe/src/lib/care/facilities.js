/*
  Facility finder logic (B9). Pure functions so they can be tested (facilities.test.js).
  - Distance: Haversine formula. Sort by distance only (never by payment or sponsorship).
  - Unknown capabilities stay "unknown": they are never shown as verified.
*/

const EARTH_RADIUS_KM = 6371;
const toRad = (d) => (d * Math.PI) / 180;

export function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export const HOSPITAL_TYPES = new Set(["national_hospital", "provincial_referral_hospital", "district_referral_hospital", "private_hospital"]);
const BP_PLACE_TYPES = new Set(["health_centre", "clinic", "pharmacy"]);

/** "verified" only when a capability is "yes" AND the facility has a verification date. */
export function isVerifiedYes(facility, field) {
  return facility[field] === "yes" && !!facility.lastVerifiedOn;
}

export function filterByMode(facilities, mode) {
  if (mode === "emergency") {
    // B9: only facilities with emergency 24 hours = yes or unknown
    return facilities.filter((f) => HOSPITAL_TYPES.has(f.type) && (f.emergency24h === "yes" || f.emergency24h === "unknown"));
  }
  // BP mode: health centres, clinics, pharmacies, and hospitals that check blood pressure
  return facilities.filter((f) => f.bpCheck !== "no" && (BP_PLACE_TYPES.has(f.type) || HOSPITAL_TYPES.has(f.type)));
}

/** Adds distanceKm (or null with no location) and sorts. Verified "yes" ranks before unknown only in emergency mode at equal distance. */
export function sortByDistance(facilities, origin) {
  const withDist = facilities.map((f) => ({ ...f, distanceKm: origin ? haversineKm(origin, f) : null }));
  if (!origin) return withDist.sort((a, b) => a.name.en.localeCompare(b.name.en));
  return withDist.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Main entry: returns { list, nearestTooFar }.
 * Emergency mode → top three nearest (plain distance order).
 * If nothing is within 50 km, flag it so the UI can point to the provincial referral hospital (B9).
 */
export function findFacilities(facilities, { mode = "bp", origin = null, limit } = {}) {
  let list = sortByDistance(filterByMode(facilities, mode), origin);
  const nearestTooFar = !!origin && list.length > 0 && list[0].distanceKm > 50;
  if (nearestTooFar) {
    const referral = list.filter((f) => f.type === "provincial_referral_hospital");
    const rest = list.filter((f) => f.type !== "provincial_referral_hospital");
    list = [...referral, ...rest];
  }
  if (mode === "emergency") list = list.slice(0, 3);
  if (limit) list = list.slice(0, limit);
  return { list, nearestTooFar };
}

export function mapsUrl(f) {
  return `https://www.openstreetmap.org/?mlat=${f.lat}&mlon=${f.lng}#map=17/${f.lat}/${f.lng}`;
}

export function telHref(phone) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Provincial town centres (approximate) for manual location choice when GPS is denied. */
export const PLACES = [
  { id: "phnom_penh", en: "Phnom Penh", km: "ភ្នំពេញ", lat: 11.5564, lng: 104.9282 },
  { id: "siem_reap", en: "Siem Reap", km: "សៀមរាប", lat: 13.3618, lng: 103.8606 },
  { id: "battambang", en: "Battambang", km: "បាត់ដំបង", lat: 13.1027, lng: 103.1982 },
  { id: "kampong_cham", en: "Kampong Cham", km: "កំពង់ចាម", lat: 11.9934, lng: 105.4635 },
  { id: "sihanoukville", en: "Preah Sihanouk", km: "ព្រះសីហនុ", lat: 10.6273, lng: 103.5222 },
  { id: "kampot", en: "Kampot", km: "កំពត", lat: 10.6104, lng: 104.1815 },
  { id: "takeo", en: "Takeo", km: "តាកែវ", lat: 10.9908, lng: 104.785 },
  { id: "kandal", en: "Kandal (Ta Khmau)", km: "កណ្ដាល (តាខ្មៅ)", lat: 11.4833, lng: 104.95 },
  { id: "kampong_speu", en: "Kampong Speu", km: "កំពង់ស្ពឺ", lat: 11.453, lng: 104.52 },
  { id: "kampong_chhnang", en: "Kampong Chhnang", km: "កំពង់ឆ្នាំង", lat: 12.25, lng: 104.6667 },
  { id: "pursat", en: "Pursat", km: "ពោធិ៍សាត់", lat: 12.5388, lng: 103.9192 },
  { id: "kampong_thom", en: "Kampong Thom", km: "កំពង់ធំ", lat: 12.7111, lng: 104.8887 },
  { id: "prey_veng", en: "Prey Veng", km: "ព្រៃវែង", lat: 11.4868, lng: 105.3253 },
  { id: "svay_rieng", en: "Svay Rieng", km: "ស្វាយរៀង", lat: 11.0879, lng: 105.7993 },
  { id: "kratie", en: "Kratie", km: "ក្រចេះ", lat: 12.4881, lng: 106.0188 },
  { id: "banteay_meanchey", en: "Banteay Meanchey", km: "បន្ទាយមានជ័យ", lat: 13.5859, lng: 102.9737 },
  { id: "oddar_meanchey", en: "Oddar Meanchey", km: "ឧត្ដរមានជ័យ", lat: 14.1817, lng: 103.5176 },
  { id: "preah_vihear", en: "Preah Vihear", km: "ព្រះវិហារ", lat: 13.8, lng: 104.98 },
  { id: "stung_treng", en: "Stung Treng", km: "ស្ទឹងត្រែង", lat: 13.5259, lng: 105.9683 },
  { id: "ratanakiri", en: "Ratanakiri", km: "រតនគិរី", lat: 13.7394, lng: 106.9873 },
  { id: "mondulkiri", en: "Mondulkiri", km: "មណ្ឌលគិរី", lat: 12.4558, lng: 107.1881 },
  { id: "koh_kong", en: "Koh Kong", km: "កោះកុង", lat: 11.6175, lng: 102.9849 },
  { id: "kep", en: "Kep", km: "កែប", lat: 10.4829, lng: 104.3167 },
  { id: "pailin", en: "Pailin", km: "ប៉ៃលិន", lat: 12.8489, lng: 102.6093 },
  { id: "tbong_khmum", en: "Tbong Khmum", km: "ត្បូងឃ្មុំ", lat: 11.912, lng: 105.653 },
];
