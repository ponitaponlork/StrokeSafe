/*
  Account (log in / sign up) configuration.

  StrokeSafe has NO authentication backend yet. The Welcome, Log in and Sign up screens are
  frontend-only: they validate the form and then clearly tell the person that accounts are not
  available yet. Nothing is sent, nothing is stored, and no fake "logged in" state is created.
  Everything in the app works without an account.

  To connect a real service later (for example Supabase Auth, Firebase Auth, Auth0 or your own API):
    1. Set `enabled: true` and implement `signIn` / `signUp` below against that service.
    2. Store only a session token (never the password) and add a sign-out button in Profile.
    3. Decide what an account is for (e.g. syncing screening history across devices) and update the
       privacy text in Profile, because today the app promises "stored only on this device".
  See README → "Accounts" for the full checklist.
*/
export const AUTH_CONFIG = {
  enabled: false,
};

export function isAuthAvailable() {
  return AUTH_CONFIG.enabled === true;
}

/** Placeholder: throws until a real backend is connected. */
export async function signIn() {
  throw new Error("AUTH_NOT_CONFIGURED");
}

/** Placeholder: throws until a real backend is connected. */
export async function signUp() {
  throw new Error("AUTH_NOT_CONFIGURED");
}

/* ---------- Form validation (pure functions, unit-tested) ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Accepts an email address or a Cambodian-style phone number (8–12 digits, optional +855 / spaces). */
export function validateIdentifier(value) {
  const v = String(value ?? "").trim();
  if (!v) return "auth.error.identifierRequired";
  if (v.includes("@")) return EMAIL_RE.test(v) ? null : "auth.error.email";
  const digits = v.replace(/[\s\-()]/g, "").replace(/^\+/, "");
  if (!/^\d+$/.test(digits) || digits.length < 8 || digits.length > 12) return "auth.error.identifier";
  return null;
}

export function validatePassword(value, { forSignUp = false } = {}) {
  const v = String(value ?? "");
  if (!v) return "auth.error.passwordRequired";
  if (forSignUp && v.length < 8) return "auth.error.passwordShort";
  return null;
}

export function validateSignUp({ identifier, password, confirm, agree }) {
  const errors = {};
  const id = validateIdentifier(identifier);
  if (id) errors.identifier = id;
  const pw = validatePassword(password, { forSignUp: true });
  if (pw) errors.password = pw;
  if (!pw && confirm !== password) errors.confirm = "auth.error.passwordMatch";
  if (!agree) errors.agree = "auth.error.agree";
  return errors;
}

export function validateLogIn({ identifier, password }) {
  const errors = {};
  const id = validateIdentifier(identifier);
  if (id) errors.identifier = id;
  const pw = validatePassword(password);
  if (pw) errors.password = pw;
  return errors;
}
