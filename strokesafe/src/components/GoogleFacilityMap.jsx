/*
  Find Care map using the Google Maps JavaScript API.
  Same props as the Leaflet FacilityMap, so CareScreen can switch between them:
    facilities, origin, selectedId, onSelect, onFail
  - Numbered markers in list order (nearest first); the selected one is larger and darker.
  - Selecting a marker (or a list item) opens an info window with name, type, distance,
    verification status and an "Open in maps" link. Data comes only from facilities.json.
  - Calls onFail() if the script, key or network fails, so the parent can fall back to Leaflet.
*/
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { getGoogleMapId, getGoogleMapsKey, loadGoogleMaps, onGoogleMapsAuthFailure } from "../lib/care/googleMaps.js";
import { mapsUrl } from "../lib/care/facilities.js";

const BLUE = "#2f64f0";
const BLUE_DARK = "#2449d6";
const GREEN = "#12805c";
const CAMBODIA = { lat: 12.5, lng: 104.9 };

function el(tag, { className, text, style, attrs } = {}, children = []) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text; // textContent only: never inject HTML
  if (style) Object.assign(n.style, style);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  children.forEach((c) => n.appendChild(c));
  return n;
}

function pinElement(rank, selected) {
  const size = selected ? 36 : 30;
  return el("div", {
    text: String(rank),
    style: {
      width: `${size}px`, height: `${size}px`, borderRadius: "9999px", display: "grid", placeItems: "center",
      background: selected ? BLUE_DARK : BLUE, color: "#fff", border: "3px solid #fff", font: "700 13px Poppins, system-ui, sans-serif",
      boxShadow: "0 6px 16px -4px rgb(15 26 59 / 0.45)",
    },
  });
}

/** Advanced markers are removed with `.map = null`, classic markers with `.setMap(null)`. */
function removeMarker(m) {
  if (!m) return;
  if (typeof m.setMap === "function") m.setMap(null);
  else m.map = null;
}

