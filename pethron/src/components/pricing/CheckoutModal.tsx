"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { setPlan } from "@/lib/store";
import type { Plan } from "@/lib/plans";

interface CheckoutModalProps {
  plan: Plan;
  onClose: () => void;
}

type Step = "form" | "creating" | "qr" | "paid";

interface QrisResponse {
  ok: boolean;
  configMissing?: boolean;
  orderId?: string;
  amount?: number;
  qrString?: string | null;
  qrImageUrl?: string | null;
  payload?: Record<string, unknown>;
  message?: string;
  error?: string;
  status?: string;
}

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function CheckoutModal({ plan, onClose }: CheckoutModalProps) {
  const { account, refresh } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState(account?.name ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<QrisResponse | null>(null);
  const [status, setStatus] = useState<string>("PENDING");
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const paidRef = useRef(false);

  const createdAt = useMemo(() => Date.now(), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (step !== "qr") return;
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - createdAt) / 1000);
      setSecondsLeft(Math.max(0, 15 * 60 - elapsed));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, createdAt]);

  const markPaid = useCallback(() => {
    if (paidRef.current) return;
    paidRef.current = true;
    setPlan(plan.id);
    refresh();
    window.dispatchEvent(new CustomEvent("pethron:sessions-changed"));
    setStatus("PAID");
    setStep("paid");
  }, [plan.id, refresh]);

  const checkStatus = useCallback(
    async (orderId: string) => {
      setChecking(true);
      try {
        const response = await fetch(`/api/sumopod/check-status?orderId=${encodeURIComponent(orderId)}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as { ok: boolean; status?: string };
        if (data.ok && data.status) {
          setStatus(data.status);
          if (data.status === "PAID") markPaid();
        }
      } catch {
        // Transient network errors are fine; polling retries.
      } finally {
        setChecking(false);
      }
    },
    [markPaid],
  );

  useEffect(() => {
    if (step !== "qr" || !order?.orderId || order.configMissing) return;
    const interval = window.setInterval(() => {
      if (!paidRef.current) void checkStatus(order.orderId as string);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [step, order, checkStatus]);

  const createOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError("Nama dan email wajib diisi buat nerbitin QRIS.");
      return;
    }
    setStep("creating");
    try {
      const response = await fetch("/api/sumopod/create-qris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          customerName: name.trim(),
          customerEmail: email.trim(),
        }),
      });
      const data = (await response.json()) as QrisResponse;
      if (!data.ok) {
        setError(data.error || "Gagal bikin QRIS. Coba lagi ya.");
        setStep("form");
        return;
      }
      setOrder(data);
      setStep("qr");
    } catch {
      setError("Nggak bisa nyambung ke server. Cek koneksi lalu coba lagi.");
      setStep("form");
    }
  };

  const copyOrderId = async () => {
    if (!order?.orderId) return;
    try {
      await navigator.clipboard.writeText(order.orderId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <motion.button
        type="button"
        aria-label="Tutup checkout"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/45 backdrop-blur-[2px]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 14 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative z-10 my-6 w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_24px_80px_rgba(24,24,27,0.2)]"
      >
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Checkout QRIS</p>
            <h2 className="mt-0.5 font-display text-xl font-bold text-ink">{plan.name}</h2>
            <p className="font-mono text-sm text-forest">
              {rupiah.format(plan.price)} <span className="text-xs text-muted">/bulan</span>
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

        <div className="max-h-[76vh] overflow-y-auto px-5 py-5">
          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={createOrder}
                className="space-y-3"
              >
                <p className="text-sm leading-relaxed text-muted">
                  QRIS dinamis bakal dibuat sesuai nominal. Bayar pakai e-wallet atau m-banking
                  apa aja yang support QRIS.
                </p>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                    Nama
                  </label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-xl border border-line bg-ivory px-3.5 py-2.5 text-sm text-ink outline-none focus:border-forest focus:bg-surface"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-line bg-ivory px-3.5 py-2.5 text-sm text-ink outline-none focus:border-forest focus:bg-surface"
                  />
                </div>

                {error ? (
                  <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-medium text-danger">{error}</p>
                ) : null}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white transition hover:bg-forest-hover"
                >
                  Buat QRIS {rupiah.format(plan.price)}
                </button>
                <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
                  <ShieldCheck className="h-3.5 w-3.5 text-forest" /> Diproses lewat Sumopod ·
                  pembayaran diverifikasi otomatis
                </p>
              </motion.form>
            ) : null}

            {step === "creating" ? (
              <motion.div
                key="creating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 text-center"
              >
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-forest" />
                <p className="mt-3 text-sm font-medium text-ink">Minta QRIS ke Sumopod...</p>
                <p className="mt-1 text-xs text-muted">Bentar, jangan tutup halaman ini.</p>
              </motion.div>
            ) : null}

            {step === "qr" && order ? (
              <motion.div
                key="qr"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {order.configMissing ? (
                  <div className="rounded-xl border border-gold/30 bg-gold-soft p-3.5">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gold">
                      <AlertTriangle className="h-4 w-4" /> Sumopod belum dikonfigurasi
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink/80">
                      Isi <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[11px]">SUMOPOD_API_KEY</code>{" "}
                      (plus <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[11px]">SUMOPOD_MERCHANT_ID</code>)
                      di <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[11px]">.env.local</code>,
                      lalu restart <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[11px]">npm run dev</code>.
                      Struktur request yang bakal dikirim ada di bawah.
                    </p>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-line bg-ivory p-4 text-center">
                  {order.qrImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={order.qrImageUrl}
                      alt="QRIS pembayaran"
                      className="mx-auto h-52 w-52 rounded-xl bg-white object-contain p-2"
                    />
                  ) : order.qrString ? (
                    <div className="mx-auto w-fit rounded-xl bg-white p-3">
                      <QRCodeSVG value={order.qrString} size={196} level="M" bgColor="#FFFFFF" fgColor="#18181B" />
                    </div>
                  ) : (
                    <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-xl border border-dashed border-line bg-surface text-center text-xs text-muted">
                      QR belum tersedia.
                      <br />
                      Cek payload di bawah.
                    </div>
                  )}

                  <p className="mt-3 font-mono text-2xl font-bold text-ink">
                    {rupiah.format(order.amount ?? plan.price)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Scan pakai GoPay, OVO, DANA, ShopeePay, atau m-banking.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-muted">Order ID</p>
                    <p className="truncate font-mono text-xs text-ink">{order.orderId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyOrderId}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-ivory px-2.5 py-1 text-[11px] font-semibold text-muted transition hover:text-ink"
                  >
                    <Copy className="h-3 w-3" /> {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                    </span>
                    Nunggu pembayaran · {Math.floor(secondsLeft / 60)}:
                    {String(secondsLeft % 60).padStart(2, "0")}
                  </p>
                  <button
                    type="button"
                    onClick={() => order.orderId && checkStatus(order.orderId)}
                    disabled={checking || order.configMissing}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold text-muted transition hover:text-forest disabled:opacity-40"
                  >
                    <RefreshCw className={`h-3 w-3 ${checking ? "animate-spin" : ""}`} /> Cek status
                  </button>
                </div>

                {status !== "PENDING" && status !== "CONFIG_MISSING" ? (
                  <p className="rounded-lg bg-ivory px-3 py-2 text-center font-mono text-[11px] text-muted">
                    Status: {status}
                  </p>
                ) : null}

                {order.payload ? (
                  <details className="rounded-xl border border-line bg-ivory px-3 py-2">
                    <summary className="cursor-pointer text-[11px] font-semibold text-muted">
                      Lihat payload request QRIS
                    </summary>
                    <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-ink p-2.5 font-mono text-[10px] leading-relaxed text-white/90">
                      {JSON.stringify(order.payload, null, 2)}
                    </pre>
                  </details>
                ) : null}

                {order.configMissing ? (
                  <p className="rounded-lg bg-gold-soft px-3 py-2 text-[11px] leading-relaxed text-gold">
                    {order.message}
                  </p>
                ) : null}
              </motion.div>
            ) : null}

            {step === "paid" ? (
              <motion.div
                key="paid"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-soft text-forest">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-ink">Pembayaran masuk!</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  Akun kamu sekarang di <span className="font-semibold text-forest">{plan.name}</span>.
                  Sesi unlimited sampai 15 menit udah kebuka.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-hover"
                >
                  Gas latihan sekarang
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
