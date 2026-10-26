import { api } from './client';
import type {
  ActivityItem,
  BankMove,
  BankSummary,
  BankTx,
  Business,
  BusinessCatalog,
  BusinessCreate,
  BusinessPreview,
  Character,
  CharacterCreate,
  CrimeCatalogItem,
  CrimeHistoryItem,
  CrimeResult,
  CrimeType,
  DmMessage,
  EducationCatalogItem,
  EducationInstitution,
  EducationProgram,
  EducationTrack,
  Employee,
  StateEnterprise,
  TravelOption,
  EmployeeRole,
  Enrollment,
  Faction,
  GymCatalogItem,
  GymStat,
  GymTrainResult,
  InventoryItem,
  JailStatus,
  Job,
  JobListing,
  Loan,
  MarketListing,
  NotificationItem,
  Permit,
  PermitType,
  RegisterRequest,
  ShopItem,
  SocialEvent,
  SocialRelations,
  StateDetail,
  StateSummary,
  StockSellOrder,
  TokenResponse,
  Bill,
  Budget,
  Cabinet,
  CabinetSeat,
  Candidacy,
  ChatMessage,
  Election,
  HealthStatus,
  HousingListing,
  NewsItem,
  Parliament,
  RaceType,
  Residence,
  StockListing,
  StockMarket,
  StockPortfolio,
  TravelQuote,
  TravelStartResult,
  UserOut,
  VoteChoice,
  PoliticalParty,
  PartyMembership,
  GovernmentPost,
  TreasuryDisburseResult,
  TreasuryDonateResult,
  TreasurySnapshot,
  TreasuryTaxRates,
} from '../types/api';

export const authApi = {
  register: (body: RegisterRequest) =>
    api.post<UserOut>('/api/auth/register', body).then((r) => r.data),
  login: (username: string, password: string) => {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);
    return api
      .post<TokenResponse>('/api/auth/login', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .then((r) => r.data);
  },
  me: () => api.get<UserOut>('/api/auth/me').then((r) => r.data),
  neonStatus: () =>
    api
      .get<{
        configured: boolean;
        base_url: string | null;
        jwks_url: string | null;
        jwks_ok: boolean;
        base_ok: boolean;
        keys?: number;
        base_status?: number;
        reference_status?: number;
      }>('/api/auth/neon/status')
      .then((r) => r.data),
  neonExchange: (neon_access_token: string) =>
    api
      .post<TokenResponse>('/api/auth/neon/exchange', { neon_access_token })
      .then((r) => r.data),
};

export const statesApi = {
  list: () => api.get<StateSummary[]>('/api/states').then((r) => r.data),
  get: (id: number) => api.get<StateDetail>(`/api/states/${id}`).then((r) => r.data),
  bySlug: (slug: string) =>
    api.get<StateDetail>(`/api/states/slug/${slug}`).then((r) => r.data),
};

export const charactersApi = {
  create: (body: CharacterCreate) =>
    api.post<Character>('/api/characters', body).then((r) => r.data),
  me: () => api.get<Character>('/api/characters/me').then((r) => r.data),
  resetHome: (new_home_state_id: number) =>
    api
      .post<Character>('/api/characters/me/home-state/reset', { new_home_state_id })
      .then((r) => r.data),
};

export const jobsApi = {
  listings: (state_id?: number) =>
    api
      .get<JobListing[]>('/api/jobs/listings', {
        params: state_id != null ? { state_id } : undefined,
      })
      .then((r) => r.data),
  hire: (listing_id: number) =>
    api.post<Job>('/api/jobs/hire', { listing_id }).then((r) => r.data),
  me: () => api.get<Job | null>('/api/jobs/me').then((r) => r.data),
  work: () =>
    api
      .post<{
        wage: number;
        energy_spent: number;
        shifts_completed: number;
        cash: number;
        energy: number;
      }>('/api/jobs/work')
      .then((r) => r.data),
};

