import { Hospital, Plane, Skull } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Timer } from './Timer';

/** Compact lock reason for play-loop pages (jail / travel / hospital). */
export function LockBanner() {
  const { character, refreshCharacter } = useAuth();
  if (!character) return null;

  if (character.is_jailed) {
    return (
      <div className="play-lock jail">
        <Skull size={14} aria-hidden />
        <span>
          Jailed — actions locked{' '}
          <Timer completesAt={character.jail_until} onComplete={() => void refreshCharacter()} />
        </span>
      </div>
    );
  }
  if (character.is_traveling) {
    return (
      <div className="play-lock travel">
        <Plane size={14} aria-hidden />
        <span>
          Traveling — actions locked{' '}
          <Timer completesAt={character.travel_until} onComplete={() => void refreshCharacter()} />
        </span>
      </div>
    );
  }
  if (character.is_hospitalized) {
    return (
      <div className="play-lock hospital">
        <Hospital size={14} aria-hidden />
        <span>
          Hospitalized — actions locked{' '}
          <Timer
            completesAt={character.hospital_until}
            onComplete={() => void refreshCharacter()}
          />
        </span>
      </div>
    );
  }
  return null;
}
