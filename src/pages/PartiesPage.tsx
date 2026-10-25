import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flag, LogOut, Users } from 'lucide-react';
import { partiesApi } from '../api/endpoints';
import { ErrorNotice } from '../components/ErrorNotice';
import { LockBanner } from '../components/LockBanner';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useState } from 'react';
import type { PoliticalParty } from '../types/api';
import { num } from '../lib/format';

export function PartiesPage() {
  const { character } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked =
    !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [joinTarget, setJoinTarget] = useState<PoliticalParty | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const listQ = useQuery({
    queryKey: ['parties'],
    queryFn: () => partiesApi.list(),
  });

  const meQ = useQuery({
    queryKey: ['parties', 'me'],
    queryFn: () => partiesApi.me(),
  });

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ['parties'] });
  }

  const joinMut = useMutation({
    mutationFn: (party_id: number) => partiesApi.join(party_id),
    onSuccess: async (res) => {
      toast.push(typeof res.message === 'string' ? res.message : 'Joined party.', 'ok');
      setJoinTarget(null);
      await refresh();
    },
    onError: (err) => toast.pushError(err),
  });

  const leaveMut = useMutation({
    mutationFn: () => partiesApi.leave(),
    onSuccess: async (res) => {
      toast.push(typeof res.message === 'string' ? res.message : 'Left party.', 'ok');
      setLeaveOpen(false);
      await refresh();
    },
    onError: (err) => toast.pushError(err),
  });

  const membership = meQ.data;
  const myPartyId = membership?.party_id;

  return (
    <div className="play-page">
      <header className="page-header compact">
        <h1>
          <Flag size={22} aria-hidden /> Parties
        </h1>
        <p className="lede">Five national parties — join anytime; NPC chairs until players lead.</p>
      </header>

      <LockBanner />

      {membership && (
        <section className="play-hero ready">
          <div className="row-between">
            <div>
              <p className="muted sm">Your membership</p>
              <strong>
                {membership.party_name}
                {membership.short_name ? ` (${membership.short_name})` : ''}
              </strong>
              <p className="muted">
                Rank {membership.rank} · joined {new Date(membership.joined_at).toLocaleDateString()}
              </p>
            </div>
            <button
              type="button"
              className="btn ghost"
              disabled={locked || leaveMut.isPending}
              onClick={() => setLeaveOpen(true)}
            >
              <LogOut size={14} aria-hidden /> Leave
            </button>
          </div>
        </section>
      )}

      {listQ.isLoading && <p className="muted">Loading parties…</p>}
      {listQ.isError && <ErrorNotice error={listQ.error} />}

      <div className="play-list">
        {listQ.data?.map((p) => {
          const mine = myPartyId === p.id;
          return (
            <article
              key={p.id}
              className={`play-row ${mine ? 'current' : ''}`}
              style={{ borderLeft: `4px solid ${p.color_hex}` }}
            >
              <div className="play-row-main">
                <div className="play-row-title">
                  <strong>{p.name}</strong>
                  <span className="badge">{p.short_name}</span>
                  <span className="badge">{p.ideology}</span>
                  {p.is_npc_led && <span className="badge">NPC led</span>}
                  {mine && <span className="badge active">You</span>}
                </div>
                <p className="muted play-row-desc">{p.slogan}</p>
                <p className="muted play-row-desc">{p.description}</p>
                <div className="play-row-meta">
                  <span>
                    <Users size={12} aria-hidden /> {num(p.total_members)} members
                  </span>
                  <span>{num(p.player_members)} players</span>
                  <span>Leader: {p.leader}</span>
                </div>
              </div>
              {!mine && (
                <button
                  type="button"
                  className="btn primary"
                  disabled={locked || joinMut.isPending}
                  onClick={() => setJoinTarget(p)}
                >
                  {myPartyId ? 'Switch' : 'Join'}
                </button>
              )}
            </article>
          );
        })}
      </div>

      <ConfirmModal
        open={!!joinTarget}
        title={myPartyId ? 'Switch party?' : 'Join party?'}
        confirmLabel={myPartyId ? 'Switch' : 'Join'}
        busy={joinMut.isPending}
        onCancel={() => setJoinTarget(null)}
        onConfirm={() => joinTarget && joinMut.mutate(joinTarget.id)}
      >
        {joinTarget && (
          <p>
            Join <strong>{joinTarget.name}</strong>
            {myPartyId ? ' (leaves your current party)' : ''}.
          </p>
        )}
      </ConfirmModal>

      <ConfirmModal
        open={leaveOpen}
        title="Leave party?"
        confirmLabel="Leave"
        danger
        busy={leaveMut.isPending}
        onCancel={() => setLeaveOpen(false)}
        onConfirm={() => leaveMut.mutate()}
      >
        <p>You will become an independent until you join another party.</p>
      </ConfirmModal>
    </div>
  );
}
