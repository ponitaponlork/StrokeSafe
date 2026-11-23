// Emergency and medicine rules. Checked in code BEFORE the model is called.
// False alarms are acceptable; misses are not. Khmer terms need native-speaker review.

export const EMERGENCY_RE = new RegExp(
  [
    'weak(ness)?', 'numb', 'droop', 'slurr', 'paraly',
    "can'?t (speak|talk|see|walk|move|feel)",
    'trouble (speaking|talking|seeing|walking|breathing)',
    'vision', 'blurry', 'severe headache', 'worst headache', 'sudden headache',
    'chest pain', "can'?t breathe", 'confus', 'faint', 'unconscious', 'collaps',
    // Khmer
    'ខ្សោយ', 'ស្ពឹក', 'ស្លាប់ដៃ', 'ស្លាប់ជើង', 'មុខជ្រុះ', 'មុខខ្វេ', 'និយាយមិន',
    'មើលមិនឃើញ', 'ងងឹតភ្នែក', 'ឈឺក្បាលខ្លាំង', 'ឈឺទ្រូង', 'ចុកទ្រូង',
    'ពិបាកដកដង្ហើម', 'វិលមុខ', 'សន្លប់', 'ដួល',
  ].join('|'),
  'i'
);

export const MEDICINE_RE = new RegExp(
  [
    'aspirin', 'medicine', 'medication', 'pills?', 'tablets?', 'dose', 'dosage',
    'stop taking', 'paracetamol', 'ibuprofen', 'supplement',
    'ថ្នាំ', 'អាស្ពីរីន',
  ].join('|'),
  'i'
);

// If the model's own answer sounds like dosing advice, replace it.
export const DOSING_OUTPUT_RE = /\b\d+(\.\d+)?\s?(mg|mcg|ml|tablets?|pills?)\b|aspirin|អាស្ពីរីន/i;

export const MSG = {
  en: {
    emergency: 'This may be an emergency. Call an ambulance or go to the nearest hospital now.',
    fallback: "I can't help with that. Please ask a health worker.",
    unavailable: 'The assistant is not available right now. Please see the Learn pages.',
  },
  km: {
    emergency: 'នេះអាចជាភាពអាសន្ន។ សូមហៅរថយន្តសង្គ្រោះ ឬទៅមន្ទីរពេទ្យជិតបំផុតឥឡូវនេះ។',
    fallback: 'ខ្ញុំមិនអាចជួយរឿងនេះបានទេ។ សូមសួរបុគ្គលិកសុខាភិបាល។',
    unavailable: 'ជំនួយការមិនអាចប្រើបានឥឡូវនេះទេ។ សូមមើលទំព័រ «រៀនសូត្រ»។',
  },
};

export const SYSTEM_PROMPT = `You are the StrokeSafe assistant for adults in Cambodia. Answer in the user's language (Khmer or English) in short, simple sentences.
You may explain stroke warning signs (FAST), what the risk result means, how to measure blood pressure, ways to cut salt, stay active, avoid tobacco and heavy alcohol, and how to use the app to find care.
You must never diagnose, interpret someone's symptoms, recommend, change or stop any medicine or dose, or tell someone to wait or treat themselves at home.
If the user describes sudden face drooping, weakness, speech trouble, vision loss, severe headache, confusion or chest pain, reply only: "This may be an emergency. Call an ambulance or go to the nearest hospital now."
If a question is outside your scope, say: "I can't help with that. Please ask a health worker."
Use only the StrokeSafe content provided below. If the answer is not in it, say you can't help with that. Do not ask for names, phone numbers or ID.`;