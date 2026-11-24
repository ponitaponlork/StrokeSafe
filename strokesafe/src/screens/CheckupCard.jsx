import { useEffect, useState } from 'react';
import { toNumber, bmi } from '../logic/risk.mjs';
import './CheckupCard.css';

const W = 1080;
const H = 1760;
const PAD = 56;
const FONT = '"Noto Sans Khmer", "Khmer OS", "Leelawadee UI", system-ui, sans-serif';

const LEVELS = {
  LOWER: { km: 'ទាប', en: 'Lower risk', bg: '#1b7f3b', fg: '#ffffff' },
  MODERATE: { km: 'មធ្យម', en: 'Moderate risk', bg: '#f2b705', fg: '#111111' },
  HIGHER: { km: 'ខ្ពស់', en: 'Higher risk', bg: '#b00020', fg: '#ffffff' },
};

const ASK = [
  { km: 'សូមវាស់សម្ពាធឈាមរបស់ខ្ញុំ', en: 'Check my blood pressure' },
  { km: 'សូមពិនិត្យជាតិស្ករ និងកូឡេស្តេរ៉ុលក្នុងឈាម', en: 'Check my blood sugar and cholesterol' },
  { km: 'តើខ្ញុំត្រូវការថ្នាំទេ?', en: 'Do I need medicine?' },
  { km: 'សូមជួយខ្ញុំឈប់ជក់ថ្នាំ', en: 'Help me stop tobacco' },
];

const UI = {
  km: { title: 'កាតត្រួតពិនិត្យ', nameLabel: 'ឈ្មោះ (ជាជម្រើស)', save: 'រក្សាទុករូបភាព', share: 'ចែករំលែក', back: 'ត្រឡប់ក្រោយ', hint: 'ចុចរូបភាពឱ្យយូរ ដើម្បីរក្សាទុក (iPhone)' },
  en: { title: 'Check-up card', nameLabel: 'Name (optional)', save: 'Save image', share: 'Share', back: 'Back', hint: 'On iPhone, press and hold the image to save' },
};

const YES = { km: 'បាទ/ចាស', en: 'Yes' };
const NO = { km: 'ទេ', en: 'No' };
const UNKNOWN = { km: 'មិនដឹង', en: 'Unknown' };

function ageBand(age) {
  const n = toNumber(age);
  if (n === null) return '';
  const bands = [[18, 29], [30, 39], [40, 49], [50, 59], [60, 69]];
  const b = bands.find(([lo, hi]) => n >= lo && n <= hi);
  return b ? `${b[0]}-${b[1]}` : '70+';
}

function localDate() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function buildRows(a, forRelative, name) {
  const same = (v) => ({ km: v, en: v });
  const rows = [];

  rows.push({ label: { km: 'កាលបរិច្ឆេទ', en: 'Date' }, value: same(localDate()) });
  rows.push({
    label: { km: 'សម្រាប់', en: 'For' },
    value: forRelative ? { km: 'ឪពុកម្តាយ ឬសាច់ញាតិ', en: 'A parent or relative' } : { km: 'ខ្លួនខ្ញុំ', en: 'Myself' },
  });
  if (name) rows.push({ label: { km: 'ឈ្មោះ', en: 'Name' }, value: same(name) });
  rows.push({ label: { km: 'ក្រុមអាយុ', en: 'Age group' }, value: same(ageBand(a.age)) });

  const sexMap = { male: { km: 'ប្រុស', en: 'Male' }, female: { km: 'ស្រី', en: 'Female' } };
  rows.push({ label: { km: 'ភេទ', en: 'Sex' }, value: sexMap[a.sex] || UNKNOWN });

  // Blood pressure: same rule as risk.mjs (older than 12 months counts as unknown)
  const top = toNumber(a.bp_top);
  const bottom = toNumber(a.bp_bottom);
  const months = toNumber(a.bp_months_ago);
  let bpValue = UNKNOWN;
  if (top !== null && bottom !== null && !(months !== null && months > 12)) {
    const nums = `${top}/${bottom} mmHg`;
    if (months === null) bpValue = same(nums);
    else if (months < 1) bpValue = { km: `${nums} · ខែនេះ`, en: `${nums} · this month` };
    else bpValue = { km: `${nums} · ${Math.round(months)} ខែមុន`, en: `${nums} · ${Math.round(months)} months ago` };
  }
  rows.push({ label: { km: 'សម្ពាធឈាម', en: 'Blood pressure' }, value: bpValue });

  rows.push({
    label: { km: 'ថ្នាំសម្ពាធឈាម ឬគ្រូពេទ្យប្រាប់ថាខ្ពស់', en: 'BP medicine, or told it is high' },
    value: a.bp_meds_or_told_high === true ? YES : a.bp_meds_or_told_high === false ? NO : UNKNOWN,
  });

  const diab = {
    yes: YES, no: NO,
    never_tested: { km: 'មិនធ្លាប់ពិនិត្យ', en: 'Never tested' },
    not_sure: { km: 'មិនប្រាកដ', en: 'Not sure' },
  };
  rows.push({ label: { km: 'ទឹកនោមផ្អែម', en: 'Diabetes' }, value: diab[a.diabetes] || UNKNOWN });

  const tob = {
    daily: { km: 'ជក់រាល់ថ្ងៃ', en: 'Smokes every day' },
    sometimes: { km: 'ជក់ម្តងម្កាល', en: 'Smokes sometimes' },
    chew: { km: 'ទំពារថ្នាំជក់', en: 'Chews tobacco' },
    used_to: { km: 'ធ្លាប់ជក់ (ឈប់ហើយ)', en: 'Used to (stopped)' },
    never: { km: 'មិនធ្លាប់', en: 'Never' },
  };
  rows.push({ label: { km: 'ថ្នាំជក់', en: 'Tobacco' }, value: tob[a.tobacco] || UNKNOWN });

  const b = bmi(a.height_cm, a.weight_kg);
  rows.push({ label: { km: 'សន្ទស្សន៍ម៉ាសរាងកាយ (BMI)', en: 'BMI' }, value: b === null ? UNKNOWN : same(b.toFixed(1)) });

  return rows;
}

