export type EducationTrack =
  | 'short_course'
  | 'diploma'
  | 'bachelors'
  | 'law'
  | 'masters'
  | 'medical'
  | 'military_basic';

export type PermitType = 'work' | 'business' | 'travel';

export type CrimeType =
  | 'street_theft'
  | 'pickpocket'
  | 'burglary'
  | 'fencing'
  | 'car_theft'
  | 'fraud'
  | 'smuggling'
  | 'armed_robbery';

export type JobSector =
  | 'government'
  | 'health'
  | 'education'
  | 'farming'
  | 'mining'
  | 'trade'
  | 'logistics'
  | 'hospitality'
  | 'security'
  | 'media'
  | 'energy'
  | 'tech'
  | 'legal'
  | 'military'
  | 'other';

export type TokenResponse = {
  access_token: string;
  token_type?: string;
};

export type UserOut = {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
};

export type RegisterRequest = {
  email: string;
  username: string;
  password: string;
};

export type Character = {
  happiness?: number;
  housing_energy_regen_bonus?: number;
  id: number;
  display_name: string;
  home_state_id: number;
  current_state_id: number;
  home_state_locked: boolean;
  home_state_chosen_at: string;
  age_years: number;
  cash: number;
  bank_balance: number;
  energy: number;
  max_energy: number;
  reputation: number;
  heat: number;
  is_jailed: boolean;
  jail_until: string | null;
  is_traveling: boolean;
  travel_until: string | null;
  travel_destination_id: number | null;
  is_homeless: boolean;
  active_residence_id: number | null;
  health: number;
  max_health: number;
  is_hospitalized: boolean;
  hospital_until: string | null;
  condition: string | null;
  bio: string | null;
  criminal_record_summary: string | null;
  strength: number;
  defense: number;
  speed: number;
  dexterity: number;
  nerve: number;
  max_nerve: number;
  faction_id: number | null;
  /** Automated citizen (same rules as players; not a login account). */
  is_npc?: boolean;
};

export type GymStat = 'strength' | 'defense' | 'speed' | 'dexterity';

export type GymCatalogItem = {
  stat: GymStat;
  energy_cost: number;
  gain_base: number;
  label: string;
};

export type GymTrainResult = {
  stat: GymStat;
  gained: number;
  new_value: number;
  energy: number;
  strength: number;
  defense: number;
  speed: number;
  dexterity: number;
};

export type InventoryItem = {
  id: number;
  item_key: string;
  name: string;
  quantity: number;
  kind: string;
  description: string;
  effect?: string | null;
};

export type ShopItem = {
  item_key: string;
  name: string;
  kind: string;
  shop_price: number;
  description: string;
};

export type MarketListing = {
  id: number;
  seller_id: number;
  item_key: string;
  name: string;
  quantity: number;
  price_each: number;
  note: string | null;
};

export type JailStatus = {
  is_jailed: boolean;
  jail_until: string | null;
  seconds_remaining: number;
  bail_cost: number;
  heat: number;
};

export type NotificationItem = {
  id: number;
  title: string;
  body: string | null;
  category: string | null;
  is_read: boolean;
  character_id: number;
  ref_id: number | null;
  ref_type: string | null;
  created_at: string;
  posted_at: string;
  updated_at?: string;
};

export type ActivityItem = {
  id?: number;
  title?: string;
  body?: string | null;
  category?: string | null;
  created_at?: string;
  posted_at?: string;
  [key: string]: unknown;
};

export type CrimeHistoryItem = {
  id: number;
  crime_type: CrimeType;
  succeeded: boolean;
  caught: boolean;
  payout: number;
  fine_paid: number;
  jail_hours: number;
  notes: string | null;
  created_at: string;
};

export type SocialRelation = {
  id: number;
  status?: string;
  display_name?: string;
  other_name?: string;
  other_character_id?: number;
  character_id?: number;
  created_at?: string;
  [key: string]: unknown;
};

export type SocialRelations = {
  friends: SocialRelation[];
  enemies: SocialRelation[];
  pending: SocialRelation[];
};

