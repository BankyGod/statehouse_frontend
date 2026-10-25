import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Home, KeyRound, LogOut, ShoppingCart, Zap } from 'lucide-react';
import { housingApi, statesApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { getErrorDetail } from '../api/client';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import { Timer } from '../components/Timer';
import { ConfirmModal } from '../components/ConfirmModal';
import type { HousingListing } from '../types/api';

export function HousingPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked = !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [stateFilter, setStateFilter] = useState<number | ''>(
    character?.current_state_id ?? '',
  );
  const [rentTarget, setRentTarget] = useState<HousingListing | null>(null);
  const [buyTarget, setBuyTarget] = useState<HousingListing | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);

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
    queryKey: ['housing', 'listings', stateFilter],
    queryFn: () =>
      housingApi.listings(stateFilter === '' ? undefined : Number(stateFilter)),
  });

  const stateName = (id: number) =>
    statesQ.data?.find((s) => s.id === id)?.name ?? `#${id}`;

  async function afterHousing() {
    await qc.invalidateQueries({ queryKey: ['housing'] });
    await refreshCharacter();
  }

  const rentMut = useMutation({
    mutationFn: (listing_id: number) => housingApi.rent(listing_id),
    onSuccess: async (res) => {
      toast.push(`Rented listing #${res.listing_id} (${res.tenure}).`, 'ok');
      setRentTarget(null);
      await afterHousing();
    },
    onError: (err) => toast.push(getErrorDetail(err), 'err'),
  });

  const buyMut = useMutation({
    mutationFn: (listing_id: number) => housingApi.buy(listing_id),
    onSuccess: async (res) => {
      toast.push(`Purchased listing #${res.listing_id}.`, 'ok');
      setBuyTarget(null);
      await afterHousing();
    },
    onError: (err) => toast.push(getErrorDetail(err), 'err'),
  });

  const leaveMut = useMutation({
    mutationFn: () => housingApi.leave(),
    onSuccess: async () => {
      toast.push('You left your residence.', 'ok');
      setLeaveOpen(false);
      await afterHousing();
    },
    onError: (err) => toast.push(getErrorDetail(err), 'err'),
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
          Rent or buy a place. Weekly rent clocks tick. Homeless status shows on your character.
        </p>
      </header>

      {character?.is_homeless && (
        <p className="page-homeless-note">
          You are currently homeless — find a listing to rent or buy.
        </p>
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
              disabled={locked || leaveMut.isPending}
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
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">All / default</option>
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
        {listingsQ.isError && <p className="err-text">{getErrorDetail(listingsQ.error)}</p>}

        <div className="list-table">
          {listingsQ.data?.map((l) => {
            const isMine = residence?.listing_id === l.id;
            const canBuy = l.buy_price != null;
            return (
              <div key={l.id} className="list-row housing-row">
                <div>
                  <strong>{l.title}</strong>
                  <span className="badge">{l.kind}</span>
                  {l.home_state_only && <span className="badge warn">Home state only</span>}
                  <p className="muted">
                    {stateName(l.state_id)} · {l.description}
                  </p>
                </div>
                <div className="list-meta">
                  <span className="cash">{money(l.weekly_rent)}/wk</span>
                  {canBuy && <span>Buy {money(l.buy_price!)}</span>}
                  {l.energy_bonus > 0 && (
                    <span>
                      <Zap size={12} aria-hidden /> +{l.energy_bonus} energy
                    </span>
                  )}
                </div>
                <div className="housing-actions">
                  <button
                    type="button"
                    className="btn primary"
                    disabled={locked || isMine || rentMut.isPending}
                    onClick={() => setRentTarget(l)}
                  >
                    {isMine ? 'Current' : 'Rent'}
                  </button>
                  {canBuy && (
                    <button
                      type="button"
                      className="btn"
                      disabled={locked || isMine || buyMut.isPending}
                      onClick={() => setBuyTarget(l)}
                    >
                      <ShoppingCart size={14} aria-hidden />
                      Buy
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
        <p>You will become homeless until you rent or buy again.</p>
      </ConfirmModal>
    </div>
  );
}
