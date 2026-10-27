import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  Landmark,
  PiggyBank,
  Receipt,
  Wallet,
} from 'lucide-react';
import { bankApi } from '../api/endpoints';
import { LockBanner } from '../components/LockBanner';
import { HubPageShell, SysHubCard, SysHubGrid } from '../components/SysHub';
import { useAuth } from '../context/AuthContext';
import { money } from '../lib/format';

export function BankHubPage() {
  const { character } = useAuth();
  const bankQ = useQuery({
    queryKey: ['bank', 'me'],
    queryFn: () => bankApi.me(),
    refetchInterval: 30_000,
  });
  const txQ = useQuery({
    queryKey: ['bank', 'transactions'],
    queryFn: () => bankApi.transactions({ limit: 40 }),
  });

  const cash = bankQ.data?.cash ?? character?.cash ?? 0;
  const bankBal = bankQ.data?.bank_balance ?? character?.bank_balance ?? 0;
  const loans = bankQ.data?.loans?.filter((l) => l.status !== 'paid' && l.remaining > 0) ?? [];
  const txCount = txQ.data?.length ?? 0;

  return (
    <HubPageShell
      title="Bank"
      Icon={Landmark}
    >
      <LockBanner />
      <SysHubGrid>
        <SysHubCard
          to="/bank/cash"
          title="Cash desk"
          blurb={`Cash ${money(cash)} · bank ${money(bankBal)}`}
          cta="Move money"
          Icon={Wallet}
          tone="green"
        />
        <SysHubCard
          to="/bank/loans"
          title="Loans"
          blurb={
            loans.length === 0
              ? 'No open loans'
              : `${loans.length} open loan${loans.length === 1 ? '' : 's'}`
          }
          cta="Loan desk"
          Icon={PiggyBank}
          tone="amber"
        />
        <SysHubCard
          to="/bank/transfer"
          title="Transfer"
          blurb="Send to another account"
          cta="Send funds"
          Icon={ArrowLeftRight}
          tone="blue"
        />
        <SysHubCard
          to="/bank/ledger"
          title="Ledger"
          blurb={
            txCount === 0
              ? 'No postings'
              : `${txCount} recent posting${txCount === 1 ? '' : 's'}`
          }
          cta="View ledger"
          Icon={Receipt}
          tone="slate"
        />
      </SysHubGrid>
    </HubPageShell>
  );
}
