/*
  Anonymous statistics (B11, B12). Sent ONLY when the user ticked the consent box.
  Never sends answers that identify a person: only age band, sex, optional province,
  result category, BP-unknown flag and tobacco yes/no, plus simple event counts.
  The server endpoint (api/stats.js) needs a database before it stores anything; until then
  it answers 501 and nothing is kept. Failures are silent and never block the user.
*/
import { getSessionId, getSettings } from "./storage.js";

const ENDPOINT = "/api/stats";

function send(payload) {
  if (!getSettings().statsConsent) return;
  try {
    const body = JSON.stringify({ ...payload, session: getSessionId(), at: new Date().toISOString().slice(0, 10) });
    if (navigator.sendBeacon) navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
    else fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    /* never block the user */
  }
}

export function trackScreening({ ageBand, sex, category, bpUnknown, tobacco }) {
  send({ type: "screening", ageBand, sex: sex || null, category, bpUnknown: !!bpUnknown, tobacco: !!tobacco });
}

export function trackEvent(type) {
  if (type === "emergency_tap" || type === "facility_search") send({ type });
}
