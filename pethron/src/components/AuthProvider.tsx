"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import AuthModal from "./AuthModal";
import { getAccount, logoutAccount } from "@/lib/store";
import type { UserAccount } from "@/lib/types";

type AuthMode = "login" | "register";

interface AuthContextValue {
  account: UserAccount | null;
  ready: boolean;
  isLoggedIn: boolean;
  authMode: AuthMode | null;
  openAuth: (mode?: AuthMode, onSuccess?: () => void) => void;
  closeAuth: () => void;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [ready, setReady] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const pendingRef = useRef<(() => void) | null>(null);

  const refresh = useCallback(() => {
    setAccount(getAccount());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
    const onChange = () => refresh();
    window.addEventListener("pethron:sessions-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("pethron:sessions-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const openAuth = useCallback((mode: AuthMode = "login", onSuccess?: () => void) => {
    pendingRef.current = onSuccess ?? null;
    setAuthMode(mode);
  }, []);

  const closeAuth = useCallback(() => {
    pendingRef.current = null;
    setAuthMode(null);
  }, []);

  const logout = useCallback(() => {
    logoutAccount();
    refresh();
  }, [refresh]);

  const handleSuccess = useCallback(() => {
    refresh();
    const cb = pendingRef.current;
    pendingRef.current = null;
    setAuthMode(null);
    if (cb) cb();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      account,
      ready,
      isLoggedIn: Boolean(account),
      authMode,
      openAuth,
      closeAuth,
      logout,
      refresh,
    }),
    [account, ready, authMode, openAuth, closeAuth, logout, refresh],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {authMode ? (
        <AuthModal mode={authMode} onClose={closeAuth} onSuccess={handleSuccess} />
      ) : null}
    </AuthContext.Provider>
  );
}
