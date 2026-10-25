const PREFIX = 'sh_stock_hist_v1:';
const MAX_POINTS = 240;

export type PricePoint = {
  t: number;
  price: number;
};

function key(listingId: number) {
  return `${PREFIX}${listingId}`;
}

export function loadHistory(listingId: number): PricePoint[] {
  try {
    const raw = localStorage.getItem(key(listingId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PricePoint[];
    return Array.isArray(parsed) ? parsed.filter((p) => p && typeof p.price === 'number') : [];
  } catch {
    return [];
  }
}

function saveHistory(listingId: number, points: PricePoint[]) {
  try {
    localStorage.setItem(key(listingId), JSON.stringify(points.slice(-MAX_POINTS)));
  } catch {
    /* ignore quota */
  }
}

/** Append a sample if price moved or enough time passed since last point. */
export function recordPrice(
  listingId: number,
  price: number,
  opts?: { minIntervalMs?: number; force?: boolean },
): PricePoint[] {
  const minInterval = opts?.minIntervalMs ?? 8_000;
  const prev = loadHistory(listingId);
  const now = Date.now();
  const last = prev[prev.length - 1];

  if (!last) {
    const seeded = [{ t: now - 60_000, price }, { t: now, price }];
    saveHistory(listingId, seeded);
    return seeded;
  }

  const moved = Math.abs(last.price - price) > 1e-9;
  const aged = now - last.t >= minInterval;
  if (!opts?.force && !moved && !aged) return prev;

  const next = [...prev, { t: now, price }];
  saveHistory(listingId, next);
  return next.slice(-MAX_POINTS);
}

export function historyStats(points: PricePoint[]) {
  if (!points.length) {
    return { open: 0, close: 0, high: 0, low: 0, change: 0, changePct: 0 };
  }
  const open = points[0].price;
  const close = points[points.length - 1].price;
  let high = open;
  let low = open;
  for (const p of points) {
    if (p.price > high) high = p.price;
    if (p.price < low) low = p.price;
  }
  const change = close - open;
  const changePct = open === 0 ? 0 : (change / open) * 100;
  return { open, close, high, low, change, changePct };
}
