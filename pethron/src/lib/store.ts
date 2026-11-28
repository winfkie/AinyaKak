import { GUEST_SESSIONS_KEY, USER_ACCOUNT_KEY } from "./content";
import type { PlanId, SessionReport, UserAccount } from "./types";

/* ------------------------------------------------------------------ */
/* Client-side storage layer (localStorage)                            */
/* Guest sessions live in `pethron_guest_sessions`; accounts live in   */
/* `pethron_user_account`. Logging in migrates guest sessions over.    */
/* ------------------------------------------------------------------ */

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/* ----------------------------- Guest ------------------------------ */

export function getGuestSessions(): SessionReport[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(GUEST_SESSIONS_KEY);
  const parsed = safeParse<SessionReport[]>(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveGuestSession(session: SessionReport): void {
  if (!isBrowser()) return;
  const sessions = [session, ...getGuestSessions()];
  window.localStorage.setItem(GUEST_SESSIONS_KEY, JSON.stringify(sessions));
}

/* ---------------------------- Account ----------------------------- */

export function getAccount(): UserAccount | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(USER_ACCOUNT_KEY);
  const parsed = safeParse<UserAccount | null>(raw, null);
  if (!parsed || !parsed.id || !parsed.email) return null;
  if (!Array.isArray(parsed.sessions)) parsed.sessions = [];
  return parsed;
}

export function saveAccount(account: UserAccount): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(USER_ACCOUNT_KEY, JSON.stringify(account));
}

export function registerAccount(input: { name: string; email: string; password: string }): UserAccount {
  const existing = getAccount();
  const account: UserAccount = {
    id: existing?.id ?? crypto.randomUUID(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    createdAt: existing?.createdAt ?? Date.now(),
    plan: existing?.plan ?? "free",
    sessions: existing?.sessions ?? [],
    guestMigrated: false,
  };
  saveAccount(account);
  return account;
}

export function loginAccount(input: { email: string; password: string }): { ok: boolean; error?: string } {
  const account = getAccount();
  if (!account) {
    return { ok: false, error: "Belum ada akun di browser ini. Daftar dulu ya, atau pakai akun demo." };
  }
  if (account.email !== input.email.trim().toLowerCase()) {
    return { ok: false, error: "Email belum cocok dengan akun yang tersimpan di browser ini." };
  }
  if (account.password !== input.password) {
    return { ok: false, error: "Password-nya belum pas. Coba cek lagi." };
  }
  return { ok: true };
}

export function demoAccount(): UserAccount {
  const account: UserAccount = {
    id: "demo-account",
    name: "Tim Demo",
    email: "demo@pethron.app",
    password: "pethron-demo",
    createdAt: Date.now(),
    plan: "pro",
    sessions: [],
    guestMigrated: false,
  };
  saveAccount(account);
  return account;
}

export function logoutAccount(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(USER_ACCOUNT_KEY);
}

export function setPlan(plan: PlanId): void {
  const account = getAccount();
  if (!account) return;
  account.plan = plan;
  saveAccount(account);
}

/* -------------------------- Aggregation --------------------------- */

export function getAllSessions(): SessionReport[] {
  const account = getAccount();
  const accountSessions = account ? account.sessions : [];
  const guestSessions = getGuestSessions();
  const map = new Map<string, SessionReport>();
  for (const session of [...accountSessions, ...guestSessions]) {
    if (!map.has(session.id)) map.set(session.id, session);
  }
  return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function saveSession(session: SessionReport): void {
  if (!isBrowser()) return;
  const account = getAccount();
  if (account) {
    account.sessions = [session, ...account.sessions];
    saveAccount(account);
  } else {
    saveGuestSession(session);
  }
  window.dispatchEvent(new CustomEvent("pethron:sessions-changed"));
}

export function deleteSession(id: string): void {
  if (!isBrowser()) return;
  const account = getAccount();
  if (account) {
    account.sessions = account.sessions.filter((s) => s.id !== id);
    saveAccount(account);
  }
  const guests = getGuestSessions().filter((s) => s.id !== id);
  window.localStorage.setItem(GUEST_SESSIONS_KEY, JSON.stringify(guests));
  window.dispatchEvent(new CustomEvent("pethron:sessions-changed"));
}

/** Merge guest sessions into the logged-in account. Idempotent. */
export function migrateGuestSessions(): number {
  if (!isBrowser()) return 0;
  const account = getAccount();
  if (!account) return 0;
  const guests = getGuestSessions();
  if (guests.length === 0) {
    if (!account.guestMigrated) {
      account.guestMigrated = true;
      saveAccount(account);
    }
    return 0;
  }
  const known = new Set(account.sessions.map((s) => s.id));
  const migrated = guests
    .filter((s) => !known.has(s.id))
    .map((s) => ({ ...s, mode: "account" as const, ownerId: account.id }));
  account.sessions = [...migrated, ...account.sessions].sort((a, b) => b.createdAt - a.createdAt);
  account.guestMigrated = true;
  saveAccount(account);
  window.localStorage.removeItem(GUEST_SESSIONS_KEY);
  window.dispatchEvent(new CustomEvent("pethron:sessions-changed"));
  return migrated.length;
}

/* ---------------------------- Limits ------------------------------ */

export function sessionsThisMonth(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return getAllSessions().filter((s) => s.createdAt >= start).length;
}

export function monthlyLimit(plan: PlanId): number {
  return plan === "free" ? 2 : Number.POSITIVE_INFINITY;
}

export function canStartSession(): { allowed: boolean; plan: PlanId; used: number; limit: number } {
  const account = getAccount();
  const plan: PlanId = account?.plan ?? "free";
  const used = sessionsThisMonth();
  const limit = monthlyLimit(plan);
  return { allowed: used < limit, plan, used, limit };
}

/* --------------------------- Auth state --------------------------- */

export function isLoggedIn(): boolean {
  return getAccount() !== null;
}
