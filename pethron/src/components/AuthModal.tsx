"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Sparkles, X, Zap } from "lucide-react";
import {
  demoAccount,
  getGuestSessions,
  loginAccount,
  migrateGuestSessions,
  registerAccount,
} from "@/lib/store";

interface AuthModalProps {
  mode: "login" | "register";
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ mode, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">(mode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [guestCount, setGuestCount] = useState(0);

  useEffect(() => {
    setGuestCount(getGuestSessions().length);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const finish = () => {
    const migrated = migrateGuestSessions();
    if (migrated > 0) {
      window.dispatchEvent(new CustomEvent("pethron:migrated", { detail: migrated }));
    }
    setBusy(false);
    onSuccess();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi dulu ya.");
      return;
    }
    if (tab === "register" && !name.trim()) {
      setError("Nama kamu belum diisi.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter biar aman.");
      return;
    }
    setBusy(true);
    window.setTimeout(() => {
      if (tab === "register") {
        registerAccount({ name, email, password });
        finish();
        return;
      }
      const result = loginAccount({ email, password });
      if (!result.ok) {
        setBusy(false);
        setError(result.error ?? "Gagal masuk.");
        return;
      }
      finish();
    }, 380);
  };

  const handleDemo = () => {
    setBusy(true);
    window.setTimeout(() => {
      demoAccount();
      finish();
    }, 280);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <motion.button
        type="button"
        aria-label="Tutup modal"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_24px_80px_rgba(24,24,27,0.18)]"
      >
        <div className="flex items-start justify-between border-b border-line px-6 pb-5 pt-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-forest-soft px-3 py-1 text-xs font-semibold text-forest">
              <Sparkles className="h-3.5 w-3.5" /> Simpan progres kamu
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">
              {tab === "login" ? "Masuk dulu, yuk" : "Bikin akun gratis"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {guestCount > 0
                ? `${guestCount} sesi guest kamu bakal otomatis ikut pindah ke akun ini.`
                : "Semua latihan kamu tersimpan rapi di browser ini."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted transition hover:bg-ivory hover:text-ink"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-5">
          <div className="mb-5 grid grid-cols-2 rounded-xl bg-ivory p-1">
            {(["login", "register"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setTab(item);
                  setError(null);
                }}
                className="relative rounded-lg px-3 py-2 text-sm font-semibold transition"
              >
                {tab === item ? (
                  <motion.span
                    layoutId="auth-tab"
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    className="absolute inset-0 rounded-lg bg-surface shadow-sm"
                  />
                ) : null}
                <span className={tab === item ? "relative text-ink" : "relative text-muted"}>
                  {item === "login" ? "Masuk" : "Daftar"}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <AnimatePresence initial={false}>
              {tab === "register" ? (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                    Nama
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama kamu / nama tim"
                    className="w-full rounded-xl border border-line bg-ivory px-4 py-2.5 text-sm text-ink outline-none transition focus:border-forest focus:bg-surface"
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kamu@kampus.ac.id"
                autoComplete="email"
                className="w-full rounded-xl border border-line bg-ivory px-4 py-2.5 text-sm text-ink outline-none transition focus:border-forest focus:bg-surface"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                className="w-full rounded-xl border border-line bg-ivory px-4 py-2.5 text-sm text-ink outline-none transition focus:border-forest focus:bg-surface"
              />
            </div>

            {error ? (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-medium text-danger">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white transition hover:bg-forest-hover disabled:opacity-60"
            >
              {busy ? "Sebentar ya..." : tab === "login" ? "Masuk & Lanjut" : "Daftar & Simpan"}
              {!busy ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-muted">atau</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            onClick={handleDemo}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold-soft px-4 py-3 text-sm font-semibold text-gold transition hover:border-gold/60 disabled:opacity-60"
          >
            <Zap className="h-4 w-4" /> Coba 1-Click Demo Account
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
            Ini demo lokal: akun & sesi disimpan di browser kamu. Nggak ada data yang dikirim ke server Pethron.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
