import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Landmark, Receipt, Scale, Send, Wallet } from 'lucide-react';
import { treasuryApi } from '../api/endpoints';
import { ErrorNotice } from '../components/ErrorNotice';
import { LockBanner } from '../components/LockBanner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { money, pct } from '../lib/format';

export function TreasuryPage() {
  const { character, refreshCharacter, patchCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked =
    !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [payTo, setPayTo] = useState('');
  const [payAmount, setPayAmount] = useState('100');
  const [payReason, setPayReason] = useState('');
  const [donateAmount, setDonateAmount] = useState('50');
  const [donateNote, setDonateNote] = useState('');

  const ratesQ = useQuery({
    queryKey: ['treasury', 'my-rate'],
    queryFn: () => treasuryApi.myRate(),
    staleTime: 30_000,
  });

  const canView = !!ratesQ.data?.can_view_treasury;
  const canSpend = !!ratesQ.data?.can_spend_treasury;

  const snapQ = useQuery({
    queryKey: ['treasury', 'snapshot'],
    queryFn: () => treasuryApi.snapshot({ limit: 40 }),
    enabled: canView,
    refetchInterval: 45_000,
  });

  async function refreshTreasury() {
    await qc.invalidateQueries({ queryKey: ['treasury'] });
    void refreshCharacter();
  }

  const disburseMut = useMutation({
    mutationFn: () =>
      treasuryApi.disburse({
        amount: Number(payAmount),
        reason: payReason.trim(),
        to_display_name: payTo.trim(),
      }),
    onSuccess: async (res) => {
      toast.push(
        `Paid ${money(res.disbursed)} to ${res.to_display_name}. Treasury ${money(res.treasury_balance)}.`,
        'ok',
      );
      setPayReason('');
      await refreshTreasury();
    },
    onError: (err) => toast.pushError(err),
  });

  const donateMut = useMutation({
    mutationFn: () =>
      treasuryApi.donate({
        amount: Number(donateAmount),
        note: donateNote.trim() || undefined,
      }),
    onSuccess: async (res) => {
      toast.push(`Donated ${money(res.donated)}. Treasury ${money(res.treasury_balance)}.`, 'ok');
      patchCharacter({ cash: res.cash });
      setDonateNote('');
      await refreshTreasury();
    },
    onError: (err) => toast.pushError(err),
  });

  function onDisburse(e: FormEvent) {
    e.preventDefault();
    if (!payTo.trim()) return toast.push('Enter recipient display name.', 'err');
    if (!payReason.trim() || payReason.trim().length < 8) {
      return toast.push('Reason needs at least 8 characters.', 'err');
    }
    const n = Number(payAmount);
    if (!Number.isFinite(n) || n <= 0) return toast.push('Enter a valid amount.', 'err');
    disburseMut.mutate();
  }

  function onDonate(e: FormEvent) {
    e.preventDefault();
    const n = Number(donateAmount);
    if (!Number.isFinite(n) || n <= 0) return toast.push('Enter a valid amount.', 'err');
    donateMut.mutate();
  }

  return (
    <div className="play-page">
      <header className="page-header compact">
        <h1>
          <Landmark size={22} aria-hidden /> National Treasury
        </h1>
        <p className="lede">
          Country account for taxes, fees, fines, and public pay. Citizens see rates; officials see
          the ledger.
        </p>
      </header>

      <LockBanner />

      <section className="panel">
        <h2>
          <Scale size={16} aria-hidden /> Your tax rates
        </h2>
        {ratesQ.isError && <ErrorNotice error={ratesQ.error} />}
        {ratesQ.data && (
          <ul className="kv">
            <li>
              <span>Income tax</span>
              <strong>{pct(ratesQ.data.income_tax_rate)}</strong>
            </li>
            <li>
              <span>Corporate tax</span>
              <strong>{pct(ratesQ.data.corporate_tax_rate)}</strong>
            </li>
            <li>
              <span>National base</span>
              <strong>{pct(ratesQ.data.national_tax_rate)}</strong>
            </li>
            <li>
              <span>Treasury access</span>
              <strong>
                {ratesQ.data.can_view_treasury
                  ? ratesQ.data.can_spend_treasury
                    ? 'View + spend'
                    : 'View only'
                  : 'Rates only'}
              </strong>
            </li>
          </ul>
        )}
        {!ratesQ.isLoading && !ratesQ.data?.can_view_treasury && (
          <p className="muted">
            Balance and ledger are limited to the President, VP, Speaker, MPs, and ministers.
          </p>
        )}
      </section>

      {canView && (
        <>
          <section className="panel">
            <h2>
              <Wallet size={16} aria-hidden />{' '}
              {snapQ.data?.account_name ?? 'United Amir National Treasury'}
            </h2>
            {snapQ.isError && <ErrorNotice error={snapQ.error} />}
            {snapQ.data && (
              <>
                <p className="cash" style={{ fontSize: '1.4rem', margin: '0.35rem 0' }}>
                  {money(snapQ.data.balance)}
                </p>
                <ul className="kv">
                  <li>
                    <span>National rate</span>
                    <strong>{pct(snapQ.data.national_tax_rate)}</strong>
                  </li>
                  <li>
                    <span>Corporate rate</span>
                    <strong>{pct(snapQ.data.corporate_tax_rate)}</strong>
                  </li>
                  <li>
                    <span>Your roles</span>
                    <strong>
                      {snapQ.data.your_access.roles.length
                        ? snapQ.data.your_access.roles.join(', ')
                        : '—'}
                    </strong>
                  </li>
                </ul>
                <p className="muted">{snapQ.data.spend_rules.note}</p>
                <p className="muted">
                  Spend authority: {snapQ.data.spend_rules.who} · max{' '}
                  {money(snapQ.data.spend_rules.max_per_transfer)} per transfer.
                </p>
              </>
            )}
          </section>

          {canSpend && (
            <div className="panel-row">
              <section className="panel">
                <h2>
                  <Send size={16} aria-hidden /> Disburse
                </h2>
                <form className="stack-form" onSubmit={onDisburse}>
                  <label>
                    Recipient display name
                    <input
                      value={payTo}
                      onChange={(e) => setPayTo(e.target.value)}
                      disabled={locked || disburseMut.isPending}
                      required
                    />
                  </label>
                  <label>
                    Amount
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      disabled={locked || disburseMut.isPending}
                      required
                    />
                  </label>
                  <label>
                    Reason
                    <input
                      value={payReason}
                      onChange={(e) => setPayReason(e.target.value)}
                      minLength={8}
                      disabled={locked || disburseMut.isPending}
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    className="btn primary"
                    disabled={locked || disburseMut.isPending}
                  >
                    {disburseMut.isPending ? 'Paying…' : 'Pay from treasury'}
                  </button>
                </form>
              </section>

              <section className="panel">
                <h2>
                  <Wallet size={16} aria-hidden /> Donate
                </h2>
                <form className="stack-form" onSubmit={onDonate}>
                  <label>
                    Amount from your cash
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={donateAmount}
                      onChange={(e) => setDonateAmount(e.target.value)}
                      disabled={locked || donateMut.isPending}
                      required
                    />
                  </label>
                  <label>
                    Note <span className="muted">(optional)</span>
                    <input
                      value={donateNote}
                      onChange={(e) => setDonateNote(e.target.value)}
                      disabled={locked || donateMut.isPending}
                    />
                  </label>
                  <button
                    type="submit"
                    className="btn"
                    disabled={locked || donateMut.isPending}
                  >
                    {donateMut.isPending ? 'Donating…' : 'Inject into treasury'}
                  </button>
                </form>
              </section>
            </div>
          )}

          <section className="panel">
            <h2>
              <Receipt size={16} aria-hidden /> Ledger
            </h2>
            {!snapQ.data?.transactions.length && !snapQ.isLoading && (
              <p className="muted">No treasury movements yet.</p>
            )}
            <div className="list-table">
              {snapQ.data?.transactions.map((t) => (
                <div key={t.id} className="list-row">
                  <div>
                    <strong>{t.tx_type.replaceAll('_', ' ')}</strong>
                    {t.note && <p className="muted">{t.note}</p>}
                  </div>
                  <div className="list-meta">
                    <span className={t.amount >= 0 ? 'cash' : 'warn'}>
                      {t.amount >= 0 ? '+' : ''}
                      {money(t.amount)}
                    </span>
                    <span>bal {money(t.balance_after)}</span>
                    <span>{new Date(t.posted_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
