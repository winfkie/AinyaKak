"use client";

import { useMemo, useState } from "react";
import { X, CreditCard, QrCode, Smartphone, Landmark, CheckCircle2 } from "lucide-react";
import { rupiah } from "@/lib/format";

interface Props {
  amount: number;
  orderId: string;
  itemTitle: string;
  onConfirm: () => void;
  onClose: () => void;
}

type Method = "QRIS" | "VA BCA" | "GoPay";

function pseudoQr(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const cells: boolean[] = [];
  for (let i = 0; i < 441; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    cells.push((h & 1) === 1);
  }
  return cells;
}

export default function MidtransModal({ amount, orderId, itemTitle, onConfirm, onClose }: Props) {
  const [method, setMethod] = useState<Method>("QRIS");
  const [paid, setPaid] = useState(false);
  const cells = useMemo(() => pseudoQr(orderId), [orderId]);

  const vaNumber = useMemo(() => {
    let h = 0;
    for (let i = 0; i < orderId.length; i++) h = (h * 31 + orderId.charCodeAt(i)) % 999999999;
    return String(8800000000 + h).slice(0, 12);
  }, [orderId]);

  function confirm() {
    setPaid(true);
    setTimeout(() => onConfirm(), 900);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Midtrans Snap — Sandbox Simulator</h3>
            <p className="text-[11px] text-slate-500">Mode simulasi (tanpa kredensial server)</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Rincian Tagihan
            </p>
            <p className="mt-1 text-sm font-semibold text-[#0F172A]">{itemTitle}</p>
            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-xs text-slate-500">Order ID</span>
              <span className="font-mono text-[11px] text-slate-600">{orderId}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-slate-500">Total Bayar</span>
              <span className="text-base font-bold text-[#059669]">{rupiah(amount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: "QRIS" as Method, icon: <QrCode size={15} />, hint: "Scan QRIS" },
                { id: "VA BCA" as Method, icon: <Landmark size={15} />, hint: "Virtual Account" },
                { id: "GoPay" as Method, icon: <Smartphone size={15} />, hint: "E-Wallet" }
              ]
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`rounded-xl border px-2 py-2.5 text-center transition ${
                  method === m.id
                    ? "border-[#0F172A] bg-[#0F172A] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center justify-center gap-1 text-xs font-semibold">
                  {m.icon}
                  {m.id}
                </span>
                <span className="text-[10px] opacity-70">{m.hint}</span>
              </button>
            ))}
          </div>

          {method === "QRIS" && (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="grid grid-cols-[repeat(21,minmax(0,1fr))] gap-0 rounded-lg bg-white p-2">
                {cells.map((on, i) => (
                  <span
                    key={i}
                    className={`aspect-square ${on ? "bg-[#0F172A]" : "bg-transparent"}`}
                  />
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Kode QRIS virtual sandbox • <span className="font-mono">{vaNumber}</span>
              </p>
            </div>
          )}

          {method === "VA BCA" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Nomor Virtual Account</p>
              <p className="mt-1 font-mono text-xl font-bold text-[#0F172A]">{vaNumber}</p>
              <p className="text-[11px] text-slate-500">BCA VA • a.n. SILIH Tembalang</p>
            </div>
          )}

          {method === "GoPay" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <Smartphone size={30} className="mx-auto text-[#059669]" />
              <p className="mt-2 text-xs text-slate-600">
                Simulasi <span className="font-semibold">GoPay App</span> — saldo virtual
              </p>
              <p className="font-mono text-lg font-bold text-[#0F172A]">{rupiah(amount)}</p>
            </div>
          )}

          {paid ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-4 text-sm font-bold text-[#059669]">
              <CheckCircle2 size={18} /> Pembayaran Lunas. Memproses pesanan…
            </div>
          ) : (
            <button onClick={confirm} className="btn-accent w-full">
              <CreditCard size={16} /> Konfirmasi Pembayaran Lunas
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
