/*
  Approximate user location for distance sorting. Asked only when the user taps "Use my location".
  Kept in memory + sessionStorage for this visit only (not saved permanently).
*/
import { useCallback, useState } from "react";
import { PLACES } from "./facilities.js";

const KEY = "strokesafe.origin";

function readSaved() {
  try {
    const v = JSON.parse(window.sessionStorage.getItem(KEY) || "null");
    return v && typeof v.lat === "number" ? v : null;
  } catch {
    return null;
  }
}
function save(v) {
  try {
    if (v) window.sessionStorage.setItem(KEY, JSON.stringify(v));
    else window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function useUserLocation() {
  const [origin, setOrigin] = useState(readSaved);
  const [status, setStatus] = useState(origin ? "ready" : "idle"); // idle | asking | ready | denied | unavailable

  const askGps = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }
    setStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // round to ~100 m: approximate location is enough, and nothing more precise is kept
        const v = { lat: Math.round(pos.coords.latitude * 1000) / 1000, lng: Math.round(pos.coords.longitude * 1000) / 1000, source: "gps" };
        setOrigin(v);
        save(v);
        setStatus("ready");
      },
      (err) => setStatus(err.code === 1 ? "denied" : "unavailable"),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    );
  }, []);

  const choosePlace = useCallback((placeId) => {
    const p = PLACES.find((x) => x.id === placeId);
    if (!p) return;
    const v = { lat: p.lat, lng: p.lng, source: "place", placeId };
    setOrigin(v);
    save(v);
    setStatus("ready");
  }, []);

  const clear = useCallback(() => {
    setOrigin(null);
    save(null);
    setStatus("idle");
  }, []);

  return { origin, status, askGps, choosePlace, clear };
}
