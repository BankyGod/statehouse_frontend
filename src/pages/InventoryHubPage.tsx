import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingBag, Store } from 'lucide-react';
import { inventoryApi } from '../api/endpoints';
import { LockBanner } from '../components/LockBanner';
import { HubPageShell, SysHubCard, SysHubGrid } from '../components/SysHub';

export function InventoryHubPage() {
  const invQ = useQuery({ queryKey: ['inventory', 'me'], queryFn: () => inventoryApi.me() });
  const shopQ = useQuery({ queryKey: ['inventory', 'shop'], queryFn: () => inventoryApi.shop() });
  const marketQ = useQuery({
    queryKey: ['inventory', 'market'],
    queryFn: () => inventoryApi.market(),
    refetchInterval: 30_000,
  });

  const bagCount = (invQ.data ?? []).reduce((s, i) => s + i.quantity, 0);
  const shopCount = shopQ.data?.length ?? 0;
  const marketCount = marketQ.data?.length ?? 0;

  return (
    <HubPageShell
      title="Inventory"
      Icon={Package}
    >
      <LockBanner />
      <SysHubGrid>
        <SysHubCard
          to="/inventory/bag"
          title="Your bag"
          blurb={
            bagCount === 0
              ? 'Empty'
              : `${bagCount} item${bagCount === 1 ? '' : 's'} on hand`
          }
          cta="Open bag"
          Icon={ShoppingBag}
          tone="teal"
        />
        <SysHubCard
          to="/inventory/shop"
          title="Shop"
          blurb={shopCount === 0 ? 'No stock' : `${shopCount} products`}
          cta="Browse shop"
          Icon={Store}
          tone="green"
        />
        <SysHubCard
          to="/inventory/market"
          title="Player market"
          blurb={
            marketCount === 0
              ? 'No listings'
              : `${marketCount} listing${marketCount === 1 ? '' : 's'}`
          }
          cta="Open market"
          Icon={Package}
          tone="amber"
        />
      </SysHubGrid>
    </HubPageShell>
  );
}
