import { useQuery } from '@tanstack/react-query';
import { HandHelping, Home, KeyRound, Search } from 'lucide-react';
import { housingApi } from '../api/endpoints';
import { LockBanner } from '../components/LockBanner';
import { HubPageShell, SysHubCard, SysHubGrid } from '../components/SysHub';
import { useAuth } from '../context/AuthContext';

export function HousingHubPage() {
  const { character } = useAuth();
  const meQ = useQuery({
    queryKey: ['housing', 'me'],
    queryFn: () => housingApi.me(),
    refetchInterval: 30_000,
  });

  const housed = !!meQ.data && !character?.is_homeless;

  return (
    <HubPageShell
      title="Housing"
      Icon={Home}
      lede={character?.is_homeless ? 'No fixed address on file.' : undefined}
    >
      <LockBanner />
      <SysHubGrid>
        <SysHubCard
          to="/housing/residence"
          title="My residence"
          blurb={
            housed
              ? `Housed · ${meQ.data?.tenure ?? '—'}`
              : 'No active residence'
          }
          cta="Open residence"
          Icon={KeyRound}
          tone="blue"
        />
        <SysHubCard
          to="/housing/listings"
          title="Find a place"
          blurb="Rent and sale listings"
          cta="Browse listings"
          Icon={Search}
          tone="green"
        />
        <SysHubCard
          to="/housing/assist"
          title="Welfare assist"
          blurb="Housing assistance"
          cta="Ask for help"
          Icon={HandHelping}
          tone="amber"
        />
      </SysHubGrid>
    </HubPageShell>
  );
}
