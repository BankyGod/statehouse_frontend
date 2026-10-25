import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { educationApi } from '../api/endpoints';
import { ErrorNotice } from '../components/ErrorNotice';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import { Timer } from '../components/Timer';
import { ConfirmModal } from '../components/ConfirmModal';
import { useState } from 'react';
import type { EducationCatalogItem } from '../types/api';

export function EducationPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked = !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;
  const [target, setTarget] = useState<EducationCatalogItem | null>(null);

  const catalogQ = useQuery({
    queryKey: ['education', 'catalog'],
    queryFn: () => educationApi.catalog(),
  });

  const meQ = useQuery({
    queryKey: ['education', 'me'],
    queryFn: () => educationApi.me(),
    refetchInterval: 30_000,
  });

  const enrollMut = useMutation({
    mutationFn: (track: EducationCatalogItem['track']) => educationApi.enroll(track),
    onSuccess: async (enr) => {
      toast.push(`Enrolled in ${enr.title}.`, 'ok');
      setTarget(null);
      await qc.invalidateQueries({ queryKey: ['education'] });
      void refreshCharacter();
    },
    onError: (err) => toast.pushError(err),
  });

  const hasActive = meQ.data?.some((e) => e.status === 'in_progress' || e.status === 'active');

  return (
    <div>
      <header className="page-header">
        <h1>
          <GraduationCap size={26} aria-hidden /> Education
        </h1>
        <p className="lede">
          Real wait clocks tick while you age in game years. One active enrollment at a time.
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
        <h2>Catalog</h2>
        {catalogQ.isLoading && <p>Loading…</p>}
        {catalogQ.isError && <ErrorNotice error={catalogQ.error} />}
        <div className="card-grid">
          {catalogQ.data?.map((item) => (
            <div key={item.track} className="info-card">
              <h3>{item.label}</h3>
              <ul className="kv">
                <li>
                  <span>Cost</span>
                  <strong className="cash">{money(item.cost)}</strong>
                </li>
                <li>
                  <span>Real wait</span>
                  <strong>{item.real_days} days</strong>
                </li>
                <li>
                  <span>Age gain</span>
                  <strong>+{item.age_years} yr</strong>
                </li>
                <li>
                  <span>Level</span>
                  <strong>{item.level}</strong>
                </li>
              </ul>
              <button
                type="button"
                className="btn primary"
                disabled={locked || hasActive || enrollMut.isPending}
                onClick={() => setTarget(item)}
              >
                Enroll
              </button>
            </div>
          ))}
        </div>
        {hasActive && <p className="muted">Finish or wait out your current enrollment first.</p>}
      </section>

      <ConfirmModal
        open={!!target}
        title="Enroll?"
        confirmLabel="Pay & enroll"
        busy={enrollMut.isPending}
        onCancel={() => setTarget(null)}
        onConfirm={() => target && enrollMut.mutate(target.track)}
      >
        {target && (
          <p>
            {target.label}: pay {money(target.cost)}, wait ~{target.real_days} real days, age +
            {target.age_years} years.
          </p>
        )}
      </ConfirmModal>
    </div>
  );
}