export default function GoogleFacilityMap({ facilities, origin, selectedId, onSelect, onFail }) {
  const { t, lang } = useLanguage();
  const box = useRef(null);
  const map = useRef(null);
  const info = useRef(null);
  const markers = useRef(new Map());
  const originMarker = useRef(null);
  const advanced = useRef(false);
  const [state, setState] = useState("loading");
  const onFailRef = useRef(onFail);
  onFailRef.current = onFail;

  // 1. Load the API and create the map once.
  useEffect(() => {
    let cancelled = false;
    const fail = () => {
      if (cancelled) return;
      setState("failed");
      onFailRef.current?.();
    };
    const offAuth = onGoogleMapsAuthFailure(fail);
    loadGoogleMaps({ key: getGoogleMapsKey(), language: lang === "km" ? "km" : "en" })
      .then(async (gm) => {
        if (cancelled || !box.current) return;
        const { Map, InfoWindow } = await gm.importLibrary("maps");
        const mapId = getGoogleMapId();
        if (mapId) {
          try {
            await gm.importLibrary("marker");
            advanced.current = true;
          } catch {
            advanced.current = false;
          }
        }
        if (cancelled || !box.current) return;
        map.current = new Map(box.current, {
          center: CAMBODIA,
          zoom: 7,
          mapId: mapId || undefined,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          clickableIcons: false,
          gestureHandling: "cooperative",
        });
        info.current = new InfoWindow();
        setState("ready");
      })
      .catch(fail);
    return () => {
      cancelled = true;
      offAuth();
      markers.current.forEach(removeMarker);
      markers.current.clear();
      removeMarker(originMarker.current);
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Draw markers whenever the list or the user's position changes.
  useEffect(() => {
    const gm = window.google?.maps;
    if (state !== "ready" || !gm || !map.current) return;
    markers.current.forEach(removeMarker);
    markers.current.clear();

    const bounds = new gm.LatLngBounds();
    facilities.forEach((f, i) => {
      const position = { lat: f.lat, lng: f.lng };
      const title = `${i + 1}. ${f.name[lang] || f.name.en}`;
      const selected = f.id === selectedId;
      let marker;
      if (advanced.current) {
        marker = new gm.marker.AdvancedMarkerElement({ map: map.current, position, title, content: pinElement(i + 1, selected), zIndex: selected ? 10 : 1 });
        marker.addListener("click", () => onSelect?.(f.id));
      } else {
        marker = new gm.Marker({
          map: map.current,
          position,
          title,
          label: { text: String(i + 1), color: "#fff", fontWeight: "700", fontSize: "12px" },
          icon: { path: gm.SymbolPath.CIRCLE, scale: selected ? 15 : 12, fillColor: selected ? BLUE_DARK : BLUE, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 },
          zIndex: selected ? 10 : 1,
        });
        marker.addListener("click", () => onSelect?.(f.id));
      }
      markers.current.set(f.id, marker);
      bounds.extend(position);
    });

    removeMarker(originMarker.current);
    originMarker.current = null;
    if (origin) {
      const position = { lat: origin.lat, lng: origin.lng };
      originMarker.current = advanced.current
        ? new gm.marker.AdvancedMarkerElement({
            map: map.current, position, title: t("care.you"),
            content: el("div", { style: { width: "18px", height: "18px", borderRadius: "9999px", background: GREEN, border: "3px solid #fff", boxShadow: "0 0 0 2px rgb(18 128 92 / 0.35)" } }),
          })
        : new gm.Marker({ map: map.current, position, title: t("care.you"), icon: { path: gm.SymbolPath.CIRCLE, scale: 8, fillColor: GREEN, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 } });
      bounds.extend(position);
    }

    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, 40);
      gm.event.addListenerOnce(map.current, "idle", () => {
        if (map.current && map.current.getZoom() > 14) map.current.setZoom(14);
      });
    }
    // selectedId is handled in effect 3 (no need to redraw everything on selection)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, facilities, origin, lang]);

  // 3. Highlight the selected facility and open its info window.
  useEffect(() => {
    const gm = window.google?.maps;
    if (state !== "ready" || !gm || !map.current) return;
    facilities.forEach((f, i) => {
      const m = markers.current.get(f.id);
      if (!m) return;
      const selected = f.id === selectedId;
      if (advanced.current) {
        m.content = pinElement(i + 1, selected);
        m.zIndex = selected ? 10 : 1;
      } else {
        m.setIcon({ path: gm.SymbolPath.CIRCLE, scale: selected ? 15 : 12, fillColor: selected ? BLUE_DARK : BLUE, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 });
        m.setZIndex(selected ? 10 : 1);
      }
    });
    const f = facilities.find((x) => x.id === selectedId);
    const m = f && markers.current.get(f.id);
    if (!f || !m) {
      info.current?.close();
      return;
    }
    const name = f.name[lang] || f.name.en;
    const dist = f.distanceKm != null ? ` · ${t("care.km", { km: f.distanceKm < 10 ? f.distanceKm.toFixed(1) : Math.round(f.distanceKm) })}` : "";
    const content = el("div", { style: { font: "14px Poppins, system-ui, sans-serif", color: "#0f1a3b", maxWidth: "240px", lineHeight: "1.5" } }, [
      el("p", { text: name, style: { fontWeight: "700", fontSize: "15px", margin: "0 0 2px" } }),
      el("p", { text: `${t(`care.type.${f.type}`)}${dist}`, style: { color: "#5b6785", margin: "0 0 6px" } }),
      el("p", {
        text: f.lastVerifiedOn ? t("care.verifiedOn", { date: f.lastVerifiedOn }) : t("care.callFirst"),
        style: { fontWeight: "600", margin: "0 0 6px", color: f.lastVerifiedOn ? GREEN : "#b54708" },
      }),
      el("a", { text: t("care.openMaps"), attrs: { href: mapsUrl(f), target: "_blank", rel: "noopener noreferrer" }, style: { color: BLUE, fontWeight: "600" } }),
    ]);
    if (lang === "km") content.setAttribute("lang", "km");
    info.current.setContent(content);
    info.current.open({ map: map.current, anchor: m });
    map.current.panTo({ lat: f.lat, lng: f.lng });
  }, [state, selectedId, facilities, lang, t]);

  if (state === "failed") return null; // parent shows the fallback map
  return (
    <div className="relative">
      <div ref={box} className="h-72 w-full overflow-hidden rounded-3xl border border-ss-line sm:h-96 lg:h-[32rem]" role="region" aria-label={t("care.mapLabel")} />
      {state === "loading" && <p className="absolute inset-0 grid place-items-center rounded-3xl bg-white text-sm text-ss-muted">{t("care.mapLoading")}</p>}
    </div>
  );
}
