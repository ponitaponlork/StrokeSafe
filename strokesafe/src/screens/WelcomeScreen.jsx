/*
  Welcome / account screens: /welcome, /login, /signup.
  Three choices: Log in · Sign up · Continue without an account.

  IMPORTANT: there is no authentication backend yet (see src/config/auth.js).
  The forms validate input and then show an honest "accounts are not available yet" message.
  No password is stored or sent, and no fake signed-in state is created.
  Emergency help and the health check never require an account.
*/
import { useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider.jsx";
import { Link, useNavigate } from "../lib/router.jsx";
import { isAuthAvailable, validateLogIn, validateSignUp } from "../config/auth.js";
import Icon from "../components/ui/Icon.jsx";
import Button from "../components/ui/Button.jsx";
import LanguageSwitcher from "../components/ui/LanguageSwitcher.jsx";

export const WELCOME_SEEN_KEY = "strokesafe.welcomeSeen";
export function markWelcomeSeen() {
  try {
    window.localStorage.setItem(WELCOME_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}
export function hasSeenWelcome() {
  try {
    return window.localStorage.getItem(WELCOME_SEEN_KEY) === "1";
  } catch {
    return true; // storage blocked: never trap the user on the welcome screen
  }
}

function Frame({ children }) {
  const { t } = useLanguage();
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-ss-blue-50 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-ss-blue-100" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/70" />
        <img src="/brand/strokesafe-logo.png" alt={t("app.logoAlt")} className="relative h-auto w-48" width="192" />
        <div className="relative max-w-md">
          <h2 className="ss-display text-3xl font-bold leading-snug xl:text-4xl">{t("home.hero.title")}</h2>
          <p className="mt-4 text-lg text-ss-muted">{t("app.tagline")}</p>
          <ul className="mt-8 space-y-3">
            {["auth.point.1", "auth.point.2", "auth.point.3"].map((k) => (
              <li key={k} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ss-blue text-white"><Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} /></span>
                <span className="font-medium">{t(k)}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-ss-muted">{t("common.disclaimer")}</p>
      </section>

      {/* Content */}
      <section className="flex min-h-dvh flex-col px-5 py-5 sm:px-10">
        <div className="flex items-center justify-between gap-3">
          <img src="/brand/strokesafe-logo.png" alt={t("app.logoAlt")} className="h-auto w-32 lg:invisible" width="128" />
          <LanguageSwitcher />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">{children}</div>
        <Link to="/emergency" className="mx-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-ss-red/20 bg-ss-red-50 p-3 text-sm font-semibold text-ss-red-dark hover:bg-ss-red/10">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ss-red text-white"><Icon name="phone" className="h-4 w-4" /></span>
          <span className="flex-1">{t("emergency.banner")}</span>
          <span className="shrink-0">{t("emergency.bannerAction")}</span>
          <Icon name="chevronRight" className="h-4 w-4 shrink-0" />
        </Link>
      </section>
    </div>
  );
}

function Field({ id, label, type = "text", value, onChange, error, autoComplete, icon, hint, inputMode }) {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-semibold">{label}</label>
      <div className={`flex items-center gap-2 rounded-2xl border bg-white px-4 transition-colors focus-within:border-ss-blue focus-within:ring-2 focus-within:ring-ss-blue-100 ${error ? "border-ss-red" : "border-ss-line"}`}>
        <Icon name={icon} className="h-5 w-5 shrink-0 text-ss-muted" />
        <input
          id={id}
          type={isPw && show ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className="min-h-13 w-full min-w-0 bg-transparent py-3 text-base outline-none"
        />
        {isPw && (
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={t(show ? "auth.hidePassword" : "auth.showPassword")} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-ss-muted hover:bg-ss-canvas">
            <Icon name={show ? "eyeOff" : "eye"} className="h-5 w-5" />
          </button>
        )}
      </div>
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-sm text-ss-muted">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-sm font-semibold text-ss-red-dark">{t(error)}</p>}
    </div>
  );
}

/** Shown after a valid form is submitted while no backend exists. Honest, no fake success. */
function NotAvailable({ onContinue }) {
  const { t } = useLanguage();
  return (
    <div role="status" className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
      <p className="flex items-center gap-2 font-bold text-ss-amber"><Icon name="info" className="h-5 w-5" />{t("auth.unavailable.title")}</p>
      <p className="mt-2 text-sm">{t("auth.unavailable.body")}</p>
      <Button className="mt-4" iconRight="arrowRight" onClick={onContinue}>{t("auth.continueGuest")}</Button>
    </div>
  );
}

function ComingSoonNote() {
  const { t } = useLanguage();
  if (isAuthAvailable()) return null;
  return (
    <p className="mb-5 flex items-start gap-2 rounded-2xl bg-ss-blue-50 p-3 text-sm text-ss-ink">
      <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-ss-blue" />
      {t("auth.comingSoon")}
    </p>
  );
}

function BackToWelcome() {
  const { t } = useLanguage();
  return (
    <Link to="/welcome" className="mb-6 inline-flex min-h-10 items-center gap-2 font-semibold text-ss-muted hover:text-ss-ink">
      <Icon name="arrowLeft" className="h-5 w-5" />{t("auth.backToWelcome")}
    </Link>
  );
}

function useGuest() {
  const navigate = useNavigate();
  return () => {
    markWelcomeSeen();
    navigate("/", { replace: true });
  };
}

function WelcomeChoices() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const continueGuest = useGuest();
  return (
    <>
      <p className="text-sm font-semibold uppercase tracking-wide text-ss-blue">{t("auth.eyebrow")}</p>
      <h1 className="mt-1 text-3xl font-bold leading-snug">{t("auth.welcome.title")}</h1>
      <p className="mt-2 text-ss-muted">{t("auth.welcome.body")}</p>

      <div className="mt-8 grid gap-3">
        <button type="button" onClick={continueGuest}
          className="group flex min-h-16 w-full items-center gap-4 rounded-2xl bg-ss-blue px-5 text-left text-white shadow-ss-float transition-colors hover:bg-ss-blue-dark">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15"><Icon name="arrowRight" className="h-5 w-5" /></span>
          <span className="flex-1">
            <span className="block text-lg font-bold">{t("auth.continueGuest")}</span>
            <span className="block text-sm text-white/85">{t("auth.continueGuestHelp")}</span>
          </span>
        </button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" icon="login" onClick={() => navigate("/login")}>{t("auth.login")}</Button>
          <Button variant="soft" icon="userPlus" onClick={() => navigate("/signup")}>{t("auth.signup")}</Button>
        </div>
      </div>
      <p className="mt-5 text-sm text-ss-muted">{t("auth.noAccountNeeded")}</p>
    </>
  );
}

function LogInForm() {
  const { t } = useLanguage();
  const continueGuest = useGuest();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const errs = validateLogIn(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    // No backend: never pretend the login worked. Clear the password from memory.
    setForm((f) => ({ ...f, password: "" }));
    setSubmitted(true);
  };

  return (
    <>
      <BackToWelcome />
      <h1 className="text-3xl font-bold leading-snug">{t("auth.login.title")}</h1>
      <p className="mb-6 mt-2 text-ss-muted">{t("auth.login.body")}</p>
      <ComingSoonNote />
      {submitted ? (
        <NotAvailable onContinue={continueGuest} />
      ) : (
        <form onSubmit={submit} noValidate className="grid gap-4">
          <Field id="login-id" label={t("auth.identifier")} hint={t("auth.identifierHint")} icon="user" value={form.identifier} onChange={set("identifier")} error={errors.identifier} autoComplete="username" />
          <Field id="login-pw" label={t("auth.password")} type="password" icon="lock" value={form.password} onChange={set("password")} error={errors.password} autoComplete="current-password" />
          <Button type="submit" iconRight="arrowRight" className="mt-2">{t("auth.login")}</Button>
        </form>
      )}
      <p className="mt-6 text-sm text-ss-muted">
        {t("auth.noAccountYet")} <Link to="/signup" className="font-semibold text-ss-blue">{t("auth.signup")}</Link>
      </p>
      <button type="button" onClick={continueGuest} className="mt-2 self-start text-sm font-semibold text-ss-blue">{t("auth.continueGuest")}</button>
    </>
  );
}

function SignUpForm() {
  const { t } = useLanguage();
  const continueGuest = useGuest();
  const [form, setForm] = useState({ identifier: "", password: "", confirm: "", agree: false });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const errs = validateSignUp(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setForm((f) => ({ ...f, password: "", confirm: "" }));
    setSubmitted(true);
  };

  return (
    <>
      <BackToWelcome />
      <h1 className="text-3xl font-bold leading-snug">{t("auth.signup.title")}</h1>
      <p className="mb-6 mt-2 text-ss-muted">{t("auth.signup.body")}</p>
      <ComingSoonNote />
      {submitted ? (
        <NotAvailable onContinue={continueGuest} />
      ) : (
        <form onSubmit={submit} noValidate className="grid gap-4">
          <Field id="su-id" label={t("auth.identifier")} hint={t("auth.identifierHint")} icon="user" value={form.identifier} onChange={set("identifier")} error={errors.identifier} autoComplete="username" />
          <Field id="su-pw" label={t("auth.password")} hint={t("auth.passwordHint")} type="password" icon="lock" value={form.password} onChange={set("password")} error={errors.password} autoComplete="new-password" />
          <Field id="su-pw2" label={t("auth.confirmPassword")} type="password" icon="lock" value={form.confirm} onChange={set("confirm")} error={errors.confirm} autoComplete="new-password" />
          <div>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-ss-blue" checked={form.agree} onChange={(e) => set("agree")(e.target.checked)} aria-invalid={!!errors.agree} />
              <span className="text-sm">{t("auth.agree")} <Link to="/profile#privacy" className="font-semibold text-ss-blue">{t("footer.privacy")}</Link></span>
            </label>
            {errors.agree && <p role="alert" className="mt-1 text-sm font-semibold text-ss-red-dark">{t(errors.agree)}</p>}
          </div>
          <Button type="submit" iconRight="arrowRight" className="mt-2">{t("auth.signup")}</Button>
        </form>
      )}
      <p className="mt-6 text-sm text-ss-muted">
        {t("auth.haveAccount")} <Link to="/login" className="font-semibold text-ss-blue">{t("auth.login")}</Link>
      </p>
      <button type="button" onClick={continueGuest} className="mt-2 self-start text-sm font-semibold text-ss-blue">{t("auth.continueGuest")}</button>
    </>
  );
}

export default function WelcomeScreen({ mode = "welcome" }) {
  return (
    <Frame>
      <div key={mode} className="ss-fade-up flex flex-col">
        {mode === "login" ? <LogInForm /> : mode === "signup" ? <SignUpForm /> : <WelcomeChoices />}
      </div>
    </Frame>
  );
}