export const educationApi = {
  catalog: () =>
    api.get<EducationCatalogItem[]>('/api/education/catalog').then((r) => r.data),
  institutions: (params?: { state_id?: number; kind?: string }) =>
    api
      .get<{ institutions: EducationInstitution[] }>('/api/education/institutions', {
        params,
      })
      .then((r) => r.data.institutions),
  programs: (institution_id: number) =>
    api
      .get<{ programs: EducationProgram[] }>(
        `/api/education/institutions/${institution_id}/programs`,
      )
      .then((r) => r.data.programs),
  allPrograms: () =>
    api
      .get<{ programs: EducationProgram[] }>('/api/education/programs')
      .then((r) => r.data.programs),
  enroll: (body: { program_id: number } | { track: EducationTrack }) =>
    api.post<Enrollment>('/api/education/enroll', body).then((r) => r.data),
  me: () => api.get<Enrollment[]>('/api/education/me').then((r) => r.data),
};

export const enterprisesApi = {
  list: () =>
    api
      .get<{ enterprises: StateEnterprise[] }>('/api/enterprises')
      .then((r) => r.data.enterprises),
};

export const permitsApi = {
  apply: (state_id: number, permit_type: PermitType) =>
    api.post<Permit>('/api/permits/apply', { state_id, permit_type }).then((r) => r.data),
  me: () => api.get<Permit[]>('/api/permits/me').then((r) => r.data),
};

export const businessesApi = {
  catalog: () =>
    api.get<BusinessCatalog>('/api/businesses/catalog').then((r) => r.data),
  preview: (params: {
    state_id: number;
    entity_type: string;
    starting_capital?: number;
  }) =>
    api
      .get<BusinessPreview>('/api/businesses/preview', { params })
      .then((r) => r.data),
  create: (body: BusinessCreate) =>
    api.post<Business>('/api/businesses', body).then((r) => r.data),
  me: () => api.get<Business[]>('/api/businesses/me').then((r) => r.data),
  deposit: (business_id: number, amount: number) =>
    api
      .post<{ business_id: number; deposited: number; business_cash: number; cash: number }>(
        `/api/businesses/${business_id}/deposit`,
        { amount },
      )
      .then((r) => r.data),
  withdraw: (business_id: number, amount: number) =>
    api
      .post<Record<string, unknown>>(`/api/businesses/${business_id}/withdraw`, { amount })
      .then((r) => r.data),
  employees: (business_id: number) =>
    api.get<Employee[]>(`/api/businesses/${business_id}/employees`).then((r) => r.data),
  hireNpc: (business_id: number, body?: { role?: EmployeeRole; display_name?: string | null }) =>
    api
      .post<Employee>(`/api/businesses/${business_id}/employees/hire`, body ?? {})
      .then((r) => r.data),
  hirePlayer: (
    business_id: number,
    body: { display_name: string; role?: EmployeeRole; wage_per_week?: number | null },
  ) =>
    api
      .post<Employee>(`/api/businesses/${business_id}/employees/hire-player`, body)
      .then((r) => r.data),
  fire: (business_id: number, employee_id: number) =>
    api.delete(`/api/businesses/${business_id}/employees/${employee_id}`).then((r) => r.data),
};

export const crimeApi = {
  catalog: () => api.get<CrimeCatalogItem[]>('/api/crime/catalog').then((r) => r.data),
  commit: (crime_type: CrimeType) =>
    api.post<CrimeResult>('/api/crime/commit', { crime_type }).then((r) => r.data),
  history: () => api.get<CrimeHistoryItem[]>('/api/crime/history').then((r) => r.data),
};

export const gymApi = {
  catalog: () => api.get<GymCatalogItem[]>('/api/gym/catalog').then((r) => r.data),
  train: (stat: GymStat) =>
    api.post<GymTrainResult>('/api/gym/train', { stat }).then((r) => r.data),
};

export const inventoryApi = {
  me: () => api.get<InventoryItem[]>('/api/inventory/me').then((r) => r.data),
  shop: () => api.get<ShopItem[]>('/api/inventory/shop').then((r) => r.data),
  buyShop: (item_key: string, quantity = 1) =>
    api
      .post<{ item_key: string; quantity: number; spent: number; cash: number }>(
        '/api/inventory/shop/buy',
        { item_key, quantity },
      )
      .then((r) => r.data),
  market: () => api.get<MarketListing[]>('/api/inventory/market').then((r) => r.data),
  buyMarket: (listing_id: number, quantity = 1) =>
    api
      .post<Record<string, unknown>>('/api/inventory/market/buy', { listing_id, quantity })
      .then((r) => r.data),
  sellMarket: (body: {
    item_key: string;
    quantity: number;
    price_each: number;
    note?: string | null;
  }) =>
    api
      .post<{ id: number; item_key: string; quantity: number; price_each: number }>(
        '/api/inventory/market/sell',
        body,
      )
      .then((r) => r.data),
  use: (item_key: string) =>
    api
      .post<{
        item_key: string;
        message: string;
        cash: number;
        energy: number;
        nerve: number;
        health: number;
      }>(`/api/inventory/use/${encodeURIComponent(item_key)}`)
      .then((r) => r.data),
};

