import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Landmark,
  PiggyBank,
  Receipt,
  Wallet,
} from 'lucide-react';
import { bankApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { getErrorDetail } from '../api/client';
import { useToast } from '../context/ToastContext';
import { money, pct } from '../lib/format';
import { LockBanner } from '../components/LockBanner';
import type { Loan } from '../types/api';

export function BankPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked = !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [amount, setAmount] = useState('100');
  const [loanAmount, setLoanAmount] = useState('500');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('10');
  const [repayAmount, setRepayAmount] = useState<Record<number, string>>({});

  const bankQ = useQuery({
    queryKey: ['bank', 'me'],
    queryFn: () => bankApi.me(),
    refetchInterval: 30_000,
  });

  const txQ = useQuery({
    queryKey: ['bank', 'transactions'],
    queryFn: () => bankApi.transactions({ limit: 40 }),
    refetchInterval: 45_000,
  });

  async function afterMoney() {
    await qc.invalidateQueries({ queryKey: ['bank'] });
    await refreshCharacter();
  }

  const depositMut = useMutation({
    mutationFn: (n: number) => bankApi.deposit(n),
    onSuccess: async (res) => {
      toast.push(`Deposited ${money(res.moved)}. Bank ${money(res.bank_balance)}.`, 'ok');
      await afterMoney();
    },
    onError: (err) => toast.push(getErrorDetail(err), 'err'),
  });

  const withdrawMut = useMutation({
    mutationFn: (n: number) => bankApi.withdraw(n),
    onSuccess: async (res) => {
      toast.push(`Withdrew ${money(res.moved)}. Cash ${money(res.cash)}.`, 'ok');
      await afterMoney();
    },
    onError: (err) => toast.push(getErrorDetail(err), 'err'),
  });

  const loanMut = useMutation({
    mutationFn: (n: number) => bankApi.createLoan(n),
    onSuccess: async (loan) => {
      toast.push(`Loan issued: ${money(loan.principal)} @ ${pct(loan.interest_rate)}.`, 'ok');
      await afterMoney();
    },
    onError: (err) => toast.push(getErrorDetail(err), 'err'),
  });

  const repayMut = useMutation({
    mutationFn: ({ id, n }: { id: number; n: number }) => bankApi.repayLoan(id, n),
    onSuccess: async (loan) => {
      toast.push(`Payment recorded. Remaining ${money(loan.remaining)}.`, 'ok');
      await afterMoney();
    },
    onError: (err) => toast.push(getErrorDetail(err), 'err'),
  });

  const transferMut = useMutation({
    mutationFn: ({ to, n }: { to: string; n: number }) => bankApi.transfer(to, n),
    onSuccess: async (res) => {
      toast.push(
        typeof res.message === 'string' ? res.message : `Transferred ${money(Number(transferAmount))}.`,
        'ok',
      );
      setTransferTo('');
      await afterMoney();
    },
    onError: (err) => toast.push(getErrorDetail(err), 'err'),
  });

  function parseAmount(raw: string): number | null {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }

  function onDeposit(e?: FormEvent) {
    e?.preventDefault();
    const n = parseAmount(amount);
    if (n == null) return toast.push('Enter a positive amount.', 'err');
    depositMut.mutate(n);
  }

  function onWithdraw(e?: FormEvent) {
    e?.preventDefault();
    const n = parseAmount(amount);
    if (n == null) return toast.push('Enter a positive amount.', 'err');
    withdrawMut.mutate(n);
  }

  function onLoan(e: FormEvent) {
    e.preventDefault();
    const n = parseAmount(loanAmount);
    if (n == null) return toast.push('Enter a positive loan amount.', 'err');
    loanMut.mutate(n);
  }

  const summary = bankQ.data;
  const cash = summary?.cash ?? character?.cash ?? 0;
  const bankBal = summary?.bank_balance ?? character?.bank_balance ?? 0;
  const busy = depositMut.isPending || withdrawMut.isPending;

  const quickAmounts = [
    { label: '$50', value: 50 },
    { label: '$100', value: 100 },
    { label: '$500', value: 500 },
    { label: 'All cash', value: Math.floor(cash * 100) / 100, disabled: cash <= 0 },
    { label: 'All bank', value: Math.floor(bankBal * 100) / 100, disabled: bankBal <= 0 },
  ];

  return (
    <div className="play-page has-dock">
      <header className="page-header compact">
        <h1>
          <Landmark size={22} aria-hidden /> Bank
        </h1>
        <p className="lede">Move cash, transfer, borrow, and check the ledger.</p>
      </header>

      <LockBanner />

      <section className="bank-balances">
        <div className="bank-bal-card">
          <Wallet size={16} aria-hidden />
          <em>Cash</em>
          <strong className="cash">{money(cash)}</strong>
        </div>
        <div className="bank-bal-card">
          <PiggyBank size={16} aria-hidden />
          <em>Bank</em>
          <strong className="cash">{money(bankBal)}</strong>
        </div>
      </section>

      <section className="play-hero ready bank-move">
        <form
          className="bank-move-form"
          onSubmit={(e) => {
            e.preventDefault();
            onDeposit();
          }}
        >
          <label className="bank-amount">
            Amount
            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={locked}
            />
          </label>
          <div className="bank-quick">
            {quickAmounts.map((q) => (
              <button
                key={q.label}
                type="button"
                className="btn ghost sm"
                disabled={locked || q.disabled || !q.value}
                onClick={() => setAmount(String(q.value))}
              >
                {q.label}
              </button>
            ))}
          </div>
          <div className="bank-move-actions">
            <button
              type="button"
              className="btn primary"
              disabled={locked || busy}
              onClick={() => onDeposit()}
            >
              <ArrowDownToLine size={15} aria-hidden />
              {depositMut.isPending ? '…' : 'Deposit'}
            </button>
            <button
              type="button"
              className="btn"
              disabled={locked || busy}
              onClick={() => onWithdraw()}
            >
              <ArrowUpFromLine size={15} aria-hidden />
              {withdrawMut.isPending ? '…' : 'Withdraw'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>
          <ArrowLeftRight size={18} aria-hidden /> Transfer
        </h2>
        <p className="muted">Send bank funds by display name (min $10).</p>
        <form
          className="inline-form stack-form"
          onSubmit={(e) => {
            e.preventDefault();
            const n = parseAmount(transferAmount);
            if (n == null) return toast.push('Enter a positive amount.', 'err');
            if (transferTo.trim().length < 3) return toast.push('Enter a display name.', 'err');
            transferMut.mutate({ to: transferTo.trim(), n });
          }}
        >
          <label>
            To (display name)
            <input
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              minLength={3}
              maxLength={64}
              required
              disabled={locked}
              autoComplete="off"
            />
          </label>
          <label>
            Amount
            <input
              type="number"
              min="10"
              step="0.01"
              inputMode="decimal"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              required
              disabled={locked}
            />
          </label>
          <button type="submit" className="btn primary" disabled={locked || transferMut.isPending}>
            {transferMut.isPending ? 'Sending…' : 'Transfer'}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>New loan</h2>
        <form className="inline-form stack-form" onSubmit={onLoan}>
          <label>
            Principal
            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              required
              disabled={locked}
            />
          </label>
          <button type="submit" className="btn primary" disabled={locked || loanMut.isPending}>
            {loanMut.isPending ? 'Requesting…' : 'Take loan'}
          </button>
        </form>
      </section>

      <section className="play-section">
        <h2>Loans</h2>
        {!summary?.loans?.length && <p className="muted">No loans yet.</p>}
        <div className="play-list">
          {summary?.loans?.map((loan) => (
            <LoanRow
              key={loan.id}
              loan={loan}
              locked={locked}
              value={repayAmount[loan.id] ?? ''}
              onChange={(v) => setRepayAmount((m) => ({ ...m, [loan.id]: v }))}
              busy={repayMut.isPending}
              onRepay={() => {
                const n = parseAmount(repayAmount[loan.id] ?? '');
                if (n == null) return toast.push('Enter a positive repay amount.', 'err');
                repayMut.mutate({ id: loan.id, n });
              }}
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>
          <Receipt size={18} aria-hidden /> Recent transactions
        </h2>
        {txQ.isLoading && <p className="muted">Loading ledger…</p>}
        {txQ.isError && <p className="err-text">{getErrorDetail(txQ.error)}</p>}
        {!txQ.data?.length && !txQ.isLoading && <p className="muted">No transactions yet.</p>}
        <div className="play-list ledger-list">
          {txQ.data?.map((tx) => (
            <div key={tx.id} className="play-row compact">
              <div className="play-row-main">
                <div className="play-row-title">
                  <strong>{tx.tx_type}</strong>
                  <span className="cash">{money(tx.amount)}</span>
                </div>
                <p className="muted play-row-desc">
                  {tx.note ?? '—'}
                  {tx.counterparty_id != null ? ` · #${tx.counterparty_id}` : ''}
                </p>
                <div className="play-row-meta">
                  <span>Bal {money(tx.balance_after)}</span>
                  <span className="muted sm">{new Date(tx.posted_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="play-dock bank-dock">
        <div className="play-dock-info">
          <strong className="cash">{money(cash)}</strong>
          <span className="muted">cash · bank {money(bankBal)}</span>
        </div>
        <div className="bank-dock-actions">
          <button
            type="button"
            className="btn primary sm"
            disabled={locked || busy}
            onClick={() => onDeposit()}
          >
            Deposit
          </button>
          <button
            type="button"
            className="btn sm"
            disabled={locked || busy}
            onClick={() => onWithdraw()}
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}

function LoanRow({
  loan,
  locked,
  value,
  onChange,
  onRepay,
  busy,
}: {
  loan: Loan;
  locked: boolean;
  value: string;
  onChange: (v: string) => void;
  onRepay: () => void;
  busy: boolean;
}) {
  const done = loan.status === 'paid' || loan.remaining <= 0;
  return (
    <article className="play-row">
      <div className="play-row-main">
        <div className="play-row-title">
          <strong>Loan #{loan.id}</strong>
          <span className={`badge ${loan.status}`}>{loan.status}</span>
        </div>
        <div className="play-row-meta">
          <span>{money(loan.principal)} principal</span>
          <span>Left {money(loan.remaining)}</span>
          <span>{pct(loan.interest_rate)}</span>
          <span className="muted sm">due {new Date(loan.due_at).toLocaleDateString()}</span>
        </div>
        {!done && (
          <div className="loan-repay">
            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              placeholder="Repay"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={locked}
            />
            <button type="button" className="btn" disabled={locked || busy} onClick={onRepay}>
              Repay
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
