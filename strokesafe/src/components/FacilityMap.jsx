/*
  Interactive map (Leaflet + OpenStreetMap tiles). Loaded only when needed.
  If Leaflet or the tiles fail (offline, slow network), the parent still shows the list.
*/
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";

export default function FacilityMap({ facilities, origin, selectedId, onSelect }) {
  const { t, lang } = useLanguage();
  const el = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const LRef = useRef(null);
  const [state, setState] = useState(navigator.onLine === false ? "offline" : "loading");

  useEffect(() => {
    if (state === "offline") return;
    let cancelled = false;
    Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")])
      .then(([mod]) => {
        if (cancelled || !el.current) return;
        const L = mod.default ?? mod;
        LRef.current = L;
        const map = L.map(el.current, { zoomControl: true, attributionControl: true }).setView([12.5, 104.9], 7);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);
        mapRef.current = map;
        layerRef.current = L.layerGroup().addTo(map);
        setState("ready");
      })
      .catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (state !== "ready" || !L || !map) return;
    layerRef.current.clearLayers();
    const points = [];
    facilities.forEach((f, i) => {
      const selected = f.id === selectedId;
      const marker = L.circleMarker([f.lat, f.lng], {
        radius: selected ? 12 : 9,
        color: "#ffffff",
        weight: 2,
        fillColor: selected ? "#2449d6" : "#2f64f0",
        fillOpacity: 1,
      }).bindTooltip(`${i + 1}. ${f.name[lang] || f.name.en}`);
      marker.on("click", () => onSelect?.(f.id));
      marker.addTo(layerRef.current);
      points.push([f.lat, f.lng]);
    });
    if (origin) {
      L.circleMarker([origin.lat, origin.lng], { radius: 8, color: "#ffffff", weight: 3, fillColor: "#12805c", fillOpacity: 1 })
        .bindTooltip(t("care.you"))
        .addTo(layerRef.current);
      points.push([origin.lat, origin.lng]);
    }
    if (points.length) map.fitBounds(points, { padding: [30, 30], maxZoom: 14 });
  }, [state, facilities, origin, selectedId, lang, onSelect, t]);

  if (state === "offline" || state === "failed") {
    return (
      <div className="grid h-48 place-items-center rounded-3xl border border-dashed border-ss-line bg-white p-4 text-center text-sm text-ss-muted">
        {t("care.mapFailed")}
      </div>
    );
  }
  return (
    <div className="relative">
      <div ref={el} className="h-72 w-full overflow-hidden rounded-3xl border border-ss-line sm:h-96 lg:h-[32rem]" role="region" aria-label={t("care.mapLabel")} />
      {state === "loading" && <p className="absolute inset-0 grid place-items-center text-sm text-ss-muted">{t("care.mapLoading")}</p>}
    </div>
  );
}
