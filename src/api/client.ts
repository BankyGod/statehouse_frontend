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

export function getErrorDetail(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ detail?: unknown }>;
    const detail = ax.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d) => {
          if (typeof d === 'string') return d;
          if (d && typeof d === 'object' && 'msg' in d) return String((d as { msg: string }).msg);
          return JSON.stringify(d);
        })
        .join('; ');
    }
    if (detail && typeof detail === 'object') return JSON.stringify(detail);
    return ax.message || 'Request failed';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