// Split text into lines that fit maxW. Khmer has no spaces, so long words break by character cluster.
function wrap(ctx, text, maxW) {
  const graphemes = (s) =>
    typeof Intl !== 'undefined' && Intl.Segmenter
      ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)].map((x) => x.segment)
      : Array.from(s);
  const out = [];
  let cur = '';
  for (const word of text.split(' ')) {
    const trial = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(trial).width <= maxW) { cur = trial; continue; }
    if (cur) { out.push(cur); cur = ''; }
    if (ctx.measureText(word).width <= maxW) { cur = word; continue; }
    for (const g of graphemes(word)) {
      if (ctx.measureText(cur + g).width > maxW && cur) { out.push(cur); cur = g; } else cur += g;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function drawCard(canvas, { rows, level, flags }) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, W, 150);
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 54px ${FONT}`;
  ctx.fillText('StrokeSafe', PAD, 70);
  ctx.font = `400 30px ${FONT}`;
  ctx.fillText('កាតត្រួតពិនិត្យ  ·  Check-up card', PAD, 118);

  // Result level
  const L = LEVELS[level];
  ctx.fillStyle = L.bg;
  ctx.fillRect(0, 150, W, 230);
  ctx.fillStyle = L.fg;
  ctx.font = `700 56px ${FONT}`;
  ctx.fillText(`កម្រិតហានិភ័យ៖ ${L.km}`, PAD, 235);
  ctx.font = `600 42px ${FONT}`;
  ctx.fillText(L.en, PAD, 290);
  ctx.font = `600 30px ${FONT}`;
  if (flags.includes('SEE_TODAY')) ctx.fillText('សូមទៅពិនិត្យថ្ងៃនេះ · Please get checked today', PAD, 346);
  else if (flags.includes('PRIOR_STROKE')) ctx.fillText("សូមធ្វើតាមផែនការគ្រូពេទ្យ · Please follow your doctor's plan", PAD, 346);

  // Rows
  let y = 400;
  const ROW = 86;
  const colX = 470;
  rows.forEach((r) => {
    ctx.fillStyle = '#111111';
    ctx.font = `400 27px ${FONT}`;
    ctx.fillText(r.label.km, PAD, y + 34, colX - PAD - 16);
    ctx.fillStyle = '#555555';
    ctx.font = `400 22px ${FONT}`;
    ctx.fillText(r.label.en, PAD, y + 66, colX - PAD - 16);

    ctx.fillStyle = '#111111';
    ctx.font = `700 29px ${FONT}`;
    const maxV = W - PAD - colX;
    if (r.value.km === r.value.en) {
      ctx.fillText(r.value.km, colX, y + 50, maxV);
    } else {
      ctx.fillText(r.value.km, colX, y + 34, maxV);
      ctx.fillStyle = '#555555';
      ctx.font = `400 23px ${FONT}`;
      ctx.fillText(r.value.en, colX, y + 66, maxV);
    }
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD, y + ROW);
    ctx.lineTo(W - PAD, y + ROW);
    ctx.stroke();
    y += ROW;
  });

  // Ask your health worker
  y += 24;
  ctx.fillStyle = '#111111';
  ctx.font = `700 32px ${FONT}`;
  ctx.fillText('សូមសួរបុគ្គលិកសុខាភិបាល៖  Ask your health worker:', PAD, y + 30, W - 2 * PAD);
  y += 56;
  ASK.forEach((item, i) => {
    ctx.fillStyle = '#111111';
    ctx.font = `600 28px ${FONT}`;
    const kmLines = wrap(ctx, `${i + 1}. ${item.km}`, W - 2 * PAD);
    kmLines.forEach((ln) => { ctx.fillText(ln, PAD, y + 28); y += 36; });
    ctx.fillStyle = '#555555';
    ctx.font = `400 23px ${FONT}`;
    ctx.fillText(item.en, PAD + 34, y + 20, W - 2 * PAD - 34);
    y += 40;
  });

  // Footer
  ctx.fillStyle = '#f1f1f1';
  ctx.fillRect(0, H - 130, W, 130);
  ctx.fillStyle = '#111111';
  ctx.font = `700 28px ${FONT}`;
  ctx.fillText('ចម្លើយផ្ទាល់ខ្លួន មិនមែនជាការធ្វើរោគវិនិច្ឆ័យទេ', PAD, H - 78, W - 2 * PAD);
  ctx.font = `400 25px ${FONT}`;
  ctx.fillText('Self-reported, not a diagnosis. Not medical advice.', PAD, H - 40, W - 2 * PAD);
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export default function CheckupCard({ answers = {}, result, lang = 'km', forRelative = false, onBack }) {
  const L = lang === 'en' ? 'en' : 'km';
  const t = UI[L];
  const [name, setName] = useState('');
  const [src, setSrc] = useState('');
  const [msg, setMsg] = useState('');

  const showable = result && LEVELS[result.level];

  useEffect(() => {
    if (!showable) return;
    let alive = true;
    (async () => {
      try {
        // Wait for the Khmer font, or the canvas draws with a fallback font
        await Promise.all([
          document.fonts.load('700 32px "Noto Sans Khmer"'),
          document.fonts.load('400 24px "Noto Sans Khmer"'),
        ]);
        await document.fonts.ready;
      } catch {
        // font API unavailable: draw anyway
      }
      if (!alive) return;
      const canvas = document.createElement('canvas');
      drawCard(canvas, {
        rows: buildRows(answers, forRelative, name.trim().slice(0, 40)),
        level: result.level,
        flags: result.flags || [],
      });
      setSrc(canvas.toDataURL('image/png'));
    })();
    return () => { alive = false; };
  }, [answers, result, forRelative, name, showable]);

  if (!showable) return null;

  async function getFile() {
    const blob = await (await fetch(src)).blob();
    return new File([blob], 'strokesafe-checkup.png', { type: 'image/png' });
  }

  async function save() {
    const a = document.createElement('a');
    a.href = src;
    a.download = 'strokesafe-checkup.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function share() {
    try {
      const file = await getFile();
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'StrokeSafe' });
      } else {
        await save();
        setMsg(L === 'km' ? 'បានរក្សាទុករូបភាព' : 'Image saved');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch {
      // user cancelled the share sheet
    }
  }

  return (
    <main className="cc" lang={L}>
      <header className="cc-head">
        {onBack && <button className="cc-btn ghost" onClick={onBack}>{t.back}</button>}
        <h1>{t.title}</h1>
      </header>

      <label className="cc-name">
        <span>{t.nameLabel}</span>
        <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      </label>

      {src ? <img className="cc-img" src={src} alt={t.title} /> : <div className="cc-loading">…</div>}
      <p className="cc-hint">{t.hint}</p>

      <div className="cc-actions">
        <button className="cc-btn" onClick={save} disabled={!src}>{t.save}</button>
        <button className="cc-btn primary" onClick={share} disabled={!src}>{t.share}</button>
      </div>
      {msg && <p role="status" className="cc-hint">{msg}</p>}
    </main>
  );
}