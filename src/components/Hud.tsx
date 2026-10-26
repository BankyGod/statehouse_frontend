import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  Flame,
  HeartPulse,
  Home,
  Landmark,
  LogOut,
  MapPin,
  PiggyBank,
  Plane,
  ShieldAlert,
  Smile,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { money, num } from '../lib/format';
import { statesApi } from '../api/endpoints';
import { Timer } from './Timer';

export function Hud() {
  const { character, user, logout, refreshCharacter } = useAuth();

  const homeQ = useQuery({
    queryKey: ['state', character?.home_state_id],
    queryFn: () => statesApi.get(character!.home_state_id),
    enabled: !!character,
  });
  const currentQ = useQuery({
    queryKey: ['state', character?.current_state_id],
    queryFn: () => statesApi.get(character!.current_state_id),
    enabled: !!character && character.current_state_id !== character.home_state_id,
  });
  const destQ = useQuery({
    queryKey: ['state', character?.travel_destination_id],
    queryFn: () => statesApi.get(character!.travel_destination_id!),
    enabled: !!character?.is_traveling && !!character.travel_destination_id,
  });

  if (!character) return null;

  const homeName = homeQ.data?.name ?? `State #${character.home_state_id}`;
  const currentName =
    character.current_state_id === character.home_state_id
      ? homeName
      : (currentQ.data?.name ?? `State #${character.current_state_id}`);
  const destName =
    destQ.data?.name ??
    (character.travel_destination_id != null
      ? `State #${character.travel_destination_id}`
      : '…');

  const energyPct = pct(character.energy, character.max_energy);
  const hpPct = pct(character.health, character.max_health);

  return (
    <header className="hud">
      <div className="hud-row">
        <Link to="/" className="hud-logo">
          <Landmark size={18} aria-hidden />
          <span className="hud-logo-text">State House</span>
        </Link>

        <div className="hud-meters">
          <Meter
            icon={<Zap size={13} aria-hidden />}
            label="Energy"
            value={`${character.energy}/${character.max_energy}`}
            pct={energyPct}
            tone="energy"
            pulseKey={character.energy}
          />
          <Meter
            icon={<HeartPulse size={13} aria-hidden />}
            label="Life"
            value={`${character.health}/${character.max_health}`}
            pct={hpPct}
            tone={hpPct < 35 ? 'warn' : 'life'}
            pulseKey={character.health}
          />
        </div>

        <div className="hud-stats">
          <Chip icon={<Banknote size={13} aria-hidden />} label="Cash" value={money(character.cash)} tone="cash" pulseKey={character.cash} />
          <Chip icon={<PiggyBank size={13} aria-hidden />} label="Bank" value={money(character.bank_balance)} tone="cash" pulseKey={character.bank_balance} className="hud-desktop-only" />
          <Chip icon={<Sparkles size={13} aria-hidden />} label="Age" value={num(character.age_years, 1)} pulseKey={character.age_years} className="hud-desktop-only" />
          <Chip icon={<Flame size={13} aria-hidden />} label="Heat" value={num(character.heat, 1)} tone={character.heat > 20 ? 'warn' : undefined} pulseKey={character.heat} className="hud-desktop-only" />
          <Chip
            icon={<Smile size={13} aria-hidden />}
            label="Happy"
            value={String(character.happiness ?? 50)}
            pulseKey={character.happiness ?? 50}
            className="hud-desktop-only"
          />
          <Chip icon={<ShieldAlert size={13} aria-hidden />} label="Rep" value={String(character.reputation)} pulseKey={character.reputation} className="hud-desktop-only" />
        </div>

        <div className="hud-loc hud-desktop-only">
          <span>
            <Home size={12} aria-hidden /> {homeName}
          </span>
          <span>
            <MapPin size={12} aria-hidden /> {currentName}
          </span>
        </div>

        <div className="hud-player">
          <Link to="/profile" className="hud-user">
            <User size={14} aria-hidden />
            <span className="hud-desktop-only">
              <strong>{character.display_name}</strong>
              <small>{user?.username}</small>
            </span>
          </Link>
          <button type="button" className="btn ghost sm hud-desktop-only" onClick={logout} title="Log out">
            <LogOut size={14} aria-hidden />
          </button>
        </div>
      </div>

      <div className="hud-mobile-strip" aria-hidden={false}>
        <span>
          <MapPin size={11} aria-hidden /> {currentName}
        </span>
        <span className="cash">
          <PiggyBank size={11} aria-hidden /> {money(character.bank_balance)}
        </span>
        <span>
          <Flame size={11} aria-hidden /> {num(character.heat, 1)}
        </span>
        <span>
          <Sparkles size={11} aria-hidden /> {num(character.age_years, 1)}y
        </span>
      </div>

      {character.is_jailed && (
        <div className="status-banner jail">
          <ShieldAlert size={14} aria-hidden /> JAILED until{' '}
          <Timer completesAt={character.jail_until} onComplete={() => void refreshCharacter()} />
        </div>
      )}
      {character.is_traveling && !character.is_jailed && (
        <div className="status-banner travel">
          <Plane size={14} aria-hidden /> Traveling to {destName} —{' '}
          <Timer completesAt={character.travel_until} onComplete={() => void refreshCharacter()} />
        </div>
      )}
      {character.is_hospitalized && !character.is_jailed && (
        <div className="status-banner hospital">
          HOSPITALIZED{character.condition ? ` · ${character.condition}` : ''} —{' '}
          <Timer
            completesAt={character.hospital_until}
            onComplete={() => void refreshCharacter()}
          />
        </div>
      )}
    </header>
  );
}

function pct(v: number, max: number) {
  return Math.max(0, Math.min(100, (v / Math.max(1, max)) * 100));
}

function Meter({
  icon,
  label,
  value,
  pct: percent,
  tone,
  pulseKey,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  pct: number;
  tone?: string;
  pulseKey: number | string;
}) {
  const flash = useFlash(pulseKey);
  return (
    <div className={`hud-meter ${tone ? `tone-${tone}` : ''} ${flash ? 'stat-flash' : ''}`}>
      <div className="hud-meter-head">
        <span>
          {icon} {label}
        </span>
        <strong>{value}</strong>
      </div>
      <span className="hud-meter-track" aria-hidden>
        <span className="hud-meter-fill" style={{ width: `${percent}%` }} />
      </span>
    </div>
  );
}

function Chip({
  icon,
  label,
  value,
  tone,
  pulseKey,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: string;
  pulseKey: number | string;
  className?: string;
}) {
  const flash = useFlash(pulseKey);
  return (
    <div
      className={`hud-chip ${tone ? `tone-${tone}` : ''} ${flash ? 'stat-flash' : ''} ${className ?? ''}`}
      title={label}
    >
      <span className="hud-chip-label">
        {icon} {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function useFlash(pulseKey: number | string) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(pulseKey);
  useEffect(() => {
    if (prev.current !== pulseKey) {
      prev.current = pulseKey;
      setFlash(true);
      const id = window.setTimeout(() => setFlash(false), 350);
      return () => window.clearTimeout(id);
    }
  }, [pulseKey]);
  return flash;
}
