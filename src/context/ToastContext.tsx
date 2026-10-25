import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { formatApiError } from '../api/client';

type ToastKind = 'ok' | 'err' | 'info';

type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  message: string;
};

type ToastInput =
  | string
  | {
      title?: string;
      message: string;
    };

type ToastCtx = {
  push: (message: ToastInput, kind?: ToastKind) => void;
  pushError: (err: unknown) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

let seq = 0;

const ICONS = {
  ok: CheckCircle2,
  err: AlertTriangle,
  info: Info,
} as const;

const TITLES: Record<ToastKind, string> = {
  ok: 'Done',
  err: 'Error',
  info: 'Notice',
};

const DURATIONS: Record<ToastKind, number> = {
  ok: 3500,
  info: 4000,
  err: 7000,
};

function normalize(input: ToastInput, kind: ToastKind): { title: string; message: string } {
  if (typeof input === 'string') {
    return { title: TITLES[kind], message: input };
  }
  return {
    title: input.title?.trim() || TITLES[kind],
    message: input.message,
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((input: ToastInput, kind: ToastKind = 'info') => {
    const id = ++seq;
    const { title, message } = normalize(input, kind);
    setToasts((t) => [...t.slice(-4), { id, kind, title, message }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, DURATIONS[kind]);
  }, []);

  const pushError = useCallback(
    (err: unknown) => {
      const info = formatApiError(err);
      push({ title: info.title, message: info.message }, 'err');
    },
    [push],
  );

  const value = useMemo(() => ({ push, pushError }), [push, pushError]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div key={t.id} className={`toast toast-${t.kind}`} role={t.kind === 'err' ? 'alert' : 'status'}>
              <Icon size={18} className="toast-icon" aria-hidden />
              <div className="toast-body">
                <strong className="toast-title">{t.title}</strong>
                <span className="toast-msg">{t.message}</span>
              </div>
              <button
                type="button"
                className="toast-dismiss"
                aria-label="Dismiss"
                onClick={() => dismiss(t.id)}
              >
                <X size={14} aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast outside provider');
  return ctx;
}
