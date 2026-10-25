import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await register(email.trim(), username.trim(), password);
      toast.push('Account created. Pick your home state.', 'ok');
      nav('/create-character');
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
        <h1>Register</h1>
        <p className="lede">One character per account. Choose carefully — then live it.</p>
        <form onSubmit={onSubmit} className="stack-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={64}
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
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </label>
          <button type="submit" className="btn primary" disabled={busy}>
            <UserPlus size={16} aria-hidden />
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
