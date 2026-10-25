import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, ShoppingBag, Store } from 'lucide-react';
import { inventoryApi } from '../api/endpoints';
import { ErrorNotice } from '../components/ErrorNotice';
import { LockBanner } from '../components/LockBanner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';

export function InventoryPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked = !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [sellKey, setSellKey] = useState('');
  const [sellQty, setSellQty] = useState('1');
  const [sellPrice, setSellPrice] = useState('40');
  const [sellNote, setSellNote] = useState('');

  const invQ = useQuery({ queryKey: ['inventory', 'me'], queryFn: () => inventoryApi.me() });
  const shopQ = useQuery({ queryKey: ['inventory', 'shop'], queryFn: () => inventoryApi.shop() });
  const marketQ = useQuery({
    queryKey: ['inventory', 'market'],
    queryFn: () => inventoryApi.market(),
    refetchInterval: 30_000,
  });

  async function refreshAll() {
    await qc.invalidateQueries({ queryKey: ['inventory'] });
    await qc.invalidateQueries({ queryKey: ['activities'] });
    void refreshCharacter();
  }

  const buyMut = useMutation({
    mutationFn: ({ key, qty }: { key: string; qty: number }) => inventoryApi.buyShop(key, qty),
    onSuccess: async (res) => {
      toast.push(`Bought ${res.quantity}× ${res.item_key} for ${money(res.spent)}.`, 'ok');
      await refreshAll();
    },
    onError: (err) => toast.pushError(err),
  });

  const useMut = useMutation({
    mutationFn: (key: string) => inventoryApi.use(key),
    onSuccess: async (res) => {
      toast.push(res.message, 'ok');
      await refreshAll();
    },
    onError: (err) => toast.pushError(err),
  });

  const marketBuyMut = useMutation({
    mutationFn: (id: number) => inventoryApi.buyMarket(id, 1),
    onSuccess: async () => {
      toast.push('Market purchase complete.', 'ok');
      await refreshAll();
    },
    onError: (err) => toast.pushError(err),
  });

  const sellMut = useMutation({
    mutationFn: () =>
      inventoryApi.sellMarket({
        item_key: sellKey,
        quantity: Number(sellQty),
        price_each: Number(sellPrice),
        note: sellNote.trim() || null,
      }),
    onSuccess: async (res) => {
      toast.push(`Listed ${res.quantity}× ${res.item_key} @ ${money(res.price_each)}.`, 'ok');
      setSellNote('');
      await refreshAll();
    },
    onError: (err) => toast.pushError(err),
  });

  function onSell(e: FormEvent) {
    e.preventDefault();
    if (!sellKey) return toast.push('Pick an item to sell.', 'err');
    sellMut.mutate();
  }

  return (
    <div className="play-page">
      <header className="page-header compact">
        <h1>
          <Package size={22} aria-hidden /> Inventory
        </h1>
        <p className="lede">
          Shop, bag, and player market. Cash {money(character?.cash ?? 0)}.
        </p>
      </header>

      <LockBanner />

      <section className="play-section">
        <h2>
          <ShoppingBag size={16} aria-hidden /> Your bag
        </h2>
        {invQ.isError && <ErrorNotice error={invQ.error} />}
        {!invQ.data?.length && !invQ.isLoading && <p className="muted">Empty.</p>}
        <div className="play-list">
          {invQ.data?.map((item) => (
            <article key={item.id} className="play-row">
              <div className="play-row-main">
                <div className="play-row-title">
                  <strong>{item.name}</strong>
                  <span className="badge">×{item.quantity}</span>
                  <span className="badge">{item.kind}</span>
                </div>
                <p className="muted play-row-desc">{item.description}</p>
              </div>
              {item.kind === 'consumable' && (
                <button
                  type="button"
                  className="btn primary"
                  disabled={locked || useMut.isPending}
                  onClick={() => useMut.mutate(item.item_key)}
                >
                  Use
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="play-section">
        <h2>
          <Store size={16} aria-hidden /> Shop
        </h2>
        {shopQ.isLoading && <p className="muted">Loading shop…</p>}
        {shopQ.isError && <ErrorNotice error={shopQ.error} />}
        <div className="play-list">
          {shopQ.data?.map((item) => (
            <article key={item.item_key} className="play-row">
              <div className="play-row-main">
                <div className="play-row-title">
                  <strong>{item.name}</strong>
                  <span className="badge">{item.kind}</span>
                </div>
                <p className="muted play-row-desc">{item.description}</p>
                <div className="play-row-meta">
                  <span className="cash">{money(item.shop_price)}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn"
                disabled={locked || buyMut.isPending}
                onClick={() => buyMut.mutate({ key: item.item_key, qty: 1 })}
              >
                Buy
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>List on market</h2>
        <form className="stack-form" onSubmit={onSell}>
          <label>
            Item
            <select
              value={sellKey}
              onChange={(e) => setSellKey(e.target.value)}
              required
              disabled={locked}
            >
              <option value="">Select…</option>
              {invQ.data?.map((i) => (
                <option key={i.id} value={i.item_key}>
                  {i.name} (×{i.quantity})
                </option>
              ))}
            </select>
          </label>
          <div className="inline-form">
            <label>
              Qty
              <input
                type="number"
                min={1}
                max={50}
                value={sellQty}
                onChange={(e) => setSellQty(e.target.value)}
                disabled={locked}
              />
            </label>
            <label>
              Price each
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                disabled={locked}
              />
            </label>
          </div>
          <label>
            Note <span className="muted">(optional)</span>
            <input value={sellNote} onChange={(e) => setSellNote(e.target.value)} disabled={locked} />
          </label>
          <button type="submit" className="btn primary" disabled={locked || sellMut.isPending}>
            {sellMut.isPending ? 'Listing…' : 'List for sale'}
          </button>
        </form>
      </section>

      <section className="play-section">
        <h2>Player market</h2>
        {!marketQ.data?.length && <p className="muted">No listings.</p>}
        <div className="play-list">
          {marketQ.data?.map((l) => (
            <article key={l.id} className="play-row">
              <div className="play-row-main">
                <div className="play-row-title">
                  <strong>{l.name}</strong>
                  <span className="badge">×{l.quantity}</span>
                </div>
                <div className="play-row-meta">
                  <span className="cash">{money(l.price_each)} each</span>
                  {l.note && <span className="muted">{l.note}</span>}
                  <span className="muted sm">seller #{l.seller_id}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn primary"
                disabled={locked || marketBuyMut.isPending || l.seller_id === character?.id}
                onClick={() => marketBuyMut.mutate(l.id)}
              >
                Buy
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
