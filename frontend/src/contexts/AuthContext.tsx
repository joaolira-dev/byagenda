import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { authService } from '@/services/auth.service';
import {
  deleteAuthToken,
  getAuthToken,
  saveAuthToken,
} from '@/services/token-storage';
import type {
  AuthSession,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@/types/auth';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  register: (payload: RegisterPayload) => Promise<AuthSession>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const storedToken = await getAuthToken();

        if (!storedToken) {
          return;
        }

        const currentUser = await authService.me(storedToken);

        if (isMounted) {
          setToken(storedToken);
          setUser(currentUser);
        }
      } catch {
        await deleteAuthToken();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistSession = useCallback(async (session: AuthSession) => {
    await saveAuthToken(session.token);
    setToken(session.token);
    setUser(session.user);
    return session;
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setIsSubmitting(true);

      try {
        const session = await authService.login(payload);
        return await persistSession(session);
      } finally {
        setIsSubmitting(false);
      }
    },
    [persistSession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setIsSubmitting(true);

      try {
        const session = await authService.register(payload);
        return await persistSession(session);
      } finally {
        setIsSubmitting(false);
      }
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    await deleteAuthToken();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isSubmitting,
      login,
      register,
      logout,
    }),
    [isLoading, isSubmitting, login, logout, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
