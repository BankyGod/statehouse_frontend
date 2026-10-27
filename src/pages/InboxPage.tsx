import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Check, Inbox, Mail, Send, X } from 'lucide-react';
import { businessesApi, charactersApi, inboxApi } from '../api/endpoints';
import { ErrorNotice } from '../components/ErrorNotice';
import { LockBanner } from '../components/LockBanner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';

type Tab = 'mail' | 'offers' | 'job' | 'compose';

export function InboxPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked =
    !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [tab, setTab] = useState<Tab>('offers');
  const [tabTouched, setTabTouched] = useState(false);
  const [toQuery, setToQuery] = useState('');
  const [toId, setToId] = useState<number | null>(null);
  const [toLabel, setToLabel] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [asBusinessId, setAsBusinessId] = useState<number | ''>('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const inboxQ = useQuery({
    queryKey: ['inbox'],
    queryFn: () => inboxApi.overview(),
    refetchInterval: 12_000,
  });

  const bizQ = useQuery({
    queryKey: ['businesses', 'me'],
    queryFn: () => businessesApi.me(),
  });

  const searchQ = useQuery({
    queryKey: ['characters', 'search', toQuery.trim()],
    queryFn: () => charactersApi.search(toQuery.trim()),
    enabled: tab === 'compose' && toQuery.trim().length >= 1 && !toId,
    staleTime: 8_000,
  });

  const myCompanies = useMemo(
    () => (bizQ.data ?? []).filter((b) => b.status === 'active'),
    [bizQ.data],
  );

  async function refreshInbox() {
    await qc.invalidateQueries({ queryKey: ['inbox'] });
    void refreshCharacter();
  }

  const sendMut = useMutation({
    mutationFn: () =>
      inboxApi.send({
        body: body.trim(),
        subject: subject.trim() || null,
        to_character_id: toId,
        to_display_name: toId ? null : toQuery.trim() || null,
        business_id: asBusinessId === '' ? null : Number(asBusinessId),
      }),
    onSuccess: async () => {
      toast.push('Message sent.', 'ok');
      setBody('');
      setSubject('');
      setToQuery('');
      setToId(null);
      setToLabel('');
      setTab('mail');
      await refreshInbox();
    },
    onError: (err) => toast.pushError(err),
  });

  const acceptMut = useMutation({
    mutationFn: (id: number) => inboxApi.acceptInvite(id),
    onSuccess: async (res) => {
      toast.push(res.message || 'Joined the company.', 'ok');
      await refreshInbox();
      await qc.invalidateQueries({ queryKey: ['businesses'] });
      await qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (err) => toast.pushError(err),
  });

  const declineMut = useMutation({
    mutationFn: (id: number) => inboxApi.declineInvite(id),
    onSuccess: async () => {
      toast.push('Offer declined.', 'ok');
      await refreshInbox();
    },
    onError: (err) => toast.pushError(err),
  });

  const data = inboxQ.data;
  const messages = data?.messages ?? [];
  const invites = data?.invites ?? [];
  const job = data?.company_job ?? null;

  useEffect(() => {
    if (tabTouched) return;
    if (invites.length > 0) setTab('offers');
    else if ((data?.unread_mail ?? 0) > 0) setTab('mail');
  }, [invites.length, data?.unread_mail, tabTouched]);

  function onCompose(e: FormEvent) {
    e.preventDefault();
    if (!toId && toQuery.trim().length < 3) {
      return toast.push('Pick a recipient from search or enter a name.', 'err');
    }
    if (body.trim().length < 1) return toast.push('Write a message.', 'err');
    sendMut.mutate();
  }

  return (
    <div className="play-page">
      <LockBanner />
      <header className="page-header compact">
        <h1>
          <Inbox size={22} aria-hidden /> Inbox
        </h1>
      </header>

      {inboxQ.isError && <ErrorNotice error={inboxQ.error} />}

      {invites.length > 0 && tab !== 'offers' && (
        <div className="biz-dash-banner">
          You have {invites.length} pending company job offer
          {invites.length === 1 ? '' : 's'}.{' '}
          <button
            type="button"
            className="btn sm primary"
            onClick={() => {
              setTabTouched(true);
              setTab('offers');
            }}
          >
            Review offers
          </button>
        </div>
      )}

      <div className="inbox-tabs">
        {(
          [
            ['offers', `Job offers${invites.length ? ` (${invites.length})` : ''}`],
            ['mail', `Mail${data?.unread_mail ? ` (${data.unread_mail})` : ''}`],
            ['job', 'My company job'],
            ['compose', 'Compose'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`btn sm ${tab === id ? 'primary' : ''}`}
            onClick={() => {
              setTabTouched(true);
              setTab(id);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'mail' && (
        <section className="panel">
          <h2>
            <Mail size={18} aria-hidden /> Messages
          </h2>
          {inboxQ.isLoading && <p className="muted">Loading…</p>}
          {!messages.length && !inboxQ.isLoading && (
            <p className="muted">No mail yet. Compose a message to start a conversation.</p>
          )}
          <div className="inbox-list">
            {messages.map((m) => (
              <article
                key={m.id}
                className={`inbox-item ${m.direction === 'in' && !m.is_read ? 'unread' : ''}`}
              >
                <header>
                  <strong>
                    {m.direction === 'in' ? m.from : `To ${m.to}`}
                    {m.business_name ? ` · ${m.business_name}` : ''}
                  </strong>
                  <span className="muted sm">
                    {m.posted_at ? new Date(m.posted_at).toLocaleString() : ''}
                  </span>
                </header>
                {m.subject && <p className="inbox-subject">{m.subject}</p>}
                <p>{m.body}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'offers' && (
        <section className="panel">
          <h2>
            <Briefcase size={18} aria-hidden /> Job offers
          </h2>
          <p className="muted sm">
            Accepting ends your current state job and any other company role. Political office
            holders cannot join company payroll (they may still own businesses).
          </p>
          {!invites.length && <p className="muted">No pending offers.</p>}
          <div className="inbox-list">
            {invites.map((inv) => (
              <article key={inv.id} className="inbox-item offer">
                <header>
                  <strong>{inv.business_name}</strong>
                  <span className="muted sm">from {inv.from_display_name}</span>
                </header>
                <p>
                  Role <strong>{inv.role}</strong> · {money(inv.wage_per_week)}/wk
                </p>
                {inv.message && <p className="muted">{inv.message}</p>}
                <div className="row-actions">
                  <button
                    type="button"
                    className="btn primary sm"
                    disabled={locked || acceptMut.isPending}
                    onClick={() => acceptMut.mutate(inv.id)}
                  >
                    <Check size={14} aria-hidden /> Accept & join
                  </button>
                  <button
                    type="button"
                    className="btn danger sm"
                    disabled={locked || declineMut.isPending}
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

      {tab === 'job' && (
        <section className="panel">
          <h2>
            <Briefcase size={18} aria-hidden /> Company employment
          </h2>
          {!job && (
            <p className="muted">
              You are not on a private company payroll. Accept an offer from Inbox → Offers, or keep
              working state jobs under Jobs.
            </p>
          )}
          {job && (
            <ul className="kv">
              <li>
                <span>Company</span>
                <strong>{job.business_name}</strong>
              </li>
              <li>
                <span>Role</span>
                <strong>{job.role}</strong>
              </li>
              <li>
                <span>Wage / week</span>
                <strong className="cash">{money(job.wage_per_week)}</strong>
              </li>
              <li>
                <span>Hired</span>
                <strong>{new Date(job.hired_at).toLocaleString()}</strong>
              </li>
            </ul>
          )}
        </section>
      )}

      {tab === 'compose' && (
        <section className="panel">
          <h2>
            <Send size={18} aria-hidden /> Compose
          </h2>
          <form className="stack-form" onSubmit={onCompose}>
            <label className="biz-hire-search">
              To (name or #id)
              <input
                value={toId ? toLabel : toQuery}
                onChange={(e) => {
                  setToId(null);
                  setToLabel('');
                  setToQuery(e.target.value);
                  setPickerOpen(true);
                }}
                onFocus={() => setPickerOpen(true)}
                placeholder="Search player…"
                disabled={locked}
                autoComplete="off"
              />
              {pickerOpen && !toId && toQuery.trim().length >= 1 && (
                <ul className="biz-hire-dropdown" role="listbox">
                  {searchQ.isFetching && <li className="muted">Searching…</li>}
                  {!searchQ.isFetching && !(searchQ.data?.length) && (
                    <li className="muted">No matches</li>
                  )}
                  {(searchQ.data ?? []).map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setToId(p.id);
                          setToLabel(p.label);
                          setToQuery(p.display_name);
                          setPickerOpen(false);
                        }}
                      >
                        <strong>{p.display_name}</strong>
                        <span className="muted">#{p.id}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </label>
            {myCompanies.length > 0 && (
              <label>
                Send as company (optional)
                <select
                  value={asBusinessId}
                  onChange={(e) =>
                    setAsBusinessId(e.target.value ? Number(e.target.value) : '')
                  }
                  disabled={locked}
                >
                  <option value="">Personal</option>
                  {myCompanies.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Subject
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={128}
                disabled={locked}
              />
            </label>
            <label>
              Message
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                maxLength={500}
                required
                disabled={locked}
              />
            </label>
            <button type="submit" className="btn primary" disabled={locked || sendMut.isPending}>
              {sendMut.isPending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
