import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  CandlestickChart,
  LayoutDashboard,
  MapPin,
  Package,
  Users,
  Wallet,
} from 'lucide-react';
import { businessesApi, statesApi, stocksApi } from '../api/endpoints';
import { ErrorNotice } from '../components/ErrorNotice';
import { LockBanner } from '../components/LockBanner';
import { StockChart } from '../components/StockChart';
import { Timer } from '../components/Timer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { EMPLOYEE_ROLES, sectorLabel } from '../lib/businessCatalog';
import { money } from '../lib/format';
import type { Employee, EmployeeRole, PropertyTypeOption } from '../types/api';

type DashTab = 'overview' | 'treasury' | 'staff' | 'exchange' | 'stock';

export function BusinessManagePage() {
  const { id } = useParams();
  const businessId = Number(id);
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked =
    !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [tab, setTab] = useState<DashTab>('overview');
  const [cashAmt, setCashAmt] = useState('25');
  const [hireMode, setHireMode] = useState<'npc' | 'player'>('npc');
  const [npcRole, setNpcRole] = useState<EmployeeRole>('labourer');
  const [npcName, setNpcName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerRole, setPlayerRole] = useState<EmployeeRole>('clerk');
  const [playerWage, setPlayerWage] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState<EmployeeRole>('clerk');
  const [editWage, setEditWage] = useState('');
  const [editName, setEditName] = useState('');

  const [listTitle, setListTitle] = useState('');
  const [listPropertyType, setListPropertyType] = useState('one_bed');
  const [listUnits, setListUnits] = useState('1');
  const [listOfferMode, setListOfferMode] = useState<'rent' | 'sale' | 'both'>('both');
  const [listRent, setListRent] = useState('');
  const [listBuy, setListBuy] = useState('');
  const [listDesc, setListDesc] = useState('');
  const [ipoSymbol, setIpoSymbol] = useState('');
  const [ipoShares, setIpoShares] = useState('5000');
  const [ipoPrice, setIpoPrice] = useState('10');
  const [founderPct, setFounderPct] = useState('0.4');

  const statesQ = useQuery({
    queryKey: ['states'],
    queryFn: () => statesApi.list(),
  });

  const meQ = useQuery({
    queryKey: ['businesses', 'me'],
    queryFn: () => businessesApi.me(),
    refetchInterval: 30_000,
  });

  const business = meQ.data?.find((b) => b.id === businessId) ?? null;
  const isRealEstate = business?.sector === 'real_estate';
  const active = business?.status === 'active';

  const empQ = useQuery({
    queryKey: ['businesses', businessId, 'employees'],
    queryFn: () => businessesApi.employees(businessId),
    enabled: Number.isFinite(businessId) && businessId > 0,
  });

  const listingsQ = useQuery({
    queryKey: ['businesses', businessId, 'listings'],
    queryFn: () => businessesApi.listings(businessId),
    enabled: !!business && isRealEstate,
  });

  const propertyCatalogQ = useQuery({
    queryKey: ['businesses', 'property-catalog'],
    queryFn: () => businessesApi.propertyCatalog(),
    enabled: isRealEstate,
    staleTime: 60_000,
  });

  const perfQ = useQuery({
    queryKey: ['businesses', businessId, 'performance'],
    queryFn: () => businessesApi.performance(businessId),
    enabled: Number.isFinite(businessId) && businessId > 0,
    refetchInterval: 20_000,
  });

  const propertyTypes = propertyCatalogQ.data?.property_types ?? [];
  const selectedPropertyType: PropertyTypeOption | undefined = propertyTypes.find(
    (p) => p.slug === listPropertyType,
  );
  const unitsNum = Math.max(1, Math.min(50, Number(listUnits) || 1));
  const acquisitionPreview = selectedPropertyType
    ? selectedPropertyType.acquisition_cost * unitsNum
    : 0;

  const staff = empQ.data ?? [];
  const weeklyPayroll = staff.reduce((s, e) => s + e.wage_per_week, 0);
  const stockCount = listingsQ.data?.length ?? 0;

  const stateName = (sid: number) => statesQ.data?.find((s) => s.id === sid)?.name ?? `#${sid}`;

  async function refreshBiz() {
    await qc.invalidateQueries({ queryKey: ['businesses'] });
    void refreshCharacter();
  }

  const depositMut = useMutation({
    mutationFn: (amount: number) => businessesApi.deposit(businessId, amount),
    onSuccess: async (res) => {
      toast.push(`Deposited ${money(res.deposited)}. Treasury ${money(res.business_cash)}.`, 'ok');
      await refreshBiz();
    },
    onError: (err) => toast.pushError(err),
  });

  const withdrawMut = useMutation({
    mutationFn: (amount: number) => businessesApi.withdraw(businessId, amount),
    onSuccess: async () => {
      toast.push('Withdrew from treasury.', 'ok');
      await refreshBiz();
    },
    onError: (err) => toast.pushError(err),
  });

  const hireNpcMut = useMutation({
    mutationFn: () =>
      businessesApi.hireNpc(businessId, {
        role: npcRole,
        display_name: npcName.trim() || null,
      }),
    onSuccess: async (e) => {
      toast.push(`Hired ${e.display_name} (${e.role}).`, 'ok');
      setNpcName('');
      await refreshBiz();
    },
    onError: (err) => toast.pushError(err),
  });

  const hirePlayerMut = useMutation({
    mutationFn: () =>
      businessesApi.hirePlayer(businessId, {
        display_name: playerName.trim(),
        role: playerRole,
        wage_per_week: playerWage.trim() ? Number(playerWage) : null,
      }),
    onSuccess: async (e) => {
      toast.push(`Hired player ${e.display_name}.`, 'ok');
      setPlayerName('');
      setPlayerWage('');
      await refreshBiz();
    },
    onError: (err) => toast.pushError(err),
  });

  const fireMut = useMutation({
    mutationFn: (employee_id: number) => businessesApi.fire(businessId, employee_id),
    onSuccess: async () => {
      toast.push('Employee fired.', 'ok');
      setEditId(null);
      await refreshBiz();
    },
    onError: (err) => toast.pushError(err),
  });

  const updateEmpMut = useMutation({
    mutationFn: () =>
      businessesApi.updateEmployee(businessId, editId!, {
        role: editRole,
        wage_per_week: Number(editWage),
        display_name: editName.trim() || undefined,
      }),
    onSuccess: async (e) => {
      toast.push(`Updated ${e.display_name} — ${money(e.wage_per_week)}/wk.`, 'ok');
      setEditId(null);
      await refreshBiz();
    },
    onError: (err) => toast.pushError(err),
  });

  const createListingMut = useMutation({
    mutationFn: () =>
      businessesApi.createListing(businessId, {
        property_type: listPropertyType,
        units: unitsNum,
        offer_mode: listOfferMode,
        title: listTitle.trim() || null,
        description: listDesc.trim() || null,
        weekly_rent:
          listOfferMode === 'sale'
            ? null
            : listRent.trim()
              ? Number(listRent)
              : selectedPropertyType?.suggested_weekly_rent ?? null,
        buy_price:
          listOfferMode === 'rent'
            ? null
            : listBuy.trim()
              ? Number(listBuy)
              : selectedPropertyType?.suggested_buy_price ?? null,
      }),
    onSuccess: async (listing) => {
      toast.push(
        `Stocked ${listing.units_total ?? unitsNum}× ${listing.title} (${listing.offer_mode}).`,
        'ok',
      );
      setListTitle('');
      setListDesc('');
      setListRent('');
      setListBuy('');
      await refreshBiz();
    },
    onError: (err) => toast.pushError(err),
  });

  const toggleListingMut = useMutation({
    mutationFn: (listing: { id: number; is_available?: boolean }) =>
      businessesApi.updateListing(businessId, listing.id, {
        is_available: !(listing.is_available ?? true),
      }),
    onSuccess: async () => {
      toast.push('Listing updated.', 'ok');
      await qc.invalidateQueries({ queryKey: ['businesses', businessId, 'listings'] });
      await qc.invalidateQueries({ queryKey: ['housing'] });
    },
    onError: (err) => toast.pushError(err),
  });

  const ipoMut = useMutation({
    mutationFn: () =>
      stocksApi.ipo({
        business_id: businessId,
        symbol: ipoSymbol.trim().toUpperCase(),
        total_shares: Number(ipoShares),
        ipo_price: Number(ipoPrice),
        founder_keep_pct: Number(founderPct),
      }),
    onSuccess: async (listing) => {
      toast.push(`Listed ${listing.symbol} at ${money(listing.share_price)}.`, 'ok');
      setIpoSymbol('');
      await refreshBiz();
      await qc.invalidateQueries({ queryKey: ['businesses', businessId, 'performance'] });
      await qc.invalidateQueries({ queryKey: ['stocks'] });
    },
    onError: (err) => toast.pushError(err),
  });

  function parseAmt(): number | null {
    const n = Number(cashAmt);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }

  function startEdit(e: Employee) {
    setEditId(e.id);
    setEditRole(e.role);
    setEditWage(String(e.wage_per_week));
    setEditName(e.display_name);
  }

  if (!Number.isFinite(businessId) || businessId <= 0) {
    return (
      <div className="play-page">
        <p className="warn">Invalid business.</p>
        <Link to="/business/mine">Back to portfolio</Link>
      </div>
    );
  }

  if (meQ.isLoading) {
    return (
      <div className="play-page">
        <p className="muted">Loading company…</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="play-page">
        <p className="warn">Company not found in your portfolio.</p>
        <Link to="/business/mine" className="btn">
          My businesses
        </Link>
      </div>
    );
  }

  const tabs: { id: DashTab; label: string; Icon: typeof Wallet; hide?: boolean }[] = [
    { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
    { id: 'treasury', label: 'Treasury', Icon: Wallet },
    { id: 'staff', label: 'Staff', Icon: Users },
    { id: 'exchange', label: 'Exchange', Icon: CandlestickChart },
    { id: 'stock', label: isRealEstate ? 'Property' : 'Inventory', Icon: Package },
  ];

  const perf = perfQ.data;
  const score = perf?.metrics.performance_score ?? 0;
  const pricePoints = (perf?.price_history ?? []).map((p) => ({ t: p.t, price: p.price }));

  return (
    <div className="play-page biz-dash">
      <LockBanner />

      <header className="biz-dash-top">
        <div className="biz-dash-top-main">
          <Link to="/business/mine" className="btn ghost sm biz-dash-back">
            <ArrowLeft size={14} aria-hidden /> Portfolio
          </Link>
          <div>
            <p className="biz-crumb">
              <Link to="/business">Business</Link>
              <span aria-hidden> / </span>
              <Link to="/business/mine">My businesses</Link>
              <span aria-hidden> / </span>
              Manage
            </p>
            <h1>
              <Building2 size={20} aria-hidden /> {business.name}
            </h1>
            <p className="biz-dash-sub">
              <span className={`badge ${active ? 'active' : 'pending'}`}>{business.status}</span>
              <span>{sectorLabel(business.sector)}</span>
              <span>
                <MapPin size={12} aria-hidden /> {stateName(business.state_id)}
              </span>
              {business.entity_type && (
                <span>{business.entity_type.replaceAll('_', ' ')}</span>
              )}
            </p>
          </div>
        </div>
        <div className="biz-dash-kpis">
          <div className="biz-kpi">
            <em>Treasury</em>
            <strong className="cash">{money(business.cash_balance)}</strong>
          </div>
          <div className="biz-kpi">
            <em>Staff</em>
            <strong>{staff.length || business.employee_count || 0}</strong>
          </div>
          <div className="biz-kpi">
            <em>Payroll / wk</em>
            <strong>{money(weeklyPayroll)}</strong>
          </div>
          <div className="biz-kpi">
            <em>Lifetime revenue</em>
            <strong>{money(business.lifetime_revenue ?? 0)}</strong>
          </div>
          <div className="biz-kpi">
            <em>Performance</em>
            <strong>{score.toFixed(0)}/100</strong>
          </div>
        </div>
      </header>

      {!active && business.registration_completes_at && (
        <div className="biz-dash-banner">
          Registration finishes in{' '}
          <Timer
            completesAt={business.registration_completes_at}
            onComplete={() => void refreshBiz()}
          />
          . Hiring, withdrawals, and stock unlock when active.
        </div>
      )}

      <div className="biz-dash-shell">
        <nav className="biz-dash-nav" aria-label="Company sections">
          {tabs.map(({ id: tabId, label, Icon, hide }) =>
            hide ? null : (
              <button
                key={tabId}
                type="button"
                className={`biz-dash-nav-item ${tab === tabId ? 'active' : ''}`}
                onClick={() => setTab(tabId)}
              >
                <Icon size={15} aria-hidden />
                {label}
                {tabId === 'staff' && staff.length > 0 && (
                  <span className="biz-dash-count">{staff.length}</span>
                )}
                {tabId === 'stock' && isRealEstate && stockCount > 0 && (
                  <span className="biz-dash-count">{stockCount}</span>
                )}
              </button>
            ),
          )}
        </nav>

        <div className="biz-dash-main">
          {tab === 'overview' && (
            <section className="biz-dash-pane">
              <h2>Company overview</h2>
              <div className="biz-overview-grid">
                <article className="biz-overview-card">
                  <h3>Identity</h3>
                  <ul className="kv">
                    <li>
                      <span>Address</span>
                      <strong>{business.local_address}</strong>
                    </li>
                    <li>
                      <span>Home-state firm</span>
                      <strong>{business.is_home_state ? 'Yes' : 'No'}</strong>
                    </li>
                    <li>
                      <span>Public</span>
                      <strong>{business.is_public ? 'Listed' : 'Private'}</strong>
                    </li>
                    <li>
                      <span>Lifetime wages</span>
                      <strong>{money(business.lifetime_wages ?? 0)}</strong>
                    </li>
                  </ul>
                  {business.description && (
                    <p className="muted sm">{business.description}</p>
                  )}
                </article>
                <article className="biz-overview-card">
                  <h3>Quick actions</h3>
                  <div className="biz-quick-actions">
                    <button type="button" className="btn sm" onClick={() => setTab('treasury')}>
                      Move cash
                    </button>
                    <button
                      type="button"
                      className="btn sm primary"
                      onClick={() => setTab('staff')}
                      disabled={!active}
                    >
                      Manage staff
                    </button>
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => setTab('exchange')}
                      disabled={!active}
                    >
                      Exchange & IPO
                    </button>
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => setTab('stock')}
                      disabled={!active && isRealEstate}
                    >
                      {isRealEstate ? 'Property stock' : 'Inventory'}
                    </button>
                  </div>
                  <p className="muted sm" style={{ marginTop: '0.75rem' }}>
                    Grow revenue and staff to raise your performance score — that unlocks a public
                    stock listing for investors.
                  </p>
                </article>
              </div>
            </section>
          )}

          {tab === 'exchange' && (
            <section className="biz-dash-pane">
              <h2>Performance & exchange</h2>
              {perfQ.isLoading && <p className="muted">Loading performance…</p>}
              {perfQ.isError && <ErrorNotice error={perfQ.error} />}
              {perf && (
                <>
                  <div className="biz-overview-grid">
                    <article className="biz-overview-card">
                      <h3>Ops score</h3>
                      <p className="biz-perf-score">
                        <strong>{perf.metrics.performance_score.toFixed(1)}</strong>
                        <span className="muted">/ 100</span>
                      </p>
                      <ul className="kv">
                        <li>
                          <span>Age</span>
                          <strong>{perf.metrics.age_days.toFixed(1)} days</strong>
                        </li>
                        <li>
                          <span>Net profit</span>
                          <strong className={perf.metrics.net_profit >= 0 ? 'cash' : 'danger-text'}>
                            {money(perf.metrics.net_profit)}
                          </strong>
                        </li>
                        <li>
                          <span>Lifetime revenue</span>
                          <strong>{money(perf.metrics.lifetime_revenue)}</strong>
                        </li>
                        <li>
                          <span>Lifetime wages</span>
                          <strong>{money(perf.metrics.lifetime_wages)}</strong>
                        </li>
                        <li>
                          <span>Active staff</span>
                          <strong>{perf.metrics.employee_count}</strong>
                        </li>
                      </ul>
                    </article>
                    <article className="biz-overview-card">
                      <h3>
                        IPO readiness{' '}
                        <span className={`badge ${perf.ipo.eligible ? 'active' : 'pending'}`}>
                          {perf.ipo.eligible ? 'Eligible' : 'Not ready'}
                        </span>
                      </h3>
                      <ul className="biz-ipo-checks">
                        {perf.ipo.checks.map((c) => (
                          <li key={c.key} className={c.ok ? 'ok' : 'fail'}>
                            <span>{c.ok ? '✓' : '✗'}</span>
                            <div>
                              <strong>{c.label}</strong>
                              <em className="muted sm">{c.detail}</em>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <p className="muted sm">
                        Listing fee {money(perf.ipo.listing_fee)} (from company treasury).
                      </p>
                    </article>
                  </div>

                  {perf.is_public && perf.stock ? (
                    <div className="biz-listed-block">
                      <div className="row-between" style={{ marginBottom: '0.75rem' }}>
                        <h3 style={{ margin: 0 }}>
                          Listed as {perf.stock.symbol}
                        </h3>
                        <Link to="/stocks" className="btn sm">
                          Open exchange
                        </Link>
                      </div>
                      <StockChart
                        symbol={perf.stock.symbol}
                        name={perf.name}
                        points={
                          pricePoints.length
                            ? pricePoints
                            : [
                                {
                                  t: Date.now() - 60_000,
                                  price: perf.stock.share_price,
                                },
                                { t: Date.now(), price: perf.stock.share_price },
                              ]
                        }
                        livePrice={perf.stock.share_price}
                        booming={perf.stock.is_booming}
                      />
                      <p className="muted sm" style={{ marginTop: '0.5rem' }}>
                        Chart ticks come from company ops profits/losses and investor trades — not
                        random noise.
                      </p>
                    </div>
                  ) : (
                    <form
                      className="biz-stock-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!perf.ipo.eligible) {
                          toast.push('Meet every checklist item before listing.', 'err');
                          return;
                        }
                        if (ipoSymbol.trim().length < 2) {
                          toast.push('Symbol needs 2–8 letters.', 'err');
                          return;
                        }
                        ipoMut.mutate();
                      }}
                    >
                      <h3 className="span-2">Launch IPO</h3>
                      <p className="muted sm span-2">
                        Once listed, investors can buy your float. Share price then tracks real
                        company performance and market trades.
                      </p>
                      <label>
                        Symbol
                        <input
                          value={ipoSymbol}
                          onChange={(e) => setIpoSymbol(e.target.value.toUpperCase())}
                          maxLength={8}
                          placeholder="e.g. ACRE"
                          disabled={locked || !perf.ipo.eligible}
                        />
                      </label>
                      <label>
                        Total shares
                        <input
                          type="number"
                          min={1000}
                          value={ipoShares}
                          onChange={(e) => setIpoShares(e.target.value)}
                          disabled={locked || !perf.ipo.eligible}
                        />
                      </label>
                      <label>
                        IPO price
                        <input
                          type="number"
                          min={1}
                          step={0.5}
                          value={ipoPrice}
                          onChange={(e) => setIpoPrice(e.target.value)}
                          disabled={locked || !perf.ipo.eligible}
                        />
                      </label>
                      <label>
                        Founder keep %
                        <input
                          type="number"
                          min={0.1}
                          max={0.8}
                          step={0.05}
                          value={founderPct}
                          onChange={(e) => setFounderPct(e.target.value)}
                          disabled={locked || !perf.ipo.eligible}
                        />
                      </label>
                      <div className="biz-stock-submit">
                        <button
                          type="submit"
                          className="btn primary"
                          disabled={locked || !active || !perf.ipo.eligible || ipoMut.isPending}
                        >
                          {ipoMut.isPending ? 'Listing…' : 'List on exchange'}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </section>
          )}

          {tab === 'treasury' && (
            <section className="biz-dash-pane">
              <div className="biz-pane-head">
                <h2>Treasury</h2>
                <strong className="cash">{money(business.cash_balance)}</strong>
              </div>
              <p className="muted sm">
                Deposit personal cash into the company, or withdraw to yourself when the firm is
                active.
              </p>
              <form
                className="biz-inline-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = parseAmt();
                  if (n == null) return toast.push('Enter amount.', 'err');
                  depositMut.mutate(n);
                }}
              >
                <label className="biz-inline-field">
                  Amount
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={cashAmt}
                    onChange={(e) => setCashAmt(e.target.value)}
                    disabled={locked}
                  />
                </label>
                <button
                  type="submit"
                  className="btn primary sm"
                  disabled={locked || depositMut.isPending}
                >
                  Deposit
                </button>
                <button
                  type="button"
                  className="btn sm"
                  disabled={locked || withdrawMut.isPending || !active}
                  onClick={() => {
                    const n = parseAmt();
                    if (n == null) return toast.push('Enter amount.', 'err');
                    withdrawMut.mutate(n);
                  }}
                >
                  Withdraw
                </button>
              </form>
            </section>
          )}

          {tab === 'staff' && (
            <section className="biz-dash-pane">
              <div className="biz-pane-head">
                <h2>Staff</h2>
                <span className="muted sm">
                  {staff.length} on roster · {money(weeklyPayroll)}/wk payroll
                </span>
              </div>
              {!active && (
                <p className="warn sm">Hiring unlocks when registration completes.</p>
              )}

              <div className="biz-toolbar">
                <div className="biz-seg">
                  <button
                    type="button"
                    className={hireMode === 'npc' ? 'active' : ''}
                    onClick={() => setHireMode('npc')}
                  >
                    NPC
                  </button>
                  <button
                    type="button"
                    className={hireMode === 'player' ? 'active' : ''}
                    onClick={() => setHireMode('player')}
                  >
                    Player
                  </button>
                </div>
                {hireMode === 'npc' ? (
                  <form
                    className="biz-inline-bar"
                    onSubmit={(e) => {
                      e.preventDefault();
                      hireNpcMut.mutate();
                    }}
                  >
                    <label className="biz-inline-field">
                      Role
                      <select
                        value={npcRole}
                        onChange={(e) => setNpcRole(e.target.value as EmployeeRole)}
                        disabled={locked || !active}
                      >
                        {EMPLOYEE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="biz-inline-field grow">
                      Name
                      <input
                        value={npcName}
                        onChange={(e) => setNpcName(e.target.value)}
                        placeholder="Optional"
                        disabled={locked || !active}
                      />
                    </label>
                    <button
                      type="submit"
                      className="btn primary sm"
                      disabled={locked || !active || hireNpcMut.isPending}
                    >
                      Hire
                    </button>
                  </form>
                ) : (
                  <form
                    className="biz-inline-bar"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (playerName.trim().length < 3) {
                        return toast.push('Enter display name.', 'err');
                      }
                      hirePlayerMut.mutate();
                    }}
                  >
                    <label className="biz-inline-field grow">
                      Display name
                      <input
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        minLength={3}
                        disabled={locked || !active}
                        required
                      />
                    </label>
                    <label className="biz-inline-field">
                      Role
                      <select
                        value={playerRole}
                        onChange={(e) => setPlayerRole(e.target.value as EmployeeRole)}
                        disabled={locked || !active}
                      >
                        {EMPLOYEE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="biz-inline-field">
                      Wage/wk
                      <input
                        type="number"
                        min={1}
                        value={playerWage}
                        onChange={(e) => setPlayerWage(e.target.value)}
                        placeholder="Auto"
                        disabled={locked || !active}
                      />
                    </label>
                    <button
                      type="submit"
                      className="btn primary sm"
                      disabled={locked || !active || hirePlayerMut.isPending}
                    >
                      Hire
                    </button>
                  </form>
                )}
              </div>

              {empQ.isError && <ErrorNotice error={empQ.error} />}

              <div className="biz-table-wrap">
                <table className="biz-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Wage</th>
                      <th>Hired</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {!staff.length && (
                      <tr>
                        <td colSpan={5} className="muted">
                          No employees on the books.
                        </td>
                      </tr>
                    )}
                    {staff.map((e) =>
                      editId === e.id ? (
                        <tr key={e.id} className="editing">
                          <td>
                            <input
                              value={editName}
                              onChange={(ev) => setEditName(ev.target.value)}
                            />
                          </td>
                          <td>
                            <select
                              value={editRole}
                              onChange={(ev) => setEditRole(ev.target.value as EmployeeRole)}
                            >
                              {EMPLOYEE_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              min={1}
                              value={editWage}
                              onChange={(ev) => setEditWage(ev.target.value)}
                            />
                          </td>
                          <td colSpan={2}>
                            <div className="biz-row-actions">
                              <button
                                type="button"
                                className="btn primary sm"
                                disabled={locked || updateEmpMut.isPending}
                                onClick={() => {
                                  const w = Number(editWage);
                                  if (!Number.isFinite(w) || w <= 0) {
                                    return toast.push('Enter a valid wage.', 'err');
                                  }
                                  updateEmpMut.mutate();
                                }}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn sm"
                                onClick={() => setEditId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={e.id}>
                          <td>
                            <strong>{e.display_name}</strong>
                            {e.is_npc && <span className="badge">NPC</span>}
                          </td>
                          <td className="cap">{e.role}</td>
                          <td className="cash">{money(e.wage_per_week)}</td>
                          <td className="muted sm">
                            {new Date(e.hired_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="biz-row-actions">
                              <button
                                type="button"
                                className="btn sm"
                                disabled={locked || !active}
                                onClick={() => startEdit(e)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn danger sm"
                                disabled={locked || fireMut.isPending}
                                onClick={() => fireMut.mutate(e.id)}
                              >
                                Fire
                              </button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === 'stock' &&
            (isRealEstate ? (
              <section className="biz-dash-pane">
                <div className="biz-pane-head">
                  <h2>Property stock</h2>
                  <span className="muted sm">{stockCount} listings</span>
                </div>
                <p className="muted sm">
                  Acquire units with company cash, then open them for rent and/or sale in{' '}
                  {stateName(business.state_id)}.
                </p>
                {propertyCatalogQ.isError && <ErrorNotice error={propertyCatalogQ.error} />}
                {listingsQ.isError && <ErrorNotice error={listingsQ.error} />}

                <form
                  className="biz-stock-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!selectedPropertyType) return toast.push('Pick a property type.', 'err');
                    if (acquisitionPreview > business.cash_balance) {
                      return toast.push(
                        `Need ${money(acquisitionPreview)} in company treasury.`,
                        'err',
                      );
                    }
                    createListingMut.mutate();
                  }}
                >
                  <label>
                    Type
                    <select
                      value={listPropertyType}
                      onChange={(e) => {
                        const slug = e.target.value;
                        setListPropertyType(slug);
                        const t = propertyTypes.find((p) => p.slug === slug);
                        if (t) {
                          setListRent(String(t.suggested_weekly_rent));
                          setListBuy(String(t.suggested_buy_price));
                        }
                      }}
                      disabled={locked || !active}
                    >
                      {propertyTypes.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.label} · {money(p.acquisition_cost)}/u
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Units
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={listUnits}
                      onChange={(e) => setListUnits(e.target.value)}
                      disabled={locked || !active}
                    />
                  </label>
                  <label>
                    Offer
                    <select
                      value={listOfferMode}
                      onChange={(e) =>
                        setListOfferMode(e.target.value as 'rent' | 'sale' | 'both')
                      }
                      disabled={locked || !active}
                    >
                      <option value="rent">Rent</option>
                      <option value="sale">Sale</option>
                      <option value="both">Both</option>
                    </select>
                  </label>
                  {listOfferMode !== 'sale' && (
                    <label>
                      Rent/wk
                      <input
                        type="number"
                        min={0}
                        value={listRent}
                        onChange={(e) => setListRent(e.target.value)}
                        disabled={locked || !active}
                      />
                    </label>
                  )}
                  {listOfferMode !== 'rent' && (
                    <label>
                      Sale
                      <input
                        type="number"
                        min={0}
                        value={listBuy}
                        onChange={(e) => setListBuy(e.target.value)}
                        disabled={locked || !active}
                      />
                    </label>
                  )}
                  <label className="span-2">
                    Title
                    <input
                      value={listTitle}
                      onChange={(e) => setListTitle(e.target.value)}
                      placeholder="Optional"
                      disabled={locked || !active}
                    />
                  </label>
                  <label className="span-2">
                    Notes
                    <input
                      value={listDesc}
                      onChange={(e) => setListDesc(e.target.value)}
                      placeholder="Optional description"
                      disabled={locked || !active}
                    />
                  </label>
                  <div className="biz-stock-submit">
                    <span className="muted sm">
                      Cost <strong className="cash">{money(acquisitionPreview)}</strong>
                    </span>
                    <button
                      type="submit"
                      className="btn primary sm"
                      disabled={
                        locked ||
                        !active ||
                        createListingMut.isPending ||
                        !selectedPropertyType ||
                        acquisitionPreview > business.cash_balance
                      }
                    >
                      {createListingMut.isPending ? 'Acquiring…' : 'Acquire & list'}
                    </button>
                  </div>
                </form>

                <div className="biz-table-wrap">
                  <table className="biz-table">
                    <thead>
                      <tr>
                        <th>Listing</th>
                        <th>Mode</th>
                        <th>Units</th>
                        <th>Rent</th>
                        <th>Sale</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {!listingsQ.data?.length && (
                        <tr>
                          <td colSpan={6} className="muted">
                            No property stock yet.
                          </td>
                        </tr>
                      )}
                      {listingsQ.data?.map((l) => (
                        <tr key={l.id}>
                          <td>
                            <strong>{l.title}</strong>
                            <div className="muted sm">
                              {l.property_type_slug || l.kind}
                              {l.is_available === false ? ' · closed' : ''}
                            </div>
                          </td>
                          <td>{l.offer_mode ?? 'both'}</td>
                          <td>
                            {l.units_available ?? '∞'}/{l.units_total ?? '∞'}
                          </td>
                          <td className="cash">
                            {(l.offer_mode ?? 'both') !== 'sale' ? money(l.weekly_rent) : '—'}
                          </td>
                          <td>
                            {l.buy_price != null && (l.offer_mode ?? 'both') !== 'rent'
                              ? money(l.buy_price)
                              : '—'}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn sm"
                              disabled={locked || toggleListingMut.isPending}
                              onClick={() => toggleListingMut.mutate(l)}
                            >
                              {l.is_available === false ? 'Open' : 'Close'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : (
              <section className="biz-dash-pane">
                <h2>Stock desk</h2>
                <p className="muted">
                  Product inventory for {sectorLabel(business.sector)} is not online yet. Real-estate
                  companies use this desk to acquire and list property stock.
                </p>
              </section>
            ))}
        </div>
      </div>
    </div>
  );
}
