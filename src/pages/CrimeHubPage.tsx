import { Gavel, Skull } from 'lucide-react';
import { LockBanner } from '../components/LockBanner';
import { HubPageShell, SysHubCard, SysHubGrid } from '../components/SysHub';
import { useAuth } from '../context/AuthContext';

export function CrimeHubPage() {
  const { character } = useAuth();

  return (
    <HubPageShell
      title="Crime"
      Icon={Skull}
    >
      <LockBanner />
      <SysHubGrid>
        <SysHubCard
          to="/crime/streets"
          title="Streets"
          blurb={
            character?.is_jailed
              ? 'Currently jailed'
              : `Nerve ${character?.nerve ?? 0}/${character?.max_nerve ?? '—'} · heat ${Math.round(character?.heat ?? 0)}`
          }
          cta="Crime catalog"
          Icon={Skull}
          tone="rose"
        />
        <SysHubCard
          to="/jail"
          title="Jail desk"
          blurb={character?.is_jailed ? 'Bail and release status' : 'Not in custody'}
          cta="Open jail"
          Icon={Gavel}
          tone="amber"
        />
      </SysHubGrid>
    </HubPageShell>
  );
}
