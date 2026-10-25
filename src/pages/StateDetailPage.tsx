import { ErrorNotice } from '../components/ErrorNotice';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { statesApi } from '../api/endpoints';
import { money, num, pct, securityLabel } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { getStateTheme } from '../lib/stateArt';

export function StateDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { character } = useAuth();

  const q = useQuery({
    queryKey: ['states', 'slug', slug],
    queryFn: () => statesApi.bySlug(slug!),
    enabled: !!slug,
  });

  if (q.isLoading) return <p>Loading…</p>;
  if (q.isError) return <ErrorNotice error={q.error} />;
  if (!q.data) return <p>Not found.</p>;

  const s = q.data;
  const isHome = character?.home_state_id === s.id;
  const theme = getStateTheme(s.slug);

  return (
    <div>
      <p>
        <Link to="/states" className="back-link">
          <ArrowLeft size={14} aria-hidden /> All states
        </Link>
      </p>

      <div
        className="state-hero"
        style={{ ['--state-accent' as string]: theme.accent }}
      >
        <div className="state-hero-art">{theme.scene}</div>
        <div className="state-hero-shade" />
        <div className="state-hero-copy">
          <span className="state-art-tag">{theme.label}</span>
          <h1>
            {s.name}
            {isHome && <span className="badge">Home</span>}
          </h1>
          <p>
            Capital <strong>{s.capital}</strong> · {s.economic_profile}
          </p>
        </div>
      </div>

      <dl className="detail-grid">
        <div>
          <dt>Citizens</dt>
          <dd>
            {num(s.population_total ?? s.population_count + (s.npc_population_count ?? 0))}
            {s.npc_population_count != null && (
              <span className="muted">
                {' '}
                ({num(s.population_count)} players · {num(s.npc_population_count)} NPCs)
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt>Player slots</dt>
          <dd>
            {num(s.population_count)} / {num(s.population_cap)}
            {!s.is_open && <span className="badge warn">Full</span>}
          </dd>
        </div>
        <div>
          <dt>Average income</dt>
          <dd>{money(s.average_income)}</dd>
        </div>
        <div>
          <dt>Starting bonus</dt>
          <dd className="cash">{money(s.starting_bonus)}</dd>
        </div>
        <div>
          <dt>Security</dt>
          <dd>
            {securityLabel(s.crime_catch_rate)} ({pct(s.crime_catch_rate)})
          </dd>
        </div>
        <div>
          <dt>Base tax</dt>
          <dd>{pct(s.base_tax_rate)}</dd>
        </div>
        <div>
          <dt>Permit fee ×</dt>
          <dd>{s.permit_fee_multiplier}</dd>
        </div>
        <div>
          <dt>Open</dt>
          <dd>{s.is_open ? 'Yes' : 'No'}</dd>
        </div>
        <div>
          <dt>MP</dt>
          <dd>{s.npc_mp_name ?? '—'}</dd>
        </div>
      </dl>
    </div>
  );
}
