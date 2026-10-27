import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Check, GraduationCap, Hammer, X, Zap } from 'lucide-react';
import { educationApi, inboxApi, jobsApi, permitsApi, statesApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { ErrorNotice } from '../components/ErrorNotice';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import { ConfirmModal } from '../components/ConfirmModal';
import { LockBanner } from '../components/LockBanner';
import { useJobListing } from '../hooks/useJobDetails';
import { usePoliticalRoles } from '../hooks/usePoliticalRoles';
import { useState } from 'react';
import type { JobListing } from '../types/api';

export function JobsPage() {
  const { character, refreshCharacter, patchCharacter } = useAuth();
  const { holdsOffice } = usePoliticalRoles();
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

  const companyJobQ = useQuery({
    queryKey: ['inbox', 'job'],
    queryFn: () => inboxApi.companyJob(),
    refetchInterval: 20_000,
  });

  const { listing: currentListing } = useJobListing(jobQ.data);
  const companyJob = companyJobQ.data ?? null;

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

  const invitesQ = useQuery({
    queryKey: ['inbox', 'invites'],
    queryFn: () => inboxApi.invites(),
    refetchInterval: 15_000,
  });

  const acceptInviteMut = useMutation({
    mutationFn: (id: number) => inboxApi.acceptInvite(id),
    onSuccess: async (res) => {
      toast.push(typeof res.message === 'string' ? res.message : 'Joined the company.', 'ok');
      await qc.invalidateQueries({ queryKey: ['inbox'] });
      await qc.invalidateQueries({ queryKey: ['jobs'] });
      await qc.invalidateQueries({ queryKey: ['businesses'] });
      void refreshCharacter();
    },
    onError: (err) => toast.pushError(err),
  });

  const declineInviteMut = useMutation({
    mutationFn: (id: number) => inboxApi.declineInvite(id),
    onSuccess: async () => {
      toast.push('Offer declined.', 'ok');
      await qc.invalidateQueries({ queryKey: ['inbox'] });
    },
    onError: (err) => toast.pushError(err),
  });

  const companyInvites = invitesQ.data ?? [];
  const energy = character?.energy ?? 0;
  const energyNeed = currentListing?.energy_cost ?? 0;
  const lowEnergy = currentListing != null && energy < energyNeed;
  // Work is allowed without a resolved listing — API validates energy/job.
  const canWork =
    !!jobQ.data &&
    !companyJob &&
    !holdsOffice &&
    !locked &&
    !lowEnergy &&
    !workMut.isPending;

  function canHire(l: JobListing): { ok: boolean; reason?: string } {
    if (locked) return { ok: false, reason: 'Actions locked' };
    if (holdsOffice)
      return {
        ok: false,
        reason: 'Political office — employee jobs closed (you can still own a business)',
      };
    if (companyJob) return { ok: false, reason: 'On company payroll — leave that job first' };
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
    <div className={`play-page ${jobQ.data && !companyJob && !holdsOffice ? 'has-dock' : ''}`}>
      <header className="page-header compact">
        <h1>
          <Briefcase size={22} aria-hidden /> Jobs
        </h1>
      </header>

      <LockBanner />

      {holdsOffice && (
        <section className="panel" style={{ marginBottom: '0.85rem' }}>
          <h2 style={{ marginTop: 0 }}>Political office</h2>
          <p className="muted">
            Employee roles are unavailable while in office.{' '}
            <Link to="/politics">Politics</Link>
          </p>
        </section>
      )}

      {companyInvites.length > 0 && !holdsOffice && (
        <section className="panel" style={{ marginBottom: '0.85rem' }}>
          <h2 style={{ marginTop: 0 }}>Company job offers</h2>
          <div className="inbox-list">
            {companyInvites.map((inv) => (
              <article key={inv.id} className="inbox-item offer">
                <header>
                  <strong>{inv.business_name}</strong>
                  <span className="muted sm">
                    {inv.role} · {money(inv.wage_per_week)}/wk
                  </span>
                </header>
                <div className="row-actions">
                  <button
                    type="button"
                    className="btn primary sm"
                    disabled={locked || acceptInviteMut.isPending}
                    onClick={() => acceptInviteMut.mutate(inv.id)}
                  >
                    <Check size={14} aria-hidden /> Accept & join
                  </button>
                  <button
                    type="button"
                    className="btn danger sm"
                    disabled={locked || declineInviteMut.isPending}
                    onClick={() => declineInviteMut.mutate(inv.id)}
                  >
                    <X size={14} aria-hidden /> Decline
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section
        className={`play-hero ${!holdsOffice && (companyJob || jobQ.data) ? 'ready' : 'empty'}`}
      >
        {jobQ.isLoading && <p className="muted">Checking job…</p>}
        {jobQ.isError && <ErrorNotice error={jobQ.error} />}
        {holdsOffice && (
          <div className="play-hero-copy">
            <span className="play-kicker">
              <Hammer size={12} aria-hidden /> Public office
            </span>
            <strong>Not available for hire</strong>
            <p className="muted">
              Your vocation is political office. Own a business if you want private income on the
              side.
            </p>
          </div>
        )}
        {!holdsOffice && companyJob && (
          <>
            <div className="play-hero-copy">
              <span className="play-kicker">
                <Hammer size={12} aria-hidden /> Company payroll
              </span>
              <strong>{companyJob.business_name}</strong>
              <p className="muted">
                {companyJob.role} · {money(companyJob.wage_per_week)}/wk — state shop shifts are
                closed while you work here. See <Link to="/inbox">Inbox → My company job</Link>.
              </p>
            </div>
          </>
        )}
        {!holdsOffice && !jobQ.isLoading && !jobQ.data && !companyJob && (
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
        {!holdsOffice && jobQ.data && !companyJob && (
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

      {jobQ.data && !companyJob && !holdsOffice && (
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
