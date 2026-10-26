import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, MapPin, Users } from 'lucide-react';
import { businessesApi, statesApi } from '../api/endpoints';
import { ErrorNotice } from '../components/ErrorNotice';
import { LockBanner } from '../components/LockBanner';
import { Timer } from '../components/Timer';
import { useAuth } from '../context/AuthContext';
import { sectorLabel } from '../lib/businessCatalog';
import { money } from '../lib/format';
import type { Business } from '../types/api';

export function BusinessMinePage() {
  const { refreshCharacter } = useAuth();

  const meQ = useQuery({
    queryKey: ['businesses', 'me'],
    queryFn: () => businessesApi.me(),
    refetchInterval: 30_000,
  });

  const statesQ = useQuery({
    queryKey: ['states'],
    queryFn: () => statesApi.list(),
  });

  const stateName = (id: number) => statesQ.data?.find((s) => s.id === id)?.name ?? `#${id}`;

  return (
    <div className="play-page">
      <header className="page-header compact">
        <p className="biz-crumb">
          <Link to="/business">Business</Link>
          <span aria-hidden> / </span>
          My businesses
        </p>
        <h1>
          <Building2 size={22} aria-hidden /> My businesses
        </h1>
        <p className="lede">Open a company card to manage treasury, staff, and stock.</p>
      </header>

      <LockBanner />

      <div className="row-between" style={{ marginBottom: '0.85rem' }}>
        <Link to="/business" className="btn ghost sm">
          <ArrowLeft size={14} aria-hidden /> Hub
        </Link>
        <Link to="/business/register" className="btn primary sm">
          Register new
        </Link>
      </div>

      {meQ.isError && <ErrorNotice error={meQ.error} />}
      {meQ.isLoading && <p className="muted">Loading companies…</p>}
      {!meQ.isLoading && !meQ.data?.length && (
        <section className="panel">
          <p className="muted">No companies yet.</p>
          <Link to="/business/register" className="btn primary">
            Register your first company
          </Link>
        </section>
      )}

      <div className="biz-company-grid">
        {meQ.data?.map((b) => (
          <CompanyCard
            key={b.id}
            business={b}
            stateLabel={stateName(b.state_id)}
            onTimer={() => {
              void meQ.refetch();
              void refreshCharacter();
            }}
          />
        ))}
      </div>
    </div>
  );
}

function CompanyCard({
  business: b,
  stateLabel,
  onTimer,
}: {
  business: Business;
  stateLabel: string;
  onTimer: () => void;
}) {
  const pending = b.status !== 'active' && !!b.registration_completes_at;

  return (
    <Link to={`/business/${b.id}`} className={`biz-company-card status-${b.status}`}>
      <div className="biz-company-stripe" aria-hidden />
      <div className="biz-company-top">
        <h2>{b.name}</h2>
        <span className={`badge ${b.status === 'active' ? 'active' : 'pending'}`}>{b.status}</span>
      </div>
      <p className="biz-company-sector">{sectorLabel(b.sector)}</p>
      <ul className="biz-company-meta">
        <li>
          <MapPin size={13} aria-hidden /> {stateLabel}
        </li>
        <li>
          <Users size={13} aria-hidden /> {b.employee_count ?? 0} staff
        </li>
        <li className="cash">{money(b.cash_balance)}</li>
      </ul>
      {pending && (
        <p className="muted sm">
          Active in{' '}
          <Timer completesAt={b.registration_completes_at} onComplete={onTimer} />
        </p>
      )}
      <span className="biz-company-cta">Manage company →</span>
    </Link>
  );
}
