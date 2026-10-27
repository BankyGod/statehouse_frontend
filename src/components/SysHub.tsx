import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type SysHubTone = 'green' | 'blue' | 'amber' | 'slate' | 'rose' | 'teal';

type SysHubCardProps = {
  to: string;
  title: string;
  blurb: ReactNode;
  cta: string;
  Icon: LucideIcon;
  tone?: SysHubTone;
};

export function SysHubGrid({ children }: { children: ReactNode }) {
  return <div className="sys-hub-grid">{children}</div>;
}

export function SysHubCard({
  to,
  title,
  blurb,
  cta,
  Icon,
  tone = 'slate',
}: SysHubCardProps) {
  return (
    <Link to={to} className={`sys-hub-card tone-${tone}`}>
      <div className="sys-hub-icon" aria-hidden>
        <Icon size={28} />
      </div>
      <div className="sys-hub-body">
        <h2>{title}</h2>
        <p>{blurb}</p>
      </div>
      <span className="sys-hub-go">
        {cta} <ArrowRight size={16} aria-hidden />
      </span>
    </Link>
  );
}

export function HubBack({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="btn ghost sm sys-hub-back">
      <ArrowLeft size={14} aria-hidden /> {label}
    </Link>
  );
}

export function HubPageShell({
  title,
  Icon,
  lede,
  children,
}: {
  title: string;
  Icon: LucideIcon;
  lede?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="play-page">
      <header className="page-header compact">
        <h1>
          <Icon size={22} aria-hidden /> {title}
        </h1>
        {lede ? <p className="lede">{lede}</p> : null}
      </header>
      {children}
    </div>
  );
}
