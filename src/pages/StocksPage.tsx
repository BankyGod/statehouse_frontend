import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CandlestickChart, CircleDollarSign, Search, TrendingUp } from 'lucide-react';
import { businessesApi, stocksApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { ErrorNotice } from '../components/ErrorNotice';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import { loadHistory, recordPrice, type PricePoint } from '../lib/stockHistory';
import { StockChart } from '../components/StockChart';

type MarketFilter = 'all' | 'booming' | 'held';

export function StocksPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked =
    !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [chartPoints, setChartPoints] = useState<PricePoint[]>([]);
  const [qty, setQty] = useState('1');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MarketFilter>('all');
  const [ipoBusinessId, setIpoBusinessId] = useState('');
  const [ipoSymbol, setIpoSymbol] = useState('');
  const [ipoShares, setIpoShares] = useState('5000');
  const [ipoPrice, setIpoPrice] = useState('10');
  const [founderPct, setFounderPct] = useState('0.4');
  const [orderShares, setOrderShares] = useState('1');
  const [orderPrice, setOrderPrice] = useState('');

  const marketQ = useQuery({
    queryKey: ['stocks', 'market'],
    queryFn: () => stocksApi.market(),
    refetchInterval: 8_000,
  });

  const portQ = useQuery({
    queryKey: ['stocks', 'portfolio'],
    queryFn: () => stocksApi.portfolio(),
    refetchInterval: 30_000,
  });

  const ordersQ = useQuery({
    queryKey: ['stocks', 'orders'],
    queryFn: () => stocksApi.orders(),
    refetchInterval: 15_000,
  });

  const bizQ = useQuery({
    queryKey: ['businesses', 'me'],
    queryFn: () => businessesApi.me(),
  });

  async function refreshMoney() {
    await qc.invalidateQueries({ queryKey: ['stocks'] });
    await qc.invalidateQueries({ queryKey: ['bank'] });
    void refreshCharacter();
  }

  const buyMut = useMutation({
    mutationFn: ({ id, shares }: { id: number; shares: number }) => stocksApi.buy(id, shares),
    onSuccess: async (res) => {
      toast.push(typeof res.message === 'string' ? res.message : 'Shares purchased.', 'ok');
      await refreshMoney();
    },
    onError: (err) => toast.pushError(err),
  });

  const sellMut = useMutation({
    mutationFn: ({ id, shares }: { id: number; shares: number }) => stocksApi.sell(id, shares),
    onSuccess: async (res) => {
      toast.push(typeof res.message === 'string' ? res.message : 'Shares sold.', 'ok');
      await refreshMoney();
    },
    onError: (err) => toast.pushError(err),
  });

  const ipoMut = useMutation({
    mutationFn: () =>
      stocksApi.ipo({
        business_id: Number(ipoBusinessId),
        symbol: ipoSymbol.trim().toUpperCase(),
        total_shares: Number(ipoShares),
        ipo_price: Number(ipoPrice),
        founder_keep_pct: Number(founderPct),
      }),
    onSuccess: async (listing) => {
      toast.push(`Listed ${listing.symbol} at ${money(listing.share_price)}.`, 'ok');
      setIpoSymbol('');
      await refreshMoney();
    },
    onError: (err) => toast.pushError(err),
  });

  const placeOrderMut = useMutation({
    mutationFn: ({
      listing_id,
      shares,
      price_each,
    }: {
      listing_id: number;
      shares: number;
      price_each: number;
    }) => stocksApi.placeOrder(listing_id, shares, price_each),
    onSuccess: async (res) => {
      toast.push(`Sell order #${res.order_id} for ${res.symbol}.`, 'ok');
      await refreshMoney();
    },
    onError: (err) => toast.pushError(err),
  });

  const fillOrderMut = useMutation({
    mutationFn: ({ order_id, shares }: { order_id: number; shares: number }) =>
      stocksApi.fillOrder(order_id, shares),
    onSuccess: async () => {
      toast.push('Order filled.', 'ok');
      await refreshMoney();
    },
    onError: (err) => toast.pushError(err),
  });

  const listings = marketQ.data?.listings ?? [];
  const holdings = portQ.data?.holdings ?? [];
  const activeBiz = (bizQ.data ?? []).filter((b) => b.status === 'active');
  const heldByListing = useMemo(
    () => new Map(holdings.map((h) => [h.listing_id, h])),
    [holdings],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings
      .filter((l) => {
        if (filter === 'booming' && !l.is_booming) return false;
        if (filter === 'held' && !heldByListing.has(l.id)) return false;
        if (!q) return true;
        return (
          l.symbol.toLowerCase().includes(q) ||
          l.name.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [listings, query, filter, heldByListing]);

  useEffect(() => {
    if (selectedId == null && listings.length) setSelectedId(listings[0].id);
  }, [listings, selectedId]);

  useEffect(() => {
    if (selectedId == null) return;
    if (!listings.some((l) => l.id === selectedId) && filtered[0]) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, listings, selectedId]);

  useEffect(() => {
    if (selectedId == null) return;
    const listing = listings.find((l) => l.id === selectedId);
    if (!listing) return;
    setChartPoints(recordPrice(listing.id, listing.share_price, { minIntervalMs: 5_000 }));
  }, [listings, selectedId, marketQ.dataUpdatedAt]);

  useEffect(() => {
    if (selectedId == null) return;
    setChartPoints(loadHistory(selectedId));
  }, [selectedId]);

  useEffect(() => {
    for (const l of listings) {
      recordPrice(l.id, l.share_price, { minIntervalMs: 8_000 });
    }
  }, [listings, marketQ.dataUpdatedAt]);

  const selected = listings.find((l) => l.id === selectedId) ?? null;
  const heldSelected = selected ? heldByListing.get(selected.id) : undefined;

  function parseQty(): number | null {
    const n = Number(qty);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  }

  function onIpo(e: FormEvent) {
    e.preventDefault();
    if (!ipoBusinessId) return toast.push('Pick a business.', 'err');
    if (ipoSymbol.trim().length < 2) return toast.push('Symbol needs 2–8 letters.', 'err');
    ipoMut.mutate();
  }

  function deltaFor(id: number, price: number) {
    const hist = loadHistory(id);
    const prev = hist.length > 1 ? hist[hist.length - 2].price : price;
    return price - prev;
  }

  return (
    <div>
      <header className="page-header">
        <h1>
          <CandlestickChart size={26} aria-hidden /> Stocks
        </h1>
        <p className="lede">
          Live chart + searchable market board. Select a ticker, then buy or sell below the chart.
        </p>
      </header>

      <div className="stocks-board">
        <div className="stocks-board-main">
          {selected ? (
            <StockChart
              symbol={selected.symbol}
              name={selected.name}
              points={chartPoints}
              livePrice={selected.share_price}
              booming={selected.is_booming}
            />
          ) : (
            <p className="muted">No listings yet.</p>
          )}

          {selected && (
            <div className="stock-trade-bar panel">
              <div>
                <strong>{selected.symbol}</strong>
                <span className="muted">
                  {' '}
                  · {money(selected.share_price)}
                  {heldSelected ? ` · you hold ${heldSelected.shares}` : ''}
                </span>
              </div>
              <label className="stock-trade-qty">
                Qty
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  disabled={locked}
                />
              </label>
              <button
                type="button"
                className="btn primary sm"
                disabled={locked || buyMut.isPending}
                onClick={() => {
                  const n = parseQty();
                  if (n == null) return toast.push('Enter shares.', 'err');
                  buyMut.mutate({ id: selected.id, shares: n });
                }}
              >
                Buy
              </button>
              <button
                type="button"
                className="btn danger sm"
                disabled={locked || sellMut.isPending || !heldSelected}
                onClick={() => {
                  const n = parseQty();
                  if (n == null) return toast.push('Enter shares.', 'err');
                  sellMut.mutate({ id: selected.id, shares: n });
                }}
              >
                Sell
              </button>
            </div>
          )}
        </div>

        <aside className="stocks-board-side">
          <div className="stocks-side-head">
            <span>Tickers</span>
            <span className="muted sm">{listings.length}</span>
          </div>
          <div className="stocks-side-list">
            {listings.map((l) => {
              const d = deltaFor(l.id, l.share_price);
              return (
                <button
                  key={l.id}
                  type="button"
                  className={`stock-side-item ${l.id === selectedId ? 'active' : ''} ${d >= 0 ? 'up' : 'down'}`}
                  onClick={() => setSelectedId(l.id)}
                >
                  <strong>{l.symbol}</strong>
                  <span>{money(l.share_price)}</span>
                  <em>
                    {d >= 0 ? '+' : ''}
                    {d.toFixed(2)}
                  </em>
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      <section className="panel">
        <h2>
          <TrendingUp size={18} aria-hidden /> Portfolio
        </h2>
        {portQ.isLoading && <p className="muted">Loading…</p>}
        {!holdings.length && !portQ.isLoading && <p className="muted">No holdings yet.</p>}
        <div className="list-table">
          {holdings.map((h) => (
            <div key={h.listing_id} className="list-row">
              <button
                type="button"
                className="stock-row-select"
                onClick={() => setSelectedId(h.listing_id)}
              >
                <strong>
                  {h.symbol}
                  {h.name ? ` · ${h.name}` : ''}
                </strong>
                <p className="muted">
                  {h.shares} shares
                  {h.avg_cost != null ? ` · avg ${money(h.avg_cost)}` : ''}
                  {h.share_price != null ? ` · mkt ${money(h.share_price)}` : ''}
                  {h.market_value != null ? ` · value ${money(h.market_value)}` : ''}
                </p>
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="row-between" style={{ marginBottom: '0.65rem' }}>
          <h2 style={{ margin: 0 }}>
            <CircleDollarSign size={18} aria-hidden /> Market
          </h2>
          <span className="muted sm">
            {filtered.length} / {listings.length} shown
          </span>
        </div>

        <div className="stock-market-tools">
          <label className="stock-search">
            <Search size={14} aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search symbol or name…"
            />
          </label>
          <div className="stock-filters">
            {(
              [
                ['all', 'All'],
                ['booming', 'Booming'],
                ['held', 'Held'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`btn sm ${filter === id ? 'primary' : 'ghost'}`}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {marketQ.isLoading && <p>Loading listings…</p>}
        {marketQ.isError && <ErrorNotice error={marketQ.error} />}
        {!filtered.length && !marketQ.isLoading && (
          <p className="muted">No listings match that filter.</p>
        )}

        <div className="stock-table-wrap">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Price</th>
                <th>Chg</th>
                <th>Float</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const d = deltaFor(l.id, l.share_price);
                const held = heldByListing.get(l.id)?.shares;
                return (
                  <tr
                    key={l.id}
                    className={l.id === selectedId ? 'active' : undefined}
                    onClick={() => setSelectedId(l.id)}
                  >
                    <td>
                      <strong>{l.symbol}</strong>
                      {l.is_booming && <span className="badge active">Hot</span>}
                      {held != null && <span className="badge">×{held}</span>}
                    </td>
                    <td>{l.name}</td>
                    <td className="num">{money(l.share_price)}</td>
                    <td className={`num ${d >= 0 ? 'cash' : 'danger-text'}`}>
                      {d >= 0 ? '+' : ''}
                      {d.toFixed(2)}
                    </td>
                    <td className="num muted">{l.float_shares.toLocaleString()}</td>
                    <td className="muted">{l.issuer_type}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Limit sell orders</h2>
        <p className="muted">List held shares at your price, or fill someone else’s order.</p>
        {selected && heldSelected && (
          <form
            className="inline-form stack-form"
            onSubmit={(e) => {
              e.preventDefault();
              const shares = Number(orderShares);
              const price = Number(orderPrice || selected.share_price);
              if (!Number.isFinite(shares) || shares <= 0) return toast.push('Shares required.', 'err');
              if (!Number.isFinite(price) || price <= 0) return toast.push('Price required.', 'err');
              placeOrderMut.mutate({
                listing_id: selected.id,
                shares: Math.floor(shares),
                price_each: price,
              });
            }}
          >
            <p className="muted">
              Selected {selected.symbol} · you hold {heldSelected.shares}
            </p>
            <div className="inline-form">
              <label>
                Shares
                <input
                  type="number"
                  min={1}
                  value={orderShares}
                  onChange={(e) => setOrderShares(e.target.value)}
                  disabled={locked}
                />
              </label>
              <label>
                Price each
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder={String(selected.share_price)}
                  value={orderPrice}
                  onChange={(e) => setOrderPrice(e.target.value)}
                  disabled={locked}
                />
              </label>
            </div>
            <button
              type="submit"
              className="btn primary"
              disabled={locked || placeOrderMut.isPending}
            >
              Place sell order
            </button>
          </form>
        )}
        {!heldSelected && <p className="muted">Select a held ticker to place a sell order.</p>}
        <div className="play-list" style={{ marginTop: '0.75rem' }}>
          {!ordersQ.data?.length && <p className="muted">No open sell orders.</p>}
          {ordersQ.data?.map((o) => (
            <article key={o.order_id} className="play-row">
              <div className="play-row-main">
                <div className="play-row-title">
                  <strong>{o.symbol}</strong>
                  <span className="badge">#{o.order_id}</span>
                </div>
                <div className="play-row-meta">
                  <span>{o.shares_remaining} shares</span>
                  <span className="cash">{money(o.price_each)}</span>
                  <span className="muted sm">seller #{o.seller_id}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn"
                disabled={
                  locked ||
                  fillOrderMut.isPending ||
                  o.seller_id === character?.id
                }
                onClick={() =>
                  fillOrderMut.mutate({ order_id: o.order_id, shares: o.shares_remaining })
                }
              >
                Fill
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>IPO your business</h2>
        {!activeBiz.length && (
          <p className="muted">You need an active business before listing shares.</p>
        )}
        {!!activeBiz.length && (
          <form className="stack-form" onSubmit={onIpo}>
            <label>
              Business
              <select
                value={ipoBusinessId}
                onChange={(e) => setIpoBusinessId(e.target.value)}
                required
                disabled={locked}
              >
                <option value="">Select…</option>
                {activeBiz.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (#{b.id})
                  </option>
                ))}
              </select>
            </label>
            <div className="inline-form">
              <label>
                Symbol
                <input
                  value={ipoSymbol}
                  onChange={(e) => setIpoSymbol(e.target.value.toUpperCase())}
                  minLength={2}
                  maxLength={8}
                  required
                  disabled={locked}
                />
              </label>
              <label>
                Total shares
                <input
                  type="number"
                  min={1000}
                  max={100000}
                  value={ipoShares}
                  onChange={(e) => setIpoShares(e.target.value)}
                  required
                  disabled={locked}
                />
              </label>
              <label>
                IPO price
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={ipoPrice}
                  onChange={(e) => setIpoPrice(e.target.value)}
                  required
                  disabled={locked}
                />
              </label>
              <label>
                Founder keep (0.1–0.7)
                <input
                  type="number"
                  min={0.1}
                  max={0.7}
                  step={0.05}
                  value={founderPct}
                  onChange={(e) => setFounderPct(e.target.value)}
                  disabled={locked}
                />
              </label>
            </div>
            <button type="submit" className="btn primary" disabled={locked || ipoMut.isPending}>
              {ipoMut.isPending ? 'Listing…' : 'Launch IPO'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
