import type {
  BusinessCatalog,
  BusinessSectorOption,
  EmployeeRole,
} from '../types/api';

export const EMPLOYEE_ROLES: EmployeeRole[] = [
  'labourer',
  'clerk',
  'specialist',
  'manager',
  'executive',
];

/** Mirrors BE `SECTOR_CATALOG` / `ENTITY_TYPE_CATALOG` so selects are never empty. */
export const FALLBACK_BUSINESS_CATALOG: BusinessCatalog = {
  sectors: [
    { value: 'retail', label: 'Retail', group: 'Trade & services' },
    { value: 'wholesale', label: 'Wholesale', group: 'Trade & services' },
    { value: 'food_beverage', label: 'Food & beverage', group: 'Trade & services' },
    { value: 'hospitality', label: 'Hospitality / hotels', group: 'Trade & services' },
    { value: 'personal_services', label: 'Personal services', group: 'Trade & services' },
    { value: 'manufacturing', label: 'Manufacturing', group: 'Industry' },
    { value: 'construction', label: 'Construction', group: 'Industry' },
    { value: 'mining', label: 'Mining', group: 'Industry' },
    { value: 'agriculture', label: 'Agriculture / agribusiness', group: 'Industry' },
    { value: 'energy', label: 'Energy / utilities (private)', group: 'Industry' },
    { value: 'trucking', label: 'Trucking / haulage', group: 'Transport & logistics' },
    { value: 'shipping', label: 'Shipping / freight', group: 'Transport & logistics' },
    { value: 'warehousing', label: 'Warehousing', group: 'Transport & logistics' },
    { value: 'tech', label: 'Tech / software', group: 'Knowledge' },
    { value: 'media', label: 'Media / publishing', group: 'Knowledge' },
    { value: 'private_education', label: 'Education (private)', group: 'Knowledge' },
    { value: 'private_healthcare', label: 'Healthcare (private clinic)', group: 'Knowledge' },
    { value: 'legal', label: 'Legal practice', group: 'Professional' },
    { value: 'accounting', label: 'Accounting / finance services', group: 'Professional' },
    { value: 'real_estate', label: 'Real estate / property', group: 'Professional' },
    { value: 'private_security', label: 'Private security', group: 'Security' },
    { value: 'insurance', label: 'Insurance', group: 'Professional' },
    { value: 'telecom', label: 'Telecom / ISP', group: 'Knowledge' },
    { value: 'other', label: 'General / other', group: 'Other' },
  ],
  entity_types: [
    {
      value: 'sole_trader',
      label: 'Sole trader',
      registration_fee: 100,
      blurb: 'You alone - cheapest registration.',
    },
    {
      value: 'partnership',
      label: 'Partnership',
      registration_fee: 150,
      blurb: 'Shared ownership; standard fee.',
    },
    {
      value: 'limited_company',
      label: 'Limited company',
      registration_fee: 250,
      blurb: 'Separate legal entity; best for later IPO.',
    },
  ],
  registration_hours: 12,
  min_starting_capital: 0,
  max_starting_capital: 50000,
};

export function groupSectors(sectors: BusinessSectorOption[]) {
  const groups: { group: string; items: BusinessSectorOption[] }[] = [];
  for (const s of sectors) {
    const last = groups[groups.length - 1];
    if (last && last.group === s.group) last.items.push(s);
    else groups.push({ group: s.group, items: [s] });
  }
  return groups;
}

export function sectorLabel(sector: string) {
  return sector.replaceAll('_', ' ');
}
