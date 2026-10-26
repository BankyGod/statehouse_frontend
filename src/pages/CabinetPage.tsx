import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BriefcaseBusiness, LogOut, UserPlus, UserX } from 'lucide-react';
import { cabinetApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { ErrorNotice } from '../components/ErrorNotice';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { usePoliticalRoles } from '../hooks/usePoliticalRoles';
import type { CabinetSeat } from '../types/api';

export function CabinetPage() {
  const { character } = useAuth();
  const { isPresident } = usePoliticalRoles();
  const toast = useToast();
  const qc = useQueryClient();
  const locked =
    !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [portfolio, setPortfolio] = useState('finance');
  const [username, setUsername] = useState('');
  const [characterId, setCharacterId] = useState('');
  const [dismissTarget, setDismissTarget] = useState<CabinetSeat | null>(null);
  const [resignOpen, setResignOpen] = useState(false);

  const cabinetQ = useQuery({
    queryKey: ['cabinet'],
    queryFn: () => cabinetApi.list(),
    refetchInterval: 45_000,
  });

  const meQ = useQuery({
    queryKey: ['cabinet', 'me'],
    queryFn: () => cabinetApi.me(),
  });

  async function refreshCabinet() {
    await qc.invalidateQueries({ queryKey: ['cabinet'] });
    await qc.invalidateQueries({ queryKey: ['news'] });
  }

  const appointMut = useMutation({
    mutationFn: () => {
      const idRaw = characterId.trim();
      const id = idRaw ? Number(idRaw) : undefined;
      return cabinetApi.appoint(
        portfolio,
        username.trim(),
        id != null && Number.isFinite(id) && id > 0 ? id : undefined,
      );
    },
    onSuccess: async (res) => {
      toast.push(typeof res.message === 'string' ? res.message : 'Minister appointed.', 'ok');
      setUsername('');
      setCharacterId('');
      await refreshCabinet();
    },
    onError: (err) => toast.pushError(err),
  });

  const dismissMut = useMutation({
    mutationFn: (p: string) => cabinetApi.dismiss(p),
    onSuccess: async (res) => {
      toast.push(typeof res.message === 'string' ? res.message : 'Minister dismissed.', 'ok');
      setDismissTarget(null);
      await refreshCabinet();
    },
    onError: (err) => toast.pushError(err),
  });

  const resignMut = useMutation({
    mutationFn: () => cabinetApi.resign(),
    onSuccess: async (res) => {
      toast.push(typeof res.message === 'string' ? res.message : 'You resigned.', 'ok');
      setResignOpen(false);
      await refreshCabinet();
    },
    onError: (err) => toast.pushError(err),
  });

  const seats = cabinetQ.data?.seats ?? [];
  const portfolios = seats.map((s) => s.portfolio);
  const mySeat = meQ.data;

  function onAppoint(e: FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      toast.push('Enter the player username.', 'err');
      return;
    }
    const idRaw = characterId.trim();
    if (idRaw) {
      const id = Number(idRaw);
      if (!Number.isFinite(id) || id <= 0) {
        toast.push('Character id must be a positive number (or leave blank).', 'err');
        return;
      }
    }
    appointMut.mutate();
  }

  return (
    <div>
      <header className="page-header">
        <h1>
          <BriefcaseBusiness size={26} aria-hidden /> Cabinet
        </h1>
        <p className="lede">
          National cabinet portfolios. NPC ministers fill empty seats until players are appointed.
        </p>
      </header>

      <section className="panel">
        <h2>My portfolio</h2>
        {!mySeat && <p className="muted">You do not hold a cabinet seat.</p>}
        {mySeat && (
          <div className="row-between">
            <div>
              <strong>{mySeat.title}</strong>
              <p className="muted">
                Portfolio <code>{mySeat.portfolio}</code>
                {mySeat.appointed_at
                  ? ` · since ${new Date(mySeat.appointed_at).toLocaleString()}`
                  : ''}
              </p>
            </div>
            <button
              type="button"
              className="btn danger"
              disabled={locked || resignMut.isPending}
              onClick={() => setResignOpen(true)}
            >
              <LogOut size={15} aria-hidden />
              Resign
            </button>
          </div>
        )}
      </section>

      {isPresident && (
        <section className="panel">
          <h2>
            <UserPlus size={18} aria-hidden /> Appoint minister
          </h2>
          <p className="muted">
            Appoint by <strong>username</strong> (login name). Optional character id must match
            that account. Replaces the current NPC or player — no dismiss needed for NPCs.
          </p>
          <form className="inline-form" onSubmit={onAppoint}>
            <label>
              Portfolio
              <select
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                disabled={locked}
              >
                {(portfolios.length ? portfolios : ['finance']).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={locked}
                autoComplete="off"
                placeholder="player login"
              />
            </label>
            <label>
              Character id
              <input
                type="number"
                min={1}
                value={characterId}
                onChange={(e) => setCharacterId(e.target.value)}
                disabled={locked}
                placeholder="optional · must match"
              />
            </label>
            <button
              type="submit"
              className="btn primary"
              disabled={locked || appointMut.isPending}
            >
              {appointMut.isPending ? 'Appointing…' : 'Appoint'}
            </button>
          </form>
        </section>
      )}

      <section>
        <h2>Cabinet seats</h2>
        {cabinetQ.isLoading && <p>Loading…</p>}
        {cabinetQ.isError && <ErrorNotice error={cabinetQ.error} />}
        <div className="list-table">
          {seats.map((s) => (
            <div key={s.id} className="list-row">
              <div>
                <strong>
                  {s.title}{' '}
                  <span className={`badge ${s.is_npc ? '' : 'active'}`}>
                    {s.is_npc ? 'NPC' : 'Player'}
                  </span>
                </strong>
                <p className="muted">
                  {s.name}
                  {s.username ? ` · @${s.username}` : ''}
                  {s.character_id != null ? ` · char #${s.character_id}` : ''} ·{' '}
                  <code>{s.portfolio}</code>
                </p>
              </div>
              {isPresident && !s.is_npc && (
                <button
                  type="button"
                  className="btn danger sm"
                  disabled={locked || dismissMut.isPending}
                  onClick={() => setDismissTarget(s)}
                >
                  <UserX size={14} aria-hidden />
                  Dismiss
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <ConfirmModal
        open={!!dismissTarget}
        title="Dismiss minister?"
        confirmLabel="Dismiss"
        danger
        busy={dismissMut.isPending}
        onCancel={() => setDismissTarget(null)}
        onConfirm={() => dismissTarget && dismissMut.mutate(dismissTarget.portfolio)}
      >
        {dismissTarget && (
          <p>
            Remove <strong>{dismissTarget.name}</strong> from {dismissTarget.title}? An NPC may
            refill the seat.
          </p>
        )}
      </ConfirmModal>

      <ConfirmModal
        open={resignOpen}
        title="Resign from cabinet?"
        confirmLabel="Resign"
        danger
        busy={resignMut.isPending}
        onCancel={() => setResignOpen(false)}
        onConfirm={() => resignMut.mutate()}
      >
        <p>You will leave your ministerial portfolio.</p>
      </ConfirmModal>
    </div>
  );
}
