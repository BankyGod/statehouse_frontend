import { useQuery } from '@tanstack/react-query';
import { Building2, ClipboardList, FolderKanban } from 'lucide-react';
import { businessesApi } from '../api/endpoints';
import { LockBanner } from '../components/LockBanner';
import { HubPageShell, SysHubCard, SysHubGrid } from '../components/SysHub';
import { money } from '../lib/format';

export function BusinessHubPage() {
  const meQ = useQuery({
    queryKey: ['businesses', 'me'],
    queryFn: () => businessesApi.me(),
    refetchInterval: 45_000,
  });

  const count = meQ.data?.length ?? 0;
  const active = meQ.data?.filter((b) => b.status === 'active').length ?? 0;
  const treasury = meQ.data?.reduce((sum, b) => sum + (b.cash_balance || 0), 0) ?? 0;

  return (
    <HubPageShell title="Business" Icon={Building2}>
      <LockBanner />
      <SysHubGrid>
        <SysHubCard
          to="/business/register"
          title="Register"
          blurb="New company filing"
          cta="Open form"
          Icon={ClipboardList}
          tone="green"
        />
        <SysHubCard
          to="/business/mine"
          title="My businesses"
          blurb={
            count === 0
              ? 'No companies on file'
              : `${count} compan${count === 1 ? 'y' : 'ies'} · ${active} active · ${money(treasury)} in treasuries`
          }
          cta="View portfolio"
          Icon={FolderKanban}
          tone="blue"
        />
      </SysHubGrid>
    </HubPageShell>
  );
}
