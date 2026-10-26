import { Bus, Plane, TrainFront } from 'lucide-react';
import type { TravelOption } from '../types/api';
import { money } from '../lib/format';

type Props = {
  option: TravelOption;
  fromName: string;
  toName: string;
  passengerName?: string;
  className?: string;
};

function codeFromName(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9 ]/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0].slice(0, 2) + parts[1].slice(0, 1)).toUpperCase();
  }
  return cleaned.slice(0, 3).toUpperCase() || 'UAM';
}

function ModeGlyph({ mode }: { mode: string }) {
  if (mode === 'rail') return <TrainFront size={20} aria-hidden />;
  if (mode === 'bus') return <Bus size={20} aria-hidden />;
  return <Plane size={20} aria-hidden />;
}

function modeLabel(mode: string) {
  if (mode === 'rail') return 'RAIL PASS';
  if (mode === 'bus') return 'COACH TICKET';
  return 'BOARDING PASS';
}

function modeClass(mode: string) {
  if (mode === 'rail') return 'rail';
  if (mode === 'bus') return 'bus';
  return 'air';
}

export function TravelTicket({
  option,
  fromName,
  toName,
  passengerName = 'Traveler',
  className,
}: Props) {
  const fare =
    option.discounted_cost != null ? option.discounted_cost : option.cost;
  const fromCode = codeFromName(fromName);
  const toCode = codeFromName(toName);
  const ticketNo = `UA-${option.carrier_id.toString().padStart(4, '0')}-${option.to_state_id}`;
  const mode = modeClass(option.mode);

  return (
    <article className={`travel-ticket mode-${mode} ${className ?? ''}`}>
      <div className="travel-ticket-main">
        <header className="travel-ticket-head">
          <div className="travel-ticket-carrier">
            <ModeGlyph mode={option.mode} />
            <div>
              <strong>{option.carrier_name}</strong>
              <span>{modeLabel(option.mode)} · UNITED AMIR</span>
            </div>
          </div>
          <span className="travel-ticket-badge">
            {option.ownership === 'government' ? 'STATE' : 'PRIVATE'}
          </span>
        </header>

        <div className="travel-ticket-route">
          <div className="travel-ticket-city">
            <em>From</em>
            <strong>{fromCode}</strong>
            <span>{fromName}</span>
          </div>
          <div className="travel-ticket-flight" aria-hidden>
            <span className="travel-ticket-dash" />
            <ModeGlyph mode={option.mode} />
            <span className="travel-ticket-dash" />
          </div>
          <div className="travel-ticket-city to">
            <em>To</em>
            <strong>{toCode}</strong>
            <span>{toName}</span>
          </div>
        </div>

        <dl className="travel-ticket-meta">
          <div>
            <dt>Passenger</dt>
            <dd>{passengerName}</dd>
          </div>
          <div>
            <dt>{option.mode === 'air' ? 'Flight time' : 'Journey'}</dt>
            <dd>{option.minutes} min</dd>
          </div>
          <div>
            <dt>Comfort</dt>
            <dd>{option.comfort}/5</dd>
          </div>
          <div>
            <dt>Fare</dt>
            <dd className="cash">{money(fare)}</dd>
          </div>
        </dl>

        {option.tagline && <p className="travel-ticket-tag">{option.tagline}</p>}
      </div>

      <aside className="travel-ticket-stub" aria-hidden>
        <div className="travel-ticket-stub-inner">
          <span className="travel-ticket-stub-mode">{option.mode.toUpperCase()}</span>
          <strong>{toCode}</strong>
          <span className="travel-ticket-stub-fare">{money(fare)}</span>
          <div className="travel-ticket-barcode">
            {Array.from({ length: 18 }, (_, i) => (
              <i key={i} style={{ width: 1 + ((i * 3) % 4) }} />
            ))}
          </div>
          <span className="travel-ticket-no">{ticketNo}</span>
        </div>
      </aside>
    </article>
  );
}
