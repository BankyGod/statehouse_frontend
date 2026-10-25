import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dumbbell, Zap } from 'lucide-react';
import { gymApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { ErrorNotice } from '../components/ErrorNotice';
import { useToast } from '../context/ToastContext';
import { LockBanner } from '../components/LockBanner';
import type { GymStat } from '../types/api';

const STAT_KEYS: GymStat[] = ['strength', 'defense', 'speed', 'dexterity'];

export function GymPage() {
  const { character, refreshCharacter, patchCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked = !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const catalogQ = useQuery({
    queryKey: ['gym', 'catalog'],
    queryFn: () => gymApi.catalog(),
  });

  const trainMut = useMutation({
    mutationFn: (stat: GymStat) => gymApi.train(stat),
    onSuccess: (res) => {
      patchCharacter({
        energy: res.energy,
        strength: res.strength,
        defense: res.defense,
        speed: res.speed,
        dexterity: res.dexterity,
      });
      toast.push(`+${res.gained.toFixed(2)} ${res.stat} → ${res.new_value.toFixed(2)}`, 'ok');
      void qc.invalidateQueries({ queryKey: ['gym'] });
      void refreshCharacter();
    },
    onError: (err) => toast.pushError(err),
  });

  const energy = character?.energy ?? 0;

  return (
    <div className="play-page">
      <header className="page-header compact">
        <h1>
          <Dumbbell size={22} aria-hidden /> Gym
        </h1>
        <p className="lede">Spend energy to raise combat stats.</p>
      </header>

      <LockBanner />

      <ul className="play-stat-strip gym-stats">
        {STAT_KEYS.map((k) => (
          <li key={k}>
            <div>
              <em>{k}</em>
              <strong>{Number(character?.[k] ?? 0).toFixed(2)}</strong>
            </div>
          </li>
        ))}
        <li>
          <Zap size={13} aria-hidden />
          <div>
            <em>Energy</em>
            <strong>
              {energy}/{character?.max_energy ?? '—'}
            </strong>
          </div>
        </li>
      </ul>

      {catalogQ.isLoading && <p className="muted">Loading…</p>}
      {catalogQ.isError && <ErrorNotice error={catalogQ.error} />}

      <div className="play-list">
        {catalogQ.data?.map((item) => {
          const low = energy < item.energy_cost;
          return (
            <article key={item.stat} className="play-row">
              <div className="play-row-main">
                <div className="play-row-title">
                  <strong>{item.label}</strong>
                </div>
                <div className="play-row-meta">
                  <span>{item.energy_cost} energy</span>
                  <span>~+{item.gain_base} base</span>
                  <span className="cash">
                    Now {Number(character?.[item.stat] ?? 0).toFixed(2)}
                  </span>
                </div>
                {low && <p className="err-text">Not enough energy.</p>}
              </div>
              <button
                type="button"
                className="btn primary"
                disabled={locked || low || trainMut.isPending}
                onClick={() => trainMut.mutate(item.stat)}
              >
                Train
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
