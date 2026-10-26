import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, GraduationCap, Hammer, Zap } from 'lucide-react';
import { educationApi, jobsApi, permitsApi, statesApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { ErrorNotice } from '../components/ErrorNotice';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import { ConfirmModal } from '../components/ConfirmModal';
import { LockBanner } from '../components/LockBanner';
import { useJobListing } from '../hooks/useJobDetails';
import { useState } from 'react';
import type { JobListing } from '../types/api';

export function JobsPage() {
  const { character, refreshCharacter, patchCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked =
    !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;
  const [hireTarget, setHireTarget] = useState<JobListing | null>(null);

  const listingsQ = useQuery({
    queryKey: ['jobs', 'listings', character?.current_state_id],
    queryFn: () => jobsApi.listings(character?.current_state_id),
    enabled: !!character,
  });

  const jobQ = useQuery({
    queryKey: ['jobs', 'me'],
    queryFn: () => jobsApi.me(),
  });

  const { listing: currentListing } = useJobListing(jobQ.data);

  const eduQ = useQuery({
    queryKey: ['education', 'me'],
    queryFn: () => educationApi.me(),
  });

  const permitsQ = useQuery({
    queryKey: ['permits', 'me'],
    queryFn: () => permitsApi.me(),
  });

  const stateQ = useQuery({
    queryKey: ['state', character?.current_state_id],
    queryFn: () => statesApi.get(character!.current_state_id),
    enabled: !!character?.current_state_id,
  });

  const eduLevels = (eduQ.data ?? [])
    .filter((e) => e.status === 'completed' || !!e.completed_at)
    .map((e) => e.education_level ?? 0);
  const eduLevel = eduLevels.length ? Math.max(...eduLevels) : 0;

  const hireMut = useMutation({
    mutationFn: (listing_id: number) => jobsApi.hire(listing_id),
    onSuccess: async (job) => {
      toast.push('Hired.', 'ok');
      setHireTarget(null);
      patchCharacter({ current_state_id: job.state_id });
      await qc.invalidateQueries({ queryKey: ['jobs'] });
      await refreshCharacter();
    },
    onError: (err) => toast.pushError(err),
  });

  const workMut = useMutation({
    mutationFn: () => jobsApi.work(),
    onSuccess: (res) => {
      patchCharacter({ cash: res.cash, energy: res.energy });
      toast.push(`Shift done. +${money(res.wage)} (−${res.energy_spent} energy).`, 'ok');
      void qc.invalidateQueries({ queryKey: ['jobs'] });
      void refreshCharacter();
    },
    onError: (err) => toast.pushError(err),
  });

  const energy = character?.energy ?? 0;
  const energyNeed = currentListing?.energy_cost ?? 0;
  const lowEnergy = currentListing != null && energy < energyNeed;
  // Work is allowed without a resolved listing — API validates energy/job.
  const canWork = !!jobQ.data && !locked && !lowEnergy && !workMut.isPending;

  function canHire(l: JobListing): { ok: boolean; reason?: string } {
    if (locked) return { ok: false, reason: 'Actions locked' };
    if (jobQ.data?.listing_id === l.id) return { ok: false, reason: 'Already hired' };
    if (l.min_education_level > eduLevel) {
      return { ok: false, reason: `Need education level ${l.min_education_level}` };
    }
    if (l.requires_clean_record) {
      if ((character?.heat ?? 0) > 10) return { ok: false, reason: 'Heat too high' };
      if (character?.criminal_record_summary)
        return { ok: false, reason: 'Clean record required' };
    }
    const atHome = character?.home_state_id === l.state_id;
    if (!atHome) {
      const hasPermit = (permitsQ.data ?? []).some(
        (p) =>
          p.state_id === l.state_id &&
          p.permit_type === 'work' &&
          p.status === 'active',
      );
      if (!hasPermit) return { ok: false, reason: 'Work permit required' };
    }
    return { ok: true };
  }

  return (
    <div className={`play-page ${jobQ.data ? 'has-dock' : ''}`}>
      <header className="page-header compact">
        <h1>
          <Briefcase size={22} aria-hidden /> Jobs
        </h1>
        <p className="lede">
          Hire in {stateQ.data?.name ?? 'your current state'}, work shifts for cash. Energy gates
          every shift.
        </p>
      </header>

      <LockBanner />

      <section className={`play-hero ${jobQ.data ? 'ready' : 'empty'}`}>
        {jobQ.isLoading && <p className="muted">Checking job…</p>}
        {jobQ.isError && <ErrorNotice error={jobQ.error} />}
        {!jobQ.isLoading && !jobQ.data && (
          <>
            <div className="play-hero-copy">
              <strong>Unemployed</strong>
              <p className="muted">Pick a listing below for your current state.</p>
            </div>
            <button
              type="button"
              className="btn"
              onClick={() =>
                document.getElementById('job-listings')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Browse jobs
            </button>
          </>
        )}
        {jobQ.data && (
          <>
            <div className="play-hero-copy">
              <span className="play-kicker">
                <Hammer size={12} aria-hidden /> Current job
              </span>
              <strong>{currentListing?.title ?? `Job #${jobQ.data.listing_id}`}</strong>
              <p className="muted">
                {currentListing
                  ? `${money(currentListing.wage_per_shift)} · ${currentListing.energy_cost} energy · ${currentListing.shift_minutes}m`
                  : 'Loading listing details…'}
                {` · ${jobQ.data.shifts_completed} shifts`}
                {character && jobQ.data.state_id !== character.current_state_id && (
                  <span className="warn-text"> · job state differs from your location</span>
                )}
              </p>
              {lowEnergy && (
                <p className="err-text">
                  Need {energyNeed} energy (you have {energy}).
                </p>
              )}
            </div>
            <button
              type="button"
              className="btn primary play-cta"
              disabled={!canWork}
              onClick={() => workMut.mutate()}
            >
              <Zap size={16} aria-hidden />
              {workMut.isPending ? 'Working…' : 'Work shift'}
            </button>
          </>
        )}
      </section>

      <section id="job-listings" className="play-section">
        <div className="row-between">
          <h2>Open listings</h2>
          <span className="muted sm">
            {listingsQ.data?.length ?? 0} in {stateQ.data?.name ?? 'state'}
            {eduLevel > 0 && (
              <>
                {' '}
                · edu {eduLevel}
              </>
            )}
          </span>
        </div>
        {listingsQ.isLoading && <p className="muted">Loading listings…</p>}
        {listingsQ.isError && <ErrorNotice error={listingsQ.error} />}
        {!listingsQ.isLoading && !listingsQ.data?.length && (
          <p className="muted">No listings in this state.</p>
        )}
        <div className="play-list">
          {listingsQ.data?.map((l) => {
            const isCurrent = jobQ.data?.listing_id === l.id;
            const check = canHire(l);
            return (
              <article key={l.id} className={`play-row ${isCurrent ? 'current' : ''}`}>
                <div className="play-row-main">
                  <div className="play-row-title">
                    <strong>{l.title}</strong>
                    <span className="badge">{l.sector}</span>
                    {isCurrent && <span className="badge completed">Hired</span>}
                  </div>
                  {l.description && <p className="muted play-row-desc">{l.description}</p>}
                  <div className="play-row-meta">
                    <span className="cash">{money(l.wage_per_shift)}</span>
                    <span>{l.energy_cost} en</span>
                    <span>{l.shift_minutes}m</span>
                    {l.min_education_level > 0 && (
                      <span>
                        <GraduationCap size={12} aria-hidden /> Edu ≥{l.min_education_level}
                      </span>
                    )}
                    {l.requires_clean_record && <span className="badge warn">Clean record</span>}
                  </div>
                  {!check.ok && !isCurrent && check.reason && (
                    <p className="muted sm">
                      {check.reason}
                      {check.reason.includes('permit') && (
                        <>
                          {' '}
                          · <Link to="/permits">Get permit</Link>
                        </>
                      )}
                      {check.reason.includes('education') && (
                        <>
                          {' '}
                          · <Link to="/education">Study</Link>
                        </>
                      )}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className={`btn ${isCurrent ? 'ghost' : 'primary'}`}
                  disabled={locked || isCurrent || hireMut.isPending || !check.ok}
                  onClick={() => setHireTarget(l)}
                >
                  {isCurrent ? 'Hired' : 'Hire'}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {jobQ.data && (
        <div className="play-dock">
          <div className="play-dock-info">
            <strong>{currentListing?.title ?? 'Job'}</strong>
            <span className="muted">
              {currentListing ? money(currentListing.wage_per_shift) : '—'} · {energy}/
              {character?.max_energy} en
            </span>
          </div>
          <button
            type="button"
            className="btn primary"
            disabled={!canWork}
            onClick={() => workMut.mutate()}
          >
            <Zap size={15} aria-hidden />
            {workMut.isPending ? '…' : 'Work'}
          </button>
        </div>
      )}

      <ConfirmModal
        open={!!hireTarget}
        title="Hire for this job?"
        confirmLabel="Hire"
        busy={hireMut.isPending}
        onCancel={() => setHireTarget(null)}
        onConfirm={() => hireTarget && hireMut.mutate(hireTarget.id)}
      >
        {hireTarget && (
          <>
            <p>
              <strong>{hireTarget.title}</strong> — {money(hireTarget.wage_per_shift)} per shift,{' '}
              {hireTarget.energy_cost} energy.
            </p>
            <p className="muted">
              Hiring replaces your current job
              {character && hireTarget.state_id !== character.current_state_id
                ? ' and moves you to that state'
                : ''}
              .
            </p>
          </>
        )}
      </ConfirmModal>
    </div>
  );
}
