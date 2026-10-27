import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  Building2,
  CandlestickChart,
  Dumbbell,
  Ellipsis,
  FileBadge,
  GraduationCap,
  HeartPulse,
  Home,
  Hospital,
  Inbox,
  Landmark,
  LayoutDashboard,
  LogOut,
  Map,
  MessagesSquare,
  Newspaper,
  Package,
  Plane,
  Scale,
  Skull,
  Users,
  UserRound,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Hud } from './Hud';
import { useAuth } from '../context/AuthContext';

export const NAV_GROUPS: {
  title: string;
  items: { to: string; label: string; end?: boolean; Icon: LucideIcon }[];
}[] = [
  {
    title: 'City',
    items: [
      { to: '/', label: 'Home', end: true, Icon: LayoutDashboard },
      { to: '/news', label: 'News', Icon: Newspaper },
      { to: '/chat', label: 'Chat', Icon: MessagesSquare },
      { to: '/inbox', label: 'Inbox', Icon: Inbox },
      { to: '/social', label: 'Social', Icon: Users },
      { to: '/activity', label: 'Activity', Icon: Bell },
      { to: '/states', label: 'States', Icon: Map },
    ],
  },
  {
    title: 'Life',
    items: [
      { to: '/jobs', label: 'Jobs', Icon: Briefcase },
      { to: '/education', label: 'Education', Icon: GraduationCap },
      { to: '/gym', label: 'Gym', Icon: Dumbbell },
      { to: '/inventory', label: 'Inventory', Icon: Package },
      { to: '/business', label: 'Business', Icon: Building2 },
      { to: '/marketplace', label: 'Marketplace', Icon: Package },
      { to: '/bank', label: 'Bank', Icon: Landmark },
      { to: '/stocks', label: 'Stocks', Icon: CandlestickChart },
      { to: '/travel', label: 'Travel', Icon: Plane },
      { to: '/housing', label: 'Housing', Icon: Home },
      { to: '/medical', label: 'Medical', Icon: HeartPulse },
    ],
  },
  {
    title: 'Nation',
    items: [
      { to: '/nation', label: 'Nation', Icon: Scale },
      { to: '/permits', label: 'Permits', Icon: FileBadge },
    ],
  },
  {
    title: 'Crime',
    items: [{ to: '/crime', label: 'Crime', Icon: Skull }],
  },
  {
    title: 'Account',
    items: [{ to: '/profile', label: 'Profile', Icon: UserRound }],
  },
];

const MOBILE_TABS: { to: string; label: string; end?: boolean; Icon: LucideIcon }[] = [
  { to: '/', label: 'Home', end: true, Icon: LayoutDashboard },
  { to: '/jobs', label: 'Work', Icon: Briefcase },
  { to: '/bank', label: 'Bank', Icon: Landmark },
  { to: '/crime', label: 'Crime', Icon: Skull },
];

const TAB_PREFIXES = ['/', '/jobs', '/bank', '/crime'] as const;

function isTabRoute(pathname: string) {
  if (pathname === '/') return true;
  return TAB_PREFIXES.some((p) => p !== '/' && (pathname === p || pathname.startsWith(`${p}/`)));
}

export function AppShell() {
  const { character, logout } = useAuth();
  const loc = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [loc.pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('sheet-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('sheet-open');
    };
  }, [moreOpen]);

  const moreActive = moreOpen || !isTabRoute(loc.pathname);

  return (
    <div className="app-shell">
      <Hud />
      <div className="shell-body">
        <nav className="side-nav" aria-label="Main">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="nav-group">
              <div className="nav-group-title">{group.title}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <item.Icon size={15} strokeWidth={2.25} className="nav-icon" aria-hidden />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <main className="page">
          {character?.is_jailed && (
            <p className="page-jail-note">
              <Skull size={14} aria-hidden /> Jailed — actions locked until release.{' '}
              <NavLink to="/jail">Bail desk</NavLink>
            </p>
          )}
          {character?.is_traveling && !character.is_jailed && (
            <p className="page-travel-note">
              <Plane size={14} aria-hidden /> Traveling — actions locked until arrival.
            </p>
          )}
          {character?.is_hospitalized && !character.is_jailed && (
            <p className="page-hospital-note">
              <Hospital size={14} aria-hidden /> Hospitalized — actions locked until discharge.
            </p>
          )}
          {character?.is_homeless && (
            <p className="page-homeless-note">
              <Home size={14} aria-hidden /> Homeless — rent or buy housing when you can.
            </p>
          )}
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="mobile-tabbar" aria-label="Primary">
        {MOBILE_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `mobile-tab ${isActive && !moreOpen ? 'active' : ''}`}
            onClick={() => setMoreOpen(false)}
          >
            <tab.Icon size={20} strokeWidth={2.25} aria-hidden />
            <span>{tab.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`mobile-tab ${moreActive ? 'active' : ''}`}
          aria-expanded={moreOpen}
          aria-controls="mobile-more-sheet"
          onClick={() => setMoreOpen((v) => !v)}
        >
          <Ellipsis size={20} strokeWidth={2.25} aria-hidden />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="mobile-sheet-root" role="presentation">
          <button
            type="button"
            className="mobile-sheet-backdrop"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div
            id="mobile-more-sheet"
            className="mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="All destinations"
          >
            <div className="mobile-sheet-handle" aria-hidden />
            <div className="mobile-sheet-head">
              <strong>Menu</strong>
              <button
                type="button"
                className="btn ghost sm icon-only"
                aria-label="Close"
                onClick={() => setMoreOpen(false)}
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <div className="mobile-sheet-body">
              {NAV_GROUPS.map((group) => (
                <div key={group.title} className="mobile-sheet-group">
                  <div className="mobile-sheet-cat">{group.title}</div>
                  <div className="mobile-sheet-grid">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          `mobile-sheet-link ${isActive ? 'active' : ''}`
                        }
                      >
                        <item.Icon size={18} strokeWidth={2.25} aria-hidden />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
              <button type="button" className="mobile-sheet-logout" onClick={logout}>
                <LogOut size={16} aria-hidden /> Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
