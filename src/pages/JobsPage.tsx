import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Hammer, Zap } from 'lucide-react';
import { jobsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { getErrorDetail } from '../api/client';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import { ConfirmModal } from '../components/ConfirmModal';
import { LockBanner } from '../components/LockBanner';
import { useState } from 'react';
import type { JobListing } from '../types/api';

export function JobsPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked = !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;
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

  const currentListing = listingsQ.data?.find((l) => l.id === jobQ.data?.listing_id);

  const hireMut = useMutation({
    mutationFn: (listing_id: number) => jobsApi.hire(listing_id),
    onSuccess: async () => {
      toast.push('Hired.', 'ok');
      setHireTarget(null);
      await qc.invalidateQueries({ queryKey: ['jobs'] });
      await refreshCharacter();
    },
    onError: (err) => toast.push(getErrorDetail(err), 'err'),
  });

  const workMut = useMutation({
    mutationFn: () => jobsApi.work(),
    onSuccess: async (res) => {
      toast.push(`Shift done. +${money(res.wage)} (−${res.energy_spent} energy).`, 'ok');
      await qc.invalidateQueries({ queryKey: ['jobs'] });
      await refreshCharacter();
    },
    onError: (err) => toast.push(getErrorDetail(err), 'err'),
  });

  const energy = character?.energy ?? 0;
  const energyNeed = currentListing?.energy_cost ?? 0;
  const lowEnergy = !!currentListing && energy < energyNeed;
  const canWork = !!jobQ.data && !locked && !!currentListing && !lowEnergy;

  return (
    <div className={`play-page ${jobQ.data ? 'has-dock' : ''}`}>
      <header className="page-header compact">
        <h1>
          <Briefcase size={22} aria-hidden /> Jobs
        </h1>
        <p className="lede">Hire once, work shifts for cash. Energy gates every shift.</p>
      </header>

      <LockBanner />

      <section className={`play-hero ${jobQ.data ? 'ready' : 'empty'}`}>
        {jobQ.isLoading && <p className="muted">Checking job…</p>}
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
              <strong>{currentListing?.title ?? `Listing #${jobQ.data.listing_id}`}</strong>
              <p className="muted">
                {currentListing
                  ? `${money(currentListing.wage_per_shift)} · ${currentListing.energy_cost} energy · ${currentListing.shift_minutes}m`
                  : `${jobQ.data.shifts_completed} shifts done`}
                {jobQ.data.shifts_completed > 0 && currentListing
                  ? ` · ${jobQ.data.shifts_completed} shifts`
                  : ''}
              </p>
              {lowEnergy && (
                <p className="err-text">Need {energyNeed} energy (you have {energy}).</p>
              )}
            </div>
            <button
              type="button"
              className="btn primary play-cta"
              disabled={!canWork || workMut.isPending}
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
          <span className="muted sm">{listingsQ.data?.length ?? 0} in state</span>
        </div>
        {listingsQ.isLoading && <p className="muted">Loading listings…</p>}
        {listingsQ.isError && <p className="err-text">{getErrorDetail(listingsQ.error)}</p>}
        {!listingsQ.isLoading && !listingsQ.data?.length && (
          <p className="muted">No listings in this state.</p>
        )}
        <div className="play-list">
          {listingsQ.data?.map((l) => {
            const isCurrent = jobQ.data?.listing_id === l.id;
            const listingLow = energy < l.energy_cost;
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
                    {l.requires_clean_record && <span className="badge warn">Clean record</span>}
                    {listingLow && <span className="muted sm">Low energy</span>}
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn ${isCurrent ? 'ghost' : ''}`}
                  disabled={locked || isCurrent || hireMut.isPending}
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
              {currentListing ? money(currentListing.wage_per_shift) : '—'} · {energy}/{character?.max_energy} en
            </span>
          </div>
          <button
            type="button"
            className="btn primary"
            disabled={!canWork || workMut.isPending}
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
            <p className="muted">Hiring replaces your current job.</p>
          </>
        )}
      </ConfirmModal>
    </div>
  );
}
