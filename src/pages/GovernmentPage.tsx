import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building, LogOut, Shield } from 'lucide-react';
import { governmentApi } from '../api/endpoints';
import { ErrorNotice } from '../components/ErrorNotice';
import { LockBanner } from '../components/LockBanner';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import type { GovernmentPost } from '../types/api';

export function GovernmentPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked =
    !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [openOnly, setOpenOnly] = useState(true);
  const [applyTarget, setApplyTarget] = useState<GovernmentPost | null>(null);
  const [resignOpen, setResignOpen] = useState(false);

  const postsQ = useQuery({
    queryKey: ['government', 'posts', openOnly],
    queryFn: () => governmentApi.posts({ open_only: openOnly }),
  });

  const meQ = useQuery({
    queryKey: ['government', 'me'],
    queryFn: () => governmentApi.me(),
  });

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ['government'] });
    await refreshCharacter();
  }

  const applyMut = useMutation({
    mutationFn: (post_id: number) => governmentApi.apply(post_id),
    onSuccess: async (res) => {
      toast.push(res.message ?? `Hired as ${res.title}.`, 'ok');
      setApplyTarget(null);
      await refresh();
    },
    onError: (err) => toast.pushError(err),
  });

  const resignMut = useMutation({
    mutationFn: () => governmentApi.resign(),
    onSuccess: async (res) => {
      toast.push(`Resigned ${res.title}. NPC caretaker returned.`, 'ok');
      setResignOpen(false);
      await refresh();
    },
    onError: (err) => toast.pushError(err),
  });

  const myPost = meQ.data;

  return (
    <div className="play-page">
      <header className="page-header compact">
        <h1>
          <Building size={22} aria-hidden /> Civil service
        </h1>
        <p className="lede">
          Take NPC-held government posts. Weekly wage on tick; education and reputation gate hiring.
        </p>
      </header>

      <LockBanner />

      {myPost && (
        <section className="play-hero ready">
          <div className="row-between">
            <div>
              <p className="muted sm">Your post</p>
              <strong>{myPost.title}</strong>
              <p className="muted">
                {myPost.agency} · {money(myPost.wage_per_week)}/week · {myPost.tier}
              </p>
            </div>
            <button
              type="button"
              className="btn ghost"
              disabled={locked || resignMut.isPending}
              onClick={() => setResignOpen(true)}
            >
              <LogOut size={14} aria-hidden /> Resign
            </button>
          </div>
        </section>
      )}

      <div className="row-between" style={{ marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>Posts</h2>
        <label className="muted sm" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(e) => setOpenOnly(e.target.checked)}
          />
          Open (NPC-held) only
        </label>
      </div>

      {postsQ.isLoading && <p className="muted">Loading posts…</p>}
      {postsQ.isError && <ErrorNotice error={postsQ.error} />}
      {!postsQ.data?.length && !postsQ.isLoading && (
        <p className="muted">No posts match this filter.</p>
      )}

      <div className="play-list">
        {postsQ.data?.map((post) => {
          const mine = myPost?.id === post.id;
          const canApply = post.is_npc && !mine;
          return (
            <article key={post.id} className={`play-row ${mine ? 'current' : ''}`}>
              <div className="play-row-main">
                <div className="play-row-title">
                  <strong>{post.title}</strong>
                  <span className="badge">{post.tier}</span>
                  {post.is_npc ? (
                    <span className="badge">NPC</span>
                  ) : (
                    <span className="badge active">Player</span>
                  )}
                  {mine && <span className="badge active">You</span>}
                </div>
                <p className="muted play-row-desc">{post.description}</p>
                <div className="play-row-meta">
                  <span>{post.agency}</span>
                  <span className="cash">{money(post.wage_per_week)}/wk</span>
                  <span>Edu ≥{post.min_education_level}</span>
                  <span>Rep ≥{post.min_reputation}</span>
                  {post.requires_clean_record && (
                    <span>
                      <Shield size={12} aria-hidden /> Clean record
                    </span>
                  )}
                  <span>Held by {post.holder_name}</span>
                </div>
              </div>
              {canApply && (
                <button
                  type="button"
                  className="btn primary"
                  disabled={locked || applyMut.isPending}
                  onClick={() => setApplyTarget(post)}
                >
                  Apply
                </button>
              )}
            </article>
          );
        })}
      </div>

      <ConfirmModal
        open={!!applyTarget}
        title="Take this post?"
        confirmLabel="Apply"
        busy={applyMut.isPending}
        onCancel={() => setApplyTarget(null)}
        onConfirm={() => applyTarget && applyMut.mutate(applyTarget.id)}
      >
        {applyTarget && (
          <>
            <p>
              Replace NPC caretaker for <strong>{applyTarget.title}</strong> (
              {money(applyTarget.wage_per_week)}/week).
            </p>
            {myPost && myPost.id !== applyTarget.id && (
              <p className="warn-text">Resign your current post first if apply fails.</p>
            )}
          </>
        )}
      </ConfirmModal>

      <ConfirmModal
        open={resignOpen}
        title="Resign civil service?"
        confirmLabel="Resign"
        danger
        busy={resignMut.isPending}
        onCancel={() => setResignOpen(false)}
        onConfirm={() => resignMut.mutate()}
      >
        <p>An NPC caretaker will return to this desk.</p>
      </ConfirmModal>
    </div>
  );
}