export type SocialEvent = {
  id: number;
  title: string;
  summary: string;
  effect_key: string;
  effect_value: number;
  state_id: number | null;
  starts_at: string;
  ends_at: string;
};

export type Faction = {
  id: number;
  name: string;
  tag: string;
  description: string | null;
  leader_id: number;
  treasury: number;
  members: number;
};

export type DmMessage = {
  id: number;
  from_character_id?: number;
  to_character_id?: number;
  from_name?: string;
  to_name?: string;
  body: string;
  posted_at?: string;
  created_at?: string;
  [key: string]: unknown;
};

export type EmployeeRole = 'labourer' | 'clerk' | 'specialist' | 'manager' | 'executive';

export type Employee = {
  id: number;
  business_id: number;
  character_id: number | null;
  display_name: string;
  role: EmployeeRole;
  wage_per_week: number;
  is_npc: boolean;
  is_active: boolean;
  hired_at: string;
};

export type StockSellOrder = {
  order_id: number;
  listing_id: number;
  symbol: string;
  seller_id: number;
  shares_remaining: number;
  price_each: number;
};

export type HealthStatus = {
  health: number;
  max_health: number;
  is_hospitalized: boolean;
  hospital_until: string | null;
  condition: string | null;
  clinic_cost_per_hp: number;
  hospital_base_hours: number;
  seconds_remaining?: number;
};

export type ParliamentSeat = {
  state_id: number;
  state_name: string;
  state_slug: string;
  mp_name: string;
  mp_character_id: number | null;
  is_npc: boolean;
};

export type OfficeHolder = {
  name: string;
  character_id: number | null;
  is_npc: boolean;
};

export type Parliament = {
  seats: ParliamentSeat[];
  majority_needed: number;
  veto_override_needed: number;
  president: OfficeHolder;
  vice_president?: OfficeHolder;
  speaker?: OfficeHolder;
  /** @deprecated prefer speaker.character_id */
  speaker_character_id?: number | null;
};

export type Election = {
  id: number;
  status?: string;
  phase?: string;
  title?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  candidacy_opens_at?: string | null;
  candidacy_closes_at?: string | null;
  voting_opens_at?: string | null;
  voting_closes_at?: string | null;
  [key: string]: unknown;
};

export type Candidacy = {
  id: number;
  election_id: number;
  character_id: number;
  display_name: string;
  race_type: string;
  state_id: number | null;
  slogan: string;
  vote_count: number;
  is_winner: boolean;
};

export type RaceType = 'mp' | 'president';

export type VoteChoice = 'yes' | 'no' | 'abstain';

export type Bill = {
  id: number;
  title: string;
  summary: string;
  sponsor_character_id: number | null;
  sponsor_state_id: number | null;
  status: string;
  yes_votes: number;
  no_votes: number;
  abstain_votes: number;
  npc_yes: number;
  npc_no: number;
  debate_ends_at: string | null;
  vetoed: boolean;
  enacted_at: string | null;
};

export type Budget = {
  id: number;
  title: string;
  summary: string;
  national_tax_rate: number;
  status: string;
  yes_votes: number;
  no_votes: number;
  opens_at: string;
  closes_at: string;
};

export type NewsItem = {
  id: number;
  headline: string;
  body: string;
  category: string;
  state_id: number | null;
  published_at: string;
};

export type CabinetSeat = {
  id: number;
  portfolio: string;
  title: string;
  character_id: number | null;
  username?: string | null;
  name: string;
  is_npc: boolean;
  appointed_at: string | null;
};

export type Cabinet = {
  seats: CabinetSeat[];
};

export type HousingListing = {
  id: number;
  state_id: number;
  title: string;
  kind: string;
  description: string;
  weekly_rent: number;
  buy_price: number | null;
  energy_bonus: number;
  home_state_only: boolean;
  ownership?: 'government' | 'private' | string;
  owner_business_id?: number | null;
  is_available?: boolean;
  property_type_slug?: string | null;
  offer_mode?: 'rent' | 'sale' | 'both' | string;
  acquisition_cost_each?: number;
  units_total?: number | null;
  units_available?: number | null;
  happiness_bonus?: number;
  energy_regen_bonus_minutes?: number;
};

