import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, CandlestickChart, Factory } from 'lucide-react';
import { enterprisesApi, statesApi } from '../api/endpoints';
import { ErrorNotice } from '../components/ErrorNotice';
import { HubBack } from '../components/SysHub';

export function EnterprisesPage() {
  const listQ = useQuery({
    queryKey: ['enterprises'],
    queryFn: () => enterprisesApi.list(),
  });

  const statesQ = useQuery({
    queryKey: ['states'],
    queryFn: () => statesApi.list(),
  });

  const stateName = (id: number | null) => {
    if (id == null) return 'National';
    return statesQ.data?.find((s) => s.id === id)?.name ?? `State #${id}`;
  };

  return (
    <div className="play-page">
      <HubBack to="/nation" label="Nation" />
      <header className="page-header compact">
        <h1>
          <Factory size={22} aria-hidden /> State enterprises
        </h1>
      </header>

      {listQ.isLoading && <p className="muted">Loading enterprises…</p>}
      {listQ.isError && <ErrorNotice error={listQ.error} />}

      <div className="play-list">
        {listQ.data?.map((e) => (
          <article key={e.id} className="play-row">
            <div className="play-row-main">
              <div className="play-row-title">
                <strong>{e.name}</strong>
                <span className="badge active">Gov</span>
                <span className="badge">{e.kind.replaceAll('_', ' ')}</span>
                <span className="badge">{e.portfolio}</span>
              </div>
              {e.description && <p className="muted play-row-desc">{e.description}</p>}
              <div className="play-row-meta">
                <span>
                  <Building2 size={12} aria-hidden /> {stateName(e.home_state_id)}
                </span>
                {e.stock_symbol && (
                  <span className="cash">
                    <CandlestickChart size={12} aria-hidden /> {e.stock_symbol}
                  </span>
                )}
              </div>
            </div>
            {e.stock_symbol ? (
              <Link to="/stocks" className="btn sm">
                Trade
              </Link>
            ) : e.kind === 'university_system' ? (
              <Link to="/education" className="btn sm">
                Schools
              </Link>
            ) : (
              <Link to="/travel" className="btn sm ghost">
                Travel
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
