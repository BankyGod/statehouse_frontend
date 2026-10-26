import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HandHelping, Home, KeyRound, LogOut, ShoppingCart, Zap } from 'lucide-react';
import { housingApi, statesApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { ErrorNotice } from '../components/ErrorNotice';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import { Timer } from '../components/Timer';
import { ConfirmModal } from '../components/ConfirmModal';
import type { HousingListing } from '../types/api';

export function HousingPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const housingLocked =
    !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [stateFilter, setStateFilter] = useState<number>(
    character?.current_state_id ?? 0,
  );
  const [rentTarget, setRentTarget] = useState<HousingListing | null>(null);
  const [buyTarget, setBuyTarget] = useState<HousingListing | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [assistOpen, setAssistOpen] = useState(false);

  const statesQ = useQuery({
    queryKey: ['states'],
    queryFn: () => statesApi.list(),
  });

  const meQ = useQuery({
    queryKey: ['housing', 'me'],
    queryFn: () => housingApi.me(),
    refetchInterval: 30_000,
  });

  const listingsQ = useQuery({
    queryKey: ['housing', 'listings', stateFilter || character?.current_state_id],
    queryFn: () =>
      housingApi.listings(stateFilter || character?.current_state_id || undefined),
    enabled: !!(stateFilter || character?.current_state_id),
  });

  const stateName = (id: number) =>
    statesQ.data?.find((s) => s.id === id)?.name ?? `#${id}`;

  async function afterHousing() {
    await qc.invalidateQueries({ queryKey: ['housing'] });
    void refreshCharacter();
  }

  const rentMut = useMutation({
    mutationFn: (listing_id: number) => housingApi.rent(listing_id),
    onSuccess: async (res) => {
      toast.push(`Rented listing #${res.listing_id} (${res.tenure}).`, 'ok');
      setRentTarget(null);
      await afterHousing();
    },
    onError: (err) => toast.pushError(err),
  });

  const buyMut = useMutation({
    mutationFn: (listing_id: number) => housingApi.buy(listing_id),
    onSuccess: async (res) => {
      toast.push(`Purchased listing #${res.listing_id}.`, 'ok');
      setBuyTarget(null);
      await afterHousing();
    },
    onError: (err) => toast.pushError(err),
  });

  const leaveMut = useMutation({
    mutationFn: () => housingApi.leave(),
    onSuccess: async () => {
      toast.push('You left your residence.', 'ok');
      setLeaveOpen(false);
      await afterHousing();
    },
    onError: (err) => toast.pushError(err),
  });

  const assistMut = useMutation({
    mutationFn: () => housingApi.assist(rentTarget?.id ?? null),
    onSuccess: async (res) => {
      toast.push(res.message || `Housed at ${res.listing_title}.`, 'ok');
      if (res.loan_funded > 0) {
        toast.push(`Welfare loan funded ${money(res.loan_funded)}.`, 'ok');
      }
      setAssistOpen(false);
      setRentTarget(null);
      await afterHousing();
    },
    onError: (err) => toast.pushError(err),
  });

  const residence = meQ.data;
  const currentListing = listingsQ.data?.find((l) => l.id === residence?.listing_id);

  return (
    <div>
      <header className="page-header">
        <h1>
          <Home size={26} aria-hidden /> Housing
        </h1>
        <p className="lede">
          Browse homes by state. You must be physically in that state to rent or buy. Rent goes to
          the treasury or a private landlord — homeless blocks most play until you are housed.
        </p>
      </header>

      {character?.is_homeless && (
        <section className="panel warn-panel">
          <p className="page-homeless-note" style={{ margin: 0 }}>
            You are homeless — most actions are blocked. Rent, buy, or ask for government assistance.
          </p>
          <button
            type="button"
            className="btn primary"
            style={{ marginTop: '0.65rem' }}
            disabled={housingLocked || assistMut.isPending}
            onClick={() => {
              setRentTarget(null);
              setAssistOpen(true);
            }}
          >
            <HandHelping size={15} aria-hidden />
            Request housing assistance
          </button>
        </section>
      )}

      <section className="panel">
        <h2>
          <KeyRound size={18} aria-hidden /> My residence
        </h2>
        {meQ.isLoading && <p className="muted">Loading…</p>}
        {!meQ.isLoading && !residence && (
          <p className="muted">No active residence.</p>
        )}
        {residence && (
          <div className="row-between">
            <ul className="kv" style={{ flex: 1 }}>
              <li>
                <span>Place</span>
                <strong>{currentListing?.title ?? `Listing #${residence.listing_id}`}</strong>
              </li>
              <li>
                <span>State</span>
                <strong>{stateName(residence.state_id)}</strong>
              </li>
              <li>
                <span>Tenure</span>
                <strong>
                  {residence.tenure} · <span className="badge">{residence.status}</span>
                </strong>
              </li>
              <li>
                <span>Weekly rent</span>
                <strong className="cash">{money(residence.weekly_rent)}</strong>
              </li>
              <li>
                <span>Rent due</span>
                {residence.rent_due_at ? (
                  <Timer completesAt={residence.rent_due_at} onComplete={() => void meQ.refetch()} />
                ) : (
                  <strong>—</strong>
                )}
              </li>
              <li>
                <span>Missed payments</span>
                <strong>{residence.missed_payments}</strong>
              </li>
            </ul>
            <button
              type="button"
              className="btn danger"
              disabled={housingLocked || leaveMut.isPending}
              onClick={() => setLeaveOpen(true)}
            >
              <LogOut size={15} aria-hidden />
              Leave
            </button>
          </div>
        )}
      </section>

      <section>
        <div className="row-between" style={{ marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>Listings</h2>
          <label className="inline-label">
            State
            <select
              value={stateFilter || character?.current_state_id || ''}
              onChange={(e) => setStateFilter(Number(e.target.value))}
            >
              {statesQ.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.id === character?.current_state_id ? ' (here)' : ''}
                  {s.id === character?.home_state_id ? ' (home)' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        {listingsQ.isLoading && <p>Loading listings…</p>}
        {listingsQ.isError && <ErrorNotice error={listingsQ.error} />}

        <div className="list-table">
          {listingsQ.data?.map((l) => {
            const isMine = residence?.listing_id === l.id;
            const canBuy = l.buy_price != null;
            const landlord =
              l.ownership === 'private'
                ? 'Private landlord'
                : l.ownership === 'government'
                  ? 'Government'
                  : null;
            return (
              <div key={l.id} className="list-row housing-row">
                <div>
                  <strong>{l.title}</strong>
                  <span className="badge">{l.kind}</span>
                  {l.offer_mode && l.offer_mode !== 'both' && (
                    <span className="badge">{l.offer_mode} only</span>
                  )}
                  {landlord && (
                    <span className={`badge ${l.ownership === 'government' ? 'active' : ''}`}>
                      {landlord}
                    </span>
                  )}
                  {l.home_state_only && <span className="badge warn">Home state only</span>}
                  <p className="muted">
                    {stateName(l.state_id)} · {l.description}
                  </p>
                </div>
                <div className="list-meta">
                  {(l.offer_mode ?? 'both') !== 'sale' && (
                    <span className="cash">{money(l.weekly_rent)}/wk</span>
                  )}
                  {canBuy && (l.offer_mode ?? 'both') !== 'rent' && (
                    <span>Buy {money(l.buy_price!)}</span>
                  )}
                  {l.units_available != null && (
                    <span>
                      {l.units_available}/{l.units_total ?? l.units_available} left
                    </span>
                  )}
                  {l.energy_bonus > 0 && (
                    <span>
                      <Zap size={12} aria-hidden /> +{l.energy_bonus} energy
                    </span>
                  )}
                  {(l.happiness_bonus ?? 0) > 0 && (
                    <span>+{l.happiness_bonus} happy</span>
                  )}
                </div>
                <div className="housing-actions">
                  {(l.offer_mode ?? 'both') !== 'sale' && (
                    <button
                      type="button"
                      className="btn primary"
                      disabled={housingLocked || isMine || rentMut.isPending}
                      onClick={() => setRentTarget(l)}
                    >
                      {isMine ? 'Current' : 'Rent'}
                    </button>
                  )}
                  {canBuy && (l.offer_mode ?? 'both') !== 'rent' && (
                    <button
                      type="button"
                      className="btn"
                      disabled={housingLocked || isMine || buyMut.isPending}
                      onClick={() => setBuyTarget(l)}
                    >
                      <ShoppingCart size={14} aria-hidden />
                      Buy
                    </button>
                  )}
                  {!!character?.is_homeless && (
                    <button
                      type="button"
                      className="btn"
                      disabled={housingLocked || assistMut.isPending}
                      onClick={() => {
                        setRentTarget(l);
                        setAssistOpen(true);
                      }}
                    >
                      Assist
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <ConfirmModal
        open={!!rentTarget}
        title="Rent this place?"
        confirmLabel="Rent"
        busy={rentMut.isPending}
        onCancel={() => setRentTarget(null)}
        onConfirm={() => rentTarget && rentMut.mutate(rentTarget.id)}
      >
        {rentTarget && (
          <p>
            <strong>{rentTarget.title}</strong> — {money(rentTarget.weekly_rent)} per week
            {rentTarget.energy_bonus > 0 ? ` · +${rentTarget.energy_bonus} energy` : ''}.
          </p>
        )}
      </ConfirmModal>

      <ConfirmModal
        open={!!buyTarget}
        title="Buy this property?"
        confirmLabel="Buy"
        busy={buyMut.isPending}
        onCancel={() => setBuyTarget(null)}
        onConfirm={() => buyTarget && buyMut.mutate(buyTarget.id)}
      >
        {buyTarget && (
          <p>
            Pay <strong className="cash">{money(buyTarget.buy_price ?? 0)}</strong> for{' '}
            <strong>{buyTarget.title}</strong>.
          </p>
        )}
      </ConfirmModal>

      <ConfirmModal
        open={leaveOpen}
        title="Leave residence?"
        confirmLabel="Leave"
        danger
        busy={leaveMut.isPending}
        onCancel={() => setLeaveOpen(false)}
        onConfirm={() => leaveMut.mutate()}
      >
        <p>You will become homeless until you rent or buy again. Most actions stay locked while homeless.</p>
      </ConfirmModal>

      <ConfirmModal
        open={assistOpen}
        title="Request housing assistance?"
        confirmLabel="Request help"
        busy={assistMut.isPending}
        onCancel={() => {
          setAssistOpen(false);
          setRentTarget(null);
        }}
        onConfirm={() => assistMut.mutate()}
      >
        <p>
          Government housing assistance places you in
          {rentTarget ? (
            <>
              {' '}
              <strong>{rentTarget.title}</strong>
            </>
          ) : (
            ' the cheapest available shelter here'
          )}
          . If you cannot afford the move-in cost, a welfare loan may be funded and repaid from future
          wages.
        </p>
      </ConfirmModal>
    </div>
  );
}
