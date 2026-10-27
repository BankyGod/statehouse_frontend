import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertOctagon, Flame, Gavel, Skull, Zap } from 'lucide-react';
import { crimeApi, jailApi, statesApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { ErrorNotice } from '../components/ErrorNotice';
import { HubBack } from '../components/SysHub';
import { useToast } from '../context/ToastContext';
import { money, pct } from '../lib/format';
import { ConfirmModal } from '../components/ConfirmModal';
import { LockBanner } from '../components/LockBanner';
import { useState } from 'react';
import type { CrimeCatalogItem } from '../types/api';

export function CrimePage() {
  const { character, refreshCharacter, patchCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked = !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;
  const [target, setTarget] = useState<CrimeCatalogItem | null>(null);

  const catalogQ = useQuery({
    queryKey: ['crime', 'catalog'],
    queryFn: () => crimeApi.catalog(),
  });

  const historyQ = useQuery({
    queryKey: ['crime', 'history'],
    queryFn: () => crimeApi.history(),
  });

  const jailQ = useQuery({
    queryKey: ['jail', 'me'],
    queryFn: () => jailApi.me(),
    enabled: !!character?.is_jailed,
  });

  const stateQ = useQuery({
    queryKey: ['state', character?.current_state_id],
    queryFn: () => statesApi.get(character!.current_state_id),
    enabled: !!character,
  });

  const commitMut = useMutation({
    mutationFn: (crime_type: CrimeCatalogItem['crime_type']) => crimeApi.commit(crime_type),
    onSuccess: (res) => {
      patchCharacter({
        cash: res.character_cash,
        heat: res.character_heat,
        is_jailed: res.is_jailed,
        ...(res.health != null ? { health: res.health } : {}),
        ...(res.is_hospitalized != null ? { is_hospitalized: res.is_hospitalized } : {}),
        ...(res.nerve != null ? { nerve: res.nerve } : {}),
      });
      toast.push(res.message, res.caught ? 'err' : 'ok');
      setTarget(null);
      void qc.invalidateQueries({ queryKey: ['crime'] });
      void qc.invalidateQueries({ queryKey: ['jail'] });
      void refreshCharacter();
    },
    onError: (err) => toast.pushError(err),
  });

  const energy = character?.energy ?? 0;
  const heat = character?.heat ?? 0;
  const nerve = character?.nerve ?? 0;

  return (
    <div className="play-page">
      <HubBack to="/crime" label="Crime" />
      <header className="page-header compact">
        <h1>
          <Skull size={22} aria-hidden /> Streets
        </h1>
      </header>

      <LockBanner />

      {character?.is_jailed && (
        <p className="play-lock jail">
          <Gavel size={14} aria-hidden /> In jail
          {jailQ.data ? ` · bail ${money(jailQ.data.bail_cost)}` : ''}.{' '}
          <Link to="/jail">Open jail desk</Link>
        </p>
      )}

      <ul className="play-stat-strip">
        <li>
          <Zap size={13} aria-hidden />
          <div>
            <em>Energy</em>
            <strong>
              {energy}/{character?.max_energy ?? '—'}
            </strong>
          </div>
        </li>
        <li>
          <Flame size={13} aria-hidden />
          <div>
            <em>Heat</em>
            <strong className={heat > 20 ? 'warn-text' : undefined}>{Number(heat).toFixed(1)}</strong>
          </div>
        </li>
        <li>
          <AlertOctagon size={13} aria-hidden />
          <div>
            <em>Nerve</em>
            <strong>
              {nerve}/{character?.max_nerve ?? '—'}
            </strong>
          </div>
        </li>
        <li>
          <AlertOctagon size={13} aria-hidden />
          <div>
            <em>State catch</em>
            <strong>{stateQ.data ? pct(stateQ.data.crime_catch_rate) : '…'}</strong>
          </div>
        </li>
      </ul>

      {catalogQ.isLoading && <p className="muted">Loading catalog…</p>}
      {catalogQ.isError && <ErrorNotice error={catalogQ.error} />}

      <div className="play-list">
        {catalogQ.data?.map((c) => {
          const lowEnergy = energy < c.energy;
          const canCommit = !locked && !lowEnergy && !commitMut.isPending;
          return (
            <article key={c.crime_type} className="play-row crime-row">
              <div className="play-row-main">
                <div className="play-row-title">
                  <strong>{c.label}</strong>
                  {c.tier != null && <span className="badge">T{c.tier}</span>}
                </div>
                <div className="play-row-meta">
                  <span>{c.energy} en</span>
                  {c.nerve != null && <span>{c.nerve} nerve</span>}
                  <span className="cash">
                    {money(c.min_payout)}–{money(c.max_payout)}
                  </span>
                  <span className="warn-text">+{c.heat_gain} heat</span>
                  <span>{pct(c.base_catch_rate)} catch</span>
                  <span>{c.jail_hours}h jail</span>
                </div>
                {lowEnergy && <p className="err-text">Need {c.energy} energy.</p>}
                {c.nerve != null && nerve < c.nerve && (
                  <p className="err-text">Need {c.nerve} nerve.</p>
                )}
              </div>
              <button
                type="button"
                className="btn danger play-cta"
                disabled={
                  !canCommit || (c.nerve != null && nerve < c.nerve)
                }
                onClick={() => setTarget(c)}
              >
                Commit
              </button>
            </article>
          );
        })}
      </div>

      <section className="play-section">
        <h2>Recent crimes</h2>
        {!historyQ.data?.length && <p className="muted">No history yet.</p>}
        <div className="play-list">
          {historyQ.data?.map((h) => (
            <article key={h.id} className="play-row compact">
              <div className="play-row-main">
                <div className="play-row-title">
                  <strong>{h.crime_type.replaceAll('_', ' ')}</strong>
                  {h.caught ? (
                    <span className="badge warn">Caught</span>
                  ) : (
                    <span className="badge completed">Away</span>
                  )}
                </div>
                <div className="play-row-meta">
                  <span className="cash">{money(h.payout)}</span>
                  {h.fine_paid > 0 && <span>Fine {money(h.fine_paid)}</span>}
                  {h.jail_hours > 0 && <span>{h.jail_hours}h jail</span>}
                  <span className="muted sm">{new Date(h.created_at).toLocaleString()}</span>
                </div>
                {h.notes && <p className="muted play-row-desc">{h.notes}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <ConfirmModal
        open={!!target}
        title="Confirm crime"
        confirmLabel="Do it"
        danger
        busy={commitMut.isPending}
        onCancel={() => setTarget(null)}
        onConfirm={() => target && commitMut.mutate(target.crime_type)}
      >
        {target && (
          <>
            <p className="danger-text">
              High chance of arrest. Heat +{target.heat_gain}, jail up to {target.jail_hours}h, fine{' '}
              {money(target.fine)}.
            </p>
            <p>
              {target.label}: {target.energy} energy
              {target.nerve != null ? `, ${target.nerve} nerve` : ''}, payout{' '}
              {money(target.min_payout)}–{money(target.max_payout)}, base catch{' '}
              {pct(target.base_catch_rate)}.
            </p>
          </>
        )}
      </ConfirmModal>
    </div>
  );
}