export type PropertyTypeOption = {
  slug: string;
  label: string;
  kind: string;
  blurb: string;
  acquisition_cost: number;
  suggested_weekly_rent: number;
  suggested_buy_price: number;
  energy_bonus: number;
  happiness_bonus: number;
  energy_regen_bonus_minutes: number;
};

export type PropertyCatalog = {
  property_types: PropertyTypeOption[];
  offer_modes: { value: string; label: string }[];
  max_units_per_listing: number;
  note: string;
};

export type RealEstateListingCreate = {
  property_type: string;
  units: number;
  offer_mode: 'rent' | 'sale' | 'both' | string;
  title?: string | null;
  description?: string | null;
  weekly_rent?: number | null;
  buy_price?: number | null;
};

export type RealEstateListingUpdate = {
  weekly_rent?: number | null;
  buy_price?: number | null;
  is_available?: boolean | null;
  offer_mode?: 'rent' | 'sale' | 'both' | string | null;
};

export type HousingAssistResult = {
  assisted: boolean;
  residence_id: number;
  listing_id: number;
  listing_title: string;
  weekly_rent: number;
  loan_id: number | null;
  loan_funded: number;
  message: string;
};

export type Residence = {
  id: number;
  listing_id: number;
  state_id: number;
  tenure: string;
  status: string;
  weekly_rent: number;
  rent_due_at: string | null;
  missed_payments: number;
  started_at: string;
};

export type BankSummary = {
  cash: number;
  bank_balance: number;
  loans: Loan[];
  savings_apr?: number;
  transfer_fee?: number;
};

export type BankMove = {
  cash: number;
  bank_balance: number;
  moved: number;
};

export type BankTx = {
  id: number;
  tx_type: string;
  amount: number;
  balance_after: number;
  counterparty_id: number | null;
  note: string | null;
  posted_at: string;
};

export type StockListing = {
  id: number;
  symbol: string;
  name: string;
  issuer_type: string;
  business_id: number | null;
  description: string;
  share_price: number;
  total_shares: number;
  float_shares: number;
  founder_shares: number;
  ipo_raised: number;
  is_booming: boolean;
  listed_at: string;
};

export type StockMarket = {
  listings: StockListing[];
};

export type StockPriceHistoryPoint = {
  t: number;
  price: number;
  reason?: string;
};

export type StockPriceHistory = {
  listing_id: number;
  points: StockPriceHistoryPoint[];
};

