import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, HeartPulse, Hospital, Syringe } from 'lucide-react';
import { medicalApi } from '../api/endpoints';
import { ErrorNotice } from '../components/ErrorNotice';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import { Timer } from '../components/Timer';
import { ConfirmModal } from '../components/ConfirmModal';

export function MedicalPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked =
    !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [hpAmount, setHpAmount] = useState(10);
  const [hospitalOpen, setHospitalOpen] = useState(false);

  const healthQ = useQuery({
    queryKey: ['medical', 'me'],
    queryFn: () => medicalApi.me(),
    refetchInterval: 20_000,
  });

  async function afterHeal() {
    await qc.invalidateQueries({ queryKey: ['medical'] });
    void refreshCharacter();
  }

  const clinicMut = useMutation({
    mutationFn: (hp: number) => medicalApi.clinic(hp),
    onSuccess: async (res) => {
      const msg =
        typeof res.message === 'string'
          ? res.message
          : `Clinic healed ${hpAmount} HP.`;
      toast.push(msg, 'ok');
      await afterHeal();
    },
    onError: (err) => toast.pushError(err),
  });

  const hospitalMut = useMutation({
    mutationFn: () => medicalApi.hospital(),
    onSuccess: async (res) => {
      const msg =
        typeof res.message === 'string' ? res.message : 'Admitted to hospital.';
      toast.push(msg, 'ok');
      setHospitalOpen(false);
      await afterHeal();
    },
    onError: (err) => toast.pushError(err),
  });

  const status = healthQ.data;
  const health = character?.health ?? status?.health ?? 0;
  const maxHealth = character?.max_health ?? status?.max_health ?? 100;
  const pctFill = Math.max(0, Math.min(100, (health / Math.max(1, maxHealth)) * 100));
  const costPer = status?.clinic_cost_per_hp ?? 0;
  const estimate = costPer * hpAmount;
  const missing = Math.max(0, maxHealth - health);

  return (
    <div>
      <header className="page-header">
        <h1>
          <HeartPulse size={26} aria-hidden /> Medical
        </h1>
        <p className="lede">
          Clinic heals instantly for cash. Hospital restores more over real time and locks actions.
        </p>
      </header>

      <section className="panel">
        <h2>
          <Activity size={18} aria-hidden /> Status
        </h2>
        {healthQ.isLoading && <p className="muted">Loading…</p>}
        {healthQ.isError && <ErrorNotice error={healthQ.error} />}
        <div className="health-block">
          <div className="health-bar-track" aria-hidden>
            <div
              className={`health-bar-fill ${pctFill < 35 ? 'low' : pctFill < 70 ? 'mid' : ''}`}
              style={{ width: `${pctFill}%` }}
            />
          </div>
          <ul className="kv">
            <li>
              <span>Health</span>
              <strong>
                {health}/{maxHealth}
              </strong>
            </li>
            <li>
              <span>Condition</span>
              <strong>{character?.condition ?? status?.condition ?? 'Stable'}</strong>
            </li>
            <li>
              <span>Clinic rate</span>
              <strong className="cash">{money(costPer)} / HP</strong>
            </li>
            <li>
              <span>Hospital base</span>
              <strong>{status?.hospital_base_hours ?? '—'} hours</strong>
            </li>
            {(character?.is_hospitalized || status?.is_hospitalized) && (
              <li>
                <span>Discharge</span>
                <Timer
                  completesAt={character?.hospital_until ?? status?.hospital_until}
                  onComplete={() => {
                    void healthQ.refetch();
                    void refreshCharacter();
                  }}
                />
              </li>
            )}
          </ul>
        </div>
      </section>

      <section className="panel-row">
        <div className="panel">
          <h2>
            <Syringe size={18} aria-hidden /> Clinic
          </h2>
          <p className="muted">Pay per HP restored. Fast heal — you stay free to act.</p>
          <label>
            HP to restore (max {Math.max(1, missing) || 1})
            <input
              type="number"
              min={1}
              max={Math.max(1, Math.min(100, missing || 100))}
              value={hpAmount}
              onChange={(e) => setHpAmount(Number(e.target.value) || 1)}
            />
          </label>
          <p className="lede" style={{ marginTop: '0.5rem' }}>
            Est. cost: <strong className="cash">{money(estimate)}</strong>
          </p>
          <button
            type="button"
            className="btn primary"
            style={{ marginTop: '0.75rem' }}
            disabled={
              locked ||
              missing <= 0 ||
              clinicMut.isPending ||
              !!character?.is_hospitalized
            }
            onClick={() => clinicMut.mutate(hpAmount)}
          >
            {clinicMut.isPending ? 'Healing…' : 'Visit clinic'}
          </button>
          {missing <= 0 && <p className="muted">Already at full health.</p>}
        </div>

        <div className="panel">
          <h2>
            <Hospital size={18} aria-hidden /> Hospital
          </h2>
          <p className="muted">
            Full recovery over time. You are locked in bed until discharge.
          </p>
          <button
            type="button"
            className="btn danger"
            disabled={
              !!character?.is_jailed ||
              !!character?.is_traveling ||
              !!character?.is_hospitalized ||
              hospitalMut.isPending ||
              missing <= 0
            }
            onClick={() => setHospitalOpen(true)}
          >
            Admit to hospital
          </button>
        </div>
      </section>

      <ConfirmModal
        open={hospitalOpen}
        title="Admit to hospital?"
        confirmLabel="Admit"
        danger
        busy={hospitalMut.isPending}
        onCancel={() => setHospitalOpen(false)}
        onConfirm={() => hospitalMut.mutate()}
      >
        <p>
          You will be hospitalized (~{status?.hospital_base_hours ?? '?'} base hours, may scale with
          damage). Actions stay locked until release.
        </p>
      </ConfirmModal>
    </div>
  );
}
