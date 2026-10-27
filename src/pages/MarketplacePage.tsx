import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { businessesApi, statesApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { ErrorNotice } from '../components/ErrorNotice';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import { sectorLabel } from '../lib/businessCatalog';

export function MarketplacePage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked =
    !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const marketQ = useQuery({
    queryKey: ['businesses', 'marketplace', character?.current_state_id],
    queryFn: () =>
      businessesApi.marketplace({
        state_id: character?.current_state_id ?? undefined,
      }),
    enabled: !!character,
    refetchInterval: 20_000,
  });

  const statesQ = useQuery({
    queryKey: ['states'],
    queryFn: () => statesApi.list(),
  });

  const buyMut = useMutation({
    mutationFn: ({ business_id, sku }: { business_id: number; sku: string }) =>
      businessesApi.buyCommerce(business_id, sku, 1),
    onSuccess: async (res) => {
      const effects = Array.isArray(res.effects) ? res.effects.join(', ') : '';
      toast.push(
        `Bought — paid ${money(Number(res.paid ?? 0))}${effects ? ` · ${effects}` : ''}.`,
        'ok',
      );
      await qc.invalidateQueries({ queryKey: ['businesses', 'marketplace'] });
      void refreshCharacter();
    },
    onError: (err) => toast.pushError(err),
  });

  const bookMut = useMutation({
    mutationFn: ({ business_id, sku }: { business_id: number; sku: string }) =>
      businessesApi.bookCommerce(business_id, sku),
    onSuccess: async (res) => {
      const effects = Array.isArray(res.effects) ? res.effects.join(', ') : '';
      toast.push(
        `Booked ${String(res.label ?? 'service')}${effects ? ` · ${effects}` : ''}.`,
        'ok',
      );
      await qc.invalidateQueries({ queryKey: ['businesses', 'marketplace'] });
      void refreshCharacter();
    },
    onError: (err) => toast.pushError(err),
  });

  const stateName = (id: number) =>
    statesQ.data?.find((s) => s.id === id)?.name ?? `#${id}`;

  const products = marketQ.data?.products ?? [];
  const services = marketQ.data?.services ?? [];

  return (
    <div>
      <header className="page-header">
        <h1>
          <ShoppingBag size={26} aria-hidden /> Marketplace
        </h1>
        <p className="lede">
          Buy goods and book services from real player companies in your state. Sales tax funds the
          treasury; logistics and energy feed national enterprises.
        </p>
      </header>

      <p className="muted">
        Own a company? Stock it from{' '}
        <Link to="/business/mine">My businesses</Link> → Inventory desk.
      </p>

      {marketQ.isLoading && <p className="muted">Loading marketplace…</p>}
      {marketQ.isError && <ErrorNotice error={marketQ.error} />}

      <section className="panel">
        <h2>Goods for sale</h2>
        {!products.length && !marketQ.isLoading && (
          <p className="muted">No listed stock in this state yet.</p>
        )}
        <div className="list-table">
          {products.map((p) => (
            <div key={`${p.business_id}-${p.sku}`} className="list-row">
              <div>
                <strong>{String(p.label)}</strong>
                <p className="muted">
                  {String(p.business_name)} · {sectorLabel(String(p.sector))} ·{' '}
                  {stateName(Number(p.state_id))} · qty {Number(p.quantity)}
                </p>
              </div>
              <div className="list-meta">
                <strong className="cash">{money(Number(p.sell_price))}</strong>
                <button
                  type="button"
                  className="btn primary sm"
                  disabled={locked || buyMut.isPending}
                  onClick={() =>
                    buyMut.mutate({
                      business_id: Number(p.business_id),
                      sku: String(p.sku),
                    })
                  }
                >
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Bookable services</h2>
        {!services.length && !marketQ.isLoading && (
          <p className="muted">No service companies open here yet.</p>
        )}
        <div className="list-table">
          {services.map((s) => (
            <div key={`${s.business_id}-${s.sku}`} className="list-row">
              <div>
                <strong>{String(s.label)}</strong>
                <p className="muted">
                  {String(s.business_name)} · {sectorLabel(String(s.sector))} ·{' '}
                  {stateName(Number(s.state_id))}
                </p>
              </div>
              <div className="list-meta">
                <strong className="cash">{money(Number(s.price))}</strong>
                <button
                  type="button"
                  className="btn primary sm"
                  disabled={locked || bookMut.isPending}
                  onClick={() =>
                    bookMut.mutate({
                      business_id: Number(s.business_id),
                      sku: String(s.sku),
                    })
                  }
                >
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
