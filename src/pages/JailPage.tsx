import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gavel, Skull } from 'lucide-react';
import { jailApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { ErrorNotice } from '../components/ErrorNotice';
import { useToast } from '../context/ToastContext';
import { money } from '../lib/format';
import { Timer } from '../components/Timer';

export function JailPage() {
  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();

  const jailQ = useQuery({
    queryKey: ['jail', 'me'],
    queryFn: () => jailApi.me(),
    refetchInterval: 5_000,
  });

  const bailMut = useMutation({
    mutationFn: () => jailApi.bail(),
    onSuccess: async () => {
      toast.push('Bail paid. You are free.', 'ok');
      await qc.invalidateQueries({ queryKey: ['jail'] });
      void refreshCharacter();
    },
    onError: (err) => toast.pushError(err),
  });

  const status = jailQ.data;
  const jailed = status?.is_jailed || character?.is_jailed;

  return (
    <div className="play-page">
      <header className="page-header compact">
        <h1>
          <Gavel size={22} aria-hidden /> Jail
        </h1>
        <p className="lede">Status and bail when you are locked up.</p>
      </header>

      {jailQ.isLoading && <p className="muted">Checking…</p>}
      {jailQ.isError && <ErrorNotice error={jailQ.error} />}

      <section className={`play-hero ${jailed ? 'ready' : 'empty'}`}>
        <div className="play-hero-copy">
          <span className="play-kicker">
            <Skull size={12} aria-hidden /> Custody
          </span>
          <strong>{jailed ? 'In custody' : 'Free'}</strong>
          <p className="muted">
            Heat {Number(status?.heat ?? character?.heat ?? 0).toFixed(1)}
            {jailed && status?.jail_until ? (
              <>
                {' '}
                · release{' '}
                <Timer
                  completesAt={status.jail_until}
                  onComplete={() => {
                    void jailQ.refetch();
                    void refreshCharacter();
                  }}
                />
              </>
            ) : null}
          </p>
          {jailed && (
            <p className="muted">
              Bail {money(status?.bail_cost ?? 0)} · cash {money(character?.cash ?? 0)}
            </p>
          )}
        </div>
        {jailed ? (
          <button
            type="button"
            className="btn primary play-cta"
            disabled={bailMut.isPending || (character?.cash ?? 0) < (status?.bail_cost ?? 0)}
            onClick={() => bailMut.mutate()}
          >
            {bailMut.isPending ? 'Paying…' : `Bail ${money(status?.bail_cost ?? 0)}`}
          </button>
        ) : (
          <Link to="/crime" className="btn">
            Crime desk
          </Link>
        )}
      </section>
    </div>
  );
}
