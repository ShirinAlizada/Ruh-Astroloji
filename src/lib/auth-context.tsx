import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, clearTokens, getStoredTokens, storeTokens, type CurrentUser } from "./api";

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  // DÜZƏLİŞ (2026-10-27): e-poçt təsdiqləmə axını — register() indi birbaşa daxil etmir,
  // kodu confirmEmail() ilə doğrulamaq lazımdır (bax AuthService.ConfirmEmailAsync).
  confirmEmail: (email: string, code: string) => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    const { accessToken } = getStoredTokens();
    if (!accessToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password);
    storeTokens(res.accessToken, res.refreshToken);
    setUser({ userId: res.id, email: res.email, role: res.role });
  }

  async function register(email: string, password: string, fullName: string) {
    // DÜZƏLİŞ (2026-10-27): qeydiyyatdan sonra artıq birbaşa giriş EDİLMİR — e-poçta
    // göndərilən kod confirmEmail() ilə doğrulanana qədər hesab aktivləşmir.
    await authApi.register(email, password, fullName);
  }

  async function confirmEmail(email: string, code: string) {
    const res = await authApi.confirmEmail(email, code);
    storeTokens(res.accessToken, res.refreshToken);
    setUser({ userId: res.id, email: res.email, role: res.role });
  }

  async function resendConfirmationCode(email: string) {
    await authApi.resendConfirmationCode(email);
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // best-effort — token artıq etibarsızdırsa belə lokal state təmizlənsin
    }
    clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, confirmEmail, resendConfirmationCode, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider daxilində çağırılmalıdır");
  return ctx;
}
