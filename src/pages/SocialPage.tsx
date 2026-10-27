import { useState, type FormEvent } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flag, Swords, Users } from 'lucide-react';
import { socialApi } from '../api/endpoints';
import { ErrorNotice } from '../components/ErrorNotice';
import { HubBack } from '../components/SysHub';
import { LockBanner } from '../components/LockBanner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const SOCIAL_SECTIONS = ['relations', 'factions', 'events'] as const;
type SocialSection = (typeof SOCIAL_SECTIONS)[number];

function relName(r: Record<string, unknown>) {
  return String(r.display_name ?? r.other_name ?? r.name ?? `#${r.id ?? '?'}`);
}

export function SocialPage() {
  const { section } = useParams();
  const desk = (SOCIAL_SECTIONS as readonly string[]).includes(section ?? '')
    ? (section as SocialSection)
    : null;

  const { character, refreshCharacter } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const locked = !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const [friendName, setFriendName] = useState('');
  const [enemyName, setEnemyName] = useState('');
  const [attackName, setAttackName] = useState('');
  const [factionName, setFactionName] = useState('');
  const [factionTag, setFactionTag] = useState('');
  const [factionDesc, setFactionDesc] = useState('');

  const relQ = useQuery({
    queryKey: ['social', 'relations'],
    queryFn: () => socialApi.relations(),
    enabled: desk === 'relations' || desk == null,
  });
  const eventsQ = useQuery({
    queryKey: ['social', 'events'],
    queryFn: () => socialApi.events(),
    enabled: desk === 'events' || desk == null,
  });
  const factionsQ = useQuery({
    queryKey: ['social', 'factions'],
    queryFn: () => socialApi.factions(),
    enabled: desk === 'factions' || desk == null,
  });

  async function refreshSocial() {
    await qc.invalidateQueries({ queryKey: ['social'] });
    void refreshCharacter();
  }

  const friendMut = useMutation({
    mutationFn: (name: string) => socialApi.friendRequest(name),
    onSuccess: async () => {
      toast.push('Friend request sent.', 'ok');
      setFriendName('');
      await refreshSocial();
    },
    onError: (err) => toast.pushError(err),
  });

  const acceptMut = useMutation({
    mutationFn: (id: number) => socialApi.friendAccept(id),
    onSuccess: async () => {
      toast.push('Friend accepted.', 'ok');
      await refreshSocial();
    },
    onError: (err) => toast.pushError(err),
  });

  const enemyMut = useMutation({
    mutationFn: (name: string) => socialApi.addEnemy(name),
    onSuccess: async () => {
      toast.push('Enemy listed.', 'ok');
      setEnemyName('');
      await refreshSocial();
    },
    onError: (err) => toast.pushError(err),
  });

  const attackMut = useMutation({
    mutationFn: (name: string) => socialApi.attack(name),
    onSuccess: async (res) => {
      const msg =
        typeof res.message === 'string'
          ? res.message
          : typeof res.detail === 'string'
            ? res.detail
            : 'Attack resolved.';
      toast.push(msg, 'ok');
      setAttackName('');
      await refreshSocial();
    },
    onError: (err) => toast.pushError(err),
  });

  const createFactionMut = useMutation({
    mutationFn: () =>
      socialApi.createFaction({
        name: factionName.trim(),
        tag: factionTag.trim().toUpperCase(),
        description: factionDesc.trim() || null,
      }),
    onSuccess: async (f) => {
      toast.push(`Faction ${f.tag} created.`, 'ok');
      setFactionName('');
      setFactionTag('');
      setFactionDesc('');
      await refreshSocial();
    },
    onError: (err) => toast.pushError(err),
  });

  const joinMut = useMutation({
    mutationFn: (id: number) => socialApi.joinFaction(id),
    onSuccess: async () => {
      toast.push('Joined faction.', 'ok');
      await refreshSocial();
    },
    onError: (err) => toast.pushError(err),
  });

  const pending = relQ.data?.pending ?? [];
  const friends = relQ.data?.friends ?? [];
  const enemies = relQ.data?.enemies ?? [];

  if (!desk) return <Navigate to="/social" replace />;

  const titles: Record<SocialSection, { title: string; Icon: typeof Users }> = {
    relations: { title: 'Relations', Icon: Swords },
    factions: { title: 'Factions', Icon: Flag },
    events: { title: 'World events', Icon: Users },
  };
  const meta = titles[desk];

  return (
    <div className="play-page">
      <HubBack to="/social" label="Social" />
      <header className="page-header compact">
        <h1>
          <meta.Icon size={22} aria-hidden /> {meta.title}
        </h1>
      </header>

      <LockBanner />

      {desk === 'events' && (
        <section className="play-section">
          {eventsQ.isError && <ErrorNotice error={eventsQ.error} />}
          {!eventsQ.data?.length && !eventsQ.isLoading && (
            <p className="muted">No active events.</p>
          )}
          <div className="play-list">
            {eventsQ.data?.map((e) => (
              <article key={e.id} className="play-row compact">
                <div className="play-row-main">
                  <div className="play-row-title">
                    <strong>{e.title}</strong>
                  </div>
                  <p className="muted play-row-desc">{e.summary}</p>
                  <div className="play-row-meta">
                    <span>
                      {e.effect_key} ×{e.effect_value}
                    </span>
                    <span className="muted sm">
                      until {new Date(e.ends_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {desk === 'relations' && (
      <div className="profile-dossier-grid">
        <section className="panel">
          <h2>Friends</h2>
          <form
            className="inline-form stack-form"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (friendName.trim().length < 3) return;
              friendMut.mutate(friendName.trim());
            }}
          >
            <label>
              Display name
              <input
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                minLength={3}
                disabled={locked}
              />
            </label>
            <button type="submit" className="btn primary" disabled={locked || friendMut.isPending}>
              Request
            </button>
          </form>
          {!!pending.length && (
            <div className="play-list" style={{ marginTop: '0.65rem' }}>
              {pending.map((p) => (
                <article key={String(p.id)} className="play-row compact">
                  <div className="play-row-main">
                    <strong>{relName(p)}</strong>
                    <span className="badge pending">Pending</span>
                  </div>
                  <button
                    type="button"
                    className="btn sm"
                    disabled={locked || acceptMut.isPending}
                    onClick={() => acceptMut.mutate(Number(p.id))}
                  >
                    Accept
                  </button>
                </article>
              ))}
            </div>
          )}
          <ul className="kv" style={{ marginTop: '0.65rem' }}>
            {friends.map((f) => (
              <li key={String(f.id)}>
                <span>{relName(f)}</span>
                <strong>Friend</strong>
              </li>
            ))}
            {!friends.length && <li className="muted">No friends yet.</li>}
          </ul>
        </section>

        <section className="panel">
          <h2>
            <Swords size={16} aria-hidden /> Enemies / Attack
          </h2>
          <form
            className="inline-form stack-form"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (enemyName.trim().length < 3) return;
              enemyMut.mutate(enemyName.trim());
            }}
          >
            <label>
              Add enemy
              <input
                value={enemyName}
                onChange={(e) => setEnemyName(e.target.value)}
                minLength={3}
                disabled={locked}
              />
            </label>
            <button type="submit" className="btn" disabled={locked || enemyMut.isPending}>
              Add
            </button>
          </form>
          <form
            className="inline-form stack-form"
            style={{ marginTop: '0.65rem' }}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (attackName.trim().length < 3) return;
              attackMut.mutate(attackName.trim());
            }}
          >
            <label>
              Attack (display name)
              <input
                value={attackName}
                onChange={(e) => setAttackName(e.target.value)}
                minLength={3}
                disabled={locked}
              />
            </label>
            <button type="submit" className="btn danger" disabled={locked || attackMut.isPending}>
              Attack
            </button>
          </form>
          <ul className="kv" style={{ marginTop: '0.65rem' }}>
            {enemies.map((f) => (
              <li key={String(f.id)}>
                <span>{relName(f)}</span>
                <strong className="warn-text">Enemy</strong>
              </li>
            ))}
            {!enemies.length && <li className="muted">No enemies listed.</li>}
          </ul>
        </section>
      </div>
      )}

      {desk === 'factions' && (
      <section className="panel">
        {character?.faction_id != null && (
          <p className="muted">You are in faction #{character.faction_id}.</p>
        )}
        <form
          className="stack-form"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            createFactionMut.mutate();
          }}
        >
          <div className="inline-form">
            <label>
              Name
              <input
                value={factionName}
                onChange={(e) => setFactionName(e.target.value)}
                minLength={3}
                required
                disabled={locked || character?.faction_id != null}
              />
            </label>
            <label>
              Tag
              <input
                value={factionTag}
                onChange={(e) => setFactionTag(e.target.value.toUpperCase())}
                minLength={2}
                maxLength={8}
                required
                disabled={locked || character?.faction_id != null}
              />
            </label>
          </div>
          <label>
            Description
            <input
              value={factionDesc}
              onChange={(e) => setFactionDesc(e.target.value)}
              disabled={locked || character?.faction_id != null}
            />
          </label>
          <button
            type="submit"
            className="btn primary"
            disabled={locked || createFactionMut.isPending || character?.faction_id != null}
          >
            Create faction
          </button>
        </form>
        <div className="play-list" style={{ marginTop: '0.75rem' }}>
          {factionsQ.data?.map((f) => (
            <article key={f.id} className="play-row">
              <div className="play-row-main">
                <div className="play-row-title">
                  <strong>
                    [{f.tag}] {f.name}
                  </strong>
                  {character?.faction_id === f.id && <span className="badge completed">Yours</span>}
                </div>
                <p className="muted play-row-desc">{f.description ?? '—'}</p>
                <div className="play-row-meta">
                  <span>{f.members} members</span>
                  <span>Treasury {f.treasury}</span>
                </div>
              </div>
              {character?.faction_id == null && (
                <button
                  type="button"
                  className="btn"
                  disabled={locked || joinMut.isPending}
                  onClick={() => joinMut.mutate(f.id)}
                >
                  Join
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
      )}
    </div>
  );
}
