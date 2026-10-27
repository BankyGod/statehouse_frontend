import { useQuery } from '@tanstack/react-query';
import { Flag, Inbox, Swords, Users } from 'lucide-react';
import { socialApi } from '../api/endpoints';
import { LockBanner } from '../components/LockBanner';
import { HubPageShell, SysHubCard, SysHubGrid } from '../components/SysHub';
import { useAuth } from '../context/AuthContext';

export function SocialHubPage() {
  const { character } = useAuth();
  const relQ = useQuery({
    queryKey: ['social', 'relations'],
    queryFn: () => socialApi.relations(),
  });
  const eventsQ = useQuery({
    queryKey: ['social', 'events'],
    queryFn: () => socialApi.events(),
  });
  const factionsQ = useQuery({
    queryKey: ['social', 'factions'],
    queryFn: () => socialApi.factions(),
  });

  const friends = relQ.data?.friends?.length ?? 0;
  const enemies = relQ.data?.enemies?.length ?? 0;
  const pending = relQ.data?.pending?.length ?? 0;
  const events = eventsQ.data?.length ?? 0;
  const factions = factionsQ.data?.length ?? 0;

  return (
    <HubPageShell title="Social" Icon={Users}>
      <LockBanner />
      <SysHubGrid>
        <SysHubCard
          to="/social/relations"
          title="Relations"
          blurb={
            pending > 0
              ? `${friends} friends · ${enemies} enemies · ${pending} pending`
              : `${friends} friends · ${enemies} enemies`
          }
          cta="Open relations"
          Icon={Swords}
          tone="rose"
        />
        <SysHubCard
          to="/social/factions"
          title="Factions"
          blurb={
            character?.faction_id != null
              ? `Faction #${character.faction_id} · ${factions} listed`
              : `${factions} faction${factions === 1 ? '' : 's'}`
          }
          cta="Faction desk"
          Icon={Flag}
          tone="amber"
        />
        <SysHubCard
          to="/social/events"
          title="World events"
          blurb={
            events === 0
              ? 'No active events'
              : `${events} active event${events === 1 ? '' : 's'}`
          }
          cta="View events"
          Icon={Users}
          tone="blue"
        />
        <SysHubCard
          to="/inbox"
          title="Inbox"
          blurb="Mail and job offers"
          cta="Open inbox"
          Icon={Inbox}
          tone="teal"
        />
      </SysHubGrid>
    </HubPageShell>
  );
}
