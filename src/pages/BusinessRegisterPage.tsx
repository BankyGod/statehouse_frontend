import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2 } from 'lucide-react';
import { businessesApi, statesApi } from '../api/endpoints';
import { ErrorNotice } from '../components/ErrorNotice';
import { LockBanner } from '../components/LockBanner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FALLBACK_BUSINESS_CATALOG, groupSectors } from '../lib/businessCatalog';
import { money } from '../lib/format';

export function BusinessRegisterPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const locked =
    !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [name, setName] = useState('');
  const [sector, setSector] = useState('retail');
  const [entityType, setEntityType] = useState('sole_trader');
  const [startingCapital, setStartingCapital] = useState('0');
  const [acknowledged, setAcknowledged] = useState(false);
  const [stateId, setStateId] = useState<number | ''>(character?.home_state_id ?? '');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  const statesQ = useQuery({
    queryKey: ['states'],
    queryFn: () => statesApi.list(),
  });

  const catalogQ = useQuery({
    queryKey: ['businesses', 'catalog'],
    queryFn: () => businessesApi.catalog(),
    staleTime: 60_000,
  });

  const catalog = catalogQ.data ?? FALLBACK_BUSINESS_CATALOG;
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
      await qc.invalidateQueries({ queryKey: ['businesses'] });
      void refreshCharacter();
      navigate(`/business/${b.id}`);
    },
    onError: (err) => toast.pushError(err),
  });

  return (
    <div className="play-page">
      <header className="page-header compact">
        <p className="biz-crumb">
          <Link to="/business">Business</Link>
          <span aria-hidden> / </span>
          Register
        </p>
        <h1>
          <Building2 size={22} aria-hidden /> Register a company
        </h1>
        <p className="lede">
          Choose sector and entity type, seed the treasury, and wait out registration.
        </p>
      </header>

      <LockBanner />

      <p>
        <Link to="/business" className="btn ghost sm">
          <ArrowLeft size={14} aria-hidden /> Back
        </Link>
      </p>

      <section className="panel">
        <h2>Company details</h2>
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
              <strong>{previewQ.data?.state_name ?? 'the selected state'}</strong> as a{' '}
              <strong>{entityType.replaceAll('_', ' ')}</strong>.
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
    </div>
  );
}
