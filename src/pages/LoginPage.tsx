import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(username.trim(), password);
      toast.push('Welcome back.', 'ok');
      nav('/');
    } catch (err) {
      toast.pushError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-ambiance" aria-hidden />
      <div className="auth-panel">
        <div className="brand-row">
          <span className="brand-orb">
            <Landmark size={22} aria-hidden />
          </span>
          <p className="brand-mark">The State House</p>
        </div>
        <h1>Log in</h1>
        <p className="lede">Sign in to continue your character.</p>
        <form onSubmit={onSubmit} className="stack-form">
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" className="btn primary" disabled={busy}>
            <LogIn size={16} aria-hidden />
            {busy ? 'Signing in…' : 'Log in'}
          </button>
        </form>
        <p className="auth-switch">
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
