import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { businessesApi, statesApi } from '../api/endpoints';
import { ErrorNotice } from '../components/ErrorNotice';
import { LockBanner } from '../components/LockBanner';
import { Timer } from '../components/Timer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import type { Business, EmployeeRole } from '../types/api';

const ROLES: EmployeeRole[] = ['labourer', 'clerk', 'specialist', 'manager', 'executive'];

export function BusinessPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked = !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [name, setName] = useState('');
  const [sector, setSector] = useState('trade');
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
        sector: sector.trim(),
        state_id: Number(stateId),
        local_address: address.trim(),
        description: description.trim() || null,
      }),
    onSuccess: async (b) => {
      toast.push(`Registered ${b.name} (${b.status}).`, 'ok');
      setName('');
      setAddress('');
      setDescription('');
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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (stateId === '') {
      toast.push('Pick a state.', 'err');
      return;
    }
    createMut.mutate();
  }

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
        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} minLength={2} required />
          </label>
          <label>
            Sector
            <input value={sector} onChange={(e) => setSector(e.target.value)} minLength={2} required />
          </label>
          <label>
            State
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
            Description <span className="muted">(optional)</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </label>
          <button type="submit" className="btn primary" disabled={locked || createMut.isPending}>
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
          {b.sector} · {stateLabel} · {b.local_address}
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
