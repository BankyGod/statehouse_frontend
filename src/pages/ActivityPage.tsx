import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Inbox, X } from 'lucide-react';
import { activitiesApi, inboxApi } from '../api/endpoints';
import { ErrorNotice } from '../components/ErrorNotice';
import { useToast } from '../context/ToastContext';

export function ActivityPage() {
  const toast = useToast();
  const qc = useQueryClient();

  const notifQ = useQuery({
    queryKey: ['activities', 'notifications'],
    queryFn: () => activitiesApi.notifications(),
    refetchInterval: 30_000,
  });

  const actQ = useQuery({
    queryKey: ['activities', 'me'],
    queryFn: () => activitiesApi.me(),
  });

  const invitesQ = useQuery({
    queryKey: ['inbox', 'invites'],
    queryFn: () => inboxApi.invites(),
    refetchInterval: 15_000,
  });

  const readMut = useMutation({
    mutationFn: () => activitiesApi.markRead(),
    onSuccess: async (res) => {
      if (res.marked > 0) toast.push(`Marked ${res.marked} read.`, 'ok');
      await qc.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: (err) => toast.pushError(err),
  });

  const acceptMut = useMutation({
    mutationFn: (id: number) => inboxApi.acceptInvite(id),
    onSuccess: async (res) => {
      toast.push(typeof res.message === 'string' ? res.message : 'Joined the company.', 'ok');
      await qc.invalidateQueries({ queryKey: ['inbox'] });
      await qc.invalidateQueries({ queryKey: ['activities'] });
      await qc.invalidateQueries({ queryKey: ['jobs'] });
      await qc.invalidateQueries({ queryKey: ['businesses'] });
    },
    onError: (err) => toast.pushError(err),
  });

  const declineMut = useMutation({
    mutationFn: (id: number) => inboxApi.declineInvite(id),
    onSuccess: async () => {
      toast.push('Offer declined.', 'ok');
      await qc.invalidateQueries({ queryKey: ['inbox'] });
      await qc.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: (err) => toast.pushError(err),
  });

  const invites = invitesQ.data ?? [];

  return (
    <div className="play-page">
      <header className="page-header compact">
        <h1>
          <Bell size={22} aria-hidden /> Activity
        </h1>
        <p className="lede">Notifications, job offers, and recent activity.</p>
      </header>

      {invites.length > 0 && (
        <section className="play-section panel">
          <div className="row-between">
            <h2>Company job offers</h2>
            <Link to="/inbox" className="btn ghost sm">
              <Inbox size={14} aria-hidden /> Open Inbox
            </Link>
          </div>
          <p className="muted sm">
            Accepting ends your current state job (and any other company role) automatically.
          </p>
          <div className="inbox-list">
            {invites.map((inv) => (
              <article key={inv.id} className="inbox-item offer">
                <header>
                  <strong>{inv.business_name}</strong>
                  <span className="muted sm">
                    {inv.role} · from {inv.from_display_name}
                  </span>
                </header>
                <div className="row-actions">
                  <button
                    type="button"
                    className="btn primary sm"
                    disabled={acceptMut.isPending}
                    onClick={() => acceptMut.mutate(inv.id)}
                  >
                    <Check size={14} aria-hidden /> Accept & join
                  </button>
                  <button
                    type="button"
                    className="btn danger sm"
                    disabled={declineMut.isPending}
                    onClick={() => declineMut.mutate(inv.id)}
                  >
                    <X size={14} aria-hidden /> Decline
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="play-section">
        <div className="row-between">
          <h2>Notifications</h2>
          <button
            type="button"
            className="btn ghost sm"
            disabled={readMut.isPending}
            onClick={() => readMut.mutate()}
          >
            Mark read
          </button>
        </div>
        {notifQ.isLoading && <p className="muted">Loading…</p>}
        {notifQ.isError && <ErrorNotice error={notifQ.error} />}
        {!notifQ.data?.length && !notifQ.isLoading && <p className="muted">No notifications.</p>}
        <div className="play-list">
          {notifQ.data?.map((n) => (
            <article key={n.id} className={`play-row compact ${n.is_read ? '' : 'current'}`}>
              <div className="play-row-main">
                <div className="play-row-title">
                  <strong>{n.title}</strong>
                  {n.category && <span className="badge">{n.category}</span>}
                  {!n.is_read && <span className="badge pending">New</span>}
                </div>
                {n.body && <p className="muted play-row-desc">{n.body}</p>}
                <div className="play-row-meta">
                  <span className="muted sm">
                    {new Date(n.posted_at || n.created_at).toLocaleString()}
                  </span>
                  {n.ref_type === 'job_invite' && n.ref_id != null && (
                    <Link to="/inbox" className="btn ghost sm">
                      Respond in Inbox
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="play-section">
        <h2>Activity log</h2>
        {actQ.isError && <ErrorNotice error={actQ.error} />}
        {!actQ.data?.length && !actQ.isLoading && <p className="muted">Nothing logged yet.</p>}
        <div className="play-list">
          {actQ.data?.map((a, i) => (
            <article key={String(a.id ?? i)} className="play-row compact">
              <div className="play-row-main">
                <div className="play-row-title">
                  <strong>{String(a.title ?? a.category ?? 'Event')}</strong>
                </div>
                {a.body != null && <p className="muted play-row-desc">{String(a.body)}</p>}
                <div className="play-row-meta">
                  <span className="muted sm">
                    {new Date(String(a.posted_at ?? a.created_at ?? Date.now())).toLocaleString()}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
