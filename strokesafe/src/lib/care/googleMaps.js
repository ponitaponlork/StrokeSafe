/*
  Google Maps JavaScript API loader (no extra npm dependency).

  Configuration (browser key, restricted by HTTP referrer: see README → "Google Maps"):
    VITE_GOOGLE_MAPS_API_KEY   required to use Google Maps
    VITE_GOOGLE_MAPS_MAP_ID    optional; enables Advanced Markers (otherwise classic markers are used)

  If the key is missing, invalid, or the script cannot load (offline), the promise rejects and
  Find Care falls back to the existing Leaflet / OpenStreetMap map. The facility list never depends on it.
*/

export function getGoogleMapsKey() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return typeof key === "string" && key.trim() ? key.trim() : "";
}

export function getGoogleMapId() {
  const id = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
  return typeof id === "string" && id.trim() ? id.trim() : "";
}

let loading = null;
const authListeners = new Set();

/** Called by Google when the key is rejected (wrong key, referrer not allowed, billing off…). */
function installAuthFailureHook() {
  if (window.__ssGmAuthHook) return;
  window.__ssGmAuthHook = true;
  const prev = window.gm_authFailure;
  window.gm_authFailure = () => {
    authListeners.forEach((fn) => fn());
    if (typeof prev === "function") prev();
  };
}

export function onGoogleMapsAuthFailure(fn) {
  installAuthFailureHook();
  authListeners.add(fn);
  return () => authListeners.delete(fn);
}

/**
 * Loads the Maps JavaScript API once and resolves with `window.google.maps`.
 * @param {{ key: string, language?: string }} opts
 */
export function loadGoogleMaps({ key, language = "km" }) {
  if (!key) return Promise.reject(new Error("GOOGLE_MAPS_KEY_MISSING"));
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  if (loading) return loading;

  installAuthFailureHook();
  loading = new Promise((resolve, reject) => {
    const cb = "__ssGoogleMapsReady";
    const timer = setTimeout(() => {
      loading = null;
      reject(new Error("GOOGLE_MAPS_TIMEOUT"));
    }, 15000);
    window[cb] = () => {
      clearTimeout(timer);
      delete window[cb];
      resolve(window.google.maps);
    };
    const params = new URLSearchParams({ key, v: "weekly", loading: "async", callback: cb, language, region: "KH" });
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.onerror = () => {
      clearTimeout(timer);
      loading = null;
      script.remove();
      reject(new Error("GOOGLE_MAPS_SCRIPT_FAILED"));
    };
    document.head.appendChild(script);
  });
  return loading;
}
