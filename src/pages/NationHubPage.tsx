import { useQuery } from '@tanstack/react-query';
import {
  BriefcaseBusiness,
  Building,
  Factory,
  FileBadge,
  Flag,
  Landmark,
  Scale,
  ScrollText,
} from 'lucide-react';
import { politicsApi } from '../api/endpoints';
import { LockBanner } from '../components/LockBanner';
import { HubPageShell, SysHubCard, SysHubGrid } from '../components/SysHub';
import { usePoliticalRoles } from '../hooks/usePoliticalRoles';

export function NationHubPage() {
  const { isPresident, isMp, mpSeat } = usePoliticalRoles();
  const parliamentQ = useQuery({
    queryKey: ['politics', 'parliament'],
    queryFn: () => politicsApi.parliament(),
  });

  const president = parliamentQ.data?.president?.name ?? '—';
  const officeHint = isPresident
    ? 'You are President'
    : isMp
      ? `You are MP${mpSeat ? ` · ${mpSeat.state_name}` : ''}`
      : `President: ${president}`;

  return (
    <HubPageShell
      title="Nation"
      Icon={Scale}
    >
      <LockBanner />
      <SysHubGrid>
        <SysHubCard
          to="/politics"
          title="Politics"
          blurb={officeHint}
          cta="Open politics"
          Icon={Scale}
          tone="blue"
        />
        <SysHubCard
          to="/parties"
          title="Parties"
          blurb="Political parties"
          cta="Party hall"
          Icon={Flag}
          tone="amber"
        />
        <SysHubCard
          to="/cabinet"
          title="Cabinet"
          blurb="Minister portfolios"
          cta="Cabinet room"
          Icon={BriefcaseBusiness}
          tone="green"
        />
        <SysHubCard
          to="/legislation"
          title="Laws"
          blurb="Bills and budgets"
          cta="Open chamber"
          Icon={ScrollText}
          tone="slate"
        />
        <SysHubCard
          to="/treasury"
          title="Treasury"
          blurb="National accounts"
          cta="Treasury desk"
          Icon={Landmark}
          tone="teal"
        />
        <SysHubCard
          to="/government"
          title="Civil service"
          blurb="Government posts"
          cta="Apply / serve"
          Icon={Building}
          tone="blue"
        />
        <SysHubCard
          to="/enterprises"
          title="Enterprises"
          blurb="State-owned firms"
          cta="View enterprises"
          Icon={Factory}
          tone="green"
        />
        <SysHubCard
          to="/permits"
          title="Permits"
          blurb="Work, business, travel"
          cta="Permits desk"
          Icon={FileBadge}
          tone="amber"
        />
      </SysHubGrid>
    </HubPageShell>
  );
}