export const jailApi = {
  me: () => api.get<JailStatus>('/api/jail/me').then((r) => r.data),
  bail: () => api.post<Record<string, unknown>>('/api/jail/bail').then((r) => r.data),
};

export const activitiesApi = {
  me: () => api.get<ActivityItem[]>('/api/activities/me').then((r) => r.data),
  notifications: () =>
    api.get<NotificationItem[]>('/api/activities/notifications').then((r) => r.data),
  markRead: () =>
    api
      .post<{ marked: number }>('/api/activities/notifications/read')
      .then((r) => r.data),
};

export const socialApi = {
  relations: () => api.get<SocialRelations>('/api/social/relations').then((r) => r.data),
  friendRequest: (display_name: string) =>
    api
      .post<Record<string, unknown>>('/api/social/friends/request', { display_name })
      .then((r) => r.data),
  friendAccept: (relation_id: number) =>
    api
      .post<Record<string, unknown>>(`/api/social/friends/${relation_id}/accept`)
      .then((r) => r.data),
  addEnemy: (display_name: string) =>
    api
      .post<Record<string, unknown>>('/api/social/enemies', { display_name })
      .then((r) => r.data),
  attack: (display_name: string) =>
    api
      .post<Record<string, unknown>>('/api/social/attack', { display_name })
      .then((r) => r.data),
  events: () => api.get<SocialEvent[]>('/api/social/events').then((r) => r.data),
  factions: () => api.get<Faction[]>('/api/social/factions').then((r) => r.data),
  createFaction: (body: { name: string; tag: string; description?: string | null }) =>
    api
      .post<{ id: number; name: string; tag: string }>('/api/social/factions', body)
      .then((r) => r.data),
  joinFaction: (faction_id: number) =>
    api
      .post<Record<string, unknown>>(`/api/social/factions/${faction_id}/join`)
      .then((r) => r.data),
  messages: () => api.get<DmMessage[]>('/api/social/messages').then((r) => r.data),
  sendMessage: (to_display_name: string, body: string) =>
    api
      .post<DmMessage>('/api/social/messages', { to_display_name, body })
      .then((r) => r.data),
};

export const bankApi = {
  me: () => api.get<BankSummary>('/api/bank/me').then((r) => r.data),
  deposit: (amount: number) =>
    api.post<BankMove>('/api/bank/deposit', { amount }).then((r) => r.data),
  withdraw: (amount: number) =>
    api.post<BankMove>('/api/bank/withdraw', { amount }).then((r) => r.data),
  createLoan: (amount: number) =>
    api.post<Loan>('/api/bank/loans', { amount }).then((r) => r.data),
  repayLoan: (loan_id: number, amount: number) =>
    api.post<Loan>(`/api/bank/loans/${loan_id}/repay`, { amount }).then((r) => r.data),
  transfer: (to_display_name: string, amount: number) =>
    api
      .post<Record<string, unknown>>('/api/bank/transfer', { to_display_name, amount })
      .then((r) => r.data),
  transactions: (params?: { limit?: number }) =>
    api
      .get<BankTx[] | BankTx>('/api/bank/transactions', { params })
      .then((r) => (Array.isArray(r.data) ? r.data : r.data ? [r.data] : [])),
};

export const treasuryApi = {
  snapshot: (params?: { limit?: number }) =>
    api.get<TreasurySnapshot>('/api/treasury', { params }).then((r) => r.data),
  myRate: () => api.get<TreasuryTaxRates>('/api/treasury/my-rate').then((r) => r.data),
  disburse: (body: {
    amount: number;
    reason: string;
    to_character_id?: number;
    to_display_name?: string;
  }) =>
    api.post<TreasuryDisburseResult>('/api/treasury/disburse', body).then((r) => r.data),
  donate: (body: { amount: number; note?: string }) =>
    api.post<TreasuryDonateResult>('/api/treasury/donate', body).then((r) => r.data),
};

