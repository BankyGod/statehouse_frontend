import type { ReactNode } from 'react';
import type { StateSummary } from '../types/api';
import { money, num, pct, securityLabel } from '../lib/format';
import { getStateTheme } from '../lib/stateArt';

type Props = {
  state: StateSummary;
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  asLink?: boolean;
};

export function StateCard({ state, selected, onSelect, disabled, asLink }: Props) {
  const closed = !state.is_open || disabled;
  const theme = getStateTheme(state.slug);
  const className = `state-card ${selected ? 'selected' : ''} ${closed ? 'closed' : ''}`;
  const style = { ['--state-accent' as string]: theme.accent };

  const body: ReactNode = (
    <>
      <div className="state-card-bg" aria-hidden>
        {theme.scene}
      </div>
      <div className="state-card-veil" aria-hidden />
      <div className="state-card-body">
        <span className="state-art-tag">{theme.label}</span>
        <div className="state-card-top">
          <strong>{state.name}</strong>
          <span className="state-capital">{state.capital}</span>
        </div>
        <p className="state-profile">{state.economic_profile}</p>
        <dl className="state-stats">
          <div>
            <dt>Pop</dt>
            <dd
              title={
                state.npc_population_count != null
                  ? `${state.player_population ?? 0} players · ${state.npc_population_count} NPCs (cap is players only)`
                  : undefined
              }
            >
              {num(state.population_count)}
              <span className="muted">/{num(state.population_cap)}</span>
              {state.npc_population_count != null && state.npc_population_count > 0 && (
                <span className="muted sm"> · {num(state.npc_population_count)} NPC</span>
              )}
            </dd>
          </div>
          <div>
            <dt>Avg income</dt>
            <dd>{money(state.average_income)}</dd>
          </div>
          <div>
            <dt>Start bonus</dt>
            <dd className="accent">{money(state.starting_bonus)}</dd>
          </div>
          <div>
            <dt>Security</dt>
            <dd>
              {securityLabel(state.crime_catch_rate)} ({pct(state.crime_catch_rate)})
            </dd>
          </div>
        </dl>
        {!state.is_open && <span className="badge warn">Full / closed</span>}
      </div>
    </>
  );

  if (asLink || !onSelect) {
    return (
      <div className={className} style={style}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={onSelect}
      disabled={closed}
    >
      {body}
    </button>
  );
}
