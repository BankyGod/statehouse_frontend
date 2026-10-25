import type { ReactNode } from 'react';

export type StateTheme = {
  accent: string;
  label: string;
  scene: ReactNode;
};

function Frame({ children }: { children: ReactNode }) {
  return (
    <svg
      className="state-scene-svg"
      viewBox="0 0 320 240"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const THEMES: Record<string, StateTheme> = {
  'amira-central': {
    accent: '#c9a227',
    label: 'Capital',
    scene: (
      <Frame>
        <defs>
          <linearGradient id="ac-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e3358" />
            <stop offset="100%" stopColor="#0e1624" />
          </linearGradient>
        </defs>
        <rect width="320" height="240" fill="url(#ac-sky)" />
        <rect x="20" y="90" width="50" height="150" fill="#3a4d68" />
        <rect x="80" y="50" width="62" height="190" fill="#4a6284" />
        <rect x="154" y="110" width="46" height="130" fill="#354860" />
        <rect x="210" y="70" width="78" height="170" fill="#4e678a" />
        <rect x="94" y="28" width="34" height="22" fill="#c9a227" opacity="0.9" />
        <circle cx="250" cy="40" r="4" fill="#f0d878" />
        <circle cx="48" cy="70" r="2.5" fill="#9ec5ff" />
        <circle cx="190" cy="55" r="2.5" fill="#9ec5ff" />
        <rect y="220" width="320" height="20" fill="#0a1018" opacity="0.5" />
      </Frame>
    ),
  },
  'port-meridian': {
    accent: '#4aa3e0',
    label: 'Port',
    scene: (
      <Frame>
        <rect width="320" height="130" fill="#16324a" />
        <circle cx="56" cy="40" r="16" fill="#e8c56a" opacity="0.65" />
        <rect y="130" width="320" height="110" fill="#0d3a58" />
        <path d="M0 140 Q40 120 80 140 T160 140 T240 140 T320 140 V240 H0Z" fill="#1a5278" />
        <rect x="24" y="100" width="100" height="40" fill="#2a455c" />
        <rect x="140" y="70" width="14" height="90" fill="#8fa3b8" />
        <path d="M154 72 L230 100 L154 100Z" fill="#cfd8e3" />
        <rect x="230" y="115" width="72" height="28" fill="#34586f" />
        <path d="M0 200 Q80 185 160 200 T320 195" stroke="#4aa3e0" strokeWidth="2" fill="none" opacity="0.35" />
      </Frame>
    ),
  },
  'golden-coast': {
    accent: '#e0a03a',
    label: 'Coast',
    scene: (
      <Frame>
        <rect width="320" height="120" fill="#3d6a8a" />
        <circle cx="260" cy="44" r="26" fill="#f0c56a" />
        <rect y="120" width="320" height="55" fill="#2f7a9a" />
        <rect y="175" width="320" height="65" fill="#d2b48c" />
        <path d="M18 175 Q40 130 58 175" fill="#2d6b4f" />
        <path d="M70 175 Q100 110 130 175" fill="#2d6b4f" />
        <rect x="178" y="145" width="60" height="22" fill="#f5f0e6" opacity="0.85" />
        <path d="M0 175 Q80 165 160 178 T320 170" stroke="#fff" strokeWidth="2" opacity="0.2" fill="none" />
      </Frame>
    ),
  },
  ashfield: {
    accent: '#7aab4a',
    label: 'Farming',
    scene: (
      <Frame>
        <rect width="320" height="100" fill="#6ea0c8" />
        <circle cx="52" cy="42" r="18" fill="#f2d46b" opacity="0.8" />
        <rect y="100" width="320" height="140" fill="#6b9a3e" />
        <path
          d="M0 130 L40 105 L80 135 L120 100 L160 140 L200 95 L240 130 L280 105 L320 128 V240 H0Z"
          fill="#568532"
        />
        <rect x="240" y="80" width="42" height="36" fill="#8b5a2b" />
        <polygon points="236,80 261,52 284,80" fill="#a33" />
        <path d="M20 180 H300" stroke="#4a7a30" strokeWidth="3" opacity="0.4" />
        <path d="M20 200 H300" stroke="#4a7a30" strokeWidth="3" opacity="0.35" />
      </Frame>
    ),
  },
  riverbend: {
    accent: '#4aa3e0',
    label: 'Rivers',
    scene: (
      <Frame>
        <rect width="320" height="90" fill="#4a7a9a" />
        <rect y="90" width="320" height="150" fill="#3f7a48" />
        <path
          d="M0 150 Q40 110 80 155 Q120 190 160 145 Q200 110 240 160 Q280 190 320 140 V240 H0Z"
          fill="#2a6f9a"
        />
        <rect x="42" y="100" width="18" height="28" fill="#8b6914" />
        <rect x="204" y="95" width="24" height="34" fill="#8b6914" />
        <circle cx="48" cy="40" r="10" fill="#f0d878" opacity="0.45" />
      </Frame>
    ),
  },
  ironridge: {
    accent: '#a0a8b0',
    label: 'Steel',
    scene: (
      <Frame>
        <rect width="320" height="240" fill="#2a3038" />
        <polygon points="20,220 80,50 140,220" fill="#4a5058" />
        <polygon points="120,220 190,30 260,220" fill="#555c66" />
        <rect x="50" y="130" width="32" height="110" fill="#6a7078" />
        <rect x="170" y="100" width="40" height="140" fill="#747b84" />
        <rect x="230" y="70" width="16" height="120" fill="#8a9098" />
        <path d="M238 70 L258 30 L250 70" fill="#d45454" opacity="0.75" />
        <rect y="210" width="320" height="30" fill="#1a1e24" />
      </Frame>
    ),
  },
  coppervale: {
    accent: '#cd7f32',
    label: 'Mining',
    scene: (
      <Frame>
        <rect width="320" height="240" fill="#3a2e24" />
        <polygon points="10,230 80,60 150,230" fill="#6b4e36" />
        <polygon points="110,230 190,80 270,230" fill="#7a5a3c" />
        <rect x="250" y="110" width="48" height="120" fill="#8a6238" />
        <circle cx="70" cy="170" r="8" fill="#b87333" />
        <circle cx="160" cy="180" r="7" fill="#cd7f32" />
        <circle cx="210" cy="160" r="5" fill="#b87333" />
        <rect y="215" width="320" height="25" fill="#2a2018" />
      </Frame>
    ),
  },
  greenwood: {
    accent: '#3dba7a',
    label: 'Forestry',
    scene: (
      <Frame>
        <rect width="320" height="240" fill="#1a2e24" />
        <rect y="180" width="320" height="60" fill="#2a4a34" />
        <polygon points="40,190 70,60 100,190" fill="#2d6b4f" />
        <polygon points="95,200 130,40 165,200" fill="#347a58" />
        <polygon points="155,195 190,55 225,195" fill="#2d6b4f" />
        <polygon points="215,200 255,30 295,200" fill="#3a8a60" />
        <rect x="120" y="180" width="12" height="40" fill="#5a3a20" />
        <rect x="247" y="175" width="14" height="45" fill="#5a3a20" />
      </Frame>
    ),
  },
  sunplain: {
    accent: '#e0a03a',
    label: 'Solar',
    scene: (
      <Frame>
        <rect width="320" height="130" fill="#4a7aaa" />
        <circle cx="255" cy="48" r="28" fill="#f2d46b" />
        <rect y="130" width="320" height="110" fill="#c2a458" />
        <rect x="28" y="150" width="58" height="28" fill="#1a3550" stroke="#4aa3e0" strokeWidth="1.5" />
        <rect x="98" y="150" width="58" height="28" fill="#1a3550" stroke="#4aa3e0" strokeWidth="1.5" />
        <rect x="168" y="150" width="58" height="28" fill="#1a3550" stroke="#4aa3e0" strokeWidth="1.5" />
        <rect x="50" y="190" width="58" height="28" fill="#1a3550" stroke="#4aa3e0" strokeWidth="1.5" />
        <rect x="120" y="190" width="58" height="28" fill="#1a3550" stroke="#4aa3e0" strokeWidth="1.5" />
      </Frame>
    ),
  },
  northwatch: {
    accent: '#d45454',
    label: 'Military',
    scene: (
      <Frame>
        <rect width="320" height="240" fill="#1c242c" />
        <rect x="30" y="90" width="90" height="150" fill="#3a4450" />
        <rect x="130" y="60" width="70" height="180" fill="#4a5562" />
        <polygon points="125,60 165,20 205,60" fill="#6a7582" />
        <rect x="215" y="110" width="75" height="130" fill="#3a4450" />
        <rect x="148" y="100" width="30" height="16" fill="#d45454" opacity="0.9" />
        <path d="M0 200 H320" stroke="#2a343e" strokeWidth="12" />
        <path d="M0 215 H320" stroke="#1a2228" strokeWidth="6" />
      </Frame>
    ),
  },
  lakeshire: {
    accent: '#4aa3e0',
    label: 'Lakes',
    scene: (
      <Frame>
        <rect width="320" height="100" fill="#4a7a9a" />
        <circle cx="60" cy="40" r="16" fill="#f0d878" opacity="0.7" />
        <rect y="100" width="320" height="140" fill="#2a6f9a" />
        <path d="M0 100 Q80 130 160 100 Q240 70 320 110" fill="#3f8a58" />
        <ellipse cx="180" cy="170" rx="90" ry="28" fill="#1a5a80" opacity="0.55" />
        <rect x="230" y="90" width="48" height="24" fill="#e8e0d0" opacity="0.85" />
      </Frame>
    ),
  },
  highlands: {
    accent: '#8fa3b8',
    label: 'Plateau',
    scene: (
      <Frame>
        <rect width="320" height="240" fill="#3a4a5a" />
        <polygon points="0,200 70,70 140,200" fill="#5a6a78" />
        <polygon points="90,200 175,40 260,200" fill="#6a7a88" />
        <polygon points="220,200 285,80 320,200" fill="#5a6a78" />
        <rect y="200" width="320" height="40" fill="#4a7a48" />
        <circle cx="40" cy="50" r="12" fill="#d0d8e0" opacity="0.45" />
      </Frame>
    ),
  },
  'oasis-reach': {
    accent: '#e0a03a',
    label: 'Desert',
    scene: (
      <Frame>
        <rect width="320" height="110" fill="#5a6a80" />
        <circle cx="250" cy="48" r="22" fill="#f0c56a" />
        <rect y="110" width="320" height="130" fill="#c9a66b" />
        <path d="M0 130 Q80 100 160 135 Q240 165 320 120 V240 H0Z" fill="#b8955a" />
        <circle cx="90" cy="150" r="16" fill="#2d6b4f" />
        <rect x="84" y="150" width="12" height="36" fill="#5a3a20" />
        <rect x="175" y="160" width="60" height="20" fill="#4a5562" />
      </Frame>
    ),
  },
  'scholars-haven': {
    accent: '#7aa0d4',
    label: 'Campus',
    scene: (
      <Frame>
        <rect width="320" height="240" fill="#243448" />
        <rect x="40" y="80" width="100" height="160" fill="#4a6284" />
        <polygon points="35,80 90,30 145,80" fill="#6a82a4" />
        <rect x="160" y="100" width="80" height="140" fill="#3a5068" />
        <rect x="250" y="120" width="45" height="120" fill="#4a6284" />
        <rect x="60" y="120" width="18" height="28" fill="#9ec5ff" opacity="0.5" />
        <rect x="95" y="120" width="18" height="28" fill="#9ec5ff" opacity="0.5" />
        <rect x="60" y="165" width="18" height="28" fill="#9ec5ff" opacity="0.4" />
        <circle cx="280" cy="40" r="5" fill="#f0d878" />
      </Frame>
    ),
  },
  silkmarket: {
    accent: '#c9a227',
    label: 'Trade',
    scene: (
      <Frame>
        <rect width="320" height="240" fill="#3a2a28" />
        <rect x="16" y="100" width="58" height="80" fill="#8a3a3a" />
        <rect x="84" y="85" width="62" height="95" fill="#c9a227" opacity="0.75" />
        <rect x="156" y="110" width="56" height="70" fill="#4a6a8a" />
        <rect x="222" y="80" width="70" height="100" fill="#8a5a3a" />
        <path d="M16 100 Q45 65 74 100" fill="#d45454" opacity="0.85" />
        <path d="M84 85 Q115 50 146 85" fill="#e0a03a" opacity="0.9" />
        <path d="M222 80 Q257 45 292 80" fill="#cd7f32" opacity="0.85" />
        <rect y="180" width="320" height="60" fill="#2a2020" />
      </Frame>
    ),
  },
  blackreef: {
    accent: '#6a7a8a',
    label: 'Oil & gas',
    scene: (
      <Frame>
        <rect width="320" height="130" fill="#1a2430" />
        <rect y="130" width="320" height="110" fill="#0d2840" />
        <path d="M0 145 Q60 130 120 150 T240 145 T320 155 V240 H0Z" fill="#123a58" />
        <rect x="70" y="50" width="12" height="110" fill="#8fa3b8" />
        <rect x="52" y="46" width="48" height="12" fill="#6a7582" />
        <rect x="200" y="70" width="12" height="90" fill="#8fa3b8" />
        <circle cx="76" cy="38" r="8" fill="#3dba7a" opacity="0.5" />
        <path d="M206 70 L228 35" stroke="#d45454" strokeWidth="4" opacity="0.6" />
      </Frame>
    ),
  },
  'harmony-bay': {
    accent: '#9b7ec8',
    label: 'Culture',
    scene: (
      <Frame>
        <rect width="320" height="110" fill="#3a4a6a" />
        <rect y="110" width="320" height="130" fill="#2a6f9a" />
        <ellipse cx="160" cy="165" rx="110" ry="32" fill="#1a5a80" opacity="0.45" />
        <rect x="60" y="60" width="58" height="70" fill="#e8e0d0" opacity="0.9" />
        <polygon points="54,60 89,22 124,60" fill="#c9a227" opacity="0.85" />
        <rect x="175" y="75" width="70" height="55" fill="#d8d0c0" opacity="0.85" />
        <circle cx="40" cy="40" r="14" fill="#f0d878" opacity="0.5" />
      </Frame>
    ),
  },
  railford: {
    accent: '#8fa3b8',
    label: 'Rail hub',
    scene: (
      <Frame>
        <rect width="320" height="240" fill="#2a3038" />
        <rect x="30" y="70" width="110" height="80" fill="#4a5562" />
        <rect x="155" y="95" width="90" height="55" fill="#3a4450" />
        <rect x="255" y="55" width="16" height="100" fill="#8fa3b8" />
        <path d="M0 185 H320" stroke="#6a7078" strokeWidth="6" />
        <path d="M0 200 H320" stroke="#6a7078" strokeWidth="6" />
        <rect x="20" y="178" width="22" height="8" fill="#c9a227" />
        <rect x="70" y="178" width="22" height="8" fill="#c9a227" />
        <rect x="120" y="178" width="22" height="8" fill="#c9a227" />
        <rect x="170" y="178" width="22" height="8" fill="#c9a227" />
      </Frame>
    ),
  },
  'crystal-springs': {
    accent: '#7fd0ff',
    label: 'Spa',
    scene: (
      <Frame>
        <rect width="320" height="100" fill="#4a7aaa" />
        <circle cx="250" cy="42" r="20" fill="#f0d878" opacity="0.7" />
        <rect y="100" width="320" height="140" fill="#3d8a7a" />
        <ellipse cx="120" cy="155" rx="70" ry="28" fill="#5ec4d4" opacity="0.7" />
        <rect x="200" y="95" width="65" height="40" fill="#e8e0d0" opacity="0.9" />
        <polygon points="40,140 60,70 80,140" fill="#b8e8f0" opacity="0.55" />
        <polygon points="155,150 172,95 189,150" fill="#b8e8f0" opacity="0.45" />
      </Frame>
    ),
  },
  'new-frontier': {
    accent: '#3dba7a',
    label: 'Frontier',
    scene: (
      <Frame>
        <rect width="320" height="100" fill="#4a6a8a" />
        <circle cx="50" cy="40" r="16" fill="#f2d46b" opacity="0.75" />
        <rect y="100" width="320" height="140" fill="#6b9a3e" />
        <path d="M0 130 L80 110 L160 145 L240 105 L320 130 V240 H0Z" fill="#568532" />
        <rect x="210" y="125" width="42" height="30" fill="#d8d0c0" />
        <polygon points="206,125 231,95 254,125" fill="#8b5a2b" />
        <rect x="70" y="160" width="36" height="12" fill="#4a5562" opacity="0.6" />
      </Frame>
    ),
  },
};

const FALLBACK: StateTheme = {
  accent: '#c9a227',
  label: 'State',
  scene: (
    <Frame>
      <rect width="320" height="240" fill="#1a2533" />
      <circle cx="160" cy="100" r="40" fill="#243142" stroke="#c9a227" strokeWidth="2" />
      <rect y="180" width="320" height="60" fill="#141c27" />
    </Frame>
  ),
};

export function getStateTheme(slug: string): StateTheme {
  return THEMES[slug] ?? FALLBACK;
}
