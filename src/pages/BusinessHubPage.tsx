import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, ClipboardList, FolderKanban } from 'lucide-react';
import { businessesApi } from '../api/endpoints';
import { LockBanner } from '../components/LockBanner';
import { money } from '../lib/format';

export function BusinessHubPage() {
  const meQ = useQuery({
    queryKey: ['businesses', 'me'],
    queryFn: () => businessesApi.me(),
    refetchInterval: 45_000,
  });

  const count = meQ.data?.length ?? 0;
  const active = meQ.data?.filter((b) => b.status === 'active').length ?? 0;
  const treasury = meQ.data?.reduce((sum, b) => sum + (b.cash_balance || 0), 0) ?? 0;

  return (
    <div className="play-page">
      <header className="page-header compact">
        <h1>
          <Building2 size={22} aria-hidden /> Business
        </h1>
        <p className="lede">
          Register a company or open one of yours to hire staff, move cash, and list stock.
        </p>
      </header>

      <LockBanner />

      <div className="biz-hub-grid">
        <Link to="/business/register" className="biz-hub-card register">
          <div className="biz-hub-icon" aria-hidden>
            <ClipboardList size={28} />
          </div>
          <div className="biz-hub-body">
            <h2>Register</h2>
            <p>Start a new company — pick sector, entity type, state, and seed capital.</p>
          </div>
          <span className="biz-hub-go">
            Open form <ArrowRight size={16} aria-hidden />
          </span>
        </Link>

        <Link to="/business/mine" className="biz-hub-card mine">
          <div className="biz-hub-icon" aria-hidden>
            <FolderKanban size={28} />
          </div>
          <div className="biz-hub-body">
            <h2>My businesses</h2>
            <p>
              {count === 0
                ? 'No companies yet — register one to begin.'
                : `${count} compan${count === 1 ? 'y' : 'ies'} · ${active} active · ${money(treasury)} in treasuries`}
            </p>
          </div>
          <span className="biz-hub-go">
            View portfolio <ArrowRight size={16} aria-hidden />
          </span>
        </Link>
      </div>
    </div>
  );
}
