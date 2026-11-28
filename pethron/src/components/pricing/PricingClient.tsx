"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CreditCard,
  HelpCircle,
  Lock,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import CheckoutModal from "./CheckoutModal";
import { useAuth } from "@/components/AuthProvider";
import { PLANS, type Plan } from "@/lib/plans";

const FAQ = [
  {
    q: "Guest mode itu apa?",
    a: "Kamu bisa langsung latihan tanpa daftar. Semua sesi kesimpan di browser kamu. Pas mau simpan permanen atau upgrade, baru diminta bikin akun — dan semua sesi guest otomatis ikut pindah.",
  },
  {
    q: "Pembayarannya gimana?",
    a: "Pakai QRIS dinamis dari Sumopod. Nominalnya otomatis sesuai paket, tinggal scan pakai e-wallet atau m-banking. Setelah status pembayaran PAID, paket langsung aktif.",
  },
  {
    q: "Bisa berhenti kapan aja?",
    a: "Bisa. Ini langganan bulanan, nggak ada kontrak. Kalau nggak diperpanjang, akun balik ke Free dan riwayat latihan tetap aman.",
  },
  {
    q: "Beda Pro Solo sama Team Pack?",
    a: "Pro Solo buat kamu sendiri: unlimited sesi sampai 15 menit plus semua persona juri. Team Pack nambah kapasitas 1 tim sampai 5 orang, shared history, dan Golden Answer library bareng.",
  },
];

export default function PricingClient() {
  const { account, isLoggedIn, openAuth } = useAuth();
  const [checkout, setCheckout] = useState<Plan | null>(null);
  const currentPlan = account?.plan ?? "free";

  const handleUpgrade = (plan: Plan) => {
    if (!isLoggedIn) {
      openAuth("register", () => setCheckout(plan));
      return;
    }
    setCheckout(plan);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <CreditCard className="h-3.5 w-3.5 text-forest" /> Bayar pakai QRIS, aktif otomatis
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
          Investasi kecil buat momen <span className="text-forest">presentasi terbaikmu</span>.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          Mulai gratis dulu. Kalau udah kerasa manfaatnya, upgrade buat sesi lebih panjang,
          semua persona juri, dan Golden Answer tiap jawaban.
        </p>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan, index) => {
          const active = currentPlan === plan.id;
          const dark = Boolean(plan.highlight);
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 24, delay: index * 0.07 }}
              className={`relative flex flex-col rounded-3xl border p-6 ${
                dark
                  ? "border-forest bg-forest text-white shadow-[0_20px_60px_rgba(27,67,50,0.25)]"
                  : "border-line bg-surface"
              }`}
            >
              {dark ? (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Sparkles className="h-3 w-3" /> Paling sering dipilih
                </span>
              ) : null}

              <div className="flex items-start justify-between">
                <div>
                  <h2 className={`font-display text-xl font-bold ${dark ? "text-white" : "text-ink"}`}>
                    {plan.name}
                  </h2>
                  <p className={`mt-1 text-xs leading-relaxed ${dark ? "text-white/70" : "text-muted"}`}>
                    {plan.tagline}
                  </p>
                </div>
                {active ? (
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      dark ? "bg-white/15 text-white" : "bg-forest-soft text-forest"
                    }`}
                  >
                    <BadgeCheck className="h-3 w-3" /> Aktif
                  </span>
                ) : null}
              </div>

              <div className="mt-5 flex items-end gap-1">
                <span className={`font-mono text-3xl font-bold ${dark ? "text-white" : "text-ink"}`}>
                  {plan.priceLabel}
                </span>
                <span className={`pb-1 text-xs ${dark ? "text-white/60" : "text-muted"}`}>{plan.period}</span>
              </div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs leading-relaxed">
                    <Check
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${dark ? "text-gold" : "text-forest"}`}
                    />
                    <span className={dark ? "text-white/85" : "text-muted"}>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.id === "free" ? (
                <Link
                  href="/studio"
                  className={`mt-6 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    dark
                      ? "bg-white text-forest hover:bg-white/90"
                      : "border border-line bg-ivory text-ink hover:border-forest/30 hover:text-forest"
                  }`}
                >
                  {plan.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => handleUpgrade(plan)}
                  className={`mt-6 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    dark
                      ? "bg-gold text-white hover:bg-gold/90"
                      : "bg-forest text-white hover:bg-forest-hover"
                  }`}
                >
                  {active ? "Perpanjang paket" : plan.cta} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {!isLoggedIn ? (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-gold/25 bg-gold-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-ink/80">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            Belum punya akun? Nggak masalah — klik upgrade, bikin akun sebentar, sesi guest kamu
            otomatis kebawa ke akun baru.
          </p>
          <button
            type="button"
            onClick={() => openAuth("register")}
            className="shrink-0 rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white transition hover:bg-forest-hover"
          >
            Bikin akun dulu
          </button>
        </div>
      ) : null}

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Zap, title: "Aktif langsung", body: "Status PAID dari Sumopod langsung naikin tier akun kamu." },
          { icon: Users, title: "Ramah tim", body: "Team Pack muat sampai 5 orang buat latihan bareng." },
          { icon: BadgeCheck, title: "Tanpa kontrak", body: "Langganan bulanan, berhenti kapan aja tanpa drama." },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
            <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
            <div>
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
          <HelpCircle className="h-5 w-5 text-gold" /> Masih mikir? Ini jawabannya.
        </h2>
        <div className="mt-4 space-y-2">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-line bg-surface px-4 py-3 transition hover:border-forest/20"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink">
                {item.q}
                <span className="font-mono text-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-2 rounded-3xl border border-line bg-ivory px-5 py-6 text-center">
        <p className="text-sm font-semibold text-ink">Belum yakin? Pakai Free plan dulu.</p>
        <p className="max-w-md text-xs leading-relaxed text-muted">
          2 sesi gratis tiap bulan, tanpa kartu kredit, tanpa daftar. Kalau cocok, baru upgrade.
        </p>
        <Link
          href="/studio"
          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-hover"
        >
          Coba gratis sekarang <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <AnimatePresence>
        {checkout ? <CheckoutModal plan={checkout} onClose={() => setCheckout(null)} /> : null}
      </AnimatePresence>
    </div>
  );
}
