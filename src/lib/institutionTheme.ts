/** Visual identity for education institutions — certificates + picker cards. */

export type InstitutionTheme = {
  slug: string;
  shortName: string;
  mark: string;
  paper: string;
  ink: string;
  muted: string;
  accent: string;
  seal: string;
  border: string;
  heading: string;
  cardFrom: string;
  cardTo: string;
  cardInk: string;
  stripe: string;
};

type ThemeSeed = Omit<InstitutionTheme, 'slug'>;

const KIND_FALLBACK: Record<string, ThemeSeed> = {
  public_university: {
    shortName: 'Public University',
    mark: 'UNI',
    paper: '#f0efe6',
    ink: '#1c2a44',
    muted: '#4a5870',
    accent: '#2f5d9f',
    seal: '#1e3a6e',
    border: '#8a9bb8',
    heading: 'Academic Certificate',
    cardFrom: '#1e2a44',
    cardTo: '#2a3d62',
    cardInk: '#e8eef8',
    stripe: '#6a9ad4',
  },
  private_university: {
    shortName: 'Private College',
    mark: 'PC',
    paper: '#f6f0e4',
    ink: '#2a1e14',
    muted: '#6a5540',
    accent: '#9a7a2a',
    seal: '#6a4a18',
    border: '#c4a86a',
    heading: 'Academic Certificate',
    cardFrom: '#2a2218',
    cardTo: '#3d3424',
    cardInk: '#f5ecd8',
    stripe: '#c4a45a',
  },
  polytechnic: {
    shortName: 'Polytechnic',
    mark: 'POLY',
    paper: '#eceff2',
    ink: '#1a2834',
    muted: '#4a5c6a',
    accent: '#3a7088',
    seal: '#245060',
    border: '#7a96a4',
    heading: 'Academic Certificate',
    cardFrom: '#1a2834',
    cardTo: '#2a4050',
    cardInk: '#e4eef2',
    stripe: '#5a98b0',
  },
  military_academy: {
    shortName: 'Defence Academy',
    mark: 'DEF',
    paper: '#e8eadc',
    ink: '#1e2414',
    muted: '#4a5438',
    accent: '#4a5c28',
    seal: '#2a3818',
    border: '#6a7848',
    heading: 'Academic Certificate',
    cardFrom: '#1a2210',
    cardTo: '#2e3818',
    cardInk: '#e4e8d0',
    stripe: '#7a9440',
  },
  medical_school: {
    shortName: 'Medical School',
    mark: 'MED',
    paper: '#f2f7f6',
    ink: '#143038',
    muted: '#4a6870',
    accent: '#2a8a88',
    seal: '#186060',
    border: '#78b0b0',
    heading: 'Academic Certificate',
    cardFrom: '#143038',
    cardTo: '#1e4850',
    cardInk: '#e4f4f2',
    stripe: '#40b8b0',
  },
};

