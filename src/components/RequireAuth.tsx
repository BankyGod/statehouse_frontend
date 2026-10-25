import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth() {
  const { token, authLoading, characterMissing, characterLoading, character } = useAuth();
  const loc = useLocation();

  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  // Only block the shell on the *first* character load — never on post-action refetch
  if (authLoading || (characterLoading && !character)) {
    return <div className="center-screen">Loading session…</div>;
  }
  if (characterMissing || !character) return <Navigate to="/create-character" replace />;
  return <Outlet />;
}

export function GuestOnly() {
  const { token, authLoading, characterMissing, character } = useAuth();
  if (authLoading) return <div className="center-screen">Loading…</div>;
  if (token && character) return <Navigate to="/" replace />;
  if (token && characterMissing) return <Navigate to="/create-character" replace />;
  return <Outlet />;
}
