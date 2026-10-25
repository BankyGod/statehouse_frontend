import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileBadge } from 'lucide-react';
import { permitsApi, statesApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import type { PermitType } from '../types/api';

const TYPES: PermitType[] = ['work', 'business', 'travel'];

export function PermitsPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked = !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;
  const [stateId, setStateId] = useState<number | ''>('');
  const [permitType, setPermitType] = useState<PermitType>('work');

  const statesQ = useQuery({
    queryKey: ['states'],
    queryFn: () => statesApi.list(),
  });

  const meQ = useQuery({
    queryKey: ['permits', 'me'],
    queryFn: () => permitsApi.me(),
  });

  const stateName = (id: number) => statesQ.data?.find((s) => s.id === id)?.name ?? `#${id}`;

  const isHome = stateId !== '' && stateId === character?.home_state_id;
  const hideWorkTravel = isHome && (permitType === 'work' || permitType === 'travel');

  const applyMut = useMutation({
    mutationFn: () => permitsApi.apply(Number(stateId), permitType),
    onSuccess: async (p) => {
      toast.push(`Permit applied (${p.permit_type}) — fee ${money(p.fee_paid)}.`, 'ok');
      await qc.invalidateQueries({ queryKey: ['permits'] });
      void refreshCharacter();
    },
    onError: (err) => toast.pushError(err),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (stateId === '') {
      toast.push('Pick a state.', 'err');
      return;
    }
    if (hideWorkTravel) {
      toast.push('Home state needs no work or travel permit.', 'info');
      return;
    }
    applyMut.mutate();
  }

  return (
    <div>
      <header className="page-header">
        <h1>
          <FileBadge size={26} aria-hidden /> Permits
        </h1>
        <p className="lede">
          Out-of-state work and business need permits. Home state: no work/travel permit required.
        </p>
      </header>

      <section className="panel">
        <h2>Apply</h2>
        <form className="inline-form" onSubmit={onSubmit}>
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
            Type
            <select
              value={permitType}
              onChange={(e) => setPermitType(e.target.value as PermitType)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="btn primary"
            disabled={locked || applyMut.isPending || hideWorkTravel}
          >
            {applyMut.isPending ? 'Applying…' : 'Apply'}
          </button>
        </form>
        {hideWorkTravel && (
          <p className="muted">Home state — work/travel permits not needed. Choose business or another state.</p>
        )}
      </section>

      <section>
        <h2>My permits</h2>
        {!meQ.data?.length && <p className="muted">None yet.</p>}
        <div className="list-table">
          {meQ.data?.map((p) => (
            <div key={p.id} className="list-row">
              <div>
                <strong>
                  {p.permit_type} · {stateName(p.state_id)}
                </strong>
                <span className="badge">{p.status}</span>
              </div>
              <div className="list-meta">
                <span>Fee {money(p.fee_paid)}</span>
                <span>
                  Exp {p.expires_at ? new Date(p.expires_at).toLocaleString() : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