const BY_SLUG: Record<string, ThemeSeed> = {
  nuua: {
    shortName: 'NUUA',
    mark: 'NUUA',
    paper: '#f2efe0',
    ink: '#1a2e14',
    muted: '#4a6438',
    accent: '#3d6a1c',
    seal: '#2a4a10',
    border: '#8aaa58',
    heading: 'Academic Certificate',
    cardFrom: '#1a3210',
    cardTo: '#2e4a18',
    cardInk: '#e8f0d8',
    stripe: '#85b200',
  },
  'capital-poly': {
    shortName: 'Capital Poly',
    mark: 'CP',
    paper: '#e8eef4',
    ink: '#142434',
    muted: '#4a6078',
    accent: '#286090',
    seal: '#184060',
    border: '#6890b0',
    heading: 'Academic Certificate',
    cardFrom: '#142838',
    cardTo: '#1e3c54',
    cardInk: '#dce8f4',
    stripe: '#4a90c8',
  },
  'college-row': {
    shortName: 'College Row',
    mark: 'CRU',
    paper: '#f6ebe4',
    ink: '#3a1418',
    muted: '#7a4850',
    accent: '#8a2838',
    seal: '#5a1824',
    border: '#c07880',
    heading: 'Academic Certificate',
    cardFrom: '#2a1014',
    cardTo: '#4a1c28',
    cardInk: '#f8e8e8',
    stripe: '#c05060',
  },
  'haven-private': {
    shortName: 'Haven Private',
    mark: 'HPC',
    paper: '#f4eedc',
    ink: '#141c34',
    muted: '#4a5470',
    accent: '#b8942a',
    seal: '#1a2848',
    border: '#c4a858',
    heading: 'Academic Certificate',
    cardFrom: '#101828',
    cardTo: '#1c2848',
    cardInk: '#f0e8d0',
    stripe: '#d4b050',
  },
  'defence-academy': {
    shortName: 'Northwatch Defence',
    mark: 'NDA',
    paper: '#e6e8d8',
    ink: '#1a2010',
    muted: '#4a5430',
    accent: '#3a4820',
    seal: '#101808',
    border: '#5a6840',
    heading: 'Academic Certificate',
    cardFrom: '#121808',
    cardTo: '#243018',
    cardInk: '#e0e4c8',
    stripe: '#6a8440',
  },
  'health-sciences': {
    shortName: 'Health Sciences',
    mark: 'CSHS',
    paper: '#f0f6f4',
    ink: '#103038',
    muted: '#487078',
    accent: '#1a8880',
    seal: '#0e5858',
    border: '#70b8b0',
    heading: 'Academic Certificate',
    cardFrom: '#0e3038',
    cardTo: '#185058',
    cardInk: '#e0f4f2',
    stripe: '#30b8b0',
  },
  'silkmarket-trade': {
    shortName: 'Silkmarket Trade',
    mark: 'STI',
    paper: '#f6ebe0',
    ink: '#3a2010',
    muted: '#7a5840',
    accent: '#b85a28',
    seal: '#8a3818',
    border: '#d09868',
    heading: 'Academic Certificate',
    cardFrom: '#2a1810',
    cardTo: '#4a2c18',
    cardInk: '#f8ece0',
    stripe: '#d07040',
  },
  'meridian-maritime': {
    shortName: 'Meridian Maritime',
    mark: 'MMC',
    paper: '#e6eef4',
    ink: '#0e2438',
    muted: '#406080',
    accent: '#1a6898',
    seal: '#0e4068',
    border: '#5898c0',
    heading: 'Academic Certificate',
    cardFrom: '#0a2034',
    cardTo: '#143c58',
    cardInk: '#dcecf8',
    stripe: '#38a0d0',
  },
  'golden-coast-hospitality': {
    shortName: 'Lagune Hospitality',
    mark: 'LHS',
    paper: '#f8f0e4',
    ink: '#3a2818',
    muted: '#7a6048',
    accent: '#c87840',
    seal: '#a05028',
    border: '#e0a878',
    heading: 'Academic Certificate',
    cardFrom: '#2a2018',
    cardTo: '#4a3424',
    cardInk: '#f8ece0',
    stripe: '#e08850',
  },
  'ironridge-tech': {
    shortName: 'Ironridge Tech',
    mark: 'ITI',
    paper: '#ece8e0',
    ink: '#1c1810',
    muted: '#5a5040',
    accent: '#c06020',
    seal: '#3a3020',
    border: '#8a7860',
    heading: 'Academic Certificate',
    cardFrom: '#181410',
    cardTo: '#2e2820',
    cardInk: '#ece4d8',
    stripe: '#d07030',
  },
};

function markFromName(name: string): string {
  const parts = name
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'UA';
  if (parts.length === 1) return parts[0].slice(0, 4).toUpperCase();
  return parts
    .slice(0, 4)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function institutionTheme(
  slug?: string | null,
  kind?: string | null,
  name?: string | null,
): InstitutionTheme {
  const key = (slug ?? '').toLowerCase();
  const fromSlug = key ? BY_SLUG[key] : undefined;
  const fromKind = kind ? KIND_FALLBACK[kind] : undefined;
  const base = fromSlug ?? fromKind ?? KIND_FALLBACK.public_university;
  const resolvedSlug = key || (kind ?? 'unknown');
  return {
    slug: resolvedSlug,
    ...base,
    shortName: fromSlug?.shortName ?? name ?? base.shortName,
    mark: fromSlug?.mark ?? (name ? markFromName(name) : base.mark),
  };
}

export function certCssVars(theme: InstitutionTheme): Record<string, string> {
  return {
    '--cert-paper': theme.paper,
    '--cert-ink': theme.ink,
    '--cert-muted': theme.muted,
    '--cert-accent': theme.accent,
    '--cert-seal': theme.seal,
    '--cert-border': theme.border,
  };
}

export function eduCardCssVars(theme: InstitutionTheme): Record<string, string> {
  return {
    '--edu-from': theme.cardFrom,
    '--edu-to': theme.cardTo,
    '--edu-ink': theme.cardInk,
    '--edu-stripe': theme.stripe,
  };
}
