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
  /** True only on first load with no cached character (never blocks mid-action). */
  characterLoading: boolean;
  characterMissing: boolean;
  authLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  /** Soft background refresh — does not remount the app. */
  refreshCharacter: () => Promise<void>;
  /** Merge HUD fields instantly (socket / action responses). */
  patchCharacter: (partial: Partial<Character>) => void;
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
    staleTime: 60_000,
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
    // Keep showing last HUD while refetching — critical for instant feel
    placeholderData: (prev) => prev,
    staleTime: 15_000,
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

  const patchCharacter = useCallback(
    (partial: Partial<Character>) => {
      if (!token) return;
      qc.setQueryData<Character | null>(['character', 'me', token], (prev) => {
        if (!prev) return prev;
        return { ...prev, ...partial };
      });
    },
    [qc, token],
  );

  const refreshCharacter = useCallback(async () => {
    // Background refetch — UI stays mounted (RequireAuth only waits on first load)
    await qc.invalidateQueries({ queryKey: ['character', 'me'], refetchType: 'active' });
  }, [qc]);

  const value = useMemo<AuthCtx>(
    () => ({
      token,
      user: userQuery.data ?? null,
      character: characterQuery.data ?? null,
      characterLoading: characterQuery.isPending && characterQuery.data === undefined,
      characterMissing:
        !!token &&
        !!userQuery.data &&
        characterQuery.data === null &&
        !characterQuery.isPending,
      authLoading: !!token && userQuery.isPending && !userQuery.data,
      login,
      register,
      logout,
      refreshCharacter,
      patchCharacter,
    }),
    [
      token,
      userQuery.data,
      userQuery.isPending,
      characterQuery.data,
      characterQuery.isPending,
      login,
      register,
      logout,
      refreshCharacter,
      patchCharacter,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}
