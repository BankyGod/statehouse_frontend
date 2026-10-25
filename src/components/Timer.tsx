import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { countdown } from '../lib/format';

type Props = {
  completesAt: string | null | undefined;
  onComplete?: () => void;
  className?: string;
};

export function Timer({ completesAt, onComplete, className }: Props) {
  const [now, setNow] = useState(Date.now());
  const [fired, setFired] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!completesAt || fired) return;
    if (new Date(completesAt).getTime() <= now) {
      setFired(true);
      onComplete?.();
    }
  }, [completesAt, now, fired, onComplete]);

  useEffect(() => {
    setFired(false);
  }, [completesAt]);

  const label = countdown(completesAt, now);
  const ready = label === 'Ready';

  return (
    <span className={`timer ${ready ? 'timer-ready' : 'timer-tick'} ${className ?? ''}`}>
      <Clock3 size={13} aria-hidden className="timer-icon" />
      {label}
    </span>
  );
}
