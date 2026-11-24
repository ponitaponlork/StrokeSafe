// All wording is a draft. Khmer needs native-speaker review. Safety and data lines need team sign-off.
export const ABOUT = {
  title: { en: 'About StrokeSafe', km: 'អំពី StrokeSafe' },
  intro: {
    en: 'StrokeSafe helps Cambodian adults lower their stroke risk, recognise a stroke fast, and reach the right hospital.',
    km: 'StrokeSafe ជួយមនុស្សពេញវ័យនៅកម្ពុជាកាត់បន្ថយហានិភ័យនៃជំងឺដាច់សរសៃឈាមខួរក្បាល ស្គាល់សញ្ញាឱ្យបានលឿន និងទៅដល់មន្ទីរពេទ្យត្រឹមត្រូវ។',
  },
  sections: [
    {
      id: 'limits',
      heading: { en: 'What this app is not', km: 'កម្មវិធីនេះមិនមែនជា' },
      items: [
        { en: 'This is not a diagnosis.', km: 'នេះមិនមែនជាការធ្វើរោគវិនិច្ឆ័យទេ។' },
        {
          en: 'The risk level comes from simple rules that doctors have not yet validated.',
          km: 'កម្រិតហានិភ័យមកពីច្បាប់សាមញ្ញៗ ដែលគ្រូពេទ្យមិនទាន់បានផ្ទៀងផ្ទាត់នៅឡើយ។',
        },
        { en: 'We do not give advice on medicines or doses.', km: 'យើងមិនផ្តល់ដំបូន្មានអំពីថ្នាំ ឬកម្រិតថ្នាំទេ។' },
        {
          en: 'In an emergency, call an ambulance or go to the nearest hospital now.',
          km: 'ក្នុងគ្រាអាសន្ន សូមហៅរថយន្តសង្គ្រោះ ឬទៅមន្ទីរពេទ្យជិតបំផុតភ្លាមៗ។',
        },
        {
          en: 'Dashboard numbers and some facility details are demo data and may not be verified. Please call a facility first.',
          km: 'តួលេខផ្ទាំងគ្រប់គ្រង និងព័ត៌មានមន្ទីរពេទ្យមួយចំនួនជាទិន្នន័យគំរូ ហើយអាចមិនទាន់បានផ្ទៀងផ្ទាត់ទេ។ សូមទូរស័ព្ទសួរមុនពេលទៅ។',
        },
      ],
    },
    {
      id: 'data',
      heading: { en: 'How your data is used', km: 'របៀបប្រើទិន្នន័យរបស់អ្នក' },
      items: [
        {
          en: 'We do not ask for your name, phone number, ID number or exact birth date.',
          km: 'យើងមិនសុំឈ្មោះ លេខទូរស័ព្ទ លេខអត្តសញ្ញាណប័ណ្ណ ឬថ្ងៃខែឆ្នាំកំណើតពិតប្រាកដទេ។',
        },
        { en: 'Your last result is kept only on your phone.', km: 'លទ្ធផលចុងក្រោយរក្សាទុកតែលើទូរស័ព្ទរបស់អ្នកប៉ុណ្ណោះ។' },
        {
          en: 'We share anonymous statistics only if you tick the consent box.',
          km: 'យើងចែករំលែកស្ថិតិអនាមិក លុះត្រាតែអ្នកធីកយល់ព្រម។',
        },
        { en: 'There are no third-party trackers.', km: 'គ្មានឧបករណ៍តាមដានពីភាគីទីបីទេ។' },
        {
          en: 'The AI assistant: StrokeSafe does not save your messages, but they are sent to an AI service to get an answer. Please do not type your name or phone number.',
          km: 'ជំនួយការ AI៖ StrokeSafe មិនរក្សាទុកសាររបស់អ្នកទេ ប៉ុន្តែសារត្រូវបានផ្ញើទៅសេវា AI ដើម្បីឆ្លើយតប។ សូមកុំសរសេរឈ្មោះ ឬលេខទូរស័ព្ទ។',
        },
      ],
    },
  ],
  sourcesHeading: { en: 'Data sources', km: 'ប្រភពទិន្នន័យ' },
  sourcesNote: {
    en: 'WHO and GBD figures are model estimates and differ by year and method.',
    km: 'តួលេខ WHO និង GBD ជាការប៉ាន់ស្មានតាមគំរូ ហើយខុសគ្នាតាមឆ្នាំ និងវិធីសាស្ត្រ។',
  },
  sources: [
    {
      title: 'Cambodia STEPS Survey 2023 (Ministry of Health with WHO)',
      url: 'https://cdn.who.int/media/docs/default-source/ncds/ncd-surveillance/data-reporting/cambodia/cambodia-2023-steps-report-english-final.pdf',
      use: { en: 'Blood pressure, tobacco, salt and care use', km: 'សម្ពាធឈាម ថ្នាំជក់ អំបិល និងការប្រើសេវា' },
    },
    {
      title: 'WHO Western Pacific, 11 March 2025: 1 in 5 Cambodian adults are at risk of stroke',
      url: 'https://www.who.int/westernpacific/newsroom/feature-stories/item/1-in-5-cambodian-adults-are-at-risk-of-stroke-as-noncommunicable-disease-risks-increase',
      use: { en: 'Health centres with NCD services', km: 'មណ្ឌលសុខភាពដែលមានសេវាជំងឺមិនឆ្លង' },
    },
    {
      title: 'WHO Global Health Estimates 2021',
      url: '',
      use: { en: 'Stroke deaths', km: 'ការស្លាប់ដោយដាច់សរសៃឈាមខួរក្បាល' },
    },
    {
      title: 'Global Burden of Disease 2019, stroke in Asia (Karger review)',
      url: 'https://karger.com/view-large/16232851',
      use: { en: 'Stroke types and rates', km: 'ប្រភេទ និងអត្រាដាច់សរសៃឈាមខួរក្បាល' },
    },
    {
      title: 'WHO World Health Survey Plus, Cambodia 2023',
      url: 'https://apps.who.int/healthinfo/systems/surveydata/index.php/catalog/224/variable/F2/V806?name=q4010',
      use: { en: 'Self-reported stroke', km: 'ការប្រាប់ខ្លួនឯងអំពីជំងឺដាច់សរសៃឈាមខួរក្បាល' },
    },
    {
      title: 'Stroke in Cambodia, International Journal of Stroke, 2012',
      url: 'https://www.pubmed.gov/22973861/',
      use: { en: 'Stroke care capacity (old)', km: 'សមត្ថភាពព្យាបាល (ចាស់)' },
    },
    {
      title: 'ASEAN Stroke Response Insights Report (industry report)',
      url: 'https://www.siemens-healthineers.com/en-ph/asean-stroke-response-insights-report',
      use: { en: 'Regional awareness', km: 'ការយល់ដឹងក្នុងតំបន់' },
    },
  ],
  teamHeading: { en: 'Team', km: 'ក្រុមការងារ' },
  // TODO: replace each name with the real name and year before submission.
  team: [
    { name: '[Name]', role: { en: 'Front-end lead', km: 'ប្រធានផ្នែកមុខ' } },
    { name: '[Name]', role: { en: 'Front-end and UX', km: 'ផ្នែកមុខ និងបទពិសោធន៍អ្នកប្រើ' } },
    { name: '[Name]', role: { en: 'Logic and data', km: 'ឡូជីក និងទិន្នន័យ' } },
    { name: '[Name]', role: { en: 'AI and integration', km: 'AI និងការតភ្ជាប់' } },
    { name: '[Name]', role: { en: 'Business and project lead', km: 'ប្រធានអាជីវកម្ម និងគម្រោង' } },
  ],
  footer: {
    en: 'Hackathon prototype, November 2026. Open Data × AI Venture Hackathon 1.0.',
    km: 'គំរូសាកល្បងសម្រាប់ការប្រកួត ខែវិច្ឆិកា ២០២៦។ Open Data × AI Venture Hackathon 1.0។',
  },
};