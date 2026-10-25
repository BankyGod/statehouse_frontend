import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Map } from 'lucide-react';
import { statesApi } from '../api/endpoints';
import { StateCard } from '../components/StateCard';
import { getErrorDetail } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function StatesPage() {
  const { character } = useAuth();
  const statesQ = useQuery({
    queryKey: ['states'],
    queryFn: () => statesApi.list(),
  });

  return (
    <div>
      <header className="page-header">
        <h1>
          <Map size={26} aria-hidden /> States of United Amir
        </h1>
        <p className="lede">Twenty states. Home is identity — permits gate the rest.</p>
      </header>
      {statesQ.isLoading && <p>Loading…</p>}
      {statesQ.isError && <p className="err-text">{getErrorDetail(statesQ.error)}</p>}
      <div className="state-grid">
        {statesQ.data?.map((s) => (
          <Link key={s.id} to={`/states/${s.slug}`} className="state-link">
            <StateCard state={s} selected={s.id === character?.home_state_id} asLink />
            {s.id === character?.home_state_id && <span className="home-tag">Your home</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
