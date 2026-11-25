/*
  Emergency contacts used by the Emergency screen (S9).

  ⚠️ [VERIFY] The README marks Cambodia's national emergency number(s) as NOT YET VERIFIED.
  Do NOT type a number here until the project lead has confirmed it with an official source
  (e.g. Ministry of Health). While `verified` is false, the app shows no call button.
  It tells the user to go to the nearest hospital instead, and never to wait.

  When verified, fill in for example:
    { id: "ambulance", number: "<official number>", verified: true, source: "<where it was confirmed + date>" }
*/
export const EMERGENCY_CONTACTS = [
  {
    id: "ambulance",
    number: null,
    verified: false,
    source: null,
  },
];

/** Returns the first verified contact with a number, or null. */
export function getVerifiedEmergencyContact() {
  return EMERGENCY_CONTACTS.find((c) => c.verified && c.number) ?? null;
}
