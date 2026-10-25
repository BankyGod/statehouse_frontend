export function money(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

export function num(n: number, digits = 0): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export function countdown(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '—';
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return 'Ready';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function canResetHome(chosenAt: string, locked: boolean): boolean {
  if (locked) return false;
  const chosen = new Date(chosenAt).getTime();
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  return Date.now() - chosen < threeDays;
}

export function securityLabel(catchRate: number): string {
  if (catchRate >= 0.7) return 'Very tight';
  if (catchRate >= 0.5) return 'Tight';
  if (catchRate >= 0.35) return 'Moderate';
  return 'Loose';
}
