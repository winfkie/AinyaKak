"use client";

import { useMemo } from "react";
import { ShieldCheck, TrendingUp, Lock, Truck, Landmark, Receipt } from "lucide-react";
import { useSilih } from "@/context/SilihContext";
import { SectionTitle, StatCard, STATUS_META } from "@/components/shared";
import { rupiah, shortDate } from "@/lib/format";

export default function AdminLedgerView() {
  const { orders, courierTasks, items } = useSilih();

  const stats = useMemo(() => {
    const gmv = orders.reduce((s, o) => s + o.grandTotal, 0);
    const paid = orders.filter((o) => o.status !== "PENDING_PAYMENT");
    const platformRevenue = paid.reduce((s, o) => s + o.escrowSplit.platformRevenue, 0);
    const escrowHeld = orders
      .filter((o) => !o.escrowSplit.ownerReleased)
      .reduce((s, o) => s + o.escrowSplit.ownerAmount, 0);
    const courierReleased = orders.reduce(
      (s, o) =>
        s +
        (o.escrowSplit.deliveryCourierReleased ? o.escrowSplit.deliveryCourierAmount : 0) +
        (o.escrowSplit.returnCourierReleased ? o.escrowSplit.returnCourierAmount : 0),
      0
    );
    const courierPending = courierTasks
      .filter((t) => t.status !== "COMPLETED")
      .reduce((s, t) => s + t.fee, 0);
    return { gmv, paidCount: paid.length, platformRevenue, escrowHeld, courierReleased, courierPending };
  }, [orders, courierTasks]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#0F172A]">
          <ShieldCheck size={18} /> Admin Ledger — Kas Platform
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Pembukuan komisi platform {rupiah(5000)}/transaksi &amp; log auto-split escrow.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total GMV"
          value={rupiah(stats.gmv)}
          hint={`${orders.length} transaksi tercatat`}
        />
        <StatCard
          label="Pendapatan Bersih Platform"
          value={rupiah(stats.platformRevenue)}
          hint={`${stats.paidCount} transaksi lunas × ${rupiah(5000)}`}
          tone="accent"
        />
        <StatCard
          label="Dana Escrow Pemilik"
          value={rupiah(stats.escrowHeld)}
          hint="Masih ditahan sampai pengembalian selesai"
          tone="warn"
        />
        <StatCard
          label="Dana Kurir"
          value={rupiah(stats.courierReleased)}
          hint={`${rupiah(stats.courierPending)} menunggu tugas selesai`}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <SectionTitle
            icon={<Receipt size={16} />}
            title="Riwayat Transaksi & Auto-Split"
            subtitle="Setiap rupiah dipetakan ke pemilik, kurir antar, kurir jemput, dan platform."
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Order / Busana</th>
                <th className="px-4 py-2.5 font-semibold">Pihak</th>
                <th className="px-4 py-2.5 font-semibold text-right">Total</th>
                <th className="px-4 py-2.5 font-semibold">Auto-Split Escrow</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    Belum ada transaksi. Buat pesanan dari Portal Penyewa untuk melihat ledger.
                  </td>
                </tr>
              )}
              {orders.map((o) => {
                const meta = STATUS_META[o.status];
                const item = items.find((i) => i.id === o.itemId);
                return (
                  <tr key={o.id} className="align-top hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#0F172A]">{o.itemTitle}</p>
                      <p className="text-[10px] text-slate-400">
                        {o.id} • {shortDate(o.startDate)} → {shortDate(o.endDate)}
                      </p>
                      {item && <p className="text-[10px] text-slate-400">{item.category}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>
                        <span className="font-semibold text-[#0F172A]">{o.renterName}</span> →{" "}
                        {o.ownerName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {o.durationDays} hari • {o.renterSubArea}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-bold text-[#059669]">{rupiah(o.grandTotal)}</p>
                      <p className="text-[10px] text-slate-400">
                        sewa {rupiah(o.rentalTotal)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <Split
                          label="Pemilik"
                          amount={o.escrowSplit.ownerAmount}
                          released={o.escrowSplit.ownerReleased}
                          tone="slate"
                        />
                        <Split
                          label="Kurir Antar"
                          amount={o.escrowSplit.deliveryCourierAmount}
                          released={o.escrowSplit.deliveryCourierReleased}
                          tone="emerald"
                        />
                        <Split
                          label="Kurir Jemput"
                          amount={o.escrowSplit.returnCourierAmount}
                          released={o.escrowSplit.returnCourierReleased}
                          tone="amber"
                        />
                        <Split
                          label="Platform"
                          amount={o.escrowSplit.platformRevenue}
                          released
                          tone="slate"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${meta.tone}`}>{meta.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-[#0F172A]">
            <Landmark size={16} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Komisi tetap</p>
            <p className="text-sm font-bold text-[#0F172A]">{rupiah(5000)} / transaksi</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-[#D97706]">
            <Lock size={16} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Escrow tertahan</p>
            <p className="text-sm font-bold text-[#D97706]">{rupiah(stats.escrowHeld)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#059669]">
            <Truck size={16} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Cair ke kurir</p>
            <p className="text-sm font-bold text-[#059669]">{rupiah(stats.courierReleased)}</p>
          </div>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <TrendingUp size={13} /> Ledger dihitung otomatis dari state pesanan &amp; tiket kurir yang
        tersimpan di perangkat ini.
      </p>
    </div>
  );
}

function Split({
  label,
  amount,
  released,
  tone
}: {
  label: string;
  amount: number;
  released: boolean;
  tone: "slate" | "emerald" | "amber";
}) {
  const tones = {
    slate: "bg-slate-50 text-slate-600",
    emerald: "bg-emerald-50 text-[#059669]",
    amber: "bg-amber-50 text-[#D97706]"
  };
  return (
    <span className={`flex items-center justify-between gap-1 rounded px-1.5 py-1 ${tones[tone]}`}>
      <span className="truncate">{label}</span>
      <span className="shrink-0 font-semibold">{rupiah(amount)}</span>
      <span className="shrink-0">{released ? "✓" : "⏳"}</span>
    </span>
  );
}
