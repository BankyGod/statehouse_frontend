import { ErrorNotice } from '../components/ErrorNotice';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Landmark, Scale, Trophy, Vote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { politicsApi, statesApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Candidacy, RaceType } from '../types/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { HubBack } from '../components/SysHub';
import { usePoliticalRoles } from '../hooks/usePoliticalRoles';

export function PoliticsPage() {
  const { character } = useAuth();
  const { isPresident, isMp, mpSeat, parliamentQ } = usePoliticalRoles();
  const toast = useToast();
  const qc = useQueryClient();
  const locked =
    !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [raceType, setRaceType] = useState<RaceType>('mp');
  const [slogan, setSlogan] = useState('A better United Amir');
  const [filterRace, setFilterRace] = useState<string>('');
  const [voteTarget, setVoteTarget] = useState<Candidacy | null>(null);
  const [resolveOpen, setResolveOpen] = useState(false);

  const electionQ = useQuery({
    queryKey: ['politics', 'election', 'current'],
    queryFn: () => politicsApi.currentElection(),
    refetchInterval: 30_000,
  });

  const election = electionQ.data?.election ?? null;
  const electionId = election?.id;

  const statesQ = useQuery({
    queryKey: ['states'],
    queryFn: () => statesApi.list(),
  });

  const candidatesQ = useQuery({
    queryKey: ['politics', 'candidates', electionId, filterRace],
    queryFn: () =>
      politicsApi.candidates(electionId!, {
        race_type: filterRace || undefined,
      }),
    enabled: electionId != null,
  });

  const runMut = useMutation({
    mutationFn: () => politicsApi.run(electionId!, raceType, slogan.trim()),
    onSuccess: async () => {
      toast.push(`Registered for ${raceType}.`, 'ok');
      await qc.invalidateQueries({ queryKey: ['politics'] });
    },
    onError: (err) => toast.pushError(err),
  });

  const voteMut = useMutation({
    mutationFn: (candidacy_id: number) => politicsApi.vote(electionId!, candidacy_id),
    onSuccess: async (res) => {
      toast.push(typeof res.message === 'string' ? res.message : 'Vote cast.', 'ok');
      setVoteTarget(null);
      await qc.invalidateQueries({ queryKey: ['politics'] });
    },
    onError: (err) => toast.pushError(err),
  });

  const resolveMut = useMutation({
    mutationFn: () => politicsApi.resolve(electionId!),
    onSuccess: async (res) => {
      toast.push(typeof res.message === 'string' ? res.message : 'Election resolved.', 'ok');
      setResolveOpen(false);
      await qc.invalidateQueries({ queryKey: ['politics'] });
    },
    onError: (err) => toast.pushError(err),
  });

  const stateName = (id: number | null) =>
    id == null
      ? 'National'
      : (statesQ.data?.find((s) => s.id === id)?.name ?? `#${id}`);

  const seats = parliamentQ.data?.seats ?? [];
  const president = parliamentQ.data?.president;
  const officePay = parliamentQ.data?.office_pay;

  const myPayQ = useQuery({
    queryKey: ['politics', 'office-pay', 'me', character?.id],
    queryFn: () => politicsApi.myOfficePay(),
    enabled: !!character?.id && (isPresident || isMp),
  });

  return (
    <div className="play-page">
      <HubBack to="/nation" label="Nation" />
      <header className="page-header compact">
        <h1>
          <Scale size={22} aria-hidden /> Politics
        </h1>
      </header>

      <section className="panel">
        <h2>
          <Landmark size={18} aria-hidden /> Parliament
        </h2>
        {parliamentQ.isLoading && <p className="muted">Loading…</p>}
        {parliamentQ.isError && <ErrorNotice error={parliamentQ.error} />}
        {(isPresident || isMp) && (
          <p className="your-office">
            Your office:{' '}
            {isPresident && <span className="badge active">President</span>}
            {isMp && (
              <span className="badge active">
                MP{mpSeat ? ` · ${mpSeat.state_name}` : ''}
              </span>
            )}
            {myPayQ.data && myPayQ.data.weekly_gross > 0 && (
              <span className="muted">
                {' '}
                · ~${myPayQ.data.weekly_gross.toFixed(0)}/wk before tax
                {myPayQ.data.roles.some((r) => r.scandal) ? ' (scandal cut)' : ''}
              </span>
            )}
          </p>
        )}
        {president && (
          <p>
            President: <strong>{president.name}</strong>
            {president.is_npc ? ' (NPC)' : ''}
            {isPresident && <span className="badge active">You</span>}
            {parliamentQ.data && (
              <span className="muted">
                {' '}
                · majority {parliamentQ.data.majority_needed} · veto override{' '}
                {parliamentQ.data.veto_override_needed}
              </span>
            )}
          </p>
        )}
        {parliamentQ.data?.vice_president && (
          <p>
            Vice President:{' '}
            <strong>{parliamentQ.data.vice_president.name}</strong>
            {parliamentQ.data.vice_president.is_npc ? ' (NPC)' : ''}
          </p>
        )}
        {parliamentQ.data?.speaker && (
          <p>
            Speaker: <strong>{parliamentQ.data.speaker.name}</strong>
            {parliamentQ.data.speaker.is_npc ? ' (NPC)' : ''}
          </p>
        )}
        <div className="list-table politics-seats">
          {seats.map((s) => {
            const mine = character?.id != null && s.mp_character_id === character.id;
            return (
              <div key={s.state_id} className="list-row">
                <div>
                  <strong>
                    <Link to={`/states/${s.state_slug}`}>{s.state_name}</Link>
                  </strong>
                  <p className="muted">
                    {s.mp_name}
                    {s.is_npc ? ' · NPC' : ''}
                    {s.mp_character_id != null ? ` · char #${s.mp_character_id}` : ''}
                  </p>
                </div>
                <div className="list-meta">
                  {mine && <span className="badge active">You</span>}
                  <span className={`badge ${s.is_npc ? '' : 'active'}`}>
                    {s.is_npc ? 'NPC' : 'Player'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {officePay && (
        <section className="panel">
          <h2>
            <Trophy size={18} aria-hidden /> Office pay
          </h2>
          <p className="muted">{officePay.note}</p>
          <div className="list-table">
            {Object.entries(officePay.offices).map(([key, pkg]) => (
              <div key={key} className="list-row">
                <div>
                  <strong>{pkg.label}</strong>
                  <p className="muted">
                    ${pkg.salary.toFixed(0)} salary + ${pkg.duty_allowance.toFixed(0)} duty + $
                    {pkg.housing_allowance.toFixed(0)} housing
                  </p>
                </div>
                <div className="list-meta">
                  <strong>${pkg.weekly_total.toFixed(0)}/wk</strong>
                </div>
              </div>
            ))}
          </div>
          <p className="muted" style={{ marginTop: '0.75rem' }}>
            Bonuses: session ${officePay.bonuses.session_mp}/{officePay.bonuses.session_minister}{' '}
            (MP/minister) · budget pass ${officePay.bonuses.budget_president}/$
            {officePay.bonuses.budget_finance}/${officePay.bonuses.budget_mp_yes} · election win $
            {officePay.bonuses.election_president}/${officePay.bonuses.election_mp}. Scandal (heat ≥
            {officePay.scandal.heat_threshold} or record) pays{' '}
            {Math.round(officePay.scandal.pay_factor * 100)}%.
          </p>
        </section>
      )}

      <section className="panel">
        <h2>
          <Vote size={18} aria-hidden /> Current election
        </h2>
        {electionQ.isLoading && <p className="muted">Checking elections…</p>}
        {!election && !electionQ.isLoading && (
          <p className="muted">No active election right now. Parliament still sits.</p>
        )}
        {election && (
          <>
            <ul className="kv">
              <li>
                <span>Election</span>
                <strong>#{election.id}</strong>
              </li>
              {election.status != null && (
                <li>
                  <span>Status</span>
                  <strong>{String(election.status)}</strong>
                </li>
              )}
              {election.phase != null && (
                <li>
                  <span>Phase</span>
                  <strong>{String(election.phase)}</strong>
                </li>
              )}
              {Object.entries(election)
                .filter(
                  ([k, v]) =>
                    typeof v === 'string' &&
                    (k.includes('_at') || k.includes('until')) &&
                    v,
                )
                .slice(0, 4)
                .map(([k, v]) => (
                  <li key={k}>
                    <span>{k.replace(/_/g, ' ')}</span>
                    <strong>{new Date(String(v)).toLocaleString()}</strong>
                  </li>
                ))}
            </ul>

            <div className="politics-run">
              <h3>Run for office</h3>
              <div className="inline-form">
                <label>
                  Race
                  <select
                    value={raceType}
                    onChange={(e) => setRaceType(e.target.value as RaceType)}
                    disabled={locked}
                  >
                    <option value="mp">MP (home state)</option>
                    <option value="president">President</option>
                  </select>
                </label>
                <label>
                  Slogan
                  <input
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    minLength={2}
                    maxLength={160}
                    disabled={locked}
                  />
                </label>
                <button
                  type="button"
                  className="btn primary"
                  disabled={locked || runMut.isPending || slogan.trim().length < 2}
                  onClick={() => runMut.mutate()}
                >
                  {runMut.isPending ? 'Filing…' : 'Register candidacy'}
                </button>
              </div>
            </div>

            <div className="row-between" style={{ marginTop: '1rem' }}>
              <h3 style={{ margin: 0 }}>
                <Trophy size={16} aria-hidden /> Candidates
              </h3>
              <label className="inline-label">
                Filter
                <select
                  value={filterRace}
                  onChange={(e) => setFilterRace(e.target.value)}
                >
                  <option value="">All races</option>
                  <option value="mp">MP</option>
                  <option value="president">President</option>
                </select>
              </label>
            </div>

            {candidatesQ.isLoading && <p className="muted">Loading candidates…</p>}
            {!candidatesQ.data?.length && !candidatesQ.isLoading && (
              <p className="muted">No candidates yet.</p>
            )}
            <div className="list-table">
              {candidatesQ.data?.map((c) => (
                <div key={c.id} className="list-row">
                  <div>
                    <strong>
                      {c.display_name}{' '}
                      <span className="badge">{c.race_type}</span>
                      {c.is_winner && <span className="badge completed">Winner</span>}
                    </strong>
                    <p className="muted">
                      {c.slogan} · {stateName(c.state_id)} · {c.vote_count} votes
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn primary"
                    disabled={locked || voteMut.isPending}
                    onClick={() => setVoteTarget(c)}
                  >
                    Vote
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn ghost"
              style={{ marginTop: '0.75rem' }}
              disabled={locked || resolveMut.isPending}
              onClick={() => setResolveOpen(true)}
            >
              Resolve election (admin/test)
            </button>
          </>
        )}
      </section>

      <ConfirmModal
        open={!!voteTarget}
        title="Cast vote?"
        confirmLabel="Vote"
        busy={voteMut.isPending}
        onCancel={() => setVoteTarget(null)}
        onConfirm={() => voteTarget && voteMut.mutate(voteTarget.id)}
      >
        {voteTarget && (
          <p>
            Vote for <strong>{voteTarget.display_name}</strong> ({voteTarget.race_type}) — “
            {voteTarget.slogan}”.
          </p>
        )}
      </ConfirmModal>

      <ConfirmModal
        open={resolveOpen}
        title="Resolve election?"
        confirmLabel="Resolve"
        danger
        busy={resolveMut.isPending}
        onCancel={() => setResolveOpen(false)}
        onConfirm={() => resolveMut.mutate()}
      >
        <p>Closes voting early and tallies winners. Intended for admin/testing.</p>
      </ConfirmModal>
    </div>
  );
}
