/*
  One consistent icon set (simple line icons, 24×24, drawn with SVG: no icon library needed).
  Usage: <Icon name="phone" className="h-6 w-6" />
  Decorative by default (hidden from screen readers). Pass `label` if the icon carries meaning on its own.
*/
const PATHS = {
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
  clock: (<><circle cx="12" cy="12" r="9.5" /><path d="M12 7v5l3.5 2" /></>),
  alert: (<><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>),
  clipboard: (<><rect x="8" y="2.5" width="8" height="4" rx="1" /><path d="M16 4.5h2a2 2 0 0 1 2 2V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" /></>),
  activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  mapPin: (<><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>),
  book: (<><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" /><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" /></>),
  arrowLeft: <path d="M19 12H5M12 19l-7-7 7-7" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  globe: (<><circle cx="12" cy="12" r="9.5" /><path d="M2.5 12h19M12 2.5c2.5 2.7 3.8 6 3.8 9.5S14.5 18.8 12 21.5C9.5 18.8 8.2 15.5 8.2 12S9.5 5.2 12 2.5z" /></>),
  face: (<><circle cx="12" cy="12" r="9.5" /><path d="M9 9.5h.01M15 9.5h.01" /><path d="M8 15.5c1.4-.9 2.8-1.1 4.5-.6 1.2.4 2.3 1 3.5 2" /></>),
  arm: (<><circle cx="12" cy="4" r="2" /><path d="M12 6.5v7.5M12 14l-3 7M12 14l3 7M12 9 7 12M12 9l4.5-4" /></>),
  speech: (<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h8M8 13h5" /></>),
  hospital: (<><path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M12 9v6M9 12h6" /></>),
  heartPulse: (<><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" /><path d="M3.5 12h4l1.5-3 3 6 1.5-3h3" /></>),
  info: (<><circle cx="12" cy="12" r="9.5" /><path d="M12 16v-4M12 8h.01" /></>),
  // added for the full app
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
  users: (<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a6.5 6.5 0 0 1 3.5 6.5" /></>),
  share: (<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>),
  printer: (<><path d="M6 9V2h12v7" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M6 14h12v8H6z" /></>),
  download: (<><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 21h16" /></>),
  x: <path d="M18 6 6 18M6 6l12 12" />,
  edit: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>),
  chat: <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 20.5l1.5-4.5a8.4 8.4 0 0 1-1-4.5A8.5 8.5 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" />,
  chart: (<><path d="M3 3v18h18" /><path d="M8 17v-5M13 17V8M18 17v-9" /></>),
  shield: (<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>),
  lock: (<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
  navigation: <path d="m3 11 19-9-9 19-2-8z" />,
  refresh: (<><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>),
  external: (<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6M10 14 21 3" /></>),
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  map: (<><path d="m1 6 7-3 8 3 7-3v15l-7 3-8-3-7 3z" /><path d="M8 3v15M16 6v15" /></>),
  home: (<><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></>),
  walk: (<><circle cx="13" cy="4" r="2" /><path d="m9 22 3-8 3 3v5M7 12l2-4 4-1 3 4 3 1" /></>),
  salt: (<><path d="M8 9h8l-1 12H9z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /><path d="M11 5h.01M13 5h.01" /></>),
  leaf: (<><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z" /><path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12" /></>),
  noSmoke: (<><path d="M2 2l20 20" /><path d="M12 12H2v4h14M22 12v4M18 12h-2M18 8c0-2.5-2-2.5-2-5M22 8c0-2.5-2-2.5-2-5" /></>),
  sparkle: <path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z" />,
  calendar: (<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>),
  menu: <path d="M3 12h18M3 6h18M3 18h18" />,
  image: (<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>),
  send: <path d="m22 2-7 20-4-9-9-4z" />,
  gauge: (<><path d="M12 14l4-4" /><path d="M3.3 19a10 10 0 1 1 17.4 0" /></>),
  trash: (<><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></>),
  // added for the sidebar layout and welcome screens
  settings: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>),
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  arrowRight: <path d="M5 12h14M12 5l7 7-7 7" />,
  panel: (<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></>),
  login: (<><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="M10 17l5-5-5-5M15 12H3" /></>),
  mail: (<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>),
  eye: (<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
  eyeOff: (<><path d="M9.9 4.2A9 9 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9 9 0 0 0 5.4-1.6" /><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20" /></>),
  userPlus: (<><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6" /></>),
};

export default function Icon({ name, className = "h-6 w-6", label, strokeWidth = 2 }) {
  const shape = PATHS[name];
  if (!shape) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {shape}
    </svg>
  );
}
