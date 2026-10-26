import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Briefcase,
  BriefcaseBusiness,
  Building,
  Building2,
  Factory,
  Flag,
  CandlestickChart,
  Dumbbell,
  FileBadge,
  Gavel,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Map,
  MapPin,
  MessagesSquare,
  Newspaper,
  Package,
  Plane,
  Scale,
  ScrollText,
  Skull,
  Users,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { educationApi, jobsApi, newsApi, statesApi } from '../api/endpoints';
import { useJobListing } from '../hooks/useJobDetails';
import { money } from '../lib/format';
import { Timer } from '../components/Timer';

type MenuItem = {
  to: string;
  label: string;
  hint: string;
  Icon: LucideIcon;
  danger?: boolean;
  locked?: boolean;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

export function DashboardPage() {
  const { character, refreshCharacter } = useAuth();
  const locked = !!character?.is_jailed || !!character?.is_traveling || !!character?.is_hospitalized;

  const homeQ = useQuery({
    queryKey: ['state', character?.home_state_id],
    queryFn: () => statesApi.get(character!.home_state_id),
    enabled: !!character,
  });

  const jobQ = useQuery({
    queryKey: ['jobs', 'me'],
    queryFn: () => jobsApi.me(),
  });
  const { listing: jobListing } = useJobListing(jobQ.data);

  const eduQ = useQuery({
    queryKey: ['education', 'me'],
    queryFn: () => educationApi.me(),
    refetchInterval: 30_000,
  });

  const newsQ = useQuery({
    queryKey: ['news', 'dash'],
    queryFn: () => newsApi.list({ limit: 6 }),
    refetchInterval: 60_000,
  });

  const activeEdu = eduQ.data?.find(
    (e) => e.status === 'enrolled' || e.status === 'in_progress' || e.status === 'active',
  );

  const menuGroups: MenuGroup[] = [
    {
      title: 'Life',
      items: [
        {
          to: '/jobs',
          label: jobQ.data ? 'Work' : 'Jobs',
          hint: jobQ.data ? 'Do a shift' : 'Get hired',
          Icon: Briefcase,
          locked,
        },
        { to: '/education', label: 'Education', hint: 'Study & age', Icon: GraduationCap, locked },
        { to: '/gym', label: 'Gym', hint: 'Train stats', Icon: Dumbbell, locked },
        { to: '/inventory', label: 'Inventory', hint: 'Shop & bag', Icon: Package, locked },
        { to: '/business', label: 'Business', hint: 'Companies', Icon: Building2, locked },
        { to: '/bank', label: 'Bank', hint: 'Cash & loans', Icon: Landmark, locked },
        { to: '/stocks', label: 'Stocks', hint: 'Trade & IPO', Icon: CandlestickChart, locked },
        { to: '/travel', label: 'Travel', hint: 'Change state', Icon: Plane, locked },
        {
          to: '/housing',
          label: 'Housing',
          hint: character?.is_homeless ? 'Find shelter' : 'Your place',
          Icon: Home,
          locked,
        },
        {
          to: '/medical',
          label: 'Medical',
          hint: `${character?.health ?? '—'}/${character?.max_health ?? '—'} HP`,
          Icon: HeartPulse,
          locked: locked && !character?.is_hospitalized,
        },
      ],
    },
    {
      title: 'Nation',
      items: [
        { to: '/politics', label: 'Politics', hint: 'Elections', Icon: Scale, locked },
        { to: '/parties', label: 'Parties', hint: 'Join a party', Icon: Flag, locked },
        { to: '/cabinet', label: 'Cabinet', hint: 'Ministers', Icon: BriefcaseBusiness, locked },
        {
          to: '/government',
          label: 'Civil service',
          hint: 'Gov posts',
          Icon: Building,
          locked,
        },
        {
          to: '/treasury',
          label: 'Treasury',
          hint: 'Tax & public purse',
          Icon: Landmark,
          locked,
        },
        {
          to: '/enterprises',
          label: 'Enterprises',
          hint: 'Rail · energy · ports',
          Icon: Factory,
        },
        { to: '/legislation', label: 'Laws', hint: 'Bills & budget', Icon: ScrollText, locked },
        { to: '/permits', label: 'Permits', hint: 'Licenses', Icon: FileBadge, locked },
      ],
    },
    {
      title: 'City',
      items: [
        { to: '/news', label: 'News', hint: 'Headlines', Icon: Newspaper },
        { to: '/chat', label: 'Chat', hint: 'State rooms', Icon: MessagesSquare, locked },
        { to: '/social', label: 'Social', hint: 'Friends & factions', Icon: Users, locked },
        { to: '/activity', label: 'Activity', hint: 'Alerts', Icon: Bell },
        { to: '/states', label: 'States', hint: 'United Amir', Icon: Map },
      ],
    },
    {
      title: 'Crime',
      items: [
        { to: '/crime', label: 'Crime', hint: 'Risky jobs', Icon: Skull, danger: true, locked },
        { to: '/jail', label: 'Jail', hint: 'Bail desk', Icon: Gavel },
      ],
    },
    {
      title: 'Account',
      items: [{ to: '/profile', label: 'Profile', hint: 'You', Icon: UserRound }],
    },
  ];

  return (
    <div className="dashboard">
      <section className="tbox status-box">
        <div className="tbox-title">
          <UserRound size={14} aria-hidden /> {character?.display_name}
        </div>
        <div className="tbox-body">
          <ul className="status-strip">
            <li>
              <MapPin size={14} aria-hidden />
              <div>
                <em>Home</em>
                <strong>{homeQ.data?.name ?? '…'}</strong>
              </div>
            </li>
            <li>
              <Briefcase size={14} aria-hidden />
              <div>
                <em>Job</em>
                <strong>
                  {jobQ.isLoading
                    ? '…'
                    : jobQ.data
                      ? (
                          <Link to="/jobs">
                            {jobListing?.title ?? `Job #${jobQ.data.listing_id}`}
                            <span className="muted">
                              {' '}
                              · {jobQ.data.shifts_completed} shifts
                            </span>
                          </Link>
                        )
                      : (
                          <Link to="/jobs">Unemployed</Link>
                        )}
                </strong>
              </div>
            </li>
            <li>
              <GraduationCap size={14} aria-hidden />
              <div>
                <em>Study</em>
                <strong>
                  {activeEdu ? (
                    <>
                      {activeEdu.title}{' '}
                      <Timer
                        completesAt={activeEdu.completes_at}
                        onComplete={() => {
                          void eduQ.refetch();
                          void refreshCharacter();
                        }}
                      />
                    </>
                  ) : (
                    <Link to="/education">None</Link>
                  )}
                </strong>
              </div>
            </li>
            <li>
              <Landmark size={14} aria-hidden />
              <div>
                <em>Cash</em>
                <strong className="cash">{money(character?.cash ?? 0)}</strong>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <div className="dash-layout">
        <section className="tbox">
          <div className="tbox-title">
            <LayoutIcon /> City menu
          </div>
          <div className="tbox-body pad-0">
            <div className="game-menu-groups">
              {menuGroups.map((group) => (
                <div key={group.title} className="game-menu-group">
                  <div className="game-menu-cat">{group.title}</div>
                  <div className="game-menu">
                    {group.items.map((m) => {
                      const inner = (
                        <>
                          <span className={`game-menu-icon ${m.danger ? 'danger' : ''}`}>
                            <m.Icon size={22} strokeWidth={2} aria-hidden />
                          </span>
                          <strong>{m.label}</strong>
                          <em>{m.hint}</em>
                        </>
                      );
                      if (m.locked) {
                        return (
                          <div
                            key={m.to + m.label}
                            className={`game-menu-item disabled ${m.danger ? 'danger' : ''}`}
                          >
                            {inner}
                          </div>
                        );
                      }
                      return (
                        <Link
                          key={m.to + m.label}
                          to={m.to}
                          className={`game-menu-item ${m.danger ? 'danger' : ''}`}
                        >
                          {inner}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="tbox">
          <div className="tbox-title">
            <Newspaper size={14} aria-hidden /> Headlines{' '}
            <Link to="/news" className="tbox-more">
              more
            </Link>
          </div>
          <div className="tbox-body">
            {!newsQ.data?.length && <p className="muted">No headlines yet.</p>}
            <ul className="dash-news">
              {newsQ.data?.map((n) => (
                <li key={n.id}>
                  <Link to="/news">
                    <strong>{n.headline}</strong>
                  </Link>
                  <span className="muted sm">
                    {n.category} · {new Date(n.published_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

function LayoutIcon() {
  return <Map size={14} aria-hidden />;
}