export type BusinessIpoCheck = {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type BusinessPerformanceMetrics = {
  age_days: number;
  cash_balance: number;
  lifetime_revenue: number;
  lifetime_wages: number;
  net_profit: number;
  employee_count: number;
  performance_score: number;
};

export type BusinessPerformanceDashboard = {
  business_id: number;
  name: string;
  sector: string;
  status: string;
  is_public: boolean;
  metrics: BusinessPerformanceMetrics;
  ipo: {
    eligible: boolean;
    checks: BusinessIpoCheck[];
    listing_fee: number;
  };
  performance_history: Array<{
    t: number;
    cash_balance: number;
    lifetime_revenue: number;
    lifetime_wages: number;
    interval_revenue: number;
    interval_wages: number;
    employee_count: number;
    performance_score: number;
  }>;
  stock: {
    listing_id: number;
    symbol: string;
    share_price: number;
    float_shares: number;
    founder_shares: number;
    ipo_raised: number;
    is_booming: boolean;
    listed_at: string;
  } | null;
  price_history: StockPriceHistoryPoint[];
};

export type StockHolding = {
  id?: number;
  listing_id: number;
  symbol: string;
  name?: string;
  shares: number;
  avg_cost?: number;
  share_price?: number;
  market_value?: number;
};

export type StockPortfolio = {
  holdings: StockHolding[];
};

export type Loan = {
  id: number;
  principal: number;
  remaining: number;
  interest_rate: number;
  status: string;
  issued_at: string;
  due_at: string;
  payments_made: number;
};

export type TravelQuote = {
  from_state_id: number;
  to_state_id: number;
  cost: number;
  minutes: number;
  discounted_cost?: number | null;
  carrier_id?: number | null;
  carrier_name?: string | null;
  mode?: string | null;
  permit_applies?: boolean | null;
};

export type TravelOption = {
  carrier_id: number;
  carrier_slug: string;
  carrier_name: string;
  mode: 'air' | 'rail' | 'bus' | string;
  ownership: 'government' | 'private' | string;
  tagline: string;
  comfort: number;
  reliability: number;
  cost: number;
  minutes: number;
  discounted_cost: number | null;
  permit_applies: boolean;
  to_state_id: number;
  to_state_name: string;
  from_state_id: number;
};

export type TravelStartResult = {
  message?: string;
  cost?: number;
  minutes?: number;
  travel_until?: string;
  destination_id?: number;
  carrier_id?: number | null;
  carrier_name?: string | null;
  mode?: string | null;
  [key: string]: unknown;
};

export type CharacterCreate = {
  display_name: string;
  home_state_id: number;
  bio?: string | null;
};

export type StateSummary = {
  id: number;
  slug: string;
  name: string;
  capital: string;
  economic_profile: string;
  /** Players + NPC citizens (list cards). */
  population_count: number;
  population_cap: number;
  /** Automated citizens (do not fill player cap). */
  npc_population_count?: number;
  /** Real player home residents only. */
  player_population?: number;
  is_open: boolean;
  average_income: number;
  starting_bonus: number;
  crime_catch_rate: number;
};

export type StateDetail = {
  id: number;
  slug: string;
  name: string;
  capital: string;
  economic_profile: string;
  /** Player home residents only (detail). */
  population_count: number;
  population_cap: number;
  npc_population_count?: number;
  /** Players + NPCs. */
  population_total?: number;
  is_open: boolean;
  average_income: number;
  starting_bonus: number;
  crime_catch_rate: number;
  base_tax_rate: number;
  permit_fee_multiplier: number;
  npc_mp_name: string | null;
  mp_character_id: number | null;
};

export type JobListing = {
  id: number;
  state_id: number;
  title: string;
  sector: JobSector;
  description: string;
  wage_per_shift: number;
  energy_cost: number;
  shift_minutes: number;
  min_education_level: number;
  requires_clean_record: boolean;
};

export type Job = {
  id: number;
  listing_id: number;
  state_id: number;
  hired_at: string;
  shifts_completed: number;
  is_active: boolean;
};

export type EducationCatalogItem = {
  track: EducationTrack;
  label: string;
  real_days: number;
  age_years: number;
  cost: number;
  level: number;
};

export type EducationInstitution = {
  id: number;
  slug: string;
  name: string;
  kind: string;
  ownership: 'government' | 'private' | string;
  state_id: number;
  state_name: string | null;
  state_slug: string | null;
  enterprise_id: number | null;
  prestige: number;
  description: string | null;
  is_open: boolean;
};

export type EducationProgram = {
  id: number;
  institution_id: number;
  institution_name?: string;
  institution_ownership?: string;
  state_id?: number;
  track: EducationTrack | string;
  title: string;
  real_days: number;
  age_years: number;
  cost: number;
  level: number;
  min_education_level: number;
  capacity?: number | null;
};

export type Enrollment = {
  id: number;
  track: EducationTrack;
  status: string;
  title: string;
  cost_paid: number;
  age_gain_years: number;
  education_level: number;
  institution_id?: number | null;
  program_id?: number | null;
  institution_name?: string | null;
  institution_slug?: string | null;
  institution_kind?: string | null;
  institution_ownership?: string | null;
  started_at: string;
  completes_at: string;
  completed_at: string | null;
};

export type StateEnterprise = {
  id: number;
  slug: string;
  name: string;
  kind: string;
  portfolio: string;
  description: string | null;
  home_state_id: number | null;
  stock_symbol: string | null;
  ownership: string;
  is_active: boolean;
};

export type Permit = {
  id: number;
  state_id: number;
  permit_type: PermitType;
  status: string;
  fee_paid: number;
  issued_at: string | null;
  expires_at: string | null;
};

export type BusinessEntityType = 'sole_trader' | 'partnership' | 'limited_company';

export type BusinessSectorOption = {
  value: string;
  label: string;
  group: string;
};

export type BusinessEntityOption = {
  value: BusinessEntityType | string;
  label: string;
  registration_fee: number;
  blurb: string;
};

export type BusinessCatalog = {
  sectors: BusinessSectorOption[];
  entity_types: BusinessEntityOption[];
  registration_hours: number;
  min_starting_capital: number;
  max_starting_capital: number;
};

export type BusinessPreview = {
  state_id: number;
  state_name: string;
  is_home_state: boolean;
  permit_required: boolean;
  permit_ok: boolean;
  entity_type: string;
  registration_fee: number;
  starting_capital: number;
  total_due: number;
  registration_hours: number;
  cash_on_hand: number;
  can_afford: boolean;
};

export type Business = {
  id: number;
  name: string;
  sector: string;
  entity_type?: string;
  state_id: number;
  status: string;
  cash_balance: number;
  local_address: string;
  is_home_state: boolean;
  registered_at: string | null;
  registration_completes_at: string | null;
  description?: string | null;
  employee_count?: number;
  is_public?: boolean;
  lifetime_revenue?: number;
  lifetime_wages?: number;
};

export type BusinessCreate = {
  name: string;
  sector: string;
  state_id: number;
  local_address: string;
  description?: string | null;
  entity_type?: BusinessEntityType | string;
  starting_capital?: number;
};

export type CrimeCatalogItem = {
  crime_type: CrimeType;
  label: string;
  energy: number;
  min_payout: number;
  max_payout: number;
  heat_gain: number;
  base_catch_rate: number;
  jail_hours: number;
  fine: number;
  nerve?: number;
  tier?: number;
};

export type CrimeResult = {
  succeeded: boolean;
  caught: boolean;
  payout: number;
  heat_applied: number;
  fine_paid: number;
  jail_hours: number;
  catch_chance_used: number;
  message: string;
  character_cash: number;
  character_heat: number;
  is_jailed: boolean;
  health?: number;
  is_hospitalized?: boolean;
  injury?: number;
  nerve?: number;
  loot?: string | null;
};

export type PoliticalParty = {
  id: number;
  name: string;
  short_name: string;
  slogan: string;
  ideology: string;
  description: string;
  color_hex: string;
  leader: string;
  is_npc_led: boolean;
  player_members: number;
  npc_members: number;
  total_members: number;
};

export type PartyMembership = {
  party_id: number;
  party_name: string | null;
  short_name: string | null;
  rank: string;
  joined_at: string;
};

export type GovernmentPost = {
  id: number;
  title: string;
  agency: string;
  portfolio: string | null;
  state_id: number | null;
  tier: string;
  description: string;
  wage_per_week: number;
  min_education_level: number;
  min_reputation: number;
  requires_clean_record: boolean;
  character_id: number | null;
  holder_name: string;
  is_npc: boolean;
  hired_at: string | null;
};

export type ChatMessage = {
  id: number;
  state_id: number;
  character_id: number;
  display_name: string;
  body: string;
  posted_at: string;
};

export type TreasuryTx = {
  id: number;
  tx_type: string;
  amount: number;
  balance_after: number;
  character_id: number | null;
  business_id: number | null;
  note: string | null;
  posted_at: string;
};

export type TreasurySnapshot = {
  account_name: string;
  balance: number;
  national_tax_rate: number;
  corporate_tax_rate: number;
  your_access: {
    can_view: boolean;
    can_spend: boolean;
    roles: string[];
  };
  spend_rules: {
    who: string;
    max_per_transfer: number;
    note: string;
  };
  transactions: TreasuryTx[];
};

export type TreasuryTaxRates = {
  income_tax_rate: number;
  corporate_tax_rate: number;
  national_tax_rate: number;
  can_view_treasury: boolean;
  can_spend_treasury: boolean;
};

export type TreasuryDisburseResult = {
  disbursed: number;
  to_character_id: number;
  to_display_name: string;
  reason: string;
  treasury_balance: number;
  authorized_by: string;
};

export type TreasuryDonateResult = {
  donated: number;
  treasury_balance: number;
  cash: number;
};
