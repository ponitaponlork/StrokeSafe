/*
  Assistant safety checks (B10). Shared by the browser (src/screens/AskScreen.jsx)
  and the server function (api/assistant.js), so the same rules run before any AI call.

  - Emergency words → reply ONLY with the emergency message and show the Emergency button.
  - Medicine / dose questions → fixed fallback ("I can't help with that. Please ask a health worker.").
  These are fixed, non-AI replies. The AI never sees these messages.
*/

const EMERGENCY_PATTERNS = [
  // English
  /\bface\b.*\b(droop|drooping|numb|crooked|uneven)/i,
  /\b(droop|drooping)\b/i,
  /\b(weak|weakness|numb|numbness|paraly[sz]ed?|can'?t move)\b.*\b(arm|leg|hand|side|face)\b/i,
  /\b(arm|leg|hand|side|face)\b.*\b(weak|weakness|numb|numbness|paraly[sz]ed?)\b/i,
  /\b(slurred|slurring|trouble (speaking|talking)|can'?t (speak|talk)|speech (problem|trouble))\b/i,
  /\b(vision loss|lost (my |his |her )?vision|can'?t see|sudden(ly)? blind|blurred vision suddenly)\b/i,
  /\b(severe|worst|very bad|sudden)\b.*\bheadache\b/i,
  /\b(confused|confusion|loss of balance|can'?t walk|fainted|unconscious|collapsed)\b/i,
  /\bchest pain\b|\btrouble breathing\b|\bcan'?t breathe\b|\bshort(ness)? of breath\b/i,
  /\b(having|have|had) a stroke (now|right now)\b|\bstroke right now\b/i,
  // Khmer
  /មុខ.*(វៀច|ស្ពឹក|រៀច)/,
  /(ខ្សោយ|ស្ពឹក|ស្លាប់).*(ដៃ|ជើង)/,
  /(ដៃ|ជើង).*(ខ្សោយ|ស្ពឹក|គ្មានកម្លាំង)/,
  /(និយាយ.*(មិនច្បាស់|មិនបាន|ពិបាក)|រអាក់រអួល)/,
  /(មើល.*មិនឃើញ|ងងឹតភ្នែក|បាត់ការមើលឃើញ)/,
  /(ឈឺក្បាល.*(ខ្លាំង|ពេក|ភ្លាមៗ))/,
  /(វង្វេង|ភាន់ច្រឡំ|បាត់លំនឹង|សន្លប់|ដួល)/,
  /(ឈឺទ្រូង|ពិបាកដកដង្ហើម|ថប់ដង្ហើម)/,
];

const MEDICINE_PATTERNS = [
  /\b(aspirin|pill|pills|tablet|tablets|medicine|medication|medications|drug|drugs|dose|dosage|mg|amlodipine|losartan|metformin|statin|insulin)\b/i,
  /(ថ្នាំ|កម្រិតថ្នាំ|គ្រាប់ថ្នាំ|អាស្ពីរីន)/,
];

export function detectEmergency(text) {
  if (!text) return false;
  return EMERGENCY_PATTERNS.some((re) => re.test(text));
}

export function detectMedicineQuestion(text) {
  if (!text) return false;
  return MEDICINE_PATTERNS.some((re) => re.test(text));
}

/** Returns "emergency" | "medicine" | null. Emergency always wins. */
export function classifyMessage(text) {
  if (detectEmergency(text)) return "emergency";
  if (detectMedicineQuestion(text)) return "medicine";
  return null;
}

export const FIXED_REPLIES = {
  emergency: {
    en: "This may be an emergency. Call an ambulance or go to the nearest hospital now.",
    km: "នេះអាចជាករណីបន្ទាន់។ សូមហៅរថយន្តសង្គ្រោះ ឬទៅមន្ទីរពេទ្យដែលនៅជិតបំផុតឥឡូវនេះ។",
  },
  medicine: {
    en: "I can't help with that. Please ask a health worker.",
    km: "ខ្ញុំមិនអាចជួយរឿងនេះបានទេ។ សូមសួរបុគ្គលិកសុខាភិបាល។",
  },
};

/** B10 system prompt, used only on the server. */
export const SYSTEM_PROMPT = `You are the StrokeSafe assistant for adults in Cambodia. Answer in the user's language (Khmer or English) in short, simple sentences. You may explain stroke warning signs (FAST), what the risk result means, how to measure blood pressure, ways to cut salt, stay active, avoid tobacco and heavy alcohol, and how to use the app to find care. You must never diagnose, interpret someone's symptoms, recommend, change or stop any medicine or dose, or tell someone to wait or treat themselves at home. If the user describes sudden face drooping, weakness, speech trouble, vision loss, severe headache, confusion or chest pain, reply only: 'This may be an emergency. Call an ambulance or go to the nearest hospital now.' and show the Emergency button. If a question is outside your scope, say: 'I can't help with that. Please ask a health worker.' Use only the StrokeSafe content provided. Do not ask for names, phone numbers or ID.`;
