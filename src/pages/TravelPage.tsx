import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bus, MapPin, Plane, Route, TrainFront } from 'lucide-react';
import { statesApi, travelApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import { Timer } from '../components/Timer';
import { ConfirmModal } from '../components/ConfirmModal';
import { TravelTicket } from '../components/TravelTicket';
import type { TravelOption } from '../types/api';
import { getStateTheme } from '../lib/stateArt';

function ModeIcon({ mode }: { mode: string }) {
  if (mode === 'rail') return <TrainFront size={16} aria-hidden />;
  if (mode === 'bus') return <Bus size={16} aria-hidden />;
  return <Plane size={16} aria-hidden />;
}

export function TravelPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const jailed = !!character?.is_jailed || !!character?.is_hospitalized;
  const traveling = !!character?.is_traveling;

  const [toStateId, setToStateId] = useState<number | ''>('');
  const [selected, setSelected] = useState<TravelOption | null>(null);
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

  const optionsQ = useQuery({
    queryKey: ['travel', 'options', toStateId],
    queryFn: () => travelApi.options(toStateId as number),
    enabled: typeof toStateId === 'number' && !traveling && !jailed,
  });

  const currentName =
    statesQ.data?.find((s) => s.id === character?.current_state_id)?.name ??
    `State #${character?.current_state_id ?? '—'}`;

  const startMut = useMutation({
    mutationFn: () =>
      travelApi.start(selected!.to_state_id, selected!.carrier_id),
    onSuccess: async (res) => {
      const msg =
        typeof res.message === 'string'
          ? res.message
          : `Departing via ${res.carrier_name ?? 'carrier'}${
              res.cost != null ? ` · ${money(Number(res.cost))}` : ''
            }.`;
      toast.push(msg, 'ok');
      setConfirmOpen(false);
      setSelected(null);
      await qc.invalidateQueries({ queryKey: ['character'] });
      void refreshCharacter();
    },
    onError: (err) => toast.pushError(err),
  });

  const destinations =
    statesQ.data?.filter((s) => s.id !== character?.current_state_id && s.is_open) ?? [];

  const destName =
    destinations.find((s) => s.id === toStateId)?.name ??
    selected?.to_state_name ??
    '';

  const pay = selected
    ? selected.discounted_cost != null
      ? selected.discounted_cost
      : selected.cost
    : null;

  return (
    <div>
      <header className="page-header">
        <h1>
          <Plane size={26} aria-hidden /> Travel
        </h1>
        <p className="lede">
          Pick a destination, then choose an airline, rail line, or coach — prices and times
          differ. Travel permits discount bus/rail more than air.
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
          <MapPin size={18} aria-hidden /> Destination
        </h2>
        <p className="muted" style={{ marginBottom: '0.75rem' }}>
          You are in <strong>{currentName}</strong>
        </p>
        <label>
          Go to
          <select
            value={toStateId}
            onChange={(e) => {
              setToStateId(e.target.value ? Number(e.target.value) : '');
              setSelected(null);
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
      </section>

      {typeof toStateId === 'number' && !traveling && (
        <section>
          <h2>Carriers to {destName}</h2>
          {optionsQ.isLoading && <p>Loading options…</p>}
          {optionsQ.isError && (
            <p className="muted">Could not load carriers. Try again.</p>
          )}
          <div className="list-table">
            {optionsQ.data?.map((opt) => {
              const fare =
                opt.discounted_cost != null ? opt.discounted_cost : opt.cost;
              const active = selected?.carrier_id === opt.carrier_id;
              return (
                <button
                  type="button"
                  key={opt.carrier_id}
                  className={`list-row selectable ${active ? 'selected' : ''}`}
                  disabled={jailed}
                  onClick={() => setSelected(opt)}
                >
                  <div>
                    <strong>
                      <ModeIcon mode={opt.mode} /> {opt.carrier_name}{' '}
                      <span className={`badge ${opt.ownership === 'government' ? 'active' : ''}`}>
                        {opt.ownership === 'government' ? 'Gov' : 'Private'}
                      </span>
                      <span className="badge">{opt.mode}</span>
                    </strong>
                    <p className="muted">{opt.tagline}</p>
                    <p className="muted">
                      Comfort {opt.comfort}/5 · Reliability {opt.reliability}/5
                    </p>
                  </div>
                  <div className="list-meta">
                    <span className="cash">{money(fare)}</span>
                    {opt.discounted_cost != null &&
                      opt.discounted_cost !== opt.cost && (
                        <span className="muted">list {money(opt.cost)}</span>
                      )}
                    <span>{opt.minutes} min</span>
                  </div>
                </button>
              );
            })}
          </div>
          {selected && (
            <div className="travel-booking">
              <TravelTicket
                option={selected}
                fromName={currentName}
                toName={destName || selected.to_state_name}
                passengerName={character?.display_name}
              />
              <button
                type="button"
                className="btn primary"
                disabled={jailed || traveling || startMut.isPending}
                onClick={() => setConfirmOpen(true)}
              >
                Book & depart · {money(pay ?? selected.cost)}
              </button>
            </div>
          )}
        </section>
      )}

      <ConfirmModal
        open={confirmOpen}
        title={
          selected?.mode === 'rail'
            ? 'Confirm rail ticket'
            : selected?.mode === 'bus'
              ? 'Confirm coach ticket'
              : 'Confirm boarding pass'
        }
        confirmLabel="Depart now"
        wide
        busy={startMut.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => startMut.mutate()}
      >
        {selected && (
          <>
            <TravelTicket
              option={selected}
              fromName={currentName}
              toName={destName || selected.to_state_name}
              passengerName={character?.display_name}
            />
            <p className="travel-ticket-note">
              Fare is taken when you depart. You cannot act until you arrive (
              {selected.minutes} min).
            </p>
          </>
        )}
      </ConfirmModal>
    </div>
  );
}
