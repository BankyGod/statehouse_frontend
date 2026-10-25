import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, charactersApi } from '../api/endpoints';
import { getToken, setToken } from '../api/client';
import type { Character, UserOut } from '../types/api';

type AuthCtx = {
  token: string | null;
  user: UserOut | null;
  character: Character | null;
  characterLoading: boolean;
  characterMissing: boolean;
  authLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshCharacter: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [token, setTokenState] = useState<string | null>(() => getToken());

  const persist = useCallback((t: string | null) => {
    setToken(t);
    setTokenState(t);
  }, []);

  const userQuery = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: () => authApi.me(),
    enabled: !!token,
    retry: false,
  });

  const characterQuery = useQuery({
    queryKey: ['character', 'me', token],
    queryFn: async () => {
      try {
        return await charactersApi.me();
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) return null;
        throw err;
      }
    },
    enabled: !!token && !!userQuery.data,
    retry: false,
  });

  useEffect(() => {
    if (userQuery.isError && token) {
      persist(null);
      qc.clear();
    }
  }, [userQuery.isError, token, persist, qc]);

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await authApi.login(username, password);
      persist(res.access_token);
      await qc.invalidateQueries();
    },
    [persist, qc],
  );

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      await authApi.register({ email, username, password });
      await login(username, password);
    },
    [login],
  );

  const logout = useCallback(() => {
    persist(null);
    qc.clear();
  }, [persist, qc]);

  const refreshCharacter = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ['character', 'me'] });
  }, [qc]);

  const value = useMemo<AuthCtx>(
    () => ({
      token,
      user: userQuery.data ?? null,
      character: characterQuery.data ?? null,
      characterLoading: characterQuery.isLoading || characterQuery.isFetching,
      characterMissing: !!token && !!userQuery.data && characterQuery.data === null && !characterQuery.isLoading,
      authLoading: !!token && userQuery.isLoading,
      login,
      register,
      logout,
      refreshCharacter,
    }),
    [
      token,
      userQuery.data,
      userQuery.isLoading,
      characterQuery.data,
      characterQuery.isLoading,
      characterQuery.isFetching,
      login,
      register,
      logout,
      refreshCharacter,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}