export const stocksApi = {
  market: () => api.get<StockMarket>('/api/stocks/market').then((r) => r.data),
  portfolio: () => api.get<StockPortfolio>('/api/stocks/portfolio').then((r) => r.data),
  buy: (listing_id: number, shares: number) =>
    api
      .post<Record<string, unknown>>('/api/stocks/buy', { listing_id, shares })
      .then((r) => r.data),
  sell: (listing_id: number, shares: number) =>
    api
      .post<Record<string, unknown>>('/api/stocks/sell', { listing_id, shares })
      .then((r) => r.data),
  ipo: (body: {
    business_id: number;
    symbol: string;
    total_shares: number;
    ipo_price: number;
    founder_keep_pct?: number;
  }) =>
    api.post<StockListing>('/api/stocks/ipo', body).then((r) => r.data),
  orders: () =>
    api
      .get<{ orders: StockSellOrder[] }>('/api/stocks/orders')
      .then((r) => r.data.orders ?? []),
  placeOrder: (listing_id: number, shares: number, price_each: number) =>
    api
      .post<{ order_id: number; symbol: string; shares: number; price_each: number }>(
        '/api/stocks/orders',
        { listing_id, shares, price_each },
      )
      .then((r) => r.data),
  fillOrder: (order_id: number, shares: number) =>
    api
      .post<Record<string, unknown>>('/api/stocks/orders/fill', { order_id, shares })
      .then((r) => r.data),
};

export const travelApi = {
  options: (to_state_id: number) =>
    api
      .get<{ options: TravelOption[] }>('/api/travel/options', {
        params: { to_state_id },
      })
      .then((r) => r.data.options),
  quote: (to_state_id: number, carrier_id?: number) =>
    api
      .post<TravelQuote>('/api/travel/quote', {
        to_state_id,
        ...(carrier_id != null ? { carrier_id } : {}),
      })
      .then((r) => r.data),
  start: (to_state_id: number, carrier_id?: number) =>
    api
      .post<TravelStartResult>('/api/travel/start', {
        to_state_id,
        ...(carrier_id != null ? { carrier_id } : {}),
      })
      .then((r) => r.data),
};

export const housingApi = {
  listings: (state_id?: number) =>
    api
      .get<HousingListing[]>('/api/housing/listings', {
        params: state_id != null ? { state_id } : undefined,
      })
      .then((r) => r.data),
  me: () => api.get<Residence | null>('/api/housing/me').then((r) => r.data),
  rent: (listing_id: number) =>
    api.post<Residence>('/api/housing/rent', { listing_id }).then((r) => r.data),
  buy: (listing_id: number) =>
    api.post<Residence>('/api/housing/buy', { listing_id }).then((r) => r.data),
  leave: () => api.post('/api/housing/leave').then((r) => r.data),
};

export const medicalApi = {
  me: () => api.get<HealthStatus>('/api/medical/me').then((r) => r.data),
  clinic: (hp_amount: number) =>
    api
      .post<Record<string, unknown>>('/api/medical/clinic', { hp_amount })
      .then((r) => r.data),
  hospital: () =>
    api.post<Record<string, unknown>>('/api/medical/hospital').then((r) => r.data),
};

export const politicsApi = {
  parliament: () => api.get<Parliament>('/api/politics/parliament').then((r) => r.data),
  currentElection: () =>
    api
      .get<{ election: Election | null }>('/api/politics/elections/current')
      .then((r) => r.data),
  candidates: (
    election_id: number,
    params?: { race_type?: string; state_id?: number },
  ) =>
    api
      .get<Candidacy[]>(`/api/politics/elections/${election_id}/candidates`, { params })
      .then((r) => r.data),
  run: (election_id: number, race_type: RaceType, slogan: string) =>
    api
      .post<Record<string, unknown>>(`/api/politics/elections/${election_id}/run`, {
        race_type,
        slogan,
      })
      .then((r) => r.data),
  vote: (election_id: number, candidacy_id: number) =>
    api
      .post<Record<string, unknown>>(`/api/politics/elections/${election_id}/vote`, {
        candidacy_id,
      })
      .then((r) => r.data),
  resolve: (election_id: number) =>
    api
      .post<Record<string, unknown>>(`/api/politics/elections/${election_id}/resolve`)
      .then((r) => r.data),
};

