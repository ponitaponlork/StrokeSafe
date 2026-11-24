import { ABOUT } from '../content/about.js';
import './About.css';

const UI = {
  en: { back: 'Back', open: 'opens in a new tab' },
  km: { back: 'ត្រឡប់ក្រោយ', open: 'បើកក្នុងផ្ទាំងថ្មី' },
};

export default function About({ lang = 'km', onBack }) {
  const L = lang === 'en' ? 'en' : 'km';
  const t = UI[L];

  return (
    <main className="about" lang={L}>
      <header className="about-head">
        {onBack && <button className="about-back" onClick={onBack}>{t.back}</button>}
        <h1>{ABOUT.title[L]}</h1>
      </header>

      <p className="about-intro">{ABOUT.intro[L]}</p>

      {ABOUT.sections.map((s) => (
        <section key={s.id} className="about-card">
          <h2>{s.heading[L]}</h2>
          <ul>
            {s.items.map((it, i) => <li key={i}>{it[L]}</li>)}
          </ul>
        </section>
      ))}

      <section className="about-card">
        <h2>{ABOUT.sourcesHeading[L]}</h2>
        <p className="about-note">{ABOUT.sourcesNote[L]}</p>
        <ol className="about-sources">
          {ABOUT.sources.map((s, i) => (
            <li key={i}>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`${s.title} (${t.open})`}>
                  {s.title}
                </a>
              ) : (
                <span>{s.title}</span>
              )}
              <div className="about-use">{s.use[L]}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-card">
        <h2>{ABOUT.teamHeading[L]}</h2>
        <ul className="about-team">
          {ABOUT.team.map((m, i) => (
            <li key={i}>
              <strong>{m.name}</strong>
              <span>{m.role[L]}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="about-foot">{ABOUT.footer[L]}</p>
    </main>
  );
}