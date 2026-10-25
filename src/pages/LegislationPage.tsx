import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Gavel, ScrollText } from 'lucide-react';
import { legislationApi, statesApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { ErrorNotice } from '../components/ErrorNotice';
import { useToast } from '../context/ToastContext';
import { pct } from '../lib/format';
import { Timer } from '../components/Timer';
import { ConfirmModal } from '../components/ConfirmModal';
import { usePoliticalRoles } from '../hooks/usePoliticalRoles';
import type { Bill, VoteChoice } from '../types/api';

export function LegislationPage() {
  const { character } = useAuth();
  const { isMp, isPresident } = usePoliticalRoles();
  const toast = useToast();
  const qc = useQueryClient();
  const locked =
    !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [statusFilter, setStatusFilter] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [vetoTarget, setVetoTarget] = useState<Bill | null>(null);

  const statesQ = useQuery({
    queryKey: ['states'],
    queryFn: () => statesApi.list(),
  });

  const billsQ = useQuery({
    queryKey: ['legislation', 'bills', statusFilter],
    queryFn: () => legislationApi.bills(statusFilter || undefined),
    refetchInterval: 30_000,
  });

  const budgetQ = useQuery({
    queryKey: ['legislation', 'budget'],
    queryFn: () => legislationApi.currentBudget(),
    refetchInterval: 30_000,
  });

  const proposeMut = useMutation({
    mutationFn: () => legislationApi.propose(title.trim(), summary.trim()),
    onSuccess: async (bill) => {
      toast.push(`Bill tabled: ${bill.title}`, 'ok');
      setTitle('');
      setSummary('');
      await qc.invalidateQueries({ queryKey: ['legislation'] });
      await qc.invalidateQueries({ queryKey: ['news'] });
    },
    onError: (err) => toast.pushError(err),
  });

  const voteBillMut = useMutation({
    mutationFn: ({ id, choice }: { id: number; choice: VoteChoice }) =>
      legislationApi.voteBill(id, choice),
    onSuccess: async (_res, vars) => {
      toast.push(`Bill vote: ${vars.choice}`, 'ok');
      await qc.invalidateQueries({ queryKey: ['legislation'] });
    },
    onError: (err) => toast.pushError(err),
  });

  const vetoMut = useMutation({
    mutationFn: (id: number) => legislationApi.veto(id),
    onSuccess: async () => {
      toast.push('Veto submitted.', 'ok');
      setVetoTarget(null);
      await qc.invalidateQueries({ queryKey: ['legislation'] });
      await qc.invalidateQueries({ queryKey: ['news'] });
    },
    onError: (err) => toast.pushError(err),
  });

  const voteBudgetMut = useMutation({
    mutationFn: ({ id, choice }: { id: number; choice: VoteChoice }) =>
      legislationApi.voteBudget(id, choice),
    onSuccess: async (_res, vars) => {
      toast.push(`Budget vote: ${vars.choice}`, 'ok');
      await qc.invalidateQueries({ queryKey: ['legislation'] });
    },
    onError: (err) => toast.pushError(err),
  });

  const stateName = (id: number | null) =>
    id == null ? '—' : (statesQ.data?.find((s) => s.id === id)?.name ?? `#${id}`);

  const budget = budgetQ.data?.budget ?? null;

  return (
    <div>
      <header className="page-header">
        <h1>
          <ScrollText size={26} aria-hidden /> Legislation
        </h1>
        <p className="lede">
          National bills and budget readings. Debate windows run about 2.5 real days.
        </p>
      </header>

      <section className="panel">
        <h2>
          <Gavel size={18} aria-hidden /> National budget
        </h2>
        {!budget && !budgetQ.isLoading && (
          <p className="muted">No open budget reading.</p>
        )}
        {budget && (
          <>
            <ul className="kv">
              <li>
                <span>Title</span>
                <strong>{budget.title}</strong>
              </li>
              <li>
                <span>Tax rate</span>
                <strong>{pct(budget.national_tax_rate)}</strong>
              </li>
              <li>
                <span>Status</span>
                <strong>
                  <span className="badge">{budget.status}</span>
                </strong>
              </li>
              <li>
                <span>Votes</span>
                <strong>
                  Y {budget.yes_votes} / N {budget.no_votes}
                </strong>
              </li>
              <li>
                <span>Closes</span>
                <Timer
                  completesAt={budget.closes_at}
                  onComplete={() => void budgetQ.refetch()}
                />
              </li>
            </ul>
            <p className="muted">{budget.summary}</p>
            {isMp && (
              <div className="vote-row">
                {(['yes', 'no'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`btn ${c === 'yes' ? 'primary' : 'danger'}`}
                    disabled={locked || budget.status !== 'open' || voteBudgetMut.isPending}
                    onClick={() => voteBudgetMut.mutate({ id: budget.id, choice: c })}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {isMp && (
        <section className="panel">
          <h2>
            <FileText size={18} aria-hidden /> Propose a bill
          </h2>
          <form
            className="stack-form"
            onSubmit={(e) => {
              e.preventDefault();
              proposeMut.mutate();
            }}
          >
            <label>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                minLength={3}
                maxLength={160}
                required
                disabled={locked}
              />
            </label>
            <label>
              Summary
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                minLength={10}
                maxLength={2000}
                rows={3}
                required
                disabled={locked}
              />
            </label>
            <button
              type="submit"
              className="btn primary"
              disabled={locked || proposeMut.isPending}
            >
              {proposeMut.isPending ? 'Filing…' : 'Table bill'}
            </button>
          </form>
        </section>
      )}

      <section>
        <div className="row-between" style={{ marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>Bills</h2>
          <label className="inline-label">
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="debate">Debate</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="vetoed">Vetoed</option>
            </select>
          </label>
        </div>

        {billsQ.isLoading && <p>Loading bills…</p>}
        {billsQ.isError && <ErrorNotice error={billsQ.error} />}
        {!billsQ.data?.length && !billsQ.isLoading && (
          <p className="muted">No bills yet.</p>
        )}

        <div className="list-table">
          {billsQ.data?.map((b) => (
            <div key={b.id} className="list-row legislation-row">
              <div>
                <strong>
                  {b.title} <span className="badge">{b.status}</span>
                  {b.vetoed && <span className="badge warn">Vetoed</span>}
                </strong>
                <p className="muted">
                  {b.summary} · sponsor state {stateName(b.sponsor_state_id)}
                </p>
                <p className="muted sm">
                  Player Y/N/A {b.yes_votes}/{b.no_votes}/{b.abstain_votes} · NPC Y/N {b.npc_yes}/
                  {b.npc_no}
                  {b.debate_ends_at ? (
                    <>
                      {' '}
                      · debate ends{' '}
                      <Timer
                        completesAt={b.debate_ends_at}
                        onComplete={() => void billsQ.refetch()}
                      />
                    </>
                  ) : null}
                </p>
              </div>
              {(isMp || isPresident) && (
                <div className="vote-row">
                  {isMp &&
                    (['yes', 'no', 'abstain'] as VoteChoice[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="btn sm"
                        disabled={locked || b.status !== 'debate' || voteBillMut.isPending}
                        onClick={() => voteBillMut.mutate({ id: b.id, choice: c })}
                      >
                        {c}
                      </button>
                    ))}
                  {isPresident && (
                    <button
                      type="button"
                      className="btn danger sm"
                      disabled={locked || b.status !== 'debate' || vetoMut.isPending}
                      onClick={() => setVetoTarget(b)}
                    >
                      Veto
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {isPresident && (
        <ConfirmModal
          open={!!vetoTarget}
          title="Veto this bill?"
          confirmLabel="Veto"
          danger
          busy={vetoMut.isPending}
          onCancel={() => setVetoTarget(null)}
          onConfirm={() => vetoTarget && vetoMut.mutate(vetoTarget.id)}
        >
          {vetoTarget && (
            <p>
              Veto <strong>{vetoTarget.title}</strong>?
            </p>
          )}
        </ConfirmModal>
      )}
    </div>
  );
}
