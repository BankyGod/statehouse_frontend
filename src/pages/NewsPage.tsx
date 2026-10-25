import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Newspaper } from 'lucide-react';
import { newsApi, statesApi } from '../api/endpoints';
import { getErrorDetail } from '../api/client';

export function NewsPage() {
  const [category, setCategory] = useState('');
  const [stateId, setStateId] = useState<number | ''>('');

  const statesQ = useQuery({
    queryKey: ['states'],
    queryFn: () => statesApi.list(),
  });

  const newsQ = useQuery({
    queryKey: ['news', category, stateId],
    queryFn: () =>
      newsApi.list({
        limit: 40,
        category: category || undefined,
        state_id: stateId === '' ? undefined : Number(stateId),
      }),
    refetchInterval: 45_000,
  });

  const stateName = (id: number | null) =>
    id == null
      ? 'National'
      : (statesQ.data?.find((s) => s.id === id)?.name ?? `#${id}`);

  return (
    <div>
      <header className="page-header">
        <h1>
          <Newspaper size={26} aria-hidden /> Newspaper
        </h1>
        <p className="lede">
          National and state headlines from elections, bills, budgets, and major events.
        </p>
      </header>

      <div className="inline-form" style={{ marginBottom: '1rem' }}>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All</option>
            <option value="politics">Politics</option>
            <option value="economy">Economy</option>
            <option value="crime">Crime</option>
            <option value="society">Society</option>
          </select>
        </label>
        <label>
          State
          <select
            value={stateId}
            onChange={(e) => setStateId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">National + all</option>
            {statesQ.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {newsQ.isLoading && <p>Loading headlines…</p>}
      {newsQ.isError && <p className="err-text">{getErrorDetail(newsQ.error)}</p>}
      {!newsQ.data?.length && !newsQ.isLoading && (
        <p className="muted">No stories yet.</p>
      )}

      <div className="news-feed">
        {newsQ.data?.map((n) => (
          <article key={n.id} className="news-card">
            <div className="news-meta">
              <span className="badge">{n.category}</span>
              <span className="muted sm">{stateName(n.state_id)}</span>
              <span className="muted sm">{new Date(n.published_at).toLocaleString()}</span>
            </div>
            <h2>{n.headline}</h2>
            <p>{n.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
