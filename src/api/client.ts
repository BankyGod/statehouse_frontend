import axios, { AxiosError } from 'axios';

const TOKEN_KEY = 'statehouse_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000',
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type ApiErrorInfo = {
  title: string;
  message: string;
  status?: number;
};

function detailFromBody(detail: unknown): string | null {
  if (detail == null) return null;
  if (typeof detail === 'string') return detail.trim() || null;
  if (Array.isArray(detail)) {
    const parts = detail
      .map((d) => {
        if (typeof d === 'string') return d;
        if (d && typeof d === 'object') {
          const item = d as { msg?: string; loc?: unknown[]; type?: string };
          if (item.msg) {
            const field =
              Array.isArray(item.loc) && item.loc.length
                ? String(item.loc[item.loc.length - 1]).replaceAll('_', ' ')
                : null;
            return field ? `${field}: ${item.msg}` : item.msg;
          }
        }
        return null;
      })
      .filter(Boolean);
    return parts.length ? parts.join(' · ') : null;
  }
  if (typeof detail === 'object') {
    const obj = detail as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.msg === 'string') return obj.msg;
    try {
      return JSON.stringify(detail);
    } catch {
      return null;
    }
  }
  return String(detail);
}

function titleForStatus(status?: number): string {
  switch (status) {
    case 400:
      return 'Request rejected';
    case 401:
      return 'Sign in required';
    case 403:
      return 'Not allowed';
    case 404:
      return 'Not found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Check your input';
    case 429:
      return 'Too many requests';
    case 500:
    case 502:
    case 503:
      return 'Server problem';
    default:
      return 'Something went wrong';
  }
}

/** Structured, user-facing error for toasts and banners. */
export function formatApiError(err: unknown): ApiErrorInfo {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ detail?: unknown; message?: string }>;
    const status = ax.response?.status;
    const fromDetail = detailFromBody(ax.response?.data?.detail);
    const fromMessage =
      typeof ax.response?.data?.message === 'string' ? ax.response.data.message : null;

    if (!ax.response) {
      if (ax.code === 'ECONNABORTED') {
        return {
          title: 'Timed out',
          message: 'The server took too long to respond. Try again.',
        };
      }
      return {
        title: 'Can’t reach the server',
        message: 'Check that the API is running and your connection is online.',
      };
    }

    const message =
      fromDetail ||
      fromMessage ||
      (status === 401
        ? 'Your session may have expired. Please log in again.'
        : status === 403
          ? 'You don’t have permission to do that right now.'
          : status === 404
            ? 'That item isn’t available.'
            : ax.message || 'The request failed.');

    return { title: titleForStatus(status), message, status };
  }

  if (err instanceof Error && err.message) {
    return { title: 'Something went wrong', message: err.message };
  }

  return { title: 'Something went wrong', message: 'Please try again.' };
}

/** Single-line message (toasts / legacy callers). */
export function getErrorDetail(err: unknown): string {
  const info = formatApiError(err);
  if (info.message.startsWith(info.title)) return info.message;
  // Keep toast body readable; title is shown separately when using formatApiError
  return info.message;
}