export const legislationApi = {
  bills: (status?: string) =>
    api
      .get<Bill[]>('/api/legislation/bills', {
        params: status ? { status } : undefined,
      })
      .then((r) => (Array.isArray(r.data) ? r.data : r.data ? [r.data as Bill] : [])),
  propose: (title: string, summary: string) =>
    api.post<Bill>('/api/legislation/bills', { title, summary }).then((r) => r.data),
  voteBill: (bill_id: number, choice: VoteChoice) =>
    api
      .post<Record<string, unknown>>(`/api/legislation/bills/${bill_id}/vote`, { choice })
      .then((r) => r.data),
  veto: (bill_id: number) =>
    api
      .post<Record<string, unknown>>(`/api/legislation/bills/${bill_id}/veto`)
      .then((r) => r.data),
  currentBudget: () =>
    api
      .get<{ budget: Budget | null }>('/api/legislation/budget/current')
      .then((r) => r.data),
  voteBudget: (budget_id: number, choice: 'yes' | 'no' | 'abstain') =>
    api
      .post<Record<string, unknown>>(`/api/legislation/budget/${budget_id}/vote`, {
        choice,
      })
      .then((r) => r.data),
};

export const newsApi = {
  list: (params?: { limit?: number; category?: string; state_id?: number }) =>
    api.get<NewsItem[]>('/api/news', { params }).then((r) => r.data),
};

export const cabinetApi = {
  list: () => api.get<Cabinet>('/api/cabinet').then((r) => r.data),
  me: () =>
    api
      .get<{ seat: CabinetSeat | null }>('/api/cabinet/me')
      .then((r) => r.data.seat),
  appoint: (portfolio: string, username: string, character_id?: number) =>
    api
      .post<Record<string, unknown>>('/api/cabinet/appoint', {
        portfolio,
        username: username.trim(),
        ...(character_id != null && character_id > 0 ? { character_id } : {}),
      })
      .then((r) => r.data),
  dismiss: (portfolio: string) =>
    api
      .post<Record<string, unknown>>('/api/cabinet/dismiss', { portfolio })
      .then((r) => r.data),
  resign: () =>
    api.post<Record<string, unknown>>('/api/cabinet/resign').then((r) => r.data),
};

export const partiesApi = {
  list: () =>
    api.get<{ parties: PoliticalParty[] }>('/api/parties').then((r) => r.data.parties),
  me: () =>
    api
      .get<{ membership: PartyMembership | null }>('/api/parties/me')
      .then((r) => r.data.membership),
  join: (party_id: number) =>
    api.post<Record<string, unknown>>('/api/parties/join', { party_id }).then((r) => r.data),
  leave: () =>
    api.post<Record<string, unknown>>('/api/parties/leave').then((r) => r.data),
};

export const governmentApi = {
  posts: (params?: { state_id?: number; open_only?: boolean }) =>
    api
      .get<{ posts: GovernmentPost[] }>('/api/government/posts', { params })
      .then((r) => r.data.posts),
  me: () =>
    api
      .get<{ post: GovernmentPost | null }>('/api/government/me')
      .then((r) => r.data.post),
  apply: (post_id: number) =>
    api
      .post<GovernmentPost & { message?: string; displaced_npc?: string | null }>(
        '/api/government/apply',
        { post_id },
      )
      .then((r) => r.data),
  resign: () =>
    api
      .post<{ resigned: boolean; title: string; npc_caretaker: string }>('/api/government/resign')
      .then((r) => r.data),
};

function asMessageList(data: ChatMessage[] | ChatMessage | null | undefined): ChatMessage[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

export const chatApi = {
  home: (params?: { limit?: number }) =>
    api
      .get<ChatMessage[] | ChatMessage>('/api/chat/home/messages', { params })
      .then((r) => asMessageList(r.data)),
  state: (state_id: number, params?: { limit?: number; before_id?: number }) =>
    api
      .get<ChatMessage[] | ChatMessage>(`/api/chat/states/${state_id}/messages`, { params })
      .then((r) => asMessageList(r.data)),
  post: (state_id: number, body: string) =>
    api
      .post<ChatMessage>(`/api/chat/states/${state_id}/messages`, { body })
      .then((r) => r.data),
};
