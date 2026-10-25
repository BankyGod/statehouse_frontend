import { AlertTriangle } from 'lucide-react';
import { formatApiError } from '../api/client';

type Props = {
  error?: unknown;
  title?: string;
  message?: string;
  className?: string;
};

/** Inline alert for failed queries / blocked actions. */
export function ErrorNotice({ error, title, message, className }: Props) {
  const info = error != null ? formatApiError(error) : null;
  const heading = title ?? info?.title ?? 'Something went wrong';
  const body = message ?? info?.message ?? 'Please try again.';

  return (
    <div className={`error-notice ${className ?? ''}`} role="alert">
      <AlertTriangle size={18} className="error-notice-icon" aria-hidden />
      <div className="error-notice-body">
        <strong>{heading}</strong>
        <p>{body}</p>
      </div>
    </div>
  );
}
