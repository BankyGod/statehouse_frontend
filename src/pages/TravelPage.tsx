import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plane, Route } from 'lucide-react';
import { statesApi, travelApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { getErrorDetail } from '../api/client';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import { Timer } from '../components/Timer';
import { ConfirmModal } from '../components/ConfirmModal';
import type { TravelQuote } from '../types/api';
import { getStateTheme } from '../lib/stateArt';

export function TravelPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const jailed = !!character?.is_jailed || !!character?.is_hospitalized;
  const traveling = !!character?.is_traveling;

  const [toStateId, setToStateId] = useState<number | ''>('');
  const [quote, setQuote] = useState<TravelQuote | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const statesQ = useQuery({
    queryKey: ['states'],
    queryFn: () => statesApi.list(),
  });

  const destQ = useQuery({
    queryKey: ['state', character?.travel_destination_id],
    queryFn: () => statesApi.get(character!.travel_destination_id!),
    enabled: !!character?.travel_destination_id,
  });

  const currentName =
    statesQ.data?.find((s) => s.id === character?.current_state_id)?.name ??
    `State #${character?.current_state_id ?? '—'}`;

  const quoteMut = useMutation({
    mutationFn: (id: number) => travelApi.quote(id),
    onSuccess: (q) => {
      setQuote(q);
      toast.push('Quote ready.', 'info');
    },
    onError: (err) => {
      setQuote(null);
      toast.push(getErrorDetail(err), 'err');
    },
  });

  const startMut = useMutation({
    mutationFn: (id: number) => travelApi.start(id),
    onSuccess: async (res) => {
      const msg =
        typeof res.message === 'string'
          ? res.message
          : `Travel started${res.cost != null ? ` · ${money(Number(res.cost))}` : ''}.`;
      toast.push(msg, 'ok');
      setConfirmOpen(false);
      setQuote(null);
      await qc.invalidateQueries({ queryKey: ['character'] });
      await refreshCharacter();
    },
    onError: (err) => toast.push(getErrorDetail(err), 'err'),
  });

  const destinations =
    statesQ.data?.filter((s) => s.id !== character?.current_state_id && s.is_open) ?? [];

  const selected = destinations.find((s) => s.id === toStateId);
  const pay = quote
    ? (quote.discounted_cost != null ? quote.discounted_cost : quote.cost)
    : null;

  return (
    <div>
      <header className="page-header">
        <h1>
          <Plane size={26} aria-hidden /> Travel
        </h1>
        <p className="lede">
          Quote a trip, pay the fare, wait out the journey. Out-of-state travel may need a travel
          permit.
        </p>
      </header>

      {traveling && (
        <div className="panel travel-active">
          <h2>
            <Route size={18} aria-hidden /> In transit
          </h2>
          <ul className="kv">
            <li>
              <span>Destination</span>
              <strong>{destQ.data?.name ?? `#${character?.travel_destination_id}`}</strong>
            </li>
            <li>
              <span>Arrives</span>
              <Timer
                completesAt={character?.travel_until}
                onComplete={() => void refreshCharacter()}
              />
            </li>
          </ul>
          <p className="muted">Actions stay locked until you arrive.</p>
        </div>
      )}

      <section className="panel">
        <h2>
          <MapPin size={18} aria-hidden /> Plan trip
        </h2>
        <p className="muted" style={{ marginBottom: '0.75rem' }}>
          You are in <strong>{currentName}</strong>
        </p>
        <div className="inline-form">
          <label>
            Destination
            <select
              value={toStateId}
              onChange={(e) => {
                setToStateId(e.target.value ? Number(e.target.value) : '');
                setQuote(null);
              }}
              disabled={jailed || traveling}
            >
              <option value="">Select state…</option>
              {destinations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({getStateTheme(s.slug).label})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn"
            disabled={jailed || traveling || toStateId === '' || quoteMut.isPending}
            onClick={() => toStateId !== '' && quoteMut.mutate(toStateId)}
          >
            {quoteMut.isPending ? 'Quoting…' : 'Get quote'}
          </button>
        </div>

        {quote && selected && (
          <div className="quote-box">
            <ul className="kv">
              <li>
                <span>To</span>
                <strong>{selected.name}</strong>
              </li>
              <li>
                <span>Fare</span>
                <strong className="cash">
                  {money(pay ?? quote.cost)}
                  {quote.discounted_cost != null && quote.discounted_cost !== quote.cost && (
                    <span className="muted"> (list {money(quote.cost)})</span>
                  )}
                </strong>
              </li>
              <li>
                <span>Travel time</span>
                <strong>{quote.minutes} min</strong>
              </li>
            </ul>
            <button
              type="button"
              className="btn primary"
              disabled={jailed || traveling || startMut.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              Start travel
            </button>
          </div>
        )}
      </section>

      <ConfirmModal
        open={confirmOpen}
        title="Begin travel?"
        confirmLabel="Depart"
        busy={startMut.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => toStateId !== '' && startMut.mutate(toStateId)}
      >
        {selected && quote && (
          <p>
            Travel to <strong>{selected.name}</strong> for{' '}
            <strong className="cash">{money(pay ?? quote.cost)}</strong> · {quote.minutes} minutes
            on the road. You cannot act while traveling.
          </p>
        )}
      </ConfirmModal>
    </div>
  );
}
