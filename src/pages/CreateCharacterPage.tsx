import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { charactersApi, statesApi } from '../api/endpoints';
import { getErrorDetail } from '../api/client';
import { StateCard } from '../components/StateCard';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { money } from '../lib/format';

export function CreateCharacterPage() {
  const { refreshCharacter, character, logout, token } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [homeStateId, setHomeStateId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const statesQ = useQuery({
    queryKey: ['states'],
    queryFn: () => statesApi.list(),
  });

  if (!token) return <Navigate to="/login" replace />;
  if (character) return <Navigate to="/" replace />;

  const selected = statesQ.data?.find((s) => s.id === homeStateId);

  function openConfirm(e: FormEvent) {
    e.preventDefault();
    if (!homeStateId || displayName.trim().length < 3) {
      toast.push('Pick a display name and home state.', 'err');
      return;
    }
    setConfirmOpen(true);
  }

  async function create() {
    if (!homeStateId) return;
    setBusy(true);
    try {
      await charactersApi.create({
        display_name: displayName.trim(),
        home_state_id: homeStateId,
        bio: bio.trim() || null,
      });
      await refreshCharacter();
      toast.push(`Welcome to ${selected?.name ?? 'United Amir'}.`, 'ok');
      nav('/');
    } catch (err) {
      toast.push(getErrorDetail(err), 'err');
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="create-page">
      <header className="create-header">
        <div>
          <p className="brand-mark">The State House</p>
          <h1>Create character</h1>
          <p className="lede">
            One life. Pick a home state — permanent after 3 days (one reset only).
          </p>
        </div>
        <button type="button" className="btn ghost" onClick={logout}>
          Log out
        </button>
      </header>

      <form className="create-form" onSubmit={openConfirm}>
        <label>
          Display name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            minLength={3}
            maxLength={64}
            required
          />
        </label>
        <label>
          Bio <span className="muted">(optional)</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={2}
          />
        </label>

        <h2>Home state</h2>
        {statesQ.isLoading && <p>Loading states…</p>}
        {statesQ.isError && <p className="err-text">{getErrorDetail(statesQ.error)}</p>}
        <div className="state-grid">
          {statesQ.data?.map((s) => (
            <StateCard
              key={s.id}
              state={s}
              selected={homeStateId === s.id}
              onSelect={() => setHomeStateId(s.id)}
            />
          ))}
        </div>

        <div className="create-footer">
          {selected && (
            <p>
              Selected: <strong>{selected.name}</strong> · bonus {money(selected.starting_bonus)}
            </p>
          )}
          <button type="submit" className="btn primary" disabled={!homeStateId || busy}>
            Create character
          </button>
        </div>
      </form>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm home state"
        confirmLabel="Start life"
        busy={busy}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void create()}
      >
        <p>
          You will start in <strong>{selected?.name}</strong> ({selected?.capital}). Home state is
          mostly permanent — one reset within the first 3 days only.
        </p>
        <p className="muted">Starting bonus: {selected ? money(selected.starting_bonus) : '—'}</p>
      </ConfirmModal>
    </div>
  );
}
