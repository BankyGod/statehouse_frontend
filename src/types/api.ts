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
  | 'burglary'
  | 'fraud'
  | 'smuggling'
  | 'fencing';

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
};

export type ParliamentSeat = {
  state_id: number;
  state_name: string;
  state_slug: string;
  mp_name: string;
  mp_character_id: number | null;
  is_npc: boolean;
};

export type Parliament = {
  seats: ParliamentSeat[];
  majority_needed: number;
  veto_override_needed: number;
  president: {
    name: string;
    character_id: number | null;
    is_npc: boolean;
  };
  speaker_character_id: number | null;
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
};

export type TravelStartResult = {
  message?: string;
  cost?: number;
  minutes?: number;
  travel_until?: string;
  destination_id?: number;
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
  population_count: number;
  population_cap: number;
  is_open: boolean;
  average_income: number;
  starting_bonus: number;
  crime_catch_rate: number;
};

export type StateDetail = StateSummary & {
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

export type Enrollment = {
  id: number;
  track: EducationTrack;
  status: string;
  title: string;
  cost_paid: number;
  age_gain_years: number;
  education_level: number;
  started_at: string;
  completes_at: string;
  completed_at: string | null;
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

export type Business = {
  id: number;
  name: string;
  sector: string;
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

export type ChatMessage = {
  id: number;
  state_id: number;
  character_id: number;
  display_name: string;
  body: string;
  posted_at: string;
};
