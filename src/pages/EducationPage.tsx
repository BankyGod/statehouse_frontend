import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Landmark } from 'lucide-react';
import { educationApi } from '../api/endpoints';
import { ErrorNotice } from '../components/ErrorNotice';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import { eduCardCssVars, institutionTheme } from '../lib/institutionTheme';
import { Timer } from '../components/Timer';
import { ConfirmModal } from '../components/ConfirmModal';
import { useState, type CSSProperties } from 'react';
import type { EducationInstitution, EducationProgram } from '../types/api';

export function EducationPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked =
    !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [selectedInst, setSelectedInst] = useState<EducationInstitution | null>(null);
  const [target, setTarget] = useState<EducationProgram | null>(null);

  const institutionsQ = useQuery({
    queryKey: ['education', 'institutions'],
    queryFn: () => educationApi.institutions(),
  });

  const programsQ = useQuery({
    queryKey: ['education', 'programs', selectedInst?.id],
    queryFn: () => educationApi.programs(selectedInst!.id),
    enabled: !!selectedInst,
  });

  const meQ = useQuery({
    queryKey: ['education', 'me'],
    queryFn: () => educationApi.me(),
    refetchInterval: 30_000,
  });

  const enrollMut = useMutation({
    mutationFn: (program_id: number) => educationApi.enroll({ program_id }),
    onSuccess: async (enr) => {
      toast.push(`Enrolled in ${enr.title}.`, 'ok');
      setTarget(null);
      await qc.invalidateQueries({ queryKey: ['education'] });
      void refreshCharacter();
    },
    onError: (err) => toast.pushError(err),
  });

  const hasActive = meQ.data?.some((e) => e.status === 'enrolled');

  return (
    <div>
      <header className="page-header">
        <h1>
          <GraduationCap size={26} aria-hidden /> Education
        </h1>
        <p className="lede">
          Choose a school, then a course — public and private institutions across United Amir.
          One active enrollment at a time.
        </p>
      </header>

      <section className="panel">
        <h2>My enrollments</h2>
        {!meQ.data?.length && <p className="muted">None yet.</p>}
        <div className="list-table">
          {meQ.data?.map((e) => (
            <div key={e.id} className="list-row">
              <div>
                <strong>{e.title}</strong>
                <span className={`badge ${e.status}`}>{e.status}</span>
                {e.institution_name && (
                  <p className="muted">{e.institution_name}</p>
                )}
              </div>
              <div className="list-meta">
                <span>+{e.age_gain_years} yr age</span>
                <span>Lvl {e.education_level}</span>
                <span>
                  {e.status === 'completed' ? (
                    'Done'
                  ) : (
                    <Timer
                      completesAt={e.completes_at}
                      onComplete={() => {
                        void meQ.refetch();
                        void refreshCharacter();
                      }}
                    />
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>
          <Landmark size={18} aria-hidden /> Institutions
        </h2>
        {institutionsQ.isLoading && <p>Loading…</p>}
        {institutionsQ.isError && <ErrorNotice error={institutionsQ.error} />}
        <div className="card-grid edu-inst-grid">
          {institutionsQ.data?.map((inst) => {
            const theme = institutionTheme(inst.slug, inst.kind, inst.name);
            return (
              <button
                type="button"
                key={inst.id}
                className={`edu-inst-card edu-inst-${inst.slug} ${selectedInst?.id === inst.id ? 'selected' : ''}`}
                style={eduCardCssVars(theme) as CSSProperties}
                onClick={() => setSelectedInst(inst)}
              >
                <div className="edu-inst-stripe" aria-hidden />
                <div className="edu-inst-mark" aria-hidden>
                  {theme.mark}
                </div>
                <h3>{inst.name}</h3>
                <p className="edu-inst-meta">
                  {inst.state_name} · prestige {inst.prestige}/5
                </p>
                <div className="edu-inst-badges">
                  <span className="edu-inst-badge">
                    {inst.ownership === 'government' ? 'Government' : 'Private'}
                  </span>
                  <span className="edu-inst-badge">
                    {inst.kind.replaceAll('_', ' ')}
                  </span>
                </div>
                {inst.description && <p className="edu-inst-desc">{inst.description}</p>}
              </button>
            );
          })}
        </div>
      </section>

      {selectedInst && (
        <section className="panel">
          <h2>Programs at {selectedInst.name}</h2>
          {programsQ.isLoading && <p>Loading courses…</p>}
          {programsQ.isError && <ErrorNotice error={programsQ.error} />}
          <div className="list-table">
            {programsQ.data?.map((p) => (
              <div key={p.id} className="list-row">
                <div>
                  <strong>{p.title}</strong>
                  <p className="muted">
                    {p.track.replaceAll('_', ' ')} · lvl {p.level}
                    {p.min_education_level > 0
                      ? ` · needs edu lvl ${p.min_education_level}`
                      : ''}
                  </p>
                </div>
                <div className="list-meta">
                  <span className="cash">{money(p.cost)}</span>
                  <span>{p.real_days}d</span>
                  <span>+{p.age_years} yr</span>
                  <button
                    type="button"
                    className="btn primary sm"
                    disabled={locked || hasActive || enrollMut.isPending}
                    onClick={() => setTarget(p)}
                  >
                    Enroll
                  </button>
                </div>
              </div>
            ))}
          </div>
          {hasActive && (
            <p className="muted">Finish or wait out your current enrollment first.</p>
          )}
        </section>
      )}

      <ConfirmModal
        open={!!target}
        title="Enroll?"
        confirmLabel="Pay & enroll"
        busy={enrollMut.isPending}
        onCancel={() => setTarget(null)}
        onConfirm={() => target && enrollMut.mutate(target.id)}
      >
        {target && selectedInst && (
          <p>
            <strong>{target.title}</strong> at {selectedInst.name}: pay {money(target.cost)},
            wait ~{target.real_days} real days, age +{target.age_years} years.
          </p>
        )}
      </ConfirmModal>
    </div>
  );
}
