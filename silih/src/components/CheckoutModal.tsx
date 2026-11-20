"use client";

import { useMemo, useState } from "react";
import { X, CalendarDays, Truck, MapPin, Wallet, ShieldCheck } from "lucide-react";
import { useSilih } from "@/context/SilihContext";
import { calculateSingleLegShipping, PLATFORM_FEE, getSubAreas } from "@/lib/pricing";
import { rupiah, addDays, todayISO } from "@/lib/format";
import { TIME_SLOTS } from "@/data/seedData";
import MidtransModal from "@/components/MidtransModal";
import type { ClothingItem, ZoneId } from "@/types/silih";

interface Props {
  item: ClothingItem;
  lockedDays?: number;
  lockedPrice?: number;
  onClose: () => void;
  onPaid?: () => void;
}

export default function CheckoutModal({ item, lockedDays, lockedPrice, onClose, onPaid }: Props) {
  const { currentProfile, createOrder, payOrder } = useSilih();

  const [renterZone, setRenterZone] = useState<ZoneId>(currentProfile.zone);
  const [subArea, setSubArea] = useState<string>(
    getSubAreas(currentProfile.zone).includes(currentProfile.subArea)
      ? currentProfile.subArea
      : getSubAreas(currentProfile.zone)[0]
  );
  const [address, setAddress] = useState(currentProfile.addressDetail);
  const [startDate, setStartDate] = useState(todayISO());
  const [durationDays, setDurationDays] = useState<number>(
    lockedDays ?? Math.min(2, item.maxDays)
  );
  const [deliveryType, setDeliveryType] = useState<"INSTANT" | "SCHEDULED">("INSTANT");
  const [deliveryDate, setDeliveryDate] = useState(todayISO());
  const [deliverySlot, setDeliverySlot] = useState(TIME_SLOTS[0]);
  const [deliveryNotes, setDeliveryNotes] = useState("Titik temu depan gerbang kos");
  const [returnSlot, setReturnSlot] = useState(TIME_SLOTS[2]);
  const [returnNotes, setReturnNotes] = useState("Titip ke pos satpam bila tidak ada orang");
  const [submitting, setSubmitting] = useState(false);

  const [sim, setSim] = useState<{ orderId: string; amount: number } | null>(null);

  const endDate = useMemo(
    () => addDays(startDate, Math.max(0, durationDays - 1)),
    [startDate, durationDays]
  );

  const rentalTotal = lockedPrice ?? item.pricePerDay * durationDays;
  const singleLeg = calculateSingleLegShipping(item.zone, renterZone);
  const totalShipping = singleLeg * 2;
  const grand = rentalTotal + totalShipping + PLATFORM_FEE;

  const subAreaOptions = getSubAreas(renterZone);

  function finalize(orderId: string) {
    payOrder(orderId);
    setSim(null);
    onPaid?.();
    onClose();
  }

  async function handlePay() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const order = createOrder({
        itemId: item.id,
        durationDays,
        rentalTotal,
        startDate,
        endDate,
        renterName: currentProfile.name,
        renterZone,
        renterSubArea: subArea,
        renterAddressDetail: address,
        deliverySchedule: {
          type: deliveryType,
          date: deliveryType === "INSTANT" ? todayISO() : deliveryDate,
          timeSlot: deliveryType === "INSTANT" ? "Secepatnya" : deliverySlot,
          notes: deliveryNotes
        },
        returnSchedule: {
          date: endDate,
          timeSlot: returnSlot,
          notes: returnNotes
        }
      });

      const res = await fetch("/api/midtrans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          grossAmount: order.grandTotal,
          customerName: currentProfile.name,
          itemTitle: order.itemTitle
        })
      });
      const data = (await res.json()) as { token?: string; mode?: string };

      if (data.token && typeof window !== "undefined" && window.snap) {
        window.snap.pay(data.token, {
          onSuccess: () => finalize(order.id),
          onPending: () => finalize(order.id),
          onError: () => setSubmitting(false),
          onClose: () => setSubmitting(false)
        });
      } else {
        setSim({ orderId: order.id, amount: order.grandTotal });
        setSubmitting(false);
      }
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
        <div className="my-6 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-12 w-12 rounded-lg object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Checkout Sewa</h3>
                <p className="text-[11px] text-slate-500">{item.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-5 p-4">
            {/* Lokasi penyewa */}
            <section>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                <MapPin size={14} /> Lokasi Penyewa
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Zona</label>
                  <select
                    className="input"
                    value={renterZone}
                    onChange={(e) => {
                      const z = e.target.value as ZoneId;
                      setRenterZone(z);
                      setSubArea(getSubAreas(z)[0]);
                    }}
                  >
                    <option value="ZONA_1">Zona 1 — Tembalang Inti</option>
                    <option value="ZONA_2">Zona 2 — Tembalang Sekitar</option>
                    <option value="ZONA_3">Zona 3 — Banyumanik</option>
                  </select>
                </div>
                <div>
                  <label className="label">Sub-Area</label>
                  <select className="input" value={subArea} onChange={(e) => setSubArea(e.target.value)}>
                    {subAreaOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-2">
                <label className="label">Detail Alamat / Nama Kos</label>
                <input
                  className="input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Kos Putri Melati, kamar 12"
                />
              </div>
            </section>

            {/* Jadwal sewa */}
            <section>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                <CalendarDays size={14} /> Jadwal Sewa
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Tanggal Mulai</label>
                  <input
                    type="date"
                    className="input"
                    value={startDate}
                    min={todayISO()}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Durasi (Hari)</label>
                  <input
                    type="number"
                    min={1}
                    max={item.maxDays}
                    className="input"
                    value={durationDays}
                    onChange={(e) =>
                      setDurationDays(
                        Math.max(1, Math.min(item.maxDays, Number(e.target.value) || 1))
                      )
                    }
                  />
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Tanggal selesai otomatis: <span className="font-semibold text-[#0F172A]">{endDate}</span>
              </p>
            </section>

            {/* Delivery */}
            <section>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Truck size={14} /> Jadwal Antar Awal (Delivery)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeliveryType("INSTANT")}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${
                    deliveryType === "INSTANT"
                      ? "border-[#059669] bg-emerald-50 text-[#059669]"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  Instan / Secepatnya
                </button>
                <button
                  onClick={() => setDeliveryType("SCHEDULED")}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${
                    deliveryType === "SCHEDULED"
                      ? "border-[#0F172A] bg-slate-100 text-[#0F172A]"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  Jadwalkan Jam
                </button>
              </div>
              {deliveryType === "SCHEDULED" && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Tanggal Antar</label>
                    <input
                      type="date"
                      className="input"
                      value={deliveryDate}
                      min={todayISO()}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Slot Jam (WIB)</label>
                    <select
                      className="input"
                      value={deliverySlot}
                      onChange={(e) => setDeliverySlot(e.target.value)}
                    >
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t} WIB
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <div className="mt-2">
                <label className="label">Catatan Titik Temu</label>
                <input
                  className="input"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                />
              </div>
            </section>

            {/* Return */}
            <section>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Truck size={14} /> Jadwal Jemput Balik (Return Pickup)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Tanggal Jemput (auto)</label>
                  <input type="date" className="input bg-slate-50" value={endDate} readOnly />
                </div>
                <div>
                  <label className="label">Slot Jam Jemput</label>
                  <select
                    className="input"
                    value={returnSlot}
                    onChange={(e) => setReturnSlot(e.target.value)}
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t} WIB
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-2">
                <label className="label">Catatan Titik Jemput</label>
                <input
                  className="input"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                />
              </div>
            </section>

            {/* Cost breakdown */}
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Wallet size={14} /> Rincian Biaya Auto-Split Escrow
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Harga Sewa ({durationDays} hari{lockedPrice ? " • harga deal" : ""})
                  </span>
                  <span className="font-semibold text-[#0F172A]">{rupiah(rentalTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ongkir Antar Awal (Tugas 1)</span>
                  <span className="font-semibold text-[#0F172A]">{rupiah(singleLeg)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ongkir Jemput Kembali (Tugas 2)</span>
                  <span className="font-semibold text-[#0F172A]">{rupiah(singleLeg)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Biaya Layanan Platform</span>
                  <span className="font-semibold text-[#0F172A]">{rupiah(PLATFORM_FEE)}</span>
                </div>
                <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 text-sm">
                  <span className="font-bold text-[#0F172A]">Total Bayar</span>
                  <span className="font-bold text-[#059669]">{rupiah(grand)}</span>
                </div>
              </div>
              <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                <ShieldCheck size={12} /> Dana ditahan escrow &amp; dilepas otomatis setelah kurir
                menyelesaikan pengembalian.
              </p>
            </section>

            <button onClick={handlePay} disabled={submitting} className="btn-primary w-full">
              {submitting ? "Memproses…" : "Bayar Sekarang (Midtrans Snap)"}
            </button>
          </div>
        </div>
      </div>

      {sim && (
        <MidtransModal
          amount={sim.amount}
          orderId={sim.orderId}
          itemTitle={item.title}
          onConfirm={() => finalize(sim.orderId)}
          onClose={() => setSim(null)}
        />
      )}
    </>
  );
}
