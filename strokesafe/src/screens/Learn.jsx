import { useState } from 'react';
import { LEARN } from '../content/learn.js';
import './Learn.css';

const UI = {
  en: {
    heading: 'Learn',
    tabs: { fast: 'Stroke signs', bp: 'Blood pressure', salt: 'Salt' },
    share: 'Share FAST card with family',
    copied: 'Copied. Paste it into a message.',
    back: 'Back',
    shareText:
      'Stroke signs, FAST: F = Face drooping. A = Arm or leg weakness. S = Speech trouble. T = Time to call an ambulance now. Do not give food, drink or medicine. Go to the nearest hospital.',
  },
  km: {
    heading: 'រៀនសូត្រ',
    tabs: { fast: 'សញ្ញាដាច់សរសៃឈាមខួរក្បាល', bp: 'សម្ពាធឈាម', salt: 'អំបិល' },
    share: 'ចែករំលែកកាត FAST ជាមួយគ្រួសារ',
    copied: 'បានចម្លង។ សូមបិទភ្ជាប់ក្នុងសារ។',
    back: 'ត្រឡប់ក្រោយ',
    shareText:
      'សញ្ញា FAST៖ F = មុខធ្លាក់ម្ខាង។ A = ដៃ ឬជើងខ្សោយ។ S = និយាយមិនច្បាស់។ T = ដល់ពេលហៅរថយន្តសង្គ្រោះភ្លាមៗ។ កុំឱ្យបាយ ទឹក ឬថ្នាំ។ សូមទៅមន្ទីរពេទ្យជិតបំផុត។',
  },
};

// Simple, high-contrast icons. Decorative: the text next to them carries the meaning.
const ICONS = {
  F: (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="24" cy="26" r="2.5" fill="currentColor" />
      <circle cx="40" cy="28" r="2.5" fill="currentColor" />
      <path d="M22 44 Q32 40 44 48" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  A: (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M32 18 V40 M32 40 L22 58 M32 40 L42 58" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 24 L12 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 24 L46 38" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 7" />
    </svg>
  ),
  S: (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M8 12 H56 V40 H28 L16 52 V40 H8 Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <path d="M16 26 Q22 18 28 26 T40 26 T50 26" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  ),
  T: (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="34" r="22" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M32 34 V20 M32 34 L42 40" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M26 8 H38" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
};

export default function Learn({ lang = 'km', onBack }) {
  const L = lang === 'en' ? 'en' : 'km';
  const t = UI[L];
  const [tab, setTab] = useState('fast');
  const [msg, setMsg] = useState('');

  async function shareFast() {
    const text = t.shareText;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'StrokeSafe FAST', text, url: window.location.origin });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${window.location.origin}`);
      setMsg(t.copied);
      setTimeout(() => setMsg(''), 4000);
    } catch {
      // user cancelled the share sheet, or clipboard blocked: do nothing
    }
  }

  return (
    <main className="learn" lang={L}>
      <header className="learn-head">
        {onBack && (
          <button className="learn-back" onClick={onBack}>
            {t.back}
          </button>
        )}
        <h1>{t.heading}</h1>
      </header>

      <div className="learn-tabs" role="tablist">
        {Object.keys(t.tabs).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            className={tab === k ? 'tab on' : 'tab'}
            onClick={() => setTab(k)}
          >
            {t.tabs[k]}
          </button>
        ))}
      </div>

      {tab === 'fast' && (
        <section role="tabpanel">
          <h2>{LEARN.fast.title[L]}</h2>
          <ul className="fast-list">
            {LEARN.fast.items.map((it) => (
              <li key={it.letter} className={it.letter === 'T' ? 'fast-item urgent' : 'fast-item'}>
                <div className="fast-icon">{ICONS[it.letter]}</div>
                <div className="fast-letter">{it.letter}</div>
                <div className="fast-text">{it[L]}</div>
              </li>
            ))}
          </ul>
          <button className="share" onClick={shareFast}>
            {t.share}
          </button>
          {msg && <p className="note" role="status">{msg}</p>}
        </section>
      )}

      {tab === 'bp' && (
        <section role="tabpanel">
          <h2>{LEARN.bp.title[L]}</h2>
          <ol className="steps">
            {LEARN.bp.steps.map((s, i) => (
              <li key={i}>{s[L]}</li>
            ))}
          </ol>
        </section>
      )}

      {tab === 'salt' && (
        <section role="tabpanel">
          <h2>{LEARN.salt.title[L]}</h2>
          <p className="card">{LEARN.salt.note[L]}</p>
          <p className="card">{LEARN.salt.limit[L]}</p>
          <p className="card good">{LEARN.salt.swap[L]}</p>
        </section>
      )}
    </main>
  );
}