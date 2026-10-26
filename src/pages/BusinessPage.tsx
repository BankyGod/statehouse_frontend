import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { businessesApi, statesApi } from '../api/endpoints';
import { ErrorNotice } from '../components/ErrorNotice';
import { LockBanner } from '../components/LockBanner';
import { Timer } from '../components/Timer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import type {
  Business,
  BusinessCatalog,
  BusinessSectorOption,
  EmployeeRole,
} from '../types/api';

const ROLES: EmployeeRole[] = ['labourer', 'clerk', 'specialist', 'manager', 'executive'];

/** Mirrors BE `SECTOR_CATALOG` / `ENTITY_TYPE_CATALOG` so selects are never empty. */
const FALLBACK_CATALOG: BusinessCatalog = {
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

function groupSectors(sectors: BusinessSectorOption[]) {
  const groups: { group: string; items: BusinessSectorOption[] }[] = [];
  for (const s of sectors) {
    const last = groups[groups.length - 1];
    if (last && last.group === s.group) last.items.push(s);
    else groups.push({ group: s.group, items: [s] });
  }
  return groups;
}

export function BusinessPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked = !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [name, setName] = useState('');
  const [sector, setSector] = useState('retail');
  const [entityType, setEntityType] = useState('sole_trader');
  const [startingCapital, setStartingCapital] = useState('0');
  const [acknowledged, setAcknowledged] = useState(false);
  const [stateId, setStateId] = useState<number | ''>(character?.home_state_id ?? '');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cashAmt, setCashAmt] = useState('25');
  const [npcRole, setNpcRole] = useState<EmployeeRole>('labourer');
  const [npcName, setNpcName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerRole, setPlayerRole] = useState<EmployeeRole>('clerk');

  const statesQ = useQuery({
    queryKey: ['states'],
    queryFn: () => statesApi.list(),
  });

  const catalogQ = useQuery({
    queryKey: ['businesses', 'catalog'],
    queryFn: () => businessesApi.catalog(),
    staleTime: 60_000,
  });

  const catalog = catalogQ.data ?? FALLBACK_CATALOG;
  const sectorGroups = groupSectors(catalog.sectors);
  const entityBlurb = catalog.entity_types.find((t) => t.value === entityType)?.blurb;

  const capitalNum = Number(startingCapital) || 0;

  const previewQ = useQuery({
    queryKey: ['businesses', 'preview', stateId, entityType, capitalNum],
    queryFn: () =>
      businessesApi.preview({
        state_id: Number(stateId),
        entity_type: entityType,
        starting_capital: capitalNum,
      }),
    enabled: typeof stateId === 'number' && stateId > 0,
  });

  const meQ = useQuery({
    queryKey: ['businesses', 'me'],
    queryFn: () => businessesApi.me(),
    refetchInterval: 30_000,
  });

  const selected = meQ.data?.find((b) => b.id === selectedId) ?? meQ.data?.[0] ?? null;

  const empQ = useQuery({
    queryKey: ['businesses', selected?.id, 'employees'],
    queryFn: () => businessesApi.employees(selected!.id),
    enabled: !!selected,
  });

  const createMut = useMutation({
    mutationFn: () =>
      businessesApi.create({
        name: name.trim(),
        sector,
        entity_type: entityType,
        starting_capital: capitalNum,
        state_id: Number(stateId),
        local_address: address.trim(),
        description: description.trim() || null,
      }),
    onSuccess: async (b) => {
      toast.push(`Registered ${b.name} (${b.status}).`, 'ok');
      setName('');
      setAddress('');
      setDescription('');
      setStartingCapital('0');
      setAcknowledged(false);
      setSelectedId(b.id);
      await qc.invalidateQueries({ queryKey: ['businesses'] });
      void refreshCharacter();
    },
    onError: (err) => toast.pushError(err),
  });

  const depositMut = useMutation({
    mutationFn: (amount: number) => businessesApi.deposit(selected!.id, amount),
    onSuccess: async (res) => {
      toast.push(`Deposited ${money(res.deposited)}. Treasury ${money(res.business_cash)}.`, 'ok');
      await qc.invalidateQueries({ queryKey: ['businesses'] });
      void refreshCharacter();
    },
    onError: (err) => toast.pushError(err),
  });

  const withdrawMut = useMutation({
    mutationFn: (amount: number) => businessesApi.withdraw(selected!.id, amount),
    onSuccess: async () => {
      toast.push('Withdrew from treasury.', 'ok');
      await qc.invalidateQueries({ queryKey: ['businesses'] });
      void refreshCharacter();
    },
    onError: (err) => toast.pushError(err),
  });

  const hireNpcMut = useMutation({
    mutationFn: () =>
      businessesApi.hireNpc(selected!.id, {
        role: npcRole,
        display_name: npcName.trim() || null,
      }),
    onSuccess: async (e) => {
      toast.push(`Hired NPC ${e.display_name}.`, 'ok');
      setNpcName('');
      await qc.invalidateQueries({ queryKey: ['businesses'] });
    },
    onError: (err) => toast.pushError(err),
  });

  const hirePlayerMut = useMutation({
    mutationFn: () =>
      businessesApi.hirePlayer(selected!.id, {
        display_name: playerName.trim(),
        role: playerRole,
      }),
    onSuccess: async (e) => {
      toast.push(`Hired ${e.display_name}.`, 'ok');
      setPlayerName('');
      await qc.invalidateQueries({ queryKey: ['businesses'] });
    },
    onError: (err) => toast.pushError(err),
  });

  const fireMut = useMutation({
    mutationFn: (employee_id: number) => businessesApi.fire(selected!.id, employee_id),
    onSuccess: async () => {
      toast.push('Employee fired.', 'ok');
      await qc.invalidateQueries({ queryKey: ['businesses'] });
    },
    onError: (err) => toast.pushError(err),
  });

  function parseAmt(): number | null {
    const n = Number(cashAmt);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }

  const stateName = (id: number) => statesQ.data?.find((s) => s.id === id)?.name ?? `#${id}`;

  return (
    <div className="play-page">
      <header className="page-header compact">
        <h1>
          <Building2 size={22} aria-hidden /> Business
        </h1>
        <p className="lede">
          Register, fund the treasury, and hire staff once the company is active.
        </p>
      </header>

      <LockBanner />

      <section className="panel">
        <h2>Register</h2>
        {catalogQ.isError && <ErrorNotice error={catalogQ.error} />}
        {statesQ.isError && <ErrorNotice error={statesQ.error} />}
        <form
          className="stack-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!acknowledged) {
              toast.push('Confirm you understand the registration terms.', 'err');
              return;
            }
            if (previewQ.data && !previewQ.data.permit_ok) {
              toast.push('Get a business permit for that state first.', 'err');
              return;
            }
            createMut.mutate();
          }}
        >
          <label>
            Business name
            <input value={name} onChange={(e) => setName(e.target.value)} minLength={2} required />
          </label>
          <label>
            Sector
            <select value={sector} onChange={(e) => setSector(e.target.value)} required>
              {sectorGroups.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label>
            Business type
            <select value={entityType} onChange={(e) => setEntityType(e.target.value)} required>
              {catalog.entity_types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label} · fee {money(t.registration_fee)}
                </option>
              ))}
            </select>
          </label>
          {entityBlurb && <p className="muted">{entityBlurb}</p>}
          <label>
            State of registration
            <select
              value={stateId}
              onChange={(e) => setStateId(e.target.value ? Number(e.target.value) : '')}
              required
            >
              <option value="">Select…</option>
              {statesQ.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.id === character?.home_state_id ? ' (home)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Local address
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              minLength={5}
              required
            />
          </label>
          <label>
            Starting capital
            <input
              type="number"
              min={catalog.min_starting_capital}
              max={catalog.max_starting_capital}
              step={1}
              value={startingCapital}
              onChange={(e) => setStartingCapital(e.target.value)}
            />
          </label>
          <p className="muted">Seeded into the company treasury (paid from your cash with the fee).</p>
          <label>
            Description <span className="muted">(optional)</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </label>

          {previewQ.data && (
            <div className="quote-box">
              <ul className="kv">
                <li>
                  <span>State</span>
                  <strong>{previewQ.data.state_name}</strong>
                </li>
                <li>
                  <span>Registration fee</span>
                  <strong className="cash">{money(previewQ.data.registration_fee)}</strong>
                </li>
                <li>
                  <span>Starting capital</span>
                  <strong className="cash">{money(previewQ.data.starting_capital)}</strong>
                </li>
                <li>
                  <span>Total due</span>
                  <strong className="cash">{money(previewQ.data.total_due)}</strong>
                </li>
                <li>
                  <span>Active in</span>
                  <strong>~{previewQ.data.registration_hours} hours</strong>
                </li>
                <li>
                  <span>Your cash</span>
                  <strong className="cash">{money(previewQ.data.cash_on_hand)}</strong>
                </li>
              </ul>
              {previewQ.data.permit_required && (
                <p className={previewQ.data.permit_ok ? 'muted' : 'warn'}>
                  {previewQ.data.permit_ok
                    ? 'Business permit for this state: OK'
                    : 'Business permit required for this non-home state — apply under Permits first.'}
                </p>
              )}
              {!previewQ.data.can_afford && (
                <p className="warn">Not enough cash for fee + capital.</p>
              )}
            </div>
          )}

          <label className="check-row">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            <span>
              I understand this company will be registered in{' '}
              <strong>
                {previewQ.data?.state_name ?? 'the selected state'}
              </strong>{' '}
              as a <strong>{entityType.replaceAll('_', ' ')}</strong>.
            </span>
          </label>

          <button
            type="submit"
            className="btn primary"
            disabled={
              locked ||
              createMut.isPending ||
              !acknowledged ||
              (previewQ.data != null && (!previewQ.data.can_afford || !previewQ.data.permit_ok))
            }
          >
            {createMut.isPending ? 'Registering…' : 'Register business'}
          </button>
        </form>
      </section>

      <section className="play-section">
        <h2>My businesses</h2>
        {meQ.isError && <ErrorNotice error={meQ.error} />}
        {!meQ.data?.length && !meQ.isLoading && <p className="muted">None yet.</p>}
        <div className="play-list">
          {meQ.data?.map((b) => (
            <BusinessPick
              key={b.id}
              business={b}
              active={selected?.id === b.id}
              stateLabel={stateName(b.state_id)}
              onSelect={() => setSelectedId(b.id)}
              onTimer={() => {
                void meQ.refetch();
                void refreshCharacter();
              }}
            />
          ))}
        </div>
      </section>

      {selected && (
        <>
          <section className="panel">
            <h2>Treasury · {selected.name}</h2>
            <p className="muted">
              Balance {money(selected.cash_balance)} · status {selected.status}
            </p>
            <div className="inline-form stack-form">
              <label>
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
              <div className="bank-move-actions">
                <button
                  type="button"
                  className="btn primary"
                  disabled={locked || depositMut.isPending}
                  onClick={() => {
                    const n = parseAmt();
                    if (n == null) return toast.push('Enter amount.', 'err');
                    depositMut.mutate(n);
                  }}
                >
                  Deposit
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={locked || withdrawMut.isPending || selected.status !== 'active'}
                  onClick={() => {
                    const n = parseAmt();
                    if (n == null) return toast.push('Enter amount.', 'err');
                    withdrawMut.mutate(n);
                  }}
                >
                  Withdraw
                </button>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>Employees</h2>
            {selected.status !== 'active' && (
              <p className="muted">Hiring unlocks when the business becomes active.</p>
            )}
            <div className="profile-dossier-grid">
              <form
                className="stack-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  hireNpcMut.mutate();
                }}
              >
                <h3>Hire NPC</h3>
                <label>
                  Role
                  <select
                    value={npcRole}
                    onChange={(e) => setNpcRole(e.target.value as EmployeeRole)}
                    disabled={locked || selected.status !== 'active'}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Name <span className="muted">(optional)</span>
                  <input
                    value={npcName}
                    onChange={(e) => setNpcName(e.target.value)}
                    disabled={locked || selected.status !== 'active'}
                  />
                </label>
                <button
                  type="submit"
                  className="btn"
                  disabled={locked || selected.status !== 'active' || hireNpcMut.isPending}
                >
                  Hire NPC
                </button>
              </form>
              <form
                className="stack-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (playerName.trim().length < 3) return toast.push('Enter display name.', 'err');
                  hirePlayerMut.mutate();
                }}
              >
                <h3>Hire player</h3>
                <label>
                  Display name
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    minLength={3}
                    disabled={locked || selected.status !== 'active'}
                  />
                </label>
                <label>
                  Role
                  <select
                    value={playerRole}
                    onChange={(e) => setPlayerRole(e.target.value as EmployeeRole)}
                    disabled={locked || selected.status !== 'active'}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={locked || selected.status !== 'active' || hirePlayerMut.isPending}
                >
                  Hire player
                </button>
              </form>
            </div>
            <div className="play-list" style={{ marginTop: '0.75rem' }}>
              {!empQ.data?.length && <p className="muted">No employees.</p>}
              {empQ.data?.map((e) => (
                <article key={e.id} className="play-row">
                  <div className="play-row-main">
                    <div className="play-row-title">
                      <strong>{e.display_name}</strong>
                      <span className="badge">{e.role}</span>
                      {e.is_npc && <span className="badge">NPC</span>}
                    </div>
                    <div className="play-row-meta">
                      <span>{money(e.wage_per_week)}/wk</span>
                      <span className="muted sm">
                        hired {new Date(e.hired_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn danger sm"
                    disabled={locked || fireMut.isPending}
                    onClick={() => fireMut.mutate(e.id)}
                  >
                    Fire
                  </button>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function BusinessPick({
  business: b,
  active,
  stateLabel,
  onSelect,
  onTimer,
}: {
  business: Business;
  active: boolean;
  stateLabel: string;
  onSelect: () => void;
  onTimer: () => void;
}) {
  return (
    <article className={`play-row ${active ? 'current' : ''}`}>
      <button type="button" className="play-row-main stock-row-select" onClick={onSelect}>
        <div className="play-row-title">
          <strong>{b.name}</strong>
          <span className={`badge ${b.status}`}>{b.status}</span>
        </div>
        <p className="muted play-row-desc">
          {b.sector.replaceAll('_', ' ')}
          {b.entity_type ? ` · ${b.entity_type.replaceAll('_', ' ')}` : ''} · {stateLabel} ·{' '}
          {b.local_address}
        </p>
        <div className="play-row-meta">
          <span className="cash">{money(b.cash_balance)}</span>
          {b.employee_count != null && <span>{b.employee_count} staff</span>}
          {b.status === 'pending' && b.registration_completes_at ? (
            <Timer completesAt={b.registration_completes_at} onComplete={onTimer} />
          ) : (
            <span>Active</span>
          )}
        </div>
      </button>
    </article>
  );
}
